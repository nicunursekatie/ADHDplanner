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
import TaskCard from '../components/tasks/TaskCard';
import Modal from '../components/common/Modal';
import TaskForm from '../components/tasks/TaskForm';
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
      <div className="flex flex-col md:flex-row justify-between md:items-center bg-white rounded-lg shadow-sm p-4 mb-6">
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
      
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="bg-indigo-50 border border-indigo-100">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-indigo-500 mr-4" />
            <div>
              <p className="text-lg font-medium text-gray-900">
                {tasksDueToday.length}
              </p>
              <p className="text-sm text-gray-600">Due Today</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-orange-50 border border-orange-100">
          <div className="flex items-center">
            <Calendar className="w-8 h-8 text-orange-500 mr-4" />
            <div>
              <p className="text-lg font-medium text-gray-900">
                {tasksDueThisWeek.length}
              </p>
              <p className="text-sm text-gray-600">Due This Week</p>
            </div>
          </div>
        </Card>
        
        <Card className={`${overdueTasks.length > 0 ? 'bg-red-50 border border-red-100' : 'bg-green-50 border border-green-100'}`}>
          <div className="flex items-center">
            <Clock className={`w-8 h-8 ${overdueTasks.length > 0 ? 'text-red-500' : 'text-green-500'} mr-4`} />
            <div>
              <p className="text-lg font-medium text-gray-900">
                {overdueTasks.length}
              </p>
              <p className="text-sm text-gray-600">Overdue</p>
            </div>
          </div>
        </Card>
        
        <Card className="bg-green-50 border border-green-100">
          <div className="flex items-center">
            <CheckCircle2 className="w-8 h-8 text-green-500 mr-4" />
            <div>
              <p className="text-lg font-medium text-gray-900">
                {completedTasks.length}
              </p>
              <p className="text-sm text-gray-600">Completed</p>
            </div>
          </div>
        </Card>
      </div>
      
      {/* Main content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Projects */}
        <Card
          title="Projects"
          className="lg:col-span-1"
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
          <div className="space-y-3">
            {projects.slice(0, 3).map(project => {
              const projectTasks = tasks.filter(
                task => task.projectId === project.id && !task.completed
              );
              
              return (
                <Link 
                  key={project.id} 
                  to={`/projects/${project.id}`}
                  className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
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
              <div className="text-center py-4 text-gray-500">
                No projects yet
              </div>
            )}
            
            {projects.length > 0 && projects.length > 3 && (
              <div className="pt-2">
                <Link 
                  to="/projects"
                  className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center justify-center"
                >
                  View all {projects.length} projects
                </Link>
              </div>
            )}
          </div>
        </Card>
        
        {/* Due Today */}
        <Card
          title="Due Today"
          className="lg:col-span-2"
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
          <div className="space-y-3">
            {tasksDueToday.slice(0, 3).map(task => (
              <TaskCard
                key={task.id}
                task={task}
                projects={projects}
                categories={categories}
                onEdit={handleOpenTaskModal}
              />
            ))}
            
            {tasksDueToday.length === 0 && (
              <div className="text-center py-4 text-gray-500">
                No tasks due today
              </div>
            )}
            
            {tasksDueToday.length > 3 && (
              <div className="pt-2">
                <Link 
                  to="/tasks"
                  className="text-sm text-indigo-600 hover:text-indigo-800 flex items-center justify-center"
                >
                  View all {tasksDueToday.length} tasks due today
                </Link>
              </div>
            )}
          </div>
        </Card>
        
        {/* Overdue */}
        {overdueTasks.length > 0 && (
          <Card
            title="Overdue Tasks"
            className="lg:col-span-3 border-l-4 border-red-500"
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
            <div className="space-y-3">
              {overdueTasks.slice(0, 3).map(task => (
                <TaskCard
                  key={task.id}
                  task={task}
                  projects={projects}
                  categories={categories}
                  onEdit={handleOpenTaskModal}
                />
              ))}
              
              {overdueTasks.length > 3 && (
                <div className="pt-2">
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

export default Dashboard;