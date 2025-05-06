import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import Card from '../common/Card';
import Button from '../common/Button';
import { ArrowRight, BrainCircuit, Plus, RefreshCw } from 'lucide-react';

interface BrainDumpPromptProps {
  onTaskCreated?: () => void;
}

// Categories of prompts to help users remember different types of tasks
const PROMPT_CATEGORIES = [
  {
    name: 'Work',
    prompts: [
      'Any emails you need to send?',
      'Any upcoming work deadlines?',
      'Meetings you need to prepare for?',
      'Projects that need attention?',
      'Tasks you promised colleagues?',
      'Reports or documents due soon?',
      'Follow-ups from recent meetings?'
    ]
  },
  {
    name: 'Home',
    prompts: [
      'Any household items running low?',
      'Repairs or maintenance needed?',
      'Bills that need to be paid?',
      'Cleaning tasks to schedule?',
      'Errands you need to run?',
      'Items to return or exchange?',
      'Appointments to schedule?'
    ]
  },
  {
    name: 'Personal',
    prompts: [
      'Friends you should reach out to?',
      'Upcoming birthdays or events?',
      'Health appointments needed?',
      'Personal goals to work on?',
      'Books or articles to read?',
      'Hobbies you want to make time for?',
      'Self-care activities to schedule?'
    ]
  },
  {
    name: 'Administrative',
    prompts: [
      'Forms that need to be filled out?',
      'Subscriptions to review or cancel?',
      'Digital files to organize?',
      'Accounts that need attention?',
      'Insurance or financial matters?',
      'Passwords that need updating?',
      'Backups that need to be made?'
    ]
  }
];

const BrainDumpPrompt: React.FC<BrainDumpPromptProps> = ({ onTaskCreated }) => {
  const { quickAddTask } = useAppContext();
  const [currentPrompt, setCurrentPrompt] = useState('');
  const [currentCategory, setCurrentCategory] = useState(0);
  const [promptIndex, setPromptIndex] = useState(0);
  const [taskInput, setTaskInput] = useState('');
  const [recentTasks, setRecentTasks] = useState<string[]>([]);

  // Initialize with a random prompt
  useEffect(() => {
    getNextPrompt();
  }, []);

  const getNextPrompt = () => {
    const randomCategoryIndex = Math.floor(Math.random() * PROMPT_CATEGORIES.length);
    const category = PROMPT_CATEGORIES[randomCategoryIndex];
    const randomPromptIndex = Math.floor(Math.random() * category.prompts.length);
    setCurrentCategory(randomCategoryIndex);
    setPromptIndex(randomPromptIndex);
    setCurrentPrompt(category.prompts[randomPromptIndex]);
  };

  const handleNextPrompt = () => {
    getNextPrompt();
  };

  const handleAddTask = () => {
    if (taskInput.trim()) {
      const newTask = quickAddTask(taskInput);
      setRecentTasks(prev => [...prev.slice(-2), taskInput]); // Keep last 3 tasks
      setTaskInput('');
      if (onTaskCreated) {
        onTaskCreated();
      }
    }
  };

  return (
    <Card className="overflow-hidden">
      <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex items-center">
        <BrainCircuit className="w-5 h-5 text-indigo-500 mr-2" />
        <h3 className="text-lg font-medium text-gray-900">Brain Dump Mode</h3>
      </div>
      
      <div className="p-4">
        <div className="mb-4">
          <div className="bg-indigo-50 rounded-lg p-3 mb-4 flex">
            <div className="text-indigo-700 text-sm font-medium mr-2">
              {PROMPT_CATEGORIES[currentCategory].name}:
            </div>
            <div className="text-gray-700 flex-1">
              {currentPrompt}
            </div>
            <button 
              onClick={handleNextPrompt} 
              className="text-indigo-600 hover:text-indigo-800 ml-2"
              title="Get another prompt"
            >
              <RefreshCw size={18} />
            </button>
          </div>
          
          <div className="flex">
            <input
              type="text"
              value={taskInput}
              onChange={(e) => setTaskInput(e.target.value)}
              className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
              placeholder="Add a task that came to mind..."
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddTask();
                }
              }}
            />
            <Button
              className="rounded-l-none"
              onClick={handleAddTask}
              icon={<Plus size={16} />}
            >
              Add Task
            </Button>
          </div>
        </div>
        
        {recentTasks.length > 0 && (
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Recently Added:</h4>
            <ul className="space-y-1">
              {recentTasks.map((task, index) => (
                <li key={index} className="text-sm text-gray-600 flex items-center">
                  <ArrowRight size={12} className="text-green-500 mr-2" />
                  {task}
                </li>
              ))}
            </ul>
          </div>
        )}
        
        <div className="flex justify-between items-center mt-4 pt-3 border-t border-gray-100">
          <div className="text-xs text-gray-500">
            Keep clicking through prompts to help remember tasks
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={handleNextPrompt}
          >
            Next Prompt
          </Button>
        </div>
      </div>
    </Card>
  );
};

export default BrainDumpPrompt;