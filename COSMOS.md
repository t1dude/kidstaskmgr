# Kjøre appen i Cosmos Cloud

Denne guiden viser deg hvordan du kjører Family Task Tracker i Cosmos Cloud på din hjemmeserver.

## Forutsetninger

- Cosmos Cloud installert og kjørende
- Docker installert på serveren din
- Grunnleggende kunnskap om Cosmos-grensesnittet

## Oppsett i Cosmos

### 1. Bygg Docker-image

Først må du bygge Docker-imaget. Dette kan gjøres på to måter:

#### Alternativ A: Bygg på serveren din

Hvis du har tilgang til serveren via SSH:

```bash
# Naviger til prosjektmappen
cd /path/to/family-task-tracker

# Bygg Docker-imaget
docker build -t family-task-tracker:latest .
```

#### Alternativ B: Bygg lokalt og overfør

Hvis du bygger på en annen maskin:

```bash
# Bygg imaget
docker build -t family-task-tracker:latest .

# Lagre imaget til en fil
docker save family-task-tracker:latest > family-task-tracker.tar

# Overfør filen til serveren (via SCP, USB, etc.)
scp family-task-tracker.tar bruker@server:/tmp/

# På serveren: Last inn imaget
ssh bruker@server
docker load < /tmp/family-task-tracker.tar
```

### 2. Opprett applikasjon i Cosmos

1. Logg inn på Cosmos Cloud-grensesnittet
2. Gå til **Servitør** (Servitor) > **Ny applikasjon**
3. Velg **Custom Docker Container**

### 3. Konfigurasjon

#### Container Settings:

- **Image**: `family-task-tracker:latest`
- **Container Name**: `family-task-tracker`
- **Restart Policy**: `unless-stopped`

#### Network Settings:

- **Network Mode**: `Bridge` (standard)
- **Ports**:
  - Host Port: `3001` → Container Port: `3001` (API)
  - Host Port: `4173` → Container Port: `4173` (Web UI)

#### Environment Variables:

```
NODE_ENV=production
DB_PATH=/app/data/tasks.db
PORT=3001
```

#### Volumes:

Det er **kritisk viktig** å mappe et volume for databasen, ellers vil alle data forsvinne når containeren restartes!

- **Type**: Volume eller Bind Mount
- **Container Path**: `/app/data`
- **Host Path**: Velg en passende lokasjon på serveren, f.eks.:
  - `/srv/cosmos/volumes/family-task-tracker/data` (anbefalt for Cosmos)
  - Eller bruk Cosmos' volume-manager til å opprette et navngitt volume

#### Health Check:

Cosmos vil automatisk bruke HEALTHCHECK som er definert i Dockerfile. Hvis du vil overstyre:

- **Command**: `node -e "require('http').get('http://localhost:3001/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"`
- **Interval**: `30s`
- **Timeout**: `3s`
- **Retries**: `3`

### 4. Sikkerhet og tilgang

#### Anbefalt oppsett:

1. **Bruk Cosmos' reverse proxy**:
   - Aktiver HTTPS via Cosmos
   - Sett opp et passende domenenavn (f.eks. `tasks.dinserver.local`)
   - La Cosmos håndtere SSL-sertifikater

2. **Sikkerhetsvurdering**:
   - Appen har **ingen innebygd autentisering**
   - Hvis du eksponerer appen utenfor hjemmenettverket, bør du:
     - Bruke Cosmos' innebygde autentisering
     - Eller sette opp en ekstra autentiseringsløsning
     - Eller kun gi tilgang via VPN

3. **Nettverk**:
   - For kun lokal tilgang: La portene være interne i Cosmos
   - For ekstern tilgang: Bruk Cosmos' secure proxy med autentisering

## Vedlikehold

### Backup av database

Databasefilen ligger i `/app/data/tasks.db` (eller din mappede host-path).

**Automatisk backup med Cosmos**:
1. Gå til Cosmos' backup-innstillinger
2. Legg til volumet/mappen i backup-planen
3. Sett ønsket backup-frekvens

**Manuell backup**:
```bash
# På serveren
cp /srv/cosmos/volumes/family-task-tracker/data/tasks.db /path/to/backup/tasks-$(date +%Y%m%d).db
```

### Oppdatering av appen

Når du har en ny versjon:

```bash
# Bygg nytt image
docker build -t family-task-tracker:latest .

# Stopp containeren i Cosmos
# (via Cosmos UI eller:)
docker stop family-task-tracker

# Fjern gammel container
docker rm family-task-tracker

# Start på nytt fra Cosmos UI
# Cosmos vil automatisk bruke det nye imaget
```

### Overvåking og logging

- **Health endpoint**: `http://localhost:3001/health`
- **Logger**: Se container-logger i Cosmos UI
- **Database-størrelse**: Overvåk størrelsen på `/app/data/tasks.db`

## Feilsøking

### Containeren starter ikke

1. Sjekk logs i Cosmos:
   ```bash
   docker logs family-task-tracker
   ```

2. Verifiser at volumes er korrekt mappet:
   ```bash
   docker inspect family-task-tracker | grep -A 10 Mounts
   ```

### Database-problemer

1. Sjekk at data-mappen eksisterer og har riktige rettigheter:
   ```bash
   ls -la /srv/cosmos/volumes/family-task-tracker/data/
   ```

2. Hvis databasen er korrupt, gjenopprett fra backup:
   ```bash
   cp /path/to/backup/tasks-YYYYMMDD.db /srv/cosmos/volumes/family-task-tracker/data/tasks.db
   # Restart containeren i Cosmos
   ```

### Tilkoblingsproblemer

1. Verifiser at portene er eksponert:
   ```bash
   docker port family-task-tracker
   ```

2. Test health endpoint:
   ```bash
   curl http://localhost:3001/health
   ```

3. Sjekk Cosmos' reverse proxy-innstillinger hvis du bruker et custom domene

## Cosmos-spesifikke fordeler

- **Automatisk SSL**: Cosmos håndterer HTTPS-sertifikater automatisk
- **Enkel oppdatering**: Oppdater via Cosmos UI uten kommandolinje
- **Integrert overvåking**: Se container-status og ressursbruk
- **Backup-integrasjon**: Bruk Cosmos' innebygde backup-løsninger
- **Autentisering**: Legg til sikkerhet via Cosmos' auth-system

## Miljøvariabler (valgfritt)

Hvis du trenger å tilpasse:

| Variabel | Standard | Beskrivelse |
|----------|----------|-------------|
| `NODE_ENV` | `production` | Node miljø |
| `DB_PATH` | `/app/data/tasks.db` | Sti til database-fil |
| `PORT` | `3001` | Port for API-server |

## Sikkerhetsvurdering

Appen er designet for hjemmebruk og har:
- ✅ Kjører som non-root bruker i containeren
- ✅ Ingen external dependencies (bortsett fra valgfri iCal URL)
- ✅ Lokal SQLite-database (ingen ekstern database-tilkobling nødvendig)
- ❌ Ingen innebygd brukerautentisering
- ❌ Ingen kryptering av data i hvile (standard SQLite)

**Anbefaling**: Bruk Cosmos' autentiseringsmekanismer hvis appen skal være tilgjengelig utenfor lokalt nettverk.

## Support

Hvis du har problemer:
1. Sjekk container-logger i Cosmos
2. Verifiser at volumes er korrekt konfigurert
3. Test health endpoint
4. Sjekk at alle porter er korrekt mappet
