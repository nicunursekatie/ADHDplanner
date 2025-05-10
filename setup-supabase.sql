-- Set up tables for ADHDplanner in Supabase

-- Tasks table
CREATE TABLE public.tasks (
  id UUID PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  completed BOOLEAN DEFAULT false,
  archived BOOLEAN DEFAULT false,
  due_date DATE,
  project_id UUID,
  category_ids UUID[],
  parent_task_id UUID,
  subtasks UUID[],
  priority TEXT CHECK (priority IN ('low', 'medium', 'high')),
  energy_level TEXT CHECK (energy_level IN ('low', 'medium', 'high')),
  size TEXT CHECK (size IN ('small', 'medium', 'large')),
  estimated_minutes INTEGER,
  phase TEXT,
  tags TEXT[],
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;

-- Projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;

-- Categories table
CREATE TABLE public.categories (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Daily Plans table
CREATE TABLE public.daily_plans (
  id UUID PRIMARY KEY,
  date DATE NOT NULL,
  time_blocks JSONB NOT NULL,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.daily_plans ENABLE ROW LEVEL SECURITY;

-- Work Schedules table
CREATE TABLE public.work_schedules (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  shifts JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.work_schedules ENABLE ROW LEVEL SECURITY;

-- Journal Entries table
CREATE TABLE public.journal_entries (
  id UUID PRIMARY KEY,
  date DATE NOT NULL,
  content TEXT NOT NULL,
  review_section_id TEXT,
  week_number INTEGER NOT NULL,
  week_year INTEGER NOT NULL,
  is_completed BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Enable Row Level Security
ALTER TABLE public.journal_entries ENABLE ROW LEVEL SECURITY;

-- Add Row Level Security policies to restrict data access to the owner
CREATE POLICY "Users can only access their own tasks"
  ON public.tasks
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can only access their own projects"
  ON public.projects
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can only access their own categories"
  ON public.categories
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can only access their own daily plans"
  ON public.daily_plans
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can only access their own work schedules"
  ON public.work_schedules
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can only access their own journal entries"
  ON public.journal_entries
  FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- Add indexes for performance
CREATE INDEX ON public.tasks (user_id);
CREATE INDEX ON public.tasks (parent_task_id);
CREATE INDEX ON public.tasks (project_id);
CREATE INDEX ON public.projects (user_id);
CREATE INDEX ON public.categories (user_id);
CREATE INDEX ON public.daily_plans (user_id, date);
CREATE INDEX ON public.work_schedules (user_id);
CREATE INDEX ON public.journal_entries (user_id, week_year, week_number);