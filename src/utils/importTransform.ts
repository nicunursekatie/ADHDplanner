import { Task, Project, Category } from '../types';
import { generateId } from './helpers';

interface LegacyTask {
  id: string;
  title: string;
  dueDate: string | null;
  status: 'pending' | 'completed';
  categories: string[];
  projectId: string | null;
  parentId?: string;
}

interface LegacyCategory {
  id: string;
  name: string;
  color: string;
}

interface LegacyProject {
  id: string;
  name: string;
  description: string;
}

interface LegacyData {
  tasks: LegacyTask[];
  categories: LegacyCategory[];
  projects: LegacyProject[];
  exportDate: string;
  version: string;
}

export const transformImportedData = (jsonData: string): {
  tasks: Task[];
  categories: Category[];
  projects: Project[];
} | null => {
  try {
    const data = JSON.parse(jsonData) as LegacyData;
    const timestamp = new Date().toISOString();

    // Transform categories
    const categories: Category[] = data.categories.map(cat => ({
      id: cat.id,
      name: cat.name,
      color: cat.color,
      createdAt: timestamp,
      updatedAt: timestamp,
    }));

    // Transform projects
    const projects: Project[] = data.projects.map(proj => ({
      id: proj.id,
      name: proj.name,
      description: proj.description,
      color: '#3B82F6', // Default blue color
      createdAt: timestamp,
      updatedAt: timestamp,
    }));

    // Transform tasks
    const tasks: Task[] = data.tasks.map(task => ({
      id: task.id,
      title: task.title,
      description: '', // No description in legacy data
      completed: task.status === 'completed',
      dueDate: task.dueDate,
      projectId: task.projectId,
      categoryIds: task.categories,
      parentTaskId: task.parentId || null,
      subtasks: [], // Will be populated below
      createdAt: timestamp,
      updatedAt: timestamp,
    }));

    // Set up parent-child relationships
    tasks.forEach(task => {
      if (task.parentTaskId) {
        const parentTask = tasks.find(t => t.id === task.parentTaskId);
        if (parentTask) {
          parentTask.subtasks.push(task.id);
        }
      }
    });

    return { tasks, categories, projects };
  } catch (error) {
    console.error('Error transforming imported data:', error);
    return null;
  }
};