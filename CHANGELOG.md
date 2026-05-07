🇳🇴 [Norsk](CHANGELOG.no.md)

# Changelog

## v1.7.1 – Recipe servings info (2026-05-07)
- Ingredient modal now shows the recipe's serving count (e.g. "· 4 servings") so you know what quantities the ingredients are based on

## v1.7.0 – Microsoft To-Do shopping list integration (2026-05-07)
- Add ingredients from Matprat recipes directly to a shared Microsoft To-Do list
- OAuth 2.0 authorization code flow — connect once per household, no per-device login
- Ingredient extraction from Matprat JSON-LD recipe schema (no scraping required)
- Ingredient modal with per-item checkboxes: select/deselect before adding to list
- Shopping cart button appears on meal plan rows with a recipe URL when To-Do is connected
- Admin settings: connect/disconnect Microsoft account, choose which To-Do list to use
- Token refresh handled automatically server-side; tokens stored in the app database
- New env vars: `MICROSOFT_CLIENT_ID`, `MICROSOFT_CLIENT_SECRET`, `APP_URL` (see docker-compose.yml)
- New endpoints: `/api/todo/*`, `/api/recipe-ingredients`

## v1.6.1 – Mobile save fixes and session validation (2026-05-07)
- Fix: tasks, children, and meals silently failed to save on mobile when the session had expired — API calls now throw on non-OK responses and show an error message
- Fix: expired sessions now detected on app startup — stale tokens are cleared before the user enters the admin panel, so the PIN prompt appears upfront instead of after failed save attempts
- New `GET /api/auth/validate` endpoint used to verify the stored token at startup
- Added `sessionExpired` and `saveFailed` error messages in both languages

## v1.6.0 – Norwegian/English language support (2026-05-06)
- Language toggle button (🇬🇧/🇳🇴) in the home screen header and admin panel
- All UI strings, day/month names, and motivational tip messages fully translated
- Language preference stored in `localStorage`

## v1.5.4 – Bug fixes (2026-05-06)
- Fix: admin settings (feature toggles) not saving on mobile — caused by `sessionStorage` being cleared when mobile browsers background-kill tabs; switched to `localStorage`
- Fix: Cosmos auto-update was disabled (`cosmos-auto-update` label was `"false"`)

## v1.5.3 – Family messages, emoji picker, mobile improvements (2026-05-06)
- Family messages board on the home screen — leave notes for the family, dismiss when done
- Messages appear below the dinner plan in the right column (not full-width below everything)
- Emoji picker for child avatars (44 emojis across faces, animals, and symbols)
- Mobile layout fixes across all views: cards no longer overflow on small screens
- Progressive PIN lockout: 3 failures → 1 min, 6 → 5 min, 10 → 30 min, 15+ → 2 hours
- Feature toggles now include the family messages section

## v1.5.1 – Cosmos/reverse proxy compatibility (2026-05-06)
- Express now serves the frontend statically — single port (`3001`) for everything
- API URL is relative (`/api`) and works behind any reverse proxy
- Vite dev server proxies `/api` calls to `localhost:3001` automatically
- New COSMOS.md with a simplified setup guide

## v1.5.0 – Security and authentication (2026-05-06)
- Admin PIN via `ADMIN_PIN` environment variable (default `1234`)
- Optional PIN protection for the home screen (recommended when internet-facing)
- 8-hour session token after login
- Rate limiting: 200 req/15 min general, 10 login attempts/15 min
- `helmet.js` for HTTP security headers (CSP, HSTS, etc.)
- SSRF protection: iCal URLs validated against private IP ranges
- API request body limited to 16 KB

## v1.4.2 – Dependency updates (2026-05-06)
- `better-sqlite3` 12.6.2→12.9.0, `dotenv` 17.2.3→17.4.2, `esbuild` 0.27.2→0.28.0
- `node-ical` 0.25.0→0.26.1, `tsx` 4.7.0→4.21.0, `typescript-eslint` 8.54.0→8.59.2
- Not updated (major with breaking changes): React 18→19, Express 4→5, Tailwind 3→4

## v1.4.1 – Dark mode in child view and new title (2026-05-05)
- Dark mode now works in the child task list
- Title changed from "Ukeoppgaver" to "Ukeplan for familien"

## v1.4.0 – General tab and feature toggles (2026-05-05)
- New "General" tab in settings (opens on gear icon click)
- Dark mode toggle in settings
- Toggle task list, calendar, and dinner planning on/off individually
- Fixed bug: gear button was passing MouseEvent as a tab argument

## v1.3.1 – Dark mode in settings (2026-05-05)
- Dark mode now fully works in the admin panel (all tabs)

## v1.3.0 – Recipe inspiration (2026-05-05)
- Recipe search from matprat.no in meal settings (4000+ recipes, cached 24h)
- Recipe cards with image, difficulty, and cooking time
- Orange link icon in the weekly plan for meals added from a recipe
- `recipe_url` column on the `meals` table (auto-migrated)

## v1.2.0 – Dinner planner (2026-05-05)
- Dinner planner on the home screen next to the calendar
- Manage the dinner list under Settings → Meals
- Automatic food emojis based on meal name (🌮🍕🍝🐟🍗🍔 etc.)
- Refresh button on the calendar panel

## v1.1.1 – Security updates (2026-02-04)
- Updated all dependencies, 0 vulnerabilities
- Vite 5.4.8→7.3.1 (fixed esbuild security issue)

## v1.1.0 – Intelligent motivation system (2026-02-04)
- Tips system that guides children through the week based on weekday and progress
- Message icon with badge on child cards
- Youth-friendly language aimed at ages 12–16

## v1.0.0 – Initial release (2026)
- Child profiles, task management, progress tracking
- Admin panel, calendar integration (iCal), SQLite, Docker, dark mode
