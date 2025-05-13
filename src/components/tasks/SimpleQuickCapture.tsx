import React, { useState, memo, useCallback } from 'react';
import { Send } from 'lucide-react';
import { useAppContext } from '../../context/AppContext';
import { formatDate } from '../../utils/helpers';

interface SimpleQuickCaptureProps {
  placeholder?: string;
  defaultDueDate?: string | null;
}

/**
 * A simplified quick capture component that doesn't cause the parent to re-render
 * Uses internal state management to avoid causing re-renders in the parent component
 */
const SimpleQuickCapture: React.FC<SimpleQuickCaptureProps> = memo(({
  placeholder = 'Add a new task...',
  defaultDueDate = null
}) => {
  const { addTask } = useAppContext();
  const [inputValue, setInputValue] = useState('');
  
  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setInputValue(e.target.value);
  }, []);
  
  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (!inputValue.trim()) return;
    
    const taskTitle = inputValue.trim();
    
    // Process command modifiers (!today, !tomorrow, !high, etc)
    let dueDate = defaultDueDate;
    let priority: 'low' | 'medium' | 'high' | undefined = undefined;
    
    if (taskTitle.includes('!today')) {
      dueDate = formatDate(new Date());
    } else if (taskTitle.includes('!tomorrow')) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      dueDate = formatDate(tomorrow);
    } else if (taskTitle.includes('!next-week')) {
      const nextWeek = new Date();
      nextWeek.setDate(nextWeek.getDate() + 7);
      dueDate = formatDate(nextWeek);
    }
    
    if (taskTitle.includes('!high')) {
      priority = 'high';
    } else if (taskTitle.includes('!medium')) {
      priority = 'medium';
    } else if (taskTitle.includes('!low')) {
      priority = 'low';
    }
    
    // Clean up the title by removing any command modifiers
    const cleanTitle = taskTitle
      .replace(/!today|!tomorrow|!next-week|!high|!medium|!low/g, '')
      .trim();
    
    if (cleanTitle) {
      addTask({
        title: cleanTitle,
        dueDate,
        priority,
        completed: false,
        archived: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
      
      // Clear the input
      setInputValue('');
    }
  }, [inputValue, defaultDueDate, addTask]);
  
  return (
    <form onSubmit={handleSubmit} className="relative">
      <input
        type="text"
        className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 pl-4 pr-10 py-2"
        placeholder={placeholder}
        value={inputValue}
        onChange={handleInputChange}
      />
      <button
        type="submit"
        className="absolute inset-y-0 right-0 px-3 flex items-center text-gray-400 hover:text-indigo-500"
        disabled={!inputValue.trim()}
      >
        <Send size={18} />
      </button>
    </form>
  );
});

export default SimpleQuickCapture;