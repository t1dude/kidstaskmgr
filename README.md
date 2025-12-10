# kidstaskmgr

En oppgavestyringssystem for barn og foreldre.

## Funksjoner

- **Barneoversikt**: Barn kan se sine oppgaver, oppnådde oppgaver, og statistikk
- **Admin-panel**: Foreldre kan administrere oppgaver og følge med på barnas fremgang
- **Kalenderintegrasjon**: Hendelser fra en delt kalender vises automatisk
- **Supabase Database**: Alle data lagres sikkert i Supabase

## Komme i gang

### Forutsetninger

- Node.js 18 eller nyere
- npm eller yarn
- En Supabase-konto (gratis tier er tilstrekkelig)

### Steg 1: Opprett Supabase-prosjekt

1. **Opprett en konto hos Supabase**
   - Gå til [https://supabase.com](https://supabase.com)
   - Klikk på "Start your project"
   - Registrer deg med GitHub, Google, eller e-post

2. **Opprett et nytt prosjekt**
   - Klikk på "New project" i dashboard
   - Gi prosjektet et navn (f.eks. "kidstaskmgr")
   - Sett et sterkt database-passord (lagre dette sikkert!)
   - Velg en region nærmest deg (f.eks. "West EU (Frankfurt)" for Norge)
   - Klikk "Create new project"
   - Vent 1-2 minutter mens databasen settes opp

3. **Hent API-nøkler**
   - Når prosjektet er klart, gå til "Settings" → "API"
   - Du vil se følgende informasjon:
     - **Project URL**: (f.eks. `https://xxxxx.supabase.co`)
     - **API Keys** → **anon public**: (en lang streng som starter med `eyJ...`)
   - Disse nøklene trenger du i neste steg

### Steg 2: Konfigurer miljøvariabler

1. **Kopier eksempel-filen**
   ```bash
   cp .env .env.local
   ```

2. **Rediger `.env.local` med dine verdier**

   Åpne filen og erstatt med dine verdier fra Supabase:
   ```
   VITE_SUPABASE_URL=https://xxxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

### Steg 3: Installer avhengigheter

```bash
npm install
```

### Steg 4: Kjør setup-script

Kjør setup-scriptet for å verifisere at alt er konfigurert riktig:

```bash
npm run setup
```

Dette scriptet vil:
- Sjekke at alle miljøvariabler er satt
- Teste tilkoblingen til Supabase
- Verifisere at migrasjonene er kjørt
- Gi deg klare instruksjoner hvis noe mangler

### Steg 5: Kjør migrasjoner

Hvis du ikke har kjørt migrasjonene ennå, må du gjøre det manuelt via Supabase Dashboard:

1. Gå til Supabase Dashboard → "SQL Editor"
2. Åpne filen `supabase/migrations/20251208105657_create_task_tracker_schema.sql`
3. Kopier innholdet og lim det inn i SQL Editor
4. Klikk "Run"
5. Gjenta for `supabase/migrations/20251209143008_add_calendar_settings.sql`
6. Gjenta for `supabase/migrations/20251209144357_update_calendar_settings_to_ical.sql`

Alternativt, hvis du har Supabase CLI installert:
```bash
supabase db push
```

### Steg 6: Start utviklingsserver

```bash
npm run dev
```

Applikasjonen vil nå kjøre på `http://localhost:5173`

### Steg 7: Opprett første bruker

1. Gå til Supabase Dashboard → "Table Editor" → "users"
2. Klikk "Insert row"
3. Fyll inn:
   - **name**: Barnets navn
   - **pin_code**: En 4-sifret PIN-kode (f.eks. "1234")
   - **is_admin**: false (eller true for admin-bruker)
   - **total_points**: 0
4. Klikk "Save"

Nå kan du logge inn med navnet og PIN-koden!

## Database

Prosjektet bruker Supabase for datalagring:

- **tasks**: Oppgaver med beskrivelse, poeng, og status
- **users**: Brukerinformasjon for barn
- **completed_tasks**: Historikk over fullførte oppgaver
- **calendar_settings**: Lagrer iCal kalender-URL

### Kalender-URL

Kalender-URL-en lagres i Supabase-tabellen `calendar_settings` i kolonnen `ical_url`. Denne URL-en er en hemmelig iCal-lenke som kan hentes fra Google Calendar, Outlook eller andre kalendertjenester. Admin kan oppdatere denne URL-en gjennom admin-panelet.

## Teknologi

- React + TypeScript
- Vite
- Tailwind CSS
- Supabase
- Express backend for kalenderintegrasjon

## Feilsøking

### "Failed to fetch" eller tilkoblingsfeil

- Sjekk at miljøvariablene i `.env.local` er riktig satt
- Verifiser at Supabase-prosjektet ditt kjører
- Sjekk at URL-en ikke har ekstra mellomrom eller tegn

### Migrasjonene kjører ikke

- Logg inn på Supabase Dashboard
- Gå til "SQL Editor" og kjør migrasjonsfilene manuelt

### Kan ikke logge inn

- Sjekk at du har opprettet en bruker i `users`-tabellen
- Verifiser at PIN-koden er riktig
- Husk at PIN-koder lagres som tekst, ikke tall

## Bidra

Pull requests er velkomne! For større endringer, vennligst åpne en issue først for å diskutere hva du vil endre.
