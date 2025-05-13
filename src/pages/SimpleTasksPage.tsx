import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Task } from '../types';
import EnhancedTaskCard from '../components/tasks/EnhancedTaskCard';
import TaskForm from '../components/tasks/TaskForm';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';

// Simple page for debugging rendering issues
const SimpleTasksPage: React.FC = () => {
  const { tasks, projects, categories, deleteTask } = useAppContext();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  
  // Simple handlers
  const handleOpenModal = (task?: Task) => {
    setEditingTask(task || null);
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingTask(null);
  };
  
  // Only show non-completed, non-archived tasks
  const activeTasks = tasks.filter(task => !task.completed && !task.archived);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h1 className="text-2xl font-bold text-gray-900">Tasks</h1>
        <p className="text-gray-600">
          {activeTasks.length} task{activeTasks.length !== 1 ? 's' : ''}
        </p>
        <Button
          variant="primary"
          onClick={() => handleOpenModal()}
          className="mt-4"
        >
          Add Task
        </Button>
      </div>
      
      {/* Task list */}
      <div className="bg-white rounded-lg shadow-sm p-4">
        {activeTasks.length > 0 ? (
          <div className="space-y-2">
            {activeTasks.map(task => (
              <EnhancedTaskCard
                key={task.id}
                task={task}
                projects={projects}
                categories={categories}
                onEdit={handleOpenModal}
                onDelete={deleteTask}
              />
            ))}
          </div>
        ) : (
          <div className="text-center p-4">
            <p className="text-gray-500">No tasks found</p>
          </div>
        )}
      </div>
      
      {/* Task Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingTask ? 'Edit Task' : 'Create New Task'}
      >
        <TaskForm
          task={editingTask || undefined}
          parentTask={null}
          onClose={handleCloseModal}
          isEdit={!!editingTask}
        />
      </Modal>
    </div>
  );
};

export default SimpleTasksPage;