import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import { Task } from '../types';
import TaskCard from '../components/tasks/TaskCard';
import TaskForm from '../components/tasks/TaskForm';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Card from '../components/common/Card';
import Empty from '../components/common/Empty';
import { Plus, Filter, CheckSquare, Clock, X, Undo2 } from 'lucide-react';

const TasksPage: React.FC = () => {
  const { tasks, projects, categories, deleteTask, undoDelete, hasRecentlyDeleted } = useAppContext();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [showUndoNotification, setShowUndoNotification] = useState(false);
  
  // Filter state
  const [showCompleted, setShowCompleted] = useState(false);
  const [filterProjectId, setFilterProjectId] = useState<string | null>(null);
  const [filterCategoryId, setFilterCategoryId] = useState<string | null>(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  
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
    setFilterProjectId(null);
    setFilterCategoryId(null);
  };
  
  // Filter tasks
  const filteredTasks = tasks.filter(task => {
    // Filter by completion status
    if (!showCompleted && task.completed) {
      return false;
    }
    
    // Filter by project
    if (filterProjectId && task.projectId !== filterProjectId) {
      return false;
    }
    
    // Filter by category
    if (filterCategoryId && !task.categoryIds.includes(filterCategoryId)) {
      return false;
    }
    
    return true;
  });
  
  // Group tasks by parent/child
  const parentTasks = filteredTasks.filter(task => !task.parentTaskId);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center bg-white rounded-lg shadow-sm p-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">All Tasks</h1>
          <p className="text-gray-600">
            {filteredTasks.length} task{filteredTasks.length !== 1 ? 's' : ''}
            {(filterProjectId || filterCategoryId || showCompleted) && ' (filtered)'}
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2">
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
                  Completion Status
                </label>
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
      <div className="space-y-4">
        {parentTasks.length > 0 ? (
          parentTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              projects={projects}
              categories={categories}
              onEdit={handleOpenModal}
              onDelete={handleDeleteTask}
            />
          ))
        ) : (
          <Empty
            title="No tasks found"
            description={
              filterProjectId || filterCategoryId || showCompleted
                ? "Try adjusting your filters or create a new task"
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
      
      {/* Task Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingTask ? 'Edit Task' : 'Create New Task'}
      >
        <TaskForm
          task={editingTask || undefined}
          onClose={handleCloseModal}
          isEdit={!!editingTask}
        />
      </Modal>
    </div>
  );
};

export default TasksPage;