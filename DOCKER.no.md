🇬🇧 [English](DOCKER.md)

# Docker-distribusjon

Denne guiden beskriver kjøring av appen med Docker på din lokale maskin.

For hjemmeserver-oppsett bak reverse proxy, se [COSMOS.md](COSMOS.md) / [COSMOS.no.md](COSMOS.no.md).

## Forutsetninger

- Docker Desktop installert
- Port 3001 ledig

## Kom i gang

```bash
docker-compose up -d
```

Åpne `http://localhost:3001`. Appen kjører på én enkelt port – Express serverer både API og ferdigbygd frontend.

```bash
docker-compose down      # stopp
docker-compose down -v   # stopp og slett all data
```

## Datalagring

All data lagres i et Docker-volume montert på `/app/data`. Det beholdes ved omstart og påvirkes ikke av image-oppdateringer.

## Bygge på nytt etter kodeendringer

```bash
docker-compose down
docker-compose up -d --build
```

## Feilsøking

**Port 3001 er opptatt:**
```bash
# Windows
netstat -ano | findstr :3001
# Mac/Linux
lsof -i :3001
```

**Containeren starter ikke:**
```bash
docker-compose logs -f
```

**Nullstill alt:**
```bash
docker-compose down -v && docker-compose up -d --build
```

## Førstegangsoppsett

1. Åpne `http://localhost:3001`
2. Klikk tannhjulikonet → skriv inn standard PIN (`1234`) → gå til **Barn** og legg til barna dine
3. Gå til **Oppgaver** og legg til ukentlige oppgaver
4. Endre PIN under Innstillinger → Sikkerhet (anbefales på det sterkeste)

## Ukentlig nullstilling

Ved starten av hver uke, gå til admin-panelet og klikk **Nullstill uke** for å fjerne alle fullføringer.
