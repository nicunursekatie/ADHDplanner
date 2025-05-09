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
  AlertTriangle,
  Plus,
  ListPlus,
  Timer
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
  const [showSubtaskInput, setShowSubtaskInput] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  const [newSubtaskTime, setNewSubtaskTime] = useState<number>(15);
  const { completeTask, tasks, addSubtask } = useAppContext();
  
  // Calculate total time of all subtasks
  const totalSubtaskTime = tasks
    .filter(t => task.subtasks?.includes(t.id))
    .reduce((total, subtask) => total + (subtask.estimatedMinutes || 0), 0);
  
  // Check if the task is overdue or due today
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  let isOverdue = false;
  let isToday = false;
  
  if (task.dueDate && !task.completed) {
    // Parse the task due date from YYYY-MM-DD format
    const [year, month, day] = task.dueDate.split('-').map(num => parseInt(num, 10));
    const dueDate = new Date(year, month - 1, day); // Month is 0-indexed in JS Date
    dueDate.setHours(0, 0, 0, 0);
    
    // Task is overdue if due date is before today
    isOverdue = dueDate < today;
    
    // Task is due today if the dates are equal
    isToday = dueDate.getTime() === today.getTime();
  }
    
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
  
  const toggleSubtaskInput = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowSubtaskInput(!showSubtaskInput);
    if (!showSubtaskInput) {
      setExpanded(true); // Auto-expand when adding subtasks
    }
  };
  
  const handleAddSubtask = (e: React.MouseEvent | React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (newSubtaskTitle.trim()) {
      addSubtask(task.id, { 
        title: newSubtaskTitle.trim(),
        estimatedMinutes: newSubtaskTime
      });
      setNewSubtaskTitle('');
      setNewSubtaskTime(15); // Reset to default
      setShowSubtaskInput(false);
    }
  };
  
  const handleSubtaskInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Escape') {
      setShowSubtaskInput(false);
      setNewSubtaskTitle('');
      e.stopPropagation();
    } else if (e.key === 'Enter') {
      handleAddSubtask(e as unknown as React.FormEvent);
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
    if (isToday) return 'border-green-500'; // Green border without background color for today's tasks
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
                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-50 text-green-700">
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
                    isToday ? 'text-green-600 font-semibold' : 
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
              <button
                onClick={toggleSubtaskInput}
                className="p-1 text-gray-400 hover:text-indigo-500 rounded"
                title="Add subtask"
              >
                <ListPlus size={16} />
              </button>
              
              {onDelete && (
                <button
                  onClick={handleDelete}
                  className="p-1 text-gray-400 hover:text-red-500 rounded"
                  title="Delete task"
                >
                  <Trash2 size={16} />
                </button>
              )}
            </div>
          </div>
          
          {/* Subtask section with optional input */}
          {showSubtaskInput && (
            <div className="mt-3 space-y-2" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  className="flex-grow rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
                  placeholder="Add a subtask..."
                  value={newSubtaskTitle}
                  onChange={(e) => setNewSubtaskTitle(e.target.value)}
                  onKeyDown={handleSubtaskInputKeyDown}
                  autoFocus
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
                    className="w-12 text-xs text-right border-0 p-0 focus:ring-0"
                    title="Estimated minutes"
                  />
                  <span className="text-xs ml-1">min</span>
                </div>
                
                <button
                  className="p-1 bg-indigo-500 text-white rounded-md hover:bg-indigo-600"
                  onClick={handleAddSubtask}
                >
                  <Plus size={16} />
                </button>
              </div>
              <p className="text-xs text-gray-500">Enter task description and time estimate</p>
            </div>
          )}
          
          {/* Subtasks list */}
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
                <span className="flex items-center">
                  {task.subtasks?.length} subtask{task.subtasks?.length !== 1 ? 's' : ''}
                  {totalSubtaskTime > 0 && (
                    <span className="ml-2 flex items-center text-blue-500">
                      <Clock size={12} className="mr-1" />
                      {totalSubtaskTime}m
                    </span>
                  )}
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