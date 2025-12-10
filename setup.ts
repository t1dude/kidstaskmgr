import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as fs from 'fs';
import * as path from 'path';

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message: string, color: string = colors.reset) {
  console.log(`${color}${message}${colors.reset}`);
}

function checkmark() {
  return `${colors.green}✓${colors.reset}`;
}

function crossmark() {
  return `${colors.red}✗${colors.reset}`;
}

async function main() {
  log('\n=================================================', colors.cyan);
  log('   KidsTaskMgr - Setup og Verifikasjon', colors.cyan);
  log('=================================================\n', colors.cyan);

  let hasErrors = false;

  log('Steg 1: Sjekker miljøvariabler...', colors.blue);

  const envPath = path.join(process.cwd(), '.env.local');
  const envExamplePath = path.join(process.cwd(), '.env');

  if (!fs.existsSync(envPath) && !fs.existsSync(envExamplePath)) {
    log(`${crossmark()} Ingen .env fil funnet`, colors.red);
    log('\nOpprett en .env.local fil med følgende innhold:', colors.yellow);
    log('VITE_SUPABASE_URL=https://xxxxx.supabase.co', colors.yellow);
    log('VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...', colors.yellow);
    hasErrors = true;
  } else {
    if (fs.existsSync(envPath)) {
      dotenv.config({ path: envPath });
      log(`${checkmark()} Fant .env.local`, colors.green);
    } else {
      dotenv.config({ path: envExamplePath });
      log(`${checkmark()} Fant .env`, colors.green);
    }
  }

  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || supabaseUrl.includes('xxxxx')) {
    log(`${crossmark()} VITE_SUPABASE_URL er ikke konfigurert`, colors.red);
    log('   Sett din Supabase Project URL i .env.local', colors.yellow);
    hasErrors = true;
  } else {
    log(`${checkmark()} VITE_SUPABASE_URL er satt`, colors.green);
  }

  if (!supabaseKey || supabaseKey.includes('...')) {
    log(`${crossmark()} VITE_SUPABASE_ANON_KEY er ikke konfigurert`, colors.red);
    log('   Sett din Supabase Anon Key i .env.local', colors.yellow);
    hasErrors = true;
  } else {
    log(`${checkmark()} VITE_SUPABASE_ANON_KEY er satt`, colors.green);
  }

  if (hasErrors) {
    log('\n=================================================', colors.red);
    log('   Konfigurasjon mangler!', colors.red);
    log('=================================================\n', colors.red);
    log('Følg instruksjonene i README.md for å sette opp Supabase:', colors.yellow);
    log('1. Opprett en konto på https://supabase.com', colors.yellow);
    log('2. Opprett et nytt prosjekt', colors.yellow);
    log('3. Hent API-nøklene fra Settings → API', colors.yellow);
    log('4. Legg de inn i .env.local\n', colors.yellow);
    process.exit(1);
  }

  log('\nSteg 2: Tester tilkobling til Supabase...', colors.blue);

  try {
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    const { data, error } = await supabase.from('users').select('count').limit(1);

    if (error) {
      if (error.message.includes('relation "public.users" does not exist')) {
        log(`${crossmark()} Tabellen 'users' finnes ikke`, colors.red);
        log('\nMigrasjonene må kjøres!', colors.yellow);
        log('Følg instruksjonene i README.md, Steg 5: Kjør migrasjoner', colors.yellow);
        hasErrors = true;
      } else {
        log(`${crossmark()} Feil ved tilkobling: ${error.message}`, colors.red);
        hasErrors = true;
      }
    } else {
      log(`${checkmark()} Tilkobling til Supabase OK`, colors.green);
    }
  } catch (error: any) {
    log(`${crossmark()} Kunne ikke koble til Supabase`, colors.red);
    log(`   Feil: ${error.message}`, colors.red);
    hasErrors = true;
  }

  if (hasErrors) {
    log('\n=================================================', colors.red);
    log('   Setup er ikke fullført', colors.red);
    log('=================================================\n', colors.red);
    process.exit(1);
  }

  log('\nSteg 3: Verifiserer database-tabeller...', colors.blue);

  try {
    const supabase = createClient(supabaseUrl!, supabaseKey!);

    const tables = ['users', 'tasks', 'completed_tasks', 'calendar_settings'];
    let allTablesExist = true;

    for (const table of tables) {
      const { error } = await supabase.from(table).select('*').limit(0);

      if (error) {
        log(`${crossmark()} Tabell '${table}' mangler eller er ikke tilgjengelig`, colors.red);
        allTablesExist = false;
      } else {
        log(`${checkmark()} Tabell '${table}' OK`, colors.green);
      }
    }

    if (!allTablesExist) {
      log('\nKjør migrasjonene i Supabase Dashboard (se README.md)', colors.yellow);
      hasErrors = true;
    }
  } catch (error: any) {
    log(`${crossmark()} Kunne ikke verifisere tabeller: ${error.message}`, colors.red);
    hasErrors = true;
  }

  if (hasErrors) {
    log('\n=================================================', colors.red);
    log('   Setup er ikke fullført', colors.red);
    log('=================================================\n', colors.red);
    process.exit(1);
  }

  log('\nSteg 4: Sjekker om det finnes brukere...', colors.blue);

  try {
    const supabase = createClient(supabaseUrl!, supabaseKey!);
    const { data, error } = await supabase.from('users').select('*');

    if (error) {
      log(`${crossmark()} Feil ved henting av brukere: ${error.message}`, colors.red);
    } else if (!data || data.length === 0) {
      log(`${colors.yellow}⚠${colors.reset} Ingen brukere funnet`, colors.yellow);
      log('\nFor å bruke applikasjonen må du opprette minst én bruker:', colors.yellow);
      log('1. Gå til Supabase Dashboard → Table Editor → users', colors.yellow);
      log('2. Klikk "Insert row"', colors.yellow);
      log('3. Fyll inn navn, pin_code, og is_admin', colors.yellow);
      log('4. Se README.md for detaljer\n', colors.yellow);
    } else {
      log(`${checkmark()} ${data.length} bruker(e) funnet`, colors.green);
      data.forEach((user: any) => {
        const role = user.is_admin ? 'Admin' : 'Barn';
        log(`   - ${user.name} (${role})`, colors.cyan);
      });
    }
  } catch (error: any) {
    log(`${crossmark()} Kunne ikke hente brukere: ${error.message}`, colors.red);
  }

  log('\n=================================================', colors.green);
  log('   Setup er fullført!', colors.green);
  log('=================================================\n', colors.green);
  log('Du kan nå starte applikasjonen med:', colors.cyan);
  log('  npm run dev', colors.cyan);
  log('\nApplikasjonen vil kjøre på http://localhost:5173\n', colors.cyan);
}

main().catch((error) => {
  log(`\nUventet feil: ${error.message}`, colors.red);
  process.exit(1);
});
