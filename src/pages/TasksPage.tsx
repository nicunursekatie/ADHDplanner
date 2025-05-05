import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Task } from '../types';
import { ImprovedTaskCard } from '../components/tasks/ImprovedTaskCard';
import { StreamlinedTaskForm } from '../components/tasks/StreamlinedTaskForm';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Empty from '../components/common/Empty';
import { QuickCapture } from '../components/tasks/QuickCapture';
import { EnhancedQuickCapture } from '../components/tasks/EnhancedQuickCapture';
import { Plus, Filter, CheckSquare, Clock, X, Undo2, Archive, AlertTriangle, CalendarDays, Calendar, Layers } from 'lucide-react';
import { formatDate, getOverdueTasks, getTasksDueToday, getTasksDueThisWeek } from '../utils/helpers';

const TasksPage: React.FC = () => {
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
  
  const handleOpenModal = (task?: Task) => {
    if (task) {
      setEditingTask(task);
    } else {
      setEditingTask(null);
    }
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };
  
  const handleDeleteTask = (taskId: string) => {
    deleteTask(taskId);
  };
  
  const handleUndo = () => {
    undoDelete();
    setShowUndoNotification(false);
  };
  
  const toggleFilter = () => {
    setIsFilterOpen(!isFilterOpen);
  };
  
  const clearFilters = () => {
    setShowCompleted(false);
    setShowArchived(false);
    setFilterProjectId(null);
    setFilterCategoryId(null);
  };

  const handleArchiveConfirmOpen = () => {
    // Only show confirmation if there are completed tasks to archive
    const completedTasks = tasks.filter(task => task.completed && !task.archived);
    if (completedTasks.length > 0) {
      setShowArchiveConfirm(true);
    }
  };

  const handleArchiveConfirmClose = () => {
    setShowArchiveConfirm(false);
  };

  const handleArchiveCompleted = () => {
    archiveCompletedTasks();
    setShowArchiveConfirm(false);
  };
  
  // Get tomorrow's date in YYYY-MM-DD format
  const getTomorrowDate = (): string => {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return formatDate(tomorrow);
  };
  
  // Get tasks due tomorrow
  const getTasksDueTomorrow = (tasks: Task[]): Task[] => {
    const tomorrowDate = getTomorrowDate();
    return tasks.filter(task => 
      task.dueDate === tomorrowDate && 
      !task.completed && 
      !task.archived
    );
  };
  
  // Filter tasks based on global filters (project, category)
  const applyBaseFilter = (task: Task): boolean => {
    // Filter by project
    if (filterProjectId && task.projectId !== filterProjectId) {
      return false;
    }
    
    // Filter by category
    if (filterCategoryId && !(task.categoryIds?.includes(filterCategoryId) || false)) {
      return false;
    }
    
    return true;
  };
  
  // Get tasks for each section
  const overdueTasks = getOverdueTasks(tasks)
    .filter(task => !task.archived)
    .filter(applyBaseFilter);
    
  const todayTasks = getTasksDueToday(tasks)
    .filter(task => !task.archived)
    .filter(applyBaseFilter);
    
  const tomorrowTasks = getTasksDueTomorrow(tasks)
    .filter(applyBaseFilter);
    
  const thisWeekTasks = getTasksDueThisWeek(tasks)
    .filter(task => 
      // Remove tasks already shown in Today or Tomorrow
      task.dueDate !== formatDate(new Date()) && 
      task.dueDate !== getTomorrowDate()
    )
    .filter(task => !task.archived)
    .filter(applyBaseFilter);
    
  // Other tasks (no due date, or due date beyond this week)
  const otherTasks = tasks.filter(task => 
    // Not completed or show completed is enabled
    (showCompleted || !task.completed) &&
    // Not archived or show archived is enabled
    (showArchived || !task.archived) &&
    // Not in other categories
    (!task.dueDate || 
      (!overdueTasks.some(t => t.id === task.id) && 
       !todayTasks.some(t => t.id === task.id) && 
       !tomorrowTasks.some(t => t.id === task.id) && 
       !thisWeekTasks.some(t => t.id === task.id))
    )
  ).filter(applyBaseFilter);
  
  // Get currently active task list based on the selected tab
  const getActiveTaskList = (): Task[] => {
    switch (activeTab) {
      case 'today':
        return todayTasks;
      case 'tomorrow':
        return tomorrowTasks;
      case 'week':
        return thisWeekTasks;
      case 'overdue':
        return overdueTasks;
      case 'all':
        return [...overdueTasks, ...todayTasks, ...tomorrowTasks, ...thisWeekTasks, ...otherTasks];
      default:
        return todayTasks;
    }
  };
  
  // Group tasks by parent/child for the active list
  const activeTaskList = getActiveTaskList();
  const parentTasks = activeTaskList.filter(task => !task.parentTaskId);
  
  return (
    <div className="space-y-6">
      {/* Header - Improved for mobile */}
      <div className="flex flex-col md:flex-row justify-between md:items-center bg-white rounded-lg shadow-sm p-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
          <p className="text-gray-600">
            {activeTaskList.length} task{activeTaskList.length !== 1 ? 's' : ''}
            {(filterProjectId || filterCategoryId) && ' (filtered)'}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex flex-wrap gap-2">
          <div className="flex md:hidden">
            <Button
              variant="primary"
              icon={<Plus size={16} />}
              onClick={() => handleOpenModal()}
            />
            <Button
              variant="secondary"
              icon={<Filter size={16} />}
              onClick={toggleFilter}
              className="ml-2"
            />
            <Button
              variant="secondary"
              icon={<Archive size={16} />}
              onClick={handleArchiveConfirmOpen}
              className="ml-2"
            />
          </div>
          <div className="hidden md:flex space-x-2">
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
      </div>
      
      {/* Quick Task Input */}
      <div className="mb-6">
        <EnhancedQuickCapture 
          placeholder="Add a task quickly... (try !today, !tomorrow, !high)"
          defaultProjectId={filterProjectId}
          onTaskAdded={() => {
            // Force re-render to show the new task
            if (activeTab === 'today') {
              // Stay on today tab
            } else if (activeTab === 'all') {
              // Stay on all tab
            } else {
              // Switch to all to ensure the user sees their new task
              setActiveTab('all');
            }
          }}
        />
      </div>
      
      {/* Tab navigation - improved for mobile */}
      <div className="overflow-x-auto pb-1 md:pb-0 hide-scrollbar">
        <div className="flex min-w-max border-b border-gray-200">
          <button
            className={`flex-shrink-0 px-4 py-2 font-medium text-sm rounded-t-md border-b-2 transition-colors ${
              activeTab === 'today' 
                ? 'border-indigo-500 text-indigo-600 bg-indigo-50' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('today')}
          >
            <div className="flex items-center space-x-2">
              <Calendar size={16} />
              <span className="whitespace-nowrap">Today{todayTasks.length > 0 && ` (${todayTasks.length})`}</span>
            </div>
          </button>
          
          <button
            className={`flex-shrink-0 px-4 py-2 font-medium text-sm rounded-t-md border-b-2 transition-colors ${
              activeTab === 'tomorrow' 
                ? 'border-indigo-500 text-indigo-600 bg-indigo-50' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('tomorrow')}
          >
            <div className="flex items-center space-x-2">
              <CalendarDays size={16} />
              <span className="whitespace-nowrap">Tomorrow{tomorrowTasks.length > 0 && ` (${tomorrowTasks.length})`}</span>
            </div>
          </button>
          
          <button
            className={`flex-shrink-0 px-4 py-2 font-medium text-sm rounded-t-md border-b-2 transition-colors ${
              activeTab === 'week' 
                ? 'border-indigo-500 text-indigo-600 bg-indigo-50' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('week')}
          >
            <div className="flex items-center space-x-2">
              <CalendarDays size={16} />
              <span className="whitespace-nowrap">This Week{thisWeekTasks.length > 0 && ` (${thisWeekTasks.length})`}</span>
            </div>
          </button>
          
          <button
            className={`flex-shrink-0 px-4 py-2 font-medium text-sm rounded-t-md border-b-2 transition-colors ${
              activeTab === 'overdue' 
                ? 'border-red-500 text-red-600 bg-red-50' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('overdue')}
          >
            <div className="flex items-center space-x-2">
              <AlertTriangle size={16} className={overdueTasks.length > 0 ? 'text-red-500' : ''} />
              <span className="whitespace-nowrap">Overdue{overdueTasks.length > 0 && ` (${overdueTasks.length})`}</span>
            </div>
          </button>
          
          <button
            className={`flex-shrink-0 px-4 py-2 font-medium text-sm rounded-t-md border-b-2 transition-colors ${
              activeTab === 'all' 
                ? 'border-indigo-500 text-indigo-600 bg-indigo-50' 
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
            onClick={() => setActiveTab('all')}
          >
            <div className="flex items-center space-x-2">
              <Layers size={16} />
              <span className="whitespace-nowrap">All Tasks</span>
            </div>
          </button>
        </div>
      </div>
      
      {/* Add CSS for hiding scrollbar but allowing scroll */}
      <style jsx>{`
        .hide-scrollbar {
          -ms-overflow-style: none;  /* IE and Edge */
          scrollbar-width: none;  /* Firefox */
        }
        .hide-scrollbar::-webkit-scrollbar {
          display: none;  /* Chrome, Safari, Opera */
        }
      `}</style>
      
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
          {parentTasks.length > 0 ? (
            <div>
              {/* For 'All' tab, group by categories */}
              {activeTab === 'all' && (
                <div className="space-y-6">
                  {/* Overdue section */}
                  {overdueTasks.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-red-600 mb-3 flex items-center">
                        <AlertTriangle size={16} className="mr-2" />
                        Overdue
                      </h3>
                      <div className="space-y-2">
                        {overdueTasks
                          .filter(task => !task.parentTaskId)
                          .map(task => (
                            <ImprovedTaskCard
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
                  {todayTasks.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-indigo-600 mb-3 flex items-center">
                        <Calendar size={16} className="mr-2" />
                        Today
                      </h3>
                      <div className="space-y-2">
                        {todayTasks
                          .filter(task => !task.parentTaskId)
                          .map(task => (
                            <ImprovedTaskCard
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
                  {tomorrowTasks.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-indigo-600 mb-3 flex items-center">
                        <CalendarDays size={16} className="mr-2" />
                        Tomorrow
                      </h3>
                      <div className="space-y-2">
                        {tomorrowTasks
                          .filter(task => !task.parentTaskId)
                          .map(task => (
                            <ImprovedTaskCard
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
                  {thisWeekTasks.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-indigo-600 mb-3 flex items-center">
                        <CalendarDays size={16} className="mr-2" />
                        This Week
                      </h3>
                      <div className="space-y-2">
                        {thisWeekTasks
                          .filter(task => !task.parentTaskId)
                          .map(task => (
                            <ImprovedTaskCard
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
                  {otherTasks.filter(t => !t.parentTaskId).length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium text-gray-700 mb-3 flex items-center">
                        <Layers size={16} className="mr-2" />
                        Other Tasks
                      </h3>
                      <div className="space-y-2">
                        {otherTasks
                          .filter(task => !task.parentTaskId)
                          .map(task => (
                            <ImprovedTaskCard
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
                    <ImprovedTaskCard
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
        <StreamlinedTaskForm
          task={editingTask || undefined}
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

export default TasksPage;