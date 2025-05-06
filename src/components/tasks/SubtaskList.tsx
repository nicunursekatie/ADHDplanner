import React, { useState, useEffect } from 'react';
import { Task } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { Plus, X, ChevronDown, ChevronRight } from 'lucide-react';
import Button from '../common/Button';

interface SubtaskListProps {
  parentTaskId: string | null;
  existingSubtasks: string[];
  onSubtasksChange: (subtaskIds: string[]) => void;
}

const SubtaskList: React.FC<SubtaskListProps> = ({
  parentTaskId,
  existingSubtasks,
  onSubtasksChange
}) => {
  const { tasks, addTask } = useAppContext();
  const [expanded, setExpanded] = useState(true);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState('');
  
  // Log props for debugging
  useEffect(() => {
    console.log('SubtaskList rendered with:', { parentTaskId, existingSubtasks });
  }, [parentTaskId, existingSubtasks]);
  
  // Get the actual subtask objects
  const subtasks = tasks.filter(task => 
    existingSubtasks.includes(task.id)
  );
  
  // Toggle expand/collapse
  const toggleExpand = () => {
    setExpanded(!expanded);
  };
  
  // Add a new subtask
  const handleAddSubtask = () => {
    if (!newSubtaskTitle.trim()) return;
    
    const timestamp = new Date().toISOString();
    const newTask = addTask({
      title: newSubtaskTitle,
      parentTaskId: parentTaskId,
      completed: false,
      createdAt: timestamp,
      updatedAt: timestamp
    });
    
    // Update the parent's subtask list
    onSubtasksChange([...existingSubtasks, newTask.id]);
    
    // Clear the input
    setNewSubtaskTitle('');
  };
  
  // Remove a subtask
  const handleRemoveSubtask = (subtaskId: string) => {
    onSubtasksChange(existingSubtasks.filter(id => id !== subtaskId));
  };
  
  // Handle enter key on input
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleAddSubtask();
    }
  };
  
  return (
    <div className="mt-4 border border-gray-200 rounded-md p-3 bg-blue-50">
      <div className="flex items-center justify-between mb-2">
        <button 
          className="flex items-center text-sm font-medium text-gray-700 hover:text-indigo-600"
          onClick={toggleExpand}
        >
          {expanded ? (
            <ChevronDown size={16} className="mr-1" />
          ) : (
            <ChevronRight size={16} className="mr-1" />
          )}
          <span>Subtasks ({subtasks.length})</span>
        </button>
      </div>
      
      {expanded && (
        <>
          {/* List existing subtasks */}
          {subtasks.length > 0 ? (
            <ul className="mb-3 space-y-2">
              {subtasks.map(subtask => (
                <li key={subtask.id} className="flex items-center justify-between bg-gray-50 p-2 rounded-md">
                  <span className={`text-sm ${subtask.completed ? 'line-through text-gray-400' : 'text-gray-700'}`}>
                    {subtask.title}
                  </span>
                  <button
                    onClick={() => handleRemoveSubtask(subtask.id)}
                    className="text-gray-400 hover:text-red-500"
                  >
                    <X size={16} />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-gray-500 mb-3">No subtasks yet. Break down this task into smaller steps.</p>
          )}
          
          {/* Add new subtask input */}
          <div className="flex items-center gap-2">
            <input
              type="text"
              value={newSubtaskTitle}
              onChange={(e) => setNewSubtaskTitle(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Add a subtask..."
              className="flex-grow rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 text-sm"
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              onClick={handleAddSubtask}
              className="flex items-center"
            >
              <Plus size={16} className="mr-1" />
              Add
            </Button>
          </div>
        </>
      )}
    </div>
  );
};

export default SubtaskList;