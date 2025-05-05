import React, { useState } from 'react';
import { Task, Project, Category } from '../../types';
import { useAppContext } from '../../context/AppContext';
import Button from '../common/Button';
import { Calendar, Flag, ArrowDownCircle, Save, Plus, Target } from 'lucide-react';
import { formatDate } from '../../utils/helpers';

interface BackwardPlannerProps {
  projectId?: string;
  onClose?: () => void;
}

const BackwardPlanner: React.FC<BackwardPlannerProps> = ({ 
  projectId,
  onClose
}) => {
  const { addTask, projects, categories } = useAppContext();
  const [step, setStep] = useState(1);
  
  // Track our planning inputs
  const [goalTitle, setGoalTitle] = useState('');
  const [goalDescription, setGoalDescription] = useState('');
  const [targetDate, setTargetDate] = useState('');
  const [selectedProject, setSelectedProject] = useState(projectId || '');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [milestones, setMilestones] = useState<{id: string; title: string; dueDate: string}[]>([]);
  const [currentMilestone, setCurrentMilestone] = useState('');
  const [currentMilestoneDate, setCurrentMilestoneDate] = useState('');
  
  // For the final stage
  const [firstStepTitle, setFirstStepTitle] = useState('');
  const [firstStepDescription, setFirstStepDescription] = useState('');
  
  const handleNext = () => {
    if (step < 4) {
      setStep(step + 1);
    }
  };
  
  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const handleAddMilestone = () => {
    if (currentMilestone.trim()) {
      const newMilestone = {
        id: Date.now().toString(),
        title: currentMilestone,
        dueDate: currentMilestoneDate || targetDate
      };
      
      setMilestones([...milestones, newMilestone]);
      setCurrentMilestone('');
      setCurrentMilestoneDate('');
    }
  };
  
  const handleToggleCategory = (categoryId: string) => {
    setSelectedCategories(prevCategories => {
      if (prevCategories.includes(categoryId)) {
        return prevCategories.filter(id => id !== categoryId);
      } else {
        return [...prevCategories, categoryId];
      }
    });
  };
  
  const handleSavePlan = () => {
    // First, create the main goal task
    const goalTask: Partial<Task> = {
      title: goalTitle,
      description: goalDescription,
      dueDate: targetDate,
      projectId: selectedProject || null,
      categoryIds: selectedCategories,
      completed: false,
      archived: false,
      size: 'large',
      priority: 'high',
    };
    
    const mainTask = addTask(goalTask);
    
    // Create milestone tasks in reverse order (backward planning)
    let previousTaskId = null;
    let subtaskIds: string[] = [];
    
    // Sort milestones by date, furthest date first (backward planning)
    const sortedMilestones = [...milestones].sort((a, b) => 
      b.dueDate.localeCompare(a.dueDate)
    );
    
    for (const milestone of sortedMilestones) {
      const milestoneTask: Partial<Task> = {
        title: milestone.title,
        description: `Milestone for ${goalTitle}`,
        dueDate: milestone.dueDate,
        projectId: selectedProject || null,
        categoryIds: selectedCategories,
        completed: false,
        archived: false,
        size: 'medium',
        priority: 'medium',
        parentTaskId: mainTask.id
      };
      
      const createdMilestone = addTask(milestoneTask);
      subtaskIds.push(createdMilestone.id);
      
      // If we have a previous task, add it as a dependency
      if (previousTaskId) {
        // We could also create a more sophisticated dependency system here
      }
      
      previousTaskId = createdMilestone.id;
    }
    
    // Finally, create the first actionable step
    if (firstStepTitle) {
      const firstStep: Partial<Task> = {
        title: firstStepTitle,
        description: firstStepDescription,
        dueDate: new Date().toISOString().split('T')[0], // Today
        projectId: selectedProject || null,
        categoryIds: selectedCategories,
        completed: false,
        archived: false,
        size: 'small',
        priority: 'high',
        energyLevel: 'high',
        parentTaskId: mainTask.id
      };
      
      const createdFirstStep = addTask(firstStep);
      subtaskIds.push(createdFirstStep.id);
    }
    
    // Update main task with all subtasks
    // We can't directly update subtasks because that property gets updated
    // automatically by addTask when setting parentTaskId
    
    if (onClose) {
      onClose();
    }
  };
  
  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-gray-900">Backward Planning</h2>
        <p className="text-gray-600">Start with your end goal and work backward</p>
      </div>
      
      <div className="relative mb-8">
        <div className="flex items-center justify-between">
          <div className={`flex flex-col items-center ${step >= 1 ? 'text-indigo-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= 1 ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'}`}>
              <Flag size={16} />
            </div>
            <span className="text-xs mt-1">Goal</span>
          </div>
          
          <div className={`flex-grow h-1 mx-2 ${step >= 2 ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
          
          <div className={`flex flex-col items-center ${step >= 2 ? 'text-indigo-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= 2 ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'}`}>
              <Calendar size={16} />
            </div>
            <span className="text-xs mt-1">Timeline</span>
          </div>
          
          <div className={`flex-grow h-1 mx-2 ${step >= 3 ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
          
          <div className={`flex flex-col items-center ${step >= 3 ? 'text-indigo-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= 3 ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'}`}>
              <ArrowDownCircle size={16} />
            </div>
            <span className="text-xs mt-1">Milestones</span>
          </div>
          
          <div className={`flex-grow h-1 mx-2 ${step >= 4 ? 'bg-indigo-600' : 'bg-gray-300'}`}></div>
          
          <div className={`flex flex-col items-center ${step >= 4 ? 'text-indigo-600' : 'text-gray-400'}`}>
            <div className={`w-10 h-10 rounded-full flex items-center justify-center border-2 ${step >= 4 ? 'border-indigo-600 bg-indigo-50' : 'border-gray-300'}`}>
              <Target size={16} />
            </div>
            <span className="text-xs mt-1">First Step</span>
          </div>
        </div>
      </div>
      
      {/* Step 1: Define the goal */}
      {step === 1 && (
        <div className="space-y-4">
          <div>
            <label htmlFor="goalTitle" className="block text-sm font-medium text-gray-700 mb-1">
              What's your end goal? <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="goalTitle"
              value={goalTitle}
              onChange={(e) => setGoalTitle(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="e.g., Complete website redesign"
            />
          </div>
          
          <div>
            <label htmlFor="goalDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Describe what success looks like
            </label>
            <textarea
              id="goalDescription"
              value={goalDescription}
              onChange={(e) => setGoalDescription(e.target.value)}
              rows={3}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="What will be different when you're done?"
            />
          </div>
          
          <div>
            <label htmlFor="project" className="block text-sm font-medium text-gray-700 mb-1">
              Project
            </label>
            <select
              id="project"
              value={selectedProject}
              onChange={(e) => setSelectedProject(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            >
              <option value="">No Project</option>
              {projects.map(project => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Categories
            </label>
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <div
                  key={category.id}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-sm cursor-pointer
                    ${selectedCategories.includes(category.id)
                      ? 'text-white'
                      : 'text-gray-700 bg-opacity-25'
                    }`}
                  style={{ 
                    backgroundColor: selectedCategories.includes(category.id) 
                      ? category.color 
                      : `${category.color}40`
                  }}
                  onClick={() => handleToggleCategory(category.id)}
                >
                  <span>{category.name}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      
      {/* Step 2: Define the target date */}
      {step === 2 && (
        <div className="space-y-4">
          <div>
            <label htmlFor="targetDate" className="block text-sm font-medium text-gray-700 mb-1">
              When does this need to be completed? <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              id="targetDate"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
          </div>
          
          <div className="bg-indigo-50 p-4 rounded-md">
            <h3 className="font-medium text-indigo-700 mb-2">Planning backward</h3>
            <p className="text-sm text-indigo-900">
              We'll start with your target date and work backward, breaking down what needs to happen
              before the deadline. This approach works well for ADHD brains because it gives clear
              direction and makes the path to completion more visible.
            </p>
          </div>
        </div>
      )}
      
      {/* Step 3: Define milestones */}
      {step === 3 && (
        <div className="space-y-4">
          <div className="bg-blue-50 p-4 rounded-md mb-4">
            <h3 className="font-medium text-blue-700">Working backward from: {targetDate}</h3>
            <p className="text-sm text-blue-900">
              What major milestones need to happen before your deadline? Add them in any order.
            </p>
          </div>
          
          <div className="space-y-2">
            {milestones.map((milestone, index) => (
              <div key={milestone.id} className="flex items-center bg-gray-50 p-3 rounded-md">
                <span className="font-medium">{milestone.title}</span>
                <span className="ml-auto text-sm text-gray-500">{milestone.dueDate}</span>
                <button
                  className="ml-2 text-red-500 hover:text-red-700"
                  onClick={() => setMilestones(milestones.filter(m => m.id !== milestone.id))}
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
          
          <div className="flex space-x-2">
            <div className="flex-grow">
              <input
                type="text"
                value={currentMilestone}
                onChange={(e) => setCurrentMilestone(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Add a milestone"
              />
            </div>
            <div className="flex-shrink-0 w-1/3">
              <input
                type="date"
                value={currentMilestoneDate}
                onChange={(e) => setCurrentMilestoneDate(e.target.value)}
                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
                placeholder="Date"
              />
            </div>
            <Button
              variant="secondary"
              size="sm"
              icon={<Plus size={16} />}
              onClick={handleAddMilestone}
            >
              Add
            </Button>
          </div>
        </div>
      )}
      
      {/* Step 4: Define the first actionable step */}
      {step === 4 && (
        <div className="space-y-4">
          <div className="bg-green-50 p-4 rounded-md mb-4">
            <h3 className="font-medium text-green-700">What's the very first step?</h3>
            <p className="text-sm text-green-900">
              Define the very first actionable step you can take to start making progress today.
            </p>
          </div>
          
          <div>
            <label htmlFor="firstStepTitle" className="block text-sm font-medium text-gray-700 mb-1">
              First action <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              id="firstStepTitle"
              value={firstStepTitle}
              onChange={(e) => setFirstStepTitle(e.target.value)}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Something concrete you can do right away"
            />
          </div>
          
          <div>
            <label htmlFor="firstStepDescription" className="block text-sm font-medium text-gray-700 mb-1">
              Details
            </label>
            <textarea
              id="firstStepDescription"
              value={firstStepDescription}
              onChange={(e) => setFirstStepDescription(e.target.value)}
              rows={2}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
              placeholder="Any details needed to get started"
            />
          </div>
          
          <div className="mt-2">
            <p className="text-sm text-gray-600">
              This first step will be added as a high-priority, high-energy task for today.
            </p>
          </div>
        </div>
      )}
      
      <div className="flex justify-between mt-8">
        {step > 1 ? (
          <Button
            variant="secondary"
            onClick={handleBack}
          >
            Back
          </Button>
        ) : (
          <div></div> 
        )}
        
        {step < 4 ? (
          <Button
            variant="primary"
            onClick={handleNext}
            disabled={step === 1 && !goalTitle || step === 2 && !targetDate}
          >
            Next
          </Button>
        ) : (
          <Button
            variant="primary"
            icon={<Save size={16} />}
            onClick={handleSavePlan}
            disabled={!firstStepTitle}
          >
            Create Plan
          </Button>
        )}
      </div>
    </div>
  );
};

export default BackwardPlanner;