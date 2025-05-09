import React, { useState, useRef, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Plus, Circle } from 'lucide-react';

interface QuickCaptureProps {
  onTaskAdded?: () => void;
  defaultProjectId?: string | null;
  placeholder?: string;
}

export const QuickCapture: React.FC<QuickCaptureProps> = ({
  onTaskAdded,
  defaultProjectId = null,
  placeholder = 'Add task...'
}) => {
  const { addTask } = useAppContext();
  const [title, setTitle] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Process input for smart text parsing
  const processInput = (input: string) => {
    // Keep spaces in the input during editing
    let processedTitle = input;
    let dueDate: string | null = null;
    let priority: 'low' | 'medium' | 'high' = 'medium';
    
    // Check for date patterns (basic ones that are easy to remember)
    if (input.includes('!today')) {
      const today = new Date();
      dueDate = today.toISOString().split('T')[0];
      processedTitle = input.replace('!today', '');
    } else if (input.includes('!tomorrow')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      dueDate = tomorrow.toISOString().split('T')[0];
      processedTitle = input.replace('!tomorrow', '');
    }
    
    // Check for priority markers
    if (input.includes('!high')) {
      priority = 'high';
      processedTitle = processedTitle.replace('!high', '');
    } else if (input.includes('!low')) {
      priority = 'low';
      processedTitle = processedTitle.replace('!low', '');
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
      title: processedTitle.trim(), // Ensure we trim the title when saving
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
  
  return (
    <div className="flex items-center px-3 py-2 bg-white rounded-lg shadow border border-gray-200 focus-within:border-indigo-400 transition">
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
      
      {title.trim() && (
        <button
          onClick={handleAddTask}
          className="ml-2 p-1 rounded-full bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
          aria-label="Add task"
        >
          <Plus size={18} />
        </button>
      )}
    </div>
  );
};