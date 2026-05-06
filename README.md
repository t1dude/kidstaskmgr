# kidstaskmgr

En familieapp for ukeplanlegging – oppgaver, kalender og middagsplan på én side.

## Funksjoner

- Ukentlige oppgaver med fremdriftssporing per barn
- Kalenderintegrasjon via iCal (Google Calendar, Outlook, m.fl.)
- Middagsplanlegger med oppskriftsinspirarsjon fra matprat.no
- Motivasjonssystem med smarte tips til barna
- Mørk modus, funksjonsstyring og PIN-beskyttelse
- SQLite-database – all data lagres lokalt, ingen eksterne tjenester

## Komme i gang

### Docker (anbefalt)

```bash
docker-compose up -d
```

Åpne `http://localhost:3001`. Data lagres i en Docker volume og beholdes ved omstart.

```bash
docker-compose down      # stopp
docker-compose down -v   # stopp og slett all data
```

### Cosmos Cloud (hjemmeserver)

Se [COSMOS.md](COSMOS.md) for oppsett bak reverse proxy med automatisk HTTPS.

### Lokal utvikling

```bash
npm install
npm run dev:server   # Express API på port 3001
npm run dev          # Vite frontend på port 5173 (proxyer /api automatisk)
```

## Sikkerhet

Appen har innebygd PIN-beskyttelse. **Endre PIN før du publiserer på internett:**

```yaml
# docker-compose.yml
environment:
  - ADMIN_PIN=ditt_hemmelige_passord
```

Admin-panelet krever alltid PIN. For å beskytte hele appen (anbefalt ved internetteksponering siden kalenderen vises på startsiden):

> Innstillinger → Generelt → Sikkerhet → «Krev PIN for startsiden»

Sesjonen varer 8 timer per nettleserfane.

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

## Endringslogg

Se [CHANGELOG.md](CHANGELOG.md).

## Lisens

Privat prosjekt for familiebruk.
