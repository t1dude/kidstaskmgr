# Docker Deployment Instructions

This guide will help you run the task tracker application using Docker Desktop without any online services.

## Prerequisites

- Docker Desktop installed on your machine
- No other services running on ports 3001 and 4173

## Quick Start

1. **Build and start the container:**
   ```bash
   docker-compose up -d
   ```

2. **Access the application:**
   - Open your browser and go to: `http://localhost:4173`
   - The app is now running entirely on your local machine

3. **Stop the container:**
   ```bash
   docker-compose down
   ```

## What's Inside

The Docker container runs:
- **Backend API** (port 3001): Express server with SQLite database
- **Frontend** (port 4173): Vite-built React application

All data is stored locally in a SQLite database inside the Docker volume, so your tasks and progress persist between restarts.

## Data Persistence

- The database file is stored in a Docker volume named `task-data`
- Data persists even when you stop and restart the container
- To completely reset and remove all data:
  ```bash
  docker-compose down -v
  ```

## Rebuilding After Changes

If you make changes to the code:
```bash
docker-compose down
docker-compose build --no-cache
docker-compose up -d
```

## Troubleshooting

**Port conflicts:**
If you get a port conflict error, check if another service is using ports 3001 or 4173:
```bash
# On Windows
netstat -ano | findstr :3001
netstat -ano | findstr :4173

# On Mac/Linux
lsof -i :3001
lsof -i :4173
```

**Container won't start:**
Check the logs:
```bash
docker-compose logs -f
```

**Reset everything:**
```bash
docker-compose down -v
docker system prune -a
docker-compose up -d --build
```

## Using the Application

1. **First time setup:**
   - Click "Admin" to add children and tasks
   - Add 2 children with names, emojis, and colors
   - Add weekly tasks with target completion counts

2. **Daily use:**
   - Children select their profile from the home screen
   - They can log completed tasks by clicking the + button
   - Progress bars show their weekly completion status

3. **Weekly reset:**
   - Go to Admin panel
   - Click "Nullstill uke" to reset all progress for a new week

Enjoy your self-hosted task tracker!
