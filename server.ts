import express, { Request, Response, NextFunction } from 'express';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import ical from 'node-ical';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { randomBytes, randomUUID } from 'crypto';
import { lookup as dnsLookup } from 'dns/promises';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3001;

// ── Auth ──────────────────────────────────────────────────────────────────────
const ADMIN_PIN = process.env.ADMIN_PIN || '1234';
if (!process.env.ADMIN_PIN) {
  console.warn('⚠️  ADVARSEL: ADMIN_PIN er ikke satt – standard PIN "1234" brukes. Sett ADMIN_PIN i miljøvariablene!');
}
const sessions = new Map<string, Date>(); // token → expiry

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

// Clean up expired sessions every hour
setInterval(() => {
  const now = new Date();
  for (const [token, expiry] of sessions) {
    if (expiry < now) sessions.delete(token);
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
    const row = db.prepare("SELECT value FROM app_settings WHERE key = 'requirePinForHome'").get() as any;
    res.json({ requirePinForHome: row ? JSON.parse(row.value) : false });
  } catch { res.status(500).json({ error: 'Failed to fetch settings' }); }
});

app.put('/api/settings', requireAuth, (req, res) => {
  try {
    const { requirePinForHome } = req.body;
    if (typeof requirePinForHome !== 'boolean') return res.status(400).json({ error: 'Invalid value' });
    db.prepare("INSERT OR REPLACE INTO app_settings (key, value) VALUES ('requirePinForHome', ?)").run(JSON.stringify(requirePinForHome));
    res.json({ success: true });
  } catch { res.status(500).json({ error: 'Failed to save settings' }); }
});

// ── Auth endpoints ────────────────────────────────────────────────────────────
app.post('/api/auth/login', (req, res) => {
  const { pin } = req.body;
  if (!pin || pin !== ADMIN_PIN) {
    return res.status(401).json({ error: 'Feil PIN-kode' });
  }
  const token = randomBytes(32).toString('hex');
  sessions.set(token, new Date(Date.now() + 8 * 60 * 60 * 1000));
  res.json({ token });
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
