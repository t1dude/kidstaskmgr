import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { Plus, Trash2, Settings, Users } from 'lucide-react';
import type { Database } from '../lib/database.types';

type Task = Database['public']['Tables']['tasks']['Row'];
type Child = Database['public']['Tables']['children']['Row'];

interface AdminViewProps {
  onBack: () => void;
}

export function AdminView({ onBack }: AdminViewProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [children, setChildren] = useState<Child[]>([]);
  const [newTask, setNewTask] = useState({ title: '', target_count: 1, icon: 'check-circle' });
  const [newChild, setNewChild] = useState({ name: '', color: '#3b82f6', avatar_emoji: '😊' });
  const [activeTab, setActiveTab] = useState<'tasks' | 'children'>('tasks');

  useEffect(() => {
    loadTasks();
    loadChildren();
  }, []);

  async function loadTasks() {
    const { data } = await supabase
      .from('tasks')
      .select('*')
      .order('created_at', { ascending: true });
    if (data) setTasks(data);
  }

  async function loadChildren() {
    const { data } = await supabase
      .from('children')
      .select('*')
      .order('created_at', { ascending: true });
    if (data) setChildren(data);
  }

  async function addTask() {
    if (!newTask.title.trim()) return;

    const { error } = await supabase.from('tasks').insert([{
      title: newTask.title,
      target_count: newTask.target_count,
      icon: newTask.icon,
      is_active: true
    }]);

    if (!error) {
      setNewTask({ title: '', target_count: 1, icon: 'check-circle' });
      loadTasks();
    }
  }

  async function deleteTask(id: string) {
    await supabase.from('tasks').delete().eq('id', id);
    loadTasks();
  }

  async function addChild() {
    if (!newChild.name.trim()) return;

    const { error } = await supabase.from('children').insert([{
      name: newChild.name,
      color: newChild.color,
      avatar_emoji: newChild.avatar_emoji
    }]);

    if (!error) {
      setNewChild({ name: '', color: '#3b82f6', avatar_emoji: '😊' });
      loadChildren();
    }
  }

  async function deleteChild(id: string) {
    await supabase.from('children').delete().eq('id', id);
    loadChildren();
  }

  async function resetWeek() {
    if (!confirm('Er du sikker på at du vil nullstille alle oppgaver for denne uken?')) return;

    const { error } = await supabase.from('task_completions').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    if (!error) {
      alert('Uken er nullstilt!');
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 p-4">
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
                    <div>
                      <h4 className="font-semibold text-gray-800">{task.title}</h4>
                      <p className="text-sm text-gray-600">{task.target_count}x per uke</p>
                    </div>
                    <button
                      onClick={() => deleteTask(task.id)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
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
