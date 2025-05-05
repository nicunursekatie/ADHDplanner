import React, { useState, useRef } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Plus, Circle, Info, Calendar, Flag } from 'lucide-react';

interface EnhancedQuickCaptureProps {
  onTaskAdded?: () => void;
  defaultProjectId?: string | null;
  placeholder?: string;
}

export const EnhancedQuickCapture: React.FC<EnhancedQuickCaptureProps> = ({
  onTaskAdded,
  defaultProjectId = null,
  placeholder = 'Add task...'
}) => {
  const { addTask } = useAppContext();
  const [title, setTitle] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Process input for smart text parsing
  const processInput = (input: string) => {
    let processedTitle = input;
    let dueDate: string | null = null;
    let priority: 'low' | 'medium' | 'high' = 'medium';
    
    // Check for date patterns
    if (input.includes('!today')) {
      const today = new Date();
      dueDate = today.toISOString().split('T')[0];
      processedTitle = input.replace('!today', '').trim();
    } else if (input.includes('!tomorrow')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      dueDate = tomorrow.toISOString().split('T')[0];
      processedTitle = input.replace('!tomorrow', '').trim();
    } else if (input.match(/!(\d+)d/)) {
      const match = input.match(/!(\d+)d/);
      if (match && match[1]) {
        const days = parseInt(match[1], 10);
        const date = new Date();
        date.setDate(date.getDate() + days);
        dueDate = date.toISOString().split('T')[0];
        processedTitle = processedTitle.replace(/!(\d+)d/, '').trim();
      }
    }
    
    // Check for priority markers
    if (input.includes('!high')) {
      priority = 'high';
      processedTitle = processedTitle.replace('!high', '').trim();
    } else if (input.includes('!low')) {
      priority = 'low';
      processedTitle = processedTitle.replace('!low', '').trim();
    }
    
    return { title: processedTitle, dueDate, priority };
  };
  
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && title.trim()) {
      handleAddTask();
    }
  };
  
  const handleAddTask = () => {
    if (!title.trim()) return;
    
    const { title: processedTitle, dueDate, priority } = processInput(title);
    
    addTask({
      title: processedTitle,
      dueDate,
      priority,
      projectId: defaultProjectId,
      completed: false
    });
    
    setTitle('');
    
    if (onTaskAdded) {
      onTaskAdded();
    }
    
    // Maintain focus for rapid task entry
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const renderHelpTooltip = () => {
    if (!showHelp) return null;
    
    return (
      <div className="absolute right-0 top-full mt-2 bg-white shadow-lg rounded-md border border-gray-200 p-3 z-10 w-64">
        <h4 className="font-medium text-gray-900 mb-2">Quick Add Shortcuts:</h4>
        <ul className="space-y-2 text-sm">
          <li className="flex items-start">
            <Calendar size={14} className="text-indigo-500 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium">Date Shortcuts</div>
              <div className="text-gray-600">!today, !tomorrow, !3d (3 days)</div>
            </div>
          </li>
          <li className="flex items-start">
            <Flag size={14} className="text-indigo-500 mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <div className="font-medium">Priority</div>
              <div className="text-gray-600">!high, !low</div>
            </div>
          </li>
        </ul>
        <div className="text-xs text-gray-500 mt-2">
          Example: "Call doctor !tomorrow !high"
        </div>
      </div>
    );
  };
  
  return (
    <div className="relative flex items-center px-3 py-2 bg-white rounded-lg shadow border border-gray-200 focus-within:border-indigo-400 transition">
      <Circle 
        size={18} 
        className="mr-2 text-gray-400 flex-shrink-0" 
      />
      
      <input
        ref={inputRef}
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={handleKeyDown}
        className="flex-grow bg-transparent border-0 focus:ring-0 text-gray-700 placeholder-gray-400 text-sm"
        placeholder={placeholder}
        aria-label="Task title"
      />
      
      <button 
        type="button"
        onClick={() => setShowHelp(!showHelp)}
        className="mr-1 p-1 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600"
        aria-label="Show shortcuts help"
      >
        <Info size={16} />
      </button>
      
      {title.trim() && (
        <button
          onClick={handleAddTask}
          className="p-1 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
          aria-label="Add task"
        >
          <Plus size={18} />
        </button>
      )}
      
      {renderHelpTooltip()}
    </div>
  );
};