import React, { useState } from 'react';
import { Task, Project, Category } from '../../types';
import EnhancedTaskCard from '../tasks/EnhancedTaskCard';
import { useAppContext } from '../../context/AppContext';
import { Clock, Target, Menu, Download, LayoutGrid, List, ArrowLeft, ArrowRight, Plus } from 'lucide-react';
import Button from '../common/Button';
import QuickTaskInput from '../tasks/QuickTaskInput';

type ColumnType = 'backlog' | 'planning' | 'ready' | 'inProgress' | 'done';

interface TaskPlanningBoardProps {
  projectId?: string;
  onEditTask: (task: Task) => void;
}

const TaskPlanningBoard: React.FC<TaskPlanningBoardProps> = ({ 
  projectId,
  onEditTask
}) => {
  const { tasks, projects, categories, addTask, updateTask, deleteTask } = useAppContext();
  const [viewMode, setViewMode] = useState<'board' | 'list'>('board');
  
  // Filter tasks by project if projectId is provided
  const filteredTasks = projectId 
    ? tasks.filter(task => task.projectId === projectId)
    : tasks;
  
  // Filter tasks into columns
  const backlogTasks = filteredTasks.filter(task => 
    !task.completed && task.size === 'large' && !task.parentTaskId
  );
  
  const planningTasks = filteredTasks.filter(task => 
    !task.completed && task.parentTaskId === null && task.size !== 'large' && 
    // Has subtasks but not all subtasks are ready
    (task.subtasks?.length > 0 && !task.subtasks.every(subtaskId => {
      const subtask = tasks.find(t => t.id === subtaskId);
      return subtask && subtask.size === 'small';
    }))
  );
  
  const readyTasks = filteredTasks.filter(task => 
    !task.completed && task.parentTaskId === null && task.size === 'small'
  );
  
  const inProgressTasks = filteredTasks.filter(task => 
    !task.completed && task.energyLevel === 'high'
  );
  
  const doneTasks = filteredTasks.filter(task => 
    task.completed && !task.archived
  );

  const handleMoveTask = (task: Task, targetColumn: ColumnType) => {
    let updatedTask = { ...task };
    
    // Update task based on target column
    switch (targetColumn) {
      case 'backlog':
        updatedTask.size = 'large';
        break;
      case 'planning':
        // If moving from backlog to planning, break down the task
        if (task.size === 'large') {
          updatedTask.size = 'medium';
        }
        break;
      case 'ready':
        updatedTask.size = 'small';
        break;
      case 'inProgress':
        updatedTask.energyLevel = 'high';
        break;
      case 'done':
        updatedTask.completed = true;
        break;
    }
    
    updateTask(updatedTask);
  };
  
  const handleCreateSubtask = (parentTask: Task) => {
    const newTask: Partial<Task> = {
      title: `Subtask of ${parentTask.title}`,
      description: '',
      completed: false,
      archived: false,
      projectId: parentTask.projectId,
      categoryIds: [...parentTask.categoryIds],
      parentTaskId: parentTask.id,
      size: 'small', // Subtasks are typically small
      priority: parentTask.priority || 'medium',
      energyLevel: 'medium',
    };
    
    const createdTask = addTask(newTask);
    
    // Update parent task to include new subtask
    updateTask({
      ...parentTask,
      subtasks: [...(parentTask.subtasks || []), createdTask.id]
    });
  };
  
  const renderTaskColumn = (
    title: string, 
    icon: React.ReactNode, 
    tasks: Task[], 
    columnType: ColumnType,
    color: string
  ) => {
    return (
      <div className="flex flex-col h-full">
        <div className={`flex items-center p-2 ${color} rounded-t-lg`}>
          <div className="flex items-center">
            {icon}
            <h3 className="font-bold text-gray-700 ml-2">{title}</h3>
          </div>
          <div className="ml-2 bg-white rounded-full px-2 py-0.5 text-xs font-medium text-gray-700">
            {tasks.length}
          </div>
        </div>
        
        <div className="flex-grow bg-gray-50 rounded-b-lg p-2 overflow-y-auto space-y-2" style={{ minHeight: '300px' }}>
          {tasks.length === 0 ? (
            <div className="h-full flex items-center justify-center text-gray-400 text-sm">
              No tasks
            </div>
          ) : (
            tasks.map(task => (
              <div key={task.id} className="relative group">
                <EnhancedTaskCard
                  task={task}
                  projects={projects}
                  categories={categories}
                  onEdit={onEditTask}
                />
                
                <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
                  {columnType !== 'backlog' && (
                    <button 
                      className="p-1 bg-gray-100 rounded hover:bg-gray-200"
                      onClick={() => handleMoveTask(task, 'backlog')}
                      title="Move to Backlog"
                    >
                      <ArrowLeft size={14} />
                    </button>
                  )}
                  
                  {columnType === 'backlog' && (
                    <button 
                      className="p-1 bg-blue-100 rounded hover:bg-blue-200"
                      onClick={() => handleMoveTask(task, 'planning')}
                      title="Move to Planning"
                    >
                      <ArrowRight size={14} />
                    </button>
                  )}
                  
                  {columnType === 'planning' && (
                    <>
                      <button 
                        className="p-1 bg-blue-100 rounded hover:bg-blue-200"
                        onClick={() => handleCreateSubtask(task)}
                        title="Break Down"
                      >
                        <Menu size={14} />
                      </button>
                      <button 
                        className="p-1 bg-green-100 rounded hover:bg-green-200"
                        onClick={() => handleMoveTask(task, 'ready')}
                        title="Mark as Ready"
                      >
                        <ArrowRight size={14} />
                      </button>
                    </>
                  )}
                  
                  {columnType === 'ready' && (
                    <button 
                      className="p-1 bg-yellow-100 rounded hover:bg-yellow-200"
                      onClick={() => handleMoveTask(task, 'inProgress')}
                      title="Start Work"
                    >
                      <ArrowRight size={14} />
                    </button>
                  )}
                  
                  {columnType === 'inProgress' && (
                    <button 
                      className="p-1 bg-green-100 rounded hover:bg-green-200"
                      onClick={() => handleMoveTask(task, 'done')}
                      title="Complete"
                    >
                      <ArrowRight size={14} />
                    </button>
                  )}
                </div>
              </div>
            ))
          )}
          
          {columnType === 'backlog' && (
            <div className="pt-2">
              <QuickTaskInput 
                defaultProjectId={projectId}
              />
            </div>
          )}
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold text-gray-900">Planning Board</h2>
        <div className="flex space-x-2">
          <div className="flex bg-gray-100 rounded-md p-1">
            <button
              className={`p-1 ${viewMode === 'board' ? 'bg-white rounded-md shadow-sm' : ''}`}
              onClick={() => setViewMode('board')}
              title="Board View"
            >
              <LayoutGrid size={18} />
            </button>
            <button
              className={`p-1 ${viewMode === 'list' ? 'bg-white rounded-md shadow-sm' : ''}`}
              onClick={() => setViewMode('list')}
              title="List View"
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>
      
      {viewMode === 'board' ? (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {renderTaskColumn(
            'Backlog', 
            <Download size={18} className="text-gray-600" />, 
            backlogTasks, 
            'backlog',
            'bg-gray-100'
          )}
          
          {renderTaskColumn(
            'Planning', 
            <Menu size={18} className="text-blue-600" />, 
            planningTasks, 
            'planning',
            'bg-blue-100'
          )}
          
          {renderTaskColumn(
            'Ready', 
            <Target size={18} className="text-green-600" />, 
            readyTasks, 
            'ready',
            'bg-green-100'
          )}
          
          {renderTaskColumn(
            'In Progress', 
            <Clock size={18} className="text-yellow-600" />, 
            inProgressTasks, 
            'inProgress',
            'bg-yellow-100'
          )}
          
          {renderTaskColumn(
            'Done', 
            <Clock size={18} className="text-gray-600" />, 
            doneTasks, 
            'done',
            'bg-gray-100'
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Download size={18} className="text-gray-600 mr-2" />
              Backlog
            </h3>
            <div className="space-y-2">
              {backlogTasks.length === 0 ? (
                <div className="text-gray-500 italic">No tasks in backlog</div>
              ) : (
                backlogTasks.map(task => (
                  <EnhancedTaskCard
                    key={task.id}
                    task={task}
                    projects={projects}
                    categories={categories}
                    onEdit={onEditTask}
                    onDelete={deleteTask}
                  />
                ))
              )}
              <div className="pt-2">
                <QuickTaskInput 
                  defaultProjectId={projectId}
                />
              </div>
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Menu size={18} className="text-blue-600 mr-2" />
              Planning
            </h3>
            <div className="space-y-2">
              {planningTasks.length === 0 ? (
                <div className="text-gray-500 italic">No tasks being planned</div>
              ) : (
                planningTasks.map(task => (
                  <div key={task.id} className="relative group">
                    <EnhancedTaskCard
                      task={task}
                      projects={projects}
                      categories={categories}
                      onEdit={onEditTask}
                    />
                    <div className="absolute top-2 right-12 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        variant="secondary"
                        size="sm"
                        icon={<Plus size={14} />}
                        onClick={() => handleCreateSubtask(task)}
                      >
                        Add Subtask
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Target size={18} className="text-green-600 mr-2" />
              Ready
            </h3>
            <div className="space-y-2">
              {readyTasks.length === 0 ? (
                <div className="text-gray-500 italic">No tasks ready to work on</div>
              ) : (
                readyTasks.map(task => (
                  <EnhancedTaskCard
                    key={task.id}
                    task={task}
                    projects={projects}
                    categories={categories}
                    onEdit={onEditTask}
                    onDelete={deleteTask}
                  />
                ))
              )}
            </div>
          </div>
          
          <div className="bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-bold text-gray-900 mb-4 flex items-center">
              <Clock size={18} className="text-yellow-600 mr-2" />
              In Progress
            </h3>
            <div className="space-y-2">
              {inProgressTasks.length === 0 ? (
                <div className="text-gray-500 italic">No tasks in progress</div>
              ) : (
                inProgressTasks.map(task => (
                  <EnhancedTaskCard
                    key={task.id}
                    task={task}
                    projects={projects}
                    categories={categories}
                    onEdit={onEditTask}
                    onDelete={deleteTask}
                  />
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskPlanningBoard;