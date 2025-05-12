-- ADHDplanner Supabase Database Schema

-- Tasks table
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT FALSE,
  archived BOOLEAN DEFAULT FALSE,
  priority TEXT,
  due_date TEXT,
  project_id TEXT,
  parent_task_id TEXT,
  subtasks TEXT[],
  category_ids TEXT[],
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Create index on common query patterns
CREATE INDEX IF NOT EXISTS idx_tasks_completed ON tasks(completed);
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_parent_task_id ON tasks(parent_task_id);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Daily plans table
CREATE TABLE IF NOT EXISTS daily_plans (
  id TEXT PRIMARY KEY, -- typically the date in YYYY-MM-DD format
  date TEXT NOT NULL, -- date in YYYY-MM-DD format
  time_blocks JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_daily_plans_date ON daily_plans(date);

-- Work schedules table
CREATE TABLE IF NOT EXISTS work_schedules (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  shifts JSONB, -- Array of work shifts
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Journal entries table
CREATE TABLE IF NOT EXISTS journal_entries (
  id TEXT PRIMARY KEY,
  date TEXT NOT NULL, -- date in YYYY-MM-DD format
  content TEXT,
  week_number INTEGER,
  week_year INTEGER,
  review_section_id TEXT,
  is_completed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_journal_entries_date ON journal_entries(date);
CREATE INDEX IF NOT EXISTS idx_journal_entries_week ON journal_entries(week_number, week_year);

-- Row Level Security (RLS) Policies
-- Allows only authenticated users to access their own data
-- Uncomment these if you implement authentication

-- ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE daily_plans ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE work_schedules ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE journal_entries ENABLE ROW LEVEL SECURITY;

-- CREATE POLICY "Users can only access their own tasks" ON tasks
--   FOR ALL USING (auth.uid() = user_id);

-- CREATE POLICY "Users can only access their own projects" ON projects
--   FOR ALL USING (auth.uid() = user_id);

-- CREATE POLICY "Users can only access their own categories" ON categories
--   FOR ALL USING (auth.uid() = user_id);

-- CREATE POLICY "Users can only access their own daily plans" ON daily_plans
--   FOR ALL USING (auth.uid() = user_id);

-- CREATE POLICY "Users can only access their own work schedules" ON work_schedules
--   FOR ALL USING (auth.uid() = user_id);

-- CREATE POLICY "Users can only access their own journal entries" ON journal_entries
--   FOR ALL USING (auth.uid() = user_id);

-- Add a user_id column to all tables for authentication (if needed)
-- Uncomment these if you implement authentication

-- ALTER TABLE tasks ADD COLUMN user_id UUID REFERENCES auth.users(id);
-- ALTER TABLE projects ADD COLUMN user_id UUID REFERENCES auth.users(id);
-- ALTER TABLE categories ADD COLUMN user_id UUID REFERENCES auth.users(id);
-- ALTER TABLE daily_plans ADD COLUMN user_id UUID REFERENCES auth.users(id);
-- ALTER TABLE work_schedules ADD COLUMN user_id UUID REFERENCES auth.users(id);
-- ALTER TABLE journal_entries ADD COLUMN user_id UUID REFERENCES auth.users(id);