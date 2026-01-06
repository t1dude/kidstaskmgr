import { useState, useEffect } from 'react';
import { api } from '../lib/api';
import { CheckCircle, Star, Trophy, Sparkles } from 'lucide-react';
import type { Task, Child } from '../lib/api';

interface ChildViewProps {
  child: Child;
  onBack: () => void;
}

interface TaskWithCompletion extends Task {
  completion_count: number;
}

export function ChildView({ child, onBack }: ChildViewProps) {
  const [tasks, setTasks] = useState<TaskWithCompletion[]>([]);
  const [totalProgress, setTotalProgress] = useState(0);
  const [showCelebration, setShowCelebration] = useState(false);

  useEffect(() => {
    loadTasks();
  }, [child.id]);

  async function loadTasks() {
    try {
      const tasksData = await api.getTasks();
      const completionsData = await api.getTaskCompletions(child.id, getWeekStart());

      const completionsMap = new Map<string, number>();
      completionsData.forEach((c) => {
        completionsMap.set(c.task_id, c.completion_count);
      });

      const tasksWithCompletions = tasksData.map((task) => ({
        ...task,
        completion_count: completionsMap.get(task.id) || 0,
      }));

      setTasks(tasksWithCompletions);
      calculateProgress(tasksWithCompletions);
    } catch (error) {
      console.error('Failed to load tasks', error);
    }
  }

  function getWeekStart() {
    const today = new Date();
    const day = today.getDay();
    const diff = today.getDate() - day + (day === 0 ? -6 : 1);
    const monday = new Date(today.setDate(diff));
    return monday.toISOString().split('T')[0];
  }

  function calculateProgress(tasksData: TaskWithCompletion[]) {
    if (tasksData.length === 0) {
      setTotalProgress(0);
      return;
    }

    const totalTarget = tasksData.reduce((sum, task) => sum + task.target_count, 0);
    const totalCompleted = tasksData.reduce(
      (sum, task) => sum + task.completion_count,
      0
    );

    const progress = Math.round((totalCompleted / totalTarget) * 100);
    setTotalProgress(progress);
  }

  async function incrementTask(task: TaskWithCompletion) {
    try {
      const weekStart = getWeekStart();
      const newCount = task.completion_count + 1;

      await api.upsertTaskCompletion({
        child_id: child.id,
        task_id: task.id,
        completion_count: newCount,
        week_start_date: weekStart,
      });

      if (newCount === task.target_count) {
        setShowCelebration(true);
        setTimeout(() => setShowCelebration(false), 2000);
      }

      loadTasks();
    } catch (error) {
      console.error('Failed to increment task', error);
    }
  }

  async function decrementTask(task: TaskWithCompletion) {
    if (task.completion_count === 0) return;

    try {
      const weekStart = getWeekStart();
      const newCount = task.completion_count - 1;

      if (newCount === 0) {
        const completionsData = await api.getTaskCompletions(child.id, weekStart);
        const existing = completionsData.find(
          (c) => c.task_id === task.id && c.week_start_date === weekStart
        );
        if (existing) {
          await api.deleteTaskCompletion(existing.id);
        }
      } else {
        await api.upsertTaskCompletion({
          child_id: child.id,
          task_id: task.id,
          completion_count: newCount,
          week_start_date: weekStart,
        });
      }

      loadTasks();
    } catch (error) {
      console.error('Failed to decrement task', error);
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-100 to-blue-50 p-4">
      {showCelebration && (
        <div className="fixed inset-0 flex items-center justify-center z-50 pointer-events-none">
          <div className="animate-bounce">
            <div className="text-9xl">🎉</div>
          </div>
          <div className="absolute inset-0 flex items-center justify-center">
            {[...Array(20)].map((_, i) => (
              <Star
                key={i}
                className="absolute text-yellow-400 animate-ping"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  animationDelay: `${Math.random() * 0.5}s`,
                }}
              />
            ))}
          </div>
        </div>
      )}

      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl p-6 mb-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center text-4xl shadow-lg"
                style={{ backgroundColor: child.color + '30', borderColor: child.color, borderWidth: 3 }}
              >
                {child.avatar_emoji}
              </div>
              <div>
                <h1 className="text-3xl font-bold text-gray-800">{child.name}</h1>
                <p className="text-gray-600">Dine oppgaver for uken</p>
              </div>
            </div>
            <button
              onClick={onBack}
              className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
            >
              Tilbake
            </button>
          </div>

          <div className="mb-6 bg-gradient-to-r from-blue-500 to-purple-500 rounded-2xl p-6 text-white">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Trophy className="w-6 h-6" />
                <span className="font-bold text-lg">Ukens fremdrift</span>
              </div>
              <span className="text-3xl font-bold">{totalProgress}%</span>
            </div>
            <div className="w-full bg-white/30 rounded-full h-6 overflow-hidden">
              <div
                className="bg-white h-full rounded-full transition-all duration-500 flex items-center justify-center text-sm font-bold text-purple-600"
                style={{ width: `${totalProgress}%` }}
              >
                {totalProgress > 10 && `${totalProgress}%`}
              </div>
            </div>
          </div>

          <div className="space-y-4">
            {tasks.map((task) => {
              const isComplete = task.completion_count >= task.target_count;
              const progress = (task.completion_count / task.target_count) * 100;

              return (
                <div
                  key={task.id}
                  className={`p-6 rounded-2xl transition-all duration-300 ${
                    isComplete
                      ? 'bg-gradient-to-r from-green-100 to-emerald-100 border-2 border-green-400'
                      : 'bg-gradient-to-r from-gray-50 to-gray-100 border-2 border-gray-200'
                  }`}
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      {isComplete && <Sparkles className="w-6 h-6 text-green-600" />}
                      <h3 className="text-xl font-bold text-gray-800">{task.title}</h3>
                    </div>
                    {isComplete && <CheckCircle className="w-8 h-8 text-green-600" />}
                  </div>

                  <div className="mb-4">
                    <div className="w-full bg-gray-200 rounded-full h-4 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isComplete ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      ></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-lg font-semibold text-gray-700">
                      {task.completion_count} / {task.target_count} ganger
                    </span>
                    <div className="flex gap-2">
                      <button
                        onClick={() => decrementTask(task)}
                        disabled={task.completion_count === 0}
                        className={`w-12 h-12 rounded-full text-2xl font-bold transition-all ${
                          task.completion_count === 0
                            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            : 'bg-red-500 text-white hover:bg-red-600 active:scale-95'
                        }`}
                      >
                        -
                      </button>
                      <button
                        onClick={() => incrementTask(task)}
                        className="w-12 h-12 rounded-full bg-green-500 text-white text-2xl font-bold hover:bg-green-600 active:scale-95 transition-all"
                        style={{ backgroundColor: child.color }}
                      >
                        +
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}

            {tasks.length === 0 && (
              <div className="text-center py-12 text-gray-500">
                <p className="text-xl">Ingen oppgaver ennå!</p>
                <p className="mt-2">Be voksen om å legge til oppgaver.</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
