import React, { useState } from 'react';
import { 
  CheckCircle2, 
  Circle, 
  ChevronRight, 
  ChevronDown, 
  Calendar, 
  Folder, 
  Tags, 
  Trash2, 
  Clock,
  Edit2,
  ArrowRight,
  Copy,
  Flag,
  MoreHorizontal
} from 'lucide-react';
import { Task, Project, Category } from '../../types';
import Badge from '../common/Badge';
import { formatDateForDisplay } from '../../utils/helpers';
import { useAppContext } from '../../context/AppContext';

interface ImprovedTaskCardProps {
  task: Task;
  projects: Project[];
  categories: Category[];
  isSubtask?: boolean;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

export const ImprovedTaskCard: React.FC<ImprovedTaskCardProps> = ({
  task,
  projects,
  categories,
  isSubtask = false,
  onEdit,
  onDelete,
}) => {
  const [expanded, setExpanded] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const { completeTask, tasks, addTask } = useAppContext();
  
  const project = task.projectId 
    ? projects.find(p => p.id === task.projectId) 
    : null;
  
  const taskCategories = categories.filter(c => 
    task.categoryIds?.includes(c.id) || false
  );
  
  const subtasks = tasks.filter(t => 
    task.subtasks?.includes(t.id) || false
  );
  
  const toggleExpand = () => {
    setExpanded(!expanded);
  };
  
  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    completeTask(task.id);
  };
  
  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit) {
      onEdit(task);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onDelete) {
      onDelete(task.id);
    }
  };
  
  const handlePostpone = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onEdit && task.dueDate) {
      // Create a new date from the current due date and add one day
      const currentDate = new Date(task.dueDate);
      currentDate.setDate(currentDate.getDate() + 1);
      
      // Format as YYYY-MM-DD
      const newDate = currentDate.toISOString().split('T')[0];
      
      // Create a modified task with the new due date
      const postponedTask = {
        ...task,
        dueDate: newDate
      };
      
      onEdit(postponedTask);
    }
  };
  
  const handleDuplicate = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    // Create a duplicate without the ID, completed and archived flags
    const duplicateTask: Partial<Task> = {
      title: `${task.title} (copy)`,
      description: task.description,
      dueDate: task.dueDate,
      projectId: task.projectId,
      categoryIds: task.categoryIds,
      parentTaskId: task.parentTaskId,
      priority: task.priority,
      energyLevel: task.energyLevel,
      size: task.size,
      estimatedMinutes: task.estimatedMinutes,
      completed: false,
      archived: false
    };
    
    addTask(duplicateTask);
  };
  
  // Determine priority color
  const getPriorityColor = () => {
    switch (task.priority) {
      case 'high': return 'bg-red-500';
      case 'medium': return 'bg-orange-500';
      case 'low': return 'bg-green-500';
      default: return 'bg-gray-400';
    }
  };
  
  // Format due date with color based on urgency
  const renderDueDate = () => {
    if (!task.dueDate) return null;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Parse the task due date from YYYY-MM-DD format
    const [year, month, day] = task.dueDate.split('-').map(num => parseInt(num, 10));
    const dueDate = new Date(year, month - 1, day); // Month is 0-indexed in JS Date
    dueDate.setHours(0, 0, 0, 0);
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    
    let textColor = 'text-gray-500';
    
    if (dueDate < today) {
      textColor = 'text-red-600 font-medium';
    } else if (dueDate.getTime() === today.getTime()) {
      textColor = 'text-green-600 font-medium'; // Changed to green for today's tasks
    } else if (dueDate.getTime() === tomorrow.getTime()) {
      textColor = 'text-orange-500';
    }
    
    return (
      <div className={`flex items-center text-xs ${textColor}`}>
        <Calendar size={14} className="mr-1" />
        {formatDateForDisplay(task.dueDate)}
      </div>
    );
  };
  
  // Check if task is due today
  const isDueToday = () => {
    if (!task.dueDate) return false;
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const [year, month, day] = task.dueDate.split('-').map(num => parseInt(num, 10));
    const dueDate = new Date(year, month - 1, day);
    dueDate.setHours(0, 0, 0, 0);
    
    return dueDate.getTime() === today.getTime();
  };
  
  return (
    <div 
      className={`bg-white rounded-lg shadow-sm p-4 mb-3 border-l-4 hover:shadow transition-all ${
        task.completed ? 'border-green-500 bg-green-50' : 
        isDueToday() ? 'border-green-500' :
        task.priority === 'high' ? 'border-red-500' : 
        task.priority === 'medium' ? 'border-orange-500' : 
        'border-indigo-500'
      } ${isSubtask ? 'ml-6' : ''}`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
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
                
                {task.priority && (
                  <div className={`ml-2 w-2 h-2 rounded-full ${getPriorityColor()}`} />
                )}
              </div>
              
              {task.description && (
                <p className={`mt-1 text-sm ${task.completed ? 'text-gray-400' : 'text-gray-600'}`}>
                  {task.description.length > 100 
                    ? `${task.description.substring(0, 100)}...` 
                    : task.description}
                </p>
              )}
              
              <div className="mt-2 flex flex-wrap gap-2 items-center">
                {renderDueDate()}
                
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

            {showActions && (
              <div className="flex space-x-1 ml-2">
                {!task.completed && task.dueDate && (
                  <button
                    onClick={handlePostpone}
                    className="p-1.5 text-gray-400 hover:text-indigo-500 rounded transition-colors hover:bg-indigo-50"
                    title="Postpone by 1 day"
                  >
                    <ArrowRight size={16} />
                  </button>
                )}
                
                <button
                  onClick={handleEdit}
                  className="p-1.5 text-gray-400 hover:text-indigo-500 rounded transition-colors hover:bg-indigo-50"
                  title="Edit task"
                >
                  <Edit2 size={16} />
                </button>
                
                <button
                  onClick={handleDuplicate}
                  className="p-1.5 text-gray-400 hover:text-indigo-500 rounded transition-colors hover:bg-indigo-50"
                  title="Duplicate task"
                >
                  <Copy size={16} />
                </button>
                
                {onDelete && (
                  <button
                    onClick={handleDelete}
                    className="p-1.5 text-gray-400 hover:text-red-500 rounded transition-colors hover:bg-red-50"
                    title="Delete task"
                  >
                    <Trash2 size={16} />
                  </button>
                )}
              </div>
            )}
          </div>
          
          {task.subtasks?.length > 0 && (
            <div className="mt-3">
              <button
                className="flex items-center text-sm text-gray-500 hover:text-gray-700"
                onClick={toggleExpand}
                aria-expanded={expanded}
                aria-label={expanded ? "Collapse subtasks" : "Expand subtasks"}
              >
                {expanded ? (
                  <ChevronDown size={16} className="mr-1" />
                ) : (
                  <ChevronRight size={16} className="mr-1" />
                )}
                <span>
                  {task.subtasks?.length} subtask{task.subtasks?.length !== 1 ? 's' : ''}
                </span>
              </button>
              
              {expanded && (
                <div className="mt-2">
                  {subtasks.map(subtask => (
                    <ImprovedTaskCard
                      key={subtask.id}
                      task={subtask}
                      projects={projects}
                      categories={categories}
                      isSubtask={true}
                      onEdit={onEdit}
                      onDelete={onDelete}
                    />
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ImprovedTaskCard;