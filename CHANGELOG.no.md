🇬🇧 [English](CHANGELOG.md)

# Endringslogg

## v1.8.1 – Forbedringer i matplanen (2026-05-07)
- Nullstill uke sletter nå også matplanen for uken
- Mat-emoji fjernet fra middagsrader slik at måltidsnavnet får mer plass
- Valgt måltid vises med halvfet tekst og sterkere farge; dager uten middagsvalg vises i dempet grå

## v1.8.0 – PWA-installasjonsmelding (2026-05-07)
- Banner på mobil oppfordrer iOS- og Android-brukere til å legge appen til på hjemskjermen
- iOS: viser instruksjon for Del → «Legg til på hjemskjermen»
- Android: viser manuell instruksjon (Chrome-meny → Legg til på startskjermen) umiddelbart; oppgraderes til én-klikks installasjon hvis Chrome sender installasjonshendelse
- Banneret avvises i 30 dager; vises ikke hvis appen allerede er installert

## v1.7.2 – Porsjonsfikser (2026-05-07)
- Fiks: ingrediensmodalen viste «4 porsjoner porsjoner» – enheten ligger allerede i oppskriftsdataene, så den ekstra etiketten er fjernet

## v1.7.1 – Porsjonsinformasjon i oppskrift (2026-05-07)
- Ingrediensmodalen viser nå antall porsjoner oppskriften er beregnet for på en egen linje, slik at du vet hva mengdene gjelder

## v1.7.0 – Microsoft To-Do handlelisteintegrasjon (2026-05-07)
- Legg ingredienser fra Matprat-oppskrifter direkte i en delt Microsoft To-Do-liste
- OAuth 2.0 autorisasjonskode-flyt — koble til én gang per husstand, ingen innlogging per enhet
- Ingredienser hentes fra Matprat JSON-LD oppskrift-schema (ingen skraping)
- Ingrediens-modal med avkrysningsbokser per ingrediens: velg/fjern før du legger til i listen
- Handlekurv-knapp vises på middagsrader med oppskrifts-URL når To-Do er koblet til
- Admin-innstillinger: koble til/fra Microsoft-konto, velg hvilken To-Do-liste som brukes
- Token-oppdatering håndteres automatisk på serversiden; tokens lagres i app-databasen
- Nye miljøvariabler: `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `APP_URL` (se docker-compose.yml)
- Nye endepunkter: `/api/todo/*`, `/api/recipe-ingredients`

## v1.6.1 – Mobilfikser og sesjonsvalidering (2026-05-07)
- Fiks: oppgaver, barn og måltider ble stille ikke lagret på mobil når sesjonen var utløpt – API-kall kaster nå feil ved ikke-OK svar og viser en feilmelding
- Fiks: utløpte sesjoner oppdages nå ved oppstart – gamle tokens ryddes bort før brukeren går inn i admin-panelet, slik at PIN-dialogen vises med en gang fremfor etter mislykkede lagringsforøk
- Nytt `GET /api/auth/validate`-endepunkt brukes til å verifisere lagret token ved oppstart
- Lagt til `sessionExpired`- og `saveFailed`-feilmeldinger på begge språk

## v1.6.0 – Norsk/engelsk språkstøtte (2026-05-06)
- Språkveksler-knapp (🇬🇧/🇳🇴) i toppmenyen på forsiden og i admin-panelet
- Alle UI-strenger, dag-/månedsnavn og motivasjonsmeldinger for tips er fullt oversatt
- Valgt språk lagres i `localStorage`

## v1.5.4 – Feilrettinger (2026-05-06)
- Fiks: innstillinger (funksjonsvekslere) ble ikke lagret på mobiltelefon – skyldtes at `sessionStorage` slettes når mobilnettlesere avslutter bakgrunnskategorier; byttet til `localStorage`
- Fiks: Cosmos auto-update var deaktivert (`cosmos-auto-update`-etiketten var satt til `"false"`)

## v1.5.3 – Familiesbeskjeder, emoji-velger og mobilforbedringer (2026-05-06)
- Viktige beskjeder på forsiden – legg igjen notater til familien, fjern dem når de er lest
- Beskjeder vises under middagsplanen i høyre kolonne (ikke full bredde under alt)
- Emoji-velger for barns avatarer (44 emojier: ansikter, dyr og symboler)
- Mobiloppsett-fikser på alle sider: kort flyter ikke lenger utenfor skjermen
- Progressiv PIN-sperring: 3 feil → 1 min, 6 → 5 min, 10 → 30 min, 15+ → 2 timer
- Funksjonsvekslere inkluderer nå viktige beskjeder

## v1.5.1 – Cosmos/reverse proxy-kompatibilitet (2026-05-06)
- Express serverer nå frontend statisk – appen bruker kun én port (`3001`)
- API-URL er relativ (`/api`) og fungerer bak enhver reverse proxy
- Vite dev-server proxyer `/api`-kall til `localhost:3001` automatisk
- Ny COSMOS.md med forenklet oppsettguide

## v1.5.0 – Sikkerhet og autentisering (2026-05-06)
- Admin PIN-kode via `ADMIN_PIN`-miljøvariabel (standard `1234`)
- Valgfri PIN-beskyttelse for startsiden (anbefalt ved internetteksponering)
- 8-timers sesjonstoken etter innlogging
- Rate limiting: 200 req/15 min generelt, 10 forsøk/15 min for innlogging
- `helmet.js` for HTTP-sikkerhetshoder (CSP, HSTS, m.m.)
- SSRF-beskyttelse: iCal-URLer valideres mot private IP-adresser
- API-body begrenset til 16 KB

## v1.4.2 – Avhengighetsoppdateringer (2026-05-06)
- `better-sqlite3` 12.6.2→12.9.0, `dotenv` 17.2.3→17.4.2, `esbuild` 0.27.2→0.28.0
- `node-ical` 0.25.0→0.26.1, `tsx` 4.7.0→4.21.0, `typescript-eslint` 8.54.0→8.59.2
- Ikke oppdatert (major med breaking changes): React 18→19, Express 4→5, Tailwind 3→4

## v1.4.1 – Mørk modus i barneoversikt og ny tittel (2026-05-05)
- Mørk modus fungerer nå i barnets oppgaveliste
- Tittel endret fra «Ukeoppgaver» til «Ukeplan for familien»

## v1.4.0 – Generelt-fane og funksjonsstyring (2026-05-05)
- Ny «Generelt»-fane i innstillinger (åpnes ved tannhjul-klikk)
- Mørk modus-toggle i innstillinger
- Slå av/på Oppgaveliste, Kalender og Middagsplanlegging individuelt
- Fikset bug: tannhjul-knappen sendte MouseEvent som fane-argument

## v1.3.1 – Mørk modus i innstillinger (2026-05-05)
- Mørk modus fungerer nå fullt ut i Admin-panelet (alle faner)

## v1.3.0 – Oppskriftsinspirarsjon (2026-05-05)
- Oppskriftssøk fra matprat.no i Måltider-innstillingene (4000+ oppskrifter, cachet 24t)
- Oppskriftskort med bilde, vanskelighetsgrad og tilberedningstid
- Oransje lenke-ikon i ukesplanen for middager lagt til fra oppskrift
- `recipe_url`-kolonne på `meals`-tabellen (automatisk migrering)

## v1.2.0 – Middagsplanlegger (2026-05-05)
- Middagsplanlegger på startsiden ved siden av kalenderen
- Administrer middagsliste under Innstillinger → Måltider
- Automatiske mat-emojier basert på navn (🌮🍕🍝🐟🍗🍔 osv.)
- Oppdater-knapp på kalender-panelet

## v1.1.1 – Sikkerhetsoppdateringer (2026-02-04)
- Oppdatert alle avhengigheter, 0 sårbarheter
- Vite 5.4.8→7.3.1 (fikset esbuild-sikkerhetshull)

## v1.1.0 – Intelligent motivasjonssystem (2026-02-04)
- Tipssystem som veileder barn gjennom uken basert på ukedag og progresjon
- Meldingsikon med badge på barnekort
- Ungdomsvennlig språk tilpasset 12–16 år

## v1.0.0 – Første versjon (2026)
- Barneprofiler, oppgavestyring, fremdriftssporing
- Admin-panel, kalenderintegrasjon (iCal), SQLite, Docker, mørk modus
