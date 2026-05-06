const API_URL = import.meta.env.VITE_API_URL || '/api';

function authHeaders(): Record<string, string> {
  const token = sessionStorage.getItem('adminToken');
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export interface Child {
  id: string;
  name: string;
  color: string;
  avatar_emoji: string;
  created_at: string;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  target_count: number;
  icon: string;
  is_active: boolean;
  created_at: string;
}

export interface TaskCompletion {
  id: string;
  child_id: string;
  task_id: string;
  completion_count: number;
  week_start_date: string;
  updated_at: string;
}

export interface CalendarSettings {
  id: string;
  ical_url: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  description?: string;
  location?: string;
}

export interface Meal {
  id: string;
  name: string;
  recipe_url: string | null;
  created_at: string;
}

export interface MealPlanEntry {
  id: string;
  meal_id: string | null;
  meal_name: string | null;
  planned_date: string;
}

export interface RecipeInspiration {
  title: string;
  url: string;
  image: string;
  rating: string;
  difficulty: string;
  time: string;
}

export const api = {
  async getSettings(): Promise<{ requirePinForHome: boolean }> {
    const response = await fetch(`${API_URL}/settings`);
    return response.json();
  },

  async updateSettings(data: { requirePinForHome: boolean }): Promise<void> {
    await fetch(`${API_URL}/settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data),
    });
  },

  async login(pin: string): Promise<{ token: string }> {
    const response = await fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.error || 'Feil PIN-kode');
    }
    return response.json();
  },

  async getChildren(): Promise<Child[]> {
    const response = await fetch(`${API_URL}/children`);
    return response.json();
  },

  async createChild(data: Omit<Child, 'id' | 'created_at'>): Promise<Child> {
    const response = await fetch(`${API_URL}/children`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async deleteChild(id: string): Promise<void> {
    await fetch(`${API_URL}/children/${id}`, { method: 'DELETE', headers: authHeaders() });
  },

  async getTasks(): Promise<Task[]> {
    const response = await fetch(`${API_URL}/tasks`);
    return response.json();
  },

  async createTask(data: Omit<Task, 'id' | 'created_at' | 'is_active'>): Promise<Task> {
    const response = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async updateTask(id: string, data: Partial<Omit<Task, 'id' | 'created_at'>>): Promise<Task> {
    const response = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async deleteTask(id: string): Promise<void> {
    await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE', headers: authHeaders() });
  },

  async getTaskCompletions(childId: string, weekStart: string): Promise<TaskCompletion[]> {
    const response = await fetch(`${API_URL}/task-completions/${childId}/${weekStart}`);
    return response.json();
  },

  async upsertTaskCompletion(data: Omit<TaskCompletion, 'id' | 'updated_at'>): Promise<TaskCompletion> {
    const response = await fetch(`${API_URL}/task-completions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async deleteTaskCompletion(id: string): Promise<void> {
    await fetch(`${API_URL}/task-completions/${id}`, { method: 'DELETE' });
  },

  async resetWeek(): Promise<void> {
    await fetch(`${API_URL}/reset-week`, { method: 'DELETE', headers: authHeaders() });
  },

  async getCalendarSettings(): Promise<CalendarSettings | null> {
    const response = await fetch(`${API_URL}/calendar-settings`);
    return response.json();
  },

  async updateCalendarSettings(data: { ical_url: string }): Promise<CalendarSettings> {
    const response = await fetch(`${API_URL}/calendar-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify(data),
    });
    if (!response.ok) {
      throw new Error('Failed to update calendar settings');
    }
    return response.json();
  },

  async getCalendarEvents(): Promise<CalendarEvent[]> {
    const response = await fetch(`${API_URL}/calendar-events`);
    if (!response.ok) {
      return [];
    }
    return response.json();
  },

  async getMeals(): Promise<Meal[]> {
    const response = await fetch(`${API_URL}/meals`);
    return response.json();
  },

  async createMeal(name: string, recipeUrl?: string): Promise<Meal> {
    const response = await fetch(`${API_URL}/meals`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', ...authHeaders() },
      body: JSON.stringify({ name, recipe_url: recipeUrl ?? null }),
    });
    return response.json();
  },

  async deleteMeal(id: string): Promise<void> {
    await fetch(`${API_URL}/meals/${id}`, { method: 'DELETE', headers: authHeaders() });
  },

  async getMealPlan(weekStart: string): Promise<MealPlanEntry[]> {
    const response = await fetch(`${API_URL}/meal-plan?week_start=${weekStart}`);
    return response.json();
  },

  async setMealPlan(date: string, mealId: string | null): Promise<MealPlanEntry> {
    const response = await fetch(`${API_URL}/meal-plan/${date}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ meal_id: mealId }),
    });
    return response.json();
  },

  async deleteMealPlan(date: string): Promise<void> {
    await fetch(`${API_URL}/meal-plan/${date}`, { method: 'DELETE' });
  },

  async getMealInspiration(query: string): Promise<RecipeInspiration[]> {
    const response = await fetch(`${API_URL}/meal-inspiration?q=${encodeURIComponent(query)}`);
    if (!response.ok) throw new Error('Failed to fetch inspiration');
    return response.json();
  },
};
