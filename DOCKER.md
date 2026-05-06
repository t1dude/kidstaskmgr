🇳🇴 [Norsk](DOCKER.no.md)

# Docker deployment

This guide covers running the app using Docker on your local machine.

For home server deployment behind a reverse proxy, see [COSMOS.md](COSMOS.md).

## Prerequisites

- Docker Desktop installed
- Port 3001 free

## Quick start

```bash
docker-compose up -d
```

Open `http://localhost:3001`. The app runs on a single port — Express serves both the API and the built frontend.

```bash
docker-compose down      # stop
docker-compose down -v   # stop and delete all data
```

## Data persistence

All data is stored in a Docker volume mounted at `/app/data`. It persists across container restarts and is unaffected by image updates.

## Rebuilding after code changes

```bash
docker-compose down
docker-compose up -d --build
```

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

## First-time setup

1. Open `http://localhost:3001`
2. Click the gear icon → enter the default PIN (`1234`) → go to **Children** and add your children
3. Go to **Tasks** and add weekly tasks
4. Change the PIN under Settings → Security (strongly recommended)

## Weekly reset

At the start of each week, go to the admin panel and click **Reset week** to clear all task completions.
