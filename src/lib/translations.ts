export type Lang = 'no' | 'en';

export interface TipMessages {
  notStarted: (title: string) => string[];
  farBehind: (title: string, remaining: number, daysLeft: number) => string[];
  almostThere: (title: string, remaining: number) => string[];
  urgentEndOfWeek: (title: string, remaining: number, daysLeft: number) => string[];
}

export interface Translations {
  appTitle: string;
  childStart: string;
  noChildrenTitle: string;
  noChildrenDesc: string;
  calendarTitle: string;
  refreshCalendar: string;
  noEvents: string;
  allDay: string;
  today: string;
  tomorrow: string;
  weekdaysShort: string[];
  weekdaysLong: string[];
  months: string[];
  formatDate: (weekday: string, day: number, month: string) => string;
  mealsTitle: string;
  editMeals: string;
  noMealsHome: string;
  chooseDinner: string;
  viewRecipeTitle: string;
  messagesTitle: string;
  noMessages: string;
  messagePlaceholder: string;
  addMessage: string;
  lightMode: string;
  darkModeTitle: string;
  adminTitle: string;
  viewTips: string;
  tipsFor: (name: string) => string;
  tipsSubtitle: string;
  understood: string;
  switchToLanguage: string;
  administration: string;
  back: string;
  tabSettings: string;
  tabTasks: string;
  tabChildren: string;
  tabCalendar: string;
  tabMeals: string;
  appearanceSection: string;
  darkModeLabel: string;
  darkModeDesc: string;
  featuresSection: string;
  featuresDesc: string;
  securitySection: string;
  securityDesc: string;
  requirePinLabel: string;
  requirePinDesc: string;
  featureTasks: string;
  featureTasksDesc: string;
  featureCalendar: string;
  featureCalendarDesc: string;
  featureMeals: string;
  featureMealsDesc: string;
  featureMessages: string;
  featureMessagesDesc: string;
  addTaskSection: string;
  taskNamePlaceholder: string;
  timesPerWeekTitle: string;
  add: string;
  timesPerWeek: string;
  editCount: string;
  delete: string;
  save: string;
  cancel: string;
  addChildSection: string;
  namePlaceholder: string;
  chooseIcon: string;
  calendarSettingsSection: string;
  calendarSettingsDesc: string;
  icalUrlLabel: string;
  icalHowTo: string;
  icalGoogleHelp: string;
  icalOutlookHelp: string;
  saveSettings: string;
  addMealSection: string;
  mealPlaceholder: string;
  noMealsYet: string;
  inspirationSection: string;
  inspirationDesc: string;
  inspirationPlaceholder: string;
  search: string;
  noRecipesFound: string;
  recipesFetchError: string;
  viewRecipe: string;
  added: string;
  searchMoreOn: string;
  resetWeek: string;
  resetWeekConfirm: string;
  resetWeekSuccess: string;
  calendarSaved: string;
  calendarSaveError: string;
  sessionExpired: string;
  saveFailed: string;
  todoSection: string;
  todoDesc: string;
  todoNotConfigured: string;
  todoConnectedAs: string;
  todoDisconnect: string;
  todoConnect: string;
  todoConnecting: string;
  todoSelectList: string;
  todoNoListSelected: string;
  todoAddToList: string;
  todoIngredients: string;
  todoIngredientsDesc: (listName: string) => string;
  todoAdding: string;
  todoAdded: (n: number) => string;
  todoAddFailed: string;
  todoFetchFailed: string;
  todoSelectAll: string;
  todoDeselectAll: string;
  todoNotConnected: string;
  todoLoadingLists: string;
  todoListSaved: string;
  servings: string;
  tasksForWeek: string;
  weeklyProgress: string;
  times: string;
  noTasksYet: string;
  noTasksDesc: string;
  pinTitle: string;
  pinDesc: string;
  pinPlaceholder: string;
  signingIn: string;
  waitSeconds: (n: number) => string;
  signIn: string;
  tips: TipMessages;
}

export const translations: Record<Lang, Translations> = {
  no: {
    appTitle: 'Ukeplan for familien',
    childStart: 'Trykk for å starte',
    noChildrenTitle: 'Ingen barn registrert ennå',
    noChildrenDesc: 'Bruk admin-panelet for å legge til barn og oppgaver',
    calendarTitle: 'Kommende hendelser',
    refreshCalendar: 'Oppdater kalender',
    noEvents: 'Ingen kommende hendelser',
    allDay: 'Hele dagen',
    today: 'I dag',
    tomorrow: 'I morgen',
    weekdaysShort: ['Man', 'Tir', 'Ons', 'Tor', 'Fre', 'Lør', 'Søn'],
    weekdaysLong: ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag'],
    months: ['januar', 'februar', 'mars', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'desember'],
    formatDate: (weekday, day, month) => `${weekday} ${day}. ${month}`,
    mealsTitle: 'Middagsplan',
    editMeals: 'Rediger måltider',
    noMealsHome: 'Legg til middager under Innstillinger → Måltider',
    chooseDinner: '— Velg middag —',
    viewRecipeTitle: 'Se oppskrift på matprat.no',
    messagesTitle: 'Viktige beskjeder',
    noMessages: 'Ingen aktive beskjeder',
    messagePlaceholder: 'Skriv en beskjed til familien...',
    addMessage: 'Legg til beskjed',
    lightMode: 'Lys modus',
    darkModeTitle: 'Mørk modus',
    adminTitle: 'Admin',
    viewTips: 'Se tips',
    tipsFor: (name) => `Tips til ${name}`,
    tipsSubtitle: 'Oppgaver som trenger litt kjærlighet',
    understood: 'Skjønner!',
    switchToLanguage: 'Switch to English',
    administration: 'Administrasjon',
    back: 'Tilbake',
    tabSettings: 'Generelt',
    tabTasks: 'Oppgaver',
    tabChildren: 'Barn',
    tabCalendar: 'Kalender',
    tabMeals: 'Måltider',
    appearanceSection: 'Utseende',
    darkModeLabel: 'Mørk modus',
    darkModeDesc: 'Mørkt fargetema for hele appen',
    featuresSection: 'Funksjoner',
    featuresDesc: 'Slå av funksjoner du ikke bruker for å forenkle forsiden.',
    securitySection: 'Sikkerhet',
    securityDesc: 'Innstillinger for tilgangskontroll.',
    requirePinLabel: 'Krev PIN for startsiden',
    requirePinDesc: 'Beskytter hele appen med PIN – anbefalt når appen er tilgjengelig over internett',
    featureTasks: 'Oppgaveliste',
    featureTasksDesc: 'Ukentlige oppgaver og fremdrift for barna',
    featureCalendar: 'Kalender',
    featureCalendarDesc: 'Kommende hendelser fra din kalender',
    featureMeals: 'Middagsplanlegging',
    featureMealsDesc: 'Ukentlig middagsplan på forsiden',
    featureMessages: 'Viktige beskjeder',
    featureMessagesDesc: 'Legg igjen beskjeder til familien på forsiden',
    addTaskSection: 'Legg til ny oppgave',
    taskNamePlaceholder: 'Oppgavenavn',
    timesPerWeekTitle: 'Antall ganger per uke',
    add: 'Legg til',
    timesPerWeek: 'ganger per uke',
    editCount: 'Rediger antall',
    delete: 'Slett',
    save: 'Lagre',
    cancel: 'Avbryt',
    addChildSection: 'Legg til barn',
    namePlaceholder: 'Navn',
    chooseIcon: 'Velg ikon',
    calendarSettingsSection: 'Kalender Innstillinger',
    calendarSettingsDesc: 'Lim inn den hemmelige iCal-adressen fra kalenderen din. Dette fungerer med Google Calendar, Outlook, Apple Calendar og andre.',
    icalUrlLabel: 'iCal URL (Hemmelig adresse)',
    icalHowTo: 'Slik finner du iCal-adressen:',
    icalGoogleHelp: 'Google Calendar: Kalenderinnstillinger → Integrer kalender → Hemmelig adresse i iCal-format',
    icalOutlookHelp: 'Outlook: Kalenderinnstillinger → Delte kalendere → Publiser en kalender → ICS-format',
    saveSettings: 'Lagre innstillinger',
    addMealSection: 'Legg til middag',
    mealPlaceholder: 'F.eks. Taco, Pasta bolognese...',
    noMealsYet: 'Ingen middager lagt til ennå',
    inspirationSection: 'Finn inspirasjon',
    inspirationDesc: 'Søk etter ingredienser eller retttype – henter oppskrifter fra matprat.no',
    inspirationPlaceholder: 'F.eks. kylling, fisk, suppe, grillmat...',
    search: 'Søk',
    noRecipesFound: 'Ingen oppskrifter funnet – prøv et annet søkeord.',
    recipesFetchError: 'Kunne ikke hente oppskrifter. Sjekk internettilkoblingen.',
    viewRecipe: 'Se oppskrift',
    added: 'Lagt til',
    searchMoreOn: 'Søk videre på:',
    resetWeek: 'Nullstill uke',
    resetWeekConfirm: 'Er du sikker på at du vil nullstille alle oppgaver for denne uken?',
    resetWeekSuccess: 'Uken er nullstilt!',
    calendarSaved: 'Kalenderinnstillinger lagret!',
    calendarSaveError: 'Kunne ikke lagre kalenderinnstillinger',
    sessionExpired: 'Sesjonen er utløpt. Logg inn på nytt.',
    saveFailed: 'Kunne ikke lagre. Prøv igjen.',
    todoSection: 'Microsoft To-Do',
    todoDesc: 'Legg ingredienser fra middagsoppskrifter direkte i handlelisten din på Microsoft To-Do.',
    todoNotConfigured: 'Ikke konfigurert. Legg til MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET og APP_URL i miljøvariablene.',
    todoConnectedAs: 'Koblet til som',
    todoDisconnect: 'Koble fra',
    todoConnect: 'Koble til Microsoft-konto',
    todoConnecting: 'Kobler til...',
    todoSelectList: 'Velg handleliste',
    todoNoListSelected: '— Velg liste —',
    todoAddToList: 'Legg i handleliste',
    todoIngredients: 'Ingredienser',
    todoIngredientsDesc: (listName) => `Velg ingredienser å legge til i «${listName}»`,
    todoAdding: 'Legger til...',
    todoAdded: (n) => `${n} ingrediens${n === 1 ? '' : 'er'} lagt til!`,
    todoAddFailed: 'Kunne ikke legge til i handleliste',
    todoFetchFailed: 'Kunne ikke hente ingredienser fra oppskriften',
    todoSelectAll: 'Velg alle',
    todoDeselectAll: 'Fjern alle',
    todoNotConnected: 'Ikke koblet til',
    todoLoadingLists: 'Henter lister...',
    todoListSaved: 'Handleliste lagret!',
    servings: 'porsjoner',
    tasksForWeek: 'Dine oppgaver for uken',
    weeklyProgress: 'Ukens fremdrift',
    times: 'ganger',
    noTasksYet: 'Ingen oppgaver ennå!',
    noTasksDesc: 'Be voksen om å legge til oppgaver.',
    pinTitle: 'PIN-kode',
    pinDesc: 'Skriv inn PIN-koden for å fortsette',
    pinPlaceholder: 'PIN-kode',
    signingIn: 'Logger inn...',
    waitSeconds: (n) => `Venter (${n}s)`,
    signIn: 'Logg inn',
    tips: {
      notStarted: (title) => [
        `Du har ikke startet med "${title}" ennå. Kanskje du kan ta den i dag?`,
        `"${title}" venter på deg! Få den unna så er du ett skritt nærmere målet`,
        `Hva med å ta "${title}" nå? Det blir kult å se fremgangen!`,
      ],
      farBehind: (title, remaining, daysLeft) => [
        `Du ligger litt bak på "${title}". ${remaining} ganger igjen, men det rekker du!`,
        `"${title}" trenger litt kjærlighet! ${remaining} ganger til, you got this`,
        `Kun ${daysLeft} dager igjen! "${title}" trenger ${remaining} ganger til`,
      ],
      almostThere: (title, remaining) => [
        `Nesten i mål med "${title}"! Bare ${remaining} gang${remaining > 1 ? 'er' : ''} igjen`,
        `Du er så nære! "${title}" mangler bare ${remaining} gang${remaining > 1 ? 'er' : ''}`,
        `Nice! "${title}" er nesten ferdig, bare ${remaining} til!`,
      ],
      urgentEndOfWeek: (title, remaining, daysLeft) => [
        `⚡ Kun ${daysLeft} dag${daysLeft > 1 ? 'er' : ''} igjen! "${title}" trenger ${remaining} ganger til`,
        `⚡ Weekend-push! "${title}" mangler ${remaining} ganger`,
        `⚡ Siste mulighet! Ta "${title}" ${remaining} ganger så er du i mål`,
      ],
    },
  },
  en: {
    appTitle: 'Family Weekly Planner',
    childStart: 'Tap to start',
    noChildrenTitle: 'No children registered yet',
    noChildrenDesc: 'Use the admin panel to add children and tasks',
    calendarTitle: 'Upcoming events',
    refreshCalendar: 'Refresh calendar',
    noEvents: 'No upcoming events',
    allDay: 'All day',
    today: 'Today',
    tomorrow: 'Tomorrow',
    weekdaysShort: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    weekdaysLong: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
    months: ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
    formatDate: (weekday, day, month) => `${weekday}, ${month} ${day}`,
    mealsTitle: 'Dinner Plan',
    editMeals: 'Edit meals',
    noMealsHome: 'Add dinners under Settings → Meals',
    chooseDinner: '— Choose dinner —',
    viewRecipeTitle: 'View recipe',
    messagesTitle: 'Important messages',
    noMessages: 'No active messages',
    messagePlaceholder: 'Write a message to the family...',
    addMessage: 'Add message',
    lightMode: 'Light mode',
    darkModeTitle: 'Dark mode',
    adminTitle: 'Admin',
    viewTips: 'View tips',
    tipsFor: (name) => `Tips for ${name}`,
    tipsSubtitle: 'Tasks that need some attention',
    understood: 'Got it!',
    switchToLanguage: 'Bytt til norsk',
    administration: 'Administration',
    back: 'Back',
    tabSettings: 'General',
    tabTasks: 'Tasks',
    tabChildren: 'Children',
    tabCalendar: 'Calendar',
    tabMeals: 'Meals',
    appearanceSection: 'Appearance',
    darkModeLabel: 'Dark mode',
    darkModeDesc: 'Dark color theme for the entire app',
    featuresSection: 'Features',
    featuresDesc: "Turn off features you don't use to simplify the home screen.",
    securitySection: 'Security',
    securityDesc: 'Access control settings.',
    requirePinLabel: 'Require PIN for home screen',
    requirePinDesc: 'Protects the entire app with a PIN – recommended when the app is accessible over the internet',
    featureTasks: 'Task list',
    featureTasksDesc: 'Weekly tasks and progress for children',
    featureCalendar: 'Calendar',
    featureCalendarDesc: 'Upcoming events from your calendar',
    featureMeals: 'Dinner planning',
    featureMealsDesc: 'Weekly dinner plan on the home screen',
    featureMessages: 'Important messages',
    featureMessagesDesc: 'Leave messages for the family on the home screen',
    addTaskSection: 'Add new task',
    taskNamePlaceholder: 'Task name',
    timesPerWeekTitle: 'Number of times per week',
    add: 'Add',
    timesPerWeek: 'times per week',
    editCount: 'Edit count',
    delete: 'Delete',
    save: 'Save',
    cancel: 'Cancel',
    addChildSection: 'Add child',
    namePlaceholder: 'Name',
    chooseIcon: 'Choose icon',
    calendarSettingsSection: 'Calendar Settings',
    calendarSettingsDesc: 'Paste the secret iCal address from your calendar. This works with Google Calendar, Outlook, Apple Calendar and others.',
    icalUrlLabel: 'iCal URL (Secret address)',
    icalHowTo: 'How to find the iCal address:',
    icalGoogleHelp: 'Google Calendar: Calendar settings → Integrate calendar → Secret address in iCal format',
    icalOutlookHelp: 'Outlook: Calendar settings → Shared calendars → Publish a calendar → ICS format',
    saveSettings: 'Save settings',
    addMealSection: 'Add dinner',
    mealPlaceholder: 'E.g. Tacos, Pasta bolognese...',
    noMealsYet: 'No dinners added yet',
    inspirationSection: 'Find inspiration',
    inspirationDesc: 'Search for ingredients or dish type – fetches recipes from matprat.no',
    inspirationPlaceholder: 'E.g. chicken, fish, soup, grilled food...',
    search: 'Search',
    noRecipesFound: 'No recipes found – try a different search term.',
    recipesFetchError: 'Could not fetch recipes. Check your internet connection.',
    viewRecipe: 'View recipe',
    added: 'Added',
    searchMoreOn: 'Search more on:',
    resetWeek: 'Reset week',
    resetWeekConfirm: 'Are you sure you want to reset all tasks for this week?',
    resetWeekSuccess: 'The week has been reset!',
    calendarSaved: 'Calendar settings saved!',
    calendarSaveError: 'Could not save calendar settings',
    sessionExpired: 'Session expired. Please log in again.',
    saveFailed: 'Could not save. Please try again.',
    todoSection: 'Microsoft To-Do',
    todoDesc: 'Add ingredients from dinner recipes directly to your shopping list in Microsoft To-Do.',
    todoNotConfigured: 'Not configured. Add MICROSOFT_CLIENT_ID, MICROSOFT_CLIENT_SECRET and APP_URL to environment variables.',
    todoConnectedAs: 'Connected as',
    todoDisconnect: 'Disconnect',
    todoConnect: 'Connect Microsoft account',
    todoConnecting: 'Connecting...',
    todoSelectList: 'Select shopping list',
    todoNoListSelected: '— Select list —',
    todoAddToList: 'Add to shopping list',
    todoIngredients: 'Ingredients',
    todoIngredientsDesc: (listName) => `Select ingredients to add to "${listName}"`,
    todoAdding: 'Adding...',
    todoAdded: (n) => `${n} ingredient${n === 1 ? '' : 's'} added!`,
    todoAddFailed: 'Could not add to shopping list',
    todoFetchFailed: 'Could not fetch ingredients from recipe',
    todoSelectAll: 'Select all',
    todoDeselectAll: 'Deselect all',
    todoNotConnected: 'Not connected',
    todoLoadingLists: 'Loading lists...',
    todoListSaved: 'Shopping list saved!',
    servings: 'servings',
    tasksForWeek: 'Your tasks for the week',
    weeklyProgress: 'Weekly progress',
    times: 'times',
    noTasksYet: 'No tasks yet!',
    noTasksDesc: 'Ask a grown-up to add tasks.',
    pinTitle: 'PIN Code',
    pinDesc: 'Enter the PIN code to continue',
    pinPlaceholder: 'PIN code',
    signingIn: 'Signing in...',
    waitSeconds: (n) => `Wait (${n}s)`,
    signIn: 'Sign in',
    tips: {
      notStarted: (title) => [
        `You haven't started "${title}" yet. Maybe you can do it today?`,
        `"${title}" is waiting for you! Get it done and you're one step closer to the goal`,
        `How about doing "${title}" now? It'll be cool to see the progress!`,
      ],
      farBehind: (title, remaining, daysLeft) => [
        `You're a bit behind on "${title}". ${remaining} more times, but you can do it!`,
        `"${title}" needs some love! ${remaining} more times, you got this`,
        `Only ${daysLeft} days left! "${title}" needs ${remaining} more times`,
      ],
      almostThere: (title, remaining) => [
        `Almost done with "${title}"! Just ${remaining} more time${remaining > 1 ? 's' : ''} to go`,
        `You're so close! "${title}" just needs ${remaining} more time${remaining > 1 ? 's' : ''}`,
        `Nice! "${title}" is almost done, just ${remaining} more!`,
      ],
      urgentEndOfWeek: (title, remaining, daysLeft) => [
        `⚡ Only ${daysLeft} day${daysLeft > 1 ? 's' : ''} left! "${title}" needs ${remaining} more times`,
        `⚡ Weekend push! "${title}" is missing ${remaining} times`,
        `⚡ Last chance! Do "${title}" ${remaining} more times and you're done`,
      ],
    },
  },
};
