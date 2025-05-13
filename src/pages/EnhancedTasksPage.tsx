import React, { useState, useEffect, useMemo, useCallback, memo } from 'react';
import { useAppContext } from '../context/AppContext';
import { Task } from '../types';
import EnhancedTaskCard from '../components/tasks/EnhancedTaskCard';
import TaskForm from '../components/tasks/TaskForm';
import HierarchicalTaskView from '../components/tasks/HierarchicalTaskView';
import QuickTaskInput from '../components/tasks/QuickTaskInput';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Empty from '../components/common/Empty';
import { Plus, Filter, List, Calendar, X, Undo2, Archive,
         AlertTriangle, CalendarDays, Layers, Network } from 'lucide-react';
import { formatDate, getOverdueTasks, getTasksDueToday, getTasksDueThisWeek } from '../utils/helpers';

// Memoized task card to prevent unnecessary re-rendering
const MemoizedTaskCard = memo(({ 
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
  onDelete: (id: string) => void; 
}) => {
  return (
    <EnhancedTaskCard
      key={task.id}
      task={task}
      projects={projects}
      categories={categories}
      onEdit={onEdit}
      onDelete={onDelete}
    />
  );
});

const EnhancedTasksPage: React.FC = () => {
  const { tasks, projects, categories, deleteTask, undoDelete, hasRecentlyDeleted, archiveCompletedTasks } = useAppContext();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showUndoNotification, setShowUndoNotification] = useState(false);
  const [showArchiveConfirm, setShowArchiveConfirm] = useState(false);
  
  // Filter state
  const [showCompleted, setShowCompleted] = useState(false);
  const [showArchived, setShowArchived] = useState(false);
  const [filterProjectId, setFilterProjectId] = useState<string | null>(null);
  const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
  // View state
  const [activeTab, setActiveTab] = useState<'today' | 'tomorrow' | 'week' | 'overdue' | 'all'>('today');
  const [viewMode, setViewMode] = useState<'list' | 'hierarchical'>('list');
  
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
  
  // Memoize event handlers to prevent unnecessary re-rendering
  const handleOpenModal = useCallback((task?: Task) => {
    setEditingTask(task || null);
    setIsModalOpen(true);
  }, []);

  const handleCloseModal = useCallback(() => {
    setIsModalOpen(false);
    setEditingTask(null);
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
    // Only show confirmation if there are completed tasks to archive
    const hasCompletedTasks = tasks.some(task => task.completed && !task.archived);
    if (hasCompletedTasks) {
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
  
  // Get tomorrow's date in YYYY-MM-DD format
  const getTomorrowDate = useCallback((): string => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDate(tomorrow);
  }, []);

  // Filter tasks based on global filters (project, category)
  const applyBaseFilter = useCallback((task: Task): boolean => {
    // Filter by project
    if (filterProjectId && task.projectId !== filterProjectId) {
      return false;
    }

    // Filter by category
    if (filterCategoryId && !(task.categoryIds?.includes(filterCategoryId) || false)) {
      return false;
    }

    return true;
  }, [filterProjectId, filterCategoryId]);

  // Memoize all task filtering to prevent recomputation on each render
  const filteredTasks = useMemo(() => {
    // Apply basic filtering (completion, archiving) once to the entire dataset
    const baseFilteredTasks = tasks.filter(task => {
      // Check completion filter
      if (task.completed && !showCompleted) {
        return false;
      }

      // Check archived filter
      if (task.archived && !showArchived) {
        return false;
      }

      // Apply project and category filters
      return applyBaseFilter(task);
    });

    // Now calculate all the specialized lists
    const today = formatDate(new Date());
    const tomorrow = getTomorrowDate();

    const overdue = getOverdueTasks(baseFilteredTasks);
    const today_tasks = getTasksDueToday(baseFilteredTasks);
    const tomorrow_tasks = baseFilteredTasks.filter(task =>
      task.dueDate === tomorrow &&
      !task.completed);

    const thisWeek = getTasksDueThisWeek(baseFilteredTasks).filter(task =>
      // Remove tasks already shown in Today or Tomorrow
      task.dueDate !== today &&
      task.dueDate !== tomorrow
    );

    // Calculate other tasks more efficiently
    // Create a Set of task IDs that are already in other categories for faster lookups
    const specialTaskIds = new Set([
      ...overdue.map(t => t.id),
      ...today_tasks.map(t => t.id),
      ...tomorrow_tasks.map(t => t.id),
      ...thisWeek.map(t => t.id)
    ]);

    // Other tasks are those that aren't in any specialized category
    const other = baseFilteredTasks.filter(task => !specialTaskIds.has(task.id));

    return {
      overdue,
      today: today_tasks,
      tomorrow: tomorrow_tasks,
      thisWeek,
      other
    };
  }, [tasks, showCompleted, showArchived, applyBaseFilter, getTomorrowDate]);

  // Change tab efficiently
  const setActiveTabWithOptimization = useCallback((tab: 'today' | 'tomorrow' | 'week' | 'overdue' | 'all') => {
    // If we're already on this tab, don't do anything
    if (activeTab === tab) return;
    setActiveTab(tab);
  }, [activeTab]);

  // Get the active task list based on the selected tab - simplified to avoid errors
  const activeTaskList = (() => {
    switch (activeTab) {
      case 'today':
        return filteredTasks.today;
      case 'tomorrow':
        return filteredTasks.tomorrow;
      case 'week':
        return filteredTasks.thisWeek;
      case 'overdue':
        return filteredTasks.overdue;
      case 'all': 
        // Simple concatenation for reliable behavior
        return [
          ...filteredTasks.overdue,
          ...filteredTasks.today,
          ...filteredTasks.tomorrow,
          ...filteredTasks.thisWeek,
          ...filteredTasks.other
        ];
      default:
        return filteredTasks.today;
    }
  })();

  // Get parent tasks (no subtasks) - simplified to avoid errors
  const parentTasks = activeTaskList.filter(task => !task.parentTaskId);
  
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
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap space-x-2">
          <div className="flex space-x-1 bg-gray-100 rounded-md p-1">
            <button
              className={`px-2 py-1 rounded-md ${viewMode === 'list' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <List size={16} />
            </button>
            <button
              className={`px-2 py-1 rounded-md ${viewMode === 'hierarchical' ? 'bg-white shadow-sm' : 'text-gray-500 hover:text-gray-700'}`}
              onClick={() => setViewMode('hierarchical')}
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
      <QuickTaskInput 
        defaultDueDate={activeTab === 'today' ? formatDate(new Date()) : 
                       activeTab === 'tomorrow' ? getTomorrowDate() : 
                       null}
      />
      
      {/* Tab navigation */}
      <div className="flex flex-wrap border-b border-gray-200">
        <button
          className={`px-4 py-2 font-medium text-sm rounded-t-md border-b-2 transition-colors ${
            activeTab === 'today' 
              ? 'border-indigo-500 text-indigo-600 bg-indigo-50' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTabWithOptimization('today')}
        >
          <div className="flex items-center space-x-2">
            <Calendar size={16} />
            <span>Today{filteredTasks.today.length > 0 && ` (${filteredTasks.today.length})`}</span>
          </div>
        </button>

        <button
          className={`px-4 py-2 font-medium text-sm rounded-t-md border-b-2 transition-colors ${
            activeTab === 'tomorrow'
              ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTabWithOptimization('tomorrow')}
        >
          <div className="flex items-center space-x-2">
            <CalendarDays size={16} />
            <span>Tomorrow{filteredTasks.tomorrow.length > 0 && ` (${filteredTasks.tomorrow.length})`}</span>
          </div>
        </button>

        <button
          className={`px-4 py-2 font-medium text-sm rounded-t-md border-b-2 transition-colors ${
            activeTab === 'week'
              ? 'border-indigo-500 text-indigo-600 bg-indigo-50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTabWithOptimization('week')}
        >
          <div className="flex items-center space-x-2">
            <CalendarDays size={16} />
            <span>This Week{filteredTasks.thisWeek.length > 0 && ` (${filteredTasks.thisWeek.length})`}</span>
          </div>
        </button>

        <button
          className={`px-4 py-2 font-medium text-sm rounded-t-md border-b-2 transition-colors ${
            activeTab === 'overdue'
              ? 'border-red-500 text-red-600 bg-red-50'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTabWithOptimization('overdue')}
        >
          <div className="flex items-center space-x-2">
            <AlertTriangle size={16} className={filteredTasks.overdue.length > 0 ? 'text-red-500' : ''} />
            <span>Overdue{filteredTasks.overdue.length > 0 && ` (${filteredTasks.overdue.length})`}</span>
          </div>
        </button>
        
        <button
          className={`px-4 py-2 font-medium text-sm rounded-t-md border-b-2 transition-colors ${
            activeTab === 'all' 
              ? 'border-indigo-500 text-indigo-600 bg-indigo-50' 
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setActiveTabWithOptimization('all')}
        >
          <div className="flex items-center space-x-2">
            <Layers size={16} />
            <span>All Tasks</span>
          </div>
        </button>
      </div>
      
      {/* Undo notification */}
      {showUndoNotification && (
        <div className="fixed bottom-4 right-4 bg-gray-800 text-white px-4 py-2 rounded-lg shadow-lg flex items-center space-x-3">
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
              {/* Choose view based on view mode */}
              {viewMode === 'list' ? (
                <div>
                  {/* For 'All' tab, group by categories */}
                  {activeTab === 'all' && (
                    <div className="space-y-6">
                      {/* Overdue section */}
                      {filteredTasks.overdue.length > 0 && (
                        <div>
                          <h3 className="text-lg font-medium text-red-600 mb-3 flex items-center">
                            <AlertTriangle size={16} className="mr-2" />
                            Overdue
                          </h3>
                          <div className="space-y-2">
                            {filteredTasks.overdue
                              .filter(task => !task.parentTaskId)
                              .map(task => (
                                <MemoizedTaskCard
                                  key={task.id}
                                  task={task}
                                  projects={projects}
                                  categories={categories}
                                  onEdit={handleOpenModal}
                                  onDelete={handleDeleteTask}
                                />
                              ))
                            }
                          </div>
                        </div>
                      )}

                      {/* Today section */}
                      {filteredTasks.today.length > 0 && (
                        <div>
                          <h3 className="text-lg font-medium text-indigo-600 mb-3 flex items-center">
                            <Calendar size={16} className="mr-2" />
                            Today
                          </h3>
                          <div className="space-y-2">
                            {filteredTasks.today
                              .filter(task => !task.parentTaskId)
                              .map(task => (
                                <MemoizedTaskCard
                                  key={task.id}
                                  task={task}
                                  projects={projects}
                                  categories={categories}
                                  onEdit={handleOpenModal}
                                  onDelete={handleDeleteTask}
                                />
                              ))
                            }
                          </div>
                        </div>
                      )}

                      {/* Tomorrow section */}
                      {filteredTasks.tomorrow.length > 0 && (
                        <div>
                          <h3 className="text-lg font-medium text-indigo-600 mb-3 flex items-center">
                            <CalendarDays size={16} className="mr-2" />
                            Tomorrow
                          </h3>
                          <div className="space-y-2">
                            {filteredTasks.tomorrow
                              .filter(task => !task.parentTaskId)
                              .map(task => (
                                <MemoizedTaskCard
                                  key={task.id}
                                  task={task}
                                  projects={projects}
                                  categories={categories}
                                  onEdit={handleOpenModal}
                                  onDelete={handleDeleteTask}
                                />
                              ))
                            }
                          </div>
                        </div>
                      )}

                      {/* This week section */}
                      {filteredTasks.thisWeek.length > 0 && (
                        <div>
                          <h3 className="text-lg font-medium text-indigo-600 mb-3 flex items-center">
                            <CalendarDays size={16} className="mr-2" />
                            This Week
                          </h3>
                          <div className="space-y-2">
                            {filteredTasks.thisWeek
                              .filter(task => !task.parentTaskId)
                              .map(task => (
                                <MemoizedTaskCard
                                  key={task.id}
                                  task={task}
                                  projects={projects}
                                  categories={categories}
                                  onEdit={handleOpenModal}
                                  onDelete={handleDeleteTask}
                                />
                              ))
                            }
                          </div>
                        </div>
                      )}

                      {/* Other tasks section */}
                      {filteredTasks.other.filter(t => !t.parentTaskId).length > 0 && (
                        <div>
                          <h3 className="text-lg font-medium text-gray-700 mb-3 flex items-center">
                            <Layers size={16} className="mr-2" />
                            Other Tasks
                          </h3>
                          <div className="space-y-2">
                            {filteredTasks.other
                              .filter(task => !task.parentTaskId)
                              .map(task => (
                                <MemoizedTaskCard
                                  key={task.id}
                                  task={task}
                                  projects={projects}
                                  categories={categories}
                                  onEdit={handleOpenModal}
                                  onDelete={handleDeleteTask}
                                />
                              ))
                            }
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* Standard view for specific tabs */}
                  {activeTab !== 'all' && (
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
                </div>
              ) : (
                /* Hierarchical View */
                <HierarchicalTaskView 
                  tasks={activeTaskList}
                  projects={projects}
                  categories={categories}
                  onEditTask={handleOpenModal}
                  onAddSubtask={() => {
                    setEditingTask(null);
                    setIsModalOpen(true);
                    // Note: we'd need to update TaskForm to accept a parentTask prop
                  }}
                />
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

export default EnhancedTasksPage;