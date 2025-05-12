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
      planToSave.timeBlocks = planToSave.timeBlocks.map(block => ({
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

/**
 * Improved importData function with stream parsing and progressive loading
 * to prevent browser freezing on large datasets
 */
export const importData = async (jsonData: string): Promise<boolean> => {
  try {
    console.log('Starting stream-based data import process...');

    // Clear existing data before we start to free memory
    console.log('Clearing existing data...');
    await Promise.all([
      db.tasks.clear(),
      db.projects.clear(),
      db.categories.clear(),
      db.dailyPlans.clear(),
      db.workSchedules.clear(),
      db.journalEntries.clear()
    ]);

    // Define chunk size - smaller for better responsiveness
    const CHUNK_SIZE = 50;

    // Check for basic JSON validity before attempting full parse
    try {
      // Just validate JSON structure without keeping the whole result in memory
      JSON.parse(jsonData.slice(0, 1000) + jsonData.slice(-10));
    } catch (validationError) {
      console.error('Invalid JSON format:', validationError);
      return false;
    }

    // Process data in sections to prevent loading everything into memory at once
    try {
      // Progressive section-by-section parsing to limit memory usage
      // Process the JSON string in separate steps for each data type

      // Helper function to extract a section of the JSON
      const extractSection = (sectionName: string, source: string): unknown[] | null => {
        try {
          // Check for different possible property name formats
          const possibleNames = [
            `"${sectionName}":`,
            `"${sectionName.toLowerCase()}":`,
            `"${sectionName.toUpperCase()}":`,
            `"${sectionName[0].toUpperCase() + sectionName.slice(1).toLowerCase()}":`,
          ];

          // Find the first matching section
          let sectionStart = -1;
          let matchedName = '';

          for (const propName of possibleNames) {
            const index = source.indexOf(propName);
            if (index !== -1) {
              sectionStart = index;
              matchedName = propName;
              break;
            }
          }

          if (sectionStart === -1) {
            console.log(`Section "${sectionName}" not found in JSON`);
            return null;
          }

          // Extract the array content
          let bracketCount = 0;
          let inArray = false;
          let startPos = sectionStart + matchedName.length; // Skip past "name":

          // Find the start of the array, handling whitespace
          while (startPos < source.length) {
            // Skip whitespace
            if (/\s/.test(source[startPos])) {
              startPos++;
              continue;
            }

            if (source[startPos] === '[') {
              inArray = true;
              startPos++;
              break;
            }

            // If we find something unexpected, log and return null
            if (source[startPos] !== '[') {
              console.warn(`Expected [ for array start in ${matchedName}, found '${source[startPos]}'`);
              return null;
            }

            startPos++;
          }

          if (!inArray) {
            console.log(`No array found for ${matchedName}`);
            return null;
          }

          // Find the end of the array by matching brackets
          let endPos = startPos;
          bracketCount = 1; // We're already inside one bracket

          // Robustly find the end of the array
          while (endPos < source.length && bracketCount > 0) {
            // Skip string contents to avoid brackets inside strings
            if (source[endPos] === '"') {
              endPos++;
              // Find the end of the string
              while (endPos < source.length && source[endPos] !== '"') {
                // Handle escaped quotes
                if (source[endPos] === '\\' && endPos + 1 < source.length) {
                  endPos += 2;
                } else {
                  endPos++;
                }
              }
              if (endPos < source.length) endPos++; // Skip the closing quote
              continue;
            }

            // Count brackets
            if (source[endPos] === '[') bracketCount++;
            if (source[endPos] === ']') bracketCount--;
            endPos++;
          }

          if (bracketCount !== 0) {
            console.error('Malformed JSON: Unbalanced brackets in', sectionName);
            return null;
          }

          // Parse just this section
          const sectionJson = source.substring(startPos - 1, endPos);
          try {
            return JSON.parse(sectionJson);
          } catch (parseError) {
            console.error(`Error parsing ${sectionName} section:`, parseError);
            console.log(`Section JSON snippet: ${sectionJson.substring(0, 100)}...`);
            return null;
          }
        } catch (err) {
          console.error(`Error extracting ${sectionName} section:`, err);
          return null;
        }
      };

      // Process sections in sequence with breaks for UI responsiveness

      // 1. Process tasks (usually the largest data set)
      const tasks = extractSection('tasks', jsonData);
      if (tasks && Array.isArray(tasks) && tasks.length > 0) {
        console.log(`Adding ${tasks.length} tasks in chunks`);
        const taskChunks = chunkArray(tasks, CHUNK_SIZE);

        for (let i = 0; i < taskChunks.length; i++) {
          // Log progress every 5 chunks to reduce console spam
          if (i % 5 === 0 || i === taskChunks.length - 1) {
            console.log(`Importing tasks chunk ${i+1}/${taskChunks.length}`);
          }

          await db.tasks.bulkAdd(taskChunks[i]);

          // Yield to the UI thread every chunk to keep the app responsive
          await new Promise(resolve => setTimeout(resolve, 20));
        }
      }

      // 2. Process projects
      const projects = extractSection('projects', jsonData);
      if (projects && Array.isArray(projects) && projects.length > 0) {
        console.log(`Adding ${projects.length} projects`);

        if (projects.length > CHUNK_SIZE) {
          const projectChunks = chunkArray(projects, CHUNK_SIZE);
          for (const chunk of projectChunks) {
            await db.projects.bulkAdd(chunk);
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        } else {
          await db.projects.bulkAdd(projects);
        }
      }

      // 3. Process categories
      const categories = extractSection('categories', jsonData);
      if (categories && Array.isArray(categories) && categories.length > 0) {
        console.log(`Adding ${categories.length} categories`);

        if (categories.length > CHUNK_SIZE) {
          const categoryChunks = chunkArray(categories, CHUNK_SIZE);
          for (const chunk of categoryChunks) {
            await db.categories.bulkAdd(chunk);
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        } else {
          await db.categories.bulkAdd(categories);
        }
      }

      // 4. Process daily plans
      const dailyPlans = extractSection('dailyPlans', jsonData);
      if (dailyPlans && Array.isArray(dailyPlans) && dailyPlans.length > 0) {
        console.log(`Adding ${dailyPlans.length} daily plans`);

        // Ensure all timeBlocks have taskIds initialized
        const processedPlans = dailyPlans.map(plan => {
          if (plan.timeBlocks) {
            plan.timeBlocks = plan.timeBlocks.map(block => ({
              ...block,
              taskIds: block.taskIds || []
            }));
          }
          return plan;
        });

        if (processedPlans.length > CHUNK_SIZE) {
          const planChunks = chunkArray(processedPlans, CHUNK_SIZE);
          for (const chunk of planChunks) {
            await db.dailyPlans.bulkAdd(chunk);
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        } else {
          await db.dailyPlans.bulkAdd(processedPlans);
        }
      }

      // 5. Process work schedule (should be a single object)
      try {
        // First check workSchedule field
        if (jsonData.includes('"workSchedule":')) {
          const scheduleMatch = jsonData.match(/"workSchedule":\s*(\{[^}]*\})/);
          if (scheduleMatch && scheduleMatch[1]) {
            const workSchedule = JSON.parse(scheduleMatch[1]);
            if (workSchedule && typeof workSchedule === 'object' &&
                workSchedule.id && Array.isArray(workSchedule.shifts)) {
              console.log('Adding work schedule');
              await db.workSchedules.add(workSchedule);
            }
          }
        }
        // Then check workSchedules field (older format)
        else if (jsonData.includes('"workSchedules":')) {
          const schedulesMatch = jsonData.match(/"workSchedules":\s*(\{[^}]*\})/);
          if (schedulesMatch && schedulesMatch[1]) {
            const workSchedules = JSON.parse(schedulesMatch[1]);
            if (workSchedules && typeof workSchedules === 'object' &&
                workSchedules.id && Array.isArray(workSchedules.shifts)) {
              console.log('Adding work schedule from workSchedules field');
              await db.workSchedules.add(workSchedules);
            }
          }
        }
      } catch (scheduleErr) {
        console.warn('Error processing work schedule, skipping:', scheduleErr);
      }

      // 6. Process journal entries
      const journalEntries = extractSection('journalEntries', jsonData);
      if (journalEntries && Array.isArray(journalEntries) && journalEntries.length > 0) {
        console.log(`Adding ${journalEntries.length} journal entries`);

        if (journalEntries.length > CHUNK_SIZE) {
          const entryChunks = chunkArray(journalEntries, CHUNK_SIZE);
          for (const chunk of entryChunks) {
            await db.journalEntries.bulkAdd(chunk);
            await new Promise(resolve => setTimeout(resolve, 10));
          }
        } else {
          await db.journalEntries.bulkAdd(journalEntries);
        }
      }

      // Free memory
      jsonData = '';

      console.log('Import completed successfully');
      return true;
    } catch (importError) {
      console.error('Error during progressive data import:', importError);
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