import React, { useState } from 'react';
import { CheckCircle2, Circle, ChevronRight, ChevronDown, Calendar, Folder, Tags, Trash2 } from 'lucide-react';
import { Task, Project, Category } from '../../types';
import Badge from '../common/Badge';
import { formatDateForDisplay } from '../../utils/helpers';
import { useAppContext } from '../../context/AppContext';

interface TaskCardProps {
  task: Task;
  projects: Project[];
  categories: Category[];
  isSubtask?: boolean;
  onEdit?: (task: Task) => void;
  onDelete?: (taskId: string) => void;
}

const TaskCard: React.FC<TaskCardProps> = ({
  task,
  projects,
  categories,
  isSubtask = false,
  onEdit,
  onDelete,
}) => {
  const [expanded, setExpanded] = useState(false);
  const { completeTask, tasks } = useAppContext();
  
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
  
  return (
    <div 
      className={`bg-white rounded-lg shadow p-4 mb-3 border-l-4 transition-all ${
        task.completed ? 'border-green-500 bg-green-50' : 'border-indigo-500'
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
              <h3 className={`text-lg font-medium ${task.completed ? 'line-through text-gray-500' : 'text-gray-900'}`}>
                {task.title}
              </h3>
              
              {task.description && (
                <p className={`mt-1 text-sm ${task.completed ? 'text-gray-400' : 'text-gray-500'}`}>
                  {task.description}
                </p>
              )}
              
              <div className="mt-2 flex flex-wrap gap-2 items-center">
                {task.dueDate && (
                  <div className="flex items-center text-xs text-gray-500">
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
                    <TaskCard
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

export default TaskCard;