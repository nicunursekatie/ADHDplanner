import * as localStorage from './localStorage';
import * as dexieStorage from './dexieStorage';

/**
 * Migrates all data from localStorage to IndexedDB using Dexie
 * @returns A Promise that resolves to a boolean indicating success
 */
export const migrateFromLocalStorageToDexie = async (): Promise<boolean> => {
  try {
    console.log('Starting data migration from localStorage to Dexie...');

    // Get all data from localStorage
    const tasks = localStorage.getTasks();
    const projects = localStorage.getProjects();
    const categories = localStorage.getCategories();
    const dailyPlans = localStorage.getDailyPlans();
    const workSchedule = localStorage.getWorkSchedule();
    const journalEntries = localStorage.getJournalEntries();

    // Check if there's data to migrate
    const hasData = 
      tasks.length > 0 ||
      projects.length > 0 ||
      categories.length > 0 ||
      dailyPlans.length > 0 ||
      journalEntries.length > 0 ||
      workSchedule !== null;

    if (!hasData) {
      console.log('No data to migrate');
      return true;
    }

    // Start migration with progress tracking
    console.log(`Migrating ${tasks.length} tasks...`);
    if (tasks.length > 0) {
      await dexieStorage.saveTasks(tasks);
    }

    console.log(`Migrating ${projects.length} projects...`);
    if (projects.length > 0) {
      await dexieStorage.saveProjects(projects);
    }

    console.log(`Migrating ${categories.length} categories...`);
    if (categories.length > 0) {
      await dexieStorage.saveCategories(categories);
    }

    console.log(`Migrating ${dailyPlans.length} daily plans...`);
    if (dailyPlans.length > 0) {
      await dexieStorage.saveDailyPlans(dailyPlans);
    }

    console.log(`Migrating work schedule...`);
    if (workSchedule) {
      await dexieStorage.saveWorkSchedule(workSchedule);
    }

    console.log(`Migrating ${journalEntries.length} journal entries...`);
    if (journalEntries.length > 0) {
      await dexieStorage.saveJournalEntries(journalEntries);
    }

    console.log('Data migration completed successfully');
    return true;
  } catch (error) {
    console.error('Error during data migration:', error);
    return false;
  }
};

/**
 * Checks if local storage data exists that might need migration
 * @returns Boolean indicating if local data exists
 */
export const checkForLocalStorageData = (): boolean => {
  try {
    const tasks = localStorage.getTasks();
    const projects = localStorage.getProjects();
    const categories = localStorage.getCategories();
    
    return tasks.length > 0 || projects.length > 0 || categories.length > 0;
  } catch (error) {
    console.error('Error checking for local data:', error);
    return false;
  }
};