🇬🇧 [English](README.md)

# kidstaskmgr

En familieapp for ukeplanlegging – oppgaver, kalender og middagsplan på én side.

## Funksjoner

- Ukentlige oppgaver med fremdriftssporing per barn og motiverende tips
- Kalenderintegrasjon via iCal (Google Calendar, Outlook, m.fl.)
- Middagsplanlegger med oppskriftsinspirarsjon fra matprat.no
- Viktige beskjeder til familien direkte på forsiden
- Mørk modus, funksjonsstyring og PIN-beskyttelse
- Støtte for norsk og engelsk språk
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

Sesjonstokenet varer i 8 timer og lagres i `localStorage`.

Feilede innloggingsforsøk gir progressive sperringer: 3 feil → 1 min, 6 → 5 min, 10 → 30 min, 15 → 2 timer.

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

Se [CHANGELOG.no.md](CHANGELOG.no.md).

## Lisens

Privat prosjekt for familiebruk.
