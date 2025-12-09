const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

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
  calendar_id: string;
  api_key: string;
  created_at: string;
  updated_at: string;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  start: string;
  end: string;
  description?: string;
}

export const api = {
  async getChildren(): Promise<Child[]> {
    const response = await fetch(`${API_URL}/children`);
    return response.json();
  },

  async createChild(data: Omit<Child, 'id' | 'created_at'>): Promise<Child> {
    const response = await fetch(`${API_URL}/children`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async deleteChild(id: string): Promise<void> {
    await fetch(`${API_URL}/children/${id}`, { method: 'DELETE' });
  },

  async getTasks(): Promise<Task[]> {
    const response = await fetch(`${API_URL}/tasks`);
    return response.json();
  },

  async createTask(data: Omit<Task, 'id' | 'created_at' | 'is_active'>): Promise<Task> {
    const response = await fetch(`${API_URL}/tasks`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async updateTask(id: string, data: Partial<Omit<Task, 'id' | 'created_at'>>): Promise<Task> {
    const response = await fetch(`${API_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async deleteTask(id: string): Promise<void> {
    await fetch(`${API_URL}/tasks/${id}`, { method: 'DELETE' });
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
    await fetch(`${API_URL}/reset-week`, { method: 'DELETE' });
  },

  async getCalendarSettings(): Promise<CalendarSettings | null> {
    const response = await fetch(`${API_URL}/calendar-settings`);
    return response.json();
  },

  async updateCalendarSettings(data: { calendar_id: string; api_key: string }): Promise<CalendarSettings> {
    const response = await fetch(`${API_URL}/calendar-settings`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return response.json();
  },

  async getCalendarEvents(): Promise<CalendarEvent[]> {
    const response = await fetch(`${API_URL}/calendar-events`);
    if (!response.ok) {
      return [];
    }
    return response.json();
  },
};
