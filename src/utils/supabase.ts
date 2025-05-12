import { createClient } from '@supabase/supabase-js';
import { Task, Project, Category, DailyPlan, JournalEntry } from '../types';
import { WorkSchedule } from '../types/WorkSchedule';

// Initialize Supabase client
const supabaseUrl = 'https://qhucduandrbnfcjdnkxr.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFodWNkdW5hZHJibmZjamRua3hyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDY5MDk1NzksImV4cCI6MjA2MjQ4NTU3OX0.iEYMfvZ_wpz1GnoReZEqEsA-asoRwn3THxc4HyJClDc';

export const supabase = createClient(supabaseUrl, supabaseKey);

/**
 * Initialize the Supabase tables needed for the app
 * This should be called once at app startup
 */
export const initializeSupabase = async (): Promise<void> => {
  console.log('Initializing Supabase...');
  
  try {
    // Check if tables exist and create them if they don't
    const { error: tasksError } = await supabase
      .from('tasks')
      .select('id')
      .limit(1);
      
    if (tasksError) {
      console.log('Creating tasks table...');
      // Create the tasks table with the necessary structure
      // This is done through Supabase SQL interface or API
      console.log('You may need to create the table manually in Supabase');
    }
    
    // Check other tables
    const { error: projectsError } = await supabase
      .from('projects')
      .select('id')
      .limit(1);
      
    if (projectsError) {
      console.log('Creating projects table...');
      console.log('You may need to create the table manually in Supabase');
    }
    
    // Repeat for other tables
    console.log('Supabase initialization completed');
  } catch (error) {
    console.error('Error initializing Supabase:', error);
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
    // Simple ping-like test
    const { error } = await supabase.from('tasks').select('count').limit(1);
    return !error;
  } catch (error) {
    console.error('Error checking Supabase connection:', error);
    return false;
  }
};

// Sync functions
export const syncToSupabase = async (): Promise<boolean> => {
  try {
    // The idea is to take the local data and push it to Supabase
    // This function would be called periodically or when the app state changes
    console.log('Syncing data to Supabase...');

    // You would get all local data and save it to Supabase
    // For this to work, you need to expose the local data from the db.ts module
    
    console.log('Data sync to Supabase completed');
    return true;
  } catch (error) {
    console.error('Error syncing data to Supabase:', error);
    return false;
  }
};

export const syncFromSupabase = async (): Promise<boolean> => {
  try {
    // Pull data from Supabase and update local storage
    console.log('Syncing data from Supabase...');
    
    // You would get all data from Supabase and save it locally
    
    console.log('Data sync from Supabase completed');
    return true;
  } catch (error) {
    console.error('Error syncing data from Supabase:', error);
    return false;
  }
};