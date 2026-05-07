import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Settings, Users, Trophy, Calendar as CalendarIcon, Moon, Sun, MessageCircle, X, Utensils, Pencil, RefreshCw, ExternalLink, Bell, Plus, Globe, ShoppingCart, Loader2, Check } from 'lucide-react';
import type { Child, CalendarEvent, Task, TaskCompletion, Meal, Message, TodoStatus } from '../lib/api';
import { generateTips, type Tip, type TaskWithCompletion } from '../lib/tipsGenerator';
import { useLanguage } from '../lib/LanguageContext';

interface ChildWithProgress extends Child {
  progress: number;
  tips: Tip[];
}

interface HomeScreenProps {
  onSelectChild: (child: Child) => void;
  onAdminClick: (tab?: 'settings' | 'tasks' | 'children' | 'calendar' | 'meals') => void;
}

export function HomeScreen({ onSelectChild, onAdminClick }: HomeScreenProps) {
  const { t, lang, setLang } = useLanguage();
  const [children, setChildren] = useState<ChildWithProgress[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [meals, setMeals] = useState<Meal[]>([]);
  const [mealPlan, setMealPlan] = useState<Record<string, string>>({});
  const [calendarRefreshing, setCalendarRefreshing] = useState(false);
  const [selectedChildTips, setSelectedChildTips] = useState<{ child: Child; tips: Tip[] } | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });
  const [features, setFeatures] = useState({ tasks: true, calendar: true, meals: true, messages: true });
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [todoStatus, setTodoStatus] = useState<TodoStatus | null>(null);
  const [ingredientModal, setIngredientModal] = useState<{ meal: Meal; ingredients: string[]; title: string; recipeYield: string | number | null } | null>(null);
  const [selectedIngredients, setSelectedIngredients] = useState<Set<string>>(new Set());
  const [ingredientLoading, setIngredientLoading] = useState<string | null>(null);
  const [addingToList, setAddingToList] = useState(false);

  useEffect(() => {
    loadChildrenWithProgress();
  }, [lang]); // re-generate translated tips when language changes

  useEffect(() => {
    loadCalendarEvents();
    loadMeals();
    loadMealPlan();
    loadMessages();
    api.getTodoStatus().then(setTodoStatus).catch(() => {});
    api.getSettings().then(({ appFeatures }) => setFeatures(f => ({ ...f, ...appFeatures }))).catch(() => {});

    const calendarInterval = setInterval(() => {
      loadCalendarEvents();
    }, 5 * 60 * 1000);

    return () => clearInterval(calendarInterval);
  }, []);

  useEffect(() => {
    localStorage.setItem('darkMode', JSON.stringify(darkMode));
  }, [darkMode]);

  function toggleDarkMode() {
    setDarkMode(!darkMode);
  }

  function getWeekStart() {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    return monday.toISOString().split('T')[0];
  }

  async function loadChildrenWithProgress() {
    try {
      const childrenData = await api.getChildren();
      const tasksData = await api.getTasks();
      const weekStart = getWeekStart();

      const childrenWithProgress = await Promise.all(
        childrenData.map(async (child) => {
          const completionsData = await api.getTaskCompletions(child.id, weekStart);
          const totalTarget = tasksData.reduce((sum, task) => sum + task.target_count, 0);

          if (totalTarget === 0) {
            return { ...child, progress: 0, tips: [] };
          }

          const totalCompleted = completionsData.reduce(
            (sum, completion) => sum + completion.completion_count,
            0
          );

          const progress = Math.round((totalCompleted / totalTarget) * 100);

          const completionsMap = new Map<string, number>();
          completionsData.forEach((c) => {
            completionsMap.set(c.task_id, c.completion_count);
          });

          const tasksWithCompletions: TaskWithCompletion[] = tasksData.map((task) => ({
            ...task,
            completion_count: completionsMap.get(task.id) || 0,
          }));

          const tips = generateTips(tasksWithCompletions, progress, t.tips);

          return { ...child, progress, tips };
        })
      );

      setChildren(childrenWithProgress);
    } catch (error) {
      console.error('Failed to load children with progress', error);
    }
  }

  async function loadCalendarEvents() {
    try {
      const events = await api.getCalendarEvents();
      setCalendarEvents(events);
    } catch (error) {
      console.error('Failed to load calendar events', error);
    }
  }

  async function refreshCalendar() {
    setCalendarRefreshing(true);
    await loadCalendarEvents();
    setCalendarRefreshing(false);
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

  async function loadMeals() {
    try {
      const data = await api.getMeals();
      setMeals(data);
    } catch (error) {
      console.error('Failed to load meals', error);
    }
  }

  async function loadMealPlan() {
    try {
      const weekStart = getWeekStart();
      const entries = await api.getMealPlan(weekStart);
      const plan: Record<string, string> = {};
      entries.forEach((e) => {
        if (e.meal_id) plan[e.planned_date] = e.meal_id;
      });
      setMealPlan(plan);
    } catch (error) {
      console.error('Failed to load meal plan', error);
    }
  }

  async function loadMessages() {
    try { setMessages(await api.getMessages()); } catch { /* ignore */ }
  }

  async function addMessage() {
    if (!newMessage.trim()) return;
    try {
      const msg = await api.createMessage(newMessage.trim());
      setMessages(prev => [...prev, msg]);
      setNewMessage('');
    } catch { /* ignore */ }
  }

  async function dismissMessage(id: string) {
    try {
      await api.deleteMessage(id);
      setMessages(prev => prev.filter(m => m.id !== id));
    } catch { /* ignore */ }
  }

  async function openIngredients(meal: Meal) {
    if (!meal.recipe_url) return;
    setIngredientLoading(meal.id);
    try {
      const data = await api.getRecipeIngredients(meal.recipe_url);
      setIngredientModal({ meal, ingredients: data.ingredients, title: data.title || meal.name, recipeYield: data.recipeYield ?? null });
      setSelectedIngredients(new Set(data.ingredients));
    } catch {
      alert(t.todoFetchFailed);
    } finally {
      setIngredientLoading(null);
    }
  }

  async function addIngredientsToList() {
    if (!ingredientModal) return;
    setAddingToList(true);
    try {
      const items = ingredientModal.ingredients.filter(i => selectedIngredients.has(i));
      const { added } = await api.addTodoItems(items);
      setIngredientModal(null);
      alert(t.todoAdded(added));
    } catch {
      alert(t.todoAddFailed);
    } finally {
      setAddingToList(false);
    }
  }

  async function setMealForDay(date: string, mealId: string) {
    try {
      if (!mealId) {
        await api.deleteMealPlan(date);
        setMealPlan((prev) => {
          const updated = { ...prev };
          delete updated[date];
          return updated;
        });
      } else {
        await api.setMealPlan(date, mealId);
        setMealPlan((prev) => ({ ...prev, [date]: mealId }));
      }
    } catch (error) {
      console.error('Failed to update meal plan', error);
    }
  }

  function getWeekDays(): { date: string; label: string }[] {
    const monday = new Date(getWeekStart());
    return t.weekdaysShort.map((label, i) => {
      const d = new Date(monday);
      d.setDate(d.getDate() + i);
      return { date: d.toISOString().split('T')[0], label };
    });
  }

  function getDayLabel(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return t.today;
    if (date.toDateString() === tomorrow.toDateString()) return t.tomorrow;

    const weekday = t.weekdaysLong[date.getDay()];
    const month = t.months[date.getMonth()];
    return t.formatDate(weekday, date.getDate(), month);
  }

  function groupEventsByDay(events: CalendarEvent[]): Record<string, CalendarEvent[]> {
    const grouped: Record<string, CalendarEvent[]> = {};
    events.forEach((event) => {
      const dateKey = new Date(event.start).toDateString();
      if (!grouped[dateKey]) grouped[dateKey] = [];
      grouped[dateKey].push(event);
    });
    return grouped;
  }

  function formatEventTime(startString: string, endString: string): string {
    if (startString.length === 10) return t.allDay;
    const startDate = new Date(startString);
    const endDate = new Date(endString);
    const startTime = startDate.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });
    const endTime = endDate.toLocaleTimeString('no-NO', { hour: '2-digit', minute: '2-digit' });
    return `${startTime} - ${endTime}`;
  }

  return (
    <div className={`min-h-screen p-4 transition-colors duration-300 ${
      darkMode
        ? 'bg-gradient-to-br from-gray-900 to-gray-800'
        : 'bg-gradient-to-br from-slate-100 to-blue-50'
    }`}>
      <div className="fixed top-4 right-4 flex gap-2 z-10">
        <button
          onClick={toggleDarkMode}
          className={`rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 ${
            darkMode ? 'bg-gray-700' : 'bg-white'
          }`}
          title={darkMode ? t.lightMode : t.darkModeTitle}
        >
          {darkMode ? (
            <Sun className="w-6 h-6 text-yellow-400" />
          ) : (
            <Moon className="w-6 h-6 text-gray-700" />
          )}
        </button>
        <button
          onClick={() => setLang(lang === 'no' ? 'en' : 'no')}
          className={`rounded-full px-3 py-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 flex items-center gap-1 ${
            darkMode ? 'bg-gray-700' : 'bg-white'
          }`}
          title={t.switchToLanguage}
        >
          <Globe className={`w-4 h-4 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`} />
          <span className={`text-xs font-bold leading-none ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>{lang.toUpperCase()}</span>
        </button>
        <button
          onClick={() => onAdminClick()}
          className={`rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 ${
            darkMode ? 'bg-gray-700' : 'bg-white'
          }`}
          title={t.adminTitle}
        >
          <Settings className={`w-6 h-6 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`} />
        </button>
      </div>

      <div className="max-w-4xl mx-auto pt-12">
        <div className="text-center mb-6 md:mb-12">
          <h1 className={`text-4xl md:text-6xl font-bold mb-4 md:mb-8 drop-shadow-lg ${
            darkMode ? 'text-gray-100' : 'text-gray-800'
          }`}>
            {t.appTitle}
          </h1>
        </div>

        {features.tasks && <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {children.map((child) => (
            <div key={child.id} className="relative">
              <button
                onClick={() => onSelectChild(child)}
                className={`group relative rounded-3xl p-5 md:p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 active:scale-95 w-full ${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                }`}
                style={{
                  borderWidth: 4,
                  borderColor: child.color,
                }}
              >
                <div className="flex flex-col items-center gap-4">
                  <div
                    className="w-24 h-24 md:w-32 md:h-32 rounded-full flex items-center justify-center text-5xl md:text-7xl shadow-xl transition-transform group-hover:scale-110 relative"
                    style={{
                      backgroundColor: child.color + '20',
                      borderWidth: 4,
                      borderColor: child.color,
                    }}
                  >
                    {child.avatar_emoji}
                    <div className="absolute bottom-0 right-0 bg-yellow-400 rounded-full px-2 py-1 text-sm font-bold text-gray-800 shadow-lg flex items-center gap-1">
                      <Trophy className="w-4 h-4" />
                      {child.progress}%
                    </div>
                  </div>
                  <h2 className={`text-2xl md:text-3xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                    {child.name}
                  </h2>
                  <div className="w-full px-4">
                    <div className={`rounded-full h-4 overflow-hidden ${darkMode ? 'bg-gray-700' : 'bg-gray-200'}`}>
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${child.progress}%`,
                          backgroundColor: child.color,
                        }}
                      ></div>
                    </div>
                  </div>
                  <div
                    className="px-6 py-2 rounded-full text-white font-semibold"
                    style={{ backgroundColor: child.color }}
                  >
                    {t.childStart}
                  </div>
                </div>
              </button>
              {child.tips.length > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedChildTips({ child, tips: child.tips });
                  }}
                  className={`absolute top-4 right-4 rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 ${
                    darkMode ? 'bg-blue-600' : 'bg-blue-500'
                  }`}
                  title={t.viewTips}
                >
                  <MessageCircle className="w-6 h-6 text-white" />
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    {child.tips.length}
                  </div>
                </button>
              )}
            </div>
          ))}
        </div>}

        {features.tasks && children.length === 0 && (
          <div className={`rounded-3xl p-6 md:p-12 shadow-2xl text-center mb-8 ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <Users className={`w-24 h-24 mx-auto mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              {t.noChildrenTitle}
            </h2>
            <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              {t.noChildrenDesc}
            </p>
          </div>
        )}

        {(features.calendar || features.meals || features.messages) && <div className={`grid grid-cols-1 gap-6 mb-8 ${features.calendar && (features.meals || features.messages) ? 'md:grid-cols-2 md:items-start' : ''}`}>
          {features.calendar && <div className={`rounded-2xl p-4 md:p-6 shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <CalendarIcon className={`w-6 h-6 flex-shrink-0 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
                <h2 className={`text-lg md:text-2xl font-bold truncate ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                  {t.calendarTitle}
                </h2>
              </div>
              <button
                onClick={refreshCalendar}
                disabled={calendarRefreshing}
                className={`p-2 rounded-lg transition-all hover:scale-110 active:scale-95 ${
                  darkMode ? 'text-blue-400 hover:bg-gray-700' : 'text-blue-500 hover:bg-blue-50'
                } ${calendarRefreshing ? 'opacity-50 cursor-not-allowed' : ''}`}
                title={t.refreshCalendar}
              >
                <RefreshCw className={`w-5 h-5 ${calendarRefreshing ? 'animate-spin' : ''}`} />
              </button>
            </div>
            {calendarEvents.length > 0 ? (
              <div className="space-y-6">
                {Object.entries(groupEventsByDay(calendarEvents)).map(([dateKey, events]) => (
                  <div key={dateKey} className="space-y-2">
                    <h3 className={`text-lg font-bold capitalize border-b-2 pb-2 ${
                      darkMode ? 'text-gray-200 border-blue-500' : 'text-gray-700 border-blue-200'
                    }`}>
                      {getDayLabel(events[0].start)}
                    </h3>
                    <div className="space-y-2">
                      {events.map((event) => (
                        <div
                          key={event.id}
                          className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                            darkMode ? 'bg-gray-700 hover:bg-gray-600' : 'bg-blue-50 hover:bg-blue-100'
                          }`}
                        >
                          <div className="flex-1">
                            <h4 className={`font-semibold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                              {event.summary}
                            </h4>
                            <div className={`text-sm mt-1 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`}>
                              <span>{formatEventTime(event.start, event.end)}</span>
                            </div>
                            {event.location && (
                              <div className={`text-sm mt-1 ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                                📍 {event.location}
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {t.noEvents}
              </p>
            )}
          </div>}

          {(features.meals || features.messages) && <div className="flex flex-col gap-6">
          {features.meals && <div className={`rounded-2xl p-4 md:p-6 shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <Utensils className={`w-6 h-6 flex-shrink-0 ${darkMode ? 'text-orange-400' : 'text-orange-500'}`} />
                <h2 className={`text-lg md:text-2xl font-bold truncate ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                  {t.mealsTitle}
                </h2>
              </div>
              <button
                onClick={() => onAdminClick('meals')}
                className={`p-2 rounded-lg transition-all hover:scale-110 active:scale-95 ${
                  darkMode ? 'text-orange-400 hover:bg-gray-700' : 'text-orange-500 hover:bg-orange-50'
                }`}
                title={t.editMeals}
              >
                <Pencil className="w-5 h-5" />
              </button>
            </div>
            {meals.length === 0 ? (
              <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                {t.noMealsHome}
              </p>
            ) : (
              <div className="space-y-2">
                {getWeekDays().map((day) => {
                  const selectedMealId = mealPlan[day.date] || '';
                  const selectedMeal = meals.find((m) => m.id === selectedMealId);
                  const isToday = day.date === new Date().toISOString().split('T')[0];
                  return (
                    <div
                      key={day.date}
                      className={`flex items-center gap-3 p-3 rounded-xl ${
                        isToday
                          ? darkMode ? 'bg-orange-900/40 border border-orange-500/50' : 'bg-orange-50 border border-orange-300'
                          : darkMode ? 'bg-gray-700 border border-gray-600' : 'bg-gray-50 border border-gray-200'
                      }`}
                    >
                      <span className={`text-sm font-bold w-8 shrink-0 ${
                        isToday
                          ? darkMode ? 'text-orange-400' : 'text-orange-600'
                          : darkMode ? 'text-gray-400' : 'text-gray-500'
                      }`}>
                        {day.label}
                      </span>
                      <select
                        value={selectedMealId}
                        onChange={(e) => setMealForDay(day.date, e.target.value)}
                        className={`flex-1 min-w-0 px-3 py-1.5 rounded-lg text-sm border transition-colors ${
                          darkMode
                            ? 'bg-gray-600 border-gray-500 text-gray-100 focus:border-orange-400'
                            : 'bg-white border-gray-300 text-gray-800 focus:border-orange-400'
                        } focus:outline-none focus:ring-1 focus:ring-orange-400`}
                      >
                        <option value="">{t.chooseDinner}</option>
                        {meals.map((meal) => (
                          <option key={meal.id} value={meal.id}>{meal.name}</option>
                        ))}
                      </select>
                      <div className="shrink-0 flex items-center gap-1">
                        <span className="text-lg w-7 text-center">
                          {selectedMeal ? getMealIcon(selectedMeal.name) : ''}
                        </span>
                        {selectedMeal?.recipe_url ? (
                          <a
                            href={selectedMeal.recipe_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            title={t.viewRecipeTitle}
                            className={`flex items-center justify-center w-7 h-7 rounded-md active:scale-95 ${
                              darkMode
                                ? 'text-orange-400 bg-orange-900/40'
                                : 'text-orange-500 bg-orange-100'
                            }`}
                          >
                            <ExternalLink className="w-4 h-4" />
                          </a>
                        ) : (
                          <span className="w-7 h-7 shrink-0" />
                        )}
                        {selectedMeal?.recipe_url && todoStatus?.connected && todoStatus.listId ? (
                          <button
                            onClick={() => openIngredients(selectedMeal)}
                            disabled={ingredientLoading === selectedMeal.id}
                            title={t.todoAddToList}
                            className={`flex items-center justify-center w-7 h-7 rounded-md active:scale-95 transition-colors ${
                              darkMode
                                ? 'text-green-400 bg-green-900/40 hover:bg-green-800/60'
                                : 'text-green-600 bg-green-100 hover:bg-green-200'
                            }`}
                          >
                            {ingredientLoading === selectedMeal.id
                              ? <Loader2 className="w-4 h-4 animate-spin" />
                              : <ShoppingCart className="w-4 h-4" />}
                          </button>
                        ) : (
                          <span className="w-7 h-7 shrink-0" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>}

          {features.messages && (
            <div className={`rounded-2xl p-4 md:p-6 shadow-xl ${darkMode ? 'bg-gray-800' : 'bg-white'}`}>
              <div className="flex items-center gap-2 mb-4">
                <Bell className={`w-6 h-6 flex-shrink-0 ${darkMode ? 'text-yellow-400' : 'text-yellow-500'}`} />
                <h2 className={`text-lg md:text-2xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                  {t.messagesTitle}
                </h2>
              </div>

              <div className="space-y-2 mb-4">
                {messages.length === 0 && (
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                    {t.noMessages}
                  </p>
                )}
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    className={`flex items-start gap-3 p-3 rounded-xl ${
                      darkMode ? 'bg-gray-700' : 'bg-yellow-50 border border-yellow-200'
                    }`}
                  >
                    <p className={`flex-1 text-sm leading-relaxed ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                      {msg.text}
                    </p>
                    <button
                      onClick={() => dismissMessage(msg.id)}
                      title={t.delete}
                      className={`flex-shrink-0 rounded-full p-1 transition-colors ${
                        darkMode ? 'hover:bg-gray-600 text-gray-400 hover:text-gray-200' : 'hover:bg-yellow-200 text-gray-400 hover:text-gray-600'
                      }`}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder={t.messagePlaceholder}
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && addMessage()}
                  maxLength={500}
                  className={`flex-1 min-w-0 px-3 py-2 rounded-lg text-sm border focus:outline-none focus:ring-2 focus:ring-yellow-400 focus:border-transparent ${
                    darkMode
                      ? 'bg-gray-700 border-gray-600 text-gray-100 placeholder-gray-400'
                      : 'bg-gray-50 border-gray-300 text-gray-800'
                  }`}
                />
                <button
                  onClick={addMessage}
                  disabled={!newMessage.trim()}
                  className="flex-shrink-0 p-2 rounded-lg bg-yellow-500 hover:bg-yellow-600 text-white disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  title={t.addMessage}
                >
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            </div>
          )}
          </div>}
        </div>}
      </div>

      {ingredientModal && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center p-4 z-50"
          onClick={() => setIngredientModal(null)}
        >
          <div
            className={`rounded-2xl p-5 w-full max-w-md shadow-2xl max-h-[85vh] flex flex-col ${darkMode ? 'bg-gray-800' : 'bg-white'}`}
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start justify-between mb-1">
              <div className="min-w-0 flex-1">
                <h2 className={`text-lg font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{t.todoIngredients}</h2>
                <p className={`text-sm truncate ${darkMode ? 'text-gray-400' : 'text-gray-500'}`}>
                  {t.todoIngredientsDesc(todoStatus?.listName ?? '')}
                  {ingredientModal.recipeYield && (
                    <span className="ml-2 text-xs opacity-70">· {ingredientModal.recipeYield} {t.servings}</span>
                  )}
                </p>
              </div>
              <button onClick={() => setIngredientModal(null)} className={`flex-shrink-0 ml-2 p-1 rounded-full ${darkMode ? 'hover:bg-gray-700 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex gap-3 mb-3 mt-3">
              <button
                onClick={() => setSelectedIngredients(new Set(ingredientModal.ingredients))}
                className={`text-sm px-3 py-1 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
              >{t.todoSelectAll}</button>
              <button
                onClick={() => setSelectedIngredients(new Set())}
                className={`text-sm px-3 py-1 rounded-lg transition-colors ${darkMode ? 'bg-gray-700 hover:bg-gray-600 text-gray-200' : 'bg-gray-100 hover:bg-gray-200 text-gray-700'}`}
              >{t.todoDeselectAll}</button>
            </div>

            <div className="overflow-y-auto flex-1 space-y-1 -mx-1 px-1">
              {ingredientModal.ingredients.map((ing, i) => {
                const checked = selectedIngredients.has(ing);
                return (
                  <button
                    key={i}
                    onClick={() => setSelectedIngredients(prev => {
                      const next = new Set(prev);
                      checked ? next.delete(ing) : next.add(ing);
                      return next;
                    })}
                    className={`w-full text-left flex items-center gap-3 px-3 py-2 rounded-xl transition-colors ${
                      checked
                        ? darkMode ? 'bg-green-900/40 border border-green-600/50' : 'bg-green-50 border border-green-300'
                        : darkMode ? 'bg-gray-700 border border-gray-600' : 'bg-gray-50 border border-gray-200'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded flex-shrink-0 flex items-center justify-center border-2 transition-colors ${
                      checked ? 'bg-green-500 border-green-500' : darkMode ? 'border-gray-500' : 'border-gray-300'
                    }`}>
                      {checked && <Check className="w-3 h-3 text-white" />}
                    </div>
                    <span className={`text-sm ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>{ing}</span>
                  </button>
                );
              })}
            </div>

            <button
              onClick={addIngredientsToList}
              disabled={addingToList || selectedIngredients.size === 0}
              className="mt-4 w-full flex items-center justify-center gap-2 px-4 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-semibold transition-colors disabled:opacity-50"
            >
              {addingToList
                ? <><Loader2 className="w-5 h-5 animate-spin" />{t.todoAdding}</>
                : <><ShoppingCart className="w-5 h-5" />{t.todoAddToList} ({selectedIngredients.size})</>}
            </button>
          </div>
        </div>
      )}

      {selectedChildTips && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedChildTips(null)}
        >
          <div
            className={`rounded-3xl p-5 md:p-8 max-w-2xl w-full shadow-2xl ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center text-2xl shadow-lg flex-shrink-0"
                  style={{
                    backgroundColor: selectedChildTips.child.color + '20',
                    borderWidth: 3,
                    borderColor: selectedChildTips.child.color,
                  }}
                >
                  {selectedChildTips.child.avatar_emoji}
                </div>
                <div className="min-w-0">
                  <h2 className={`text-xl font-bold truncate ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                    {t.tipsFor(selectedChildTips.child.name)}
                  </h2>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    {t.tipsSubtitle}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedChildTips(null)}
                className={`flex-shrink-0 ml-2 rounded-full p-2 transition-colors ${
                  darkMode ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
                }`}
              >
                <X className={`w-6 h-6 ${darkMode ? 'text-gray-300' : 'text-gray-600'}`} />
              </button>
            </div>

            <div className="space-y-4">
              {selectedChildTips.tips.map((tip, index) => (
                <div
                  key={tip.taskId}
                  className={`p-5 rounded-2xl transition-all ${
                    darkMode
                      ? 'bg-gray-700'
                      : 'bg-gradient-to-r from-blue-50 to-indigo-50'
                  }`}
                  style={{
                    borderLeft: `4px solid ${selectedChildTips.child.color}`,
                  }}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm"
                      style={{ backgroundColor: selectedChildTips.child.color }}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className={`text-lg leading-relaxed ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                        {tip.message}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setSelectedChildTips(null)}
                className="px-6 py-3 rounded-xl font-semibold transition-all hover:scale-105 active:scale-95"
                style={{
                  backgroundColor: selectedChildTips.child.color,
                  color: 'white',
                }}
              >
                {t.understood}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
