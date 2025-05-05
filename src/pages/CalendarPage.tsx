import React, { useState } from 'react';
import { Task } from '../types';
import CalendarView from '../components/calendar/CalendarView';
import WorkScheduleSelector from '../components/calendar/WorkScheduleSelector';
import Modal from '../components/common/Modal';
import { StreamlinedTaskForm } from '../components/tasks/StreamlinedTaskForm';

const CalendarPage: React.FC = () => {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  
  const [showWorkSchedule, setShowWorkSchedule] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);
  
  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
    setIsTaskModalOpen(true);
  };
  
  const handleCloseTaskModal = () => {
    setIsTaskModalOpen(false);
    setSelectedTask(null);
  };
  
  const handleScheduleChange = () => {
    // Force re-render of calendar to show updated shifts
    setRefreshKey(prev => prev + 1);
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center bg-white rounded-lg shadow-sm p-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Calendar</h1>
          <p className="text-gray-600">View your tasks by date</p>
        </div>
        <div className="mt-4 md:mt-0">
          <button 
            className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              showWorkSchedule 
                ? 'bg-indigo-600 text-white hover:bg-indigo-700' 
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
            onClick={() => setShowWorkSchedule(!showWorkSchedule)}
          >
            {showWorkSchedule ? 'Hide Work Schedule' : 'Manage Work Schedule'}
          </button>
        </div>
      </div>
      
      {/* Work Schedule Selector (conditionally shown) */}
      {showWorkSchedule && (
        <WorkScheduleSelector onScheduleChange={handleScheduleChange} />
      )}
      
      {/* Calendar View */}
      <CalendarView key={refreshKey} onEditTask={handleTaskSelect} />
      
      {/* Task Modal */}
      <Modal
        isOpen={isTaskModalOpen}
        onClose={handleCloseTaskModal}
        title="Task Details"
      >
        <StreamlinedTaskForm
          task={selectedTask || undefined}
          onClose={handleCloseTaskModal}
          isEdit={true}
        />
      </Modal>
    </div>
  );
};

export default CalendarPage;