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
  MoreHorizontal
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
  const { addTask, updateTask, projects, categories } = useAppContext();
  
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
      
      {/* Advanced options - only visible when toggled */}
      {showAdvanced && (
        <div className="space-y-4 pt-2 border-t border-gray-100">
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
              min="5"
              step="5"
              value={formData.estimatedMinutes || 30}
              onChange={handleChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
        </div>
      )}
      
      {/* Form actions */}
      <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
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
    </form>
  );
};