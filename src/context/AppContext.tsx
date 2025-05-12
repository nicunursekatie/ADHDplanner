import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Task, Project, Category, DailyPlan, WhatNowCriteria, JournalEntry } from '../types';
import { WorkSchedule, WorkShift, ShiftType, DEFAULT_SHIFTS } from '../types/WorkSchedule';

// Import storage mechanisms
import * as localStorage from '../utils/localStorage';
import * as dexieStorage from '../utils/dexieStorage';
import * as supabaseStorage from '../utils/supabase';
import { generateId, createSampleData, getISOWeekAndYear } from '../utils/helpers';
import { migrateFromLocalStorageToDexie, checkForLocalStorageData } from '../utils/migrationUtils';

interface DeletedTask {
  task: Task;
  timestamp: number;
}

// Storage types
export type StorageType = 'dexie' | 'supabase';

// Function to get the current storage mechanism based on user preference
const getStorageMechanism = (): StorageType => {
  // Try to get from localStorage (because this is a simple value we still use native localStorage)
  const storedPreference = window.localStorage.getItem('storagePreference');
  return (storedPreference === 'supabase') ? 'supabase' : 'dexie';
};

// Initialize storage based on preference
const getStorage = () => {
  const storageType = getStorageMechanism();
  return storageType === 'supabase' ? supabaseStorage : dexieStorage;
};

// We'll use Dexie storage as our default storage mechanism
let storage = getStorage();

interface AppContextType {
  // Tasks
  tasks: Task[];
  addTask: (task: Partial<Task>) => Promise<Task>;
  quickAddTask: (title: string, projectId?: string | null) => Promise<Task>;
  addSubtask: (parentId: string, subtaskData: Partial<Task>) => Promise<Task>;
  updateTask: (task: Task) => Promise<void>;
  deleteTask: (taskId: string) => Promise<void>;
  completeTask: (taskId: string) => Promise<void>;
  archiveCompletedTasks: () => Promise<void>;
  undoDelete: () => Promise<void>;
  hasRecentlyDeleted: boolean;

  // Projects
  projects: Project[];
  addProject: (project: Partial<Project>) => Promise<Project>;
  updateProject: (project: Project) => Promise<void>;
  deleteProject: (projectId: string) => Promise<void>;

  // Categories
  categories: Category[];
  addCategory: (category: Partial<Category>) => Promise<Category>;
  updateCategory: (category: Category) => Promise<void>;
  deleteCategory: (categoryId: string) => Promise<void>;

  // Daily Plans
  dailyPlans: DailyPlan[];
  getDailyPlan: (date: string) => Promise<DailyPlan | null>;
  saveDailyPlan: (plan: DailyPlan) => Promise<void>;
  exportTimeBlocksToTasks: (date: string) => Promise<number>;

  // Work Schedule
  workSchedule: WorkSchedule | null;
  workShifts: WorkShift[];
  addWorkShift: (date: string, shiftType?: ShiftType) => Promise<WorkShift>;
  updateWorkShift: (shift: WorkShift) => Promise<void>;
  deleteWorkShift: (shiftId: string) => Promise<void>;
  getShiftsForMonth: (year: number, month: number) => WorkShift[];
  getShiftForDate: (date: string) => WorkShift | undefined;

  // Journal Entries
  journalEntries: JournalEntry[];
  addJournalEntry: (entry: Partial<JournalEntry>) => Promise<JournalEntry>;
  updateJournalEntry: (entry: JournalEntry) => Promise<void>;
  deleteJournalEntry: (entryId: string) => Promise<void>;
  getJournalEntriesForDate: (date: string) => JournalEntry[];
  getJournalEntriesForWeek: (weekNumber: number, weekYear: number) => JournalEntry[];
  getLatestWeeklyReview: () => { weekNumber: number; weekYear: number; entries: JournalEntry[] } | null;

  // What Now Wizard
  recommendTasks: (criteria: WhatNowCriteria) => Task[];

  // Data Management
  exportData: () => Promise<string>;
  importData: (jsonData: string) => Promise<boolean>;
  resetData: () => Promise<void>;
  initializeSampleData: () => Promise<void>;
  performDatabaseMaintenance: () => Promise<void>;

  // Storage Management
  getCurrentStorage: () => StorageType;
  switchStorage: (storageType: StorageType) => Promise<boolean>;
  syncToCloud: () => Promise<boolean>;
  syncFromCloud: () => Promise<boolean>;
  isCloudConnected: boolean;
  checkCloudConnection: () => Promise<boolean>;

  // App State
  isLoading: boolean;
  loadingStates: {
    tasks: boolean;
    projects: boolean;
    categories: boolean;
    dailyPlans: boolean;
    workSchedule: boolean;
    journalEntries: boolean;
    importExport: boolean;
  };
  isDataInitialized: boolean;
  isError: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const UNDO_WINDOW = 5000; // 5 seconds window for undo

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dailyPlans, setDailyPlans] = useState<DailyPlan[]>([]);
  const [workSchedule, setWorkSchedule] = useState<WorkSchedule | null>(null);
  const [journalEntries, setJournalEntries] = useState<JournalEntry[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataInitialized, setIsDataInitialized] = useState(false);
  const [isError, setIsError] = useState(false);
  const [deletedTasks, setDeletedTasks] = useState<DeletedTask[]>([]);
  const [currentStorageType, setCurrentStorageType] = useState<StorageType>(getStorageMechanism());
  const [isCloudConnected, setIsCloudConnected] = useState<boolean>(false);

  // Clean up old deleted tasks
  useEffect(() => {
    const cleanup = setInterval(() => {
      const now = Date.now();
      setDeletedTasks(prev =>
        prev.filter(dt => now - dt.timestamp < UNDO_WINDOW)
      );
    }, 1000);

    return () => clearInterval(cleanup);
  }, []);

  // State for tracking individual loading states
  const [loadingStates, setLoadingStates] = useState({
    tasks: false,
    projects: false,
    categories: false,
    dailyPlans: false,
    workSchedule: false,
    journalEntries: false,
    importExport: false
  });

  // Helper to update specific loading states
  const setSpecificLoadingState = useCallback((key: keyof typeof loadingStates, isLoading: boolean) => {
    if (loadingStates[key] !== isLoading) {
      setLoadingStates(prev => ({
        ...prev,
        [key]: isLoading
      }));
    }
  }, [loadingStates]);

  // Load data on initial render - use an empty dependency array to ensure it only runs once
  useEffect(() => {
    const loadData = async () => {
      try {
        console.log('Initial data loading started with emergency mode');
        setIsLoading(true);
        setIsError(false);

        // EMERGENCY MODE: Skip loading all data at once to prevent memory issues
        // Just set empty arrays for everything to start with
        setTasks([]);
        setProjects([]);
        setCategories([]);
        setDailyPlans([]);
        setWorkSchedule(null);
        setJournalEntries([]);

        // Then immediately stop loading
        setIsLoading(false);
        setIsDataInitialized(true);

        console.log('Initial setup complete in emergency mode - skipped loading data');

        // After a short delay, try to reset the database
        setTimeout(async () => {
          try {
            console.log('Attempting emergency database reset/repair...');

            // Try to compact the database first
            try {
              await storage.compact();
              console.log('Database compacted successfully in emergency mode');
            } catch (compactError) {
              console.error('Error compacting database in emergency mode:', compactError);
            }

            // Set it to empty data
            console.log('Setting empty data in emergency mode');
            await storage.saveTasks([]);
            await storage.saveProjects([]);
            await storage.saveCategories([]);
            await storage.saveDailyPlans([]);
            // Do not clear workSchedule and journalEntries to preserve some data

            console.log('Emergency database reset/repair completed');
          } catch (emergencyError) {
            console.error('Error in emergency reset process:', emergencyError);
          }
        }, 2000);
      } catch (error) {
        console.error('Error in emergency loading mode:', error);
        setIsError(true);
        setIsLoading(false);
      }
    };

    loadData();
  // Use empty dependency array to ensure this only runs once at mount
  }, []);
  
  // Tasks
  const addTask = useCallback(async (taskData: Partial<Task>): Promise<Task> => {
    try {
      const timestamp = new Date().toISOString();
      const newTask: Task = {
        id: generateId(),
        title: '',
        description: '',
        completed: false,
        archived: false,
        dueDate: null,
        projectId: null,
        categoryIds: [],
        parentTaskId: null,
        subtasks: [],
        createdAt: timestamp,
        updatedAt: timestamp,
        ...taskData,
      };

      const updatedTasks = [...tasks, newTask];
      setTasks(updatedTasks);

      // Using dexie storage
      await storage.saveTasks(updatedTasks);

      // Update parent task if this is a subtask
      if (newTask.parentTaskId) {
        const parentTask = updatedTasks.find(t => t.id === newTask.parentTaskId);
        if (parentTask) {
          const updatedParent = {
            ...parentTask,
            subtasks: [...parentTask.subtasks, newTask.id],
            updatedAt: timestamp,
          };

          const finalTasks = updatedTasks.map(t =>
            t.id === updatedParent.id ? updatedParent : t
          );

          setTasks(finalTasks);
          await storage.saveTasks(finalTasks);
        }
      }

      return newTask;
    } catch (error) {
      console.error('Error adding task:', error);
      setIsError(true);
      throw error;
    }
  }, [tasks]);

  const updateTask = useCallback(async (updatedTask: Task): Promise<void> => {
    try {
      // Set loading state
      setSpecificLoadingState('tasks', true);

      const timestamp = new Date().toISOString();
      const taskWithTimestamp = {
        ...updatedTask,
        updatedAt: timestamp,
      };

      // Update local state immediately for responsive UI
      const updatedTasks = tasks.map(task =>
        task.id === updatedTask.id ? taskWithTimestamp : task
      );
      setTasks(updatedTasks);

      // Perform the async operation
      // Using dexie storage
      await storage.saveTasks(updatedTasks);
    } catch (error) {
      console.error('Error updating task:', error);
      setIsError(true);
      throw error;
    } finally {
      // Always reset loading state
      setSpecificLoadingState('tasks', false);
    }
  }, [tasks, setSpecificLoadingState]);

  const deleteTask = useCallback(async (taskId: string): Promise<void> => {
    try {
      // Store the task for potential undo
      const taskToDelete = tasks.find(t => t.id === taskId);
      if (taskToDelete) {
        setDeletedTasks(prev => [...prev, {
          task: taskToDelete,
          timestamp: Date.now()
        }]);
      }

      // Remove task from parent's subtasks if it's a subtask
      if (taskToDelete?.parentTaskId) {
        const parentTask = tasks.find(t => t.id === taskToDelete.parentTaskId);
        if (parentTask) {
          const updatedParent = {
            ...parentTask,
            subtasks: parentTask.subtasks.filter(id => id !== taskId),
            updatedAt: new Date().toISOString(),
          };

          setTasks(prev => prev.map(t =>
            t.id === updatedParent.id ? updatedParent : t
          ));
        }
      }

      // Delete all subtasks recursively
      const deleteSubtasksRecursively = (parentId: string) => {
        const subtaskIds = tasks
          .filter(t => t.parentTaskId === parentId)
          .map(t => t.id);

        subtaskIds.forEach(id => {
          deleteSubtasksRecursively(id);
        });

        setTasks(prev => prev.filter(t => t.id !== parentId && t.parentTaskId !== parentId));
      };

      deleteSubtasksRecursively(taskId);

      // Delete the task itself
      const updatedTasks = tasks.filter(task => task.id !== taskId);
      setTasks(updatedTasks);

      // Using dexie storage
      await storage.saveTasks(updatedTasks);
    } catch (error) {
      console.error('Error deleting task:', error);
      setIsError(true);
      throw error;
    }
  }, [tasks]);

  const undoDelete = useCallback(async (): Promise<void> => {
    try {
      if (deletedTasks.length === 0) return;

      const lastDeleted = deletedTasks[deletedTasks.length - 1];
      const updatedTasks = [...tasks, lastDeleted.task];

      setTasks(updatedTasks);

      // Using dexie storage
      await storage.saveTasks(updatedTasks);

      setDeletedTasks(prev => prev.slice(0, -1));
    } catch (error) {
      console.error('Error undoing delete:', error);
      setIsError(true);
      throw error;
    }
  }, [tasks, deletedTasks]);

  const hasRecentlyDeleted = deletedTasks.length > 0;

  const completeTask = useCallback(async (taskId: string): Promise<void> => {
    try {
      const timestamp = new Date().toISOString();
      const taskToUpdate = tasks.find(t => t.id === taskId);

      if (!taskToUpdate) return;

      const updatedTask = {
        ...taskToUpdate,
        completed: !taskToUpdate.completed,
        updatedAt: timestamp,
      };

      const updatedTasks = tasks.map(task =>
        task.id === taskId ? updatedTask : task
      );

      setTasks(updatedTasks);

      // Using dexie storage
      await storage.saveTasks(updatedTasks);
    } catch (error) {
      console.error('Error completing task:', error);
      setIsError(true);
      throw error;
    }
  }, [tasks]);

  const archiveCompletedTasks = useCallback(async (): Promise<void> => {
    try {
      const timestamp = new Date().toISOString();

      // Find all completed tasks and set them as archived
      const updatedTasks = tasks.map(task => {
        if (task.completed && !task.archived) {
          return {
            ...task,
            archived: true,
            updatedAt: timestamp,
          };
        }
        return task;
      });

      setTasks(updatedTasks);

      // Using dexie storage
      await storage.saveTasks(updatedTasks);
    } catch (error) {
      console.error('Error archiving completed tasks:', error);
      setIsError(true);
      throw error;
    }
  }, [tasks]);
  
  // Projects
  const addProject = useCallback(async (projectData: Partial<Project>): Promise<Project> => {
    try {
      const timestamp = new Date().toISOString();
      const newProject: Project = {
        id: generateId(),
        name: '',
        description: '',
        color: '#3B82F6', // Default blue color
        createdAt: timestamp,
        updatedAt: timestamp,
        ...projectData,
      };

      const updatedProjects = [...projects, newProject];
      setProjects(updatedProjects);

      // Using dexie storage
      await storage.saveProjects(updatedProjects);
      return newProject;
    } catch (error) {
      console.error('Error adding project:', error);
      setIsError(true);
      throw error;
    }
  }, [projects]);

  const updateProject = useCallback(async (updatedProject: Project): Promise<void> => {
    try {
      const timestamp = new Date().toISOString();
      const projectWithTimestamp = {
        ...updatedProject,
        updatedAt: timestamp,
      };

      const updatedProjects = projects.map(project =>
        project.id === updatedProject.id ? projectWithTimestamp : project
      );

      setProjects(updatedProjects);

      // Using dexie storage
      await storage.saveProjects(updatedProjects);
    } catch (error) {
      console.error('Error updating project:', error);
      setIsError(true);
      throw error;
    }
  }, [projects]);

  const deleteProject = useCallback(async (projectId: string): Promise<void> => {
    try {
      // Remove project from tasks
      const updatedTasks = tasks.map(task => {
        if (task.projectId === projectId) {
          return {
            ...task,
            projectId: null,
            updatedAt: new Date().toISOString(),
          };
        }
        return task;
      });

      setTasks(updatedTasks);

      // Delete project
      const updatedProjects = projects.filter(project => project.id !== projectId);
      setProjects(updatedProjects);

      // Using dexie storage
      await Promise.all([
        storage.saveTasks(updatedTasks),
        storage.saveProjects(updatedProjects)
      ]);
    } catch (error) {
      console.error('Error deleting project:', error);
      setIsError(true);
      throw error;
    }
  }, [projects, tasks]);
  
  // Categories
  const addCategory = useCallback(async (categoryData: Partial<Category>): Promise<Category> => {
    try {
      const timestamp = new Date().toISOString();
      const newCategory: Category = {
        id: generateId(),
        name: '',
        color: '#3B82F6', // Default blue color
        createdAt: timestamp,
        updatedAt: timestamp,
        ...categoryData,
      };

      const updatedCategories = [...categories, newCategory];
      setCategories(updatedCategories);

      // Using dexie storage
      await storage.saveCategories(updatedCategories);
      return newCategory;
    } catch (error) {
      console.error('Error adding category:', error);
      setIsError(true);
      throw error;
    }
  }, [categories]);

  const updateCategory = useCallback(async (updatedCategory: Category): Promise<void> => {
    try {
      const timestamp = new Date().toISOString();
      const categoryWithTimestamp = {
        ...updatedCategory,
        updatedAt: timestamp,
      };

      const updatedCategories = categories.map(category =>
        category.id === updatedCategory.id ? categoryWithTimestamp : category
      );

      setCategories(updatedCategories);

      // Using dexie storage
      await storage.saveCategories(updatedCategories);
    } catch (error) {
      console.error('Error updating category:', error);
      setIsError(true);
      throw error;
    }
  }, [categories]);

  const deleteCategory = useCallback(async (categoryId: string): Promise<void> => {
    try {
      // Remove category from tasks
      const updatedTasks = tasks.map(task => {
        if (task.categoryIds?.includes(categoryId) || false) {
          return {
            ...task,
            categoryIds: task.categoryIds.filter(id => id !== categoryId),
            updatedAt: new Date().toISOString(),
          };
        }
        return task;
      });

      setTasks(updatedTasks);

      // Delete category
      const updatedCategories = categories.filter(category => category.id !== categoryId);
      setCategories(updatedCategories);

      // Using dexie storage
      await Promise.all([
        storage.saveTasks(updatedTasks),
        storage.saveCategories(updatedCategories)
      ]);
    } catch (error) {
      console.error('Error deleting category:', error);
      setIsError(true);
      throw error;
    }
  }, [categories, tasks]);
  
  // Daily Plans
  const getDailyPlan = useCallback(async (date: string): Promise<DailyPlan | null> => {
    try {
      // Get daily plan from Dexie storage
      return await storage.getDailyPlan(date);
    } catch (error) {
      console.error('Error getting daily plan:', error);
      setIsError(true);
      // Fallback to in-memory plans
      return dailyPlans.find(plan => plan.date === date) || null;
    }
  }, [dailyPlans]);

  const saveDailyPlan = useCallback(async (plan: DailyPlan): Promise<void> => {
    try {
      const existingIndex = dailyPlans.findIndex(p => p.date === plan.date);
      let updatedPlans: DailyPlan[];

      if (existingIndex !== -1) {
        updatedPlans = [
          ...dailyPlans.slice(0, existingIndex),
          plan,
          ...dailyPlans.slice(existingIndex + 1),
        ];
      } else {
        updatedPlans = [...dailyPlans, plan];
      }

      setDailyPlans(updatedPlans);

      // Using dexie storage
      await storage.saveDailyPlan(plan);
    } catch (error) {
      console.error('Error saving daily plan:', error);
      setIsError(true);
      throw error;
    }
  }, [dailyPlans]);

  // Function to make time blocks show up in calendar view
  const exportTimeBlocksToTasks = useCallback(async (date: string): Promise<number> => {
    try {
      // Get the daily plan for the specified date
      const plan = await getDailyPlan(date);
      if (!plan || !plan.timeBlocks || plan.timeBlocks.length === 0) {
        return 0; // No time blocks to export
      }

      let exportedCount = 0;

      // Count time blocks for reporting purposes
      plan.timeBlocks.forEach(block => {
        // Skip empty blocks with no title
        if (!block.title || block.title === 'New Time Block') {
          return;
        }

        exportedCount++;
      });

      // Instead of creating tasks, we simply update the UI to show that blocks were exported
      // The calendar view already reads from the dailyPlans data structure directly

      return exportedCount;
    } catch (error) {
      console.error('Error exporting time blocks to tasks:', error);
      setIsError(true);
      return 0;
    }
  }, [getDailyPlan]);
  
  // Work Schedule
  const workShifts = workSchedule?.shifts || [];

  const addWorkShift = useCallback(async (date: string, shiftType: ShiftType = 'full'): Promise<WorkShift> => {
    try {
      const shiftDefaults = DEFAULT_SHIFTS[shiftType];
      const newShift: WorkShift = {
        id: generateId(),
        date,
        startTime: shiftDefaults.startTime,
        endTime: shiftDefaults.endTime,
        shiftType: shiftDefaults.shiftType,
      };

      // Update local state first for responsive UI
      let updatedSchedule: WorkSchedule;

      setWorkSchedule(prev => {
        if (!prev) {
          updatedSchedule = {
            id: generateId(),
            name: 'My Work Schedule',
            shifts: [newShift],
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
          };
          return updatedSchedule;
        }

        updatedSchedule = {
          ...prev,
          shifts: [...prev.shifts, newShift],
          updatedAt: new Date().toISOString()
        };
        return updatedSchedule;
      });

      // Save to storage
      // Using dexie storage
      await storage.saveWorkSchedule(updatedSchedule);

      return newShift;
    } catch (error) {
      console.error('Error adding work shift:', error);
      setIsError(true);
      throw error;
    }
  }, []);

  const updateWorkShift = useCallback(async (updatedShift: WorkShift): Promise<void> => {
    try {
      // Update local state first for responsive UI
      let updatedSchedule: WorkSchedule | null = null;

      setWorkSchedule(prev => {
        if (!prev) return null;

        updatedSchedule = {
          ...prev,
          shifts: prev.shifts.map(shift =>
            shift.id === updatedShift.id ? updatedShift : shift
          ),
          updatedAt: new Date().toISOString()
        };
        return updatedSchedule;
      });

      if (updatedSchedule) {
        // Save to storage
        // Using dexie storage
        await storage.saveWorkSchedule(updatedSchedule);
      }
    } catch (error) {
      console.error('Error updating work shift:', error);
      setIsError(true);
      throw error;
    }
  }, []);

  const deleteWorkShift = useCallback(async (shiftId: string): Promise<void> => {
    try {
      // Update local state first for responsive UI
      let updatedSchedule: WorkSchedule | null = null;

      setWorkSchedule(prev => {
        if (!prev) return null;

        updatedSchedule = {
          ...prev,
          shifts: prev.shifts.filter(shift => shift.id !== shiftId),
          updatedAt: new Date().toISOString()
        };
        return updatedSchedule;
      });

      if (updatedSchedule) {
        // Save to storage
        // Using dexie storage
        await storage.saveWorkSchedule(updatedSchedule);
      }
    } catch (error) {
      console.error('Error deleting work shift:', error);
      setIsError(true);
      throw error;
    }
  }, []);
  
  const getShiftsForMonth = useCallback((year: number, month: number): WorkShift[] => {
    try {
      if (!workSchedule) return [];
      if (!workSchedule.shifts || !Array.isArray(workSchedule.shifts)) return [];

      // Create date range for the given month
      const startDate = new Date(year, month, 1).toISOString().split('T')[0];
      const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];

      return workSchedule.shifts.filter(shift =>
        shift && shift.date && shift.date >= startDate && shift.date <= endDate
      );
    } catch (error) {
      console.error('Error in getShiftsForMonth:', error);
      return [];
    }
  }, [workSchedule]);
  
  const getShiftForDate = useCallback((date: string): WorkShift | undefined => {
    if (!workSchedule || !workSchedule.shifts) return undefined;
    return workSchedule.shifts.find(shift => shift.date === date);
  }, [workSchedule]);
  
  // What Now Wizard
  const recommendTasks = useCallback((criteria: WhatNowCriteria): Task[] => {
    // Filter to incomplete tasks
    let filteredTasks = tasks.filter(task => !task.completed);
    
    // Filter by available time
    if (criteria.availableTime === 'short') {
      // Prioritize tasks without subtasks, assuming they're quicker
      filteredTasks = filteredTasks.filter(task => task.subtasks.length === 0);
    }
    
    // Sort by energy level
    filteredTasks.sort((a, b) => {
      // For low energy, prioritize simpler tasks (those without subtasks)
      if (criteria.energyLevel === 'low') {
        return (a.subtasks.length - b.subtasks.length);
      }
      
      // For high energy, prioritize complex tasks (those with subtasks)
      if (criteria.energyLevel === 'high') {
        return (b.subtasks.length - a.subtasks.length);
      }
      
      // For medium energy, prioritize by due date
      return a.dueDate && b.dueDate 
        ? a.dueDate.localeCompare(b.dueDate)
        : (a.dueDate ? -1 : (b.dueDate ? 1 : 0));
    });
    
    // Return top 5 recommendations
    return filteredTasks.slice(0, 5);
  }, [tasks]);
  
  // Data Management
  const exportData = useCallback(async (): Promise<string> => {
    try {
      // Using dexie storage
      return await storage.exportData();
    } catch (error) {
      console.error('Error exporting data:', error);
      setIsError(true);
      // Fallback to localStorage export
      return localStorage.exportData();
    }
  }, []);

  const importData = useCallback(async (jsonData: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      setSpecificLoadingState('importExport', true);

      console.log('AppContext: Starting data import...');

      // Using dexie storage
      const result = await storage.importData(jsonData);

      if (result) {
        console.log('AppContext: Import successful, reloading data...');

        try {
          // Reload data with individual error handling
          // Set loading states for each data type
          const loadingPromises = Object.keys(loadingStates).map(key => {
            setSpecificLoadingState(key as keyof typeof loadingStates, true);
            return Promise.resolve();
          });
          await Promise.all(loadingPromises);

          // Load each data type separately with error handling
          try {
            console.log('Loading tasks...');
            const tasksData = await storage.getTasks();
            setTasks(tasksData);
            setSpecificLoadingState('tasks', false);
          } catch (taskError) {
            console.error('Error loading tasks after import:', taskError);
            setSpecificLoadingState('tasks', false);
          }

          try {
            console.log('Loading projects...');
            const projectsData = await storage.getProjects();
            setProjects(projectsData);
            setSpecificLoadingState('projects', false);
          } catch (projectError) {
            console.error('Error loading projects after import:', projectError);
            setSpecificLoadingState('projects', false);
          }

          try {
            console.log('Loading categories...');
            const categoriesData = await storage.getCategories();
            setCategories(categoriesData);
            setSpecificLoadingState('categories', false);
          } catch (categoryError) {
            console.error('Error loading categories after import:', categoryError);
            setSpecificLoadingState('categories', false);
          }

          try {
            console.log('Loading daily plans...');
            const dailyPlansData = await storage.getDailyPlans();
            setDailyPlans(dailyPlansData);
            setSpecificLoadingState('dailyPlans', false);
          } catch (planError) {
            console.error('Error loading daily plans after import:', planError);
            setSpecificLoadingState('dailyPlans', false);
          }

          try {
            console.log('Loading work schedule...');
            const workScheduleData = await storage.getWorkSchedule();
            setWorkSchedule(workScheduleData);
            setSpecificLoadingState('workSchedule', false);
          } catch (scheduleError) {
            console.error('Error loading work schedule after import:', scheduleError);
            setSpecificLoadingState('workSchedule', false);
          }

          try {
            console.log('Loading journal entries...');
            const journalEntriesData = await storage.getJournalEntries();
            setJournalEntries(journalEntriesData);
            setSpecificLoadingState('journalEntries', false);
          } catch (journalError) {
            console.error('Error loading journal entries after import:', journalError);
            setSpecificLoadingState('journalEntries', false);
          }

          console.log('AppContext: All data reloaded successfully');
          setIsDataInitialized(true);
        } catch (reloadError) {
          console.error('Error reloading data after import:', reloadError);
          // Even if reloading fails, the import was technically successful
        }
      } else {
        console.error('AppContext: Import returned false');
      }

      return result;
    } catch (error) {
      console.error('Error importing data:', error);
      setIsError(true);
      return false;
    } finally {
      setIsLoading(false);
      setSpecificLoadingState('importExport', false);
    }
  }, [loadingStates, setSpecificLoadingState]);

  const resetData = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      // Using dexie storage
      await storage.resetData();

      setTasks([]);
      setProjects([]);
      setCategories([]);
      setDailyPlans([]);
      setWorkSchedule(null);
      setJournalEntries([]);
      setIsDataInitialized(false);
    } catch (error) {
      console.error('Error resetting data:', error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const initializeSampleData = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);

      // Create sample data (locally first)
      createSampleData();

      // Then save it to the selected storage
      // Using dexie storage
      const [
        tasksData,
        projectsData,
        categoriesData
      ] = await Promise.all([
        localStorage.getTasks(),
        localStorage.getProjects(),
        localStorage.getCategories()
      ]);

      // Save the sample data to the storage
      await Promise.all([
        storage.saveTasks(tasksData),
        storage.saveProjects(projectsData),
        storage.saveCategories(categoriesData)
      ]);

      // Update local state
      setTasks(tasksData);
      setProjects(projectsData);
      setCategories(categoriesData);
      setIsDataInitialized(true);
    } catch (error) {
      console.error('Error initializing sample data:', error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Journal Entries
  const addJournalEntry = useCallback(async (entryData: Partial<JournalEntry>): Promise<JournalEntry> => {
    try {
      const timestamp = new Date().toISOString();
      const today = new Date();
      const { weekNumber, weekYear } = getISOWeekAndYear(today);

      const newEntry: JournalEntry = {
        id: generateId(),
        date: today.toISOString().split('T')[0], // Today's date by default
        content: '',
        weekNumber,
        weekYear,
        isCompleted: false,
        createdAt: timestamp,
        updatedAt: timestamp,
        ...entryData
      };

      const updatedEntries = [...journalEntries, newEntry];
      setJournalEntries(updatedEntries);

      // Using dexie storage
      await storage.saveJournalEntries(updatedEntries);
      return newEntry;
    } catch (error) {
      console.error('Error adding journal entry:', error);
      setIsError(true);
      throw error;
    }
  }, [journalEntries]);

  const updateJournalEntry = useCallback(async (updatedEntry: JournalEntry): Promise<void> => {
    try {
      const timestamp = new Date().toISOString();
      const entryWithTimestamp = {
        ...updatedEntry,
        updatedAt: timestamp
      };

      const updatedEntries = journalEntries.map(entry =>
        entry.id === updatedEntry.id ? entryWithTimestamp : entry
      );

      setJournalEntries(updatedEntries);

      // Using dexie storage
      await storage.saveJournalEntries(updatedEntries);
    } catch (error) {
      console.error('Error updating journal entry:', error);
      setIsError(true);
      throw error;
    }
  }, [journalEntries]);

  const deleteJournalEntry = useCallback(async (entryId: string): Promise<void> => {
    try {
      const updatedEntries = journalEntries.filter(entry => entry.id !== entryId);
      setJournalEntries(updatedEntries);

      // Using dexie storage
      await storage.saveJournalEntries(updatedEntries);
    } catch (error) {
      console.error('Error deleting journal entry:', error);
      setIsError(true);
      throw error;
    }
  }, [journalEntries]);

  const getJournalEntriesForDate = useCallback((date: string) => {
    return journalEntries.filter(entry => entry.date === date);
  }, [journalEntries]);

  const getJournalEntriesForWeek = useCallback((weekNumber: number, weekYear: number) => {
    return journalEntries.filter(entry =>
      entry.weekNumber === weekNumber && entry.weekYear === weekYear
    );
  }, [journalEntries]);

  const getLatestWeeklyReview = useCallback(() => {
    // Process all journal entries to ensure they have required fields

    // Backward compatibility check: Add required fields to old entries if needed
    const updatedEntries = journalEntries.map(entry => {
      // Make a copy we can modify
      const updatedEntry = {...entry};

      // Add weekNumber and weekYear if they're missing
      if (!entry.weekNumber || !entry.weekYear) {
        try {
          const entryDate = new Date(entry.date);
          const { weekNumber, weekYear } = getISOWeekAndYear(entryDate);
          updatedEntry.weekNumber = weekNumber;
          updatedEntry.weekYear = weekYear;
        } catch (e) {
          console.error("Error calculating week for entry:", entry, e);
        }
      }

      // Add isCompleted flag for old entries
      if (entry.isCompleted === undefined) {
        updatedEntry.isCompleted = true; // Assume old entries were completed
      }

      return updatedEntry;
    });

    // If we had to fix entries, save them back
    if (updatedEntries.some((e, i) => e !== journalEntries[i])) {
      // Save the fixed entries back to localStorage and state
      setJournalEntries(updatedEntries);
      localStorage.saveJournalEntries(updatedEntries);
    }

    // Group entries by week (now using fixed entries)
    const weekEntries = updatedEntries.reduce((acc, entry) => {
      // Skip entries without proper week information (shouldn't happen after our fixes)
      if (!entry.weekNumber || !entry.weekYear) {
        return acc;
      }

      const key = `${entry.weekYear}-${entry.weekNumber}`;
      if (!acc[key]) {
        acc[key] = [];
      }
      acc[key].push(entry);
      return acc;
    }, {} as Record<string, JournalEntry[]>);

    // Process the entries by week

    // Find the latest week that has entries
    const weeks = Object.keys(weekEntries).sort().reverse();
    if (weeks.length === 0) return null;

    const latestWeek = weeks[0];
    const [yearStr, weekStr] = latestWeek.split('-');

    const weekNumber = parseInt(weekStr, 10);
    const weekYear = parseInt(yearStr, 10);
    const entries = weekEntries[latestWeek];

    // Get unique section IDs
    const sectionIds = [
      'reflect', 'overdue', 'upcoming', 'projects', 'life-areas'
    ];

    // Check if all required sections are completed
    const isComplete = sectionIds.every(sectionId => {
      // A section is considered complete if there's an entry for it that either:
      // 1. Has isCompleted flag set to true, OR
      // 2. Has non-empty content (for backward compatibility with older entries)
      const hasSectionEntry = entries.some(entry =>
        entry.reviewSectionId === sectionId &&
        (entry.isCompleted || (entry.content && entry.content.trim().length > 0))
      );
      return hasSectionEntry;
    });

    return {
      weekNumber,
      weekYear,
      entries,
      isComplete
    };
  }, [journalEntries]);
  
  // Create a subtask directly linked to a parent task
  const addSubtask = useCallback(async (parentId: string, subtaskData: Partial<Task>): Promise<Task> => {
    try {
      // Make sure the parent exists
      const parentTask = tasks.find(t => t.id === parentId);
      if (!parentTask) {
        throw new Error(`Parent task with ID ${parentId} not found`);
      }

      // Create the subtask with parent reference
      const newSubtask = await addTask({
        ...subtaskData,
        parentTaskId: parentId,
        // Inherit project from parent if not specified
        projectId: subtaskData.projectId !== undefined ? subtaskData.projectId : parentTask.projectId
      });

      return newSubtask;
    } catch (error) {
      console.error('Error adding subtask:', error);
      setIsError(true);
      throw error;
    }
  }, [tasks, addTask]);

  // Simple task creation with smart text parsing
  const quickAddTask = useCallback(async (title: string, projectId: string | null = null): Promise<Task> => {
    try {
      let processedTitle = title.trim();
      let dueDate: string | null = null;
      let priority: 'low' | 'medium' | 'high' = 'medium';
      const categoryIds: string[] = [];

      // Extract date patterns
      if (processedTitle.includes('!today')) {
        const today = new Date();
        dueDate = today.toISOString().split('T')[0];
        processedTitle = processedTitle.replace('!today', '').trim();
      } else if (processedTitle.includes('!tomorrow')) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        dueDate = tomorrow.toISOString().split('T')[0];
        processedTitle = processedTitle.replace('!tomorrow', '').trim();
      } else if (processedTitle.match(/!(\d+)d/)) {
        const match = processedTitle.match(/!(\d+)d/);
        if (match && match[1]) {
          const days = parseInt(match[1], 10);
          const date = new Date();
          date.setDate(date.getDate() + days);
          dueDate = date.toISOString().split('T')[0];
          processedTitle = processedTitle.replace(/!(\d+)d/, '').trim();
        }
      }

      // Extract priority
      if (processedTitle.includes('!high')) {
        priority = 'high';
        processedTitle = processedTitle.replace('!high', '').trim();
      } else if (processedTitle.includes('!low')) {
        priority = 'low';
        processedTitle = processedTitle.replace('!low', '').trim();
      }

      // Create and return the task
      return await addTask({
        title: processedTitle,
        dueDate,
        priority,
        projectId,
        categoryIds,
        completed: false
      });
    } catch (error) {
      console.error('Error in quick add task:', error);
      setIsError(true);
      throw error;
    }
  }, [addTask]);

  // Database maintenance
  const performDatabaseMaintenance = useCallback(async (): Promise<void> => {
    try {
      setIsLoading(true);
      console.log('Starting database maintenance...');
      await storage.performDatabaseMaintenance();
      console.log('Database maintenance completed');

      // Reload tasks after maintenance to reflect any changes
      try {
        const tasksData = await storage.getTasks();
        setTasks(tasksData);
      } catch (error) {
        console.error('Error reloading tasks after maintenance:', error);
      }
    } catch (error) {
      console.error('Error performing database maintenance:', error);
      setIsError(true);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Storage Management Functions
  const getCurrentStorage = useCallback((): StorageType => {
    return currentStorageType;
  }, [currentStorageType]);

  // Check if Supabase is connected
  const checkCloudConnection = useCallback(async (): Promise<boolean> => {
    console.log('AppContext: ---------- CLOUD CONNECTION CHECK STARTED ----------');
    console.log('AppContext: checkCloudConnection called, currentStorageType:', currentStorageType);

    // Record start time for performance metrics
    const startTime = performance.now();

    try {
      // Only proceed with connection check if using Supabase
      if (currentStorageType === 'supabase') {
        console.log('AppContext: Current storage is Supabase, checking connection...');

        // Check if supabaseStorage module is available
        if (!supabaseStorage) {
          console.error('AppContext: ERROR - supabaseStorage module is not available');
          setIsCloudConnected(false);
          return false;
        }

        // Check if the checkSupabaseConnection function exists
        if (typeof supabaseStorage.checkSupabaseConnection !== 'function') {
          console.error('AppContext: ERROR - checkSupabaseConnection function is not available in supabaseStorage');
          setIsCloudConnected(false);
          return false;
        }

        console.log('AppContext: Calling supabaseStorage.checkSupabaseConnection()...');
        try {
          const isConnected = await supabaseStorage.checkSupabaseConnection();
          console.log('AppContext: Supabase connection check returned:', isConnected);

          // Update state based on result
          setIsCloudConnected(isConnected);

          if (isConnected) {
            console.log('AppContext: Supabase connection is ACTIVE');
          } else {
            console.error('AppContext: Supabase connection check FAILED');
          }

          return isConnected;
        } catch (connectionCheckError) {
          console.error('AppContext: EXCEPTION during supabaseStorage.checkSupabaseConnection call:', connectionCheckError);
          if (connectionCheckError instanceof Error) {
            console.error('AppContext: Error name:', connectionCheckError.name);
            console.error('AppContext: Error message:', connectionCheckError.message);
            console.error('AppContext: Error stack:', connectionCheckError.stack);
          }
          setIsCloudConnected(false);
          return false;
        }
      } else {
        // Not using Supabase, so there's no cloud connection to check
        console.log('AppContext: Current storage is not Supabase, no connection check needed');
        console.log('AppContext: Setting isCloudConnected to false');
        setIsCloudConnected(false);
        return false;
      }
    } catch (error) {
      console.error('AppContext: CRITICAL ERROR in checkCloudConnection:', error);
      if (error instanceof Error) {
        console.error('AppContext: Error name:', error.name);
        console.error('AppContext: Error message:', error.message);
        console.error('AppContext: Error stack:', error.stack);
      }
      setIsCloudConnected(false);
      return false;
    } finally {
      // Log performance metrics
      const endTime = performance.now();
      const elapsedTime = endTime - startTime;
      console.log(`AppContext: Cloud connection check completed in ${elapsedTime.toFixed(2)}ms`);
      console.log('AppContext: ---------- CLOUD CONNECTION CHECK COMPLETED ----------');
    }
  }, [currentStorageType]);

  // Effect to check cloud connection on mount and when storage type changes
  useEffect(() => {
    if (currentStorageType === 'supabase') {
      checkCloudConnection();
    } else {
      setIsCloudConnected(false);
    }
  }, [currentStorageType, checkCloudConnection]);

  // Switch between storage mechanisms
  const switchStorage = useCallback(async (newStorageType: StorageType): Promise<boolean> => {
    console.log('AppContext: ---------- STORAGE SWITCH STARTED ----------');
    console.log('AppContext: switchStorage called, from:', currentStorageType, 'to:', newStorageType);

    try {
      // Check if we're already using the requested storage type
      if (newStorageType === currentStorageType) {
        console.log('AppContext: Already using this storage type, no change needed');
        return true;
      }

      // Start loading state and record start time for performance logging
      setIsLoading(true);
      const startTime = performance.now();
      console.log(`AppContext: Switching storage from ${currentStorageType} to ${newStorageType}...`);
      console.log(`AppContext: Start time: ${new Date().toISOString()}`);

      // Save the current preference to localStorage
      try {
        console.log('AppContext: Saving storage preference to localStorage');
        window.localStorage.setItem('storagePreference', newStorageType);
        console.log('AppContext: Storage preference saved successfully');
      } catch (localStorageError) {
        console.error('AppContext: ERROR saving storage preference to localStorage:', localStorageError);
        if (localStorageError instanceof Error) {
          console.error('AppContext: Error name:', localStorageError.name);
          console.error('AppContext: Error message:', localStorageError.message);
        }
        // Continue anyway, as this is not critical
      }

      // Update the storage mechanism reference
      console.log('AppContext: Updating storage mechanism variable');
      storage = newStorageType === 'supabase' ? supabaseStorage : dexieStorage;
      console.log('AppContext: Storage mechanism updated to', newStorageType);

      // Special handling for Supabase
      if (newStorageType === 'supabase') {
        console.log('AppContext: ---------- SUPABASE SETUP PHASE ----------');

        // Check connection before proceeding
        console.log('AppContext: Checking Supabase connection...');
        try {
          const isConnected = await checkCloudConnection();
          console.log('AppContext: Supabase connection check result:', isConnected);

          if (!isConnected) {
            console.error('AppContext: ERROR - Failed to connect to Supabase');
            setIsError(true);
            return false;
          }
        } catch (connectionError) {
          console.error('AppContext: EXCEPTION during Supabase connection check:', connectionError);
          if (connectionError instanceof Error) {
            console.error('AppContext: Error name:', connectionError.name);
            console.error('AppContext: Error message:', connectionError.message);
            console.error('AppContext: Error stack:', connectionError.stack);
          }
          setIsError(true);
          return false;
        }

        // Initialize Supabase tables if needed
        try {
          console.log('AppContext: Initializing Supabase tables...');
          await supabaseStorage.initializeSupabase();
          console.log('AppContext: Supabase initialized successfully');
        } catch (initError) {
          console.error('AppContext: ERROR initializing Supabase:', initError);
          if (initError instanceof Error) {
            console.error('AppContext: Error name:', initError.name);
            console.error('AppContext: Error message:', initError.message);
            console.error('AppContext: Error stack:', initError.stack);
          }
          // We'll continue, as tables might already exist
          console.warn('AppContext: Continuing despite Supabase initialization error');
        }
      }

      // Update the current storage type state
      console.log('AppContext: Updating current storage type state');
      setCurrentStorageType(newStorageType);

      // Reload data from the new storage
      console.log('AppContext: ---------- DATA LOADING PHASE ----------');
      console.log('AppContext: Loading data from new storage...');

      // Use individual try/catch blocks for each data type to ensure maximum resilience
      let dataLoadSuccess = true;
      const dataResults: Record<string, boolean> = {};

      // Load tasks
      try {
        console.log('AppContext: Loading tasks...');
        const tasksData = await storage.getTasks();
        console.log(`AppContext: Successfully loaded ${tasksData.length} tasks`);
        setTasks(tasksData);
        dataResults.tasks = true;
      } catch (tasksError) {
        console.error('AppContext: ERROR loading tasks:', tasksError);
        if (tasksError instanceof Error) {
          console.error('AppContext: Error name:', tasksError.name);
          console.error('AppContext: Error message:', tasksError.message);
        }
        dataResults.tasks = false;
        dataLoadSuccess = false;
      }

      // Load projects
      try {
        console.log('AppContext: Loading projects...');
        const projectsData = await storage.getProjects();
        console.log(`AppContext: Successfully loaded ${projectsData.length} projects`);
        setProjects(projectsData);
        dataResults.projects = true;
      } catch (projectsError) {
        console.error('AppContext: ERROR loading projects:', projectsError);
        if (projectsError instanceof Error) {
          console.error('AppContext: Error name:', projectsError.name);
          console.error('AppContext: Error message:', projectsError.message);
        }
        dataResults.projects = false;
        dataLoadSuccess = false;
      }

      // Load categories
      try {
        console.log('AppContext: Loading categories...');
        const categoriesData = await storage.getCategories();
        console.log(`AppContext: Successfully loaded ${categoriesData.length} categories`);
        setCategories(categoriesData);
        dataResults.categories = true;
      } catch (categoriesError) {
        console.error('AppContext: ERROR loading categories:', categoriesError);
        if (categoriesError instanceof Error) {
          console.error('AppContext: Error name:', categoriesError.name);
          console.error('AppContext: Error message:', categoriesError.message);
        }
        dataResults.categories = false;
        dataLoadSuccess = false;
      }

      // Load daily plans
      try {
        console.log('AppContext: Loading daily plans...');
        const dailyPlansData = await storage.getDailyPlans();
        console.log(`AppContext: Successfully loaded ${dailyPlansData.length} daily plans`);
        setDailyPlans(dailyPlansData);
        dataResults.dailyPlans = true;
      } catch (dailyPlansError) {
        console.error('AppContext: ERROR loading daily plans:', dailyPlansError);
        if (dailyPlansError instanceof Error) {
          console.error('AppContext: Error name:', dailyPlansError.name);
          console.error('AppContext: Error message:', dailyPlansError.message);
        }
        dataResults.dailyPlans = false;
        dataLoadSuccess = false;
      }

      // Load work schedule
      try {
        console.log('AppContext: Loading work schedule...');
        const workScheduleData = await storage.getWorkSchedule();
        console.log(`AppContext: Work schedule: ${workScheduleData ? 'Found' : 'Not found'}`);
        setWorkSchedule(workScheduleData);
        dataResults.workSchedule = true;
      } catch (workScheduleError) {
        console.error('AppContext: ERROR loading work schedule:', workScheduleError);
        if (workScheduleError instanceof Error) {
          console.error('AppContext: Error name:', workScheduleError.name);
          console.error('AppContext: Error message:', workScheduleError.message);
        }
        dataResults.workSchedule = false;
        dataLoadSuccess = false;
      }

      // Load journal entries
      try {
        console.log('AppContext: Loading journal entries...');
        const journalEntriesData = await storage.getJournalEntries();
        console.log(`AppContext: Successfully loaded ${journalEntriesData.length} journal entries`);
        setJournalEntries(journalEntriesData);
        dataResults.journalEntries = true;
      } catch (journalEntriesError) {
        console.error('AppContext: ERROR loading journal entries:', journalEntriesError);
        if (journalEntriesError instanceof Error) {
          console.error('AppContext: Error name:', journalEntriesError.name);
          console.error('AppContext: Error message:', journalEntriesError.message);
        }
        dataResults.journalEntries = false;
        dataLoadSuccess = false;
      }

      // Log data loading results summary
      console.log('AppContext: Data loading results summary:');
      for (const [entity, success] of Object.entries(dataResults)) {
        console.log(`AppContext: - ${entity}: ${success ? 'SUCCESS' : 'FAILED'}`);
      }

      if (!dataLoadSuccess) {
        console.warn('AppContext: WARNING - Some data failed to load from the new storage');
        setIsError(true);
        // Continue anyway, as we've already switched the storage mechanism
      }

      // Calculate and log performance metrics
      const endTime = performance.now();
      const elapsedTime = endTime - startTime;
      console.log(`AppContext: Storage switch completed in ${elapsedTime.toFixed(2)}ms`);
      console.log(`AppContext: Successfully switched to ${newStorageType} storage`);

      return true;
    } catch (error) {
      console.error('AppContext: CRITICAL ERROR switching storage:', error);
      if (error instanceof Error) {
        console.error('AppContext: Error name:', error.name);
        console.error('AppContext: Error message:', error.message);
        console.error('AppContext: Error stack:', error.stack);
      }
      setIsError(true);
      return false;
    } finally {
      setIsLoading(false);
      console.log('AppContext: ---------- STORAGE SWITCH COMPLETED ----------');
    }
  }, [currentStorageType, checkCloudConnection]);

  // Sync local data to cloud
  const syncToCloud = useCallback(async (): Promise<boolean> => {
    console.log('AppContext: syncToCloud called, currentStorageType:', currentStorageType);
    if (currentStorageType !== 'supabase') {
      // First export data from Dexie
      try {
        setIsLoading(true);
        setSpecificLoadingState('importExport', true);

        console.log('AppContext: Syncing data to Supabase...');

        // Get data from Dexie
        console.log('AppContext: Exporting data from Dexie...');
        const dexieData = await dexieStorage.exportData();
        console.log('AppContext: Dexie data exported successfully');

        // Import to Supabase
        console.log('AppContext: Importing data to Supabase...');
        const result = await supabaseStorage.importData(dexieData);
        console.log('AppContext: Supabase import result:', result);

        if (result) {
          console.log('AppContext: Successfully synced data to Supabase');
          return true;
        } else {
          console.error('AppContext: Failed to sync data to Supabase');
          return false;
        }
      } catch (error) {
        console.error('AppContext: Error syncing to cloud:', error);
        if (error instanceof Error) {
          console.error('Error name:', error.name);
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
        }
        return false;
      } finally {
        setIsLoading(false);
        setSpecificLoadingState('importExport', false);
      }
    } else {
      console.log('AppContext: Already using Supabase, no need to sync');
      return true;
    }
  }, [currentStorageType, setSpecificLoadingState]);

  // Sync cloud data to local
  const syncFromCloud = useCallback(async (): Promise<boolean> => {
    console.log('AppContext: syncFromCloud called, currentStorageType:', currentStorageType);
    if (currentStorageType !== 'dexie') {
      // First export data from Supabase
      try {
        setIsLoading(true);
        setSpecificLoadingState('importExport', true);

        console.log('AppContext: Syncing data from Supabase...');

        // Get data from Supabase
        console.log('AppContext: Exporting data from Supabase...');
        const supabaseData = await supabaseStorage.exportData();
        console.log('AppContext: Supabase data exported successfully');

        // Import to Dexie
        console.log('AppContext: Importing data to Dexie...');
        const result = await dexieStorage.importData(supabaseData);
        console.log('AppContext: Dexie import result:', result);

        if (result) {
          console.log('AppContext: Successfully synced data from Supabase');

          // Reload data if we're using Dexie
          if (currentStorageType === 'dexie') {
            try {
              console.log('AppContext: Reloading data from Dexie after sync');
              const [
                tasksData,
                projectsData,
                categoriesData,
                dailyPlansData,
                workScheduleData,
                journalEntriesData
              ] = await Promise.all([
                dexieStorage.getTasks(),
                dexieStorage.getProjects(),
                dexieStorage.getCategories(),
                dexieStorage.getDailyPlans(),
                dexieStorage.getWorkSchedule(),
                dexieStorage.getJournalEntries()
              ]);

              setTasks(tasksData);
              setProjects(projectsData);
              setCategories(categoriesData);
              setDailyPlans(dailyPlansData);
              setWorkSchedule(workScheduleData);
              setJournalEntries(journalEntriesData);
              console.log('AppContext: Data reload complete');
            } catch (loadError) {
              console.error('AppContext: Error loading data after sync:', loadError);
              if (loadError instanceof Error) {
                console.error('Error name:', loadError.name);
                console.error('Error message:', loadError.message);
                console.error('Error stack:', loadError.stack);
              }
            }
          }

          return true;
        } else {
          console.error('AppContext: Failed to sync data from Supabase');
          return false;
        }
      } catch (error) {
        console.error('AppContext: Error syncing from cloud:', error);
        if (error instanceof Error) {
          console.error('Error name:', error.name);
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
        }
        return false;
      } finally {
        setIsLoading(false);
        setSpecificLoadingState('importExport', false);
      }
    } else {
      console.log('AppContext: Already using Dexie, no need to sync');
      return true;
    }
  }, [currentStorageType, setSpecificLoadingState]);

  const contextValue: AppContextType = {
    tasks,
    addTask,
    quickAddTask,
    addSubtask,
    updateTask,
    deleteTask,
    completeTask,
    archiveCompletedTasks,
    undoDelete,
    hasRecentlyDeleted,

    projects,
    addProject,
    updateProject,
    deleteProject,

    categories,
    addCategory,
    updateCategory,
    deleteCategory,

    dailyPlans,
    getDailyPlan,
    saveDailyPlan,
    exportTimeBlocksToTasks,

    workSchedule,
    workShifts,
    addWorkShift,
    updateWorkShift,
    deleteWorkShift,
    getShiftsForMonth,
    getShiftForDate,

    journalEntries,
    addJournalEntry,
    updateJournalEntry,
    deleteJournalEntry,
    getJournalEntriesForDate,
    getJournalEntriesForWeek,
    getLatestWeeklyReview,

    recommendTasks,

    exportData,
    importData,
    resetData,
    initializeSampleData,
    performDatabaseMaintenance,

    // Storage Management
    getCurrentStorage,
    switchStorage,
    syncToCloud,
    syncFromCloud,
    isCloudConnected,
    checkCloudConnection,

    isLoading,
    loadingStates,
    isDataInitialized,
    isError,
  };
  
  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

// Separate this function from the component to avoid problems with React Refresh
export const useAppContext = (): AppContextType => {
  const context = React.useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};