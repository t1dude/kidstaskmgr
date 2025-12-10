# kidstaskmgr

En selvdrevet oppgavestyringssystem for barn og foreldre som kjører helt lokalt på din maskin.

## Funksjoner

- **Barneoversikt**: Barn kan se sine oppgaver, oppnådde oppgaver, og statistikk
- **Admin-panel**: Foreldre kan administrere oppgaver og følge med på barnas fremgang
- **Kalenderintegrasjon**: Hendelser fra en delt kalender vises automatisk
- **SQLite Database**: Alle data lagres lokalt på din maskin - ingen eksterne tjenester nødvendig
- **Docker-basert**: Kjør hele applikasjonen i en container uten installasjoner

## Komme i gang

### Alternativ 1: Docker (anbefalt)

Dette er den enkleste måten å kjøre applikasjonen uten noen eksterne avhengigheter.

#### Forutsetninger

- Docker Desktop installert på maskinen din
- Ingen andre tjenester som bruker port 3001 og 4173

#### Start applikasjonen

1. **Bygg og start containeren:**
   ```bash
   docker-compose up -d
   ```

2. **Åpne applikasjonen:**
   - Gå til `http://localhost:4173` i nettleseren din
   - Appen kjører nå helt lokalt på maskinen din

3. **Stopp applikasjonen:**
   ```bash
   docker-compose down
   ```

#### Data og persistering

- All data lagres i en SQLite-database inne i en Docker volume
- Data beholdes selv når du stopper og starter containeren
- For å fjerne all data og starte helt på nytt:
  ```bash
  docker-compose down -v
  ```

### Alternativ 2: Lokal utvikling

Hvis du vil utvikle eller endre koden, kan du kjøre applikasjonen lokalt.

#### Forutsetninger

- Node.js 18 eller nyere
- npm eller yarn

#### Installasjon

1. **Installer avhengigheter:**
   ```bash
   npm install
   ```

2. **Start backend-serveren:**
   ```bash
   npm run dev:server
   ```

3. **Start frontend (i et nytt terminalvindu):**
   ```bash
   npm run dev
   ```

4. **Åpne applikasjonen:**
   - Frontend: `http://localhost:5173`
   - Backend API: `http://localhost:3001`

## Bruk av applikasjonen

### Første gangs oppsett

1. **Åpne Admin-panelet**
   - Klikk på "Admin"-knappen på startsiden

2. **Legg til barn**
   - Klikk "Legg til barn"
   - Velg navn, emoji-avatar og farge
   - Gjenta for alle barna i familien

3. **Opprett oppgaver**
   - Klikk "Legg til oppgave"
   - Gi oppgaven et navn og beskrivelse
   - Sett målantall (hvor mange ganger oppgaven skal utføres i uken)
   - Velg et ikon

### Daglig bruk

1. **Barn logger inn**
   - Velg barnets profil fra startsiden
   - Klikk på oppgavene for å registrere fullføring
   - Fremdriftslinjer viser ukens status

2. **Admin-funksjoner**
   - Se all statistikk for alle barn
   - Rediger eller slett oppgaver
   - Nullstill uken for å starte på nytt

### Kalenderintegrasjon

1. **Konfigurer kalender**
   - Gå til Admin-panelet
   - Lim inn en iCal-lenke fra Google Calendar, Outlook, eller annen kalendertjeneste
   - Kalenderhendelser de neste 7 dagene vil vises automatisk på barnas startsider

## Database

Prosjektet bruker SQLite for all datalagring:

- **children**: Barneprofiler med navn, farge og avatar
- **tasks**: Oppgaver med beskrivelse, målantall og ikon
- **task_completions**: Fullførte oppgaver per barn og uke
- **calendar_settings**: iCal kalender-URL

All data lagres lokalt på din maskin - ingen data sendes til eksterne tjenester.

## Teknologi

- React + TypeScript
- Vite
- Tailwind CSS
- SQLite (via better-sqlite3)
- Express backend
- node-ical for kalenderintegrasjon
- Docker for enkel deployment

## Feilsøking

### Port-konflikter

Hvis du får en feilmelding om at porter er opptatt:

```bash
# På Windows
netstat -ano | findstr :3001
netstat -ano | findstr :4173

# På Mac/Linux
lsof -i :3001
lsof -i :4173
```

### Containeren starter ikke

Sjekk loggene:
```bash
docker-compose logs -f
```

### Nullstill alt

For å starte helt på nytt:
```bash
docker-compose down -v
docker system prune -a
docker-compose up -d --build
```

## Bidra

Pull requests er velkomne! For større endringer, vennligst åpne en issue først for å diskutere hva du vil endre.

## Lisens

Dette er et privat prosjekt for familiebruk.
