import React, { useState } from 'react';
import { Task, Project, Category } from '../../types';
import { useAppContext } from '../../context/AppContext';
import Button from '../common/Button';
import { ChevronDown, ChevronRight, Save, Plus, Target, LayoutList, FileText, Circle } from 'lucide-react';
import { generateId } from '../../utils/helpers';

interface ProjectBreakdownProps {
  project: Project;
  onClose?: () => void;
}

interface BreakdownItem {
  id: string;
  title: string;
  type: 'epic' | 'feature' | 'task' | 'subtask';
  parentId: string | null;
  children: BreakdownItem[];
  description?: string;
  expanded?: boolean;
}

const ProjectBreakdown: React.FC<ProjectBreakdownProps> = ({ 
  project,
  onClose
}) => {
  const { addTask, categories } = useAppContext();
  const [breakdownItems, setBreakdownItems] = useState<BreakdownItem[]>([]);
  const [newEpicName, setNewEpicName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  
  const handleAddEpic = () => {
    if (newEpicName.trim()) {
      const newEpic: BreakdownItem = {
        id: generateId(),
        title: newEpicName,
        type: 'epic',
        parentId: null,
        children: [],
        expanded: true
      };
      
      setBreakdownItems([...breakdownItems, newEpic]);
      setNewEpicName('');
    }
  };
  
  const handleAddItem = (parentId: string, type: 'feature' | 'task' | 'subtask') => {
    const findAndUpdateItem = (items: BreakdownItem[]): BreakdownItem[] => {
      return items.map(item => {
        if (item.id === parentId) {
          // Create a new child item
          const newChild: BreakdownItem = {
            id: generateId(),
            title: `New ${type}`,
            type,
            parentId: item.id,
            children: [],
            expanded: true
          };
          
          return {
            ...item,
            children: [...item.children, newChild],
            expanded: true // Auto-expand the parent
          };
        }
        
        if (item.children.length > 0) {
          return {
            ...item,
            children: findAndUpdateItem(item.children)
          };
        }
        
        return item;
      });
    };
    
    setBreakdownItems(findAndUpdateItem(breakdownItems));
  };
  
  const handleDeleteItem = (itemId: string) => {
    const removeItem = (items: BreakdownItem[]): BreakdownItem[] => {
      return items
        .filter(item => item.id !== itemId)
        .map(item => ({
          ...item,
          children: removeItem(item.children)
        }));
    };
    
    setBreakdownItems(removeItem(breakdownItems));
  };
  
  const handleUpdateItem = (itemId: string, updates: Partial<BreakdownItem>) => {
    const updateItemById = (items: BreakdownItem[]): BreakdownItem[] => {
      return items.map(item => {
        if (item.id === itemId) {
          return { ...item, ...updates };
        }
        
        if (item.children.length > 0) {
          return {
            ...item,
            children: updateItemById(item.children)
          };
        }
        
        return item;
      });
    };
    
    setBreakdownItems(updateItemById(breakdownItems));
  };
  
  const handleToggleExpand = (itemId: string) => {
    const toggleExpandState = (items: BreakdownItem[]): BreakdownItem[] => {
      return items.map(item => {
        if (item.id === itemId) {
          return { 
            ...item, 
            expanded: item.expanded === undefined ? true : !item.expanded 
          };
        }
        
        if (item.children.length > 0) {
          return {
            ...item,
            children: toggleExpandState(item.children)
          };
        }
        
        return item;
      });
    };
    
    setBreakdownItems(toggleExpandState(breakdownItems));
  };
  
  const handleToggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };
  
  const handleCreateTasks = () => {
    // Create tasks from the breakdown items
    const createTasksFromBreakdown = (
      items: BreakdownItem[], 
      parentTaskId: string | null = null
    ): string[] => {
      const taskIds: string[] = [];
      
      for (const item of items) {
        // Only create tasks for task/subtask types
        if (item.type === 'task' || item.type === 'subtask') {
          const newTask: Partial<Task> = {
            title: item.title,
            description: item.description || '',
            completed: false,
            archived: false,
            projectId: project.id,
            categoryIds: selectedCategories,
            parentTaskId,
            size: item.type === 'task' ? 'medium' : 'small',
            priority: 'medium',
            energyLevel: 'medium',
          };
          
          const createdTask = addTask(newTask);
          taskIds.push(createdTask.id);
          
          // Recursively create subtasks
          if (item.children.length > 0) {
            createTasksFromBreakdown(item.children, createdTask.id);
          }
        }
        // For epics and features, just process their children
        else if (item.children.length > 0) {
          const childTaskIds = createTasksFromBreakdown(item.children, parentTaskId);
          taskIds.push(...childTaskIds);
        }
      }
      
      return taskIds;
    };
    
    createTasksFromBreakdown(breakdownItems);
    
    if (onClose) {
      onClose();
    }
  };
  
  // Render a single item in the breakdown
  const renderBreakdownItem = (item: BreakdownItem, depth: number = 0) => {
    // Determine if the item has children to show expand/collapse controls
    const hasChildren = item.children.length > 0;
    
    // Determine indentation
    const indentStyle = {
      marginLeft: `${depth * 20}px`,
    };
    
    // Icon by type
    const getItemIcon = () => {
      switch (item.type) {
        case 'epic':
          return <FileText size={16} className="text-purple-600" />;
        case 'feature':
          return <LayoutList size={16} className="text-blue-600" />;
        case 'task':
          return <Target size={16} className="text-green-600" />;
        case 'subtask':
          return <Circle size={16} className="text-gray-600" />;
      }
    };
    
    // Background color by type
    const getItemBgColor = () => {
      switch (item.type) {
        case 'epic':
          return 'bg-purple-50';
        case 'feature':
          return 'bg-blue-50';
        case 'task':
          return 'bg-green-50';
        case 'subtask':
          return 'bg-gray-50';
      }
    };
    
    return (
      <div key={item.id}>
        <div 
          className={`${getItemBgColor()} p-3 rounded-md mb-2 relative group`}
          style={indentStyle}
        >
          <div className="flex items-center">
            {hasChildren && (
              <button
                className="mr-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                onClick={() => handleToggleExpand(item.id)}
              >
                {item.expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            )}
            
            <div className="mr-2">
              {getItemIcon()}
            </div>
            
            <input
              className="flex-grow bg-transparent border-0 focus:ring-0 p-0"
              value={item.title}
              onChange={(e) => handleUpdateItem(item.id, { title: e.target.value })}
              placeholder={`${item.type.charAt(0).toUpperCase() + item.type.slice(1)} title`}
            />
            
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
              {/* Add appropriate subtypes based on the current item type */}
              {item.type === 'epic' && (
                <Button
                  variant="ghost"
                  size="xs"
                  icon={<Plus size={14} />}
                  onClick={() => handleAddItem(item.id, 'feature')}
                >
                  Feature
                </Button>
              )}
              
              {(item.type === 'epic' || item.type === 'feature') && (
                <Button
                  variant="ghost"
                  size="xs"
                  icon={<Plus size={14} />}
                  onClick={() => handleAddItem(item.id, 'task')}
                >
                  Task
                </Button>
              )}
              
              {item.type === 'task' && (
                <Button
                  variant="ghost"
                  size="xs"
                  icon={<Plus size={14} />}
                  onClick={() => handleAddItem(item.id, 'subtask')}
                >
                  Subtask
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="xs"
                className="text-red-500 hover:text-red-700"
                onClick={() => handleDeleteItem(item.id)}
              >
                ✕
              </Button>
            </div>
          </div>
          
          {item.type !== 'subtask' && (
            <div className="mt-2">
              <textarea
                className={`w-full text-sm ${getItemBgColor()} border-0 focus:ring-0 resize-none`}
                value={item.description || ''}
                onChange={(e) => handleUpdateItem(item.id, { description: e.target.value })}
                placeholder="Add a description..."
                rows={1}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = `${target.scrollHeight}px`;
                }}
              />
            </div>
          )}
        </div>
        
        {/* Render children if expanded */}
        {item.expanded && hasChildren && (
          <div>
            {item.children.map(child => renderBreakdownItem(child, depth + 1))}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="space-y-6 bg-white rounded-lg shadow p-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Project Breakdown: {project.name}
        </h2>
        <p className="text-gray-600">
          Break down your project into manageable pieces
        </p>
      </div>
      
      <div className="bg-purple-50 p-4 rounded-md">
        <h3 className="font-medium text-purple-700 flex items-center mb-2">
          <FileText size={18} className="mr-2" />
          Epics
        </h3>
        <p className="text-sm text-purple-900 mb-3">
          Start by adding the major parts of your project as epics. Then break them down into features and tasks.
        </p>
        
        <div className="flex space-x-2">
          <input
            type="text"
            value={newEpicName}
            onChange={(e) => setNewEpicName(e.target.value)}
            className="flex-grow rounded-md border-purple-300 shadow-sm focus:border-purple-500 focus:ring-purple-500 sm:text-sm"
            placeholder="Add a new epic"
          />
          <Button
            variant="secondary"
            onClick={handleAddEpic}
          >
            Add Epic
          </Button>
        </div>
      </div>
      
      <div className="space-y-2">
        {breakdownItems.map(item => renderBreakdownItem(item))}
        
        {breakdownItems.length === 0 && (
          <div className="text-center py-8 text-gray-500 italic">
            Start by adding an epic above
          </div>
        )}
      </div>
      
      {breakdownItems.length > 0 && (
        <div>
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categories
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <div
                  key={category.id}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm cursor-pointer
                    ${selectedCategories.includes(category.id)
                      ? 'text-white'
                      : 'text-gray-700 bg-opacity-25'
                    }`}
                  style={{ 
                    backgroundColor: selectedCategories.includes(category.id) 
                      ? category.color 
                      : `${category.color}40`
                  }}
                  onClick={() => handleToggleCategory(category.id)}
                >
                  <span>{category.name}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button
              variant="primary"
              icon={<Save size={16} />}
              onClick={handleCreateTasks}
            >
              Create Tasks
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectBreakdown;