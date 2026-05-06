🇬🇧 [English](COSMOS.md)

# Kjøre appen i Cosmos Cloud

Docker-imaget bygges automatisk og publiseres til GitHub Container Registry hver gang koden oppdateres.

## Steg 1: Importer cosmos-compose.json

1. Logg inn i Cosmos
2. Gå til **Apps** → **New app** → **Compose**
3. Last opp eller lim inn innholdet fra `cosmos-compose.json`
4. Cosmos ber deg fylle inn **Admin PIN-kode** – endre fra `1234` til noe du velger selv
5. Velg et domenenavn for appen (f.eks. `ukeplan.dinserver.no`)
6. Klikk **Create** – Cosmos laster ned imaget og setter opp container, volume og reverse proxy

> **Første gang:** Etter at GitHub Action har kjørt første gang, må du gå til  
> **github.com → Packages → kidstaskmgr → Package settings** og sette pakken til **Public**  
> slik at Cosmos kan laste den ned uten innlogging.

## Sikkerhet etter oppsett

- **Admin-panelet** krever alltid PIN
- For å beskytte hele appen (anbefalt siden kalenderen vises på startsiden):  
  Innstillinger → Generelt → Sikkerhet → «Krev PIN for startsiden»

## Oppdatering

Push til `main`-grenen → GitHub bygger nytt image automatisk → Cosmos henter og starter containeren på nytt automatisk (auto-update er aktivert i `cosmos-compose.json`).

## Backup av data

All data ligger i Docker-volumet `{ServiceName}-data`. Legg til dette i Cosmos' backup-oppsett, eller ta manuell backup:

```bash
docker run --rm -v ukeplan-data:/data -v $(pwd):/backup alpine \
  tar czf /backup/kidstaskmgr-$(date +%Y%m%d).tar.gz /data
```

## Feilsøking

```bash
docker logs ukeplan          # se loggene (bytt ut med ditt containernavn)
curl http://localhost:3001/health
```
