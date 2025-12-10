# kidstaskmgr

En oppgavestyringssystem for barn og foreldre.

## Funksjoner

- **Barneoversikt**: Barn kan se sine oppgaver, oppnådde oppgaver, og statistikk
- **Admin-panel**: Foreldre kan administrere oppgaver og følge med på barnas fremgang
- **Kalenderintegrasjon**: Hendelser fra en delt kalender vises automatisk
- **Supabase Database**: Alle data lagres sikkert i Supabase

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
