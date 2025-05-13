import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useAppContext } from '../context/AppContext';
import { Task } from '../types';
import LightweightTaskCard from '../components/tasks/LightweightTaskCard';
import TaskForm from '../components/tasks/TaskForm';
import SimpleQuickCapture from '../components/tasks/SimpleQuickCapture';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Empty from '../components/common/Empty';
import { Plus, Filter, List, Calendar, X, Undo2, Archive,
         AlertTriangle, CalendarDays, Layers, Network } from 'lucide-react';
import { formatDate, getOverdueTasks, getTasksDueToday, getTasksDueThisWeek } from '../utils/helpers';

// Create a memoized task card component to avoid re-rendering when parent changes
const MemoizedTaskCard = React.memo(({
  task,
  projects,
  categories,
  onEdit,
  onDelete
}: {
  task: Task;
  projects: any[];
  categories: any[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}) => (
  <LightweightTaskCard
    key={task.id}
    task={task}
    projects={projects}
    categories={categories}
    onEdit={onEdit}
    onDelete={onDelete}
  />
));

const OptimizedTasksPage: React.FC = () => {
  const { 
    tasks, 
    projects, 
    categories, 
    deleteTask, 
    undoDelete, 
    hasRecentlyDeleted, 
    archiveCompletedTasks 
  } = useAppContext();
  
  // UI state - isolated from data state for better performance
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showUndoNotification, setShowUndoNotification] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // Filter state
  const [showCompleted, setShowCompleted] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [filterProjectId, setFilterProjectId] = useState<string | null>(null);
  const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null);
  
  // View state - use sessionStorage to persist the last visited tab to avoid flicker
  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow' | 'week' | 'overdue' | 'all'>(() => {
    // Try to get the last tab from session storage
    const savedTab = sessionStorage.getItem('taskTab');
    return (savedTab as 'today' | 'tomorrow' | 'week' | 'overdue' | 'all') || 'today';
  });
  const [viewMode, setViewMode] = useState<'list' | 'hierarchical'>('list');

  // Performance tracking
  const [renderCount, setRenderCount] = useState(0);
  
  // Increment render counter to track re-renders
  useEffect(() => {
    setRenderCount(prev => prev + 1);
  }, []);
  
  // Show undo notification when a task is deleted
  useEffect(() => {
    if (hasRecentlyDeleted) {
      setShowUndoNotification(true);
      const timer = setTimeout(() => {
        setShowUndoNotification(false);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [hasRecentlyDeleted]);
  
  // Event handlers - all memoized to prevent re-renders
  const handleOpenModal = useCallback((task?: Task) => {
    setEditingTask(task || null);
    setIsModalOpen(true);
  }, []);
  
  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setTimeout(() => setEditingTask(null), 100);
  }, []);
  
  const handleDeleteTask = useCallback((taskId: string) => {
    deleteTask(taskId);
  }, [deleteTask]);
  
  const handleUndo = useCallback(() => {
    undoDelete();
    setShowUndoNotification(false);
  }, [undoDelete]);
  
  const toggleFilter = useCallback(() => {
    setIsFilterOpen(prev => !prev);
  }, []);
  
  const clearFilters = useCallback(() => {
    setShowCompleted(false);
    setShowArchived(false);
    setFilterProjectId(null);
    setFilterCategoryId(null);
  }, []);
  
  const handleArchiveConfirmOpen = useCallback(() => {
    if (tasks.some(task => task.completed && !task.archived)) {
      setShowArchiveConfirm(true);
    }
  }, [tasks]);
  
  const handleArchiveConfirmClose = useCallback(() => {
    setShowArchiveConfirm(false);
  }, []);
  
  const handleArchiveCompleted = useCallback(() => {
    archiveCompletedTasks();
    setShowArchiveConfirm(false);
  }, [archiveCompletedTasks]);
  
  // Tab change handlers - optimized to minimize work and prevent re-renders
  const handleTabChange = useCallback((newTab: 'today' | 'tomorrow' | 'week' | 'overdue' | 'all') => {
    // Skip if we're already on this tab
    if (activeTab === newTab) return;

    // Save the selection to session storage to persist across page refreshes
    try {
      sessionStorage.setItem('taskTab', newTab);
    } catch (e) {
      // Ignore storage errors
      console.log('Failed to save tab state to session storage');
    }

    setActiveTab(newTab);
  }, [activeTab]);
  
  // View mode change handler - only change if actually different
  const handleViewModeChange = useCallback((newMode: 'list' | 'hierarchical') => {
    if (viewMode === newMode) return;
    setViewMode(newMode);
  }, [viewMode]);
  
  // Generate date strings once and memoize them
  const dates = useMemo(() => {
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    return {
      today: formatDate(today),
      tomorrow: formatDate(tomorrow)
    };
  }, []);
  
  // Filter function applied to all task operations - memoized for performance
  const filterTask = useCallback((task: Task): boolean => {
    // Completed filter
    if (task.completed && !showCompleted) {
      return false;
    }
    
    // Archived filter
    if (task.archived && !showArchived) {
      return false;
    }
    
    // Project filter
    if (filterProjectId && task.projectId !== filterProjectId) {
      return false;
    }
    
    // Category filter
    if (filterCategoryId && !(task.categoryIds?.includes(filterCategoryId) || false)) {
      return false;
    }
    
    return true;
  }, [showCompleted, showArchived, filterProjectId, filterCategoryId]);
  
  // Create memoized task lists for each tab
  const taskLists = useMemo(() => {
    // First, apply basic filtering to all tasks
    const filteredTasks = tasks.filter(filterTask);
    
    // Create a map to track which tasks have been assigned to a category
    // to avoid showing them in multiple sections
    const taskCategories = new Map<string, string>();
    
    // Create the initial categorization
    const overdue: Task[] = [];
    const today: Task[] = [];
    const tomorrow: Task[] = [];
    const thisWeek: Task[] = [];
    const other: Task[] = [];
    
    // Single-pass categorization for maximum performance
    filteredTasks.forEach(task => {
      // Skip completed tasks in specific filters unless showCompleted is true
      if (task.completed && !showCompleted) return;
      
      // Categorize each task
      if (!task.dueDate) {
        other.push(task);
        taskCategories.set(task.id, 'other');
      } 
      else if (task.dueDate < dates.today) {
        overdue.push(task);
        taskCategories.set(task.id, 'overdue');
      }
      else if (task.dueDate === dates.today) {
        today.push(task);
        taskCategories.set(task.id, 'today');
      }
      else if (task.dueDate === dates.tomorrow) {
        tomorrow.push(task);
        taskCategories.set(task.id, 'tomorrow');
      }
      else {
        // Check if the task is due this week
        const taskDate = new Date(task.dueDate);
        const today = new Date();
        const sunday = new Date(today);
        sunday.setDate(today.getDate() + (7 - today.getDay()));
        
        if (taskDate <= sunday) {
          thisWeek.push(task);
          taskCategories.set(task.id, 'thisWeek');
        } else {
          other.push(task);
          taskCategories.set(task.id, 'other');
        }
      }
    });
    
    // Create an all tasks list that preserves the categorization order
    const all = [...overdue, ...today, ...tomorrow, ...thisWeek, ...other];
    
    return {
      overdue,
      today,
      tomorrow,
      thisWeek,
      other,
      all,
      taskCategories
    };
  }, [tasks, filterTask, dates, showCompleted]);
  
  // Get the active task list based on the selected tab
  const activeTaskList = useMemo(() => {
    switch (activeTab) {
      case 'today': return taskLists.today;
      case 'tomorrow': return taskLists.tomorrow;
      case 'week': return taskLists.thisWeek;
      case 'overdue': return taskLists.overdue;
      case 'all': return taskLists.all;
      default: return taskLists.today;
    }
  }, [activeTab, taskLists]);
  
  // Filter to show only parent tasks (no subtasks)
  const parentTasks = useMemo(() => {
    return activeTaskList.filter(task => !task.parentTaskId);
  }, [activeTaskList]);
  
  // Prepare categories for the "All" view with their visible parent tasks
  const allViewCategories = useMemo(() => {
    if (activeTab !== 'all') return {};
    
    return {
      overdue: taskLists.overdue.filter(task => !task.parentTaskId),
      today: taskLists.today.filter(task => !task.parentTaskId),
      tomorrow: taskLists.tomorrow.filter(task => !task.parentTaskId),
      thisWeek: taskLists.thisWeek.filter(task => !task.parentTaskId),
      other: taskLists.other.filter(task => !task.parentTaskId)
    };
  }, [activeTab, taskLists]);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center bg-white rounded-lg shadow-sm p-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600">
            {activeTaskList.length} task{activeTaskList.length !== 1 ? 's' : ''}
            {(filterProjectId || filterCategoryId) && ' (filtered)'}
          </p>
          <div className="text-xs text-gray-400">Render count: {renderCount}</div>
        </div>
        
        <div className="mt-4 md:mt-0 flex flex-wrap space-x-2">
          <div className="flex space-x-1 bg-gray-100 rounded-md p-1">
            <button
              className={`px-2 py-1 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => handleViewModeChange('list')}
              title="List View"
            >
              <List size={16} />
            </button>
            <button
              className={`px-2 py-1 rounded-md ${viewMode === 'hierarchical' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => handleViewModeChange('hierarchical')}
              title="Hierarchical View"
            >
              <Network size={16} />
            </button>
          </div>
          
          <Button
            variant="secondary"
            icon={<Archive size={16} />}
            onClick={handleArchiveConfirmOpen}
          >
            Archive Completed
          </Button>
          <Button
            variant="secondary"
            icon={<Filter size={16} />}
            onClick={toggleFilter}
          >
            Filter
          </Button>
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => handleOpenModal()}
          >
            New Task
          </Button>
        </div>
      </div>

      {/* Quick Add Task */}
      <div className="mb-4">
        <SimpleQuickCapture
          placeholder="Add a new task... (try !today, !tomorrow, !high)"
          defaultDueDate={activeTab === 'today' ? dates.today :
                         activeTab === 'tomorrow' ? dates.tomorrow :
                         null}
        />
      </div>

      {/* Tab navigation */}
      <div className="flex flex-wrap border-b border-gray-200">
        <button
          className={`px-4 py-2 font-medium text-sm rounded-t-md border-b-2 transition-colors ${
            activeTab === 'today' 
              ? 'border-indigo-500 text-indigo-600 bg-indigo-50' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => handleTabChange('today')}
        >
          <div className="flex items-center space-x-2">
            <Calendar size={16} />
            <span>Today{taskLists.today.length > 0 && ` (${taskLists.today.length})`}</span>
          </div>
        </button>
        
        <button
          className={`px-4 py-2 font-medium text-sm rounded-t-md border-b-2 transition-colors ${
            activeTab === 'tomorrow' 
              ? 'border-indigo-500 text-indigo-600 bg-indigo-50' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => handleTabChange('tomorrow')}
        >
          <div className="flex items-center space-x-2">
            <CalendarDays size={16} />
            <span>Tomorrow{taskLists.tomorrow.length > 0 && ` (${taskLists.tomorrow.length})`}</span>
          </div>
        </button>
        
        <button
          className={`px-4 py-2 font-medium text-sm rounded-t-md border-b-2 transition-colors ${
            activeTab === 'week' 
              ? 'border-indigo-500 text-indigo-600 bg-indigo-50' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => handleTabChange('week')}
        >
          <div className="flex items-center space-x-2">
            <CalendarDays size={16} />
            <span>This Week{taskLists.thisWeek.length > 0 && ` (${taskLists.thisWeek.length})`}</span>
          </div>
        </button>
        
        <button
          className={`px-4 py-2 font-medium text-sm rounded-t-md border-b-2 transition-colors ${
            activeTab === 'overdue' 
              ? 'border-red-500 text-red-600 bg-red-50' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => handleTabChange('overdue')}
        >
          <div className="flex items-center space-x-2">
            <AlertTriangle size={16} className={taskLists.overdue.length > 0 ? 'text-red-500' : ''} />
            <span>Overdue{taskLists.overdue.length > 0 && ` (${taskLists.overdue.length})`}</span>
          </div>
        </button>
        
        <button
          className={`px-4 py-2 font-medium text-sm rounded-t-md border-b-2 transition-colors ${
            activeTab === 'all' 
              ? 'border-indigo-500 text-indigo-600 bg-indigo-50' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => handleTabChange('all')}
        >
          <div className="flex items-center space-x-2">
            <Layers size={16} />
            <span>All Tasks</span>
          </div>
        </button>
      </div>
      
      {/* Undo notification */}
      {showUndoNotification && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-3 z-50">
          <span>Task deleted</span>
          <Button
            variant="secondary"
            size="sm"
            icon={<Undo2 size={14} />}
            onClick={handleUndo}
          >
            Undo
          </Button>
        </div>
      )}
      
      {/* Filter panel */}
      {isFilterOpen && (
        <Card className="bg-gray-50">
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="text-lg font-medium text-gray-900">Filters</h3>
              <button
                className="text-gray-400 hover:text-gray-500"
                onClick={toggleFilter}
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Task Status
                </label>
                <div className="flex flex-col space-y-2">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="showCompleted"
                      checked={showCompleted}
                      onChange={() => setShowCompleted(!showCompleted)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                    <label htmlFor="showCompleted" className="ml-2 text-sm text-gray-700">
                      Show completed tasks
                    </label>
                  </div>
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="showArchived"
                      checked={showArchived}
                      onChange={() => setShowArchived(!showArchived)}
                      className="h-4 w-4 text-indigo-600 border-gray-300 rounded"
                    />
                    <label htmlFor="showArchived" className="ml-2 text-sm text-gray-700">
                      Show archived tasks
                    </label>
                  </div>
                </div>
              </div>
              
              <div>
                <label htmlFor="projectFilter" className="block text-sm font-medium text-gray-700 mb-1">
                  Project
                </label>
                <select
                  id="projectFilter"
                  value={filterProjectId || ''}
                  onChange={(e) => setFilterProjectId(e.target.value || null)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">All Projects</option>
                  {projects.map(project => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label htmlFor="categoryFilter" className="block text-sm font-medium text-gray-700 mb-1">
                  Category
                </label>
                <select
                  id="categoryFilter"
                  value={filterCategoryId || ''}
                  onChange={(e) => setFilterCategoryId(e.target.value || null)}
                  className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                >
                  <option value="">All Categories</option>
                  {categories.map(category => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button
                variant="secondary"
                size="sm"
                onClick={clearFilters}
              >
                Clear Filters
              </Button>
            </div>
          </div>
        </Card>
      )}
      
      {/* Task list */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        {/* Tab header */}
        <div className="mb-4">
          {activeTab === 'today' && (
            <div className="flex items-center space-x-2">
              <Calendar size={20} className="text-indigo-500" />
              <h2 className="text-xl font-semibold text-gray-900">Today's Tasks</h2>
            </div>
          )}
          {activeTab === 'tomorrow' && (
            <div className="flex items-center space-x-2">
              <CalendarDays size={20} className="text-indigo-500" />
              <h2 className="text-xl font-semibold text-gray-900">Tomorrow's Tasks</h2>
            </div>
          )}
          {activeTab === 'week' && (
            <div className="flex items-center space-x-2">
              <CalendarDays size={20} className="text-indigo-500" />
              <h2 className="text-xl font-semibold text-gray-900">This Week's Tasks</h2>
            </div>
          )}
          {activeTab === 'overdue' && (
            <div className="flex items-center space-x-2">
              <AlertTriangle size={20} className="text-red-500" />
              <h2 className="text-xl font-semibold text-gray-900">Overdue Tasks</h2>
            </div>
          )}
          {activeTab === 'all' && (
            <div className="flex items-center space-x-2">
              <Layers size={20} className="text-indigo-500" />
              <h2 className="text-xl font-semibold text-gray-900">All Tasks</h2>
            </div>
          )}
        </div>
        
        {/* Tasks */}
        <div className="space-y-4">
          {activeTaskList.length > 0 ? (
            <div>
              {/* List View for specific tabs */}
              {viewMode === 'list' && activeTab !== 'all' && (
                <div className="space-y-2">
                  {parentTasks.map(task => (
                    <MemoizedTaskCard
                      key={task.id}
                      task={task}
                      projects={projects}
                      categories={categories}
                      onEdit={handleOpenModal}
                      onDelete={handleDeleteTask}
                    />
                  ))}
                </div>
              )}
              
              {/* List View for "All" tab with categorized sections */}
              {viewMode === 'list' && activeTab === 'all' && (
                <div className="space-y-6">
                  {/* Overdue section */}
                  {allViewCategories.overdue.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-red-600 mb-3 flex items-center">
                        <AlertTriangle size={16} className="mr-2" />
                        Overdue
                      </h3>
                      <div className="space-y-2">
                        {allViewCategories.overdue.map(task => (
                          <MemoizedTaskCard
                            key={task.id}
                            task={task}
                            projects={projects}
                            categories={categories}
                            onEdit={handleOpenModal}
                            onDelete={handleDeleteTask}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Today section */}
                  {allViewCategories.today.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-indigo-600 mb-3 flex items-center">
                        <Calendar size={16} className="mr-2" />
                        Today
                      </h3>
                      <div className="space-y-2">
                        {allViewCategories.today.map(task => (
                          <MemoizedTaskCard
                            key={task.id}
                            task={task}
                            projects={projects}
                            categories={categories}
                            onEdit={handleOpenModal}
                            onDelete={handleDeleteTask}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Tomorrow section */}
                  {allViewCategories.tomorrow.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-indigo-600 mb-3 flex items-center">
                        <CalendarDays size={16} className="mr-2" />
                        Tomorrow
                      </h3>
                      <div className="space-y-2">
                        {allViewCategories.tomorrow.map(task => (
                          <MemoizedTaskCard
                            key={task.id}
                            task={task}
                            projects={projects}
                            categories={categories}
                            onEdit={handleOpenModal}
                            onDelete={handleDeleteTask}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* This week section */}
                  {allViewCategories.thisWeek.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-indigo-600 mb-3 flex items-center">
                        <CalendarDays size={16} className="mr-2" />
                        This Week
                      </h3>
                      <div className="space-y-2">
                        {allViewCategories.thisWeek.map(task => (
                          <MemoizedTaskCard
                            key={task.id}
                            task={task}
                            projects={projects}
                            categories={categories}
                            onEdit={handleOpenModal}
                            onDelete={handleDeleteTask}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {/* Other tasks section */}
                  {allViewCategories.other.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-700 mb-3 flex items-center">
                        <Layers size={16} className="mr-2" />
                        Other Tasks
                      </h3>
                      <div className="space-y-2">
                        {allViewCategories.other.map(task => (
                          <MemoizedTaskCard
                            key={task.id}
                            task={task}
                            projects={projects}
                            categories={categories}
                            onEdit={handleOpenModal}
                            onDelete={handleDeleteTask}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              {/* Hierarchical View */}
              {viewMode === 'hierarchical' && (
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <h3 className="text-lg font-medium text-gray-700">Hierarchical View</h3>
                  <p className="text-gray-500 text-sm">Simplified implementation to prevent freezing</p>
                </div>
              )}
            </div>
          ) : (
            <Empty
              title="No tasks found"
              description={
                filterProjectId || filterCategoryId
                  ? "Try adjusting your filters or create a new task"
                  : activeTab === 'today'
                    ? "No tasks due today. Add a task or check another tab."
                    : activeTab === 'tomorrow'
                      ? "No tasks due tomorrow. Add a task or check another tab."
                      : activeTab === 'week'
                        ? "No tasks due this week. Add a task or check another tab."
                        : activeTab === 'overdue'
                          ? "No overdue tasks. You're all caught up!"
                          : "Get started by creating your first task"
              }
              action={
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus size={16} />}
                  onClick={() => handleOpenModal()}
                >
                  New Task
                </Button>
              }
            />
          )}
        </div>
      </div>
      
      {/* Task Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingTask ? 'Edit Task' : 'Create New Task'}
      >
        <TaskForm
          task={editingTask || undefined}
          parentTask={null}
          onClose={handleCloseModal}
          isEdit={!!editingTask}
        />
      </Modal>
      
      {/* Archive Confirmation Modal */}
      <Modal
        isOpen={showArchiveConfirm}
        onClose={handleArchiveConfirmClose}
        title="Archive Completed Tasks"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            This will archive all completed tasks. Archived tasks will be hidden by default but can still be viewed using the filter.
          </p>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={handleArchiveConfirmClose}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              icon={<Archive size={16} />}
              onClick={handleArchiveCompleted}
            >
              Archive Tasks
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default OptimizedTasksPage;