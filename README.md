# kidstaskmgr

En selvdrevet oppgavestyringssystem for barn og foreldre som kjører helt lokalt på din maskin.

## Funksjoner

- **Barneoversikt**: Barn kan se sine oppgaver, oppnådde oppgaver, og statistikk
- **Intelligent motivasjonssystem**: Smart tipssystem som veileder barn gjennom uken
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
   - **Meldingsikon**: Et blått ikon med badge vises når det finnes tips til barnet

2. **Motivasjonssystemet**
   - **Ingen tips på mandag**: Uken starter rolig uten press
   - **Gradvis økning**: Fra tirsdag vises 1-3 tips basert på progresjon
   - **Smart prioritering**: Tips fokuserer på oppgaver som:
     - Ikke er startet ennå
     - Ligger bak etter forventet fremdrift
     - Haster når helgen nærmer seg
   - **Ingen tips ved god progresjon**: Hvis barnet ligger over 85% ukesmål, vises ingen tips
   - **Ungdomsvennlig språk**: Motiverende meldinger tilpasset 12-16 år

3. **Admin-funksjoner**
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

## Versjonshistorikk

### v1.1.1 - Sikkerhetsoppdateringer (2026-02-04)

**Sikkerhet:**
- Oppdatert alle avhengigheter til nyeste stabile versjoner
- Fikset alle kjente sikkerhetssårbarheter
- Kritiske oppdateringer:
  - Vite: 5.4.8 → 7.3.1 (fikset esbuild sikkerhetshull)
  - esbuild: Oppdatert til sikker versjon
  - ESLint: 9.12.0 → 9.39.2 (fikset RegEx DoS-sårbarhet)
  - better-sqlite3: 9.6.0 → 12.6.2
  - Tailwind CSS: 3.4.17 → 3.4.19
  - TypeScript: 5.6.3 → 5.9.3
  - lucide-react: 0.344.0 → 0.563.0
- Sikkerhetsstatus: 0 sårbarheter

### v1.1.0 - Intelligent motivasjonssystem (2026-02-04)

**Nye funksjoner:**
- Implementert smart tipssystem som veileder barn gjennom uken
- Meldingsikon med badge på barnekort viser antall tilgjengelige tips
- Tips vises i pen modal med motiverende meldinger
- Dynamisk tipsalgoritme basert på:
  - Ukedag (ingen tips mandag, gradvis økning)
  - Progresjon mot ukesmål
  - Individuelle oppgavestatus
  - Prioritering av oppgaver som haster
- Tips skjules automatisk ved god progresjon (>85%)
- Ungdomsvennlig språk tilpasset målgruppen 12-16 år
- Balansert miks av oppgavetyper i tipsene

**Tekniske forbedringer:**
- Ny modul: `tipsGenerator.ts` for sentralisert tipslogikk
- Utvidet `TaskWithCompletion` interface
- Forbedret barnekort-layout med meldings-funksjonalitet

### v1.0.0 - Første versjon (2026)

**Grunnleggende funksjoner:**
- Barneprofiler med avatarer og farger
- Oppgavestyring med ukesmål
- Fremdriftssporing per barn og oppgave
- Admin-panel for foreldre
- Kalenderintegrasjon med iCal-støtte
- SQLite database for lokal datalagring
- Docker-basert deployment
- Mørk modus
- Responsivt design

## Bidra

Pull requests er velkomne! For større endringer, vennligst åpne en issue først for å diskutere hva du vil endre.

## Lisens

Dette er et privat prosjekt for familiebruk.
