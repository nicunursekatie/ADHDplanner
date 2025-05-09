import React, { useState } from 'react';
import { Task } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { 
  ChevronLeft, 
  ChevronRight, 
  Calendar as CalendarIcon, 
  GridIcon,
  List,
  Clock
} from 'lucide-react';
import Badge from '../common/Badge';
import TaskCard from '../tasks/TaskCard';
import Button from '../common/Button';

interface CalendarViewProps {
  onEditTask: (task: Task) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ onEditTask }) => {
  const { tasks, projects, categories, deleteTask } = useAppContext();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<'day' | 'week' | 'month'>('week');
  
  // Format the date for the header
  const formatHeaderDate = (): string => {
    if (viewMode === 'day') {
      return currentDate.toLocaleDateString('en-US', {
        weekday: 'long',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      });
    }
    
    if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      
      const startMonth = startOfWeek.toLocaleDateString('en-US', { month: 'short' });
      const endMonth = endOfWeek.toLocaleDateString('en-US', { month: 'short' });
      
      const startDay = startOfWeek.getDate();
      const endDay = endOfWeek.getDate();
      
      const year = currentDate.getFullYear();
      
      if (startMonth === endMonth) {
        return `${startMonth} ${startDay} - ${endDay}, ${year}`;
      }
      
      return `${startMonth} ${startDay} - ${endMonth} ${endDay}, ${year}`;
    }
    
    if (viewMode === 'month') {
      return currentDate.toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      });
    }
    
    return '';
  };
  
  // Navigation functions
  const goToPrevious = () => {
    const newDate = new Date(currentDate);
    
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() - 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() - 7);
    } else if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() - 1);
    }
    
    setCurrentDate(newDate);
  };
  
  const goToNext = () => {
    const newDate = new Date(currentDate);
    
    if (viewMode === 'day') {
      newDate.setDate(newDate.getDate() + 1);
    } else if (viewMode === 'week') {
      newDate.setDate(newDate.getDate() + 7);
    } else if (viewMode === 'month') {
      newDate.setMonth(newDate.getMonth() + 1);
    }
    
    setCurrentDate(newDate);
  };
  
  const goToToday = () => {
    setCurrentDate(new Date());
  };
  
  // Get tasks for the current view
  const getTasksForView = (): { date: Date; tasks: Task[] }[] => {
    if (viewMode === 'day') {
      const dateStr = currentDate.toISOString().split('T')[0];
      const tasksForDay = tasks.filter(task => task.dueDate === dateStr);
      
      return [{ date: currentDate, tasks: tasksForDay }];
    }
    
    if (viewMode === 'week') {
      const startOfWeek = new Date(currentDate);
      startOfWeek.setDate(currentDate.getDate() - currentDate.getDay());
      
      return Array.from({ length: 7 }, (_, i) => {
        const date = new Date(startOfWeek);
        date.setDate(startOfWeek.getDate() + i);
        
        const dateStr = date.toISOString().split('T')[0];
        const tasksForDay = tasks.filter(task => task.dueDate === dateStr);
        
        return { date, tasks: tasksForDay };
      });
    }
    
    if (viewMode === 'month') {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      
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
        const tasksForDay = tasks.filter(task => task.dueDate === dateStr);
        
        daysArray.push({ date, tasks: tasksForDay, isPreviousMonth: true });
      }
      
      // Current month days
      for (let i = 1; i <= lastDayOfMonth.getDate(); i++) {
        const date = new Date(year, month, i);
        const dateStr = date.toISOString().split('T')[0];
        const tasksForDay = tasks.filter(task => task.dueDate === dateStr);
        
        daysArray.push({ date, tasks: tasksForDay });
      }
      
      // Next month days
      const remainingDays = totalDays - daysArray.length;
      for (let i = 1; i <= remainingDays; i++) {
        const date = new Date(year, month + 1, i);
        const dateStr = date.toISOString().split('T')[0];
        const tasksForDay = tasks.filter(task => task.dueDate === dateStr);
        
        daysArray.push({ date, tasks: tasksForDay, isNextMonth: true });
      }
      
      return daysArray;
    }
    
    return [];
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
  
  // Check if a date has a work shift
  const getDateShift = (date: Date): { timeRange: string, shiftType: string } | null => {
    const appContext = useAppContext();
    const dateStr = date.toISOString().split('T')[0];
    const shift = appContext.getShiftForDate(dateStr);
    
    if (!shift) return null;
    
    const timeRange = `${shift.startTime.substring(0, 5)} - ${shift.endTime.substring(0, 5)}`;
    const shiftType = shift.shiftType || 'full';
    
    return { timeRange, shiftType };
  };
  
  // Render day view
  const renderDayView = () => {
    const tasksForView = getTasksForView();
    const { date, tasks: tasksForDay } = tasksForView[0];
    const workShift = getDateShift(date);
    
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-gray-900">
            Tasks for {formatHeaderDate()}
          </h3>
          
          {workShift && (
            <div className={`flex items-center px-3 py-1 rounded-full text-sm ${
              workShift.shiftType === 'morning' ? 'bg-blue-100 text-blue-700' :
              workShift.shiftType === 'afternoon' ? 'bg-purple-100 text-purple-700' :
              'bg-indigo-100 text-indigo-700'
            }`}>
              <Clock size={16} className="mr-1" />
              <span>Work Shift: {workShift.timeRange}</span>
            </div>
          )}
        </div>
        
        {workShift && (
          <div className={`rounded-lg mb-4 border overflow-hidden ${
            workShift.shiftType === 'morning' ? 'bg-blue-100 border-blue-300' :
            workShift.shiftType === 'afternoon' ? 'bg-purple-100 border-purple-300' :
            'bg-indigo-100 border-indigo-300'
          }`}>
            <div className={`text-white px-4 py-2 font-medium flex justify-between items-center ${
              workShift.shiftType === 'morning' ? 'bg-blue-500' :
              workShift.shiftType === 'afternoon' ? 'bg-purple-500' :
              'bg-indigo-500'
            }`}>
              <div className="flex items-center">
                <Clock className="mr-2" size={18} />
                <span>
                  {workShift.shiftType === 'morning' ? 'Morning Shift (6-Hour)' :
                   workShift.shiftType === 'afternoon' ? 'Afternoon Shift (6-Hour)' :
                   'Work Day (12-Hour Shift)'}
                </span>
              </div>
              <span>{workShift.timeRange}</span>
            </div>
            <div className="p-4">
              <div className="relative h-16 bg-white rounded-lg overflow-hidden">
                <div className="absolute inset-0 flex">
                  {/* Time scale */}
                  <div className="flex w-full">
                    {Array.from({ length: 24 }).map((_, i) => (
                      <div key={i} className="flex-1 border-r border-gray-100 text-center relative">
                        {i % 2 === 0 && (
                          <span className="absolute bottom-0 left-0 text-[9px] text-gray-400 px-0.5">
                            {i}:00
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                  
                  {/* Work block */}
                  <div 
                    className="absolute h-full" 
                    style={{ 
                      left: workShift.shiftType === 'morning' ? '29.16%' : 
                             workShift.shiftType === 'afternoon' ? '54.16%' : '29.16%', 
                      width: workShift.shiftType === 'full' ? '50%' : '25%', 
                      top: 0 
                    }}
                  >
                    <div className={`h-full w-full flex items-center justify-center text-white bg-opacity-90 ${
                      workShift.shiftType === 'morning' ? 'bg-blue-500' :
                      workShift.shiftType === 'afternoon' ? 'bg-purple-500' :
                      'bg-indigo-500'
                    }`}>
                      <span className="text-white text-sm font-medium">
                        {workShift.shiftType === 'morning' ? 'Morning' :
                         workShift.shiftType === 'afternoon' ? 'Afternoon' :
                         'Full-Day'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              <p className={`mt-3 text-sm text-center ${
                workShift.shiftType === 'morning' ? 'text-blue-700' :
                workShift.shiftType === 'afternoon' ? 'text-purple-700' :
                'text-indigo-700'
              }`}>
                {workShift.shiftType === 'full' 
                  ? 'This day is mostly filled with your work schedule, leaving limited time for other tasks.'
                  : 'You have a half-day shift scheduled, allowing time for other tasks.'}
              </p>
            </div>
          </div>
        )}
        
        {tasksForDay.length > 0 ? (
          <div className="space-y-3">
            {tasksForDay.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                projects={projects}
                categories={categories}
                onEdit={onEditTask}
                onDelete={deleteTask}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-500">
            No tasks scheduled for this day
          </div>
        )}
      </div>
    );
  };
  
  // Render week view
  const renderWeekView = () => {
    const tasksForView = getTasksForView();
    
    return (
      <div className="bg-white rounded-lg shadow-sm">
        <div className="grid grid-cols-7 border-b">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div 
              key={day} 
              className="p-2 text-center text-sm font-medium text-gray-700 border-r last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7">
          {tasksForView.map(({ date, tasks: tasksForDay }) => {
            const workShift = getDateShift(date);
            
            return (
              <div 
                key={date.toISOString()} 
                className={`h-[150px] p-2 border-r last:border-r-0 border-b ${
                  isToday(date) ? 'bg-indigo-50' : ''
                }`}
              >
                <div className="flex justify-between items-start mb-2">
                  <div 
                    className={`text-sm font-medium ${
                      isToday(date) ? 'text-indigo-600' : 'text-gray-700'
                    }`}
                  >
                    {date.getDate()}
                  </div>
                </div>
                
                {workShift ? (
                  <div className="flex flex-col h-full space-y-1">
                    {/* Prominent work shift indicator */}
                    <div className={`px-2 py-1 rounded text-xs font-medium flex items-center justify-between text-white ${
                      workShift.shiftType === 'morning' ? 'bg-blue-500' :
                      workShift.shiftType === 'afternoon' ? 'bg-purple-500' :
                      'bg-indigo-500'
                    }`}>
                      <span>
                        {workShift.shiftType === 'morning' ? 'MORNING' :
                         workShift.shiftType === 'afternoon' ? 'AFTERNOON' :
                         'WORK DAY'}
                      </span>
                      <span>{workShift.timeRange.replace(':00', '')}</span>
                    </div>
                    
                    {/* Visual time block representation */}
                    <div className={`h-10 rounded border p-1 relative mb-1 overflow-hidden ${
                      workShift.shiftType === 'morning' ? 'bg-blue-100 border-blue-200' :
                      workShift.shiftType === 'afternoon' ? 'bg-purple-100 border-purple-200' :
                      'bg-indigo-100 border-indigo-200'
                    }`}>
                      <div className={`absolute flex items-center justify-center bg-opacity-60 ${
                        workShift.shiftType === 'morning' ? 'bg-blue-200 left-0 w-1/2' :
                        workShift.shiftType === 'afternoon' ? 'bg-purple-200 left-1/2 w-1/2' :
                        'bg-indigo-200 inset-0'
                      }`}>
                        <span className={`text-xs font-medium px-1 py-0.5 bg-white bg-opacity-60 rounded ${
                          workShift.shiftType === 'morning' ? 'text-blue-700' :
                          workShift.shiftType === 'afternoon' ? 'text-purple-700' :
                          'text-indigo-700'
                        }`}>
                          {workShift.shiftType === 'morning' ? '6hr Morning' :
                           workShift.shiftType === 'afternoon' ? '6hr Afternoon' :
                           '12hr Shift'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Tasks (limited space due to work shift) */}
                    <div className="space-y-1 max-h-12 overflow-hidden">
                      {tasksForDay.length > 0 ? (
                        tasksForDay.slice(0, workShift.shiftType === 'full' ? 1 : 2).map(task => (
                          <div 
                            key={task.id}
                            className="p-1 text-xs bg-green-100 rounded truncate cursor-pointer hover:bg-green-200"
                            onClick={() => onEditTask(task)}
                          >
                            {task.title}
                          </div>
                        ))
                      ) : null}
                      
                      {tasksForDay.length > (workShift.shiftType === 'full' ? 1 : 2) && (
                        <div className="text-xs text-gray-500 text-center">
                          +{tasksForDay.length - (workShift.shiftType === 'full' ? 1 : 2)} more
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-1">
                    {tasksForDay.length > 0 ? (
                      tasksForDay.slice(0, 4).map(task => (
                        <div 
                          key={task.id}
                          className="p-1 text-xs bg-indigo-100 rounded truncate cursor-pointer hover:bg-indigo-200"
                          onClick={() => onEditTask(task)}
                        >
                          {task.title}
                        </div>
                      ))
                    ) : null}
                    
                    {tasksForDay.length > 4 && (
                      <div className="text-xs text-gray-500 text-center">
                        +{tasksForDay.length - 4} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  // Render month view
  const renderMonthView = () => {
    const tasksForView = getTasksForView();
    
    return (
      <div className="bg-white rounded-lg shadow-sm">
        <div className="grid grid-cols-7 border-b">
          {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
            <div 
              key={day} 
              className="p-2 text-center text-sm font-medium text-gray-700 border-r last:border-r-0"
            >
              {day}
            </div>
          ))}
        </div>
        
        <div className="grid grid-cols-7">
          {tasksForView.map(({ date, tasks: tasksForDay, isPreviousMonth, isNextMonth }) => {
            const workShift = getDateShift(date);
            const isCurrentMonth = !(isPreviousMonth || isNextMonth);
            
            return (
              <div 
                key={date.toISOString()} 
                className={`h-[5.5rem] p-1 border-r last:border-r-0 border-b overflow-hidden ${
                  isToday(date) ? 'bg-indigo-50' : ''
                } ${
                  isPreviousMonth || isNextMonth ? 'bg-gray-50' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div 
                    className={`text-xs font-medium ${
                      isToday(date) ? 'text-indigo-600' : 
                      isPreviousMonth || isNextMonth ? 'text-gray-400' : 'text-gray-700'
                    }`}
                  >
                    {date.getDate()}
                  </div>
                </div>
                
                {/* Work shift display takes priority for current month */}
                {workShift && isCurrentMonth ? (
                  <div className="flex flex-col space-y-0.5 mt-1">
                    {/* Work shift badge */}
                    <div className={`text-white text-[8px] font-bold px-1 rounded-sm ${
                      workShift.shiftType === 'morning' ? 'bg-blue-500' :
                      workShift.shiftType === 'afternoon' ? 'bg-purple-500' :
                      'bg-indigo-500'
                    }`}>
                      {workShift.shiftType === 'morning' ? 'MORNING' :
                       workShift.shiftType === 'afternoon' ? 'AFTERNOON' :
                       'WORK DAY'}
                    </div>
                    
                    {/* Visual shift block */}
                    <div className={`h-9 rounded-sm relative border ${
                      workShift.shiftType === 'morning' ? 'bg-blue-100 border-blue-200' :
                      workShift.shiftType === 'afternoon' ? 'bg-purple-100 border-purple-200' :
                      'bg-indigo-100 border-indigo-200'
                    }`}>
                      <div className={`absolute bg-opacity-50 ${
                        workShift.shiftType === 'morning' ? 'bg-blue-200 left-0 w-1/2 h-full' :
                        workShift.shiftType === 'afternoon' ? 'bg-purple-200 left-1/2 w-1/2 h-full' :
                        'bg-indigo-200 inset-0'
                      }`}>
                        <div className="w-full h-full flex items-center justify-center">
                          <span className={`text-[8px] bg-white bg-opacity-70 px-0.5 rounded ${
                            workShift.shiftType === 'morning' ? 'text-blue-700' :
                            workShift.shiftType === 'afternoon' ? 'text-purple-700' :
                            'text-indigo-700'
                          }`}>
                            {workShift.timeRange.replace(':00', '')}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    {/* Limited task space when there's a work shift */}
                    {tasksForDay.length > 0 && (
                      <div className="text-[8px] text-gray-500">
                        {tasksForDay.length} task{tasksForDay.length !== 1 ? 's' : ''}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1 overflow-hidden mt-1">
                    {tasksForDay.length > 0 ? (
                      tasksForDay.slice(0, 2).map(task => (
                        <div 
                          key={task.id}
                          className="p-0.5 text-[10px] bg-indigo-100 rounded truncate cursor-pointer hover:bg-indigo-200"
                          onClick={() => onEditTask(task)}
                        >
                          {task.title}
                        </div>
                      ))
                    ) : null}
                    
                    {tasksForDay.length > 2 && (
                      <div className="text-[10px] text-gray-500">
                        +{tasksForDay.length - 2} more
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    );
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-col md:flex-row justify-between items-center">
        <div className="flex items-center space-x-2 mb-3 md:mb-0">
          <button
            onClick={goToPrevious}
            className="p-1 rounded hover:bg-gray-100"
          >
            <ChevronLeft size={20} />
          </button>
          
          <h2 className="text-xl font-bold">{formatHeaderDate()}</h2>
          
          <button
            onClick={goToNext}
            className="p-1 rounded hover:bg-gray-100"
          >
            <ChevronRight size={20} />
          </button>
          
          <Button
            variant="secondary"
            size="sm"
            onClick={goToToday}
            className="ml-2"
          >
            Today
          </Button>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button
            variant={viewMode === 'day' ? 'primary' : 'secondary'}
            size="sm"
            icon={<Clock size={16} />}
            onClick={() => setViewMode('day')}
          >
            Day
          </Button>
          <Button
            variant={viewMode === 'week' ? 'primary' : 'secondary'}
            size="sm"
            icon={<List size={16} />}
            onClick={() => setViewMode('week')}
          >
            Week
          </Button>
          <Button
            variant={viewMode === 'month' ? 'primary' : 'secondary'}
            size="sm"
            icon={<CalendarIcon size={16} />}
            onClick={() => setViewMode('month')}
          >
            Month
          </Button>
        </div>
      </div>
      
      {viewMode === 'day' && renderDayView()}
      {viewMode === 'week' && renderWeekView()}
      {viewMode === 'month' && renderMonthView()}
    </div>
  );
};

export default CalendarView;