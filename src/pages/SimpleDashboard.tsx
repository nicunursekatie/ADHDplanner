import React from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../context/AppContext';
import Button from '../components/common/Button';

// Ultra-simple dashboard for debugging rendering issues
const SimpleDashboard: React.FC = () => {
  const { isLoading, isDataInitialized, tasks } = useAppContext();
  
  if (isLoading) {
    return (
      <div className="text-center p-12">
        <p className="text-lg text-gray-600">Loading...</p>
      </div>
    );
  }
  
  if (!isDataInitialized) {
    return (
      <div className="text-center p-12">
        <p className="text-lg text-gray-600">Please initialize data</p>
      </div>
    );
  }
  
  // Count tasks by status
  const completedCount = tasks.filter(t => t.completed).length;
  const overdueCount = tasks.filter(t => {
    if (!t.dueDate || t.completed) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(t.dueDate) < today;
  }).length;
  
  return (
    <div className="space-y-8 p-4 bg-white rounded-lg shadow">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Dashboard</h1>
        <p className="text-gray-600">Total tasks: {tasks.length}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-indigo-50 p-4 rounded-lg text-center">
          <p className="text-lg font-medium text-indigo-800">{tasks.length - completedCount}</p>
          <p className="text-sm text-indigo-600">Active Tasks</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg text-center">
          <p className="text-lg font-medium text-green-800">{completedCount}</p>
          <p className="text-sm text-green-600">Completed Tasks</p>
        </div>
        
        <div className="bg-red-50 p-4 rounded-lg text-center">
          <p className="text-lg font-medium text-red-800">{overdueCount}</p>
          <p className="text-sm text-red-600">Overdue Tasks</p>
        </div>
      </div>
      
      <div className="flex justify-center space-x-4">
        <Link to="/tasks">
          <Button variant="primary">View Tasks</Button>
        </Link>
      </div>
    </div>
  );
};

export default SimpleDashboard;