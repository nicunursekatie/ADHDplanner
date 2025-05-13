import React, { memo, useMemo } from 'react';
import {
  CheckCircle2,
  Circle,
  Calendar,
  Folder,
  Tags,
  Clock,
  Edit2,
  Trash2
} from 'lucide-react';
import { Task, Project, Category } from '../../types';
import Badge from '../common/Badge';
import { formatDateForDisplay } from '../../utils/helpers';

interface LightweightTaskCardProps {
  task: Task;
  projects: Project[];
  categories: Category[];
  onEdit: (task: Task) => void;
  onDelete: (taskId: string) => void;
}

/**
 * A lightweight task card component optimized for performance.
 * Uses heavy memoization and minimal processing to reduce re-renders.
 */
const LightweightTaskCard: React.FC<LightweightTaskCardProps> = memo(({
  task,
  projects,
  categories,
  onEdit,
  onDelete
}) => {
  // Memoize expensive lookups
  const project = useMemo(() => {
    return task.projectId ? projects.find(p => p.id === task.projectId) : null;
  }, [task.projectId, projects]);
  
  const taskCategories = useMemo(() => {
    return task.categoryIds?.length 
      ? categories.filter(c => task.categoryIds?.includes(c.id))
      : [];
  }, [task.categoryIds, categories]);
  
  // Determine task card border color based on status and priority
  const borderColor = useMemo(() => {
    if (task.completed) return 'border-green-500 bg-green-50';
    
    // Check if due today
    if (task.dueDate) {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const [year, month, day] = task.dueDate.split('-').map(num => parseInt(num, 10));
      const dueDate = new Date(year, month - 1, day);
      dueDate.setHours(0, 0, 0, 0);
      
      if (dueDate.getTime() === today.getTime()) {
        return 'border-green-500';
      }
      
      if (dueDate < today) {
        return 'border-red-500';
      }
    }
    
    switch (task.priority) {
      case 'high': return 'border-red-500';
      case 'medium': return 'border-orange-500';
      default: return 'border-indigo-500';
    }
  }, [task.completed, task.dueDate, task.priority]);
  
  // Render date info
  const dateInfo = useMemo(() => {
    if (!task.dueDate) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [year, month, day] = task.dueDate.split('-').map(num => parseInt(num, 10));
    const dueDate = new Date(year, month - 1, day);
    dueDate.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let textColor = 'text-gray-500';
    
    if (dueDate < today) {
      textColor = 'text-red-600 font-medium';
    } else if (dueDate.getTime() === today.getTime()) {
      textColor = 'text-green-600 font-medium';
    } else if (dueDate.getTime() === tomorrow.getTime()) {
      textColor = 'text-orange-500';
    }
    
    return (
      <div className={`flex items-center text-xs ${textColor}`}>
        <Calendar size={14} className="mr-1" />
        {formatDateForDisplay(task.dueDate)}
      </div>
    );
  }, [task.dueDate]);
  
  // Event handlers
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    onEdit(task);
  };
  
  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDelete(task.id);
  };
  
  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    // We don't handle completion here to simplify the component
    // Just prevent event bubbling
  };
  
  return (
    <div 
      className={`bg-white rounded-lg shadow-sm p-4 mb-3 border-l-4 hover:shadow transition-all ${borderColor}`}
    >
      <div className="flex items-start">
        <button 
          className="mr-3 mt-1 flex-shrink-0 focus:outline-none group" 
          onClick={handleComplete}
          aria-label={task.completed ? "Mark as incomplete" : "Mark as complete"}
        >
          {task.completed ? (
            <CheckCircle2 className="h-5 w-5 text-green-500 group-hover:text-green-600" />
          ) : (
            <Circle className="h-5 w-5 text-gray-400 group-hover:text-indigo-500" />
          )}
        </button>
        
        <div className="flex-grow">
          <div 
            className="flex items-start justify-between cursor-pointer"
            onClick={handleEdit}
          >
            <div className="flex-grow">
              <div className="flex items-center">
                <h3 className={`text-lg font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                  {task.title}
                </h3>
              </div>
              
              {task.description && (
                <p className={`mt-1 text-sm ${task.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                  {task.description.length > 100 
                    ? `${task.description.substring(0, 100)}...` 
                    : task.description}
                </p>
              )}
              
              <div className="mt-2 flex flex-wrap gap-2 items-center">
                {dateInfo}
                
                {project && (
                  <div className="flex items-center text-xs">
                    <Folder size={14} className="mr-1" style={{ color: project.color }} />
                    <span style={{ color: project.color }}>{project.name}</span>
                  </div>
                )}
                
                {task.estimatedMinutes && (
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock size={14} className="mr-1" />
                    {task.estimatedMinutes} min
                  </div>
                )}
                
                {taskCategories.length > 0 && (
                  <div className="flex items-center gap-1">
                    <Tags size={14} className="text-gray-400" />
                    {taskCategories.map(category => (
                      <Badge 
                        key={category.id}
                        text={category.name}
                        bgColor={category.color}
                      />
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="flex space-x-1 ml-2">
              <button
                onClick={handleEdit}
                className="p-1.5 text-gray-400 hover:text-indigo-500 rounded transition-colors hover:bg-indigo-50"
                title="Edit task"
              >
                <Edit2 size={16} />
              </button>
              
              <button
                onClick={handleDelete}
                className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors hover:bg-red-50"
                title="Delete task"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
          
          {task.subtasks?.length > 0 && (
            <div className="mt-2 border-l-2 border-gray-200 pl-2">
              <div className="text-xs text-gray-500 italic">
                Has {task.subtasks.length} subtask{task.subtasks.length !== 1 ? 's' : ''}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
});

export default LightweightTaskCard;