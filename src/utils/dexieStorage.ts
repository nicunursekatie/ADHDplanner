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
    // Get all data from tables
    const [tasks, projects, categories, dailyPlans, workSchedules, journalEntries] = await Promise.all([
      db.tasks.toArray(),
      db.projects.toArray(),
      db.categories.toArray(),
      db.dailyPlans.toArray(),
      db.workSchedules.toArray(),
      db.journalEntries.toArray()
    ]);

    const data = {
      tasks,
      projects,
      categories,
      dailyPlans,
      workSchedules: workSchedules.length > 0 ? workSchedules[0] : null,
      journalEntries
    };

    return JSON.stringify(data);
  } catch (error) {
    handleStorageError('export data', error);
  }
};

export const importData = async (jsonData: string): Promise<boolean> => {
  try {
    const data = JSON.parse(jsonData);
    
    // Perform import in a transaction for atomicity
    await db.transaction('rw', 
      [db.tasks, db.projects, db.categories, db.dailyPlans, db.workSchedules, db.journalEntries], 
      async () => {
        // Clear all tables
        await Promise.all([
          db.tasks.clear(),
          db.projects.clear(),
          db.categories.clear(),
          db.dailyPlans.clear(),
          db.workSchedules.clear(),
          db.journalEntries.clear()
        ]);

        // Import data into tables
        if (data.tasks && data.tasks.length > 0) {
          await db.tasks.bulkAdd(data.tasks);
        }
        if (data.projects && data.projects.length > 0) {
          await db.projects.bulkAdd(data.projects);
        }
        if (data.categories && data.categories.length > 0) {
          await db.categories.bulkAdd(data.categories);
        }
        if (data.dailyPlans && data.dailyPlans.length > 0) {
          await db.dailyPlans.bulkAdd(data.dailyPlans);
        }
        if (data.workSchedule) {
          await db.workSchedules.add(data.workSchedule);
        }
        if (data.journalEntries && data.journalEntries.length > 0) {
          await db.journalEntries.bulkAdd(data.journalEntries);
        }
    });

    return true;
  } catch (error) {
    console.error('Failed to import data:', error);
    return false;
  }
};

// Reset data
export const resetData = async (): Promise<void> => {
  try {
    await db.transaction('rw', 
      [db.tasks, db.projects, db.categories, db.dailyPlans, db.workSchedules, db.journalEntries], 
      async () => {
        await Promise.all([
          db.tasks.clear(),
          db.projects.clear(),
          db.categories.clear(),
          db.dailyPlans.clear(),
          db.workSchedules.clear(),
          db.journalEntries.clear()
        ]);
    });
  } catch (error) {
    handleStorageError('reset data', error);
  }
};