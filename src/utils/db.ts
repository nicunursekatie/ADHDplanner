import Dexie from 'dexie';
import { Task, Project, Category, DailyPlan } from '../types'; // JOURNAL FEATURE DISABLED: Removed JournalEntry
import { WorkSchedule } from '../types/WorkSchedule';

/**
 * ADHDPlannerDB - Dexie database for the ADHD Planner application
 * 
 * Uses IndexedDB under the hood for robust offline-capable storage
 */
export class ADHDPlannerDB extends Dexie {
  // Define tables
  tasks!: Dexie.Table<Task, string>;
  projects!: Dexie.Table<Project, string>;
  categories!: Dexie.Table<Category, string>;
  dailyPlans!: Dexie.Table<DailyPlan, string>;
  workSchedules!: Dexie.Table<WorkSchedule, string>;
  // JOURNAL FEATURE DISABLED
  // journalEntries!: Dexie.Table<JournalEntry, string>;

  constructor() {
    super('ADHDPlannerDB');
    
    // Define database schema with indexes
    this.version(1).stores({
      tasks: 'id, completed, archived, dueDate, projectId, parentTaskId, *categoryIds, createdAt, updatedAt',
      projects: 'id, createdAt, updatedAt',
      categories: 'id, createdAt, updatedAt',
      dailyPlans: 'id, date',
      workSchedules: 'id, createdAt, updatedAt',
      // JOURNAL FEATURE DISABLED: journalEntries: 'id, date, weekNumber, weekYear, createdAt, updatedAt'
    });

    // Note: We're using interfaces, not classes, so we don't use mapToClass
  }

  /**
   * Get all incomplete tasks
   */
  async getIncompleteTasks(): Promise<Task[]> {
    return this.tasks.where('completed').equals(false).toArray();
  }

  /**
   * Get all tasks due today
   */
  async getTasksDueToday(): Promise<Task[]> {
    const today = new Date().toISOString().split('T')[0];
    return this.tasks
      .where('dueDate')
      .equals(today)
      .and(task => !task.completed)
      .toArray();
  }

  /**
   * Get tasks for a specific project
   */
  async getTasksByProject(projectId: string): Promise<Task[]> {
    return this.tasks.where('projectId').equals(projectId).toArray();
  }

  /**
   * Get subtasks for a given parent task
   */
  async getSubtasks(parentTaskId: string): Promise<Task[]> {
    return this.tasks.where('parentTaskId').equals(parentTaskId).toArray();
  }

  // JOURNAL FEATURE DISABLED
  /**
   * Get journal entries for a specific week
   */
  /*
  async getJournalEntriesForWeek(weekNumber: number, weekYear: number): Promise<JournalEntry[]> {
    return this.journalEntries
      .where('weekNumber').equals(weekNumber)
      .and(entry => entry.weekYear === weekYear)
      .toArray();
  }
  */

  /**
   * Get daily plan for a specific date
   */
  async getDailyPlanForDate(date: string): Promise<DailyPlan | undefined> {
    return this.dailyPlans.where('date').equals(date).first();
  }

  /**
   * Compact the database to reclaim space and optimize performance
   * This can help prevent memory issues over time
   */
  async compact(): Promise<void> {
    console.log('Compacting database to optimize performance...');
    try {
      // Ensure we're in a good state first
      await this.close();
      // Reopen and compact
      await this.open();
      // Dexie 4.0+ supports this directly
      return super.compact();
    } catch (error) {
      console.error('Error compacting database:', error);
      // Make sure db is reopened even if compact fails
      try {
        await this.open();
      } catch (reopenError) {
        console.error('Error reopening database after failed compact:', reopenError);
      }
      throw error;
    }
  }
}

// Create and export a singleton instance
export const db = new ADHDPlannerDB();