import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { Settings, Users, Trophy } from 'lucide-react';
import type { Child } from '../lib/api';

interface ChildWithProgress extends Child {
  progress: number;
}

interface HomeScreenProps {
  onSelectChild: (child: Child) => void;
  onAdminClick: () => void;
}

export function HomeScreen({ onSelectChild, onAdminClick }: HomeScreenProps) {
  const [children, setChildren] = useState<ChildWithProgress[]>([]);

  useEffect(() => {
    loadChildrenWithProgress();
  }, []);

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
            return { ...child, progress: 0 };
          }

          const totalCompleted = completionsData.reduce(
            (sum, completion) => {
              const task = tasksData.find((t) => t.id === completion.task_id);
              return sum + Math.min(completion.completion_count, task?.target_count || 0);
            },
            0
          );

          const progress = Math.round((totalCompleted / totalTarget) * 100);
          return { ...child, progress };
        })
      );

      setChildren(childrenWithProgress);
    } catch (error) {
      console.error('Failed to load children with progress', error);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 p-4">
      <div className="max-w-4xl mx-auto pt-12">
        <div className="text-center mb-12">
          <h1 className="text-6xl font-bold text-gray-800 mb-8 drop-shadow-lg">
            Ukeoppgaver
          </h1>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {children.map((child) => (
            <button
              key={child.id}
              onClick={() => onSelectChild(child)}
              className="group relative bg-white rounded-3xl p-8 shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105 active:scale-95"
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
                <h2 className="text-3xl font-bold text-gray-800">{child.name}</h2>
                <div className="w-full px-4">
                  <div className="bg-gray-200 rounded-full h-4 overflow-hidden">
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
          ))}
        </div>

        {children.length === 0 && (
          <div className="bg-white rounded-3xl p-12 shadow-2xl text-center mb-8">
            <Users className="w-24 h-24 text-gray-400 mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-gray-700 mb-2">Ingen barn registrert ennå</h2>
            <p className="text-gray-600 mb-6">Bruk admin-panelet for å legge til barn og oppgaver</p>
          </div>
        )}

        <button
          onClick={onAdminClick}
          className="w-full bg-white rounded-2xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95 flex items-center justify-center gap-3"
        >
          <Settings className="w-8 h-8 text-gray-700" />
          <span className="text-2xl font-bold text-gray-700">Admin</span>
        </button>
      </div>
    </div>
  );
}
