export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  archived: boolean;
  dueDate: string | null;
  projectId: string | null;
  categoryIds: string[];
  parentTaskId: string | null;
  subtasks: string[]; // IDs of subtasks
  priority?: 'low' | 'medium' | 'high';
  energyLevel?: 'low' | 'medium' | 'high';
  size?: 'small' | 'medium' | 'large';
  estimatedMinutes?: number;
  phase?: string; // Project phase this task belongs to
  tags?: string[]; // Tags associated with the task, including phase name
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: string;
  name: string;
  color: string;
  createdAt: string;
  updatedAt: string;
}

export interface DailyPlan {
  id: string;
  date: string;
  timeBlocks: TimeBlock[];
}

export interface TimeBlock {
  id: string;
  startTime: string;
  endTime: string;
  taskId: string | null; // Kept for backward compatibility
  taskIds: string[]; // New field to support multiple tasks
  title: string;
  description: string;
}

export interface WhatNowCriteria {
  availableTime: 'short' | 'medium' | 'long';
  energyLevel: 'low' | 'medium' | 'high';
  blockers: string[];
}

export type ViewMode = 'day' | 'week' | 'month';

// Project breakdown structures
export interface ProjectPhase {
  id: string;
  title: string;
  description?: string;
  expanded: boolean;
  tasks: PhaseTask[];
}

export interface PhaseTask {
  id: string;
  title: string;
  description?: string;
}

// Re-export WorkSchedule types
export * from './WorkSchedule';