import React, { useState } from 'react';
import { Task, Project, Category } from '../../types';
import { ChevronDown, ChevronRight, Plus, Circle, CheckCircle2 } from 'lucide-react';
import Badge from '../common/Badge';
import { useAppContext } from '../../context/AppContext';
import { formatDateForDisplay } from '../../utils/helpers';

interface HierarchicalTaskViewProps {
  tasks: Task[];
  projects: Project[];
  categories: Category[];
  onAddSubtask?: (parentTask: Task) => void;
  onEditTask?: (task: Task) => void;
}

const HierarchicalTaskView: React.FC<HierarchicalTaskViewProps> = ({
  tasks,
  projects,
  categories,
  onAddSubtask,
  onEditTask,
}) => {
  // Create a hierarchy of tasks
  const taskMap = new Map<string, Task>();
  const taskHierarchy: Task[] = [];
  
  // First, map all tasks by ID for easy lookup
  tasks.forEach(task => {
    taskMap.set(task.id, task);
  });
  
  // Then, build the hierarchy
  tasks.forEach(task => {
    if (!task.parentTaskId) {
      // This is a root task
      taskHierarchy.push(task);
    }
  });
  
  // Sort task hierarchy by completion status, then by due date
  taskHierarchy.sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    
    return a.dueDate.localeCompare(b.dueDate);
  });
  
  return (
    <div className="space-y-4">
      {taskHierarchy.map(rootTask => (
        <TaskNode 
          key={rootTask.id}
          task={rootTask}
          tasks={tasks}
          projects={projects}
          categories={categories}
          level={0}
          onAddSubtask={onAddSubtask}
          onEditTask={onEditTask}
        />
      ))}
    </div>
  );
};

interface TaskNodeProps {
  task: Task;
  tasks: Task[];
  projects: Project[];
  categories: Category[];
  level: number;
  onAddSubtask?: (parentTask: Task) => void;
  onEditTask?: (task: Task) => void;
}

const TaskNode: React.FC<TaskNodeProps> = ({ 
  task, 
  tasks,
  projects,
  categories,
  level, 
  onAddSubtask,
  onEditTask
}) => {
  const [expanded, setExpanded] = useState(true);
  const { completeTask } = useAppContext();
  
  // Get subtasks
  const subtasks = tasks.filter(t => 
    task.subtasks?.includes(t.id) || false
  );
  
  // Sort subtasks by completion status, then by due date
  subtasks.sort((a, b) => {
    if (a.completed !== b.completed) {
      return a.completed ? 1 : -1;
    }
    
    if (!a.dueDate && !b.dueDate) return 0;
    if (!a.dueDate) return 1;
    if (!b.dueDate) return -1;
    
    return a.dueDate.localeCompare(b.dueDate);
  });
  
  // Get project and categories
  const project = task.projectId 
    ? projects.find(p => p.id === task.projectId) 
    : null;
  
  const taskCategories = categories.filter(c => 
    task.categoryIds?.includes(c.id) || false
  );
  
  const toggleExpand = () => {
    setExpanded(!expanded);
  };
  
  const handleComplete = (e: React.MouseEvent) => {
    e.stopPropagation();
    completeTask(task.id);
  };
  
  const handleEdit = () => {
    if (onEditTask) {
      onEditTask(task);
    }
  };
  
  const handleAddSubtask = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onAddSubtask) {
      onAddSubtask(task);
    }
  };

  // Calculate indentation based on level
  const indentStyle = {
    marginLeft: `${level * 20}px`,
  };
  
  // Determine color based on completion and due date
  const isOverdue = task.dueDate && 
    new Date(task.dueDate) < new Date() && 
    !task.completed;
  
  // Determine if the task is due today
  const isToday = task.dueDate && 
    new Date(task.dueDate).toDateString() === new Date().toDateString() &&
    !task.completed;
  
  const getTaskColor = () => {
    if (task.completed) return 'bg-green-50 border-green-500';
    if (isOverdue) return 'bg-red-50 border-red-500';
    if (isToday) return 'border-green-500'; // Green border without background for today's tasks
    return 'bg-white border-indigo-500';
  };
  
  return (
    <div>
      <div 
        className={`rounded-lg shadow-sm p-3 mb-2 border-l-4 ${getTaskColor()} transition-all`}
        style={indentStyle}
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
            <div className="flex items-start justify-between">
              <div 
                className="cursor-pointer flex-grow"
                onClick={handleEdit}
              >
                <h3 className={`text-lg font-medium ${task.completed ? 'line-through text-gray-500' : isOverdue ? 'text-red-600' : 'text-gray-900'}`}>
                  {task.title}
                </h3>
                
                {task.description && (
                  <p className={`mt-1 text-sm ${task.completed ? 'text-gray-400' : 'text-gray-500'}`}>
                    {task.description}
                  </p>
                )}
                
                <div className="mt-2 flex flex-wrap gap-2 items-center">
                  {task.dueDate && (
                    <div className={`flex items-center text-xs ${isOverdue ? 'text-red-500 font-semibold' : isToday ? 'text-green-600 font-semibold' : 'text-gray-500'}`}>
                      <Calendar size={14} className="mr-1" />
                      {formatDateForDisplay(task.dueDate)}
                    </div>
                  )}
                  
                  {project && (
                    <div className="flex items-center text-xs">
                      <div className="w-2 h-2 rounded-full mr-1" style={{ backgroundColor: project.color }}></div>
                      <span style={{ color: project.color }}>{project.name}</span>
                    </div>
                  )}
                  
                  {taskCategories.length > 0 && (
                    <div className="flex items-center gap-1">
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
              
              <button
                className="p-1 ml-2 text-gray-400 hover:text-indigo-500 rounded"
                onClick={handleAddSubtask}
              >
                <Plus size={16} />
              </button>
            </div>
            
            {subtasks.length > 0 && (
              <div className="mt-2">
                <button
                  className={`flex items-center text-sm ${task.completed ? 'text-gray-400' : 'text-gray-500 hover:text-gray-700'}`}
                  onClick={toggleExpand}
                >
                  {expanded ? (
                    <ChevronDown size={16} className="mr-1" />
                  ) : (
                    <ChevronRight size={16} className="mr-1" />
                  )}
                  <span>
                    {subtasks.length} subtask{subtasks.length !== 1 ? 's' : ''}
                  </span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
      
      {expanded && subtasks.length > 0 && (
        <div>
          {subtasks.map(subtask => (
            <TaskNode
              key={subtask.id}
              task={subtask}
              tasks={tasks}
              projects={projects}
              categories={categories}
              level={level + 1}
              onAddSubtask={onAddSubtask}
              onEditTask={onEditTask}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default HierarchicalTaskView;