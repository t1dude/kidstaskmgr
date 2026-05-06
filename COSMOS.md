# Kjøre appen i Cosmos Cloud

## Steg 1: Bygg Docker-image på serveren

Koble til serveren via SSH og kjør:

```bash
git clone https://github.com/t1dude/kidstaskmgr.git
cd kidstaskmgr
docker build -t kidstaskmgr:latest .
```

Dette tar ca. 1–2 minutter første gang.

## Steg 2: Importer cosmos-compose.json

1. Logg inn i Cosmos
2. Gå til **Apps** → **New app** → **Compose**
3. Last opp eller lim inn innholdet fra `cosmos-compose.json` (ligger i prosjektmappen)
4. Cosmos ber deg fylle inn **Admin PIN-kode** – endre fra `1234` til noe du velger selv
5. Velg et domene-/vertsnavn for appen (f.eks. `ukeplan.dinserver.no`)
6. Klikk **Create** – Cosmos setter opp container, volume og reverse proxy automatisk

## Sikkerhet etter oppsett

Appen har innebygd PIN-beskyttelse:
- **Admin-panelet** krever alltid PIN
- For å beskytte hele appen (anbefalt siden kalenderen vises på startsiden):
  > Innstillinger → Generelt → Sikkerhet → «Krev PIN for startsiden»

## Backup av data

All data ligger i et Docker volume (`{ServiceName}-data`). Legg til dette i Cosmos' backup-oppsett, eller ta manuell backup:

```bash
docker run --rm -v kidstaskmgr-data:/data -v $(pwd):/backup alpine \
  tar czf /backup/kidstaskmgr-backup-$(date +%Y%m%d).tar.gz /data
```

## Oppdatering

```bash
cd kidstaskmgr
git pull
docker build -t kidstaskmgr:latest .
```

Deretter restart containeren i Cosmos UI.

## Feilsøking

```bash
docker logs kidstaskmgr        # se loggene
curl http://localhost:3001/health  # sjekk at API-et svarer
```
