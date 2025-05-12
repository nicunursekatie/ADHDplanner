/**
 * Import file analyzer utility
 * Helps identify the structure of imported files to aid in conversion
 */

/**
 * Analyzes a JSON string to identify its structure
 * @param jsonString The JSON string to analyze
 * @returns Information about the file structure
 */
export interface ImportAnalysisResult {
  valid: boolean;
  topLevelKeys: string[];
  format: string;
  hasTasksData: boolean;
  needsConversion: boolean;
  conversionHints: string[];
}

export const analyzeImportFile = (jsonString: string): ImportAnalysisResult => {
  // Default result
  const result: ImportAnalysisResult = {
    valid: false,
    topLevelKeys: [],
    format: 'unknown',
    hasTasksData: false,
    needsConversion: true,
    conversionHints: []
  };

  try {
    // First check if it's valid JSON
    if (!jsonString.trim().startsWith('{') || !jsonString.trim().endsWith('}')) {
      result.conversionHints.push('File is not a valid JSON object. It should start with { and end with }');
      return result;
    }

    // Try to parse the JSON
    let data: Record<string, unknown>;
    try {
      data = JSON.parse(jsonString) as Record<string, unknown>;
      result.valid = true;
    } catch (error) {
      result.conversionHints.push(`JSON parsing error: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return result;
    }

    // Get the top level keys
    result.topLevelKeys = Object.keys(data);
    
    // Check if this might be our format already
    const adhdPlannerKeys = ['tasks', 'projects', 'categories', 'dailyPlans', 'workSchedule', 'journalEntries'];
    const matchingKeys = adhdPlannerKeys.filter(key => 
      result.topLevelKeys.some(k => k.toLowerCase() === key.toLowerCase())
    );
    
    // See if it has tasks data in some form
    result.hasTasksData = result.topLevelKeys.some(key => 
      key.toLowerCase().includes('task') ||
      key.toLowerCase().includes('todo') ||
      key.toLowerCase().includes('item')
    );
    
    // Determine format based on keys
    if (matchingKeys.length >= 3) {
      result.format = 'adhd-planner';
      result.needsConversion = false;
    } else if (result.topLevelKeys.includes('items') || result.topLevelKeys.includes('tasks')) {
      if (result.topLevelKeys.includes('lists')) {
        result.format = 'todo-app';
      } else if (result.topLevelKeys.includes('projects')) {
        result.format = 'project-manager';
      } else {
        result.format = 'task-app';
      }
    } else if (result.topLevelKeys.includes('events') || result.topLevelKeys.includes('calendar')) {
      result.format = 'calendar-app';
    }
    
    // Provide conversion hints
    if (result.needsConversion) {
      result.conversionHints.push(`File appears to be in "${result.format}" format instead of ADHD Planner format`);
      result.conversionHints.push(`You may need to convert your data before importing`);
      
      // More specific hints based on format
      if (result.hasTasksData) {
        result.conversionHints.push('Found task-like data that needs conversion to our format');
        
        // Check for arrays vs objects
        for (const key of Object.keys(data)) {
          if (Array.isArray(data[key])) {
            if (data[key].length > 0) {
              result.conversionHints.push(`Found array of ${data[key].length} items in "${key}" that could be converted`);
            }
          }
        }
      } else {
        result.conversionHints.push('No obvious task data found in this file');
      }
    }
    
    return result;
  } catch (error) {
    result.valid = false;
    result.conversionHints.push(`Error analyzing file: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return result;
  }
};

// Known formats and their converters
export interface ImportFormat {
  name: string;
  description: string;
  detector: (data: Record<string, unknown>) => boolean;
  converter: (data: Record<string, unknown>) => Record<string, unknown>;
}

/**
 * Converts data from another application format to our format
 * @param jsonData The JSON data to convert
 * @param sourceFormat The format of the source data
 * @returns Converted data compatible with our app
 */
interface ConvertedData {
  tasks: unknown[];
  projects: unknown[];
  categories: unknown[];
  dailyPlans: unknown[];
  workSchedule: unknown | null;
  journalEntries: unknown[];
  exportDate: string;
  version: string;
}

export const convertImportFormat = (jsonData: string, sourceFormat: string): string => {
  const parsed = JSON.parse(jsonData) as Record<string, unknown>;
  const converted: ConvertedData = {
    tasks: [],
    projects: [],
    categories: [],
    dailyPlans: [],
    workSchedule: null,
    journalEntries: [],
    exportDate: new Date().toISOString(),
    version: '1.0.0'
  };
  
  const timestamp = new Date().toISOString();
  
  // Generic ID generator
  const generateId = () => 
    Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  // Define interfaces for common structures in different app formats
  interface TodoItem {
    id?: string;
    title?: string;
    name?: string;
    text?: string;
    description?: string;
    notes?: string;
    completed?: boolean;
    done?: boolean;
    status?: string;
    archived?: boolean;
    dueDate?: string;
    due?: string;
    listId?: string;
    projectId?: string;
    parentId?: string;
    labels?: string[];
    tags?: string[];
    childIds?: string[];
    subtaskIds?: string[];
    createdAt?: string;
    updatedAt?: string;
    [key: string]: unknown;
  }

  interface ListItem {
    id?: string;
    name?: string;
    title?: string;
    description?: string;
    color?: string;
    createdAt?: string;
    updatedAt?: string;
    [key: string]: unknown;
  }

  interface EventItem {
    id?: string;
    title?: string;
    summary?: string;
    description?: string;
    completed?: boolean;
    date?: string;
    start?: { date?: string };
    created?: string;
    updated?: string;
    [key: string]: unknown;
  }

  try {
    switch (sourceFormat.toLowerCase()) {
      case 'todo-app':
        // Convert from typical todo app format
        // Assume structure like { items: [], lists: [] }
        if (parsed.items && Array.isArray(parsed.items)) {
          converted.tasks = (parsed.items as TodoItem[]).map((item) => ({
            id: item.id || generateId(),
            title: item.title || item.name || item.text || 'Untitled Task',
            description: item.description || item.notes || '',
            completed: item.completed || item.done || item.status === 'completed' || false,
            archived: item.archived || false,
            dueDate: item.dueDate || item.due || null,
            projectId: item.listId || item.projectId || null,
            categoryIds: item.labels || item.tags || [],
            parentTaskId: item.parentId || null,
            subtasks: item.childIds || item.subtaskIds || [],
            createdAt: item.createdAt || timestamp,
            updatedAt: item.updatedAt || timestamp
          }));
        }
        
        if (parsed.lists && Array.isArray(parsed.lists)) {
          converted.projects = (parsed.lists as ListItem[]).map((list) => ({
            id: list.id || generateId(),
            name: list.name || list.title || 'Untitled Project',
            description: list.description || '',
            color: list.color || '#3B82F6',
            createdAt: list.createdAt || timestamp,
            updatedAt: list.updatedAt || timestamp
          }));
        }
        
        if (parsed.tags && Array.isArray(parsed.tags)) {
          converted.categories = (parsed.tags as ListItem[]).map((tag) => ({
            id: tag.id || generateId(),
            name: tag.name || 'Untitled Category',
            color: tag.color || '#3B82F6',
            createdAt: tag.createdAt || timestamp,
            updatedAt: tag.updatedAt || timestamp
          }));
        }
        break;
        
      case 'project-manager':
        // Convert from project management app format
        if (parsed.tasks && Array.isArray(parsed.tasks)) {
          converted.tasks = (parsed.tasks as TodoItem[]).map((task) => ({
            id: task.id || generateId(),
            title: task.title || task.name || 'Untitled Task',
            description: task.description || task.content || '',
            completed: task.completed || task.status === 'done' || false,
            archived: task.archived || false,
            dueDate: task.dueDate || task.deadline || null,
            projectId: task.projectId || null,
            categoryIds: task.categories || task.tags || [],
            parentTaskId: task.parentId || null,
            subtasks: task.subtasks?.map((st: { id?: string }) => st.id || generateId()) || [],
            createdAt: task.createdAt || timestamp,
            updatedAt: task.updatedAt || timestamp
          }));
        }
        
        if (parsed.projects && Array.isArray(parsed.projects)) {
          converted.projects = (parsed.projects as ListItem[]).map((project) => ({
            id: project.id || generateId(),
            name: project.name || project.title || 'Untitled Project',
            description: project.description || '',
            color: project.color || '#3B82F6',
            createdAt: project.createdAt || timestamp,
            updatedAt: project.updatedAt || timestamp
          }));
        }
        break;
        
      case 'calendar-app':
        // Convert from calendar app format
        if (parsed.events && Array.isArray(parsed.events)) {
          // Convert events to tasks
          converted.tasks = (parsed.events as EventItem[]).map((event) => ({
            id: event.id || generateId(),
            title: event.title || event.summary || 'Untitled Event',
            description: event.description || '',
            completed: event.completed || false,
            archived: false,
            dueDate: event.date || event.start?.date || null,
            projectId: null,
            categoryIds: [],
            parentTaskId: null,
            subtasks: [],
            createdAt: event.created || timestamp,
            updatedAt: event.updated || timestamp
          }));
          
          // Convert event categories to our categories
          if (parsed.calendars && Array.isArray(parsed.calendars)) {
            converted.categories = (parsed.calendars as ListItem[]).map((cal) => ({
              id: cal.id || generateId(),
              name: cal.name || cal.title || 'Untitled Category',
              color: cal.color || '#3B82F6',
              createdAt: timestamp,
              updatedAt: timestamp
            }));
          }
        }
        break;
        
      default:
        // Generic conversion for unknown formats
        // Look for arrays that might contain tasks
        for (const key in parsed) {
          if (Array.isArray(parsed[key])) {
            const items = parsed[key];
            if (items.length > 0) {
              // Use type assertion, since we're checking properties dynamically
              const firstItem = items[0] as Record<string, unknown>;

              // Check if this looks like a task array
              if (
                typeof firstItem.title === 'string' ||
                typeof firstItem.name === 'string' ||
                typeof firstItem.text === 'string' ||
                typeof firstItem.description === 'string'
              ) {
                converted.tasks = (items as TodoItem[]).map((item) => ({
                  id: item.id || generateId(),
                  title: item.title || item.name || item.text || 'Untitled Task',
                  description: item.description || item.notes || item.content || '',
                  completed: item.completed || item.done || item.status === 'completed' || false,
                  archived: item.archived || false,
                  dueDate: item.dueDate || item.due || null,
                  projectId: item.projectId || item.listId || null,
                  categoryIds: item.categories || item.tags || item.labels || [],
                  parentTaskId: item.parentId || null,
                  subtasks: [],
                  createdAt: item.createdAt || timestamp,
                  updatedAt: item.updatedAt || timestamp
                }));
              }
              
              // Check if this looks like a project/list array
              if (typeof firstItem.name === 'string' && !converted.projects.length) {
                converted.projects = (items as ListItem[]).map((item) => ({
                  id: item.id || generateId(),
                  name: item.name || item.title || 'Untitled Project',
                  description: item.description || '',
                  color: item.color || '#3B82F6',
                  createdAt: item.createdAt || timestamp,
                  updatedAt: item.updatedAt || timestamp
                }));
              }
            }
          }
        }
        
        // If we still don't have any data, try to extract from non-array format
        if (converted.tasks.length === 0) {
          const taskKeys = ['tasks', 'todos', 'items', 'events'];
          for (const key of taskKeys) {
            const taskCollection = parsed[key];
            if (taskCollection && typeof taskCollection === 'object' && !Array.isArray(taskCollection)) {
              // Handle object with task IDs as keys
              const taskMap = taskCollection as Record<string, unknown>;
              for (const id in taskMap) {
                const item = taskMap[id] as TodoItem;
                converted.tasks.push({
                  id: id,
                  title: item.title || item.name || item.text || 'Untitled Task',
                  description: item.description || item.notes || '',
                  completed: item.completed || item.done || item.status === 'completed' || false,
                  archived: item.archived || false,
                  dueDate: item.dueDate || item.due || null,
                  projectId: item.projectId || item.listId || null,
                  categoryIds: item.categories || item.tags || [],
                  parentTaskId: item.parentId || null,
                  subtasks: [],
                  createdAt: item.createdAt || timestamp,
                  updatedAt: item.updatedAt || timestamp
                });
              }
            }
          }
        }
        break;
    }
    
    // Process parent-child relationships after conversion
    converted.tasks.forEach((task) => {
      const taskWithId = task as { id: string; parentTaskId?: string | null };
      if (taskWithId.parentTaskId) {
        const parentTask = converted.tasks.find(
          (t) => (t as { id: string }).id === taskWithId.parentTaskId
        ) as { id: string; subtasks: string[] } | undefined;

        if (parentTask && !parentTask.subtasks.includes(taskWithId.id)) {
          parentTask.subtasks.push(taskWithId.id);
        }
      }
    });
    
    return JSON.stringify(converted);
  } catch (error) {
    console.error('Error converting import format:', error);
    return jsonData; // Return original if conversion fails
  }
};