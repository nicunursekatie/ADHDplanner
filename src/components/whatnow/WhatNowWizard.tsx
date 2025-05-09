import React, { useState, useEffect } from 'react';
import { Task, WhatNowCriteria } from '../../types';
import { useAppContext } from '../../context/AppContext';
import Card from '../common/Card';
import Button from '../common/Button';
import TaskCard from '../tasks/TaskCard';
import { CloudLightning as Lightning, Clock, BrainCircuit } from 'lucide-react';

interface WhatNowWizardProps {
  onSelectTask: (task: Task) => void;
}

const WhatNowWizard: React.FC<WhatNowWizardProps> = ({ onSelectTask }) => {
  const { recommendTasks, projects, categories, deleteTask } = useAppContext();
  
  const [step, setStep] = useState(1);
  const [criteria, setCriteria] = useState<WhatNowCriteria>({
    availableTime: 'medium',
    energyLevel: 'medium',
    blockers: [],
  });
  
  const [recommendedTasks, setRecommendedTasks] = useState<Task[]>([]);
  const [newBlocker, setNewBlocker] = useState('');
  
  useEffect(() => {
    if (step === 4) {
      const tasks = recommendTasks(criteria);
      setRecommendedTasks(tasks);
    }
  }, [step, criteria, recommendTasks]);
  
  const handleTimeSelection = (time: 'short' | 'medium' | 'long') => {
    setCriteria(prev => ({ ...prev, availableTime: time }));
    setStep(2);
  };
  
  const handleEnergySelection = (energy: 'low' | 'medium' | 'high') => {
    setCriteria(prev => ({ ...prev, energyLevel: energy }));
    setStep(3);
  };
  
  const handleAddBlocker = () => {
    if (newBlocker.trim()) {
      setCriteria(prev => ({
        ...prev,
        blockers: [...prev.blockers, newBlocker.trim()],
      }));
      setNewBlocker('');
    }
  };
  
  const handleRemoveBlocker = (index: number) => {
    setCriteria(prev => ({
      ...prev,
      blockers: prev.blockers.filter((_, i) => i !== index),
    }));
  };
  
  const handleNextFromBlockers = () => {
    setStep(4);
  };
  
  const handleReset = () => {
    setStep(1);
    setCriteria({
      availableTime: 'medium',
      energyLevel: 'medium',
      blockers: [],
    });
    setRecommendedTasks([]);
  };
  
  const renderStep1 = () => (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">How much time do you have?</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button 
          className="w-full border-none bg-transparent p-0 text-left cursor-pointer" 
          onClick={() => handleTimeSelection('short')}
        >
          <Card className="hover:shadow-md transition-shadow h-full">
            <div className="text-center">
              <Clock className="w-10 h-10 text-indigo-500 mx-auto mb-2" />
              <h3 className="text-lg font-medium text-gray-900">
                A little time
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Less than 30 minutes
              </p>
            </div>
          </Card>
        </button>
        
        <button 
          className="w-full border-none bg-transparent p-0 text-left cursor-pointer" 
          onClick={() => handleTimeSelection('medium')}
        >
          <Card className="hover:shadow-md transition-shadow h-full">
            <div className="text-center">
              <Clock className="w-10 h-10 text-indigo-500 mx-auto mb-2" />
              <h3 className="text-lg font-medium text-gray-900">
                Some time
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                30 minutes to 2 hours
              </p>
            </div>
          </Card>
        </button>
        
        <button 
          className="w-full border-none bg-transparent p-0 text-left cursor-pointer" 
          onClick={() => handleTimeSelection('long')}
        >
          <Card className="hover:shadow-md transition-shadow h-full">
            <div className="text-center">
              <Clock className="w-10 h-10 text-indigo-500 mx-auto mb-2" />
              <h3 className="text-lg font-medium text-gray-900">
                Lots of time
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                More than 2 hours
              </p>
            </div>
          </Card>
        </button>
      </div>
    </div>
  );
  
  const renderStep2 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">How's your energy level?</h2>
        <button 
          onClick={() => setStep(1)}
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          Back
        </button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button 
          className="w-full border-none bg-transparent p-0 text-left cursor-pointer" 
          onClick={() => handleEnergySelection('low')}
        >
          <Card className="hover:shadow-md transition-shadow h-full">
            <div className="text-center">
              <Lightning className="w-10 h-10 text-orange-500 mx-auto mb-2" />
              <h3 className="text-lg font-medium text-gray-900">
                Low Energy
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Tired, unfocused, or unmotivated
              </p>
            </div>
          </Card>
        </button>
        
        <button 
          className="w-full border-none bg-transparent p-0 text-left cursor-pointer" 
          onClick={() => handleEnergySelection('medium')}
        >
          <Card className="hover:shadow-md transition-shadow h-full">
            <div className="text-center">
              <Lightning className="w-10 h-10 text-yellow-500 mx-auto mb-2" />
              <h3 className="text-lg font-medium text-gray-900">
                Medium Energy
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Average focus and motivation
              </p>
            </div>
          </Card>
        </button>
        
        <button 
          className="w-full border-none bg-transparent p-0 text-left cursor-pointer" 
          onClick={() => handleEnergySelection('high')}
        >
          <Card className="hover:shadow-md transition-shadow h-full">
            <div className="text-center">
              <Lightning className="w-10 h-10 text-green-500 mx-auto mb-2" />
              <h3 className="text-lg font-medium text-gray-900">
                High Energy
              </h3>
              <p className="text-sm text-gray-500 mt-1">
                Focused, motivated, and ready to work
              </p>
            </div>
          </Card>
        </button>
      </div>
    </div>
  );
  
  const renderStep3 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Any current blockers?</h2>
        <button 
          onClick={() => setStep(2)}
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          Back
        </button>
      </div>
      
      <Card>
        <div className="space-y-4">
          <p className="text-gray-600">
            Add any current limitations (e.g., "no internet", "can't make noise", "no computer")
          </p>
          
          <div className="flex">
            <input
              type="text"
              value={newBlocker}
              onChange={(e) => setNewBlocker(e.target.value)}
              className="block w-full rounded-l-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Enter a blocker"
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleAddBlocker();
                }
              }}
            />
            <Button
              onClick={handleAddBlocker}
              className="rounded-l-none"
            >
              Add
            </Button>
          </div>
          
          {criteria.blockers.length > 0 && (
            <div className="mt-4">
              <h3 className="text-sm font-medium text-gray-700 mb-2">Current blockers:</h3>
              <div className="flex flex-wrap gap-2">
                {criteria.blockers.map((blocker, index) => (
                  <div 
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-gray-100 text-gray-800"
                  >
                    <span>{blocker}</span>
                    <button
                      className="ml-2 text-gray-500 hover:text-gray-700"
                      onClick={() => handleRemoveBlocker(index)}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          <div className="flex justify-end pt-4">
            <Button
              onClick={handleNextFromBlockers}
            >
              Find Tasks
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
  
  const renderStep4 = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-900">Recommended Tasks</h2>
        <button 
          onClick={() => setStep(3)}
          className="text-sm text-indigo-600 hover:text-indigo-800"
        >
          Back
        </button>
      </div>
      
      <Card className="bg-indigo-50 border border-indigo-100">
        <div className="flex items-start">
          <BrainCircuit className="w-8 h-8 text-indigo-500 mr-4 flex-shrink-0 mt-1" />
          <div>
            <h3 className="text-lg font-medium text-gray-900">
              Based on your preferences
            </h3>
            <ul className="mt-2 text-sm text-gray-600 space-y-1">
              <li>
                <span className="font-medium">Time:</span> {criteria.availableTime === 'short' ? 'A little time' : criteria.availableTime === 'medium' ? 'Some time' : 'Lots of time'}
              </li>
              <li>
                <span className="font-medium">Energy:</span> {criteria.energyLevel === 'low' ? 'Low energy' : criteria.energyLevel === 'medium' ? 'Medium energy' : 'High energy'}
              </li>
              {criteria.blockers.length > 0 && (
                <li>
                  <span className="font-medium">Blockers:</span> {criteria.blockers.join(', ')}
                </li>
              )}
            </ul>
          </div>
        </div>
      </Card>
      
      <div className="space-y-4">
        {recommendedTasks.length > 0 ? (
          recommendedTasks.map(task => (
            <TaskCard
              key={task.id}
              task={task}
              projects={projects}
              categories={categories}
              onEdit={onSelectTask}
              onDelete={deleteTask}
            />
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            <p>No tasks match your criteria.</p>
            <p className="mt-2">Try adjusting your preferences or adding new tasks.</p>
          </div>
        )}
      </div>
      
      <div className="flex justify-center pt-4">
        <Button
          variant="secondary"
          onClick={handleReset}
        >
          Start Over
        </Button>
      </div>
    </div>
  );
  
  return (
    <div className="max-w-3xl mx-auto">
      {step === 1 && renderStep1()}
      {step === 2 && renderStep2()}
      {step === 3 && renderStep3()}
      {step === 4 && renderStep4()}
    </div>
  );
};

export default WhatNowWizard;