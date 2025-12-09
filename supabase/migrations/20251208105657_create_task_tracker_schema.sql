/*
  # Task Tracker Schema for Children

  ## Overview
  This migration creates a task tracking system for two children to log completed tasks 
  according to a weekly plan with manual reset functionality.

  ## New Tables
  
  ### `children`
  Stores information about the two children using the app.
  - `id` (uuid, primary key) - Unique identifier
  - `name` (text) - Child's name
  - `color` (text) - Unique color for visual identification
  - `avatar_emoji` (text) - Fun emoji avatar for the child
  - `created_at` (timestamptz) - Creation timestamp

  ### `tasks`
  Stores weekly tasks that children need to complete.
  - `id` (uuid, primary key) - Unique identifier
  - `title` (text) - Task name
  - `description` (text, optional) - Task description
  - `target_count` (integer) - How many times task should be completed per week
  - `icon` (text) - Icon name from lucide-react
  - `created_at` (timestamptz) - Creation timestamp
  - `is_active` (boolean) - Whether task is currently active

  ### `task_completions`
  Tracks how many times each child has completed each task.
  - `id` (uuid, primary key) - Unique identifier
  - `child_id` (uuid, foreign key) - References children table
  - `task_id` (uuid, foreign key) - References tasks table
  - `completion_count` (integer) - Number of times completed
  - `week_start_date` (date) - Start date of the current week
  - `updated_at` (timestamptz) - Last update timestamp

  ## Security
  - All tables have RLS enabled
  - Public read access for all data (suitable for family use)
  - Public write access for task completions (children can update their progress)
  - Admin-like access for managing tasks and children

  ## Notes
  - Designed for a simple family app without complex authentication
  - Manual weekly reset will update week_start_date and reset completion_count
*/

-- Create children table
CREATE TABLE IF NOT EXISTS children (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  color text NOT NULL,
  avatar_emoji text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text DEFAULT '',
  target_count integer NOT NULL DEFAULT 1,
  icon text NOT NULL DEFAULT 'check-circle',
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create task_completions table
CREATE TABLE IF NOT EXISTS task_completions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  child_id uuid NOT NULL REFERENCES children(id) ON DELETE CASCADE,
  task_id uuid NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  completion_count integer NOT NULL DEFAULT 0,
  week_start_date date NOT NULL DEFAULT CURRENT_DATE,
  updated_at timestamptz DEFAULT now(),
  UNIQUE(child_id, task_id, week_start_date)
);

-- Enable RLS
ALTER TABLE children ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE task_completions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for children
CREATE POLICY "Anyone can view children"
  ON children FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert children"
  ON children FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update children"
  ON children FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete children"
  ON children FOR DELETE
  USING (true);

-- RLS Policies for tasks
CREATE POLICY "Anyone can view tasks"
  ON tasks FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert tasks"
  ON tasks FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update tasks"
  ON tasks FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete tasks"
  ON tasks FOR DELETE
  USING (true);

-- RLS Policies for task_completions
CREATE POLICY "Anyone can view task completions"
  ON task_completions FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert task completions"
  ON task_completions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Anyone can update task completions"
  ON task_completions FOR UPDATE
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Anyone can delete task completions"
  ON task_completions FOR DELETE
  USING (true);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_task_completions_child_id ON task_completions(child_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_task_id ON task_completions(task_id);
CREATE INDEX IF NOT EXISTS idx_task_completions_week_start ON task_completions(week_start_date);