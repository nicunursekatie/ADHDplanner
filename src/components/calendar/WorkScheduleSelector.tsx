import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { WorkShift, ShiftType, DEFAULT_SHIFTS } from '../../types/WorkSchedule';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface WorkScheduleSelectorProps {
  onScheduleChange?: () => void;
}

export const WorkScheduleSelector: React.FC<WorkScheduleSelectorProps> = ({
  onScheduleChange
}) => {
  // State for tracking current month view
  const [currentMonth, setCurrentMonth] = useState(new Date().getMonth());
  const [currentYear, setCurrentYear] = useState(new Date().getFullYear());
  const [selectedShiftType, setSelectedShiftType] = useState<ShiftType>('full');
  
  // Get work schedule data from context
  const { workShifts, addWorkShift, updateWorkShift, deleteWorkShift, getShiftsForMonth } = useAppContext();

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
    const existingShift = shiftsLookup[dateStr];
    
    if (existingShift) {
      if (existingShift.shiftType === selectedShiftType) {
        // If clicking the same shift type, remove the shift
        deleteWorkShift(existingShift.id);
      } else {
        // If clicking a different shift type, update the shift
        const newShift = { 
          ...existingShift,
          ...DEFAULT_SHIFTS[selectedShiftType]
        };
        updateWorkShift(newShift);
      }
    } else {
      // Add a new shift with the selected type
      addWorkShift(dateStr, selectedShiftType);
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
              ${isToday(date) && !hasShift ? 'bg-indigo-100' : ''}
              ${(() => {
                if (!hasShift) return 'hover:bg-gray-100';
                const shift = shiftsLookup[dateStr];
                if (shift.shiftType === 'morning') {
                  return 'bg-blue-500 text-white hover:bg-blue-600';
                } else if (shift.shiftType === 'afternoon') {
                  return 'bg-purple-500 text-white hover:bg-purple-600';
                } else {
                  return 'bg-indigo-500 text-white hover:bg-indigo-600';
                }
              })()}
            `}
            title={`${date.toDateString()} - ${hasShift ? 'Click to remove shift' : 'Click to add shift'}`}
          >
            <div className="text-xs absolute top-1 left-1">
              {date.getDate()}
            </div>
            
            {hasShift && (
              <div className="absolute bottom-1 right-1 text-[9px] font-medium">
                {(() => {
                  const shift = shiftsLookup[dateStr];
                  if (shift.shiftType === 'morning') {
                    return '7a-1p';
                  } else if (shift.shiftType === 'afternoon') {
                    return '1p-7p';
                  } else {
                    return '7a-7p';
                  }
                })()}
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
          Select shift type and click on days to toggle shifts
        </p>
        
        {/* Shift type selector */}
        <div className="flex flex-wrap gap-2 mt-3">
          <button 
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              selectedShiftType === 'full' 
                ? 'bg-indigo-500 text-white' 
                : 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
            }`}
            onClick={() => setSelectedShiftType('full')}
          >
            Full Day (7a-7p)
          </button>
          
          <button 
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              selectedShiftType === 'morning' 
                ? 'bg-blue-500 text-white' 
                : 'bg-blue-100 text-blue-700 hover:bg-blue-200'
            }`}
            onClick={() => setSelectedShiftType('morning')}
          >
            Morning (7a-1p)
          </button>
          
          <button 
            className={`px-3 py-1 text-sm rounded-md transition-colors ${
              selectedShiftType === 'afternoon' 
                ? 'bg-purple-500 text-white' 
                : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
            }`}
            onClick={() => setSelectedShiftType('afternoon')}
          >
            Afternoon (1p-7p)
          </button>
        </div>
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
      <div className="mt-4 flex flex-wrap gap-3 items-center text-sm text-gray-600">
        <div className="flex items-center">
          <div className="w-3 h-3 bg-indigo-500 rounded-full mr-1"></div>
          <span>Full day (7a-7p)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-blue-500 rounded-full mr-1"></div>
          <span>Morning (7a-1p)</span>
        </div>
        <div className="flex items-center">
          <div className="w-3 h-3 bg-purple-500 rounded-full mr-1"></div>
          <span>Afternoon (1p-7p)</span>
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