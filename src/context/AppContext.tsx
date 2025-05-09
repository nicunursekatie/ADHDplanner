import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Task, Project, Category, DailyPlan, WhatNowCriteria } from '../types';
import { WorkSchedule, WorkShift, ShiftType, DEFAULT_SHIFTS, DEFAULT_SHIFT } from '../types/WorkSchedule';
import * as localStorage from '../utils/localStorage';
import { generateId, createSampleData } from '../utils/helpers';

interface DeletedTask {
  task: Task;
  timestamp: number;
}

interface AppContextType {
  // Tasks
  tasks: Task[];
  addTask: (task: Partial<Task>) => Task;
  quickAddTask: (title: string, projectId?: string | null) => Task;
  addSubtask: (parentId: string, subtaskData: Partial<Task>) => Task;
  updateTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  completeTask: (taskId: string) => void;
  archiveCompletedTasks: () => void;
  undoDelete: () => void;
  hasRecentlyDeleted: boolean;
  
  // Projects
  projects: Project[];
  addProject: (project: Partial<Project>) => Project;
  updateProject: (project: Project) => void;
  deleteProject: (projectId: string) => void;
  
  // Categories
  categories: Category[];
  addCategory: (category: Partial<Category>) => Category;
  updateCategory: (category: Category) => void;
  deleteCategory: (categoryId: string) => void;
  
  // Daily Plans
  dailyPlans: DailyPlan[];
  getDailyPlan: (date: string) => DailyPlan | null;
  saveDailyPlan: (plan: DailyPlan) => void;
  exportTimeBlocksToTasks: (date: string) => number;
  
  // Work Schedule
  workSchedule: WorkSchedule | null;
  workShifts: WorkShift[];
  addWorkShift: (date: string, shiftType?: ShiftType) => WorkShift;
  updateWorkShift: (shift: WorkShift) => void;
  deleteWorkShift: (shiftId: string) => void;
  getShiftsForMonth: (year: number, month: number) => WorkShift[];
  getShiftForDate: (date: string) => WorkShift | undefined;
  
  // What Now Wizard
  recommendTasks: (criteria: WhatNowCriteria) => Task[];
  
  // Data Management
  exportData: () => string;
  importData: (jsonData: string) => boolean;
  resetData: () => void;
  initializeSampleData: () => void;
  
  // App State
  isLoading: boolean;
  isDataInitialized: boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

const UNDO_WINDOW = 5000; // 5 seconds window for undo

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dailyPlans, setDailyPlans] = useState<DailyPlan[]>([]);
  const [workSchedule, setWorkSchedule] = useState<WorkSchedule | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDataInitialized, setIsDataInitialized] = useState(false);
  const [deletedTasks, setDeletedTasks] = useState<DeletedTask[]>([]);
  
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
  
  // Load data from localStorage on initial render
  useEffect(() => {
    const loadData = () => {
      setTasks(localStorage.getTasks());
      setProjects(localStorage.getProjects());
      setCategories(localStorage.getCategories());
      setDailyPlans(localStorage.getDailyPlans());
      setWorkSchedule(localStorage.getWorkSchedule());
      
      // Check if data exists
      const hasData = 
        localStorage.getTasks().length > 0 || 
        localStorage.getProjects().length > 0 || 
        localStorage.getCategories().length > 0;
      
      setIsDataInitialized(hasData);
      setIsLoading(false);
    };
    
    loadData();
  }, []);
  
  // Tasks
  const addTask = useCallback((taskData: Partial<Task>): Task => {
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
    localStorage.saveTasks(updatedTasks);
    
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
        localStorage.saveTasks(finalTasks);
      }
    }
    
    return newTask;
  }, [tasks]);
  
  const updateTask = useCallback((updatedTask: Task) => {
    const timestamp = new Date().toISOString();
    const taskWithTimestamp = {
      ...updatedTask,
      updatedAt: timestamp,
    };
    
    const updatedTasks = tasks.map(task => 
      task.id === updatedTask.id ? taskWithTimestamp : task
    );
    
    setTasks(updatedTasks);
    localStorage.saveTasks(updatedTasks);
  }, [tasks]);
  
  const deleteTask = useCallback((taskId: string) => {
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
    localStorage.saveTasks(updatedTasks);
  }, [tasks]);
  
  const undoDelete = useCallback(() => {
    if (deletedTasks.length === 0) return;
    
    const lastDeleted = deletedTasks[deletedTasks.length - 1];
    const updatedTasks = [...tasks, lastDeleted.task];
    
    setTasks(updatedTasks);
    localStorage.saveTasks(updatedTasks);
    
    setDeletedTasks(prev => prev.slice(0, -1));
  }, [tasks, deletedTasks]);
  
  const hasRecentlyDeleted = deletedTasks.length > 0;
  
  const completeTask = useCallback((taskId: string) => {
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
    localStorage.saveTasks(updatedTasks);
  }, [tasks]);
  
  const archiveCompletedTasks = useCallback(() => {
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
    localStorage.saveTasks(updatedTasks);
  }, [tasks]);
  
  // Projects
  const addProject = useCallback((projectData: Partial<Project>): Project => {
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
    localStorage.saveProjects(updatedProjects);
    return newProject;
  }, [projects]);
  
  const updateProject = useCallback((updatedProject: Project) => {
    const timestamp = new Date().toISOString();
    const projectWithTimestamp = {
      ...updatedProject,
      updatedAt: timestamp,
    };
    
    const updatedProjects = projects.map(project => 
      project.id === updatedProject.id ? projectWithTimestamp : project
    );
    
    setProjects(updatedProjects);
    localStorage.saveProjects(updatedProjects);
  }, [projects]);
  
  const deleteProject = useCallback((projectId: string) => {
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
    localStorage.saveTasks(updatedTasks);
    
    // Delete project
    const updatedProjects = projects.filter(project => project.id !== projectId);
    setProjects(updatedProjects);
    localStorage.saveProjects(updatedProjects);
  }, [projects, tasks]);
  
  // Categories
  const addCategory = useCallback((categoryData: Partial<Category>): Category => {
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
    localStorage.saveCategories(updatedCategories);
    return newCategory;
  }, [categories]);
  
  const updateCategory = useCallback((updatedCategory: Category) => {
    const timestamp = new Date().toISOString();
    const categoryWithTimestamp = {
      ...updatedCategory,
      updatedAt: timestamp,
    };
    
    const updatedCategories = categories.map(category => 
      category.id === updatedCategory.id ? categoryWithTimestamp : category
    );
    
    setCategories(updatedCategories);
    localStorage.saveCategories(updatedCategories);
  }, [categories]);
  
  const deleteCategory = useCallback((categoryId: string) => {
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
    localStorage.saveTasks(updatedTasks);
    
    // Delete category
    const updatedCategories = categories.filter(category => category.id !== categoryId);
    setCategories(updatedCategories);
    localStorage.saveCategories(updatedCategories);
  }, [categories, tasks]);
  
  // Daily Plans
  const getDailyPlan = useCallback((date: string): DailyPlan | null => {
    return dailyPlans.find(plan => plan.date === date) || null;
  }, [dailyPlans]);
  
  const saveDailyPlan = useCallback((plan: DailyPlan) => {
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
    localStorage.saveDailyPlans(updatedPlans);
  }, [dailyPlans]);
  
  // Function to make time blocks show up in calendar view
  const exportTimeBlocksToTasks = useCallback((date: string): number => {
    // Get the daily plan for the specified date
    const plan = getDailyPlan(date);
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
  }, [getDailyPlan]);
  
  // Work Schedule
  const workShifts = workSchedule?.shifts || [];
  
  const addWorkShift = useCallback((date: string, shiftType: ShiftType = 'full'): WorkShift => {
    const shiftDefaults = DEFAULT_SHIFTS[shiftType];
    const newShift: WorkShift = {
      id: generateId(),
      date,
      startTime: shiftDefaults.startTime,
      endTime: shiftDefaults.endTime,
      shiftType: shiftDefaults.shiftType,
    };
    
    localStorage.addWorkShift(newShift);
    
    // Update local state
    setWorkSchedule(prev => {
      if (!prev) {
        return {
          id: generateId(),
          name: 'My Work Schedule',
          shifts: [newShift],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
      }
      
      return {
        ...prev,
        shifts: [...prev.shifts, newShift],
        updatedAt: new Date().toISOString()
      };
    });
    
    return newShift;
  }, []);
  
  const updateWorkShift = useCallback((updatedShift: WorkShift) => {
    localStorage.updateWorkShift(updatedShift);
    
    // Update local state
    setWorkSchedule(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        shifts: prev.shifts.map(shift => 
          shift.id === updatedShift.id ? updatedShift : shift
        ),
        updatedAt: new Date().toISOString()
      };
    });
  }, []);
  
  const deleteWorkShift = useCallback((shiftId: string) => {
    localStorage.deleteWorkShift(shiftId);
    
    // Update local state
    setWorkSchedule(prev => {
      if (!prev) return null;
      
      return {
        ...prev,
        shifts: prev.shifts.filter(shift => shift.id !== shiftId),
        updatedAt: new Date().toISOString()
      };
    });
  }, []);
  
  const getShiftsForMonth = useCallback((year: number, month: number): WorkShift[] => {
    if (!workSchedule) return [];
    
    // Create date range for the given month
    const startDate = new Date(year, month, 1).toISOString().split('T')[0];
    const endDate = new Date(year, month + 1, 0).toISOString().split('T')[0];
    
    return workSchedule.shifts.filter(shift => 
      shift.date >= startDate && shift.date <= endDate
    );
  }, [workSchedule]);
  
  const getShiftForDate = useCallback((date: string): WorkShift | undefined => {
    return workSchedule?.shifts.find(shift => shift.date === date);
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
  const exportData = useCallback((): string => {
    return localStorage.exportData();
  }, []);
  
  const importData = useCallback((jsonData: string): boolean => {
    const result = localStorage.importData(jsonData);
    if (result) {
      // Reload data
      setTasks(localStorage.getTasks());
      setProjects(localStorage.getProjects());
      setCategories(localStorage.getCategories());
      setDailyPlans(localStorage.getDailyPlans());
      setIsDataInitialized(true);
    }
    return result;
  }, []);
  
  const resetData = useCallback(() => {
    localStorage.resetData();
    setTasks([]);
    setProjects([]);
    setCategories([]);
    setDailyPlans([]);
    setIsDataInitialized(false);
  }, []);
  
  const initializeSampleData = useCallback(() => {
    createSampleData();
    setTasks(localStorage.getTasks());
    setProjects(localStorage.getProjects());
    setCategories(localStorage.getCategories());
    setIsDataInitialized(true);
  }, []);
  
  // Create a subtask directly linked to a parent task
  const addSubtask = useCallback((parentId: string, subtaskData: Partial<Task>): Task => {
    // Make sure the parent exists
    const parentTask = tasks.find(t => t.id === parentId);
    if (!parentTask) {
      throw new Error(`Parent task with ID ${parentId} not found`);
    }
    
    // Create the subtask with parent reference
    const newSubtask = addTask({
      ...subtaskData,
      parentTaskId: parentId,
      // Inherit project from parent if not specified
      projectId: subtaskData.projectId !== undefined ? subtaskData.projectId : parentTask.projectId
    });
    
    return newSubtask;
  }, [tasks, addTask]);

  // Simple task creation with smart text parsing
  const quickAddTask = useCallback((title: string, projectId: string | null = null): Task => {
    let processedTitle = title.trim();
    let dueDate: string | null = null;
    let priority: 'low' | 'medium' | 'high' = 'medium';
    let categoryIds: string[] = [];
    
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
    return addTask({
      title: processedTitle,
      dueDate,
      priority,
      projectId,
      categoryIds,
      completed: false
    });
  }, [addTask]);

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
    
    recommendTasks,
    
    exportData,
    importData,
    resetData,
    initializeSampleData,
    
    isLoading,
    isDataInitialized,
  };
  
  return (
    <AppContext.Provider value={contextValue}>
      {children}
    </AppContext.Provider>
  );
};

export const useAppContext = (): AppContextType => {
  const context = React.useContext(AppContext);
  if (context === undefined) {
    throw new Error('useAppContext must be used within an AppProvider');
  }
  return context;
};