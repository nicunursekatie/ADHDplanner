import { db } from './db';
import { generateId } from './helpers';

/**
 * Run a series of tests to verify that the Dexie database is working properly
 * @returns A report of test results
 */
export const testDexieDatabase = async (): Promise<{
  success: boolean;
  message: string;
  details: Array<{test: string; success: boolean; message: string}>;
}> => {
  const results: Array<{test: string; success: boolean; message: string}> = [];
  
  try {
    // Test 1: Can add and retrieve a task
    let success = true;
    try {
      const testId = `test-${generateId()}`;
      const testTask = {
        id: testId,
        title: 'Test Task',
        description: 'This is a test task',
        completed: false,
        archived: false,
        dueDate: null,
        projectId: null,
        categoryIds: [],
        parentTaskId: null,
        subtasks: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      // Add the task
      await db.tasks.add(testTask);
      
      // Retrieve the task
      const retrievedTask = await db.tasks.get(testId);
      
      // Verify task data
      if (!retrievedTask) {
        throw new Error('Task not found after adding');
      }
      
      if (retrievedTask.title !== 'Test Task') {
        throw new Error(`Task title mismatch: ${retrievedTask.title}`);
      }
      
      // Delete the test task
      await db.tasks.delete(testId);
      
      // Make sure it's gone
      const deletedTask = await db.tasks.get(testId);
      if (deletedTask) {
        throw new Error('Task still exists after deletion');
      }
      
      results.push({
        test: 'Task CRUD operations',
        success: true,
        message: 'Successfully added, retrieved, and deleted a task'
      });
    } catch (error: any) {
      results.push({
        test: 'Task CRUD operations',
        success: false,
        message: `Error: ${error.message || 'Unknown error'}`
      });
      success = false;
    }
    
    // Test 2: Database indexes
    try {
      // Add some test tasks
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0];
      
      const testTasks = [
        {
          id: `test-${generateId()}`,
          title: 'High Priority Task',
          description: 'This is a high priority task',
          completed: false,
          archived: false,
          dueDate: today,
          priority: 'high',
          projectId: 'test-project',
          categoryIds: ['test-category'],
          parentTaskId: null,
          subtasks: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        },
        {
          id: `test-${generateId()}`,
          title: 'Completed Task',
          description: 'This is a completed task',
          completed: true,
          archived: false,
          dueDate: tomorrow,
          priority: 'medium',
          projectId: 'test-project',
          categoryIds: [],
          parentTaskId: null,
          subtasks: [],
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
      ];
      
      // Add the tasks
      await db.tasks.bulkAdd(testTasks);
      
      // Test querying by index
      const incompleteTasks = await db.tasks.where('completed').equals(false).toArray();
      const todayTasks = await db.tasks.where('dueDate').equals(today).toArray();
      const projectTasks = await db.tasks.where('projectId').equals('test-project').toArray();
      
      // Clean up
      await db.tasks.bulkDelete(testTasks.map(t => t.id));
      
      // Verify results
      if (incompleteTasks.length < 1) {
        throw new Error('Failed to retrieve incomplete tasks by index');
      }
      
      if (todayTasks.length < 1) {
        throw new Error('Failed to retrieve tasks by due date index');
      }
      
      if (projectTasks.length < 2) {
        throw new Error('Failed to retrieve tasks by project ID index');
      }
      
      results.push({
        test: 'Database indexes',
        success: true,
        message: 'Successfully queried tasks using indexes'
      });
    } catch (error: any) {
      results.push({
        test: 'Database indexes',
        success: false,
        message: `Error: ${error.message || 'Unknown error'}`
      });
      success = false;
    }
    
    // Overall result
    return {
      success: results.every(r => r.success),
      message: results.every(r => r.success) 
        ? 'All Dexie database tests passed' 
        : 'Some Dexie database tests failed',
      details: results
    };
  } catch (error: any) {
    return {
      success: false,
      message: `Failed to run Dexie database tests: ${error.message || 'Unknown error'}`,
      details: [{
        test: 'Overall test execution',
        success: false,
        message: error.message || 'Unknown error'
      }]
    };
  }
};