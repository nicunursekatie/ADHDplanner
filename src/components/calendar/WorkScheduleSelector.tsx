import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { WorkShift, DEFAULT_SHIFT, DEFAULT_SHIFT_COLOR } from '../../types';
import { ChevronLeft, ChevronRight, Plus, Trash2, Calendar, Clock } from 'lucide-react';
import Button from '../common/Button';

interface WorkScheduleSelectorProps {
  onScheduleChange?: () => void;
}

export const WorkScheduleSelector: React.FC<WorkScheduleSelectorProps> = ({
  onScheduleChange
}) => {
  // State for tracking current month view
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  
  // Get work schedule data from context
  const { workShifts, addWorkShift, deleteWorkShift, getShiftsForMonth } = useAppContext();

  // Get shifts for the current month
  const monthShifts = getShiftsForMonth(currentYear, currentMonth);
  
  // Memoize dates with shifts for faster lookup
  const [shiftsLookup, setShiftsLookup] = useState<Record<string, WorkShift>>({});
  
  useEffect(() => {
    const lookup: Record<string, WorkShift> = {};
    monthShifts.forEach(shift => {
      lookup[shift.date] = shift;
    });
    setShiftsLookup(lookup);
  }, [monthShifts]);
  
  // Get calendar days for the current month
  const getDaysInMonth = () => {
    const year = currentYear;
    const month = currentMonth;
    
    const firstDayOfMonth = new Date(year, month, 1);
    const lastDayOfMonth = new Date(year, month + 1, 0);
    
    // Get the day of week of the first day (0 = Sunday, 6 = Saturday)
    const firstDayOfWeek = firstDayOfMonth.getDay();
    
    // Calculate the number of days to display (including days from previous/next months)
    const totalDays = 42; // 6 weeks
    
    const daysArray = [];
    
    // Previous month days
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    for (let i = firstDayOfWeek - 1; i >= 0; i--) {
      const date = new Date(year, month - 1, prevMonthLastDay - i);
      const dateStr = date.toISOString().split('T')[0];
      
      daysArray.push({ 
        date, 
        dateStr,
        isPreviousMonth: true,
        hasShift: !!shiftsLookup[dateStr]
      });
    }
    
    // Current month days
    for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
      const date = new Date(year, month, i);
      const dateStr = date.toISOString().split('T')[0];
      
      daysArray.push({ 
        date, 
        dateStr,
        hasShift: !!shiftsLookup[dateStr]
      });
    }
    
    // Next month days
    const remainingDays = totalDays - daysArray.length;
    for (let i = 1; i <= remainingDays; i++) {
      const date = new Date(year, month + 1, i);
      const dateStr = date.toISOString().split('T')[0];
      
      daysArray.push({ 
        date, 
        dateStr,
        isNextMonth: true,
        hasShift: !!shiftsLookup[dateStr]
      });
    }
    
    return daysArray;
  };
  
  // Navigate between months
  const goToPreviousMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear(currentYear - 1);
    } else {
      setCurrentMonth(currentMonth - 1);
    }
  };
  
  const goToNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear(currentYear + 1);
    } else {
      setCurrentMonth(currentMonth + 1);
    }
  };
  
  // Check if a date is today
  const isToday = (date: Date): boolean => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };
  
  // Toggle shift for a date
  const toggleShift = (dateStr: string) => {
    if (shiftsLookup[dateStr]) {
      // If already has a shift, remove it
      deleteWorkShift(shiftsLookup[dateStr].id);
    } else {
      // Add a new shift
      addWorkShift(dateStr);
    }
    
    // Notify parent of change
    if (onScheduleChange) {
      onScheduleChange();
    }
  };
  
  // Format the month header
  const formatMonthHeader = () => {
    return new Date(currentYear, currentMonth).toLocaleDateString('en-US', {
      month: 'long',
      year: 'numeric',
    });
  };
  
  // Render calendar days
  const renderCalendarDays = () => {
    const days = getDaysInMonth();
    
    return (
      <div className="grid grid-cols-7 gap-1">
        {/* Weekday headers */}
        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
          <div 
            key={day} 
            className="text-center text-xs font-medium text-gray-500 py-1"
          >
            {day}
          </div>
        ))}
        
        {/* Calendar days */}
        {days.map(({ date, dateStr, isPreviousMonth, isNextMonth, hasShift }) => (
          <button
            key={dateStr}
            onClick={() => toggleShift(dateStr)}
            className={`
              relative h-12 p-1 rounded transition-colors
              ${isPreviousMonth || isNextMonth ? 'text-gray-400' : 'text-gray-800'}
              ${isToday(date) ? 'bg-indigo-100' : ''}
              ${hasShift ? 'bg-indigo-500 text-white hover:bg-indigo-600' : 'hover:bg-gray-100'}
            `}
            title={`${date.toDateString()} - ${hasShift ? 'Click to remove shift' : 'Click to add shift'}`}
          >
            <div className="text-xs absolute top-1 left-1">
              {date.getDate()}
            </div>
            
            {hasShift && (
              <div className="absolute bottom-1 right-1 text-[9px] font-medium">
                7a-7p
              </div>
            )}
          </button>
        ))}
      </div>
    );
  };
  
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-1">Work Schedule</h3>
        <p className="text-sm text-gray-600">
          Click on days to toggle 7am-7pm shifts
        </p>
      </div>
      
      {/* Month navigation */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={goToPreviousMonth}
          className="p-1 rounded hover:bg-gray-100"
        >
          <ChevronLeft size={20} />
        </button>
        
        <h2 className="text-lg font-medium">{formatMonthHeader()}</h2>
        
        <button
          onClick={goToNextMonth}
          className="p-1 rounded hover:bg-gray-100"
        >
          <ChevronRight size={20} />
        </button>
      </div>
      
      {/* Calendar grid */}
      {renderCalendarDays()}
      
      {/* Legend */}
      <div className="mt-4 flex items-center text-sm text-gray-600">
        <div className="flex items-center mr-4">
          <div className="w-3 h-3 bg-indigo-500 rounded-full mr-1"></div>
          <span>Work day (7am-7pm)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-indigo-100 rounded-full mr-1"></div>
          <span>Today</span>
        </div>
      </div>
    </div>
  );
};

export default WorkScheduleSelector;