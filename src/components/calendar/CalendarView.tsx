import React, { useState } from 'react';
import { Task } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { 
  getOverdueTasks, 
  getTasksDueToday, 
  getTasksDueThisWeek,
  formatDateForDisplay
} from '../../utils/helpers';
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
  const { tasks, projects, categories } = useAppContext();
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
  
  // Render day view
  const renderDayView = () => {
    const tasksForView = getTasksForView();
    const { tasks: tasksForDay } = tasksForView[0];
    
    return (
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h3 className="text-lg font-medium text-gray-900 mb-4">
          Tasks for {formatHeaderDate()}
        </h3>
        
        {tasksForDay.length > 0 ? (
          <div className="space-y-3">
            {tasksForDay.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                projects={projects}
                categories={categories}
                onEdit={onEditTask}
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
          {tasksForView.map(({ date, tasks: tasksForDay }) => (
            <div 
              key={date.toISOString()} 
              className={`min-h-[120px] p-2 border-r last:border-r-0 border-b ${
                isToday(date) ? 'bg-indigo-50' : ''
              }`}
            >
              <div 
                className={`text-sm font-medium mb-2 ${
                  isToday(date) ? 'text-indigo-600' : 'text-gray-700'
                }`}
              >
                {date.getDate()}
              </div>
              
              <div className="space-y-1">
                {tasksForDay.length > 0 ? (
                  tasksForDay.slice(0, 3).map(task => (
                    <div 
                      key={task.id}
                      className="p-1 text-xs bg-indigo-100 rounded truncate cursor-pointer hover:bg-indigo-200"
                      onClick={() => onEditTask(task)}
                    >
                      {task.title}
                    </div>
                  ))
                ) : null}
                
                {tasksForDay.length > 3 && (
                  <div className="text-xs text-gray-500 text-center">
                    +{tasksForDay.length - 3} more
                  </div>
                )}
              </div>
            </div>
          ))}
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
          {tasksForView.map(({ date, tasks: tasksForDay, isPreviousMonth, isNextMonth }) => (
            <div 
              key={date.toISOString()} 
              className={`h-24 p-1 border-r last:border-r-0 border-b overflow-hidden ${
                isToday(date) ? 'bg-indigo-50' : ''
              } ${
                isPreviousMonth || isNextMonth ? 'bg-gray-50' : ''
              }`}
            >
              <div 
                className={`text-xs font-medium mb-1 ${
                  isToday(date) ? 'text-indigo-600' : 
                  isPreviousMonth || isNextMonth ? 'text-gray-400' : 'text-gray-700'
                }`}
              >
                {date.getDate()}
              </div>
              
              <div className="space-y-1 overflow-hidden">
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
            </div>
          ))}
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