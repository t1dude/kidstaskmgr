import { useState, useEffect, useRef } from 'react';
import { api } from '../lib/api';
import { Plus, Trash2, Settings, Edit, Check, X, Search, ExternalLink, Loader2, Globe } from 'lucide-react';
import type { Task, Child, Meal, RecipeInspiration } from '../lib/api';
import { useLanguage } from '../lib/LanguageContext';

const AVATAR_EMOJIS = [
  '😊','😄','😎','🥳','😇','🤩','🥰','😜','😆','🤗','😏','🤓',
  '👦','👧','🧒','👶','🧑',
  '🐱','🐶','🐭','🐹','🐰','🦊','🐻','🐼','🐨','🐯','🦁','🐮','🐷','🐸','🦄','🐙',
  '🌟','⭐','🌈','🎮','⚽','🏀','🎨','🎵','🚀','🎉','🏆','🦋',
];

interface AdminViewProps {
  onBack: () => void;
  initialTab?: 'settings' | 'tasks' | 'children' | 'calendar' | 'meals';
}

interface AppFeatures {
  tasks: boolean;
  calendar: boolean;
  meals: boolean;
  messages: boolean;
}

export function AdminView({ onBack, initialTab = 'settings' }: AdminViewProps) {
  const { t, lang, setLang } = useLanguage();
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [features, setFeatures] = useState<AppFeatures>({ tasks: true, calendar: true, meals: true, messages: true });
  const [requirePinForHome, setRequirePinForHome] = useState(false);

  const [tasks, setTasks] = useState<Task[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [newTask, setNewTask] = useState({ title: '', target_count: 1, icon: 'check-circle' });
  const [newChild, setNewChild] = useState({ name: '', color: '#3b82f6', avatar_emoji: '😊' });
  const [activeTab, setActiveTab] = useState<'settings' | 'tasks' | 'children' | 'calendar' | 'meals'>(initialTab);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskCount, setEditingTaskCount] = useState<number>(1);
  const [calendarSettings, setCalendarSettings] = useState({ ical_url: '' });
  const [meals, setMeals] = useState<Meal[]>([]);
  const [newMealName, setNewMealName] = useState('');
  const [inspirationQuery, setInspirationQuery] = useState('');
  const [inspirationResults, setInspirationResults] = useState<RecipeInspiration[]>([]);
  const [inspirationLoading, setInspirationLoading] = useState(false);
  const [inspirationError, setInspirationError] = useState<string | null>(null);
  const [addedRecipes, setAddedRecipes] = useState<Set<string>>(new Set());
  const [emojiPickerOpen, setEmojiPickerOpen] = useState(false);
  const emojiPickerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!emojiPickerOpen) return;
    function handleOutside(e: MouseEvent) {
      if (emojiPickerRef.current && !emojiPickerRef.current.contains(e.target as Node))
        setEmojiPickerOpen(false);
    }
    function handleEsc(e: KeyboardEvent) { if (e.key === 'Escape') setEmojiPickerOpen(false); }
    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('keydown', handleEsc);
    return () => { document.removeEventListener('mousedown', handleOutside); document.removeEventListener('keydown', handleEsc); };
  }, [emojiPickerOpen]);

  useEffect(() => {
    loadTasks();
    loadChildren();
    loadCalendarSettings();
    loadMeals();
    api.getSettings().then(({ requirePinForHome, appFeatures }) => {
      setRequirePinForHome(requirePinForHome);
      setFeatures(appFeatures);
    }).catch(() => {});
  }, []);

  function handleSaveError(err: unknown) {
    if (err instanceof Error && err.message === '401') {
      localStorage.removeItem('adminToken');
      alert(t.sessionExpired);
      onBack();
    } else {
      alert(t.saveFailed);
    }
  }

  function toggleDarkMode() {
    const next = !darkMode;
    setDarkMode(next);
    localStorage.setItem('darkMode', JSON.stringify(next));
  }

  async function toggleFeature(key: keyof AppFeatures) {
    const next = { ...features, [key]: !features[key] };
    setFeatures(next);
    try {
      await api.updateSettings({ appFeatures: next });
    } catch {
      setFeatures(features);
    }
  }

  async function toggleRequirePinForHome() {
    const next = !requirePinForHome;
    setRequirePinForHome(next);
    try {
      await api.updateSettings({ requirePinForHome: next });
    } catch {
      setRequirePinForHome(!next);
    }
  }

  async function loadTasks() {
    try { setTasks(await api.getTasks()); } catch { /* ignore */ }
  }

  async function loadChildren() {
    try { setChildren(await api.getChildren()); } catch { /* ignore */ }
  }

  async function addTask() {
    if (!newTask.title.trim()) return;
    try {
      await api.createTask({ title: newTask.title, target_count: newTask.target_count, icon: newTask.icon, description: '' });
      setNewTask({ title: '', target_count: 1, icon: 'check-circle' });
      loadTasks();
    } catch (err) { handleSaveError(err); }
  }

  async function deleteTask(id: string) {
    try { await api.deleteTask(id); loadTasks(); } catch (err) { handleSaveError(err); }
  }

  async function addChild() {
    if (!newChild.name.trim()) return;
    try {
      await api.createChild({ name: newChild.name, color: newChild.color, avatar_emoji: newChild.avatar_emoji });
      setNewChild({ name: '', color: '#3b82f6', avatar_emoji: '😊' });
      loadChildren();
    } catch (err) { handleSaveError(err); }
  }

  async function deleteChild(id: string) {
    try { await api.deleteChild(id); loadChildren(); } catch (err) { handleSaveError(err); }
  }

  function startEditingTask(task: Task) {
    setEditingTaskId(task.id);
    setEditingTaskCount(task.target_count);
  }

  function cancelEditingTask() {
    setEditingTaskId(null);
    setEditingTaskCount(1);
  }

  async function saveTaskEdit(taskId: string) {
    try {
      await api.updateTask(taskId, { target_count: editingTaskCount });
      setEditingTaskId(null);
      loadTasks();
    } catch (err) { handleSaveError(err); }
  }

  async function resetWeek() {
    if (!confirm(t.resetWeekConfirm)) return;
    try { await api.resetWeek(); alert(t.resetWeekSuccess); } catch { /* ignore */ }
  }

  async function loadMeals() {
    try { setMeals(await api.getMeals()); } catch { /* ignore */ }
  }

  async function addMeal() {
    if (!newMealName.trim()) return;
    try { await api.createMeal(newMealName); setNewMealName(''); loadMeals(); } catch (err) { handleSaveError(err); }
  }

  function getMealIcon(name: string): string {
    const n = name.toLowerCase();
    if (n.includes('taco')) return '🌮';
    if (n.includes('pizza')) return '🍕';
    if (n.includes('pasta') || n.includes('spagetti') || n.includes('spaghetti') || n.includes('lasagne') || n.includes('carbonara')) return '🍝';
    if (n.includes('burger') || n.includes('hamburger')) return '🍔';
    if (n.includes('sushi')) return '🍣';
    if (n.includes('salat') || n.includes('salad')) return '🥗';
    if (n.includes('suppe') || n.includes('soup')) return '🍲';
    if (n.includes('kylling') || n.includes('chicken')) return '🍗';
    if (n.includes('laks') || n.includes('salmon') || n.includes('torsk') || n.includes('sei') || n.includes('fiskepinn') || n.includes('fiskebolle')) return '🐟';
    if (n.includes('fisk')) return '🐟';
    if (n.includes('ribs') || n.includes('biff') || n.includes('steak') || n.includes('svin')) return '🥩';
    if (n.includes('wrap')) return '🌯';
    if (n.includes('sandwich') || n.includes('toast')) return '🥪';
    if (n.includes('wok')) return '🥢';
    if (n.includes('curry')) return '🍛';
    if (n.includes('grøt')) return '🥣';
    if (n.includes('pannekake') || n.includes('pancake') || n.includes('vaffel')) return '🥞';
    if (n.includes('pølse') || n.includes('hotdog') || n.includes('grillpølse')) return '🌭';
    if (n.includes('kebab')) return '🥙';
    if (n.includes('reke') || n.includes('sjømat')) return '🦐';
    if (n.includes('nudel') || n.includes('ramen')) return '🍜';
    if (n.includes('egg') || n.includes('omelett')) return '🍳';
    return '🍽️';
  }

  async function deleteMeal(id: string) {
    try { await api.deleteMeal(id); loadMeals(); } catch (err) { handleSaveError(err); }
  }

  async function searchInspiration() {
    if (!inspirationQuery.trim()) return;
    setInspirationLoading(true);
    setInspirationError(null);
    setInspirationResults([]);
    try {
      const results = await api.getMealInspiration(inspirationQuery.trim());
      setInspirationResults(results);
      if (results.length === 0) setInspirationError(t.noRecipesFound);
    } catch {
      setInspirationError(t.recipesFetchError);
    } finally {
      setInspirationLoading(false);
    }
  }

  async function addRecipeToMeals(title: string, recipeUrl: string) {
    try {
      await api.createMeal(title, recipeUrl);
      setAddedRecipes(prev => new Set(prev).add(title));
      loadMeals();
    } catch (err) { handleSaveError(err); }
  }

  const externalSites = [
    { name: 'godt.no', url: (q: string) => `https://www.godt.no/oppskrifter?q=${encodeURIComponent(q)}` },
    { name: 'Trines matblogg', url: (q: string) => `https://www.trinesmatblogg.no/?s=${encodeURIComponent(q)}` },
    { name: 'Gladkokken', url: (q: string) => `https://www.gladkokken.no/?s=${encodeURIComponent(q)}` },
    { name: 'MENY', url: (q: string) => `https://meny.no/oppskrifter/?search=${encodeURIComponent(q)}` },
    { name: 'REMA 1000', url: (q: string) => `https://rema.no/oppskrifter?q=${encodeURIComponent(q)}` },
  ];

  async function loadCalendarSettings() {
    try {
      const data = await api.getCalendarSettings();
      if (data) setCalendarSettings({ ical_url: data.ical_url });
    } catch { /* ignore */ }
  }

  async function saveCalendarSettings() {
    try {
      await api.updateCalendarSettings(calendarSettings);
      alert(t.calendarSaved);
    } catch {
      alert(t.calendarSaveError);
    }
  }

  // Reusable styles
  const dm = darkMode;
  const card = dm ? 'bg-gray-800' : 'bg-white';
  const sectionBg = (color: string) => dm ? `bg-${color}-900/30` : `bg-${color}-50`;
  const listItem = dm ? 'bg-gray-700 hover:bg-gray-600' : 'bg-gray-50 hover:bg-gray-100';
  const labelText = dm ? 'text-gray-200' : 'text-gray-700';
  const bodyText = dm ? 'text-gray-100' : 'text-gray-800';
  const mutedText = dm ? 'text-gray-400' : 'text-gray-500';
  const inputClass = `px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:border-transparent ${
    dm ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400 focus:ring-blue-400'
       : 'bg-white border-gray-300 text-gray-800 focus:ring-blue-500'
  }`;
  const inactiveTab = dm ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-600 hover:bg-gray-200';
  const dividerColor = dm ? 'divide-gray-600' : 'divide-gray-100';

  function CountStepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
    const btn = `w-10 h-10 rounded-lg flex items-center justify-center text-lg font-bold transition-colors active:scale-95 ${
      dm ? 'bg-gray-600 hover:bg-gray-500 text-gray-100' : 'bg-gray-200 hover:bg-gray-300 text-gray-700'
    }`;
    return (
      <div className="flex items-center gap-1">
        <button type="button" onClick={() => onChange(Math.max(1, value - 1))} className={btn}>−</button>
        <span className={`w-8 text-center font-semibold text-base select-none ${dm ? 'text-gray-100' : 'text-gray-800'}`}>{value}</span>
        <button type="button" onClick={() => onChange(value + 1)} className={btn}>+</button>
      </div>
    );
  }

  function Toggle({ value, onToggle }: { value: boolean; onToggle: () => void }) {
    return (
      <button
        onClick={onToggle}
        className={`flex-shrink-0 relative w-12 h-6 rounded-full transition-colors duration-200 focus:outline-none ${
          value ? 'bg-blue-500' : dm ? 'bg-gray-600' : 'bg-gray-300'
        }`}
        role="switch"
        aria-checked={value}
      >
        <span
          className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${
            value ? 'left-6' : 'left-0.5'
          }`}
        />
      </button>
    );
  }

  const featureList: { key: keyof AppFeatures; label: string; desc: string }[] = [
    { key: 'tasks', label: t.featureTasks, desc: t.featureTasksDesc },
    { key: 'calendar', label: t.featureCalendar, desc: t.featureCalendarDesc },
    { key: 'meals', label: t.featureMeals, desc: t.featureMealsDesc },
    { key: 'messages', label: t.featureMessages, desc: t.featureMessagesDesc },
  ];

  return (
    <div className={`min-h-screen p-4 ${dm ? 'bg-gray-900' : 'bg-gradient-to-br from-slate-100 to-blue-50'}`}>
      <div className="max-w-4xl mx-auto">
        <div className={`rounded-2xl shadow-xl p-4 md:p-6 mb-6 ${card}`}>
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <Settings className="w-6 h-6 md:w-8 md:h-8 text-blue-500 flex-shrink-0" />
              <h1 className={`text-xl md:text-3xl font-bold truncate ${bodyText}`}>{t.administration}</h1>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0 ml-2">
              <button
                onClick={() => setLang(lang === 'no' ? 'en' : 'no')}
                title={t.switchToLanguage}
                className={`rounded-full px-3 py-3 transition-all duration-300 hover:scale-110 active:scale-95 flex items-center gap-1 ${
                  dm ? 'bg-gray-700' : 'bg-gray-100'
                }`}
              >
                <Globe className={`w-4 h-4 ${dm ? 'text-gray-200' : 'text-gray-700'}`} />
                <span className={`text-xs font-bold leading-none ${dm ? 'text-gray-200' : 'text-gray-700'}`}>{lang.toUpperCase()}</span>
              </button>
              <button
                onClick={onBack}
                className={`px-3 md:px-4 py-2 rounded-lg transition-colors ${
                  dm ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {t.back}
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div className="flex flex-wrap gap-2 mb-6">
            {(['settings', 'tasks', 'children', 'calendar', 'meals'] as const).map((tab) => {
              const labels = { settings: t.tabSettings, tasks: t.tabTasks, children: t.tabChildren, calendar: t.tabCalendar, meals: t.tabMeals };
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 px-2 rounded-lg text-sm font-semibold transition-colors ${
                    activeTab === tab ? 'bg-blue-600 text-white' : inactiveTab
                  }`}
                >
                  {labels[tab]}
                </button>
              );
            })}
          </div>

          {/* Generelt */}
          {activeTab === 'settings' && (
            <div className="space-y-5">
              <div className={`p-4 rounded-lg ${dm ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h3 className={`font-semibold mb-3 ${labelText}`}>{t.appearanceSection}</h3>
                <div className="flex items-center justify-between py-2">
                  <div className="min-w-0 flex-1 mr-4">
                    <p className={`font-medium ${bodyText}`}>{t.darkModeLabel}</p>
                    <p className={`text-sm ${mutedText}`}>{t.darkModeDesc}</p>
                  </div>
                  <Toggle value={darkMode} onToggle={toggleDarkMode} />
                </div>
              </div>

              <div className={`p-4 rounded-lg ${dm ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h3 className={`font-semibold mb-1 ${labelText}`}>{t.featuresSection}</h3>
                <p className={`text-sm mb-3 ${mutedText}`}>{t.featuresDesc}</p>
                <div className={`divide-y ${dividerColor}`}>
                  {featureList.map(({ key, label, desc }) => (
                    <div key={key} className="flex items-center justify-between py-3">
                      <div className="min-w-0 flex-1 mr-4">
                        <p className={`font-medium ${bodyText}`}>{label}</p>
                        <p className={`text-sm ${mutedText}`}>{desc}</p>
                      </div>
                      <Toggle value={features[key]} onToggle={() => toggleFeature(key)} />
                    </div>
                  ))}
                </div>
              </div>

              <div className={`p-4 rounded-lg ${dm ? 'bg-gray-700' : 'bg-gray-50'}`}>
                <h3 className={`font-semibold mb-1 ${labelText}`}>{t.securitySection}</h3>
                <p className={`text-sm mb-3 ${mutedText}`}>{t.securityDesc}</p>
                <div className="flex items-center justify-between py-2">
                  <div className="min-w-0 flex-1 mr-4">
                    <p className={`font-medium ${bodyText}`}>{t.requirePinLabel}</p>
                    <p className={`text-sm ${mutedText}`}>{t.requirePinDesc}</p>
                  </div>
                  <Toggle value={requirePinForHome} onToggle={toggleRequirePinForHome} />
                </div>
              </div>
            </div>
          )}

          {/* Oppgaver */}
          {activeTab === 'tasks' && (
            <div>
              <div className={`mb-6 p-4 rounded-lg ${sectionBg('blue')}`}>
                <h3 className={`font-semibold mb-3 ${labelText}`}>{t.addTaskSection}</h3>
                <div className="flex flex-col sm:flex-row gap-2 mb-2">
                  <input
                    type="text"
                    placeholder={t.taskNamePlaceholder}
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className={`flex-1 ${inputClass}`}
                  />
                  <div className="flex gap-2">
                    <CountStepper
                      value={newTask.target_count}
                      onChange={(n) => setNewTask({ ...newTask, target_count: n })}
                    />
                    <button onClick={addTask} className="flex-1 sm:flex-none px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                      <Plus className="w-5 h-5" />{t.add}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {tasks.map((task) => (
                  <div key={task.id} className={`flex items-center justify-between p-4 rounded-lg transition-colors ${listItem}`}>
                    <div className="flex-1">
                      <h4 className={`font-semibold ${bodyText}`}>{task.title}</h4>
                      {editingTaskId === task.id ? (
                        <div className="flex items-center gap-2 mt-2">
                          <CountStepper value={editingTaskCount} onChange={setEditingTaskCount} />
                          <span className={`text-sm ${mutedText}`}>{t.timesPerWeek}</span>
                        </div>
                      ) : (
                        <p className={`text-sm ${mutedText}`}>{task.target_count}x {t.timesPerWeek}</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {editingTaskId === task.id ? (
                        <>
                          <button onClick={() => saveTaskEdit(task.id)} className={`p-2 text-green-500 rounded-lg transition-colors ${dm ? 'hover:bg-gray-500' : 'hover:bg-green-50'}`} title={t.save}>
                            <Check className="w-5 h-5" />
                          </button>
                          <button onClick={cancelEditingTask} className={`p-2 rounded-lg transition-colors ${dm ? 'text-gray-400 hover:bg-gray-500' : 'text-gray-600 hover:bg-gray-200'}`} title={t.cancel}>
                            <X className="w-5 h-5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button onClick={() => startEditingTask(task)} className={`p-2 text-blue-500 rounded-lg transition-colors ${dm ? 'hover:bg-gray-500' : 'hover:bg-blue-50'}`} title={t.editCount}>
                            <Edit className="w-5 h-5" />
                          </button>
                          <button onClick={() => deleteTask(task.id)} className={`p-2 text-red-500 rounded-lg transition-colors ${dm ? 'hover:bg-gray-500' : 'hover:bg-red-50'}`} title={t.delete}>
                            <Trash2 className="w-5 h-5" />
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Barn */}
          {activeTab === 'children' && (
            <div>
              <div className={`mb-6 p-4 rounded-lg ${sectionBg('green')}`}>
                <h3 className={`font-semibold mb-3 ${labelText}`}>{t.addChildSection}</h3>
                <div className="flex flex-col sm:flex-row gap-2 mb-2">
                  <input type="text" placeholder={t.namePlaceholder} value={newChild.name} onChange={(e) => setNewChild({ ...newChild, name: e.target.value })}
                    className={`flex-1 ${inputClass}`} />
                  <div className="flex gap-2">
                    <div ref={emojiPickerRef} className="relative">
                      <button
                        type="button"
                        onClick={() => setEmojiPickerOpen(!emojiPickerOpen)}
                        className={`w-12 h-11 border rounded-lg text-2xl focus:outline-none focus:ring-2 focus:ring-green-400 ${dm ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'}`}
                        title={t.chooseIcon}
                      >
                        {newChild.avatar_emoji}
                      </button>
                      {emojiPickerOpen && (
                        <div className={`absolute z-50 top-full mt-1 left-0 w-64 p-2 rounded-xl shadow-2xl border grid grid-cols-6 gap-1 max-h-52 overflow-y-auto ${dm ? 'bg-gray-800 border-gray-600' : 'bg-white border-gray-200'}`}>
                          {AVATAR_EMOJIS.map(emoji => (
                            <button
                              key={emoji}
                              type="button"
                              onClick={() => { setNewChild({ ...newChild, avatar_emoji: emoji }); setEmojiPickerOpen(false); }}
                              className={`text-2xl p-1 rounded-lg transition-transform hover:scale-125 ${newChild.avatar_emoji === emoji ? (dm ? 'bg-blue-600' : 'bg-blue-100') : (dm ? 'hover:bg-gray-700' : 'hover:bg-gray-100')}`}
                            >
                              {emoji}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                    <input type="color" value={newChild.color} onChange={(e) => setNewChild({ ...newChild, color: e.target.value })}
                      className={`w-12 h-11 border rounded-lg cursor-pointer ${dm ? 'bg-gray-700 border-gray-600' : 'border-gray-300'}`} />
                    <button onClick={addChild} className="flex-1 sm:flex-none px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center justify-center gap-2">
                      <Plus className="w-5 h-5" />{t.add}
                    </button>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {children.map((child) => (
                  <div key={child.id} className={`flex items-center justify-between p-4 rounded-lg transition-colors ${listItem}`}>
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full flex items-center justify-center text-2xl" style={{ backgroundColor: child.color + '20' }}>
                        {child.avatar_emoji}
                      </div>
                      <h4 className={`font-semibold ${bodyText}`}>{child.name}</h4>
                    </div>
                    <button onClick={() => deleteChild(child.id)} className={`p-2 text-red-500 rounded-lg transition-colors ${dm ? 'hover:bg-gray-500' : 'hover:bg-red-50'}`} title={t.delete}>
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Kalender */}
          {activeTab === 'calendar' && (
            <div>
              <div className={`mb-6 p-4 rounded-lg ${sectionBg('purple')}`}>
                <h3 className={`font-semibold mb-3 ${labelText}`}>{t.calendarSettingsSection}</h3>
                <p className={`text-sm mb-4 ${mutedText}`}>{t.calendarSettingsDesc}</p>
                <div className="space-y-3">
                  <div>
                    <label className={`block text-sm font-medium mb-1 ${labelText}`}>{t.icalUrlLabel}</label>
                    <input
                      type="text"
                      placeholder="https://calendar.google.com/calendar/ical/..."
                      value={calendarSettings.ical_url}
                      onChange={(e) => setCalendarSettings({ ...calendarSettings, ical_url: e.target.value })}
                      className={`w-full ${inputClass} font-mono text-sm`}
                    />
                    <div className={`text-xs mt-2 space-y-1 ${mutedText}`}>
                      <p className="font-semibold">{t.icalHowTo}</p>
                      <p><strong>Google Calendar:</strong> {t.icalGoogleHelp}</p>
                      <p><strong>Outlook:</strong> {t.icalOutlookHelp}</p>
                    </div>
                  </div>
                  <button onClick={saveCalendarSettings} className="w-full px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors">
                    {t.saveSettings}
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Måltider */}
          {activeTab === 'meals' && (
            <div>
              <div className={`mb-6 p-4 rounded-lg ${sectionBg('orange')}`}>
                <h3 className={`font-semibold mb-3 ${labelText}`}>{t.addMealSection}</h3>
                <div className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    placeholder={t.mealPlaceholder}
                    value={newMealName}
                    onChange={(e) => setNewMealName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addMeal()}
                    className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent ${
                      dm ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' : 'bg-white border-gray-300'
                    }`}
                  />
                  <button onClick={addMeal} className="sm:flex-none px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2">
                    <Plus className="w-5 h-5" />{t.add}
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {meals.length === 0 && (
                  <p className={`text-sm text-center py-4 ${mutedText}`}>{t.noMealsYet}</p>
                )}
                {meals.map((meal) => (
                  <div key={meal.id} className={`flex items-center justify-between p-4 rounded-lg transition-colors ${listItem}`}>
                    <span className={`font-semibold ${bodyText}`}>{getMealIcon(meal.name)} {meal.name}</span>
                    <button onClick={() => deleteMeal(meal.id)} className={`p-2 text-red-500 rounded-lg transition-colors ${dm ? 'hover:bg-gray-500' : 'hover:bg-red-50'}`} title={t.delete}>
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>

              {/* Inspirasjon */}
              <div className="mt-8">
                <div className="flex items-center gap-2 mb-4">
                  <Search className="w-5 h-5 text-orange-500" />
                  <h3 className={`font-bold text-lg ${bodyText}`}>{t.inspirationSection}</h3>
                </div>
                <p className={`text-sm mb-3 ${mutedText}`}>{t.inspirationDesc}</p>
                <div className="flex flex-col sm:flex-row gap-2 mb-4">
                  <input
                    type="text"
                    placeholder={t.inspirationPlaceholder}
                    value={inspirationQuery}
                    onChange={(e) => setInspirationQuery(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchInspiration()}
                    className={`flex-1 px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-400 focus:border-transparent ${
                      dm ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400' : 'bg-white border-gray-300'
                    }`}
                  />
                  <button
                    onClick={searchInspiration}
                    disabled={inspirationLoading || !inspirationQuery.trim()}
                    className="sm:flex-none px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {inspirationLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                    {t.search}
                  </button>
                </div>

                {inspirationError && <p className="text-sm text-red-400 mb-4">{inspirationError}</p>}

                {inspirationResults.length > 0 && (
                  <>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 mb-5">
                      {inspirationResults.map((recipe) => {
                        const isAdded = addedRecipes.has(recipe.title);
                        return (
                          <div key={recipe.url} className={`border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow flex flex-col ${
                            dm ? 'border-gray-600 bg-gray-700' : 'border-gray-200 bg-white'
                          }`}>
                            <div className={`h-32 overflow-hidden ${dm ? 'bg-gray-600' : 'bg-gray-100'}`}>
                              {recipe.image ? (
                                <img src={recipe.image} alt={recipe.title} className="w-full h-full object-cover"
                                  onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-4xl">🍽️</div>
                              )}
                            </div>
                            <div className="p-3 flex flex-col flex-1">
                              <p className={`font-semibold text-sm leading-tight mb-1 ${bodyText}`}>{recipe.title}</p>
                              <div className={`text-xs space-y-0.5 mb-3 flex-1 ${mutedText}`}>
                                {recipe.rating && <p>⭐ {recipe.rating}</p>}
                                {recipe.difficulty && <p>{recipe.difficulty}</p>}
                                {recipe.time && <p>⏱ {recipe.time}</p>}
                              </div>
                              <div className="flex gap-1.5">
                                <a href={recipe.url} target="_blank" rel="noopener noreferrer"
                                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs border rounded-lg transition-colors ${
                                    dm ? 'border-gray-500 text-gray-300 hover:bg-gray-600' : 'border-gray-300 text-gray-600 hover:bg-gray-50'
                                  }`}>
                                  <ExternalLink className="w-3 h-3" />{t.viewRecipe}
                                </a>
                                <button
                                  onClick={() => !isAdded && addRecipeToMeals(recipe.title, recipe.url)}
                                  disabled={isAdded}
                                  className={`flex-1 flex items-center justify-center gap-1 px-2 py-1.5 text-xs rounded-lg font-semibold transition-colors ${
                                    isAdded
                                      ? dm ? 'bg-green-800/60 text-green-400 cursor-default' : 'bg-green-100 text-green-700 cursor-default'
                                      : 'bg-orange-500 text-white hover:bg-orange-600'
                                  }`}>
                                  {isAdded ? <><Check className="w-3 h-3" /> {t.added}</> : <><Plus className="w-3 h-3" /> {t.add}</>}
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className={`pt-3 border-t ${dm ? 'border-gray-700' : 'border-gray-100'}`}>
                      <p className={`text-xs mb-2 ${dm ? 'text-gray-500' : 'text-gray-400'}`}>{t.searchMoreOn}</p>
                      <div className="flex flex-wrap gap-2">
                        {externalSites.map((site) => (
                          <a key={site.name} href={site.url(inspirationQuery)} target="_blank" rel="noopener noreferrer"
                            className={`inline-flex items-center gap-1 px-3 py-1 text-xs border rounded-full transition-colors hover:text-orange-500 hover:border-orange-400 ${
                              dm ? 'border-gray-600 text-gray-400' : 'border-gray-200 text-gray-500'
                            }`}>
                            {site.name}<ExternalLink className="w-2.5 h-2.5" />
                          </a>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        <button onClick={resetWeek} className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold text-lg hover:bg-red-700 transition-colors shadow-lg">
          {t.resetWeek}
        </button>
      </div>
    </div>
  );
}
