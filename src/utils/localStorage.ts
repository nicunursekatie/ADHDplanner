import { Task, Project, Category, DailyPlan } from '../types';
import { transformImportedData } from './importTransform';

// Local storage keys
const TASKS_KEY = 'taskManager_tasks';
const PROJECTS_KEY = 'taskManager_projects';
const CATEGORIES_KEY = 'taskManager_categories';
const DAILY_PLANS_KEY = 'taskManager_dailyPlans';

// Tasks
export const getTasks = (): Task[] => {
  const tasksJSON = localStorage.getItem(TASKS_KEY);
  return tasksJSON ? JSON.parse(tasksJSON) : [];
};

export const saveTasks = (tasks: Task[]): void => {
  localStorage.setItem(TASKS_KEY, JSON.stringify(tasks));
};

export const addTask = (task: Task): void => {
  const tasks = getTasks();
  tasks.push(task);
  saveTasks(tasks);
};

export const updateTask = (updatedTask: Task): void => {
  const tasks = getTasks();
  const index = tasks.findIndex((task) => task.id === updatedTask.id);
  if (index !== -1) {
    tasks[index] = updatedTask;
    saveTasks(tasks);
  }
};

export const deleteTask = (taskId: string): void => {
  const tasks = getTasks();
  const updatedTasks = tasks.filter((task) => task.id !== taskId);
  saveTasks(updatedTasks);
};

// Projects
export const getProjects = (): Project[] => {
  const projectsJSON = localStorage.getItem(PROJECTS_KEY);
  return projectsJSON ? JSON.parse(projectsJSON) : [];
};

export const saveProjects = (projects: Project[]): void => {
  localStorage.setItem(PROJECTS_KEY, JSON.stringify(projects));
};

export const addProject = (project: Project): void => {
  const projects = getProjects();
  projects.push(project);
  saveProjects(projects);
};

export const updateProject = (updatedProject: Project): void => {
  const projects = getProjects();
  const index = projects.findIndex((project) => project.id === updatedProject.id);
  if (index !== -1) {
    projects[index] = updatedProject;
    saveProjects(projects);
  }
};

export const deleteProject = (projectId: string): void => {
  const projects = getProjects();
  const updatedProjects = projects.filter((project) => project.id !== projectId);
  saveProjects(updatedProjects);
};

// Categories
export const getCategories = (): Category[] => {
  const categoriesJSON = localStorage.getItem(CATEGORIES_KEY);
  return categoriesJSON ? JSON.parse(categoriesJSON) : [];
};

export const saveCategories = (categories: Category[]): void => {
  localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
};

export const addCategory = (category: Category): void => {
  const categories = getCategories();
  categories.push(category);
  saveCategories(categories);
};

export const updateCategory = (updatedCategory: Category): void => {
  const categories = getCategories();
  const index = categories.findIndex((category) => category.id === updatedCategory.id);
  if (index !== -1) {
    categories[index] = updatedCategory;
    saveCategories(categories);
  }
};

export const deleteCategory = (categoryId: string): void => {
  const categories = getCategories();
  const updatedCategories = categories.filter((category) => category.id !== categoryId);
  saveCategories(updatedCategories);
};

// Daily Plans
export const getDailyPlans = (): DailyPlan[] => {
  const plansJSON = localStorage.getItem(DAILY_PLANS_KEY);
  return plansJSON ? JSON.parse(plansJSON) : [];
};

export const saveDailyPlans = (plans: DailyPlan[]): void => {
  localStorage.setItem(DAILY_PLANS_KEY, JSON.stringify(plans));
};

export const getDailyPlan = (date: string): DailyPlan | null => {
  const plans = getDailyPlans();
  return plans.find((plan) => plan.date === date) || null;
};

export const saveDailyPlan = (plan: DailyPlan): void => {
  const plans = getDailyPlans();
  const index = plans.findIndex((p) => p.date === plan.date);
  
  if (index !== -1) {
    plans[index] = plan;
  } else {
    plans.push(plan);
  }
  
  saveDailyPlans(plans);
};

// Data Import/Export
export const exportData = (): string => {
  const data = {
    tasks: getTasks(),
    projects: getProjects(),
    categories: getCategories(),
    dailyPlans: getDailyPlans(),
  };
  
  return JSON.stringify(data);
};

export const importData = (jsonData: string): boolean => {
  try {
    // Try to transform the imported data first
    const transformedData = transformImportedData(jsonData);
    
    if (transformedData) {
      // Save transformed data
      saveTasks(transformedData.tasks);
      saveProjects(transformedData.projects);
      saveCategories(transformedData.categories);
      return true;
    }
    
    // If transformation fails, try direct import
    const data = JSON.parse(jsonData);
    if (data.tasks) saveTasks(data.tasks);
    if (data.projects) saveProjects(data.projects);
    if (data.categories) saveCategories(data.categories);
    if (data.dailyPlans) saveDailyPlans(data.dailyPlans);
    
    return true;
  } catch (error) {
    console.error('Failed to import data:', error);
    return false;
  }
};

export const resetData = (): void => {
  localStorage.removeItem(TASKS_KEY);
  localStorage.removeItem(PROJECTS_KEY);
  localStorage.removeItem(CATEGORIES_KEY);
  localStorage.removeItem(DAILY_PLANS_KEY);
};