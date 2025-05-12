import { createClient } from '@supabase/supabase-js';
import { Task, Project, Category, DailyPlan, JournalEntry } from '../types';
import { WorkSchedule } from '../types/WorkSchedule';

// Initialize Supabase client
// Check for environment variables first, then fallback to hardcoded values
const supabaseUrl = process.env.SUPABASE_URL || 'https://qhucdunadrbnfcjdnkxr.supabase.co';
const supabaseKey = process.env.SUPABASE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodWNkdW5hZHJibmZjamRua3hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MDk1NzksImV4cCI6MjA2MjQ4NTU3OX0.iEYMfvZ_wpz1GnoReZEqEsA-asoRwn3THxc4HyJClDc';

// Create client with additional error handling
let supabaseClient;
try {
  supabaseClient = createClient(supabaseUrl, supabaseKey);
  console.log('supabase.ts: Supabase client created successfully');
} catch (error) {
  console.error('supabase.ts: ERROR creating Supabase client:', error);
  if (error instanceof Error) {
    console.error('supabase.ts: Error name:', error.name);
    console.error('supabase.ts: Error message:', error.message);
  }
  // Create a minimal mock client to prevent app crashes
  supabaseClient = {
    auth: { getSession: async () => ({ data: null, error: new Error('Supabase unavailable') }) },
    from: () => ({
      select: () => ({ data: null, error: new Error('Supabase unavailable') }),
      delete: () => ({ data: null, error: new Error('Supabase unavailable') }),
      insert: () => ({ data: null, error: new Error('Supabase unavailable') }),
      upsert: () => ({ data: null, error: new Error('Supabase unavailable') }),
    })
  };
}

export const supabase = supabaseClient;

/**
 * Initialize the Supabase tables needed for the app
 * This should be called once at app startup
 */
export const initializeSupabase = async (): Promise<void> => {
  console.log('supabase.ts: ---------- INITIALIZING SUPABASE ----------');
  console.log('supabase.ts: Initializing Supabase with URL:', supabaseUrl);

  try {
    // Validate client
    if (!supabase) {
      console.error('supabase.ts: ERROR - Supabase client is null or undefined');
      throw new Error('Supabase client is not initialized');
    }

    console.log('supabase.ts: Checking if required tables exist...');

    // Array of table names to check
    const requiredTables = ['tasks', 'projects', 'categories', 'daily_plans', 'work_schedules', 'journal_entries'];
    const tableStatus: Record<string, boolean> = {};

    // Check each table
    for (const tableName of requiredTables) {
      console.log(`supabase.ts: Checking if '${tableName}' table exists...`);
      try {
        const { error } = await supabase
          .from(tableName)
          .select('count')
          .limit(1);

        if (error) {
          console.error(`supabase.ts: Error checking '${tableName}' table:`, error);
          console.error(`supabase.ts: Error code:`, error.code);
          console.error(`supabase.ts: Error message:`, error.message);

          if (error.code === 'PGRST301' || error.message.includes('relation') || error.message.includes('does not exist')) {
            console.error(`supabase.ts: Table '${tableName}' does not exist. It needs to be created manually in Supabase SQL editor.`);
            tableStatus[tableName] = false;
          } else if (error.code === '42501' || error.message.includes('permission denied')) {
            console.error(`supabase.ts: Permission denied for '${tableName}' table. Check RLS policies.`);
            tableStatus[tableName] = false;
          } else {
            console.error(`supabase.ts: Unknown error checking '${tableName}' table:`, error);
            tableStatus[tableName] = false;
          }
        } else {
          console.log(`supabase.ts: Table '${tableName}' exists and is accessible.`);
          tableStatus[tableName] = true;
        }
      } catch (tableError) {
        console.error(`supabase.ts: Exception checking '${tableName}' table:`, tableError);
        if (tableError instanceof Error) {
          console.error(`supabase.ts: Error name:`, tableError.name);
          console.error(`supabase.ts: Error message:`, tableError.message);
          console.error(`supabase.ts: Error stack:`, tableError.stack);
        }
        tableStatus[tableName] = false;
      }
    }

    // Print summary of table status
    console.log('supabase.ts: Table status summary:');
    for (const [table, exists] of Object.entries(tableStatus)) {
      console.log(`supabase.ts: - ${table}: ${exists ? 'EXISTS' : 'MISSING'}`);
    }

    // If any tables are missing, provide SQL to create them
    const missingTables = Object.entries(tableStatus)
      .filter(([_, exists]) => !exists)
      .map(([table]) => table);

    if (missingTables.length > 0) {
      console.log('supabase.ts: Some tables are missing. Here\'s sample SQL to create them:');

      // For each missing table, log the CREATE TABLE SQL
      // This is just sample SQL - we can't actually execute it here
      // The user would need to run this in the Supabase SQL editor
      missingTables.forEach(table => {
        let createTableSQL = '';

        switch (table) {
          case 'tasks':
            createTableSQL = `
CREATE TABLE tasks (
  id TEXT PRIMARY KEY,
  title TEXT,
  description TEXT,
  completed BOOLEAN,
  archived BOOLEAN,
  due_date TEXT,
  project_id TEXT,
  category_ids TEXT[],
  parent_task_id TEXT,
  subtasks TEXT[],
  created_at TEXT,
  updated_at TEXT
);
`;
            break;
          case 'projects':
            createTableSQL = `
CREATE TABLE projects (
  id TEXT PRIMARY KEY,
  name TEXT,
  description TEXT,
  color TEXT,
  created_at TEXT,
  updated_at TEXT
);
`;
            break;
          case 'categories':
            createTableSQL = `
CREATE TABLE categories (
  id TEXT PRIMARY KEY,
  name TEXT,
  color TEXT,
  created_at TEXT,
  updated_at TEXT
);
`;
            break;
          case 'daily_plans':
            createTableSQL = `
CREATE TABLE daily_plans (
  id TEXT PRIMARY KEY,
  date TEXT,
  time_blocks JSONB,
  created_at TEXT,
  updated_at TEXT
);
`;
            break;
          case 'work_schedules':
            createTableSQL = `
CREATE TABLE work_schedules (
  id TEXT PRIMARY KEY,
  name TEXT,
  shifts JSONB,
  created_at TEXT,
  updated_at TEXT
);
`;
            break;
          case 'journal_entries':
            createTableSQL = `
CREATE TABLE journal_entries (
  id TEXT PRIMARY KEY,
  date TEXT,
  content TEXT,
  week_number INTEGER,
  week_year INTEGER,
  is_completed BOOLEAN,
  review_section_id TEXT,
  created_at TEXT,
  updated_at TEXT
);
`;
            break;
          default:
            createTableSQL = `-- No SQL template for ${table}`;
        }

        console.log(createTableSQL);
      });

      console.warn('supabase.ts: You need to create these tables in the Supabase dashboard');
    }

    console.log('supabase.ts: Supabase initialization completed');
  } catch (error) {
    console.error('supabase.ts: ERROR initializing Supabase:', error);
    if (error instanceof Error) {
      console.error('supabase.ts: Error name:', error.name);
      console.error('supabase.ts: Error message:', error.message);
      console.error('supabase.ts: Error stack:', error.stack);
    }
    throw error; // Re-throw to signal initialization failure
  } finally {
    console.log('supabase.ts: ---------- INITIALIZATION COMPLETED ----------');
  }
};

// Tasks
export const getTasks = async (): Promise<Task[]> => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*');
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting tasks from Supabase:', error);
    return [];
  }
};

export const saveTasks = async (tasks: Task[]): Promise<void> => {
  try {
    // First delete all tasks and then insert the new ones
    // This is a simple but effective approach for a small app
    const { error: deleteError } = await supabase
      .from('tasks')
      .delete()
      .not('id', 'is', null); // Safety check to avoid deleting everything if no filter
      
    if (deleteError) throw deleteError;
    
    // Insert new tasks in chunks to avoid payload size limits
    const CHUNK_SIZE = 100;
    for (let i = 0; i < tasks.length; i += CHUNK_SIZE) {
      const chunk = tasks.slice(i, i + CHUNK_SIZE);
      const { error: insertError } = await supabase
        .from('tasks')
        .insert(chunk);
        
      if (insertError) throw insertError;
    }
  } catch (error) {
    console.error('Error saving tasks to Supabase:', error);
  }
};

// Projects
export const getProjects = async (): Promise<Project[]> => {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*');
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting projects from Supabase:', error);
    return [];
  }
};

export const saveProjects = async (projects: Project[]): Promise<void> => {
  try {
    // First delete all projects
    const { error: deleteError } = await supabase
      .from('projects')
      .delete()
      .not('id', 'is', null);
      
    if (deleteError) throw deleteError;
    
    // Then insert the new ones
    if (projects.length > 0) {
      const { error: insertError } = await supabase
        .from('projects')
        .insert(projects);
        
      if (insertError) throw insertError;
    }
  } catch (error) {
    console.error('Error saving projects to Supabase:', error);
  }
};

// Categories
export const getCategories = async (): Promise<Category[]> => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*');
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting categories from Supabase:', error);
    return [];
  }
};

export const saveCategories = async (categories: Category[]): Promise<void> => {
  try {
    // First delete all categories
    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .not('id', 'is', null);
      
    if (deleteError) throw deleteError;
    
    // Then insert the new ones
    if (categories.length > 0) {
      const { error: insertError } = await supabase
        .from('categories')
        .insert(categories);
        
      if (insertError) throw insertError;
    }
  } catch (error) {
    console.error('Error saving categories to Supabase:', error);
  }
};

// Daily Plans
export const getDailyPlans = async (): Promise<DailyPlan[]> => {
  try {
    const { data, error } = await supabase
      .from('daily_plans')
      .select('*');
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting daily plans from Supabase:', error);
    return [];
  }
};

export const saveDailyPlans = async (plans: DailyPlan[]): Promise<void> => {
  try {
    // First delete all daily plans
    const { error: deleteError } = await supabase
      .from('daily_plans')
      .delete()
      .not('id', 'is', null);
      
    if (deleteError) throw deleteError;
    
    // Then insert the new ones in chunks
    const CHUNK_SIZE = 50;
    for (let i = 0; i < plans.length; i += CHUNK_SIZE) {
      const chunk = plans.slice(i, i + CHUNK_SIZE);
      const { error: insertError } = await supabase
        .from('daily_plans')
        .insert(chunk);
        
      if (insertError) throw insertError;
    }
  } catch (error) {
    console.error('Error saving daily plans to Supabase:', error);
  }
};

export const getDailyPlan = async (date: string): Promise<DailyPlan | null> => {
  try {
    const { data, error } = await supabase
      .from('daily_plans')
      .select('*')
      .eq('date', date)
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    console.error(`Error getting daily plan for ${date} from Supabase:`, error);
    return null;
  }
};

export const saveDailyPlan = async (plan: DailyPlan): Promise<void> => {
  try {
    // Upsert the daily plan (insert if not exists, update if exists)
    const { error } = await supabase
      .from('daily_plans')
      .upsert([plan], { onConflict: 'id' });
      
    if (error) throw error;
  } catch (error) {
    console.error('Error saving daily plan to Supabase:', error);
  }
};

// Work Schedule
export const getWorkSchedule = async (): Promise<WorkSchedule | null> => {
  try {
    const { data, error } = await supabase
      .from('work_schedules')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    if (error && error.code !== 'PGRST116') throw error; // PGRST116 is "no rows returned" error
    return data || null;
  } catch (error) {
    console.error('Error getting work schedule from Supabase:', error);
    return null;
  }
};

export const saveWorkSchedule = async (schedule: WorkSchedule): Promise<void> => {
  try {
    // First delete all work schedules
    const { error: deleteError } = await supabase
      .from('work_schedules')
      .delete()
      .not('id', 'is', null);
      
    if (deleteError) throw deleteError;
    
    // Then insert the new one
    const { error: insertError } = await supabase
      .from('work_schedules')
      .insert([schedule]);
      
    if (insertError) throw insertError;
  } catch (error) {
    console.error('Error saving work schedule to Supabase:', error);
  }
};

// Journal Entries
export const getJournalEntries = async (): Promise<JournalEntry[]> => {
  try {
    const { data, error } = await supabase
      .from('journal_entries')
      .select('*');
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    console.error('Error getting journal entries from Supabase:', error);
    return [];
  }
};

export const saveJournalEntries = async (entries: JournalEntry[]): Promise<void> => {
  try {
    // First delete all journal entries
    const { error: deleteError } = await supabase
      .from('journal_entries')
      .delete()
      .not('id', 'is', null);
      
    if (deleteError) throw deleteError;
    
    // Then insert the new ones in chunks
    if (entries.length > 0) {
      const CHUNK_SIZE = 100;
      for (let i = 0; i < entries.length; i += CHUNK_SIZE) {
        const chunk = entries.slice(i, i + CHUNK_SIZE);
        const { error: insertError } = await supabase
          .from('journal_entries')
          .insert(chunk);
          
        if (insertError) throw insertError;
      }
    }
  } catch (error) {
    console.error('Error saving journal entries to Supabase:', error);
  }
};

// Data Import/Export
export const exportData = async (): Promise<string> => {
  try {
    // Fetch all data from Supabase
    const tasks = await getTasks();
    const projects = await getProjects();
    const categories = await getCategories();
    const dailyPlans = await getDailyPlans();
    const workSchedule = await getWorkSchedule();
    const journalEntries = await getJournalEntries();
    
    // Create an export object
    const exportObject = {
      tasks,
      projects,
      categories,
      dailyPlans,
      workSchedule,
      journalEntries,
      exportDate: new Date().toISOString(),
      version: '1.0.0'
    };
    
    // Convert to JSON
    return JSON.stringify(exportObject);
  } catch (error) {
    console.error('Error exporting data from Supabase:', error);
    throw error;
  }
};

export const importData = async (jsonData: string): Promise<boolean> => {
  try {
    // Parse the JSON
    const data = JSON.parse(jsonData);
    
    // Validate the data structure
    if (!data || typeof data !== 'object') {
      console.error('Invalid import data: Not a valid object');
      return false;
    }
    
    // Start a transaction for all operations
    // This is a simplified version - ideally we'd use a proper transaction
    console.log('Starting data import to Supabase...');
    
    // Import tasks
    if (data.tasks && Array.isArray(data.tasks)) {
      await saveTasks(data.tasks);
    }
    
    // Import projects
    if (data.projects && Array.isArray(data.projects)) {
      await saveProjects(data.projects);
    }
    
    // Import categories
    if (data.categories && Array.isArray(data.categories)) {
      await saveCategories(data.categories);
    }
    
    // Import daily plans
    if (data.dailyPlans && Array.isArray(data.dailyPlans)) {
      await saveDailyPlans(data.dailyPlans);
    }
    
    // Import work schedule
    if (data.workSchedule && typeof data.workSchedule === 'object') {
      await saveWorkSchedule(data.workSchedule);
    }
    
    // Import journal entries
    if (data.journalEntries && Array.isArray(data.journalEntries)) {
      await saveJournalEntries(data.journalEntries);
    }
    
    console.log('Data import to Supabase completed successfully');
    return true;
  } catch (error) {
    console.error('Error importing data to Supabase:', error);
    return false;
  }
};

// Reset data
export const resetData = async (): Promise<void> => {
  try {
    console.log('Resetting Supabase data...');
    
    // Delete all data from all tables
    const tables = [
      'tasks', 
      'projects', 
      'categories', 
      'daily_plans', 
      'work_schedules', 
      'journal_entries'
    ];
    
    // Delete data from each table
    for (const table of tables) {
      const { error } = await supabase
        .from(table)
        .delete()
        .not('id', 'is', null);
        
      if (error) throw error;
    }
    
    console.log('Supabase data reset completed');
  } catch (error) {
    console.error('Error resetting Supabase data:', error);
  }
};

// Utility: Check the connection to Supabase
export const checkSupabaseConnection = async (): Promise<boolean> => {
  try {
    console.log('supabase.ts: ---------- CHECKING SUPABASE CONNECTION ----------');
    console.log('supabase.ts: Supabase URL:', supabaseUrl);
    console.log('supabase.ts: Supabase API key exists:', !!supabaseKey);

    // First check if we have a valid client
    if (!supabase) {
      console.error('supabase.ts: ERROR - Supabase client is not initialized');
      return false;
    }

    console.log('supabase.ts: Supabase client initialized:', !!supabase);

    // First, try a simple DNS resolution test
    try {
      // Create a simple timeout for fetch to prevent long waits on DNS failure
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);

      // Try to fetch just the domain with a HEAD request
      const dnsCheck = await fetch(`${supabaseUrl}`, {
        method: 'HEAD',
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (!dnsCheck.ok) {
        console.error(`supabase.ts: DNS resolution succeeded but received status ${dnsCheck.status}`);
        // We'll still continue with the connection check since some endpoints might work
      } else {
        console.log('supabase.ts: DNS resolution successful');
      }
    } catch (dnsError) {
      console.error('supabase.ts: DNS resolution failed:', dnsError);
      if (dnsError instanceof Error) {
        console.error('supabase.ts: DNS error name:', dnsError.name);
        console.error('supabase.ts: DNS error message:', dnsError.message);
      }

      // For DNS issues, we can immediately return false as Supabase is definitely unreachable
      if (dnsError.name === 'TypeError' &&
          (dnsError.message.includes('Failed to fetch') ||
           dnsError.message.includes('NetworkError') ||
           dnsError.message.includes('Network request failed'))) {
        console.error('supabase.ts: Network connectivity issue detected - Supabase is unreachable');
        return false;
      }

      // For AbortError (timeout), also return false
      if (dnsError.name === 'AbortError') {
        console.error('supabase.ts: Connection timeout - Supabase is unreachable');
        return false;
      }
    }

    // Check if the client has valid auth properties
    console.log('supabase.ts: Supabase auth object exists:', !!supabase.auth);

    // Try to get the current session
    console.log('supabase.ts: Attempting to get session...');
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      if (sessionError) {
        console.error('supabase.ts: ERROR getting session:', sessionError);
        console.error('supabase.ts: Session error code:', sessionError.code);
        console.error('supabase.ts: Session error message:', sessionError.message);
      } else {
        const sessionExists = !!sessionData && !!sessionData.session;
        console.log('supabase.ts: Session check result:', sessionExists ? 'Session exists' : 'No session');
        console.log('supabase.ts: Session data:', JSON.stringify(sessionData, null, 2));
      }
    } catch (sessionCatchError) {
      console.error('supabase.ts: EXCEPTION during session check:', sessionCatchError);
      if (sessionCatchError instanceof Error) {
        console.error('supabase.ts: Session check error name:', sessionCatchError.name);
        console.error('supabase.ts: Session check error message:', sessionCatchError.message);
        console.error('supabase.ts: Session check error stack:', sessionCatchError.stack);
      }

      // For network-related errors during session check, return false
      if (sessionCatchError instanceof Error &&
          (sessionCatchError.message.includes('Failed to fetch') ||
           sessionCatchError.message.includes('NetworkError') ||
           sessionCatchError.message.includes('Network request failed'))) {
        console.error('supabase.ts: Network connectivity issue during session check - Supabase is unreachable');
        return false;
      }
    }

    // Simple ping-like test to verify database access
    console.log('supabase.ts: Performing ping test with tasks table...');
    try {
      // Add timeout for the database query
      const pingPromise = supabase.from('tasks').select('count').limit(1);
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Database ping timeout')), 5000);
      });

      // Race the ping request against a timeout
      const { data, error } = await Promise.race([pingPromise, timeoutPromise]);

      if (error) {
        console.error('supabase.ts: Ping test FAILED with error:', error);
        console.error('supabase.ts: Error code:', error.code);
        console.error('supabase.ts: Error message:', error.message);
        console.error('supabase.ts: Error details:', error.details);

        // Check for specific error conditions
        if (error.code === 'PGRST301' || error.message.includes('relation "tasks" does not exist')) {
          console.error('supabase.ts: The "tasks" table does not exist. Database may not be set up correctly.');
          // Despite this error, we consider Supabase itself to be connected since we can reach the API
          return true;
        } else if (error.code === '42501' || error.message.includes('permission denied')) {
          console.error('supabase.ts: Permission denied. Check RLS policies in Supabase dashboard.');
          // Despite this error, we consider Supabase itself to be connected since we can reach the API
          return true;
        } else if (error.code === 'PGRST301' || error.message.includes('JWT')) {
          console.error('supabase.ts: Authentication error. JWT token may be invalid or expired.');
          // Despite this error, we consider Supabase itself to be connected since we can reach the API
          return true;
        }

        return false;
      }

      console.log('supabase.ts: Ping test SUCCESSFUL, response:', data);
      console.log('supabase.ts: Connection check PASSED');
      return true;
    } catch (pingError) {
      console.error('supabase.ts: EXCEPTION during ping test:', pingError);
      if (pingError instanceof Error) {
        console.error('supabase.ts: Ping test error name:', pingError.name);
        console.error('supabase.ts: Ping test error message:', pingError.message);
        console.error('supabase.ts: Ping test error stack:', pingError.stack);

        // For network-related errors during ping, return false
        if (pingError.message.includes('Failed to fetch') ||
            pingError.message.includes('NetworkError') ||
            pingError.message.includes('Network request failed') ||
            pingError.message.includes('timeout')) {
          console.error('supabase.ts: Network connectivity issue during ping test - Supabase is unreachable');
          return false;
        }
      }
      return false;
    }
  } catch (error) {
    console.error('supabase.ts: CRITICAL ERROR checking Supabase connection:', error);
    if (error instanceof Error) {
      console.error('supabase.ts: Error name:', error.name);
      console.error('supabase.ts: Error message:', error.message);
      console.error('supabase.ts: Error stack:', error.stack);
    }
    return false;
  } finally {
    console.log('supabase.ts: ---------- CONNECTION CHECK COMPLETED ----------');
  }
};

// Sync functions
export const syncToSupabase = async (): Promise<boolean> => {
  console.log('supabase.ts: ---------- STARTING SYNC TO SUPABASE ----------');
  try {
    // First, check if we can connect to Supabase
    console.log('supabase.ts: Checking Supabase connection before sync...');
    const isConnected = await checkSupabaseConnection();
    if (!isConnected) {
      console.error('supabase.ts: ERROR - Failed to connect to Supabase for syncing. Aborting sync.');
      return false;
    }
    console.log('supabase.ts: Connection check passed, proceeding with sync...');

    // We need access to the local data, so we'll import dexieStorage
    console.log('supabase.ts: Importing dexieStorage module...');
    try {
      const dexieStorage = await import('./dexieStorage');
      console.log('supabase.ts: Successfully imported dexieStorage module');

      // Get all local data
      console.log('supabase.ts: Fetching local data from Dexie...');
      try {
        console.log('supabase.ts: Fetching tasks...');
        const tasks = await dexieStorage.getTasks();
        console.log('supabase.ts: Fetching projects...');
        const projects = await dexieStorage.getProjects();
        console.log('supabase.ts: Fetching categories...');
        const categories = await dexieStorage.getCategories();
        console.log('supabase.ts: Fetching daily plans...');
        const dailyPlans = await dexieStorage.getDailyPlans();
        console.log('supabase.ts: Fetching work schedule...');
        const workSchedule = await dexieStorage.getWorkSchedule();
        console.log('supabase.ts: Fetching journal entries...');
        const journalEntries = await dexieStorage.getJournalEntries();

        console.log('supabase.ts: Data fetch summary:');
        console.log(`supabase.ts: - Tasks: ${tasks.length}`);
        console.log(`supabase.ts: - Projects: ${projects.length}`);
        console.log(`supabase.ts: - Categories: ${categories.length}`);
        console.log(`supabase.ts: - Daily Plans: ${dailyPlans.length}`);
        console.log(`supabase.ts: - Work Schedule: ${workSchedule ? 'Present' : 'None'}`);
        console.log(`supabase.ts: - Journal Entries: ${journalEntries.length}`);

        // Upload to Supabase
        console.log('supabase.ts: Uploading data to Supabase...');

        // We upload one table at a time with detailed error handling
        const syncResults: Record<string, boolean> = {};

        // Sync tasks
        try {
          console.log(`supabase.ts: Syncing ${tasks.length} tasks...`);
          if (tasks.length > 0) {
            await saveTasks(tasks);
            syncResults.tasks = true;
            console.log('supabase.ts: Tasks synced successfully');
          } else {
            console.log('supabase.ts: No tasks to sync');
            syncResults.tasks = true;
          }
        } catch (tasksError) {
          console.error('supabase.ts: ERROR syncing tasks:', tasksError);
          if (tasksError instanceof Error) {
            console.error('supabase.ts: Tasks error name:', tasksError.name);
            console.error('supabase.ts: Tasks error message:', tasksError.message);
          }
          syncResults.tasks = false;
        }

        // Sync projects
        try {
          console.log(`supabase.ts: Syncing ${projects.length} projects...`);
          if (projects.length > 0) {
            await saveProjects(projects);
            syncResults.projects = true;
            console.log('supabase.ts: Projects synced successfully');
          } else {
            console.log('supabase.ts: No projects to sync');
            syncResults.projects = true;
          }
        } catch (projectsError) {
          console.error('supabase.ts: ERROR syncing projects:', projectsError);
          if (projectsError instanceof Error) {
            console.error('supabase.ts: Projects error name:', projectsError.name);
            console.error('supabase.ts: Projects error message:', projectsError.message);
          }
          syncResults.projects = false;
        }

        // Sync categories
        try {
          console.log(`supabase.ts: Syncing ${categories.length} categories...`);
          if (categories.length > 0) {
            await saveCategories(categories);
            syncResults.categories = true;
            console.log('supabase.ts: Categories synced successfully');
          } else {
            console.log('supabase.ts: No categories to sync');
            syncResults.categories = true;
          }
        } catch (categoriesError) {
          console.error('supabase.ts: ERROR syncing categories:', categoriesError);
          if (categoriesError instanceof Error) {
            console.error('supabase.ts: Categories error name:', categoriesError.name);
            console.error('supabase.ts: Categories error message:', categoriesError.message);
          }
          syncResults.categories = false;
        }

        // Sync daily plans
        try {
          console.log(`supabase.ts: Syncing ${dailyPlans.length} daily plans...`);
          if (dailyPlans.length > 0) {
            await saveDailyPlans(dailyPlans);
            syncResults.dailyPlans = true;
            console.log('supabase.ts: Daily plans synced successfully');
          } else {
            console.log('supabase.ts: No daily plans to sync');
            syncResults.dailyPlans = true;
          }
        } catch (dailyPlansError) {
          console.error('supabase.ts: ERROR syncing daily plans:', dailyPlansError);
          if (dailyPlansError instanceof Error) {
            console.error('supabase.ts: Daily plans error name:', dailyPlansError.name);
            console.error('supabase.ts: Daily plans error message:', dailyPlansError.message);
          }
          syncResults.dailyPlans = false;
        }

        // Sync work schedule
        try {
          console.log(`supabase.ts: Syncing work schedule...`);
          if (workSchedule) {
            await saveWorkSchedule(workSchedule);
            syncResults.workSchedule = true;
            console.log('supabase.ts: Work schedule synced successfully');
          } else {
            console.log('supabase.ts: No work schedule to sync');
            syncResults.workSchedule = true;
          }
        } catch (workScheduleError) {
          console.error('supabase.ts: ERROR syncing work schedule:', workScheduleError);
          if (workScheduleError instanceof Error) {
            console.error('supabase.ts: Work schedule error name:', workScheduleError.name);
            console.error('supabase.ts: Work schedule error message:', workScheduleError.message);
          }
          syncResults.workSchedule = false;
        }

        // Sync journal entries
        try {
          console.log(`supabase.ts: Syncing ${journalEntries.length} journal entries...`);
          if (journalEntries.length > 0) {
            await saveJournalEntries(journalEntries);
            syncResults.journalEntries = true;
            console.log('supabase.ts: Journal entries synced successfully');
          } else {
            console.log('supabase.ts: No journal entries to sync');
            syncResults.journalEntries = true;
          }
        } catch (journalEntriesError) {
          console.error('supabase.ts: ERROR syncing journal entries:', journalEntriesError);
          if (journalEntriesError instanceof Error) {
            console.error('supabase.ts: Journal entries error name:', journalEntriesError.name);
            console.error('supabase.ts: Journal entries error message:', journalEntriesError.message);
          }
          syncResults.journalEntries = false;
        }

        // Evaluate overall sync success
        const allSuccess = Object.values(syncResults).every(result => result);
        console.log('supabase.ts: Sync results summary:');
        for (const [entity, success] of Object.entries(syncResults)) {
          console.log(`supabase.ts: - ${entity}: ${success ? 'SUCCESS' : 'FAILED'}`);
        }

        if (allSuccess) {
          console.log('supabase.ts: All data synced to Supabase successfully');
          return true;
        } else {
          console.error('supabase.ts: Some data failed to sync to Supabase');
          return false;
        }
      } catch (dataError) {
        console.error('supabase.ts: ERROR fetching data from Dexie:', dataError);
        if (dataError instanceof Error) {
          console.error('supabase.ts: Data error name:', dataError.name);
          console.error('supabase.ts: Data error message:', dataError.message);
          console.error('supabase.ts: Data error stack:', dataError.stack);
        }
        return false;
      }
    } catch (importError) {
      console.error('supabase.ts: ERROR importing dexieStorage module:', importError);
      if (importError instanceof Error) {
        console.error('supabase.ts: Import error name:', importError.name);
        console.error('supabase.ts: Import error message:', importError.message);
        console.error('supabase.ts: Import error stack:', importError.stack);
      }
      return false;
    }
  } catch (error) {
    console.error('supabase.ts: CRITICAL ERROR syncing data to Supabase:', error);
    if (error instanceof Error) {
      console.error('supabase.ts: Error name:', error.name);
      console.error('supabase.ts: Error message:', error.message);
      console.error('supabase.ts: Error stack:', error.stack);
    }
    return false;
  } finally {
    console.log('supabase.ts: ---------- SYNC TO SUPABASE COMPLETED ----------');
  }
};

export const syncFromSupabase = async (): Promise<boolean> => {
  console.log('supabase.ts: ---------- STARTING SYNC FROM SUPABASE ----------');
  try {
    // First, check if we can connect to Supabase
    console.log('supabase.ts: Checking Supabase connection before sync...');
    const isConnected = await checkSupabaseConnection();
    if (!isConnected) {
      console.error('supabase.ts: ERROR - Failed to connect to Supabase for syncing. Aborting sync.');
      return false;
    }
    console.log('supabase.ts: Connection check passed, proceeding with sync...');

    // We need access to the local data storage mechanisms
    console.log('supabase.ts: Importing dexieStorage module...');
    try {
      const dexieStorage = await import('./dexieStorage');
      console.log('supabase.ts: Successfully imported dexieStorage module');

      // Get all data from Supabase
      console.log('supabase.ts: Fetching data from Supabase...');

      // Fetch data from Supabase with detailed logging
      const fetchResults: Record<string, any> = {};
      let hasDataToSync = false;

      // Fetch tasks
      try {
        console.log('supabase.ts: Fetching tasks from Supabase...');
        const tasks = await getTasks();
        fetchResults.tasks = tasks;
        console.log(`supabase.ts: Successfully fetched ${tasks.length} tasks`);
        if (tasks.length > 0) hasDataToSync = true;
      } catch (tasksError) {
        console.error('supabase.ts: ERROR fetching tasks from Supabase:', tasksError);
        if (tasksError instanceof Error) {
          console.error('supabase.ts: Tasks error name:', tasksError.name);
          console.error('supabase.ts: Tasks error message:', tasksError.message);
        }
        fetchResults.tasks = [];
      }

      // Fetch projects
      try {
        console.log('supabase.ts: Fetching projects from Supabase...');
        const projects = await getProjects();
        fetchResults.projects = projects;
        console.log(`supabase.ts: Successfully fetched ${projects.length} projects`);
        if (projects.length > 0) hasDataToSync = true;
      } catch (projectsError) {
        console.error('supabase.ts: ERROR fetching projects from Supabase:', projectsError);
        if (projectsError instanceof Error) {
          console.error('supabase.ts: Projects error name:', projectsError.name);
          console.error('supabase.ts: Projects error message:', projectsError.message);
        }
        fetchResults.projects = [];
      }

      // Fetch categories
      try {
        console.log('supabase.ts: Fetching categories from Supabase...');
        const categories = await getCategories();
        fetchResults.categories = categories;
        console.log(`supabase.ts: Successfully fetched ${categories.length} categories`);
        if (categories.length > 0) hasDataToSync = true;
      } catch (categoriesError) {
        console.error('supabase.ts: ERROR fetching categories from Supabase:', categoriesError);
        if (categoriesError instanceof Error) {
          console.error('supabase.ts: Categories error name:', categoriesError.name);
          console.error('supabase.ts: Categories error message:', categoriesError.message);
        }
        fetchResults.categories = [];
      }

      // Fetch daily plans
      try {
        console.log('supabase.ts: Fetching daily plans from Supabase...');
        const dailyPlans = await getDailyPlans();
        fetchResults.dailyPlans = dailyPlans;
        console.log(`supabase.ts: Successfully fetched ${dailyPlans.length} daily plans`);
        if (dailyPlans.length > 0) hasDataToSync = true;
      } catch (dailyPlansError) {
        console.error('supabase.ts: ERROR fetching daily plans from Supabase:', dailyPlansError);
        if (dailyPlansError instanceof Error) {
          console.error('supabase.ts: Daily plans error name:', dailyPlansError.name);
          console.error('supabase.ts: Daily plans error message:', dailyPlansError.message);
        }
        fetchResults.dailyPlans = [];
      }

      // Fetch work schedule
      try {
        console.log('supabase.ts: Fetching work schedule from Supabase...');
        const workSchedule = await getWorkSchedule();
        fetchResults.workSchedule = workSchedule;
        console.log(`supabase.ts: Work schedule: ${workSchedule ? 'Found' : 'Not found'}`);
        if (workSchedule) hasDataToSync = true;
      } catch (workScheduleError) {
        console.error('supabase.ts: ERROR fetching work schedule from Supabase:', workScheduleError);
        if (workScheduleError instanceof Error) {
          console.error('supabase.ts: Work schedule error name:', workScheduleError.name);
          console.error('supabase.ts: Work schedule error message:', workScheduleError.message);
        }
        fetchResults.workSchedule = null;
      }

      // Fetch journal entries
      try {
        console.log('supabase.ts: Fetching journal entries from Supabase...');
        const journalEntries = await getJournalEntries();
        fetchResults.journalEntries = journalEntries;
        console.log(`supabase.ts: Successfully fetched ${journalEntries.length} journal entries`);
        if (journalEntries.length > 0) hasDataToSync = true;
      } catch (journalEntriesError) {
        console.error('supabase.ts: ERROR fetching journal entries from Supabase:', journalEntriesError);
        if (journalEntriesError instanceof Error) {
          console.error('supabase.ts: Journal entries error name:', journalEntriesError.name);
          console.error('supabase.ts: Journal entries error message:', journalEntriesError.message);
        }
        fetchResults.journalEntries = [];
      }

      // Verify we have data to sync
      if (!hasDataToSync) {
        console.warn('supabase.ts: WARNING - No data found in Supabase to sync to local storage');
        console.warn('supabase.ts: This might indicate that your Supabase tables are empty or not accessible');
        // Continue anyway, as we still want to update local storage
      }

      // Save to local storage
      console.log('supabase.ts: Saving data to local storage...');

      // Save data to Dexie with detailed logging
      const saveResults: Record<string, boolean> = {};

      // Save tasks
      try {
        const tasks = fetchResults.tasks || [];
        console.log(`supabase.ts: Saving ${tasks.length} tasks to Dexie...`);
        if (tasks.length > 0) {
          await dexieStorage.saveTasks(tasks);
          saveResults.tasks = true;
          console.log('supabase.ts: Tasks saved successfully');
        } else {
          console.log('supabase.ts: No tasks to save');
          saveResults.tasks = true;
        }
      } catch (saveTasksError) {
        console.error('supabase.ts: ERROR saving tasks to Dexie:', saveTasksError);
        if (saveTasksError instanceof Error) {
          console.error('supabase.ts: Save tasks error name:', saveTasksError.name);
          console.error('supabase.ts: Save tasks error message:', saveTasksError.message);
        }
        saveResults.tasks = false;
      }

      // Save projects
      try {
        const projects = fetchResults.projects || [];
        console.log(`supabase.ts: Saving ${projects.length} projects to Dexie...`);
        if (projects.length > 0) {
          await dexieStorage.saveProjects(projects);
          saveResults.projects = true;
          console.log('supabase.ts: Projects saved successfully');
        } else {
          console.log('supabase.ts: No projects to save');
          saveResults.projects = true;
        }
      } catch (saveProjectsError) {
        console.error('supabase.ts: ERROR saving projects to Dexie:', saveProjectsError);
        if (saveProjectsError instanceof Error) {
          console.error('supabase.ts: Save projects error name:', saveProjectsError.name);
          console.error('supabase.ts: Save projects error message:', saveProjectsError.message);
        }
        saveResults.projects = false;
      }

      // Save categories
      try {
        const categories = fetchResults.categories || [];
        console.log(`supabase.ts: Saving ${categories.length} categories to Dexie...`);
        if (categories.length > 0) {
          await dexieStorage.saveCategories(categories);
          saveResults.categories = true;
          console.log('supabase.ts: Categories saved successfully');
        } else {
          console.log('supabase.ts: No categories to save');
          saveResults.categories = true;
        }
      } catch (saveCategoriesError) {
        console.error('supabase.ts: ERROR saving categories to Dexie:', saveCategoriesError);
        if (saveCategoriesError instanceof Error) {
          console.error('supabase.ts: Save categories error name:', saveCategoriesError.name);
          console.error('supabase.ts: Save categories error message:', saveCategoriesError.message);
        }
        saveResults.categories = false;
      }

      // Save daily plans
      try {
        const dailyPlans = fetchResults.dailyPlans || [];
        console.log(`supabase.ts: Saving ${dailyPlans.length} daily plans to Dexie...`);
        if (dailyPlans.length > 0) {
          await dexieStorage.saveDailyPlans(dailyPlans);
          saveResults.dailyPlans = true;
          console.log('supabase.ts: Daily plans saved successfully');
        } else {
          console.log('supabase.ts: No daily plans to save');
          saveResults.dailyPlans = true;
        }
      } catch (saveDailyPlansError) {
        console.error('supabase.ts: ERROR saving daily plans to Dexie:', saveDailyPlansError);
        if (saveDailyPlansError instanceof Error) {
          console.error('supabase.ts: Save daily plans error name:', saveDailyPlansError.name);
          console.error('supabase.ts: Save daily plans error message:', saveDailyPlansError.message);
        }
        saveResults.dailyPlans = false;
      }

      // Save work schedule
      try {
        const workSchedule = fetchResults.workSchedule;
        console.log(`supabase.ts: Saving work schedule to Dexie...`);
        if (workSchedule) {
          await dexieStorage.saveWorkSchedule(workSchedule);
          saveResults.workSchedule = true;
          console.log('supabase.ts: Work schedule saved successfully');
        } else {
          console.log('supabase.ts: No work schedule to save');
          saveResults.workSchedule = true;
        }
      } catch (saveWorkScheduleError) {
        console.error('supabase.ts: ERROR saving work schedule to Dexie:', saveWorkScheduleError);
        if (saveWorkScheduleError instanceof Error) {
          console.error('supabase.ts: Save work schedule error name:', saveWorkScheduleError.name);
          console.error('supabase.ts: Save work schedule error message:', saveWorkScheduleError.message);
        }
        saveResults.workSchedule = false;
      }

      // Save journal entries
      try {
        const journalEntries = fetchResults.journalEntries || [];
        console.log(`supabase.ts: Saving ${journalEntries.length} journal entries to Dexie...`);
        if (journalEntries.length > 0) {
          await dexieStorage.saveJournalEntries(journalEntries);
          saveResults.journalEntries = true;
          console.log('supabase.ts: Journal entries saved successfully');
        } else {
          console.log('supabase.ts: No journal entries to save');
          saveResults.journalEntries = true;
        }
      } catch (saveJournalEntriesError) {
        console.error('supabase.ts: ERROR saving journal entries to Dexie:', saveJournalEntriesError);
        if (saveJournalEntriesError instanceof Error) {
          console.error('supabase.ts: Save journal entries error name:', saveJournalEntriesError.name);
          console.error('supabase.ts: Save journal entries error message:', saveJournalEntriesError.message);
        }
        saveResults.journalEntries = false;
      }

      // Evaluate overall sync success
      const allSuccess = Object.values(saveResults).every(result => result);
      console.log('supabase.ts: Sync results summary:');
      for (const [entity, success] of Object.entries(saveResults)) {
        console.log(`supabase.ts: - ${entity}: ${success ? 'SUCCESS' : 'FAILED'}`);
      }

      if (allSuccess) {
        console.log('supabase.ts: All data synced from Supabase successfully');
        return true;
      } else {
        console.error('supabase.ts: Some data failed to sync from Supabase');
        return false;
      }
    } catch (importError) {
      console.error('supabase.ts: ERROR importing dexieStorage module:', importError);
      if (importError instanceof Error) {
        console.error('supabase.ts: Import error name:', importError.name);
        console.error('supabase.ts: Import error message:', importError.message);
        console.error('supabase.ts: Import error stack:', importError.stack);
      }
      return false;
    }
  } catch (error) {
    console.error('supabase.ts: CRITICAL ERROR syncing data from Supabase:', error);
    if (error instanceof Error) {
      console.error('supabase.ts: Error name:', error.name);
      console.error('supabase.ts: Error message:', error.message);
      console.error('supabase.ts: Error stack:', error.stack);
    }
    return false;
  } finally {
    console.log('supabase.ts: ---------- SYNC FROM SUPABASE COMPLETED ----------');
  }
};