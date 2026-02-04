import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Settings, Users, Trophy, Calendar as CalendarIcon, Moon, Sun, MessageCircle, X } from 'lucide-react';
import type { Child, CalendarEvent, Task, TaskCompletion } from '../lib/api';
import { generateTips, type Tip, type TaskWithCompletion } from '../lib/tipsGenerator';

interface ChildWithProgress extends Child {
  progress: number;
  tips: Tip[];
}

interface HomeScreenProps {
  onSelectChild: (child: Child) => void;
  onAdminClick: () => void;
}

export function HomeScreen({ onSelectChild, onAdminClick }: HomeScreenProps) {
  const [children, setChildren] = useState<ChildWithProgress[]>([]);
  const [calendarEvents, setCalendarEvents] = useState<CalendarEvent[]>([]);
  const [selectedChildTips, setSelectedChildTips] = useState<{ child: Child; tips: Tip[] } | null>(null);
  const [darkMode, setDarkMode] = useState(() => {
    const saved = localStorage.getItem('darkMode');
    return saved ? JSON.parse(saved) : false;
  });

  useEffect(() => {
    loadChildrenWithProgress();
    loadCalendarEvents();

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
            (sum, completion) => {
              return sum + completion.completion_count;
            },
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

          const tips = generateTips(tasksWithCompletions, progress);

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

  function getDayLabel(dateString: string): string {
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const isToday = date.toDateString() === today.toDateString();
    const isTomorrow = date.toDateString() === tomorrow.toDateString();

    if (isToday) return 'I dag';
    if (isTomorrow) return 'I morgen';

    const weekdays = ['søndag', 'mandag', 'tirsdag', 'onsdag', 'torsdag', 'fredag', 'lørdag'];
    const months = ['januar', 'februar', 'mars', 'april', 'mai', 'juni', 'juli', 'august', 'september', 'oktober', 'november', 'desember'];

    return `${weekdays[date.getDay()]} ${date.getDate()}. ${months[date.getMonth()]}`;
  }

  function groupEventsByDay(events: CalendarEvent[]): Record<string, CalendarEvent[]> {
    const grouped: Record<string, CalendarEvent[]> = {};

    events.forEach((event) => {
      const date = new Date(event.start);
      const dateKey = date.toDateString();

      if (!grouped[dateKey]) {
        grouped[dateKey] = [];
      }
      grouped[dateKey].push(event);
    });

    return grouped;
  }

  function formatEventTime(startString: string, endString: string): string {
    if (startString.length === 10) {
      return 'Hele dagen';
    }
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
          title={darkMode ? 'Lys modus' : 'Mørk modus'}
        >
          {darkMode ? (
            <Sun className="w-6 h-6 text-yellow-400" />
          ) : (
            <Moon className="w-6 h-6 text-gray-700" />
          )}
        </button>
        <button
          onClick={onAdminClick}
          className={`rounded-full p-3 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-110 active:scale-95 ${
            darkMode ? 'bg-gray-700' : 'bg-white'
          }`}
          title="Admin"
        >
          <Settings className={`w-6 h-6 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`} />
        </button>
      </div>

      <div className="max-w-4xl mx-auto pt-12">
        <div className="text-center mb-12">
          <h1 className={`text-6xl font-bold mb-8 drop-shadow-lg ${
            darkMode ? 'text-gray-100' : 'text-gray-800'
          }`}>
            Ukeoppgaver
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {children.map((child) => (
            <div key={child.id} className="relative">
              <button
                onClick={() => onSelectChild(child)}
                className={`group relative rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 active:scale-95 w-full ${
                  darkMode ? 'bg-gray-800' : 'bg-white'
                }`}
                style={{
                  borderWidth: 4,
                  borderColor: child.color,
                }}
              >
                <div className="flex flex-col items-center gap-4">
                  <div
                    className="w-32 h-32 rounded-full flex items-center justify-center text-7xl shadow-xl transition-transform group-hover:scale-110 relative"
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
                  <h2 className={`text-3xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
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
                    Trykk for å starte
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
                  title="Se tips"
                >
                  <MessageCircle className="w-6 h-6 text-white" />
                  <div className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold">
                    {child.tips.length}
                  </div>
                </button>
              )}
            </div>
          ))}
        </div>

        {children.length === 0 && (
          <div className={`rounded-3xl p-12 shadow-2xl text-center mb-8 ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <Users className={`w-24 h-24 mx-auto mb-4 ${darkMode ? 'text-gray-500' : 'text-gray-400'}`} />
            <h2 className={`text-2xl font-bold mb-2 ${darkMode ? 'text-gray-200' : 'text-gray-700'}`}>
              Ingen barn registrert ennå
            </h2>
            <p className={`mb-6 ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
              Bruk admin-panelet for å legge til barn og oppgaver
            </p>
          </div>
        )}

        {calendarEvents.length > 0 && (
          <div className={`rounded-2xl p-6 shadow-xl ${
            darkMode ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className="flex items-center gap-3 mb-6">
              <CalendarIcon className={`w-7 h-7 ${darkMode ? 'text-blue-400' : 'text-blue-600'}`} />
              <h2 className={`text-2xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                Kommende hendelser
              </h2>
            </div>
            <div className="space-y-6">
              {Object.entries(groupEventsByDay(calendarEvents)).map(([dateKey, events]) => (
                <div key={dateKey} className="space-y-2">
                  <h3 className={`text-lg font-bold capitalize border-b-2 pb-2 ${
                    darkMode
                      ? 'text-gray-200 border-blue-500'
                      : 'text-gray-700 border-blue-200'
                  }`}>
                    {getDayLabel(events[0].start)}
                  </h3>
                  <div className="space-y-2">
                    {events.map((event) => (
                      <div
                        key={event.id}
                        className={`flex items-start gap-3 p-3 rounded-lg transition-colors ${
                          darkMode
                            ? 'bg-gray-700 hover:bg-gray-600'
                            : 'bg-blue-50 hover:bg-blue-100'
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
          </div>
        )}
      </div>

      {selectedChildTips && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50"
          onClick={() => setSelectedChildTips(null)}
        >
          <div
            className={`rounded-3xl p-8 max-w-2xl w-full shadow-2xl ${
              darkMode ? 'bg-gray-800' : 'bg-white'
            }`}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-4">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center text-3xl shadow-lg"
                  style={{
                    backgroundColor: selectedChildTips.child.color + '20',
                    borderWidth: 3,
                    borderColor: selectedChildTips.child.color,
                  }}
                >
                  {selectedChildTips.child.avatar_emoji}
                </div>
                <div>
                  <h2 className={`text-2xl font-bold ${darkMode ? 'text-gray-100' : 'text-gray-800'}`}>
                    Tips til {selectedChildTips.child.name}
                  </h2>
                  <p className={`text-sm ${darkMode ? 'text-gray-400' : 'text-gray-600'}`}>
                    Oppgaver som trenger litt kjærlighet
                  </p>
                </div>
              </div>
              <button
                onClick={() => setSelectedChildTips(null)}
                className={`rounded-full p-2 transition-colors ${
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
                Skjønner!
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
