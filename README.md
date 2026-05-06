🇳🇴 [Norsk](README.no.md)

# kidstaskmgr

A family weekly planner – tasks, calendar, and dinner plan in one place.

## Features

- Weekly tasks with per-child progress tracking and motivational tips
- Calendar integration via iCal (Google Calendar, Outlook, and others)
- Dinner planner with recipe inspiration from matprat.no
- Family messages board for quick notes on the home screen
- Dark mode, per-feature toggles, and PIN protection
- Norwegian and English language support
- SQLite database – all data stored locally, no external services

## Getting started

### Docker (recommended)

```bash
docker-compose up -d
```

Open `http://localhost:3001`. Data is stored in a Docker volume and survives restarts.

```bash
docker-compose down      # stop
docker-compose down -v   # stop and delete all data
```

### Cosmos Cloud (home server)

See [COSMOS.md](COSMOS.md) for setup behind a reverse proxy with automatic HTTPS.

### Local development

```bash
npm install
npm run dev:server   # Express API on port 3001
npm run dev          # Vite frontend on port 5173 (proxies /api automatically)
```

## Security

The app has built-in PIN protection. **Change the PIN before exposing it to the internet:**

```yaml
# docker-compose.yml
environment:
  - ADMIN_PIN=your_secret_pin
```

The admin panel always requires a PIN. To protect the entire app (recommended when accessible over the internet, since the calendar is visible on the home screen):

> Settings → General → Security → "Require PIN for home screen"

The session token lasts 8 hours and is stored in `localStorage`.

Failed login attempts trigger progressive lockouts: 3 failures → 1 min, 6 → 5 min, 10 → 30 min, 15 → 2 hours.

## Troubleshooting

**Port 3001 in use:**
```bash
# Windows
netstat -ano | findstr :3001
# Mac/Linux
lsof -i :3001
```

**Container won't start:**
```bash
docker-compose logs -f
```

**Reset everything:**
```bash
docker-compose down -v && docker-compose up -d --build
```

## Changelog

See [CHANGELOG.md](CHANGELOG.md).

## License

Private project for family use.
