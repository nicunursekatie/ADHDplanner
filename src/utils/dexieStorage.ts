import { Task, Project, Category, DailyPlan, JournalEntry } from '../types';
import { WorkSchedule } from '../types/WorkSchedule';
import { db } from './db';

// Error handling utilities
const handleStorageError = (operation: string, error: Error | unknown): never => {
  console.error(`Dexie ${operation} operation failed:`, error);
  const errorMessage = error instanceof Error ? error.message : 'Unknown error';
  throw new Error(`Failed to ${operation}: ${errorMessage}`);
}

// Tasks
export const getTasks = async (): Promise<Task[]> => {
  try {
    return await db.tasks.toArray();
  } catch (error) {
    handleStorageError('get tasks', error);
    return []; // Return an empty array as a fallback
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
  // No return statement needed as the function's return type is void
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
    await db.tasks.update(updatedTask.id, { ...updatedTask });
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
    handleStorageError('get projects', error);
    return []; // Return an empty array as a fallback
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
    handleStorageError('get categories', error);
    return []; // Return an empty array as a fallback
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
    handleStorageError('get daily plans', error);
    return []; // Return an empty array as a fallback
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
    handleStorageError('get daily plan', error);
  }
  return null;
};

export const saveDailyPlan = async (plan: DailyPlan): Promise<void> => {
  try {
    console.log('dexieStorage: Saving daily plan:', JSON.stringify(plan));

    // Validate the plan data
    if (!plan || !plan.date) {
      console.error('Invalid daily plan data:', plan);
      throw new Error('Invalid daily plan data');
    }

    // Create a deep copy of the plan to avoid mutation issues
    const planToSave = JSON.parse(JSON.stringify(plan));

    // Ensure all time blocks have taskIds initialized
    if (planToSave.timeBlocks) {
      planToSave.timeBlocks = planToSave.timeBlocks.map((block: { taskIds?: string[] }) => ({
        ...block,
        taskIds: block.taskIds || []
      }));
    }

    // Check if plan with this date already exists
    const existingPlan = await db.dailyPlans.where('date').equals(planToSave.date).first();

    if (existingPlan) {
      // Update existing plan
      console.log('Updating existing plan with ID:', existingPlan.id);
      await db.dailyPlans.update(existingPlan.id, planToSave);
    } else {
      // Add new plan
      console.log('Adding new plan with date:', planToSave.date);
      // Ensure plan has an ID
      if (!planToSave.id) {
        planToSave.id = planToSave.date;
      }
      await db.dailyPlans.add(planToSave);
    }

    // Verify the plan was saved
    const savedPlan = await db.dailyPlans.where('date').equals(planToSave.date).first();
    console.log('Plan after save:', savedPlan);

  } catch (error) {
    console.error('Error in saveDailyPlan:', error);
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
    handleStorageError('get work schedule', error);
  }
  return null; // Explicitly return null if no value is returned in the try-catch block
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
    handleStorageError('get journal entries', error);
    return []; // Return an empty array as a fallback
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
    const exportObject: Record<string, unknown> = {};

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
    const categories = await getCategories();
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
    throw new Error(`Failed to export data: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

// Removed chunkArray function since it's no longer used in the simplified importData function

/**
 * Simplifying importData function to avoid complex parsing errors
 */
export const importData = async (jsonData: string): Promise<boolean> => {
  try {
    console.log('Starting data import process...');

    // First try to parse the JSON normally
    try {
      const data = JSON.parse(jsonData);
      console.log('Successfully parsed JSON data');

      // Check if we have any existing data
      const hasExistingData = await db.tasks.count() > 0 ||
                              await db.projects.count() > 0 ||
                              await db.categories.count() > 0;

      if (hasExistingData) {
        console.log('Clearing existing data before importing...');
        await Promise.all([
          db.tasks.clear(),
          db.projects.clear(),
          db.categories.clear(),
          db.dailyPlans.clear(),
          db.workSchedules.clear(),
          db.journalEntries.clear()
        ]);
      }

      // Import tasks
      if (Array.isArray(data.tasks)) {
        console.log(`Importing ${data.tasks.length} tasks...`);
        await db.tasks.bulkAdd(data.tasks);
      } else if (Array.isArray(data) && data.length > 0) {
        // If the root is an array, assume it's tasks
        console.log(`Importing ${data.length} tasks from root array...`);
        await db.tasks.bulkAdd(data);
      }

      // Import projects
      if (Array.isArray(data.projects)) {
        console.log(`Importing ${data.projects.length} projects...`);
        await db.projects.bulkAdd(data.projects);
      }

      // Import categories
      if (Array.isArray(data.categories)) {
        console.log(`Importing ${data.categories.length} categories...`);
        await db.categories.bulkAdd(data.categories);
      }

      // Import daily plans
      if (Array.isArray(data.dailyPlans)) {
        console.log(`Importing ${data.dailyPlans.length} daily plans...`);
        await db.dailyPlans.bulkAdd(data.dailyPlans);
      }

      // Import work schedule
      if (data.workSchedule && typeof data.workSchedule === 'object') {
        console.log('Importing work schedule...');
        await db.workSchedules.add(data.workSchedule);
      }

      // Import journal entries
      if (Array.isArray(data.journalEntries)) {
        console.log(`Importing ${data.journalEntries.length} journal entries...`);
        await db.journalEntries.bulkAdd(data.journalEntries);
      }

      console.log('Data import completed successfully');
      return true;
    } catch (parseError) {
      console.error('Error parsing or importing JSON:', parseError);
      if (parseError instanceof Error) {
        console.error('Error name:', parseError.name);
        console.error('Error message:', parseError.message);
      }
      return false;
    }
  } catch (error) {
    console.error('Critical error during import process:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
    }
    return false;
  }
};

// generateId function is no longer needed with simplified importData

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
 * Compact the database to reclaim space
 */
export const compact = async (): Promise<void> => {
  try {
    console.log('Compacting database...');
    await db.compact();
    console.log('Database compaction complete');
  } catch (error) {
    console.error('Error compacting database:', error);
    handleStorageError('compact database', error);
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
    await compact();

    // Archive old completed tasks to reduce database size
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
    const cutoffDate = threeMonthsAgo.toISOString();

    // Count old completed tasks
    const oldCompletedTasks = await db.tasks
      .where('completed')
      .equals(1)
      .and(task => task.updatedAt < cutoffDate)
      .count();

    if (oldCompletedTasks > 0) {
      console.log(`Archiving ${oldCompletedTasks} old completed tasks...`);

      // Set archived flag on old completed tasks
      await db.tasks
        .where('completed')
        .equals(1)
        .and(task => task.updatedAt < cutoffDate)
        .modify({ archived: true });
    }

    console.log('Database maintenance completed');
  } catch (error) {
    console.error('Error during database maintenance:', error);
  }
};