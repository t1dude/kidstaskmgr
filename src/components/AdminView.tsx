import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Plus, Trash2, Settings, Edit, Check, X } from 'lucide-react';
import type { Task, Child, Meal } from '../lib/api';

interface AdminViewProps {
  onBack: () => void;
  initialTab?: 'tasks' | 'children' | 'calendar' | 'meals';
}

export function AdminView({ onBack, initialTab = 'tasks' }: AdminViewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [newTask, setNewTask] = useState({ title: '', target_count: 1, icon: 'check-circle' });
  const [newChild, setNewChild] = useState({ name: '', color: '#3b82f6', avatar_emoji: '😊' });
  const [activeTab, setActiveTab] = useState<'tasks' | 'children' | 'calendar' | 'meals'>(initialTab);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [editingTaskCount, setEditingTaskCount] = useState<number>(1);
  const [calendarSettings, setCalendarSettings] = useState({ ical_url: '' });
  const [meals, setMeals] = useState<Meal[]>([]);
  const [newMealName, setNewMealName] = useState('');

  useEffect(() => {
    loadTasks();
    loadChildren();
    loadCalendarSettings();
    loadMeals();
  }, []);

  async function loadTasks() {
    try {
      const data = await api.getTasks();
      setTasks(data);
    } catch (error) {
      console.error('Failed to load tasks', error);
    }
  }

  async function loadChildren() {
    try {
      const data = await api.getChildren();
      setChildren(data);
    } catch (error) {
      console.error('Failed to load children', error);
    }
  }

  async function addTask() {
    if (!newTask.title.trim()) return;

    try {
      await api.createTask({
        title: newTask.title,
        target_count: newTask.target_count,
        icon: newTask.icon,
        description: ''
      });
      setNewTask({ title: '', target_count: 1, icon: 'check-circle' });
      loadTasks();
    } catch (error) {
      console.error('Failed to add task', error);
    }
  }

  async function deleteTask(id: string) {
    try {
      await api.deleteTask(id);
      loadTasks();
    } catch (error) {
      console.error('Failed to delete task', error);
    }
  }

  async function addChild() {
    if (!newChild.name.trim()) return;

    try {
      await api.createChild({
        name: newChild.name,
        color: newChild.color,
        avatar_emoji: newChild.avatar_emoji
      });
      setNewChild({ name: '', color: '#3b82f6', avatar_emoji: '😊' });
      loadChildren();
    } catch (error) {
      console.error('Failed to add child', error);
    }
  }

  async function deleteChild(id: string) {
    try {
      await api.deleteChild(id);
      loadChildren();
    } catch (error) {
      console.error('Failed to delete child', error);
    }
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
    } catch (error) {
      console.error('Failed to update task', error);
    }
  }

  async function resetWeek() {
    if (!confirm('Er du sikker på at du vil nullstille alle oppgaver for denne uken?')) return;

    try {
      await api.resetWeek();
      alert('Uken er nullstilt!');
    } catch (error) {
      console.error('Failed to reset week', error);
    }
  }

  async function loadMeals() {
    try {
      const data = await api.getMeals();
      setMeals(data);
    } catch (error) {
      console.error('Failed to load meals', error);
    }
  }

  async function addMeal() {
    if (!newMealName.trim()) return;
    try {
      await api.createMeal(newMealName);
      setNewMealName('');
      loadMeals();
    } catch (error) {
      console.error('Failed to add meal', error);
    }
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
    try {
      await api.deleteMeal(id);
      loadMeals();
    } catch (error) {
      console.error('Failed to delete meal', error);
    }
  }

  async function loadCalendarSettings() {
    try {
      const data = await api.getCalendarSettings();
      if (data) {
        setCalendarSettings({ ical_url: data.ical_url });
      }
    } catch (error) {
      console.error('Failed to load calendar settings', error);
    }
  }

  async function saveCalendarSettings() {
    try {
      await api.updateCalendarSettings(calendarSettings);
      alert('Kalenderinnstillinger lagret!');
    } catch (error) {
      console.error('Failed to save calendar settings', error);
      alert('Kunne ikke lagre kalenderinnstillinger');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <Settings className="w-8 h-8 text-blue-600" />
              <h1 className="text-3xl font-bold text-gray-800">Administrasjon</h1>
            </div>
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Tilbake
            </button>
          </div>

          <div className="flex gap-2 mb-6">
            <button
              onClick={() => setActiveTab('tasks')}
              className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                activeTab === 'tasks'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Oppgaver
            </button>
            <button
              onClick={() => setActiveTab('children')}
              className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                activeTab === 'children'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Barn
            </button>
            <button
              onClick={() => setActiveTab('calendar')}
              className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                activeTab === 'calendar'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Kalender
            </button>
            <button
              onClick={() => setActiveTab('meals')}
              className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                activeTab === 'meals'
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              Måltider
            </button>
          </div>

          {activeTab === 'tasks' && (
            <div>
              <div className="mb-6 p-4 bg-blue-50 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">Legg til ny oppgave</h3>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Oppgavenavn"
                    value={newTask.title}
                    onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <input
                    type="number"
                    min="1"
                    value={newTask.target_count}
                    onChange={(e) => setNewTask({ ...newTask, target_count: parseInt(e.target.value) || 1 })}
                    className="w-20 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    title="Antall ganger per uke"
                  />
                  <button
                    onClick={addTask}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Legg til
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {tasks.map((task) => (
                  <div
                    key={task.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{task.title}</h4>
                      {editingTaskId === task.id ? (
                        <div className="flex items-center gap-2 mt-2">
                          <input
                            type="number"
                            min="1"
                            value={editingTaskCount}
                            onChange={(e) => setEditingTaskCount(parseInt(e.target.value) || 1)}
                            className="w-20 px-3 py-1 border border-blue-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          />
                          <span className="text-sm text-gray-600">ganger per uke</span>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-600">{task.target_count}x per uke</p>
                      )}
                    </div>
                    <div className="flex gap-2">
                      {editingTaskId === task.id ? (
                        <>
                          <button
                            onClick={() => saveTaskEdit(task.id)}
                            className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                            title="Lagre"
                          >
                            <Check className="w-5 h-5" />
                          </button>
                          <button
                            onClick={cancelEditingTask}
                            className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                            title="Avbryt"
                          >
                            <X className="w-5 h-5" />
                          </button>
                        </>
                      ) : (
                        <>
                          <button
                            onClick={() => startEditingTask(task)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="Rediger antall"
                          >
                            <Edit className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => deleteTask(task.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Slett"
                          >
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

          {activeTab === 'children' && (
            <div>
              <div className="mb-6 p-4 bg-green-50 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">Legg til barn</h3>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    placeholder="Navn"
                    value={newChild.name}
                    onChange={(e) => setNewChild({ ...newChild, name: e.target.value })}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                  />
                  <input
                    type="text"
                    placeholder="Emoji"
                    value={newChild.avatar_emoji}
                    onChange={(e) => setNewChild({ ...newChild, avatar_emoji: e.target.value })}
                    className="w-20 px-4 py-2 border border-gray-300 rounded-lg text-center text-2xl"
                  />
                  <input
                    type="color"
                    value={newChild.color}
                    onChange={(e) => setNewChild({ ...newChild, color: e.target.value })}
                    className="w-16 h-11 border border-gray-300 rounded-lg cursor-pointer"
                  />
                  <button
                    onClick={addChild}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Legg til
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {children.map((child) => (
                  <div
                    key={child.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-full flex items-center justify-center text-2xl"
                        style={{ backgroundColor: child.color + '20' }}
                      >
                        {child.avatar_emoji}
                      </div>
                      <h4 className="font-semibold text-gray-800">{child.name}</h4>
                    </div>
                    <button
                      onClick={() => deleteChild(child.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === 'calendar' && (
            <div>
              <div className="mb-6 p-4 bg-purple-50 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">Kalender Innstillinger</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Lim inn den hemmelige iCal-adressen fra kalenderen din. Dette fungerer med Google Calendar, Outlook, Apple Calendar og andre.
                </p>
                <div className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      iCal URL (Hemmelig adresse)
                    </label>
                    <input
                      type="text"
                      placeholder="https://calendar.google.com/calendar/ical/..."
                      value={calendarSettings.ical_url}
                      onChange={(e) => setCalendarSettings({ ...calendarSettings, ical_url: e.target.value })}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                    />
                    <div className="text-xs text-gray-500 mt-2 space-y-1">
                      <p className="font-semibold">Slik finner du iCal-adressen:</p>
                      <p><strong>Google Calendar:</strong> Kalenderinnstillinger → Integrer kalender → Hemmelig adresse i iCal-format</p>
                      <p><strong>Outlook:</strong> Kalenderinnstillinger → Delte kalendere → Publiser en kalender → ICS-format</p>
                    </div>
                  </div>
                  <button
                    onClick={saveCalendarSettings}
                    className="w-full px-6 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                  >
                    Lagre innstillinger
                  </button>
                </div>
              </div>
            </div>
          )}
          {activeTab === 'meals' && (
            <div>
              <div className="mb-6 p-4 bg-orange-50 rounded-lg">
                <h3 className="font-semibold text-gray-700 mb-3">Legg til middag</h3>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="F.eks. Taco, Pasta bolognese..."
                    value={newMealName}
                    onChange={(e) => setNewMealName(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && addMeal()}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-400 focus:border-transparent"
                  />
                  <button
                    onClick={addMeal}
                    className="px-6 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors flex items-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Legg til
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                {meals.length === 0 && (
                  <p className="text-sm text-gray-500 text-center py-4">
                    Ingen middager lagt til ennå
                  </p>
                )}
                {meals.map((meal) => (
                  <div
                    key={meal.id}
                    className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                  >
                    <span className="font-semibold text-gray-800">{getMealIcon(meal.name)} {meal.name}</span>
                    <button
                      onClick={() => deleteMeal(meal.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                      title="Slett"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <button
          onClick={resetWeek}
          className="w-full py-4 bg-red-600 text-white rounded-2xl font-bold text-lg hover:bg-red-700 transition-colors shadow-lg"
        >
          Nullstill uke
        </button>
      </div>
    </div>
  );
}
