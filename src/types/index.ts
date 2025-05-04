export interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  dueDate: string | null;
  projectId: string | null;
  categoryIds: string[];
  parentTaskId: string | null;
  subtasks: string[]; // IDs of subtasks
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
  taskId: string | null;
  title: string;
  description: string;
}

export interface WhatNowCriteria {
  availableTime: 'short' | 'medium' | 'long';
  energyLevel: 'low' | 'medium' | 'high';
  blockers: string[];
}

export type ViewMode = 'day' | 'week' | 'month';