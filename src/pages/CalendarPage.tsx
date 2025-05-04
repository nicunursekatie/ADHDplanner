import React, { useState } from 'react';
import { Task } from '../types';
import CalendarView from '../components/calendar/CalendarView';
import Modal from '../components/common/Modal';
import TaskForm from '../components/tasks/TaskForm';

const CalendarPage: React.FC = () => {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };
  
  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setSelectedTask(null);
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center bg-white rounded-lg shadow-sm p-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600">View your tasks by date</p>
        </div>
      </div>
      
      {/* Calendar View */}
      <CalendarView onEditTask={handleTaskSelect} />
      
      {/* Task Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={handleCloseTaskModal}
        title="Task Details"
      >
        <TaskForm
          task={selectedTask || undefined}
          onClose={handleCloseTaskModal}
          isEdit={true}
        />
      </Modal>
    </div>
  );
};

export default CalendarPage;