🇳🇴 [Norsk](COSMOS.no.md)

# Running the app in Cosmos Cloud

The Docker image is built automatically and published to GitHub Container Registry every time the code is updated.

## Step 1: Import cosmos-compose.json

1. Log in to Cosmos
2. Go to **Apps** → **New app** → **Compose**
3. Upload or paste the contents of `cosmos-compose.json`
4. Cosmos will ask you to enter an **Admin PIN** — change it from `1234` to something of your choice
5. Choose a domain name for the app (e.g. `weeklyplan.yourserver.com`)
6. Click **Create** — Cosmos downloads the image and sets up the container, volume, and reverse proxy

> **First time only:** After the GitHub Action has run for the first time, go to  
> **github.com → Packages → kidstaskmgr → Package settings** and set the package to **Public**  
> so Cosmos can pull it without authentication.

## Security after setup

- The **admin panel** always requires a PIN
- To protect the entire app (recommended since the calendar is visible on the home screen):  
  Settings → General → Security → "Require PIN for home screen"

## Updating

Push to the `main` branch → GitHub builds a new image automatically → Cosmos pulls and restarts the container automatically (auto-update is enabled in `cosmos-compose.json`).

## Backing up data

All data lives in the Docker volume `{ServiceName}-data`. Add it to Cosmos' backup configuration, or take a manual backup:

```bash
docker run --rm -v ukeplan-data:/data -v $(pwd):/backup alpine \
  tar czf /backup/kidstaskmgr-$(date +%Y%m%d).tar.gz /data
```

## Troubleshooting

```bash
docker logs ukeplan          # view logs (replace with your container name)
curl http://localhost:3001/health
```
