import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  Clock, 
  Calendar, 
  CheckCircle2, 
  Folder, 
  Tag, 
  Plus,
  ArrowRight,
  HelpCircle,
  BrainCircuit,
  RefreshCw,
  ListChecks
} from 'lucide-react';
import { useAppContext } from '../context/AppContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { ImprovedTaskCard } from '../components/tasks/ImprovedTaskCard';
import Modal from '../components/common/Modal';
import { StreamlinedTaskForm } from '../components/tasks/StreamlinedTaskForm';
import { EnhancedQuickCapture } from '../components/tasks/EnhancedQuickCapture';
import { 
  getTasksDueToday, 
  getTasksDueThisWeek, 
  getOverdueTasks 
} from '../utils/helpers';
import { Task } from '../types';

const Dashboard: React.FC = () => {
  const {
    tasks,
    projects,
    categories,
    isLoading,
    isDataInitialized,
    initializeSampleData,
    deleteTask
  } = useAppContext();
  
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-gray-500">Loading...</div>
      </div>
    );
  }
  
  if (!isDataInitialized) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <Card>
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">
              Welcome to TaskManager!
            </h2>
            <p className="text-gray-600 mb-6">
              You don't have any data yet. Would you like to start with some sample data?
            </p>
            <div className="flex justify-center space-x-4">
              <Button 
                variant="primary"
                onClick={initializeSampleData}
              >
                Load Sample Data
              </Button>
              <Link to="/tasks">
                <Button variant="outline">
                  Start from Scratch
                </Button>
              </Link>
            </div>
          </div>
        </Card>
      </div>
    );
  }
  
  const tasksDueToday = getTasksDueToday(tasks);
  const tasksDueThisWeek = getTasksDueThisWeek(tasks);
  const overdueTasks = getOverdueTasks(tasks);
  const completedTasks = tasks.filter(task => task.completed);
  const incompleteTasks = tasks.filter(task => !task.completed);
  
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
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center bg-white rounded-lg shadow-sm p-4 mb-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-600">Your task overview</p>
        </div>
        <div className="mt-4 md:mt-0 flex space-x-2">
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => handleOpenTaskModal()}
          >
            New Task
          </Button>
          <Link to="/what-now">
            <Button
              variant="outline"
              icon={<HelpCircle size={16} />}
            >
              What Now?
            </Button>
          </Link>
        </div>
      </div>
      
      {/* Quick Task Input */}
      <div className="mb-4">
        <EnhancedQuickCapture
          placeholder="Add a new task... (try !today, !tomorrow, !high)"
        />
      </div>

      {/* Memory Tools Section */}
      <div className="mb-6">
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-xl font-semibold text-gray-800">Remember & Review</h2>
          <Button
            variant="outline"
            size="sm"
            icon={<RefreshCw size={16} />}
            onClick={() => window.location.reload()}
          >
            Refresh
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Quick links to memory tools */}
          <Card className="lg:col-span-1">
            <div className="p-4">
              <h3 className="text-lg font-medium text-gray-900 mb-3">Memory Tools</h3>
              <div className="space-y-2">
                <Link to="/brain-dump">
                  <div className="p-3 bg-indigo-50 rounded-lg hover:bg-indigo-100 transition-colors cursor-pointer flex items-center justify-between">
                    <div className="flex items-center">
                      <BrainCircuit className="w-5 h-5 text-indigo-600 mr-2" />
                      <span className="font-medium">Brain Dump</span>
                    </div>
                    <ArrowRight size={16} className="text-indigo-500" />
                  </div>
                </Link>

                <Link to="/weekly-review">
                  <div className="p-3 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors cursor-pointer flex items-center justify-between">
                    <div className="flex items-center">
                      <RefreshCw className="w-5 h-5 text-blue-600 mr-2" />
                      <span className="font-medium">Weekly Review</span>
                    </div>
                    <ArrowRight size={16} className="text-blue-500" />
                  </div>
                </Link>

                <Link to="/accountability">
                  <div className="p-3 bg-orange-50 rounded-lg hover:bg-orange-100 transition-colors cursor-pointer flex items-center justify-between">
                    <div className="flex items-center">
                      <ListChecks className="w-5 h-5 text-orange-600 mr-2" />
                      <span className="font-medium">Accountability Check-In</span>
                    </div>
                    <ArrowRight size={16} className="text-orange-500" />
                  </div>
                </Link>

                <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg mt-3">
                  <p className="text-sm text-gray-600">
                    Use these tools to help capture tasks you might forget, review your progress, and adjust your approach.
                  </p>
                </div>
              </div>
            </div>
          </Card>

          {/* Mini Brain Dump Widget */}
          <Card className="lg:col-span-2 overflow-hidden">
            <div className="p-3 bg-indigo-50 border-b border-indigo-100">
              <div className="flex items-center justify-between">
                <div className="flex items-center">
                  <BrainCircuit className="w-5 h-5 text-indigo-600 mr-2" />
                  <h3 className="font-medium text-gray-900">Quick Brain Dump</h3>
                </div>
                <Link
                  to="/brain-dump"
                  className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
                >
                  Full Version
                  <ArrowRight size={14} className="ml-1" />
                </Link>
              </div>
            </div>
            <div className="p-4">
              <div className="bg-indigo-50 rounded-lg p-3 mb-4">
                <div className="text-indigo-800">
                  Think of something you need to remember? Add it now:
                </div>
              </div>
              <div className="flex">
                <input
                  type="text"
                  className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                  placeholder="Add something you just remembered..."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && e.currentTarget.value.trim()) {
                      const value = e.currentTarget.value;
                      handleOpenTaskModal();
                      e.currentTarget.value = '';
                    }
                  }}
                />
                <Button
                  className="rounded-l-none"
                  onClick={() => handleOpenTaskModal()}
                  icon={<Plus size={16} />}
                >
                  Add Task
                </Button>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Overdue Section - High Priority at Top */}
      {overdueTasks.length > 0 && (
        <Card
          title="Overdue Tasks"
          className="border-l-4 border-red-500 mb-6"
          headerAction={
            <Link 
              to="/tasks"
              className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
            >
              View All
              <ArrowRight size={14} className="ml-1" />
            </Link>
          }
        >
          <div className="space-y-2">
            {overdueTasks.slice(0, 2).map(task => (
              <ImprovedTaskCard
                key={task.id}
                task={task}
                projects={projects}
                categories={categories}
                onEdit={handleOpenTaskModal}
                onDelete={deleteTask}
              />
            ))}
            
            {overdueTasks.length > 2 && (
              <div className="pt-1">
                <Link 
                  to="/tasks"
                  className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center justify-center"
                >
                  View all {overdueTasks.length} overdue tasks
                </Link>
              </div>
            )}
          </div>
        </Card>
      )}
      
      {/* Main task sections - more compact layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Due Today and Coming Up This Week in first row */}
        <Card
          title="Due Today"
          headerAction={
            <Link 
              to="/tasks"
              className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
            >
              View All
              <ArrowRight size={14} className="ml-1" />
            </Link>
          }
        >
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {tasksDueToday.slice(0, 3).map(task => (
              <ImprovedTaskCard
                key={task.id}
                task={task}
                projects={projects}
                categories={categories}
                onEdit={handleOpenTaskModal}
                onDelete={deleteTask}
              />
            ))}
            
            {tasksDueToday.length === 0 && (
              <div className="text-center py-3 text-gray-500">
                No tasks due today
              </div>
            )}
          </div>
        </Card>

        <Card
          title="Coming Up This Week"
          headerAction={
            <Link 
              to="/tasks"
              className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
            >
              View All
              <ArrowRight size={14} className="ml-1" />
            </Link>
          }
        >
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {tasksDueThisWeek.filter(task => !tasksDueToday.some(t => t.id === task.id)).slice(0, 3).map(task => (
              <ImprovedTaskCard
                key={task.id}
                task={task}
                projects={projects}
                categories={categories}
                onEdit={handleOpenTaskModal}
                onDelete={deleteTask}
              />
            ))}
            
            {tasksDueThisWeek.filter(task => !tasksDueToday.some(t => t.id === task.id)).length === 0 && (
              <div className="text-center py-3 text-gray-500">
                No upcoming tasks this week
              </div>
            )}
          </div>
        </Card>

        {/* Recently Added and Projects in second row */}
        <Card
          title="Recently Added"
          headerAction={
            <Link 
              to="/tasks"
              className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
            >
              View All
              <ArrowRight size={14} className="ml-1" />
            </Link>
          }
        >
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {incompleteTasks
              .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
              .slice(0, 3)
              .map(task => (
                <ImprovedTaskCard
                  key={task.id}
                  task={task}
                  projects={projects}
                  categories={categories}
                  onEdit={handleOpenTaskModal}
                  onDelete={deleteTask}
                />
              ))
            }
            
            {incompleteTasks.length === 0 && (
              <div className="text-center py-3 text-gray-500">
                No recently added tasks
              </div>
            )}
          </div>
        </Card>
        
        <Card
          title="Projects"
          headerAction={
            <Link 
              to="/projects"
              className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
            >
              View All
              <ArrowRight size={14} className="ml-1" />
            </Link>
          }
        >
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {projects.slice(0, 4).map(project => {
              const projectTasks = tasks.filter(
                task => task.projectId === project.id && !task.completed
              );
              
              return (
                <Link 
                  key={project.id} 
                  to={`/projects/${project.id}`}
                  className="flex items-center justify-between p-2 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                >
                  <div className="flex items-center">
                    <div 
                      className="w-3 h-3 rounded-full mr-3" 
                      style={{ backgroundColor: project.color }}
                    ></div>
                    <span className="font-medium">{project.name}</span>
                  </div>
                  <span className="text-sm text-gray-500">
                    {projectTasks.length} task{projectTasks.length !== 1 ? 's' : ''}
                  </span>
                </Link>
              );
            })}
            
            {projects.length === 0 && (
              <div className="text-center py-3 text-gray-500">
                No projects yet
              </div>
            )}
          </div>
        </Card>
      </div>
      
      
      {/* Recently Completed at bottom */}
      {completedTasks.length > 0 && (
        <Card
          title="Recently Completed"
          className="border-l-4 border-green-500 mt-4"
          headerAction={
            <Link 
              to="/tasks"
              className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center"
            >
              View All
              <ArrowRight size={14} className="ml-1" />
            </Link>
          }
        >
          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {completedTasks
              .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
              .slice(0, 3)
              .map(task => (
                <ImprovedTaskCard
                  key={task.id}
                  task={task}
                  projects={projects}
                  categories={categories}
                  onEdit={handleOpenTaskModal}
                  onDelete={deleteTask}
                />
              ))
            }
          </div>
        </Card>
      )}
      {/* Task Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={handleCloseTaskModal}
        title={editingTask ? 'Edit Task' : 'Create New Task'}
      >
        <StreamlinedTaskForm
          task={editingTask || undefined}
          onClose={handleCloseTaskModal}
          isEdit={!!editingTask}
        />
      </Modal>
    </div>
  );
};

export default Dashboard;