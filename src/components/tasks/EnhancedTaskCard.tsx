import React, { useState } from 'react';
import { Task, Project, Category } from '../../types';
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
  Zap, 
  BarChart,
  AlertTriangle
} from 'lucide-react';
import Badge from '../common/Badge';
import { formatDateForDisplay } from '../../utils/helpers';
import { useAppContext } from '../../context/AppContext';

interface EnhancedTaskCardProps {
  task: Task;
  projects: Project[];
  categories: Category[];
  isSubtask?: boolean;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

const EnhancedTaskCard: React.FC<EnhancedTaskCardProps> = ({
  task,
  projects,
  categories,
  isSubtask = false,
  onEdit,
  onDelete,
}) => {
  const [expanded, setExpanded] = useState(false);
  const { completeTask, tasks } = useAppContext();
  
  // Check if the task is overdue
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const isOverdue = task.dueDate && 
    new Date(task.dueDate) < today && 
    !task.completed;
  
  // Check if the task is due today
  const isToday = task.dueDate && 
    new Date(task.dueDate).toDateString() === today.toDateString() &&
    !task.completed;
    
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
  
  // Get priority color and styles
  const getPriorityColor = () => {
    if (!task.priority) return 'bg-gray-100 text-gray-600';
    
    switch (task.priority) {
      case 'high':
        return 'bg-red-100 text-red-600';
      case 'medium':
        return 'bg-orange-100 text-orange-600';
      case 'low':
        return 'bg-green-100 text-green-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };
  
  // Get energy level styles
  const getEnergyLevelColor = () => {
    if (!task.energyLevel) return 'bg-gray-100 text-gray-600';
    
    switch (task.energyLevel) {
      case 'high':
        return 'bg-yellow-100 text-yellow-600';
      case 'medium':
        return 'bg-blue-100 text-blue-600';
      case 'low':
        return 'bg-purple-100 text-purple-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };
  
  // Get task size styles
  const getTaskSizeColor = () => {
    if (!task.size) return 'bg-gray-100 text-gray-600';
    
    switch (task.size) {
      case 'large':
        return 'bg-indigo-100 text-indigo-600';
      case 'medium':
        return 'bg-blue-100 text-blue-600';
      case 'small':
        return 'bg-teal-100 text-teal-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };
  
  // Get card border style based on completion and due date
  const getCardBorderStyle = () => {
    if (task.completed) return 'border-green-500 bg-green-50';
    if (isOverdue) return 'border-red-500 bg-red-50';
    if (isToday) return 'border-yellow-500 bg-yellow-50';
    return 'border-indigo-500';
  };
  
  return (
    <div 
      className={`bg-white rounded-lg shadow-sm p-4 mb-3 border-l-4 transition-all ${
        getCardBorderStyle()
      } ${isSubtask ? 'ml-6' : ''}`}
    >
      <div className="flex items-start">
        <button 
          className="mr-3 mt-1 flex-shrink-0 focus:outline-none" 
          onClick={handleComplete}
        >
          {task.completed ? (
            <CheckCircle2 className="h-5 w-5 text-green-500" />
          ) : (
            <Circle className="h-5 w-5 text-gray-400 hover:text-indigo-500" />
          )}
        </button>
        
        <div className="flex-grow">
          <div 
            className="flex items-start justify-between cursor-pointer"
            onClick={handleEdit}
          >
            <div>
              <div className="flex items-center flex-wrap gap-2">
                <h3 className={`text-lg font-medium ${
                  task.completed ? 'line-through text-gray-500' : 
                  isOverdue ? 'text-red-600' : 
                  isToday ? 'font-semibold' : 
                  'text-gray-900'
                }`}>
                  {task.title}
                </h3>
                
                {/* Status indicators */}
                <div className="flex flex-wrap gap-1">
                  {isOverdue && !task.completed && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 text-red-800">
                      <AlertTriangle size={12} className="mr-1" />
                      Overdue
                    </span>
                  )}
                  
                  {isToday && !task.completed && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                      Today
                    </span>
                  )}
                  
                  {task.priority && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getPriorityColor()}`}>
                      <BarChart size={12} className="mr-1" />
                      {task.priority === 'high' ? 'High' : task.priority === 'medium' ? 'Medium' : 'Low'}
                    </span>
                  )}
                  
                  {task.energyLevel && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getEnergyLevelColor()}`}>
                      <Zap size={12} className="mr-1" />
                      {task.energyLevel === 'high' ? 'High energy' : task.energyLevel === 'medium' ? 'Med energy' : 'Low energy'}
                    </span>
                  )}
                  
                  {task.estimatedMinutes && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-800">
                      <Clock size={12} className="mr-1" />
                      {task.estimatedMinutes < 60 
                        ? `${task.estimatedMinutes}m` 
                        : `${Math.floor(task.estimatedMinutes / 60)}h ${task.estimatedMinutes % 60 > 0 ? `${task.estimatedMinutes % 60}m` : ''}`}
                    </span>
                  )}
                  
                  {task.size && (
                    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${getTaskSizeColor()}`}>
                      {task.size === 'small' ? 'Small' : task.size === 'medium' ? 'Medium' : 'Large'} task
                    </span>
                  )}
                </div>
              </div>
              
              {task.description && (
                <p className={`mt-1 text-sm ${task.completed ? 'text-gray-400' : 'text-gray-500'}`}>
                  {task.description}
                </p>
              )}
              
              <div className="mt-2 flex flex-wrap gap-2 items-center">
                {task.dueDate && (
                  <div className={`flex items-center text-xs ${
                    isOverdue ? 'text-red-500 font-semibold' : 
                    isToday ? 'text-yellow-700 font-semibold' : 
                    'text-gray-500'
                  }`}>
                    <Calendar size={14} className="mr-1" />
                    {formatDateForDisplay(task.dueDate)}
                  </div>
                )}
                
                {project && (
                  <div className="flex items-center text-xs">
                    <Folder size={14} className="mr-1" style={{ color: project.color }} />
                    <span style={{ color: project.color }}>{project.name}</span>
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

            <div className="flex space-x-2">
              {onDelete && (
                <button
                  onClick={handleDelete}
                  className="p-1 text-gray-400 hover:text-red-500 rounded"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
          
          {task.subtasks?.length > 0 && (
            <div className="mt-3">
              <button
                className="flex items-center text-sm text-gray-500 hover:text-gray-700"
                onClick={toggleExpand}
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
                    <EnhancedTaskCard
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

export default EnhancedTaskCard;