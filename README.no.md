🇬🇧 [English](README.md)

# kidstaskmgr

En familieapp for ukeplanlegging – oppgaver, kalender, middagsplan og handleliste på én side.

## Funksjoner

- Ukentlige oppgaver med fremdriftssporing per barn og motiverende tips
- Kalenderintegrasjon via iCal (Google Calendar, Outlook, m.fl.)
- Middagsplanlegger med oppskriftsinspirarsjon fra matprat.no
- Microsoft To-Do-integrasjon – legg ingredienser fra oppskrifter i en delt handleliste
- Viktige beskjeder til familien direkte på forsiden
- Mørk modus, funksjonsstyring og PIN-beskyttelse
- Støtte for norsk og engelsk språk
- SQLite-database – all data lagres lokalt

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

Se [COSMOS.no.md](COSMOS.no.md) for oppsett bak reverse proxy med automatisk HTTPS.

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

## Microsoft To-Do-integrasjon

Med integrasjonen kan du legge ingredienser fra Matprat-oppskrifter direkte i en delt Microsoft To-Do-liste (f.eks. en felles handleliste). Én autorisasjon gjelder hele husstanden – ingen per-enhet-innlogging.

### Forutsetninger

- En gratis, privat Microsoft-konto (Outlook, Hotmail, Live eller Xbox)
- Appen må være tilgjengelig på en offentlig URL (kreves for OAuth-tilbakekalling)

### 1 – Registrer appen i Azure

1. Gå til [portal.azure.com](https://portal.azure.com) og logg inn med din Microsoft-konto.
2. Naviger til **Microsoft Entra ID → App registrations → New registration**.
3. Fyll inn:
   - **Name:** valgfritt, f.eks. `kidstaskmgr`
   - **Supported account types:** *Personal Microsoft accounts only*
   - **Redirect URI:** plattform **Web**, verdi `https://din-offentlige-url/api/todo/callback`
4. Klikk **Register** og noter **Application (client) ID**.
5. Gå til **Certificates & secrets → New client secret**, velg utløpsdato og kopier **Value** (vises bare én gang).
6. Gå til **API permissions → Add a permission → Microsoft Graph → Delegated permissions** og legg til:
   - `Tasks.ReadWrite`
   - `User.Read`

> De to tillatelsene krever bare brukersamtykke under OAuth-flyten – ingen administrator-godkjenning.

### 2 – Sett miljøvariabler

Legg til de tre variablene i `docker-compose.yml`:

```yaml
environment:
  - MICROSOFT_CLIENT_ID=din-application-client-id
  - MICROSOFT_CLIENT_SECRET=din-client-secret-verdi
  - APP_URL=https://din-offentlige-url
```

`APP_URL` må stemme med begynnelsen av redirect-URI-en du registrerte (ingen skråstrek på slutten). Start containeren på nytt etter endringen.

### 3 – Koble til og bruk

1. Åpne appen og gå til **Innstillinger → Microsoft To-Do**.
2. Klikk **Koble til Microsoft-konto** og fullfør innloggingen i popup-vinduet.
3. Velg hvilken To-Do-liste som skal brukes som handleliste.
4. Et handlekurv-ikon vises nå på middagsrader med en oppskrifts-URL. Klikk for å åpne ingrediensvelgeren, merk det du trenger og legg til i listen.

### Koble fra

Gå til **Innstillinger → Microsoft To-Do → Koble fra**. Dette sletter lagrede tokens fra databasen. Du kan koble til igjen når som helst.

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
