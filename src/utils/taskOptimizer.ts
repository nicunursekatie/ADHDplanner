/**
 * Task Optimizer utility
 * 
 * This utility provides optimization functions for working with task lists
 * to improve performance when filtering and rendering large task lists.
 */

import { Task } from '../types';
import { formatDate } from './helpers';

/**
 * Creates optimized task lists filtered by date categories
 * Uses efficient single-pass filtering for better performance
 */
export function createOptimizedTaskLists(tasks: Task[], showCompleted: boolean = false, showArchived: boolean = false) {
  // Create date strings for comparison
  const today = formatDate(new Date());
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowDate = formatDate(tomorrow);
  
  // Create the collections for each category
  const overdue: Task[] = [];
  const todayTasks: Task[] = [];
  const tomorrowTasks: Task[] = [];
  const thisWeekTasks: Task[] = [];
  const otherTasks: Task[] = [];
  
  // Get the end of the current week (Sunday)
  const endOfWeek = new Date();
  endOfWeek.setDate(endOfWeek.getDate() + (7 - endOfWeek.getDay()));
  const endOfWeekDate = formatDate(endOfWeek);
  
  // Single-pass categorization for better performance
  tasks.forEach(task => {
    // Skip tasks that don't meet basic filtering criteria
    if (task.completed && !showCompleted) return;
    if (task.archived && !showArchived) return;
    
    // Categorize each task
    if (!task.dueDate) {
      otherTasks.push(task);
    } 
    else if (task.dueDate < today) {
      overdue.push(task);
    }
    else if (task.dueDate === today) {
      todayTasks.push(task);
    }
    else if (task.dueDate === tomorrowDate) {
      tomorrowTasks.push(task);
    }
    else if (task.dueDate <= endOfWeekDate) {
      thisWeekTasks.push(task);
    } 
    else {
      otherTasks.push(task);
    }
  });
  
  // Create a combined view that preserves the categorization order
  const allTasks = new Array(
    overdue.length + 
    todayTasks.length + 
    tomorrowTasks.length + 
    thisWeekTasks.length + 
    otherTasks.length
  );
  
  let index = 0;
  for (const task of overdue) allTasks[index++] = task;
  for (const task of todayTasks) allTasks[index++] = task;
  for (const task of tomorrowTasks) allTasks[index++] = task;
  for (const task of thisWeekTasks) allTasks[index++] = task;
  for (const task of otherTasks) allTasks[index++] = task;
  
  return {
    overdue,
    today: todayTasks,
    tomorrow: tomorrowTasks,
    thisWeek: thisWeekTasks,
    other: otherTasks,
    all: allTasks
  };
}

/**
 * Efficiently filter parent tasks (no subtasks)
 * Uses a Set for O(1) lookup instead of array filtering for each task
 */
export function getParentTasks(tasks: Task[]): Task[] {
  // Create a Set of parent task IDs for quick lookup
  const parentTaskIds = new Set();
  
  // First pass: collect all parent task IDs
  for (const task of tasks) {
    if (!task.parentTaskId) {
      parentTaskIds.add(task.id);
    }
  }
  
  // Second pass: filter tasks that are parents
  return tasks.filter(task => parentTaskIds.has(task.id));
}

/**
 * Creates a map of tasks to their category to avoid expensive lookups
 */
export function createTaskCategoryMap(taskLists: {
  overdue: Task[];
  today: Task[];
  tomorrow: Task[];
  thisWeek: Task[];
  other: Task[];
}): Map<string, string> {
  const taskCategories = new Map<string, string>();
  
  taskLists.overdue.forEach(task => taskCategories.set(task.id, 'overdue'));
  taskLists.today.forEach(task => taskCategories.set(task.id, 'today'));
  taskLists.tomorrow.forEach(task => taskCategories.set(task.id, 'tomorrow'));
  taskLists.thisWeek.forEach(task => taskCategories.set(task.id, 'thisWeek'));
  taskLists.other.forEach(task => taskCategories.set(task.id, 'other'));
  
  return taskCategories;
}