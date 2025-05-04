import { Task, Project, Category, WhatNowCriteria } from '../types';
import { v4 as uuidv4 } from 'uuid';

// Generate a unique ID
export const generateId = (): string => {
  return uuidv4();
};

// Format date to YYYY-MM-DD
export const formatDate = (date: Date): string => {
  return date.toISOString().split('T')[0];
};

// Format date for display (e.g., "Mon, Jan 15")
export const formatDateForDisplay = (dateString: string): string => {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
};

// Format time for display (e.g., "2:30 PM")
export const formatTimeForDisplay = (timeString: string): string => {
  const [hours, minutes] = timeString.split(':');
  const date = new Date();
  date.setHours(parseInt(hours, 10));
  date.setMinutes(parseInt(minutes, 10));
  
  return date.toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  });
};

// Get tasks due today
export const getTasksDueToday = (tasks: Task[]): Task[] => {
  const today = formatDate(new Date());
  return tasks.filter((task) => task.dueDate === today && !task.completed);
};

// Get tasks due this week
export const getTasksDueThisWeek = (tasks: Task[]): Task[] => {
  const today = new Date();
  const endOfWeek = new Date();
  endOfWeek.setDate(today.getDate() + (6 - today.getDay()));
  
  const todayStr = formatDate(today);
  const endOfWeekStr = formatDate(endOfWeek);
  
  return tasks.filter(
    (task) => 
      task.dueDate && 
      task.dueDate >= todayStr && 
      task.dueDate <= endOfWeekStr && 
      !task.completed
  );
};

// Get overdue tasks
export const getOverdueTasks = (tasks: Task[]): Task[] => {
  const today = formatDate(new Date());
  return tasks.filter(
    (task) => task.dueDate && task.dueDate < today && !task.completed
  );
};

// Get tasks for a specific project
export const getTasksByProject = (tasks: Task[], projectId: string): Task[] => {
  return tasks.filter((task) => task.projectId === projectId);
};

// Get tasks for a specific category
export const getTasksByCategory = (tasks: Task[], categoryId: string): Task[] => {
  return tasks.filter((task) => task.categoryIds.includes(categoryId));
};

// Get subtasks for a task
export const getSubtasks = (tasks: Task[], parentTaskId: string): Task[] => {
  return tasks.filter((task) => task.parentTaskId === parentTaskId);
};

// Convert hex color to rgba with opacity
export const hexToRgba = (hex: string, opacity: number): string => {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
};

// Get color for a category
export const getCategoryColor = (
  categories: Category[],
  categoryId: string
): string => {
  const category = categories.find((cat) => cat.id === categoryId);
  return category ? category.color : '#9CA3AF'; // Default gray color
};

// Get color for a project
export const getProjectColor = (
  projects: Project[],
  projectId: string | null
): string => {
  const project = projects.find((proj) => proj.id === projectId);
  return project ? project.color : '#9CA3AF'; // Default gray color
};

// Recommend tasks based on "What Now?" criteria
export const recommendTasks = (
  tasks: Task[],
  criteria: WhatNowCriteria
): Task[] => {
  // Filter to incomplete tasks
  let filteredTasks = tasks.filter((task) => !task.completed);
  
  // Filter by available time
  if (criteria.availableTime === 'short') {
    // Prioritize tasks without subtasks, assuming they're quicker
    filteredTasks = filteredTasks.filter((task) => task.subtasks.length === 0);
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
};

// Create sample data for new users
export const createSampleData = (): void => {
  const now = new Date().toISOString();
  const today = formatDate(new Date());
  const tomorrow = formatDate(new Date(Date.now() + 86400000));
  const nextWeek = formatDate(new Date(Date.now() + 7 * 86400000));
  
  // Sample categories
  const categories: Category[] = [
    {
      id: generateId(),
      name: 'Work',
      color: '#3B82F6', // Blue
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      name: 'Personal',
      color: '#10B981', // Green
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      name: 'Urgent',
      color: '#EF4444', // Red
      createdAt: now,
      updatedAt: now,
    },
  ];
  
  // Sample projects
  const projects: Project[] = [
    {
      id: generateId(),
      name: 'Website Redesign',
      description: 'Redesign the company website',
      color: '#8B5CF6', // Purple
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      name: 'Home Organization',
      description: 'Organize and declutter the house',
      color: '#F59E0B', // Amber
      createdAt: now,
      updatedAt: now,
    },
  ];
  
  // Sample tasks
  const parentTask1Id = generateId();
  const parentTask2Id = generateId();
  
  const tasks: Task[] = [
    {
      id: parentTask1Id,
      title: 'Design new homepage',
      description: 'Create wireframes for the new homepage',
      completed: false,
      dueDate: tomorrow,
      projectId: projects[0].id,
      categoryIds: [categories[0].id],
      parentTaskId: null,
      subtasks: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      title: 'Create color palette',
      description: 'Select colors for the new website design',
      completed: false,
      dueDate: today,
      projectId: projects[0].id,
      categoryIds: [categories[0].id],
      parentTaskId: parentTask1Id,
      subtasks: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: parentTask2Id,
      title: 'Organize kitchen',
      description: 'Clean and organize kitchen cabinets',
      completed: false,
      dueDate: nextWeek,
      projectId: projects[1].id,
      categoryIds: [categories[1].id],
      parentTaskId: null,
      subtasks: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      title: 'Buy storage containers',
      description: 'Purchase containers for pantry organization',
      completed: false,
      dueDate: tomorrow,
      projectId: projects[1].id,
      categoryIds: [categories[1].id, categories[2].id],
      parentTaskId: parentTask2Id,
      subtasks: [],
      createdAt: now,
      updatedAt: now,
    },
    {
      id: generateId(),
      title: 'Review quarterly report',
      description: 'Review and approve the quarterly financial report',
      completed: false,
      dueDate: today,
      projectId: null,
      categoryIds: [categories[0].id, categories[2].id],
      parentTaskId: null,
      subtasks: [],
      createdAt: now,
      updatedAt: now,
    },
  ];
  
  // Update parent tasks with subtask IDs
  const updatedTasks = tasks.map(task => {
    if (task.id === parentTask1Id) {
      task.subtasks = [tasks[1].id];
    } else if (task.id === parentTask2Id) {
      task.subtasks = [tasks[3].id];
    }
    return task;
  });
  
  // Save sample data to localStorage
  localStorage.setItem('taskManager_categories', JSON.stringify(categories));
  localStorage.setItem('taskManager_projects', JSON.stringify(projects));
  localStorage.setItem('taskManager_tasks', JSON.stringify(updatedTasks));
};