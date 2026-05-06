# kidstaskmgr

En familieapp for ukeplanlegging som kjører helt lokalt på din maskin.

## Funksjoner

- **Barneoversikt**: Barn kan se sine oppgaver, oppnådde oppgaver, og statistikk
- **Intelligent motivasjonssystem**: Smart tipssystem som veileder barn gjennom uken
- **Admin-panel**: Foreldre kan administrere oppgaver og følge med på barnas fremgang
- **Kalenderintegrasjon**: Hendelser fra en delt kalender vises automatisk
- **Middagsplanlegger**: Planlegg ukens middager med automatiske mat-emojier basert på navn
- **Oppskriftsinspirarsjon**: Søk etter oppskrifter fra matprat.no direkte i appen og legg til i middagslisten
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

### Alternativ 3: Cosmos Cloud

For å kjøre applikasjonen på en hjemmeserver med Cosmos Cloud, se detaljert guide i [COSMOS.md](COSMOS.md).

Cosmos gir deg:
- Automatisk HTTPS og sertifikathåndtering
- Enkel container-administrasjon via web-UI
- Integrert backup-løsninger
- Autentisering og sikkerhet

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
   - Kalenderhendelser de neste 7 dagene vil vises automatisk på startsiden
   - Bruk **oppdater-knappen** (↻) i kalender-panelet for å hente nye hendelser manuelt

### Middagsplanlegger

1. **Legg til middager i listen**
   - Gå til Admin-panelet → **Måltider**
   - Skriv inn navn på middager (f.eks. Taco, Pasta bolognese, Laks)
   - Emojier settes automatisk basert på navn: 🌮 🍕 🍝 🐟 🍗 🍔 osv.

2. **Hent oppskriftsinspirarsjon**
   - Under måltidslisten, bruk søkefeltet til å søke på ingredienser eller retttype (f.eks. "kylling", "suppe", "grillmat")
   - Henter oppskrifter direkte fra matprat.no (4000+ oppskrifter, cachet i 24t)
   - Klikk **Legg til** på et oppskriftskort for å legge det til i middagslisten
   - Lenker til godt.no, Trines matblogg, Gladkokken, MENY og REMA 1000 for videre inspirasjon

3. **Planlegg ukens middager**
   - På startsiden vises middagsplanen ved siden av kalenderen
   - Velg middag for hver ukedag fra nedtrekkslisten
   - Dagens dag er fremhevet
   - Middager hentet fra oppskrifter viser et oransje lenke-ikon – trykk for å åpne oppskriften
   - Klikk **blyant-ikonet** (✏️) for å gå direkte til Måltider-innstillingene

## Database

Prosjektet bruker SQLite for all datalagring:

- **children**: Barneprofiler med navn, farge og avatar
- **tasks**: Oppgaver med beskrivelse, målantall og ikon
- **task_completions**: Fullførte oppgaver per barn og uke
- **calendar_settings**: iCal kalender-URL
- **meals**: Liste over tilgjengelige middager
- **meal_plan**: Ukesplan med middag per dato

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

### v1.5.0 - Sikkerhet og autentisering (2026-05-06)

**Nye sikkerhetsfunksjoner:**
- **Admin PIN-kode**: Innstillinger krever nå PIN-kode før man får tilgang. Standard PIN er `1234` – endre den i `docker-compose.yml` via `ADMIN_PIN`-variabelen
- **Sesjonstoken**: Etter innlogging utstedes et 8-timers sesjonstoken (lagret i `sessionStorage`); barnas oppgaveregistrering krever ikke innlogging
- **Rate limiting**: Maks 200 API-kall per 15 min (generelt), maks 10 innloggingsforsøk per 15 min
- **Sikkerhetshoder**: `helmet.js` legger til CSP, HSTS og andre HTTP-sikkerhetshoder
- **SSRF-beskyttelse**: iCal-URLer valideres mot private/lokale IP-adresser før lagring
- **Innholdsgrense**: API-body begrenset til 16 KB

**Konfigurasjon for produksjon:**
Endre PIN i `docker-compose.yml`:
```yaml
environment:
  - ADMIN_PIN=ditt_hemmelige_passord
```

### v1.4.2 - Avhengighetsoppdateringer (2026-05-06)

**Oppdaterte pakker (minor/patch):**
- `better-sqlite3`: 12.6.2 → 12.9.0
- `dotenv`: 17.2.3 → 17.4.2
- `esbuild`: 0.27.2 → 0.28.0
- `node-ical`: 0.25.0 → 0.26.1
- `tsx`: 4.7.0 → 4.21.0
- `typescript-eslint`: 8.54.0 → 8.59.2
- `autoprefixer`: 10.4.24 → 10.5.0
- `postcss`: 8.5.6 → 8.5.14
- `eslint-plugin-react-refresh`: 0.5.0 → 0.5.2
- `@types/better-sqlite3`: 7.6.8 → 7.6.13
- `@types/cors`: 2.8.17 → 2.8.19

**Ikke oppdatert (major-hopp med breaking changes):**
- React 18 → 19, Express 4 → 5, Tailwind CSS 3 → 4, TypeScript 5 → 6, Vite 7 → 8

### v1.4.1 - Mørk modus i barneoversikt og ny tittel (2026-05-05)

**Forbedringer:**
- Mørk modus virker nå også når man er inne på et barns oppgaveliste
- Overskriften på forsiden er endret fra «Ukeoppgaver» til «Ukeplan for familien»

### v1.4.0 - Generelt-fane og funksjonsstyring (2026-05-05)

**Nye funksjoner:**
- Ny «Generelt»-fane i innstillinger – åpnes automatisk når man trykker på tannhjulet
- Mørk modus-toggle direkte i innstillinger (oppdateres umiddelbart)
- Funksjonsstyring: slå av/på Oppgaveliste, Kalender og Middagsplanlegging individuelt
- Deaktiverte funksjoner skjules fra forsiden; panelene tar full bredde hvis bare én er aktiv

**Tekniske endringer:**
- `appFeatures`-nøkkel i localStorage lagrer aktive funksjoner
- Fikset bug hvor tannhjul-knappen sendte `MouseEvent` som fane-argument i stedet for å bruke default

### v1.3.1 - Mørk modus i innstillinger (2026-05-05)

**Forbedringer:**
- Mørk modus virker nå fullt ut også inne på innstillinger (Admin-panelet)
- Alle faner (Oppgaver, Barn, Kalender, Måltider) bruker nå korrekte farger i mørk modus
- Bakgrunner, skjemafelt, knapper, lister og oppskriftskort tilpasser seg temaet

### v1.3.0 - Oppskriftsinspirarsjon (2026-05-05)

**Nye funksjoner:**
- Oppskriftssøk fra matprat.no direkte i Måltider-innstillingene
- Søk på ingredienser eller retttype – henter fra over 4000 oppskrifter
- Oppskriftskort med bilde, vanskelighetsgrad og tilberedningstid
- «Legg til»-knapp per kort legger middag til i listen, med bekreftelse
- Lenker til godt.no, Trines matblogg, Gladkokken, MENY og REMA 1000
- Oransje lenke-ikon i ukesplanen på middager lagt til fra oppskrift
- Trykk på lenke-ikonet for å åpne oppskriften på matprat.no

**Tekniske endringer:**
- `recipe_url`-kolonne på `meals`-tabellen (automatisk migrering)
- `/api/meal-inspiration`-endepunkt: laster sitemap fra matprat.no, cacher i 24t, filtrerer på søkeord og henter JSON-LD parallelt
- Fikset dropdown-alignment i ukesplanen (fast bredde uavhengig av lenke-ikon)

### v1.2.0 - Middagsplanlegger (2026-05-05)

**Nye funksjoner:**
- Middagsplanlegger på startsiden ved siden av kalenderen (50/50 layout)
- Legg til og administrer liste over middager under Innstillinger → Måltider
- Velg middag for hver ukedag direkte fra forsiden
- Automatiske mat-emojier basert på middagsnavnet (taco 🌮, pizza 🍕, pasta 🍝, fisk 🐟, osv.)
- Blyant-knapp på middagsplan-panelet tar deg direkte til Måltider-innstillingene
- Oppdater-knapp på kalender-panelet for manuell refresh med animasjon
- Dagens dag fremhevet i middagsplanen

**Tekniske endringer:**
- Nye DB-tabeller: `meals` og `meal_plan`
- 6 nye API-endepunkter for måltider og ukesplan
- `initialTab`-prop på AdminView for direktenavigering til spesifikk fane

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
