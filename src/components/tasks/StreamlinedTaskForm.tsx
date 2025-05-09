import React, { useState, useEffect, useCallback } from 'react';
import { Task, Project, Category } from '../../types';
import { useAppContext } from '../../context/AppContext';
import Button from '../common/Button';
import { 
  Calendar, 
  Clock, 
  Folder, 
  Tag, 
  ChevronDown, 
  ChevronUp, 
  Flag,
  Battery,
  AlignJustify,
  MoreHorizontal,
  GitBranch,
  ListChecks,
  Plus,
  X
} from 'lucide-react';

interface StreamlinedTaskFormProps {
  task?: Task;
  parentTask?: Task | null;
  onClose: () => void;
  isEdit?: boolean;
}

export const StreamlinedTaskForm: React.FC<StreamlinedTaskFormProps> = ({
  task,
  parentTask = null,
  onClose,
  isEdit = false,
}) => {
  const { addTask, updateTask, deleteTask, projects, categories, tasks } = useAppContext();
  
  // Advanced mode toggle
  const [showAdvanced, setShowAdvanced] = useState(false);
  
  // Initial form state
  const initialState: Partial<Task> = {
    title: '',
    description: '',
    dueDate: null,
    projectId: parentTask?.projectId || null,
    categoryIds: [],
    parentTaskId: parentTask?.id || null,
    priority: 'medium',
    energyLevel: 'medium',
    size: 'medium',
    estimatedMinutes: 30,
    subtasks: [],
    ...task,
  };
  
  const [formData, setFormData] = useState<Partial<Task>>(initialState);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  
  useEffect(() => {
    // Reset form data when the task prop changes
    if (task) {
      setFormData({ ...task });
      // Show advanced options if they have values
      if (task.energyLevel || task.size || task.estimatedMinutes || task.description) {
        setShowAdvanced(true);
      }
    } else {
      setFormData(initialState);
    }
  }, [task, parentTask]);

  const handleChange = useCallback((
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    
    // Special handling for date inputs
    if (name === 'dueDate') {
      if (!value) {
        setFormData(prev => ({ ...prev, dueDate: null }));
      } else {
        setFormData(prev => ({ ...prev, dueDate: value }));
      }
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  }, [errors]);

  const handleProjectChange = useCallback((e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    setFormData(prev => ({
      ...prev,
      projectId: value === '' ? null : value,
    }));
  }, []);

  const handleCategoryChange = useCallback((categoryId: string) => {
    setFormData(prev => {
      const categoryIds = prev.categoryIds || [];
      if (categoryIds.includes(categoryId)) {
        return {
          ...prev,
          categoryIds: categoryIds.filter(id => id !== categoryId),
        };
      } else {
        return {
          ...prev,
          categoryIds: [...categoryIds, categoryId],
        };
      }
    });
  }, []);
  
  const handlePriorityChange = useCallback((priority: 'low' | 'medium' | 'high') => {
    setFormData(prev => ({ ...prev, priority }));
  }, []);
  
  const handleEnergyLevelChange = useCallback((energyLevel: 'low' | 'medium' | 'high') => {
    setFormData(prev => ({ ...prev, energyLevel }));
  }, []);
  
  const handleSizeChange = useCallback((size: 'small' | 'medium' | 'large') => {
    setFormData(prev => ({ ...prev, size }));
  }, []);
  
  // For subtasks management
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  
  const handleSubtasksChange = useCallback((subtaskIds: string[]) => {
    setFormData(prev => ({
      ...prev,
      subtasks: subtaskIds,
    }));
  }, []);
  
  const [newSubtaskTime, setNewSubtaskTime] = useState<number>(15);
  
  const handleAddSubtask = useCallback(() => {
    if (!newSubtaskTitle.trim() || !task?.id) return;
    
    const timestamp = new Date().toISOString();
    const newTask = addTask({
      title: newSubtaskTitle,
      parentTaskId: task.id,
      completed: false,
      estimatedMinutes: newSubtaskTime,
      createdAt: timestamp,
      updatedAt: timestamp
    });
    
    // Update the parent task's subtask list
    const updatedSubtasks = [...(formData.subtasks || []), newTask.id];
    handleSubtasksChange(updatedSubtasks);
    
    // Clear the input
    setNewSubtaskTitle('');
    setNewSubtaskTime(15); // Reset to default
  }, [newSubtaskTitle, newSubtaskTime, task, formData.subtasks, addTask, handleSubtasksChange]);
  
  const handleRemoveSubtask = useCallback((subtaskId: string) => {
    handleSubtasksChange((formData.subtasks || []).filter(id => id !== subtaskId));
  }, [formData.subtasks, handleSubtasksChange]);

  const validateForm = useCallback((): boolean => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.title?.trim()) {
      newErrors.title = 'Title is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [formData.title]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (isEdit && task) {
      updateTask({ ...task, ...formData } as Task);
    } else {
      addTask(formData);
    }
    
    onClose();
  }, [validateForm, isEdit, task, formData, updateTask, addTask, onClose]);
  
  // Get color based on priority
  const getPriorityColor = useCallback((priority: string | undefined): string => {
    switch (priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-orange-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-400';
    }
  }, []);
  
  // Get color based on energy level
  const getEnergyLevelColor = useCallback((level: string | undefined): string => {
    switch (level) {
      case 'high': return 'bg-yellow-500';
      case 'medium': return 'bg-blue-500';
      case 'low': return 'bg-purple-500';
      default: return 'bg-gray-400';
    }
  }, []);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Task title - always visible and focused */}
      <div>
        <input
          type="text"
          id="title"
          name="title"
          value={formData.title || ''}
          onChange={handleChange}
          className={`block w-full text-lg rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 ${
            errors.title ? 'border-red-500' : ''
          }`}
          placeholder="What do you need to do?"
          autoFocus
        />
        {errors.title && (
          <p className="mt-1 text-sm text-red-500">{errors.title}</p>
        )}
      </div>
      
      {/* Essential task information - always visible */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {/* Due date with quick date buttons */}
        <div>
          <div className="flex items-center mb-1">
            <Calendar size={18} className="text-gray-400 mr-2" />
            <input
              type="date"
              id="dueDate"
              name="dueDate"
              value={formData.dueDate || ''}
              onChange={handleChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Due date"
            />
          </div>
          <div className="flex space-x-2 mt-1">
            <button
              type="button"
              onClick={() => {
                const today = new Date();
                const formattedDate = today.toISOString().split('T')[0];
                setFormData(prev => ({ ...prev, dueDate: formattedDate }));
              }}
              className={`px-2 py-1 rounded text-xs font-medium ${
                formData.dueDate === new Date().toISOString().split('T')[0]
                  ? 'bg-indigo-500 text-white'
                  : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200'
              }`}
            >
              Today
            </button>
            
            <button
              type="button"
              onClick={() => {
                const tomorrow = new Date();
                tomorrow.setDate(tomorrow.getDate() + 1);
                const formattedDate = tomorrow.toISOString().split('T')[0];
                setFormData(prev => ({ ...prev, dueDate: formattedDate }));
              }}
              className={`px-2 py-1 rounded text-xs font-medium ${
                (() => {
                  const tomorrow = new Date();
                  tomorrow.setDate(tomorrow.getDate() + 1);
                  const formattedTomorrow = tomorrow.toISOString().split('T')[0];
                  return formData.dueDate === formattedTomorrow ? 'bg-indigo-500 text-white' : 'bg-indigo-100 text-indigo-800 hover:bg-indigo-200';
                })()
              }`}
            >
              Tomorrow
            </button>
            
            <button
              type="button"
              onClick={() => {
                const nextWeek = new Date();
                nextWeek.setDate(nextWeek.getDate() + 7);
                const formattedDate = nextWeek.toISOString().split('T')[0];
                setFormData(prev => ({ ...prev, dueDate: formattedDate }));
              }}
              className="px-2 py-1 rounded text-xs font-medium bg-indigo-100 text-indigo-800 hover:bg-indigo-200"
            >
              Next Week
            </button>
            
            <button
              type="button"
              onClick={() => {
                setFormData(prev => ({ ...prev, dueDate: null }));
              }}
              className="px-2 py-1 rounded text-xs font-medium bg-gray-100 text-gray-800 hover:bg-gray-200"
            >
              No Date
            </button>
          </div>
        </div>
        
        {/* Project selection */}
        <div>
          <div className="flex items-center">
            <Folder size={18} className="text-gray-400 mr-2" />
            <select
              id="project"
              name="project"
              value={formData.projectId || ''}
              onChange={handleProjectChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">No Project</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>
      
      {/* Priority selection - visual buttons */}
      <div className="flex space-x-2">
        <span className="text-sm text-gray-500 flex items-center mr-1">
          <Flag size={16} className="mr-1" /> Priority:
        </span>
        
        <button
          type="button"
          onClick={() => handlePriorityChange('low')}
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            formData.priority === 'low' 
              ? 'bg-green-500 text-white' 
              : 'bg-green-100 text-green-800'
          }`}
        >
          Low
        </button>
        
        <button
          type="button"
          onClick={() => handlePriorityChange('medium')}
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            formData.priority === 'medium' 
              ? 'bg-orange-500 text-white' 
              : 'bg-orange-100 text-orange-800'
          }`}
        >
          Medium
        </button>
        
        <button
          type="button"
          onClick={() => handlePriorityChange('high')}
          className={`px-3 py-1 rounded-full text-xs font-medium ${
            formData.priority === 'high' 
              ? 'bg-red-500 text-white' 
              : 'bg-red-100 text-red-800'
          }`}
        >
          High
        </button>
      </div>
      
      {/* Categories - simplified visual selection */}
      {categories.length > 0 && (
        <div>
          <div className="flex items-center mb-2">
            <Tag size={16} className="text-gray-400 mr-1" />
            <span className="text-sm text-gray-500">Categories:</span>
          </div>
          <div className="flex flex-wrap gap-1.5">
            {categories.map(category => (
              <div
                key={category.id}
                className={`inline-flex items-center px-2 py-1 rounded-full text-xs cursor-pointer transition-colors ${
                  (formData.categoryIds?.includes(category.id) || false)
                    ? 'text-white shadow-sm'
                    : 'text-gray-700 bg-opacity-20'
                }`}
                style={{ 
                  backgroundColor: (formData.categoryIds?.includes(category.id) || false)
                    ? category.color 
                    : `${category.color}30`
                }}
                onClick={() => handleCategoryChange(category.id)}
              >
                <span>{category.name}</span>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Toggle for advanced options */}
      <button
        type="button"
        className="flex items-center text-sm text-gray-500 hover:text-gray-700 mt-2 focus:outline-none"
        onClick={() => setShowAdvanced(!showAdvanced)}
      >
        {showAdvanced ? (
          <>
            <ChevronUp size={16} className="mr-1" />
            Hide advanced options
          </>
        ) : (
          <>
            <ChevronDown size={16} className="mr-1" />
            Show advanced options
          </>
        )}
      </button>
      
      {/* Subtasks section - always visible for existing tasks */}
      {isEdit && task?.id && (
        <div className="mt-4 pt-3 pb-2 border-t border-gray-200">
          <div className="flex items-center mb-2">
            <ListChecks size={16} className="text-blue-500 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Subtasks</h3>
          </div>
          <p className="text-sm text-gray-500 mb-3">Break this task down into smaller, more manageable steps.</p>
          
          {/* List existing subtasks */}
          {formData.subtasks && formData.subtasks.length > 0 ? (
            <div className="mb-3 space-y-1">
              {tasks
                .filter(t => formData.subtasks?.includes(t.id))
                .map(subtask => (
                  <div key={subtask.id} className="bg-blue-50 p-2 rounded-md">
                    <div className="flex items-center justify-between">
                      <span className={`text-sm flex-grow ${subtask.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                        {subtask.title}
                      </span>
                      
                      <div className="flex items-center space-x-2">
                        {/* Time estimate display and editor */}
                        <div className="flex items-center bg-white rounded px-2 py-1 border border-gray-200">
                          <Clock size={14} className="text-blue-500 mr-1" />
                          <input 
                            type="number"
                            min="1"
                            step="1"
                            value={subtask.estimatedMinutes || 15}
                            onChange={(e) => {
                              const value = parseInt(e.target.value);
                              // Create an updated version of the subtask
                              const updatedSubtask = {
                                ...subtask,
                                estimatedMinutes: isNaN(value) ? 15 : value
                              };
                              // Update the subtask
                              updateTask(updatedSubtask);
                            }}
                            className="w-12 text-xs text-right border-0 p-0 focus:ring-0"
                            title="Estimated minutes"
                          />
                          <span className="text-xs ml-1">min</span>
                        </div>
                        
                        {/* Delete button */}
                        <button
                          type="button"
                          onClick={() => handleRemoveSubtask(subtask.id)}
                          className="text-gray-400 hover:text-red-500"
                          title="Remove subtask"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))
              }
            </div>
          ) : (
            <p className="text-sm text-blue-500 mb-3">No subtasks yet. Break down this task into smaller steps.</p>
          )}
          
          {/* Add new subtask input with time estimate */}
          <div className="space-y-2 mb-4">
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={newSubtaskTitle}
                onChange={(e) => setNewSubtaskTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSubtask();
                  }
                }}
                placeholder="Add a subtask..."
                className="flex-grow rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
              />
              
              {/* Time input for new subtask */}
              <div className="flex items-center bg-white rounded px-2 py-1 border border-gray-200">
                <Clock size={14} className="text-blue-500 mr-1" />
                <input 
                  type="number"
                  min="1"
                  step="1"
                  value={newSubtaskTime}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setNewSubtaskTime(isNaN(value) ? 15 : value);
                  }}
                  className="w-14 text-xs text-right border border-gray-200 rounded p-1"
                  title="Estimated minutes"
                />
                <span className="text-xs ml-1">min</span>
              </div>
              
              <Button
                type="button"
                variant="secondary"
                size="sm"
                onClick={handleAddSubtask}
                className="flex items-center"
              >
                <Plus size={16} className="mr-1" />
                Add
              </Button>
            </div>
            <p className="text-xs text-gray-500">Enter the task and estimated time in minutes</p>
          </div>
        </div>
      )}
      
      {/* Advanced options - only visible when toggled */}
      {showAdvanced && (
        <div className="space-y-4 pt-2 border-t border-gray-100">
          {/* Parent Task Selection - Only show when creating new task (not editing) */}
          {!isEdit && (
            <div>
              <div className="flex items-center mb-1">
                <GitBranch size={14} className="text-gray-400 mr-1" />
                <label htmlFor="parentTask" className="text-sm text-gray-500">
                  Parent Task (create as subtask of)
                </label>
              </div>
              <select
                id="parentTask"
                name="parentTask"
                value={formData.parentTaskId || ''}
                onChange={(e) => {
                  const value = e.target.value;
                  setFormData(prev => ({
                    ...prev,
                    parentTaskId: value === '' ? null : value,
                  }));
                }}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              >
                <option value="">None (top-level task)</option>
                {tasks
                  .filter(t => !t.completed && !t.parentTaskId) // Only show non-completed, top-level tasks
                  .map(parentTask => (
                    <option key={parentTask.id} value={parentTask.id}>
                      {parentTask.title}
                    </option>
                  ))
                }
              </select>
              
              {formData.parentTaskId && (
                <p className="mt-1 text-xs text-indigo-600">
                  This will be created as a subtask
                </p>
              )}
            </div>
          )}
          
          {/* Description */}
          <div>
            <div className="flex items-center mb-1">
              <AlignJustify size={14} className="text-gray-400 mr-1" />
              <label htmlFor="description" className="text-sm text-gray-500">
                Description
              </label>
            </div>
            <textarea
              id="description"
              name="description"
              rows={3}
              value={formData.description || ''}
              onChange={handleChange}
              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Add details about this task"
            />
          </div>
          
          {/* Energy level */}
          <div>
            <div className="flex items-center mb-2">
              <Battery size={14} className="text-gray-400 mr-1" />
              <span className="text-sm text-gray-500">Energy Required:</span>
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => handleEnergyLevelChange('low')}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  formData.energyLevel === 'low' 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-purple-100 text-purple-800'
                }`}
              >
                Low
              </button>
              
              <button
                type="button"
                onClick={() => handleEnergyLevelChange('medium')}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  formData.energyLevel === 'medium' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                Medium
              </button>
              
              <button
                type="button"
                onClick={() => handleEnergyLevelChange('high')}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  formData.energyLevel === 'high' 
                    ? 'bg-yellow-500 text-white' 
                    : 'bg-yellow-100 text-yellow-800'
                }`}
              >
                High
              </button>
            </div>
          </div>
          
          {/* Task size */}
          <div>
            <div className="flex items-center mb-2">
              <MoreHorizontal size={14} className="text-gray-400 mr-1" />
              <span className="text-sm text-gray-500">Task Size:</span>
            </div>
            <div className="flex space-x-2">
              <button
                type="button"
                onClick={() => handleSizeChange('small')}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  formData.size === 'small' 
                    ? 'bg-green-500 text-white' 
                    : 'bg-green-100 text-green-800'
                }`}
              >
                Small
              </button>
              
              <button
                type="button"
                onClick={() => handleSizeChange('medium')}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  formData.size === 'medium' 
                    ? 'bg-blue-500 text-white' 
                    : 'bg-blue-100 text-blue-800'
                }`}
              >
                Medium
              </button>
              
              <button
                type="button"
                onClick={() => handleSizeChange('large')}
                className={`px-3 py-1 rounded-full text-xs font-medium ${
                  formData.size === 'large' 
                    ? 'bg-purple-500 text-white' 
                    : 'bg-purple-100 text-purple-800'
                }`}
              >
                Large
              </button>
            </div>
          </div>
          
          {/* Time estimate */}
          <div>
            <div className="flex items-center mb-1">
              <Clock size={14} className="text-gray-400 mr-1" />
              <label htmlFor="estimatedMinutes" className="text-sm text-gray-500">
                Estimated Time (minutes)
              </label>
            </div>
            <input
              type="number"
              id="estimatedMinutes"
              name="estimatedMinutes"
              min="1"
              step="1"
              value={formData.estimatedMinutes || 30}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                setFormData(prev => ({
                  ...prev,
                  estimatedMinutes: isNaN(value) ? 30 : value
                }));
              }}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>
      )}
      
      {/* Form actions */}
      <div className="pt-4 border-t border-gray-200 flex justify-between">
        {/* Delete button (only show when editing) */}
        {isEdit && task && (
          <Button
            type="button"
            variant="danger"
            onClick={() => {
              if (window.confirm('Are you sure you want to delete this task?')) {
                deleteTask(task.id);
                onClose();
              }
            }}
          >
            Delete Task
          </Button>
        )}

        <div className="flex space-x-3">
          <Button
            type="button"
            variant="secondary"
            onClick={onClose}
          >
            Cancel
          </Button>
          <Button
            type="submit"
            variant="primary"
          >
            {isEdit ? 'Update Task' : 'Create Task'}
          </Button>
        </div>
      </div>
    </form>
  );
};