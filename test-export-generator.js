// Script to generate test export data for testing import functionality
import { writeFileSync } from 'fs';

// Generate a random ID
function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Generate a random date within the last year
function randomDate() {
  const now = new Date();
  const pastDate = new Date(now.getTime() - Math.random() * 365 * 24 * 60 * 60 * 1000);
  return pastDate.toISOString().split('T')[0];
}

// Generate a random task
function generateTask(projectIds, categoryIds, depth = 0, maxSubtasks = 3) {
  const id = generateId();
  const timestamp = new Date().toISOString();
  
  // Base task
  const task = {
    id,
    title: `Test Task ${id.substring(0, 6)}`,
    description: `This is a test task description for ${id}`,
    completed: Math.random() > 0.7,
    archived: Math.random() > 0.9,
    dueDate: Math.random() > 0.5 ? randomDate() : null,
    projectId: projectIds.length > 0 && Math.random() > 0.3 ? 
      projectIds[Math.floor(Math.random() * projectIds.length)] : null,
    categoryIds: [],
    parentTaskId: null,
    subtasks: [],
    createdAt: timestamp,
    updatedAt: timestamp
  };
  
  // Add random categories
  if (categoryIds.length > 0 && Math.random() > 0.3) {
    const numCategories = Math.floor(Math.random() * 3);
    for (let i = 0; i < numCategories; i++) {
      const categoryId = categoryIds[Math.floor(Math.random() * categoryIds.length)];
      if (!task.categoryIds.includes(categoryId)) {
        task.categoryIds.push(categoryId);
      }
    }
  }
  
  return task;
}

// Generate categories
function generateCategories(count) {
  const categories = [];
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  
  for (let i = 0; i < count; i++) {
    const id = generateId();
    const timestamp = new Date().toISOString();
    
    categories.push({
      id,
      name: `Category ${i + 1}`,
      color: colors[Math.floor(Math.random() * colors.length)],
      createdAt: timestamp,
      updatedAt: timestamp
    });
  }
  
  return categories;
}

// Generate projects
function generateProjects(count) {
  const projects = [];
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  
  for (let i = 0; i < count; i++) {
    const id = generateId();
    const timestamp = new Date().toISOString();
    
    projects.push({
      id,
      name: `Project ${i + 1}`,
      description: `This is a description for Project ${i + 1}`,
      color: colors[Math.floor(Math.random() * colors.length)],
      createdAt: timestamp,
      updatedAt: timestamp
    });
  }
  
  return projects;
}

// Generate tasks with parent-child relationships
function generateTasks(count, projectIds, categoryIds) {
  let allTasks = [];
  
  // First, create parent tasks
  for (let i = 0; i < count; i++) {
    allTasks.push(generateTask(projectIds, categoryIds));
  }
  
  // For simplicity in testing, we'll just pick random parent-child relationships
  // rather than making a complex hierarchy
  const childCount = Math.floor(count * 0.3); // 30% of tasks will be children
  
  for (let i = 0; i < childCount; i++) {
    const parentIndex = Math.floor(Math.random() * count);
    const parent = allTasks[parentIndex];
    
    const childTask = generateTask(projectIds, categoryIds);
    childTask.parentTaskId = parent.id;
    
    parent.subtasks.push(childTask.id);
    allTasks.push(childTask);
  }
  
  return allTasks;
}

// Generate daily plans with time blocks
function generateDailyPlans(count, taskIds) {
  const plans = [];
  
  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    const timeBlocks = [];
    const blockCount = Math.floor(Math.random() * 6) + 2; // 2-7 blocks per day
    
    for (let j = 0; j < blockCount; j++) {
      const startHour = 8 + Math.floor(j * (8 / blockCount));
      const endHour = startHour + Math.ceil(8 / blockCount);
      
      const block = {
        id: generateId(),
        title: `Block ${j + 1}`,
        startTime: `${startHour.toString().padStart(2, '0')}:00`,
        endTime: `${endHour.toString().padStart(2, '0')}:00`,
        color: '#3B82F6',
        taskIds: []
      };
      
      // Assign some tasks to the block
      if (taskIds.length > 0 && Math.random() > 0.3) {
        const taskCount = Math.floor(Math.random() * 3) + 1;
        for (let k = 0; k < taskCount; k++) {
          const taskId = taskIds[Math.floor(Math.random() * taskIds.length)];
          if (!block.taskIds.includes(taskId)) {
            block.taskIds.push(taskId);
          }
        }
      }
      
      timeBlocks.push(block);
    }
    
    plans.push({
      id: dateStr,
      date: dateStr,
      timeBlocks
    });
  }
  
  return plans;
}

// Generate a work schedule
function generateWorkSchedule() {
  const id = generateId();
  const timestamp = new Date().toISOString();
  
  const shifts = [];
  const today = new Date();
  
  // Generate shifts for the last 30 days
  for (let i = 0; i < 30; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // Not every day has a shift
    if (Math.random() > 0.3) {
      shifts.push({
        id: generateId(),
        date: dateStr,
        startTime: '09:00',
        endTime: '17:00',
        shiftType: 'full'
      });
    }
  }
  
  return {
    id,
    name: 'My Work Schedule',
    shifts,
    createdAt: timestamp,
    updatedAt: timestamp
  };
}

// Generate journal entries
function generateJournalEntries(count) {
  const entries = [];
  
  for (let i = 0; i < count; i++) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dateStr = date.toISOString().split('T')[0];
    
    // ISO week and year (simplified calculation)
    const weekNumber = Math.floor(1 + (date.getDate() - 1) / 7);
    const weekYear = date.getFullYear();
    
    entries.push({
      id: generateId(),
      date: dateStr,
      content: `Journal entry for ${dateStr} - This is a test entry with some content.`,
      weekNumber,
      weekYear,
      isCompleted: Math.random() > 0.3,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }
  
  return entries;
}

// Generate a complete export dataset
function generateExportData(size = 'small') {
  let numCategories, numProjects, numTasks, numDailyPlans, numJournalEntries;
  
  // Set data size based on requested size
  switch (size) {
    case 'tiny':
      numCategories = 2;
      numProjects = 3;
      numTasks = 10;
      numDailyPlans = 5;
      numJournalEntries = 5;
      break;
    case 'small':
      numCategories = 5;
      numProjects = 8;
      numTasks = 50;
      numDailyPlans = 14;
      numJournalEntries = 14;
      break;
    case 'medium':
      numCategories = 10;
      numProjects = 15;
      numTasks = 200;
      numDailyPlans = 30;
      numJournalEntries = 30;
      break;
    case 'large':
      numCategories = 20;
      numProjects = 30;
      numTasks = 500;
      numDailyPlans = 60;
      numJournalEntries = 60;
      break;
    case 'huge':
      numCategories = 50;
      numProjects = 100;
      numTasks = 2000;
      numDailyPlans = 180;
      numJournalEntries = 180;
      break;
    default:
      numCategories = 5;
      numProjects = 8;
      numTasks = 50;
      numDailyPlans = 14;
      numJournalEntries = 14;
  }
  
  console.log(`Generating ${size} test export data...`);
  
  // Generate the data
  const categories = generateCategories(numCategories);
  const projects = generateProjects(numProjects);
  
  const categoryIds = categories.map(cat => cat.id);
  const projectIds = projects.map(proj => proj.id);
  
  const tasks = generateTasks(numTasks, projectIds, categoryIds);
  const taskIds = tasks.map(task => task.id);
  
  const dailyPlans = generateDailyPlans(numDailyPlans, taskIds);
  const workSchedule = generateWorkSchedule();
  const journalEntries = generateJournalEntries(numJournalEntries);
  
  // Assemble the export object
  const exportData = {
    tasks,
    projects,
    categories,
    dailyPlans,
    workSchedule,
    journalEntries,
    exportDate: new Date().toISOString(),
    version: '1.0.0'
  };
  
  return exportData;
}

// Generate files of different sizes
function generateAllSizes() {
  const sizes = ['tiny', 'small', 'medium', 'large', 'huge'];
  
  sizes.forEach(size => {
    const data = generateExportData(size);
    const json = JSON.stringify(data);
    
    // Calculate size in KB
    const sizeInKB = Math.round(json.length / 1024);
    
    writeFileSync(`test-export-${size}.json`, json);
    console.log(`Generated ${size} test data: ${sizeInKB}KB (${data.tasks.length} tasks)`);
  });
}

// Run the generator
generateAllSizes();