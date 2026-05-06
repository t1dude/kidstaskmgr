# Kjøre appen i Cosmos Cloud

Appen eksponerer én enkelt port (`3001`) som håndterer både API og frontend. Det gjør den enkel å sette opp bak Cosmos' reverse proxy.

## Forutsetninger

- Cosmos Cloud installert og kjørende på hjemmeserveren din
- Tilgang til serveren via SSH eller Cosmos-terminalen

## Oppsett

### 1. Bygg Docker-image på serveren

```bash
# Klon eller kopier prosjektet til serveren
git clone https://github.com/t1dude/kidstaskmgr.git
cd kidstaskmgr

# Bygg imaget
docker build -t kidstaskmgr:latest .
```

Eller bygg lokalt og overfør:

```bash
# Lokalt
docker build -t kidstaskmgr:latest .
docker save kidstaskmgr:latest | gzip > kidstaskmgr.tar.gz

# Kopier til server
scp kidstaskmgr.tar.gz bruker@server:/tmp/

# På serveren
docker load < /tmp/kidstaskmgr.tar.gz
```

### 2. Opprett applikasjon i Cosmos

1. Logg inn på Cosmos-grensesnittet
2. Gå til **Apps** > **Add App** > **Custom Container**

#### Container Settings:
- **Image**: `kidstaskmgr:latest`
- **Container Name**: `kidstaskmgr`
- **Restart Policy**: `unless-stopped`

#### Network / Ports:
- **Intern port**: `3001`  
  *(Cosmos setter opp reverse proxy mot denne porten)*

#### Environment Variables:
| Variabel | Verdi | Beskrivelse |
|----------|-------|-------------|
| `NODE_ENV` | `production` | Node-miljø |
| `DB_PATH` | `/app/data/tasks.db` | Sti til databasefilen |
| `PORT` | `3001` | API-port |
| `ADMIN_PIN` | `ditt_valgte_passord` | PIN for admin-panelet – **endre dette!** |

#### Volumes:
Kritisk: uten dette volume mister du alle data ved omstart.

- **Container Path**: `/app/data`
- **Host Path**: `/srv/cosmos/volumes/kidstaskmgr/data` (eller annet fast sted)

### 3. Sett opp reverse proxy i Cosmos

1. Gå til **URLs / Proxy** i Cosmos
2. Legg til nytt domene, f.eks. `tasks.dinserver.no`
3. Pek mot container port `3001`
4. Aktiver **HTTPS** – Cosmos håndterer sertifikater automatisk

Appen er nå tilgjengelig på `https://tasks.dinserver.no`.

## Sikkerhet

Appen har innebygd PIN-beskyttelse:

- **Admin-panelet** krever alltid PIN (satt via `ADMIN_PIN`)
- **Startsiden** kan også PIN-beskyttes: gå til innstillinger → Generelt → Sikkerhet → «Krev PIN for startsiden» – anbefalt når appen er åpen på internett siden kalenderen din vises der

Siden kalenderinnhold kan være personlig, anbefales det å aktivere PIN for startsiden når appen er eksponert.

## Backup av database

Databasefilen ligger på `<host-path>/tasks.db`.

**Automatisk backup via Cosmos:**
1. Gå til Cosmos' backup-innstillinger
2. Legg til `/srv/cosmos/volumes/kidstaskmgr/data` i backup-planen

**Manuell backup:**
```bash
cp /srv/cosmos/volumes/kidstaskmgr/data/tasks.db ~/backup/tasks-$(date +%Y%m%d).db
```

## Oppdatering

```bash
cd kidstaskmgr
git pull
docker build -t kidstaskmgr:latest .
```

Deretter restart containeren via Cosmos UI.

## Feilsøking

**Health-sjekk:**
```bash
curl http://localhost:3001/health
```

**Logger:**
```bash
docker logs kidstaskmgr
```

**Database-rettigheter:**
```bash
ls -la /srv/cosmos/volumes/kidstaskmgr/data/
```
