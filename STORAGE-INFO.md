# ADHDplanner Storage Implementation

## Overview

ADHDplanner uses IndexedDB (via Dexie.js) for robust client-side data storage. This document explains the storage implementation and how data is managed.

## Storage Technology

### IndexedDB with Dexie.js

[Dexie.js](https://dexie.org/) is a minimalistic wrapper library for IndexedDB that makes it easier to work with this browser-based database technology. IndexedDB provides several advantages:

- **Offline functionality**: All data is stored locally in the browser
- **Large storage capacity**: Unlike localStorage, IndexedDB can store significant amounts of data
- **Structure and indexing**: Supports structured data with indexes for faster queries
- **Transaction support**: Ensures data integrity with atomic operations
- **Asynchronous API**: Non-blocking operations that keep the UI responsive

## Database Schema

The database consists of the following tables:

1. **tasks** - For storing task information
   - Indexed by: id, completed, archived, dueDate, projectId, parentTaskId, categoryIds, createdAt, updatedAt

2. **projects** - For project management
   - Indexed by: id, createdAt, updatedAt

3. **categories** - For category organization
   - Indexed by: id, createdAt, updatedAt

4. **dailyPlans** - For daily planning information
   - Indexed by: id, date

5. **workSchedules** - For work schedule configuration
   - Indexed by: id, createdAt, updatedAt

6. **journalEntries** - For journal entries and reflections
   - Indexed by: id, date, weekNumber, weekYear, createdAt, updatedAt

## Data Migration

The application includes automatic migration from the previous `localStorage` storage method to IndexedDB:

1. On initial load, the app checks if there's data in `localStorage`
2. If found, it migrates all data to the IndexedDB database
3. This is a one-time process when users upgrade to the IndexedDB version

## Data Management

### Backup and Restore

Users can manage their data through these functions:

- **Export Data**: Creates a JSON file with all app data for backup purposes
- **Import Data**: Allows importing previously exported data
- **Reset Data**: Removes all stored data for a fresh start

### Security and Privacy

All data is stored locally on the user's device:

- No data is sent to any server
- Data remains private to the user's device/browser
- Data persistence depends on browser settings (private browsing may limit storage duration)

## Technical Implementation

### Core Components

1. **db.ts** - Defines the database schema and Dexie instance
2. **dexieStorage.ts** - Provides storage API methods for CRUD operations
3. **migrationUtils.ts** - Handles data migration from localStorage

### Example Usage

Basic operations with the Dexie storage layer:

```typescript
// Get all tasks
const tasks = await dexieStorage.getTasks();

// Add a new task
await dexieStorage.addTask(newTask);

// Update a task
await dexieStorage.updateTask(updatedTask);

// Delete a task
await dexieStorage.deleteTask(taskId);
```

## Browser Compatibility

IndexedDB is supported in all modern browsers. The minimum supported browsers for this implementation are:

- Chrome 49+
- Firefox 51+
- Safari 10.1+
- Edge 14+
- Opera 36+

## Future Considerations

Potential enhancements for the storage system:

1. **Sync functionality**: Add optional cloud synchronization
2. **Encryption**: Add client-side encryption for sensitive data
3. **Versioned backups**: Support for versioned/incremental backups