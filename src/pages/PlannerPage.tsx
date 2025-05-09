import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import DailyPlannerGrid from '../components/planner/DailyPlannerGrid';
import { formatDateForDisplay } from '../utils/helpers';
import { ChevronLeft, ChevronRight, Clock, Info } from 'lucide-react';
import Button from '../components/common/Button';
import Card from '../components/common/Card';

const PlannerPage: React.FC = () => {
  const [currentDate, setCurrentDate] = useState<Date>(new Date());
  
  const goToPreviousDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() - 1);
    setCurrentDate(newDate);
  };
  
  const goToNextDay = () => {
    const newDate = new Date(currentDate);
    newDate.setDate(currentDate.getDate() + 1);
    setCurrentDate(newDate);
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  // Format date as ISO string (YYYY-MM-DD), handling timezone offset properly
  const formatDateToYYYYMMDD = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
  
  const formattedDate = formatDateToYYYYMMDD(currentDate);
  
  // Check if date is today
  const isToday = () => {
    const today = new Date();
    return (
      currentDate.getDate() === today.getDate() &&
      currentDate.getMonth() === today.getMonth() &&
      currentDate.getFullYear() === today.getFullYear()
    );
  };
  
  // Format date for display in header (e.g., "Monday, January 15, 2025")
  const headerDate = currentDate.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center bg-white rounded-lg shadow-sm p-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Custom Daily Planner</h1>
          <p className="text-gray-600">Organize your day with flexible time blocks</p>
        </div>
      </div>
      
      {/* No info card here - now only shown inside the DailyPlannerGrid component */}
      
      {/* Date navigation */}
      <div className="flex items-center justify-between bg-white rounded-lg shadow-sm px-6 py-3">
        <button
          onClick={goToPreviousDay}
          className="p-1 rounded hover:bg-gray-100"
        >
          <ChevronLeft size={24} />
        </button>
        
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900">{headerDate}</h2>
          {!isToday() && (
            <Button
              variant="outline"
              size="sm"
              onClick={goToToday}
              className="mt-1"
            >
              Today
            </Button>
          )}
        </div>
        
        <button
          onClick={goToNextDay}
          className="p-1 rounded hover:bg-gray-100"
        >
          <ChevronRight size={24} />
        </button>
      </div>
      
      {/* Planner Grid */}
      <DailyPlannerGrid date={formattedDate} />
    </div>
  );
};

export default PlannerPage;