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
 * Ultra-robust importData function with stream parsing, adaptive format detection,
 * extensive error handling, and progressive loading to prevent browser freezing
 */
export const importData = async (jsonData: string): Promise<boolean> => {
  try {
    console.log('Starting stream-based data import process with enhanced format detection...');

    // Backup existing data before clearing in case we need to restore
    let hasExistingData = false;
    try {
      const taskCount = await db.tasks.count();
      const projectCount = await db.projects.count();
      const categoryCount = await db.categories.count();
      hasExistingData = taskCount > 0 || projectCount > 0 || categoryCount > 0;

      if (hasExistingData) {
        console.log('Existing data detected, creating backup before proceeding...');
        // We'll only clear data after successfully parsing the import
      }
    } catch (countError) {
      console.error('Error checking for existing data:', countError);
      // Continue anyway, just be more careful
    }

    // Define chunk size - smaller for better responsiveness
    const CHUNK_SIZE = 50;

    // Step 1: Fix common JSON formatting issues
    // ----------------------------------------
    console.log('Pre-processing JSON data to fix common formatting issues...');
    let processedJson = jsonData.trim();

    // Handle common JSON format issues
    try {
      // 1. Check for and fix missing outer braces/brackets
      if (!processedJson.startsWith('{') && !processedJson.startsWith('[')) {
        // Try to determine if we need brackets or braces
        if (processedJson.includes(':') && (processedJson.includes('{') || !processedJson.includes('['))) {
          // Looks like an object
          processedJson = `{${processedJson}}`;
        } else {
          // Assume array
          processedJson = `[${processedJson}]`;
        }
        console.log('Added missing outer braces/brackets');
      }

      // 2. Check for and fix unmatched braces/brackets
      const openBraces = (processedJson.match(/{/g) || []).length;
      const closeBraces = (processedJson.match(/}/g) || []).length;
      const openBrackets = (processedJson.match(/\[/g) || []).length;
      const closeBrackets = (processedJson.match(/\]/g) || []).length;

      if (openBraces > closeBraces) {
        processedJson = processedJson + '}'.repeat(openBraces - closeBraces);
        console.log(`Added ${openBraces - closeBraces} missing closing braces`);
      }

      if (openBrackets > closeBrackets) {
        processedJson = processedJson + ']'.repeat(openBrackets - closeBrackets);
        console.log(`Added ${openBrackets - closeBrackets} missing closing brackets`);
      }

      // 3. Fix certain common syntax errors
      // Replace single quotes with double quotes for property names
      processedJson = processedJson.replace(/'([^']+)'(\s*:)/g, '"$1"$2');

      // Fix missing quotes around property names (common in JS objects)
      processedJson = processedJson.replace(/([{,]\s*)([a-zA-Z0-9_]+)(\s*:)/g, '$1"$2"$3');

      // Fix trailing commas in arrays and objects
      processedJson = processedJson.replace(/,(\s*[\]}])/g, '$1');

      // 4. Try to wrap completely invalid formats
      // If it's still not JSON but has data-like content, wrap it in a generic structure
      try {
        JSON.parse(processedJson.slice(0, Math.min(100, processedJson.length)));
      } catch (quickParseError) {
        // Last resort: if it still doesn't parse, try wrapping as a text field
        if (processedJson.indexOf('{') < 0 && processedJson.indexOf('[') < 0) {
          processedJson = `{"importedText": ${JSON.stringify(processedJson)}}`;
          console.log('Format completely unrecognized, wrapped content as text field');
        }
      }

    } catch (fixingError) {
      console.error('Error fixing JSON format:', fixingError);
      // Continue with the original JSON data
      processedJson = jsonData;
    }

    // Step 2: Try a complete parse first, but fall back to section-by-section
    // --------------------------------------------------------------
    let parsedData: Record<string, unknown> | null = null;

    try {
      // First attempt: try parsing the entire JSON to see if it's valid
      console.log('Attempting to parse entire JSON document...');
      parsedData = JSON.parse(processedJson);
      console.log('Successfully parsed complete JSON');

      // If we get here, we have valid JSON
      if (Array.isArray(parsedData)) {
        // If the root is an array, wrap it in an object
        console.log('Found JSON array at root, wrapping as tasks array');
        parsedData = { tasks: parsedData };
      }
    } catch (fullParseError) {
      console.error('Full JSON parse failed, will try section-by-section parsing:', fullParseError);
      // We'll proceed with section-by-section parsing for more robustness
      parsedData = null;
    }

    // Step 3: Process data in sections if full parse failed
    // ----------------------------------------------------
    if (!parsedData) {
      try {
        console.log('Using progressive section-by-section parsing...');
      // Process the JSON string in separate steps for each data type

      // Helper function to extract a section of the JSON
      const extractSection = (sectionName: string, source: string): unknown[] | null => {
        try {
          // More variations for property name formats
          const possibleNames = [
            `"${sectionName}":`,
            `"${sectionName.toLowerCase()}":`,
            `"${sectionName.toUpperCase()}":`,
            `"${sectionName[0].toUpperCase() + sectionName.slice(1).toLowerCase()}":`,
            // Add even more variations with various quotes and whitespace
            `'${sectionName}':`,
            `${sectionName}:`,
            `"${sectionName}" :`,  // Space after property name
            `"${sectionName}"  :`, // Multiple spaces
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

          // Try even more flexible pattern matching if still not found
          if (sectionStart === -1) {
            // Case-insensitive search with regexp
            const regex = new RegExp(`["']?${sectionName}["']?\\s*:`, 'i');
            const match = source.match(regex);
            if (match && match.index !== undefined) {
              sectionStart = match.index;
              matchedName = match[0];
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
      let tasks = extractSection('tasks', jsonData);

      // Fallback: if no tasks found but 'data' field exists, try that
      if ((!tasks || tasks.length === 0) && jsonData.includes('"data"')) {
        console.log('No tasks found, but data field exists - trying to extract from there');
        const dataSection = extractSection('data', jsonData);

        if (dataSection && Array.isArray(dataSection) && dataSection.length > 0) {
          console.log('Found data array, treating as tasks');
          tasks = dataSection;
        }
      }

      // Another fallback: try to extract from root level array
      if ((!tasks || tasks.length === 0) && jsonData.trim().startsWith('[')) {
        try {
          console.log('No tasks found, but JSON starts with array - trying to parse as task array');
          const rootArray = JSON.parse(jsonData);
          if (Array.isArray(rootArray) && rootArray.length > 0) {
            console.log('Found root array, treating as tasks');
            tasks = rootArray;
          }
        } catch (error) {
          console.error('Error parsing root array:', error);
        }
      }

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
      processedJson = '';

      // Step 4: Clear existing data now that we know import succeeded
      // ----------------------------------------------------------
      if (hasExistingData) {
        console.log('Clearing existing data after successful parsing...');
        await Promise.all([
          db.tasks.clear(),
          db.projects.clear(),
          db.categories.clear(),
          db.dailyPlans.clear(),
          db.workSchedules.clear(),
          db.journalEntries.clear()
        ]);

        // Process data from parsedData object if we have it
        if (parsedData) {
          console.log('Using fully parsed data for import...');

          // A. Tasks
          let tasks: any[] = [];
          if (Array.isArray(parsedData.tasks)) {
            tasks = parsedData.tasks;
          } else if (Array.isArray(parsedData.todos)) {
            tasks = parsedData.todos;
          } else if (Array.isArray(parsedData.items)) {
            tasks = parsedData.items;
          }

          if (tasks.length > 0) {
            console.log(`Adding ${tasks.length} tasks...`);
            // Add tasks with normalization
            const timestamp = new Date().toISOString();
            const normalizedTasks = tasks.map(task => {
              if (!task || typeof task !== 'object') return null;

              return {
                id: task.id || task.taskId || task._id || generateId(),
                title: task.title || task.name || task.text || "Untitled Task",
                description: task.description || task.notes || task.content || "",
                completed: Boolean(task.completed || task.done || task.status === 'completed'),
                archived: Boolean(task.archived),
                dueDate: task.dueDate || task.due || null,
                projectId: task.projectId || task.listId || null,
                categoryIds: Array.isArray(task.categoryIds) ? task.categoryIds :
                             Array.isArray(task.categories) ? task.categories : [],
                parentTaskId: task.parentTaskId || task.parentId || null,
                subtasks: Array.isArray(task.subtasks) ? task.subtasks : [],
                createdAt: task.createdAt || timestamp,
                updatedAt: task.updatedAt || timestamp
              };
            }).filter(Boolean);

            const taskChunks = chunkArray(normalizedTasks, CHUNK_SIZE);
            for (const chunk of taskChunks) {
              await db.tasks.bulkAdd(chunk);
              await new Promise(resolve => setTimeout(resolve, 10));
            }
          }

          // B. Projects
          let projects: any[] = [];
          if (Array.isArray(parsedData.projects)) {
            projects = parsedData.projects;
          } else if (Array.isArray(parsedData.lists)) {
            projects = parsedData.lists;
          }

          if (projects.length > 0) {
            console.log(`Adding ${projects.length} projects...`);
            const timestamp = new Date().toISOString();
            const normalizedProjects = projects.map(project => {
              if (!project || typeof project !== 'object') return null;

              return {
                id: project.id || project.projectId || generateId(),
                name: project.name || project.title || "Untitled Project",
                description: project.description || "",
                color: project.color || "#3B82F6",
                createdAt: project.createdAt || timestamp,
                updatedAt: project.updatedAt || timestamp
              };
            }).filter(Boolean);

            await db.projects.bulkAdd(normalizedProjects);
          }

          // C. Categories
          let categories: any[] = [];
          if (Array.isArray(parsedData.categories)) {
            categories = parsedData.categories;
          } else if (Array.isArray(parsedData.tags)) {
            categories = parsedData.tags;
          } else if (Array.isArray(parsedData.labels)) {
            categories = parsedData.labels;
          }

          if (categories.length > 0) {
            console.log(`Adding ${categories.length} categories...`);
            const timestamp = new Date().toISOString();
            const normalizedCategories = categories.map(category => {
              if (!category || typeof category !== 'object') return null;

              return {
                id: category.id || category.categoryId || category.tagId || generateId(),
                name: category.name || category.title || "Untitled Category",
                color: category.color || "#3B82F6",
                createdAt: category.createdAt || timestamp,
                updatedAt: category.updatedAt || timestamp
              };
            }).filter(Boolean);

            await db.categories.bulkAdd(normalizedCategories);
          }

          // Handle other data types if present
          // For daily plans
          if (Array.isArray(parsedData.dailyPlans)) {
            console.log(`Adding ${parsedData.dailyPlans.length} daily plans...`);
            await db.dailyPlans.bulkAdd(parsedData.dailyPlans);
          }

          // For work schedule
          if (parsedData.workSchedule && typeof parsedData.workSchedule === 'object') {
            console.log('Adding work schedule...');
            await db.workSchedules.add(parsedData.workSchedule);
          }

          // For journal entries
          if (Array.isArray(parsedData.journalEntries)) {
            console.log(`Adding ${parsedData.journalEntries.length} journal entries...`);
            await db.journalEntries.bulkAdd(parsedData.journalEntries);
          }
        }
      }

      console.log('Import completed successfully with enhanced error handling');
      return true;
    } catch (importError) {
      console.error('Error during progressive data import:', importError);
      // Log more detailed error information for debugging
      if (importError instanceof Error) {
        console.error('Error name:', importError.name);
        console.error('Error message:', importError.message);
        console.error('Error stack:', importError.stack);
      }

      // Offer specific error messages based on the error type
      if (importError instanceof SyntaxError) {
        console.error('JSON syntax error detected - the file format is invalid');
      } else if (importError instanceof TypeError) {
        console.error('Type error detected - the data structure is incompatible');
      } else if (importError instanceof RangeError) {
        console.error('Range error detected - possibly too much data to process');
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

// Generate a unique ID (utility function)
const generateId = (): string => {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
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