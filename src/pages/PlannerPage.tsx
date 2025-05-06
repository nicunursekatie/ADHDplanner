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
      
      {/* Time Block Info Card */}
      <Card className="bg-blue-50 border border-blue-200">
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 p-2 rounded-full">
            <Info size={18} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-md font-medium text-blue-800 mb-1">Flexible Time Blocking</h3>
            <p className="text-sm text-blue-700">
              Create as many time blocks as you need with any custom start and end times.
              Your blocks will automatically be arranged chronologically throughout the day.
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <div className="bg-white border border-blue-200 rounded-md px-3 py-1 text-xs text-blue-700 flex items-center">
                <Clock size={12} className="mr-1" />
                Custom time ranges
              </div>
              <div className="bg-white border border-blue-200 rounded-md px-3 py-1 text-xs text-blue-700">
                Unlimited blocks
              </div>
              <div className="bg-white border border-blue-200 rounded-md px-3 py-1 text-xs text-blue-700">
                Drag & drop tasks
              </div>
            </div>
          </div>
        </div>
      </Card>
      
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