🇳🇴 [Norsk](README.no.md)

# kidstaskmgr

A family weekly planner – tasks, calendar, dinner plan, and shopping list in one place.

## Features

- Weekly tasks with per-child progress tracking and motivational tips
- Calendar integration via iCal (Google Calendar, Outlook, and others)
- Dinner planner with recipe inspiration from matprat.no
- Microsoft To-Do integration – add recipe ingredients to a shared shopping list
- Family messages board for quick notes on the home screen
- Dark mode, per-feature toggles, and PIN protection
- Norwegian and English language support
- SQLite database – all data stored locally

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

## Microsoft To-Do integration

The integration lets you add ingredients from Matprat recipes directly to a shared Microsoft To-Do list (e.g. a household shopping list). One authorization covers the whole household – no per-device login required.

### Prerequisites

- A free personal Microsoft account (Outlook, Hotmail, Live, or Xbox)
- The app must be reachable at a public URL (needed for the OAuth callback)

### 1 – Register the app in Azure

1. Go to [portal.azure.com](https://portal.azure.com) and sign in with your Microsoft account.
2. Navigate to **Microsoft Entra ID → App registrations → New registration**.
3. Fill in:
   - **Name:** anything, e.g. `kidstaskmgr`
   - **Supported account types:** *Personal Microsoft accounts only*
   - **Redirect URI:** platform **Web**, value `https://your-public-url/api/todo/callback`
4. Click **Register** and note the **Application (client) ID**.
5. Go to **Certificates & secrets → New client secret**, set an expiry, and copy the **Value** (shown once).
6. Go to **API permissions → Add a permission → Microsoft Graph → Delegated permissions** and add:
   - `Tasks.ReadWrite`
   - `User.Read`

> The two permissions only require user consent during the OAuth flow – no admin approval needed.

### 2 – Set environment variables

Add the three variables to `docker-compose.yml`:

```yaml
environment:
  - MICROSOFT_CLIENT_ID=your-application-client-id
  - MICROSOFT_CLIENT_SECRET=your-client-secret-value
  - APP_URL=https://your-public-url
```

`APP_URL` must match the base of the redirect URI you registered (no trailing slash). Restart the container after changing it.

### 3 – Connect and use

1. Open the app and go to **Settings → Microsoft To-Do**.
2. Click **Connect Microsoft account** and complete the sign-in in the popup.
3. Select which To-Do list to use as the shopping list.
4. A shopping cart icon now appears on meal plan rows that have a recipe URL. Click it to open the ingredient picker, select what you need, and add them to the list.

### Disconnect

Go to **Settings → Microsoft To-Do → Disconnect**. This removes the stored tokens from the database. You can reconnect at any time.

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
