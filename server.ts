import express, { Request, Response, NextFunction } from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import ical from 'node-ical';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { randomBytes, randomUUID, timingSafeEqual } from 'crypto';
import { lookup as dnsLookup } from 'dns/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
app.set('trust proxy', 1);
const port = process.env.PORT || 3001;

// ── Microsoft To-Do config ────────────────────────────────────────────────────
const MS_CLIENT_ID = process.env.MICROSOFT_CLIENT_ID;
const MS_CLIENT_SECRET = process.env.MICROSOFT_CLIENT_SECRET;
const APP_URL = (process.env.APP_URL || `http://localhost:${process.env.PORT || 3001}`).replace(/\/$/, '');
const MS_REDIRECT_URI = `${APP_URL}/api/todo/callback`;

// ── Auth ──────────────────────────────────────────────────────────────────────
const ADMIN_PIN = process.env.ADMIN_PIN || '1234';
if (!process.env.ADMIN_PIN) {
  console.warn('⚠️  ADVARSEL: ADMIN_PIN er ikke satt – standard PIN "1234" brukes. Sett ADMIN_PIN i miljøvariablene!');
}
const sessions = new Map<string, Date>(); // token → expiry
const oauthStates = new Map<string, number>(); // state → expiry ms

interface LoginAttempt { count: number; lockedUntil: number; }
const loginAttempts = new Map<string, LoginAttempt>();

function getLockoutDuration(failCount: number): number {
  if (failCount >= 15) return 2 * 60 * 60 * 1000;
  if (failCount >= 10) return 30 * 60 * 1000;
  if (failCount >= 6)  return 5 * 60 * 1000;
  if (failCount >= 3)  return 60 * 1000;
  return 0;
}

function checkPin(input: string, expected: string): boolean {
  try {
    const a = Buffer.from(input.padEnd(expected.length, '\0'));
    const b = Buffer.from(expected.padEnd(input.length, '\0'));
    const same = a.length === b.length && timingSafeEqual(
      Buffer.from(input.padEnd(Math.max(input.length, expected.length), '\0')),
      Buffer.from(expected.padEnd(Math.max(input.length, expected.length), '\0')),
    );
    return same && input === expected;
  } catch { return false; }
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  const auth = req.headers.authorization;
  if (!auth?.startsWith('Bearer ')) return res.status(401).json({ error: 'Ikke autentisert' });
  const token = auth.slice(7);
  const expiry = sessions.get(token);
  if (!expiry || expiry < new Date()) {
    sessions.delete(token);
    return res.status(401).json({ error: 'Sesjonen er utløpt' });
  }
  next();
}

// Clean up expired sessions and stale lockouts every hour
setInterval(() => {
  const now = new Date();
  for (const [token, expiry] of sessions) {
    if (expiry < now) sessions.delete(token);
  }
  const nowMs = Date.now();
  for (const [ip, attempt] of loginAttempts) {
    if (attempt.lockedUntil < nowMs && attempt.count < 3) loginAttempts.delete(ip);
  }
}, 60 * 60 * 1000);

// ── SSRF protection ───────────────────────────────────────────────────────────
function isPrivateIp(ip: string): boolean {
  return [
    /^127\./, /^10\./, /^192\.168\./,
    /^172\.(1[6-9]|2\d|3[01])\./,
    /^169\.254\./, /^0\./, /^240\./,
    /^::1$/, /^fc/i, /^fd/i, /^fe80/i,
  ].some(r => r.test(ip));
}

async function validateSafeUrl(urlStr: string): Promise<void> {
  let parsed: URL;
  try { parsed = new URL(urlStr); } catch { throw new Error('Ugyldig URL'); }
  if (!['http:', 'https:'].includes(parsed.protocol)) {
    throw new Error('URL må starte med http:// eller https://');
  }
  let address: string;
  try {
    ({ address } = await dnsLookup(parsed.hostname));
  } catch {
    throw new Error(`Kunne ikke løse opp vertsnavn: ${parsed.hostname}`);
  }
  if (isPrivateIp(address)) {
    throw new Error('URL peker til en privat nettverksadresse');
  }
}

// ── Database ──────────────────────────────────────────────────────────────────
const dbPath = process.env.DB_PATH || path.join(__dirname, 'tasks.db');
const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS children (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      avatar_emoji TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      description TEXT DEFAULT '',
      target_count INTEGER NOT NULL DEFAULT 1,
      icon TEXT NOT NULL DEFAULT 'check-circle',
      is_active BOOLEAN DEFAULT 1,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS task_completions (
      id TEXT PRIMARY KEY,
      child_id TEXT NOT NULL,
      task_id TEXT NOT NULL,
      completion_count INTEGER NOT NULL DEFAULT 0,
      week_start_date TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (child_id) REFERENCES children(id) ON DELETE CASCADE,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE,
      UNIQUE(child_id, task_id, week_start_date)
    );

    CREATE TABLE IF NOT EXISTS calendar_settings (
      id TEXT PRIMARY KEY,
      ical_url TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS meals (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      recipe_url TEXT,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS meal_plan (
      id TEXT PRIMARY KEY,
      meal_id TEXT,
      planned_date TEXT NOT NULL UNIQUE,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS messages (
      id TEXT PRIMARY KEY,
      text TEXT NOT NULL,
      created_at TEXT DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_task_completions_child_id ON task_completions(child_id);
    CREATE INDEX IF NOT EXISTS idx_task_completions_task_id ON task_completions(task_id);
    CREATE INDEX IF NOT EXISTS idx_task_completions_week_start ON task_completions(week_start_date);
  `);
}

initDatabase();
try { db.exec('ALTER TABLE meals ADD COLUMN recipe_url TEXT'); } catch { /* already exists */ }

function generateId(): string {
  return randomUUID();
}

// ── App settings helpers ──────────────────────────────────────────────────────
function getSettingStr(key: string): string | null {
  const row = db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as { value: string } | undefined;
  if (!row) return null;
  try { return JSON.parse(row.value); } catch { return row.value; }
}

function setSetting(key: string, value: string | null) {
  if (value === null) {
    db.prepare('DELETE FROM app_settings WHERE key = ?').run(key);
  } else {
    db.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)').run(key, JSON.stringify(value));
  }
}

// ── Microsoft To-Do helpers ───────────────────────────────────────────────────
function clearMsTokens() {
  ['ms_access_token', 'ms_refresh_token', 'ms_token_expiry', 'ms_account_name', 'ms_list_id', 'ms_list_name']
    .forEach(k => setSetting(k, null));
}

async function getMsAccessToken(): Promise<string | null> {
  const access = getSettingStr('ms_access_token');
  const refresh = getSettingStr('ms_refresh_token');
  if (!access || !refresh || !MS_CLIENT_ID || !MS_CLIENT_SECRET) return null;
  const expiry = parseInt(getSettingStr('ms_token_expiry') || '0');
  if (Date.now() + 5 * 60 * 1000 < expiry) return access;
  try {
    const r = await fetch('https://login.microsoftonline.com/consumers/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: MS_CLIENT_ID, client_secret: MS_CLIENT_SECRET,
        grant_type: 'refresh_token', refresh_token: refresh,
        scope: 'Tasks.ReadWrite User.Read offline_access',
      }),
    });
    if (!r.ok) { clearMsTokens(); return null; }
    const d = await r.json() as any;
    setSetting('ms_access_token', d.access_token);
    if (d.refresh_token) setSetting('ms_refresh_token', d.refresh_token);
    setSetting('ms_token_expiry', String(Date.now() + d.expires_in * 1000));
    return d.access_token;
  } catch { return null; }
}

// ── Middleware ────────────────────────────────────────────────────────────────
// No CORS middleware — frontend is served from the same origin (Express serves both)

app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", 'data:', 'https:'],
      connectSrc: ["'self'"],
      fontSrc: ["'self'", 'data:'],
      objectSrc: ["'none'"],
      frameSrc: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

app.use(express.json({ limit: '16kb' }));

// Rate limiting
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
});
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'For mange forsøk – prøv igjen om 15 minutter' },
});

app.use('/api/', generalLimiter);
app.use('/api/auth/', authLimiter);

// ── App settings (public read, auth write) ────────────────────────────────────
app.get('/api/settings', (req, res) => {
  try {
    const get = (key: string) => db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as any;
    const pinRow = get('requirePinForHome');
    const featuresRow = get('appFeatures');
    res.json({
      requirePinForHome: pinRow ? JSON.parse(pinRow.value) : false,
      appFeatures: { tasks: true, calendar: true, meals: true, messages: true, ...(featuresRow ? JSON.parse(featuresRow.value) : {}) },
    });
  } catch { res.status(500).json({ error: 'Failed to fetch settings' }); }
});

app.put('/api/settings', requireAuth, (req, res) => {
  try {
    const { requirePinForHome, appFeatures } = req.body;
    const upsert = (key: string, value: unknown) =>
      db.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)').run(key, JSON.stringify(value));
    if (typeof requirePinForHome === 'boolean') upsert('requirePinForHome', requirePinForHome);
    if (appFeatures && typeof appFeatures === 'object') upsert('appFeatures', appFeatures);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Failed to save settings' }); }
});

// ── Auth endpoints ────────────────────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  const ip = (req.ip ?? req.socket.remoteAddress ?? 'unknown').replace(/^::ffff:/, '');
  const now = Date.now();
  const attempt = loginAttempts.get(ip) ?? { count: 0, lockedUntil: 0 };

  if (attempt.lockedUntil > now) {
    const retryAfter = Math.ceil((attempt.lockedUntil - now) / 1000);
    return res.status(429).json({ error: 'For mange forsøk – prøv igjen senere', retryAfter });
  }

  const { pin } = req.body;
  if (!pin || !checkPin(String(pin), ADMIN_PIN)) {
    attempt.count += 1;
    attempt.lockedUntil = now + getLockoutDuration(attempt.count);
    loginAttempts.set(ip, attempt);
    const retryAfter = attempt.lockedUntil > now ? Math.ceil((attempt.lockedUntil - now) / 1000) : undefined;
    return res.status(401).json({ error: 'Feil PIN-kode', ...(retryAfter ? { retryAfter } : {}) });
  }

  loginAttempts.delete(ip);
  const token = randomBytes(32).toString('hex');
  sessions.set(token, new Date(now + 8 * 60 * 60 * 1000));
  res.json({ token });
});

app.get('/api/auth/validate', requireAuth, (req, res) => {
  res.json({ valid: true });
});

// ── Health ────────────────────────────────────────────────────────────────────
app.get('/health', (req, res) => {
  try {
    db.prepare('SELECT 1').get();
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  } catch {
    res.status(500).json({ status: 'unhealthy', error: 'Database connection failed' });
  }
});

// ── Children ──────────────────────────────────────────────────────────────────
app.get('/api/children', (req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM children ORDER BY created_at ASC').all());
  } catch { res.status(500).json({ error: 'Failed to fetch children' }); }
});

app.post('/api/children', requireAuth, (req, res) => {
  try {
    const { name, color, avatar_emoji } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
    const id = generateId();
    const created_at = new Date().toISOString();
    db.prepare('INSERT INTO children (id, name, color, avatar_emoji, created_at) VALUES (?, ?, ?, ?, ?)')
      .run(id, name.trim().slice(0, 100), color, avatar_emoji, created_at);
    res.json({ id, name: name.trim(), color, avatar_emoji, created_at });
  } catch { res.status(500).json({ error: 'Failed to create child' }); }
});

app.delete('/api/children/:id', requireAuth, (req, res) => {
  try {
    db.prepare('DELETE FROM children WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Failed to delete child' }); }
});

// ── Tasks ─────────────────────────────────────────────────────────────────────
app.get('/api/tasks', (req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM tasks WHERE is_active = 1 ORDER BY created_at ASC').all());
  } catch { res.status(500).json({ error: 'Failed to fetch tasks' }); }
});

app.post('/api/tasks', requireAuth, (req, res) => {
  try {
    const { title, description, target_count, icon } = req.body;
    if (!title?.trim()) return res.status(400).json({ error: 'Title is required' });
    const id = generateId();
    const created_at = new Date().toISOString();
    db.prepare('INSERT INTO tasks (id, title, description, target_count, icon, is_active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)')
      .run(id, title.trim().slice(0, 200), description || '', target_count || 1, icon || 'check-circle', created_at);
    res.json({ id, title: title.trim(), description: description || '', target_count: target_count || 1, icon: icon || 'check-circle', is_active: true, created_at });
  } catch { res.status(500).json({ error: 'Failed to create task' }); }
});

app.put('/api/tasks/:id', requireAuth, (req, res) => {
  try {
    const { title, description, target_count, icon, is_active } = req.body;
    const updates: string[] = [];
    const values: any[] = [];
    if (title !== undefined) { updates.push('title = ?'); values.push(title.slice(0, 200)); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (target_count !== undefined) { updates.push('target_count = ?'); values.push(target_count); }
    if (icon !== undefined) { updates.push('icon = ?'); values.push(icon); }
    if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active ? 1 : 0); }
    if (updates.length === 0) return res.status(400).json({ error: 'No updates provided' });
    values.push(req.params.id);
    db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...values);
    res.json(db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id));
  } catch { res.status(500).json({ error: 'Failed to update task' }); }
});

app.delete('/api/tasks/:id', requireAuth, (req, res) => {
  try {
    db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Failed to delete task' }); }
});

// ── Task completions (public – used by children) ──────────────────────────────
app.get('/api/task-completions/:childId/:weekStart', (req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM task_completions WHERE child_id = ? AND week_start_date >= ?')
      .all(req.params.childId, req.params.weekStart));
  } catch { res.status(500).json({ error: 'Failed to fetch completions' }); }
});

app.post('/api/task-completions', (req, res) => {
  try {
    const { child_id, task_id, completion_count, week_start_date } = req.body;
    if (!child_id || !task_id || !week_start_date) return res.status(400).json({ error: 'Missing required fields' });
    if (!/^\d{4}-\d{2}-\d{2}$/.test(week_start_date)) return res.status(400).json({ error: 'Invalid week_start_date' });
    if (!Number.isInteger(completion_count) || completion_count < 0 || completion_count > 999) return res.status(400).json({ error: 'Invalid completion_count' });
    const existing = db.prepare('SELECT * FROM task_completions WHERE child_id = ? AND task_id = ? AND week_start_date = ?')
      .get(child_id, task_id, week_start_date);
    const updated_at = new Date().toISOString();
    if (existing) {
      db.prepare('UPDATE task_completions SET completion_count = ?, updated_at = ? WHERE id = ?')
        .run(completion_count, updated_at, (existing as any).id);
      res.json({ ...existing, completion_count, updated_at });
    } else {
      const id = generateId();
      db.prepare('INSERT INTO task_completions (id, child_id, task_id, completion_count, week_start_date, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
        .run(id, child_id, task_id, completion_count, week_start_date, updated_at);
      res.json({ id, child_id, task_id, completion_count, week_start_date, updated_at });
    }
  } catch { res.status(500).json({ error: 'Failed to update completion' }); }
});

app.delete('/api/task-completions/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM task_completions WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Failed to delete completion' }); }
});

app.delete('/api/reset-week', requireAuth, (req, res) => {
  try {
    db.prepare('DELETE FROM task_completions').run();
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Failed to reset week' }); }
});

// ── Messages (public – family can add/remove) ─────────────────────────────────
app.get('/api/messages', (req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM messages ORDER BY created_at ASC').all());
  } catch { res.status(500).json({ error: 'Failed to fetch messages' }); }
});

app.post('/api/messages', (req, res) => {
  try {
    const { text } = req.body;
    if (!text?.trim()) return res.status(400).json({ error: 'Text is required' });
    const id = generateId();
    const created_at = new Date().toISOString();
    db.prepare('INSERT INTO messages (id, text, created_at) VALUES (?, ?, ?)')
      .run(id, text.trim().slice(0, 500), created_at);
    res.json({ id, text: text.trim(), created_at });
  } catch { res.status(500).json({ error: 'Failed to create message' }); }
});

app.delete('/api/messages/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM messages WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Failed to delete message' }); }
});

// ── Meals ─────────────────────────────────────────────────────────────────────
app.get('/api/meals', (req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM meals ORDER BY name ASC').all());
  } catch { res.status(500).json({ error: 'Failed to fetch meals' }); }
});

app.post('/api/meals', requireAuth, (req, res) => {
  try {
    const { name, recipe_url } = req.body;
    if (!name?.trim()) return res.status(400).json({ error: 'Name is required' });
    const id = generateId();
    const created_at = new Date().toISOString();
    db.prepare('INSERT INTO meals (id, name, recipe_url, created_at) VALUES (?, ?, ?, ?)')
      .run(id, name.trim().slice(0, 200), recipe_url || null, created_at);
    res.json({ id, name: name.trim(), recipe_url: recipe_url || null, created_at });
  } catch { res.status(500).json({ error: 'Failed to create meal' }); }
});

app.delete('/api/meals/:id', requireAuth, (req, res) => {
  try {
    db.prepare('UPDATE meal_plan SET meal_id = NULL WHERE meal_id = ?').run(req.params.id);
    db.prepare('DELETE FROM meals WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Failed to delete meal' }); }
});

// ── Meal plan (public – used from home screen) ────────────────────────────────
app.get('/api/meal-plan', (req, res) => {
  try {
    const { week_start } = req.query as { week_start: string };
    if (!week_start) return res.status(400).json({ error: 'week_start is required' });
    const weekEnd = new Date(week_start);
    weekEnd.setDate(weekEnd.getDate() + 6);
    const weekEndStr = weekEnd.toISOString().split('T')[0];
    res.json(db.prepare(`
      SELECT mp.id, mp.meal_id, mp.planned_date, m.name as meal_name
      FROM meal_plan mp LEFT JOIN meals m ON mp.meal_id = m.id
      WHERE mp.planned_date >= ? AND mp.planned_date <= ?
      ORDER BY mp.planned_date ASC
    `).all(week_start, weekEndStr));
  } catch { res.status(500).json({ error: 'Failed to fetch meal plan' }); }
});

app.put('/api/meal-plan/:date', (req, res) => {
  try {
    const { date } = req.params;
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return res.status(400).json({ error: 'Invalid date format' });
    const { meal_id } = req.body;
    const existing = db.prepare('SELECT * FROM meal_plan WHERE planned_date = ?').get(date);
    if (existing) {
      db.prepare('UPDATE meal_plan SET meal_id = ? WHERE planned_date = ?').run(meal_id || null, date);
      res.json({ ...existing, meal_id: meal_id || null });
    } else {
      const id = generateId();
      const created_at = new Date().toISOString();
      db.prepare('INSERT INTO meal_plan (id, meal_id, planned_date, created_at) VALUES (?, ?, ?, ?)')
        .run(id, meal_id || null, date, created_at);
      res.json({ id, meal_id: meal_id || null, planned_date: date, created_at });
    }
  } catch { res.status(500).json({ error: 'Failed to update meal plan' }); }
});

app.delete('/api/meal-plan/:date', (req, res) => {
  try {
    db.prepare('DELETE FROM meal_plan WHERE planned_date = ?').run(req.params.date);
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Failed to delete meal plan entry' }); }
});

// ── Recipe inspiration ────────────────────────────────────────────────────────
let recipeUrlCache: { urls: string[]; fetchedAt: number } | null = null;

async function getRecipeUrls(): Promise<string[]> {
  const now = Date.now();
  if (recipeUrlCache && now - recipeUrlCache.fetchedAt < 24 * 60 * 60 * 1000) return recipeUrlCache.urls;
  const res = await fetch('https://www.matprat.no/sitemap.xml', { headers: { 'User-Agent': 'kidstaskmgr/1.0' } });
  const xml = await res.text();
  const urls: string[] = [];
  const regex = /<loc>(https:\/\/www\.matprat\.no\/oppskrifter\/[^<]+)<\/loc>/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(xml)) !== null) urls.push(m[1]);
  recipeUrlCache = { urls, fetchedAt: now };
  return urls;
}

function formatDuration(iso: string): string {
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!m) return '';
  const h = parseInt(m[1] || '0');
  const min = parseInt(m[2] || '0');
  if (h > 0 && min > 0) return `${h} t ${min} min`;
  if (h > 0) return `${h} t`;
  return `${min} min`;
}

app.get('/api/meal-inspiration', async (req, res) => {
  try {
    const { q } = req.query as { q: string };
    if (!q?.trim()) return res.status(400).json({ error: 'Query required' });
    const terms = q.trim().toLowerCase().slice(0, 100).split(/\s+/);
    const allUrls = await getRecipeUrls();
    const matching = allUrls
      .filter(url => {
        const slug = url.replace('https://www.matprat.no/oppskrifter/', '').replace(/\/$/, '');
        return terms.some(t => slug.includes(t));
      })
      .slice(0, 8);
    if (matching.length === 0) return res.json([]);
    const recipes = (await Promise.all(
      matching.map(async (url) => {
        try {
          const r = await fetch(url, { headers: { 'User-Agent': 'kidstaskmgr/1.0' } });
          const html = await r.text();
          const ldMatch = html.match(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/);
          if (!ldMatch) return null;
          const parsed = JSON.parse(ldMatch[1]);
          const recipe = Array.isArray(parsed) ? parsed[0] : parsed;
          if (!recipe?.name) return null;
          const rawImg = Array.isArray(recipe.image) ? (recipe.image[0]?.url ?? recipe.image[0]) : (recipe.image?.url ?? recipe.image ?? '');
          const image = typeof rawImg === 'string' ? rawImg.replace(/__w=\d+_h=\d+/, '__w=400_h=300') : '';
          const diffMatch = recipe.description?.match(/(Superenkel|Enkel|Middels|Krevende)\s*vanskelighetsgrad/i);
          return { title: recipe.name as string, url, image, time: recipe.totalTime ? formatDuration(recipe.totalTime as string) : '', difficulty: diffMatch ? diffMatch[1] : '', rating: '' };
        } catch { return null; }
      })
    )).filter(Boolean);
    res.json(recipes);
  } catch (error) {
    console.error('Meal inspiration failed:', error);
    res.status(500).json({ error: 'Kunne ikke hente oppskrifter' });
  }
});

getRecipeUrls().catch(err => console.error('Failed to pre-load recipe cache:', err));

// ── Calendar ──────────────────────────────────────────────────────────────────
app.get('/api/calendar-settings', (req, res) => {
  try {
    res.json(db.prepare('SELECT * FROM calendar_settings LIMIT 1').get() || null);
  } catch { res.status(500).json({ error: 'Failed to fetch calendar settings' }); }
});

app.put('/api/calendar-settings', requireAuth, async (req, res) => {
  try {
    const { ical_url } = req.body;
    if (!ical_url?.trim()) return res.status(400).json({ error: 'ical_url er påkrevd' });

    // SSRF protection
    await validateSafeUrl(ical_url);

    const updated_at = new Date().toISOString();
    const existing = db.prepare('SELECT * FROM calendar_settings LIMIT 1').get() as any;
    if (existing) {
      db.prepare('UPDATE calendar_settings SET ical_url = ?, updated_at = ? WHERE id = ?')
        .run(ical_url, updated_at, existing.id);
      res.json(db.prepare('SELECT * FROM calendar_settings WHERE id = ?').get(existing.id));
    } else {
      const id = generateId();
      const created_at = new Date().toISOString();
      db.prepare('INSERT INTO calendar_settings (id, ical_url, created_at, updated_at) VALUES (?, ?, ?, ?)')
        .run(id, ical_url, created_at, updated_at);
      res.json(db.prepare('SELECT * FROM calendar_settings WHERE id = ?').get(id));
    }
  } catch (error: any) {
    const userMessage = error?.message?.includes('privat') || error?.message?.includes('Ugyldig') || error?.message?.includes('http')
      ? error.message : 'Failed to update calendar settings';
    res.status(400).json({ error: userMessage });
  }
});

app.get('/api/calendar-events', async (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM calendar_settings LIMIT 1').get() as any;
    if (!settings?.ical_url) return res.json([]);
    const events = await ical.async.fromURL(settings.ical_url);
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    const formatDateOnly = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const upcomingEvents = Object.values(events)
      .filter((e: any) => e.type === 'VEVENT')
      .map((event: any) => {
        const start = event.start;
        const end = event.end;
        const isAllDay = (start as any)?.dateOnly === true || (typeof start === 'string' && start.length === 10);
        return {
          id: event.uid || Math.random().toString(36).substr(2, 9),
          summary: event.summary || 'Uten tittel',
          start: isAllDay ? (start instanceof Date ? formatDateOnly(start) : start) : (start instanceof Date ? start.toISOString() : start),
          end: isAllDay ? (end instanceof Date ? formatDateOnly(end) : end) : (end instanceof Date ? end.toISOString() : end),
          description: event.description || '',
          location: event.location || '',
          rawStart: start,
          isAllDay,
        };
      })
      .filter((event: any) => {
        const eventStart = event.rawStart instanceof Date ? event.rawStart : new Date(event.rawStart);
        const eventEnd = event.end ? new Date(event.end) : eventStart;
        return (eventStart >= startOfToday || eventEnd >= startOfToday) && eventStart <= sevenDaysFromNow;
      })
      .sort((a: any, b: any) => {
        const aS = a.rawStart instanceof Date ? a.rawStart : new Date(a.rawStart);
        const bS = b.rawStart instanceof Date ? b.rawStart : new Date(b.rawStart);
        return aS.getTime() - bS.getTime();
      })
      .map(({ rawStart, ...event }: any) => event);
    res.json(upcomingEvents);
  } catch (error) {
    console.error('Failed to fetch calendar events:', error);
    res.json([]);
  }
});

// ── Microsoft To-Do integration ───────────────────────────────────────────────
app.get('/api/todo/status', (req, res) => {
  res.json({
    configured: !!(MS_CLIENT_ID && MS_CLIENT_SECRET),
    connected: !!(getSettingStr('ms_access_token') && getSettingStr('ms_refresh_token')),
    accountName: getSettingStr('ms_account_name'),
    listId: getSettingStr('ms_list_id'),
    listName: getSettingStr('ms_list_name'),
  });
});

app.get('/api/todo/auth-url', requireAuth, (req, res) => {
  if (!MS_CLIENT_ID || !MS_CLIENT_SECRET)
    return res.status(501).json({ error: 'Microsoft To-Do ikke konfigurert' });
  const state = randomBytes(16).toString('hex');
  oauthStates.set(state, Date.now() + 10 * 60 * 1000);
  const params = new URLSearchParams({
    client_id: MS_CLIENT_ID, response_type: 'code',
    redirect_uri: MS_REDIRECT_URI,
    scope: 'Tasks.ReadWrite User.Read offline_access',
    response_mode: 'query', state,
    prompt: 'select_account',
  });
  res.json({ authUrl: `https://login.microsoftonline.com/consumers/oauth2/v2.0/authorize?${params}` });
});

app.get('/api/todo/callback', async (req, res) => {
  const { code, state, error } = req.query as Record<string, string>;
  const html = (msg: string, success: boolean) => res.send(`<!DOCTYPE html>
<html><head><meta charset="utf-8"><title>Microsoft To-Do</title>
<style>body{font-family:sans-serif;display:flex;align-items:center;justify-content:center;height:100vh;margin:0}
p{font-size:1.1rem;color:${success ? '#16a34a' : '#dc2626'}}</style></head>
<body><p>${msg}</p>
<script>
  try { window.opener && window.opener.postMessage('${success ? 'todo-auth-success' : 'todo-auth-error'}','*'); }
  catch(e){}
  setTimeout(()=>window.close(),1200);
</script></body></html>`);

  if (error || !code || !state) return html('Autentisering avbrutt.', false);
  const stateExpiry = oauthStates.get(state);
  if (!stateExpiry || Date.now() > stateExpiry) return html('Ugyldig forespørsel – prøv igjen.', false);
  oauthStates.delete(state);

  try {
    const tokenRes = await fetch('https://login.microsoftonline.com/consumers/oauth2/v2.0/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: MS_CLIENT_ID!, client_secret: MS_CLIENT_SECRET!,
        code, grant_type: 'authorization_code', redirect_uri: MS_REDIRECT_URI,
        scope: 'Tasks.ReadWrite User.Read offline_access',
      }),
    });
    if (!tokenRes.ok) return html('Kunne ikke hente token. Prøv igjen.', false);
    const tokenData = await tokenRes.json() as any;
    setSetting('ms_access_token', tokenData.access_token);
    setSetting('ms_refresh_token', tokenData.refresh_token);
    setSetting('ms_token_expiry', String(Date.now() + tokenData.expires_in * 1000));
    const userRes = await fetch('https://graph.microsoft.com/v1.0/me', {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });
    if (userRes.ok) {
      const user = await userRes.json() as any;
      setSetting('ms_account_name', user.displayName || user.userPrincipalName || 'Microsoft-konto');
    }
    html('Tilkoblet! Du kan lukke dette vinduet.', true);
  } catch { html('Noe gikk galt. Prøv igjen.', false); }
});

app.delete('/api/todo/disconnect', requireAuth, (req, res) => {
  clearMsTokens();
  res.json({ success: true });
});

app.get('/api/todo/lists', requireAuth, async (req, res) => {
  try {
    const token = await getMsAccessToken();
    if (!token) return res.status(401).json({ error: 'Ikke tilkoblet Microsoft To-Do' });
    const r = await fetch('https://graph.microsoft.com/v1.0/me/todo/lists', {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return res.status(r.status).json({ error: 'Kunne ikke hente lister' });
    const data = await r.json() as any;
    res.json((data.value as any[]).map(l => ({ id: l.id, name: l.displayName })));
  } catch { res.status(500).json({ error: 'Kunne ikke hente To-Do-lister' }); }
});

app.put('/api/todo/list', requireAuth, (req, res) => {
  const { listId, listName } = req.body;
  if (!listId) return res.status(400).json({ error: 'listId required' });
  setSetting('ms_list_id', listId);
  setSetting('ms_list_name', listName || listId);
  res.json({ success: true });
});

app.post('/api/todo/add', async (req, res) => {
  try {
    const token = await getMsAccessToken();
    if (!token) return res.status(401).json({ error: 'Ikke tilkoblet Microsoft To-Do' });
    const listId = getSettingStr('ms_list_id');
    if (!listId) return res.status(400).json({ error: 'Ingen handleliste valgt' });
    const { items } = req.body as { items: string[] };
    if (!Array.isArray(items) || items.length === 0) return res.status(400).json({ error: 'items required' });
    let added = 0, failed = 0;
    for (const item of items.slice(0, 50)) {
      try {
        const r = await fetch(`https://graph.microsoft.com/v1.0/me/todo/lists/${encodeURIComponent(listId)}/tasks`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ title: String(item).slice(0, 255) }),
        });
        r.ok ? added++ : failed++;
      } catch { failed++; }
    }
    res.json({ success: true, added, failed });
  } catch { res.status(500).json({ error: 'Kunne ikke legge til i handleliste' }); }
});

// ── Recipe ingredients ────────────────────────────────────────────────────────
app.get('/api/recipe-ingredients', async (req, res) => {
  try {
    const { url } = req.query as { url: string };
    if (!url) return res.status(400).json({ error: 'url required' });
    let parsed: URL;
    try { parsed = new URL(url); } catch { return res.status(400).json({ error: 'Ugyldig URL' }); }
    if (parsed.hostname !== 'www.matprat.no')
      return res.status(400).json({ error: 'Kun Matprat.no-oppskrifter støttes' });
    const r = await fetch(url, { headers: { 'User-Agent': 'kidstaskmgr/1.0' } });
    if (!r.ok) return res.status(502).json({ error: 'Kunne ikke hente oppskrift' });
    const html = await r.text();
    const ldMatch = html.match(/<script[^>]+application\/ld\+json[^>]*>([\s\S]*?)<\/script>/);
    if (!ldMatch) return res.status(422).json({ error: 'Ingen oppskriftsdata funnet' });
    const ld = JSON.parse(ldMatch[1]);
    const recipe = Array.isArray(ld) ? (ld.find((i: any) => i['@type'] === 'Recipe') ?? ld[0]) : ld;
    if (!Array.isArray(recipe?.recipeIngredient))
      return res.status(422).json({ error: 'Ingen ingredienser funnet' });
    res.json({
      title: recipe.name || '',
      ingredients: (recipe.recipeIngredient as string[]).slice(0, 100),
      recipeYield: recipe.recipeYield ?? null,
    });
  } catch { res.status(500).json({ error: 'Kunne ikke hente ingredienser' }); }
});

// 404 for unknown API routes (must be before static files to avoid returning HTML)
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// Serve frontend static files and SPA fallback
app.use(express.static(path.join(__dirname, 'dist')));
app.get('*', (_req, res) => {
  res.sendFile(path.join(__dirname, 'dist', 'index.html'));
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Database path: ${dbPath}`);
});
