import React, { createContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { Task, Project, Category, DailyPlan, WhatNowCriteria } from '../types';
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
  updateTask: (task: Task) => void;
  deleteTask: (taskId: string) => void;
  completeTask: (taskId: string) => void;
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
      if (task.categoryIds.includes(categoryId)) {
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
  
  const contextValue: AppContextType = {
    tasks,
    addTask,
    updateTask,
    deleteTask,
    completeTask,
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