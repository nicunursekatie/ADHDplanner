import { Task, Project, Category, DailyPlan, JournalEntry } from '../types';
import { WorkSchedule } from '../types/WorkSchedule';
import { db } from './db';

// Error handling utilities
const handleStorageError = (operation: string, error: Error | unknown): never => {
  console.error(`Dexie ${operation} operation failed:`, error);
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  throw new Error(`Failed to ${operation}: ${errorMessage}`);
};

// Tasks
export const getTasks = async (): Promise<Task[]> => {
  try {
    return await db.tasks.toArray();
  } catch (error) {
    return handleStorageError('get tasks', error);
  }
};

export const saveTasks = async (tasks: Task[]): Promise<void> => {
  try {
    // Use transaction for atomicity
    await db.transaction('rw', db.tasks, async () => {
      // Clear the table
      await db.tasks.clear();
      // Bulk add all tasks
      if (tasks.length > 0) {
        await db.tasks.bulkAdd(tasks);
      }
    });
  } catch (error) {
    handleStorageError('save tasks', error);
  }
};

export const addTask = async (task: Task): Promise<void> => {
  try {
    await db.tasks.add(task);
  } catch (error) {
    handleStorageError('add task', error);
  }
};

export const updateTask = async (updatedTask: Task): Promise<void> => {
  try {
    await db.tasks.update(updatedTask.id, updatedTask);
  } catch (error) {
    handleStorageError('update task', error);
  }
};

export const deleteTask = async (taskId: string): Promise<void> => {
  try {
    await db.tasks.delete(taskId);
  } catch (error) {
    handleStorageError('delete task', error);
  }
};

// Projects
export const getProjects = async (): Promise<Project[]> => {
  try {
    return await db.projects.toArray();
  } catch (error) {
    return handleStorageError('get projects', error);
  }
};

export const saveProjects = async (projects: Project[]): Promise<void> => {
  try {
    await db.transaction('rw', db.projects, async () => {
      await db.projects.clear();
      if (projects.length > 0) {
        await db.projects.bulkAdd(projects);
      }
    });
  } catch (error) {
    handleStorageError('save projects', error);
  }
};

export const addProject = async (project: Project): Promise<void> => {
  try {
    await db.projects.add(project);
  } catch (error) {
    handleStorageError('add project', error);
  }
};

export const updateProject = async (updatedProject: Project): Promise<void> => {
  try {
    await db.projects.update(updatedProject.id, updatedProject);
  } catch (error) {
    handleStorageError('update project', error);
  }
};

export const deleteProject = async (projectId: string): Promise<void> => {
  try {
    await db.projects.delete(projectId);
  } catch (error) {
    handleStorageError('delete project', error);
  }
};

// Categories
export const getCategories = async (): Promise<Category[]> => {
  try {
    return await db.categories.toArray();
  } catch (error) {
    return handleStorageError('get categories', error);
  }
};

export const saveCategories = async (categories: Category[]): Promise<void> => {
  try {
    await db.transaction('rw', db.categories, async () => {
      await db.categories.clear();
      if (categories.length > 0) {
        await db.categories.bulkAdd(categories);
      }
    });
  } catch (error) {
    handleStorageError('save categories', error);
  }
};

export const addCategory = async (category: Category): Promise<void> => {
  try {
    await db.categories.add(category);
  } catch (error) {
    handleStorageError('add category', error);
  }
};

export const updateCategory = async (updatedCategory: Category): Promise<void> => {
  try {
    await db.categories.update(updatedCategory.id, updatedCategory);
  } catch (error) {
    handleStorageError('update category', error);
  }
};

export const deleteCategory = async (categoryId: string): Promise<void> => {
  try {
    await db.categories.delete(categoryId);
  } catch (error) {
    handleStorageError('delete category', error);
  }
};

// Daily Plans
export const getDailyPlans = async (): Promise<DailyPlan[]> => {
  try {
    return await db.dailyPlans.toArray();
  } catch (error) {
    return handleStorageError('get daily plans', error);
  }
};

export const saveDailyPlans = async (plans: DailyPlan[]): Promise<void> => {
  try {
    await db.transaction('rw', db.dailyPlans, async () => {
      await db.dailyPlans.clear();
      if (plans.length > 0) {
        await db.dailyPlans.bulkAdd(plans);
      }
    });
  } catch (error) {
    handleStorageError('save daily plans', error);
  }
};

export const getDailyPlan = async (date: string): Promise<DailyPlan | null> => {
  try {
    const plan = await db.dailyPlans.where('date').equals(date).first();
    return plan || null;
  } catch (error) {
    return handleStorageError('get daily plan', error);
  }
};

export const saveDailyPlan = async (plan: DailyPlan): Promise<void> => {
  try {
    // Check if plan with this date already exists
    const existingPlan = await db.dailyPlans.where('date').equals(plan.date).first();
    
    if (existingPlan) {
      // Update existing plan
      await db.dailyPlans.update(existingPlan.id, plan);
    } else {
      // Add new plan
      await db.dailyPlans.add(plan);
    }
  } catch (error) {
    handleStorageError('save daily plan', error);
  }
};

// Work Schedule
export const getWorkSchedule = async (): Promise<WorkSchedule | null> => {
  try {
    // Since there's only one work schedule per user, get the first one
    const schedule = await db.workSchedules.toArray();
    return schedule.length > 0 ? schedule[0] : null;
  } catch (error) {
    return handleStorageError('get work schedule', error);
  }
};

export const saveWorkSchedule = async (schedule: WorkSchedule): Promise<void> => {
  try {
    await db.transaction('rw', db.workSchedules, async () => {
      // Clear existing work schedules
      await db.workSchedules.clear();
      // Add the new work schedule
      await db.workSchedules.add(schedule);
    });
  } catch (error) {
    handleStorageError('save work schedule', error);
  }
};

// Journal Entries
export const getJournalEntries = async (): Promise<JournalEntry[]> => {
  try {
    return await db.journalEntries.toArray();
  } catch (error) {
    return handleStorageError('get journal entries', error);
  }
};

export const saveJournalEntries = async (entries: JournalEntry[]): Promise<void> => {
  try {
    await db.transaction('rw', db.journalEntries, async () => {
      await db.journalEntries.clear();
      if (entries.length > 0) {
        await db.journalEntries.bulkAdd(entries);
      }
    });
  } catch (error) {
    handleStorageError('save journal entries', error);
  }
};

export const addJournalEntry = async (entry: JournalEntry): Promise<void> => {
  try {
    await db.journalEntries.add(entry);
  } catch (error) {
    handleStorageError('add journal entry', error);
  }
};

export const updateJournalEntry = async (updatedEntry: JournalEntry): Promise<void> => {
  try {
    await db.journalEntries.update(updatedEntry.id, updatedEntry);
  } catch (error) {
    handleStorageError('update journal entry', error);
  }
};

export const deleteJournalEntry = async (entryId: string): Promise<void> => {
  try {
    await db.journalEntries.delete(entryId);
  } catch (error) {
    handleStorageError('delete journal entry', error);
  }
};

// Data Import/Export
export const exportData = async (): Promise<string> => {
  try {
    // Create an export object, building it incrementally to prevent excessive memory use
    const exportObject: any = {};

    // Export each type of data separately to manage memory better
    console.log('Starting data export...');

    // Export tasks
    const tasks = await db.tasks.toArray();
    console.log(`Exporting ${tasks.length} tasks`);
    exportObject.tasks = tasks;

    // Export projects
    const projects = await db.projects.toArray();
    console.log(`Exporting ${projects.length} projects`);
    exportObject.projects = projects;

    // Export categories
    const categories = await db.categories.toArray();
    console.log(`Exporting ${categories.length} categories`);
    exportObject.categories = categories;

    // Export daily plans
    const dailyPlans = await db.dailyPlans.toArray();
    console.log(`Exporting ${dailyPlans.length} daily plans`);
    exportObject.dailyPlans = dailyPlans;

    // Export work schedule
    const workSchedules = await db.workSchedules.toArray();
    console.log(`Exporting ${workSchedules.length} work schedules`);
    // Use consistent field name workSchedule (not workSchedules)
    exportObject.workSchedule = workSchedules.length > 0 ? workSchedules[0] : null;

    // Export journal entries
    const journalEntries = await db.journalEntries.toArray();
    console.log(`Exporting ${journalEntries.length} journal entries`);
    exportObject.journalEntries = journalEntries;

    // Convert to JSON string in chunks if necessary for very large datasets
    console.log('Converting data to JSON...');
    return JSON.stringify(exportObject);
  } catch (error) {
    console.error('Error during data export:', error);
    handleStorageError('export data', error);
  }
};

/**
 * Chunks an array into smaller arrays of the specified size
 * to prevent memory issues when handling large datasets
 */
const chunkArray = <T>(array: T[], chunkSize: number): T[][] => {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += chunkSize) {
    chunks.push(array.slice(i, i + chunkSize));
  }
  return chunks;
};

export const importData = async (jsonData: string): Promise<boolean> => {
  try {
    // Parse the data in a controlled way to prevent memory issues
    let data;
    try {
      data = JSON.parse(jsonData);
      // Immediately clear the jsonData string to help garbage collection
      jsonData = '';
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      return false;
    }

    // Add robust validation before attempting to save data
    // Ensure we have valid data before proceeding with transaction
    if (!data || typeof data !== 'object') {
      console.error('Invalid import data: Not a valid object');
      return false;
    }

    // Log the structure of data being imported for debugging
    console.log('Importing data structure:', Object.keys(data));

    // First clear all tables to free up memory
    console.log('Clearing existing data...');
    await Promise.all([
      db.tasks.clear(),
      db.projects.clear(),
      db.categories.clear(),
      db.dailyPlans.clear(),
      db.workSchedules.clear(),
      db.journalEntries.clear()
    ]);

    // Define chunk size - adjust based on testing
    const CHUNK_SIZE = 100;

    try {
      // Import tasks in chunks to prevent memory issues
      if (data.tasks && Array.isArray(data.tasks) && data.tasks.length > 0) {
        console.log(`Adding ${data.tasks.length} tasks in chunks`);
        const taskChunks = chunkArray(data.tasks, CHUNK_SIZE);
        for (let i = 0; i < taskChunks.length; i++) {
          console.log(`Importing tasks chunk ${i+1}/${taskChunks.length}`);
          await db.tasks.bulkAdd(taskChunks[i]);
          // Allow a small delay for garbage collection between chunks
          if (i < taskChunks.length - 1) {
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        }
        // Clear reference to help garbage collection
        data.tasks = null;
      }

      // Import projects - usually smaller so might not need chunking
      if (data.projects && Array.isArray(data.projects) && data.projects.length > 0) {
        console.log(`Adding ${data.projects.length} projects`);
        if (data.projects.length > CHUNK_SIZE) {
          const projectChunks = chunkArray(data.projects, CHUNK_SIZE);
          for (const chunk of projectChunks) {
            await db.projects.bulkAdd(chunk);
          }
        } else {
          await db.projects.bulkAdd(data.projects);
        }
        data.projects = null;
      }

      // Import categories - usually smaller so might not need chunking
      if (data.categories && Array.isArray(data.categories) && data.categories.length > 0) {
        console.log(`Adding ${data.categories.length} categories`);
        await db.categories.bulkAdd(data.categories);
        data.categories = null;
      }

      // Import daily plans in chunks if needed
      if (data.dailyPlans && Array.isArray(data.dailyPlans) && data.dailyPlans.length > 0) {
        console.log(`Adding ${data.dailyPlans.length} daily plans`);
        if (data.dailyPlans.length > CHUNK_SIZE) {
          const planChunks = chunkArray(data.dailyPlans, CHUNK_SIZE);
          for (const chunk of planChunks) {
            await db.dailyPlans.bulkAdd(chunk);
          }
        } else {
          await db.dailyPlans.bulkAdd(data.dailyPlans);
        }
        data.dailyPlans = null;
      }

      // Handle work schedule with improved validation and error handling
      if (data.workSchedule && typeof data.workSchedule === 'object') {
        console.log('Adding work schedule from workSchedule field');
        // Validate the work schedule structure to make sure it has required fields
        if (data.workSchedule.id && Array.isArray(data.workSchedule.shifts)) {
          await db.workSchedules.add(data.workSchedule);
        } else {
          console.warn('Work schedule data is invalid, skipping import');
        }
      } else if (data.workSchedules && typeof data.workSchedules === 'object') {
        console.log('Adding work schedule from workSchedules field');
        // Validate the work schedule structure to make sure it has required fields
        if (data.workSchedules.id && Array.isArray(data.workSchedules.shifts)) {
          await db.workSchedules.add(data.workSchedules);
        } else {
          console.warn('Work schedule data is invalid, skipping import');
        }
      } else {
        console.log('No work schedule data found in import');
      }
      // Clear references
      data.workSchedule = null;
      data.workSchedules = null;

      // Import journal entries in chunks if needed
      if (data.journalEntries && Array.isArray(data.journalEntries) && data.journalEntries.length > 0) {
        console.log(`Adding ${data.journalEntries.length} journal entries`);
        if (data.journalEntries.length > CHUNK_SIZE) {
          const entryChunks = chunkArray(data.journalEntries, CHUNK_SIZE);
          for (const chunk of entryChunks) {
            await db.journalEntries.bulkAdd(chunk);
          }
        } else {
          await db.journalEntries.bulkAdd(data.journalEntries);
        }
        data.journalEntries = null;
      }

      // Force clear the data object to help garbage collection
      data = null;

      console.log('Import completed successfully');
      return true;
    } catch (importError) {
      console.error('Error during data import for specific table:', importError);
      // Log more detailed error information for debugging
      if (importError instanceof Error) {
        console.error('Error name:', importError.name);
        console.error('Error message:', importError.message);
        console.error('Error stack:', importError.stack);
      }
      return false;
    }
  } catch (error) {
    console.error('Failed to import data:', error);
    // Log more detailed error information for debugging
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    return false;
  }
};

// Reset data
export const resetData = async (): Promise<void> => {
  try {
    console.log('Starting database reset...');

    // Clear each table separately to better manage memory
    console.log('Clearing tasks...');
    await db.tasks.clear();

    console.log('Clearing projects...');
    await db.projects.clear();

    console.log('Clearing categories...');
    await db.categories.clear();

    console.log('Clearing daily plans...');
    await db.dailyPlans.clear();

    console.log('Clearing work schedules...');
    await db.workSchedules.clear();

    console.log('Clearing journal entries...');
    await db.journalEntries.clear();

    console.log('Database reset complete');
  } catch (error) {
    console.error('Error during data reset:', error);
    handleStorageError('reset data', error);
  }
};

/**
 * Performs periodic database maintenance to optimize performance
 * and prevent memory issues
 */
export const performDatabaseMaintenance = async (): Promise<void> => {
  try {
    console.log('Starting database maintenance...');

    // Compact the database to reclaim space
    await db.compact();

    // Archive old completed tasks to reduce database size
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const cutoffDate = threeMonthsAgo.toISOString();

    // Count old completed tasks
    const oldCompletedTasks = await db.tasks
      .where('completed')
      .equals(true)
      .and(task => task.updatedAt < cutoffDate)
      .count();

    if (oldCompletedTasks > 0) {
      console.log(`Archiving ${oldCompletedTasks} old completed tasks...`);

      // Set archived flag on old completed tasks
      await db.tasks
        .where('completed')
        .equals(true)
        .and(task => task.updatedAt < cutoffDate)
        .modify({ archived: true });
    }

    console.log('Database maintenance completed');
  } catch (error) {
    console.error('Error during database maintenance:', error);
  }
};