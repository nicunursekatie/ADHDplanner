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
  HelpCircle
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
    initializeSampleData
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