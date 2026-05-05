import express from 'express';
import cors from 'cors';
import Database from 'better-sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';
import ical from 'node-ical';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = process.env.PORT || 3001;

const dbPath = process.env.DB_PATH || path.join(__dirname, 'tasks.db');
const db = new Database(dbPath);

db.pragma('journal_mode = WAL');

app.use(cors());
app.use(express.json());

app.get('/health', (req, res) => {
  try {
    db.prepare('SELECT 1').get();
    res.json({ status: 'healthy', timestamp: new Date().toISOString() });
  } catch (error) {
    res.status(500).json({ status: 'unhealthy', error: 'Database connection failed' });
  }
});

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

    CREATE INDEX IF NOT EXISTS idx_task_completions_child_id ON task_completions(child_id);
    CREATE INDEX IF NOT EXISTS idx_task_completions_task_id ON task_completions(task_id);
    CREATE INDEX IF NOT EXISTS idx_task_completions_week_start ON task_completions(week_start_date);
  `);
}

initDatabase();

function generateId(): string {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

app.get('/api/children', (req, res) => {
  try {
    const children = db.prepare('SELECT * FROM children ORDER BY created_at ASC').all();
    res.json(children);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch children' });
  }
});

app.post('/api/children', (req, res) => {
  try {
    const { name, color, avatar_emoji } = req.body;
    const id = generateId();
    const created_at = new Date().toISOString();

    db.prepare(
      'INSERT INTO children (id, name, color, avatar_emoji, created_at) VALUES (?, ?, ?, ?, ?)'
    ).run(id, name, color, avatar_emoji, created_at);

    res.json({ id, name, color, avatar_emoji, created_at });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create child' });
  }
});

app.delete('/api/children/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM children WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete child' });
  }
});

app.get('/api/tasks', (req, res) => {
  try {
    const tasks = db.prepare('SELECT * FROM tasks WHERE is_active = 1 ORDER BY created_at ASC').all();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch tasks' });
  }
});

app.post('/api/tasks', (req, res) => {
  try {
    const { title, description, target_count, icon } = req.body;
    const id = generateId();
    const created_at = new Date().toISOString();

    db.prepare(
      'INSERT INTO tasks (id, title, description, target_count, icon, is_active, created_at) VALUES (?, ?, ?, ?, ?, 1, ?)'
    ).run(id, title, description || '', target_count || 1, icon || 'check-circle', created_at);

    res.json({ id, title, description: description || '', target_count: target_count || 1, icon: icon || 'check-circle', is_active: true, created_at });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create task' });
  }
});

app.put('/api/tasks/:id', (req, res) => {
  try {
    const { title, description, target_count, icon, is_active } = req.body;
    const updates: string[] = [];
    const values: any[] = [];

    if (title !== undefined) {
      updates.push('title = ?');
      values.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (target_count !== undefined) {
      updates.push('target_count = ?');
      values.push(target_count);
    }
    if (icon !== undefined) {
      updates.push('icon = ?');
      values.push(icon);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active ? 1 : 0);
    }

    if (updates.length === 0) {
      return res.status(400).json({ error: 'No updates provided' });
    }

    values.push(req.params.id);
    db.prepare(`UPDATE tasks SET ${updates.join(', ')} WHERE id = ?`).run(...values);

    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    res.json(task);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update task' });
  }
});

app.delete('/api/tasks/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

app.get('/api/task-completions/:childId/:weekStart', (req, res) => {
  try {
    const completions = db.prepare(
      'SELECT * FROM task_completions WHERE child_id = ? AND week_start_date >= ?'
    ).all(req.params.childId, req.params.weekStart);
    res.json(completions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch completions' });
  }
});

app.post('/api/task-completions', (req, res) => {
  try {
    const { child_id, task_id, completion_count, week_start_date } = req.body;

    const existing = db.prepare(
      'SELECT * FROM task_completions WHERE child_id = ? AND task_id = ? AND week_start_date = ?'
    ).get(child_id, task_id, week_start_date);

    const updated_at = new Date().toISOString();

    if (existing) {
      db.prepare(
        'UPDATE task_completions SET completion_count = ?, updated_at = ? WHERE id = ?'
      ).run(completion_count, updated_at, existing.id);
      res.json({ ...existing, completion_count, updated_at });
    } else {
      const id = generateId();
      db.prepare(
        'INSERT INTO task_completions (id, child_id, task_id, completion_count, week_start_date, updated_at) VALUES (?, ?, ?, ?, ?, ?)'
      ).run(id, child_id, task_id, completion_count, week_start_date, updated_at);
      res.json({ id, child_id, task_id, completion_count, week_start_date, updated_at });
    }
  } catch (error) {
    res.status(500).json({ error: 'Failed to update completion' });
  }
});

app.delete('/api/task-completions/:id', (req, res) => {
  try {
    db.prepare('DELETE FROM task_completions WHERE id = ?').run(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete completion' });
  }
});

app.delete('/api/reset-week', (req, res) => {
  try {
    db.prepare('DELETE FROM task_completions').run();
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to reset week' });
  }
});

app.get('/api/calendar-settings', (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM calendar_settings LIMIT 1').get();
    res.json(settings || null);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch calendar settings' });
  }
});

app.put('/api/calendar-settings', (req, res) => {
  try {
    const { ical_url } = req.body;
    const updated_at = new Date().toISOString();

    const existing = db.prepare('SELECT * FROM calendar_settings LIMIT 1').get();

    if (existing) {
      db.prepare('UPDATE calendar_settings SET ical_url = ?, updated_at = ? WHERE id = ?')
        .run(ical_url, updated_at, existing.id);

      const updated = db.prepare('SELECT * FROM calendar_settings WHERE id = ?').get(existing.id);
      res.json(updated);
    } else {
      const id = generateId();
      const created_at = new Date().toISOString();

      db.prepare('INSERT INTO calendar_settings (id, ical_url, created_at, updated_at) VALUES (?, ?, ?, ?)')
        .run(id, ical_url, created_at, updated_at);

      const inserted = db.prepare('SELECT * FROM calendar_settings WHERE id = ?').get(id);
      res.json(inserted);
    }
  } catch (error) {
    console.error('Error updating calendar settings:', error);
    res.status(500).json({ error: 'Failed to update calendar settings' });
  }
});

app.get('/api/calendar-events', async (req, res) => {
  try {
    const settings = db.prepare('SELECT * FROM calendar_settings LIMIT 1').get();

    if (!settings || !settings.ical_url) {
      return res.json([]);
    }

    const events = await ical.async.fromURL(settings.ical_url);

    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
    const sevenDaysFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

    const upcomingEvents = Object.values(events)
      .filter((event: any) => event.type === 'VEVENT')
      .map((event: any) => {
        const start = event.start;
        const end = event.end;
        const isAllDay = (start as any)?.dateOnly === true || (typeof start === 'string' && start.length === 10);

        const formatDateOnly = (d: Date) => {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          return `${y}-${m}-${day}`;
        };

        return {
          id: event.uid || Math.random().toString(36).substr(2, 9),
          summary: event.summary || 'Uten tittel',
          start: isAllDay
            ? (start instanceof Date ? formatDateOnly(start) : start)
            : (start instanceof Date ? start.toISOString() : start),
          end: isAllDay
            ? (end instanceof Date ? formatDateOnly(end) : end)
            : (end instanceof Date ? end.toISOString() : end),
          description: event.description || '',
          location: event.location || '',
          rawStart: start,
          isAllDay,
        };
      })
      .filter((event: any) => {
        const eventStart = event.rawStart instanceof Date ? event.rawStart : new Date(event.rawStart);
        const eventEnd = event.end ? (typeof event.end === 'string' ? new Date(event.end) : event.end) : eventStart;

        return (eventStart >= startOfToday || eventEnd >= startOfToday) && eventStart <= sevenDaysFromNow;
      })
      .sort((a: any, b: any) => {
        const aStart = a.rawStart instanceof Date ? a.rawStart : new Date(a.rawStart);
        const bStart = b.rawStart instanceof Date ? b.rawStart : new Date(b.rawStart);
        return aStart.getTime() - bStart.getTime();
      })
      .map(({ rawStart, ...event }: any) => event);

    res.json(upcomingEvents);
  } catch (error) {
    console.error('Failed to fetch calendar events:', error);
    res.json([]);
  }
});

app.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
  console.log(`Database path: ${dbPath}`);
  console.log(`Health check available at http://localhost:${port}/health`);
});
