import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Task, Project } from '../types';
import { Backpack, Calendar, Target, Cpu, Menu, Clock, Plus } from 'lucide-react';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import Card from '../components/common/Card';
import TaskForm from '../components/tasks/TaskForm';
import TaskPlanningBoard from '../components/planning/TaskPlanningBoard';
import BackwardPlanner from '../components/planning/BackwardPlanner';
import ProjectBreakdown from '../components/planning/ProjectBreakdown';
import { formatDate } from '../utils/helpers';

enum PlanningMode {
  BOARD = 'board',
  BACKWARD = 'backward',
  BREAKDOWN = 'breakdown',
  TIME_BLOCK = 'timeBlock'
}

enum TimeBlockSlot {
  MORNING = 'morning',
  AFTERNOON = 'afternoon',
  EVENING = 'evening'
}

const EnhancedPlanningPage: React.FC = () => {
  const { projects, tasks, getDailyPlan, saveDailyPlan } = useAppContext();
  
  // State
  const [activeMode, setActiveMode] = useState<PlanningMode>(PlanningMode.BOARD);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Get the current day's plan
  const today = formatDate(new Date());
  const todayPlan = getDailyPlan(today);
  
  // Time blocking state
  const [selectedTimeBlock, setSelectedTimeBlock] = useState<TimeBlockSlot | null>(null);
  const [availableTasks, setAvailableTasks] = useState<Task[]>([]);
  const [morningTasks, setMorningTasks] = useState<Task[]>([]);
  const [afternoonTasks, setAfternoonTasks] = useState<Task[]>([]);
  const [eveningTasks, setEveningTasks] = useState<Task[]>([]);
  
  // Filter projects that have at least one task
  const activeProjects = projects.filter(project => 
    tasks.some(task => task.projectId === project.id && !task.completed && !task.archived)
  );
  
  const selectedProject = projects.find(p => p.id === selectedProjectId);
  
  const handleOpenTaskModal = (task?: Task) => {
    if (task) {
      setEditingTask(task);
    } else {
      setEditingTask(null);
    }
    setIsTaskModalOpen(true);
  };
  
  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
  };
  
  const handleTimeBlockDragStart = (taskId: string) => {
    // Add drag logic
  };
  
  const handleTimeBlockDragEnd = (taskId: string, slot: TimeBlockSlot) => {
    // Add drop logic
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center bg-white rounded-lg shadow-sm p-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Planning Studio</h1>
          <p className="text-gray-600">
            Plan your projects and tasks in a way that works for your brain
          </p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2">
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => handleOpenTaskModal()}
          >
            New Task
          </Button>
        </div>
      </div>
      
      {/* Planning Modes Tabs */}
      <div className="flex flex-wrap bg-white rounded-lg shadow-sm">
        <button
          className={`flex items-center px-4 py-3 ${
            activeMode === PlanningMode.BOARD 
              ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-500'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
          onClick={() => setActiveMode(PlanningMode.BOARD)}
        >
          <Backpack size={18} className="mr-2" />
          <span>Planning Board</span>
        </button>
        
        <button
          className={`flex items-center px-4 py-3 ${
            activeMode === PlanningMode.BACKWARD 
              ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-500'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
          onClick={() => setActiveMode(PlanningMode.BACKWARD)}
        >
          <Target size={18} className="mr-2" />
          <span>Backward Planning</span>
        </button>
        
        <button
          className={`flex items-center px-4 py-3 ${
            activeMode === PlanningMode.BREAKDOWN 
              ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-500'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
          onClick={() => setActiveMode(PlanningMode.BREAKDOWN)}
        >
          <Menu size={18} className="mr-2" />
          <span>Project Breakdown</span>
        </button>
        
        <button
          className={`flex items-center px-4 py-3 ${
            activeMode === PlanningMode.TIME_BLOCK 
              ? 'bg-indigo-50 text-indigo-700 border-b-2 border-indigo-500'
              : 'text-gray-600 hover:bg-gray-50'
          }`}
          onClick={() => setActiveMode(PlanningMode.TIME_BLOCK)}
        >
          <Clock size={18} className="mr-2" />
          <span>Time Blocking</span>
        </button>
      </div>

      {/* Project Selection (for Board and Breakdown modes) */}
      {(activeMode === PlanningMode.BOARD || activeMode === PlanningMode.BREAKDOWN) && (
        <div className="bg-white rounded-lg shadow-sm p-4">
          <label htmlFor="projectSelect" className="block text-sm font-medium text-gray-700 mb-2">
            Select Project
          </label>
          <select
            id="projectSelect"
            value={selectedProjectId}
            onChange={(e) => setSelectedProjectId(e.target.value)}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
          >
            <option value="">All Projects</option>
            {activeProjects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </div>
      )}
      
      {/* Active Planning Tool */}
      <div>
        {/* Planning Board Mode */}
        {activeMode === PlanningMode.BOARD && (
          <TaskPlanningBoard 
            projectId={selectedProjectId || undefined}
            onEditTask={handleOpenTaskModal}
          />
        )}
        
        {/* Backward Planning Mode */}
        {activeMode === PlanningMode.BACKWARD && (
          <BackwardPlanner 
            projectId={selectedProjectId || undefined}
          />
        )}
        
        {/* Project Breakdown Mode */}
        {activeMode === PlanningMode.BREAKDOWN && selectedProject && (
          <ProjectBreakdown project={selectedProject} />
        )}
        
        {/* Project Breakdown - No Project Selected */}
        {activeMode === PlanningMode.BREAKDOWN && !selectedProject && (
          <Card>
            <div className="text-center py-8">
              <Cpu size={48} className="mx-auto text-gray-400 mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-1">Select a Project</h3>
              <p className="text-gray-600">
                Please select a project to use the breakdown planning tool
              </p>
            </div>
          </Card>
        )}
        
        {/* Time Blocking Mode */}
        {activeMode === PlanningMode.TIME_BLOCK && (
          <div className="space-y-4">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center">
                <Calendar size={20} className="mr-2 text-indigo-500" />
                Today's Time Blocks
              </h2>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Morning Block */}
                <div className="bg-blue-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Morning</h3>
                  <div 
                    className="min-h-[200px] bg-white rounded-lg p-3 border-2 border-dashed border-blue-200"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleTimeBlockDragEnd('', TimeBlockSlot.MORNING)}
                  >
                    {morningTasks.length === 0 ? (
                      <div className="text-center py-4 text-gray-400 italic">
                        Drop tasks here
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {morningTasks.map(task => (
                          <div 
                            key={task.id}
                            className="bg-blue-100 p-2 rounded"
                            draggable
                            onDragStart={() => handleTimeBlockDragStart(task.id)}
                          >
                            {task.title}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Afternoon Block */}
                <div className="bg-yellow-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Afternoon</h3>
                  <div 
                    className="min-h-[200px] bg-white rounded-lg p-3 border-2 border-dashed border-yellow-200"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleTimeBlockDragEnd('', TimeBlockSlot.AFTERNOON)}
                  >
                    {afternoonTasks.length === 0 ? (
                      <div className="text-center py-4 text-gray-400 italic">
                        Drop tasks here
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {afternoonTasks.map(task => (
                          <div 
                            key={task.id}
                            className="bg-yellow-100 p-2 rounded"
                            draggable
                            onDragStart={() => handleTimeBlockDragStart(task.id)}
                          >
                            {task.title}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
                
                {/* Evening Block */}
                <div className="bg-purple-50 rounded-lg p-4">
                  <h3 className="font-medium text-gray-900 mb-2">Evening</h3>
                  <div 
                    className="min-h-[200px] bg-white rounded-lg p-3 border-2 border-dashed border-purple-200"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={() => handleTimeBlockDragEnd('', TimeBlockSlot.EVENING)}
                  >
                    {eveningTasks.length === 0 ? (
                      <div className="text-center py-4 text-gray-400 italic">
                        Drop tasks here
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {eveningTasks.map(task => (
                          <div 
                            key={task.id}
                            className="bg-purple-100 p-2 rounded"
                            draggable
                            onDragStart={() => handleTimeBlockDragStart(task.id)}
                          >
                            {task.title}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-bold text-gray-900 mb-4">Available Tasks</h2>
              
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {tasks
                  .filter(t => !t.completed && !t.archived)
                  .slice(0, 12)
                  .map(task => (
                    <div 
                      key={task.id}
                      className="bg-gray-50 p-3 rounded-lg shadow-sm"
                      draggable
                      onDragStart={() => handleTimeBlockDragStart(task.id)}
                    >
                      <h3 className="font-medium text-gray-800">{task.title}</h3>
                      {task.dueDate && (
                        <p className="text-xs text-gray-500">Due: {task.dueDate}</p>
                      )}
                    </div>
                  ))
                }
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Task Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={handleCloseTaskModal}
        title={editingTask ? 'Edit Task' : 'Create New Task'}
      >
        <TaskForm
          task={editingTask || undefined}
          onClose={handleCloseTaskModal}
          isEdit={!!editingTask}
        />
      </Modal>
    </div>
  );
};

export default EnhancedPlanningPage;