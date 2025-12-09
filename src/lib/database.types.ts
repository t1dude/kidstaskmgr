export interface Database {
  public: {
    Tables: {
      children: {
        Row: {
          id: string;
          name: string;
          color: string;
          avatar_emoji: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          color: string;
          avatar_emoji: string;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          color?: string;
          avatar_emoji?: string;
          created_at?: string;
        };
      };
      tasks: {
        Row: {
          id: string;
          title: string;
          description: string;
          target_count: number;
          icon: string;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          title: string;
          description?: string;
          target_count?: number;
          icon?: string;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          title?: string;
          description?: string;
          target_count?: number;
          icon?: string;
          is_active?: boolean;
          created_at?: string;
        };
      };
      task_completions: {
        Row: {
          id: string;
          child_id: string;
          task_id: string;
          completion_count: number;
          week_start_date: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          child_id: string;
          task_id: string;
          completion_count?: number;
          week_start_date?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          child_id?: string;
          task_id?: string;
          completion_count?: number;
          week_start_date?: string;
          updated_at?: string;
        };
      };
    };
  };
}
