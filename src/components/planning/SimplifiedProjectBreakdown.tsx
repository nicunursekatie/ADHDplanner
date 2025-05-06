import React, { useState } from 'react';
import { Task, Project, Category } from '../../types';
import { useAppContext } from '../../context/AppContext';
import Button from '../common/Button';
import { ChevronDown, ChevronRight, Save, Plus, Target, Clock, Trash2 } from 'lucide-react';
import { generateId } from '../../utils/helpers';

interface ProjectBreakdownProps {
  project: Project;
  onClose?: () => void;
}

// Simplified breakdown structure with just phases and tasks
interface Phase {
  id: string;
  title: string;
  description?: string;
  expanded: boolean;
  tasks: PhaseTask[];
}

interface PhaseTask {
  id: string;
  title: string;
  description?: string;
}

const SimplifiedProjectBreakdown: React.FC<ProjectBreakdownProps> = ({ 
  project,
  onClose
}) => {
  const { addTask, categories } = useAppContext();
  const [phases, setPhases] = useState<Phase[]>([]);
  const [newPhaseName, setNewPhaseName] = useState('');
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);

  // Phase suggestions based on common project patterns
  const phaseSuggestions = [
    "Planning",
    "Research",
    "Design",
    "Development",
    "Testing",
    "Implementation", 
    "Review",
    "Revision"
  ];
  
  const handleAddPhase = () => {
    if (newPhaseName.trim()) {
      const newPhase: Phase = {
        id: generateId(),
        title: newPhaseName,
        expanded: true,
        tasks: []
      };
      
      setPhases([...phases, newPhase]);
      setNewPhaseName('');
    }
  };

  const handleAddSuggestedPhase = (phaseName: string) => {
    const newPhase: Phase = {
      id: generateId(),
      title: phaseName,
      expanded: true,
      tasks: []
    };
    
    setPhases([...phases, newPhase]);
  };
  
  const handleAddTask = (phaseId: string) => {
    setPhases(phases.map(phase => {
      if (phase.id === phaseId) {
        return {
          ...phase,
          tasks: [
            ...phase.tasks,
            {
              id: generateId(),
              title: "New task",
            }
          ]
        };
      }
      return phase;
    }));
  };
  
  const handleUpdatePhase = (phaseId: string, updates: Partial<Phase>) => {
    setPhases(phases.map(phase => 
      phase.id === phaseId ? { ...phase, ...updates } : phase
    ));
  };
  
  const handleUpdateTask = (phaseId: string, taskId: string, updates: Partial<PhaseTask>) => {
    setPhases(phases.map(phase => {
      if (phase.id === phaseId) {
        return {
          ...phase,
          tasks: phase.tasks.map(task => 
            task.id === taskId ? { ...task, ...updates } : task
          )
        };
      }
      return phase;
    }));
  };
  
  const handleDeletePhase = (phaseId: string) => {
    setPhases(phases.filter(phase => phase.id !== phaseId));
  };
  
  const handleDeleteTask = (phaseId: string, taskId: string) => {
    setPhases(phases.map(phase => {
      if (phase.id === phaseId) {
        return {
          ...phase,
          tasks: phase.tasks.filter(task => task.id !== taskId)
        };
      }
      return phase;
    }));
  };
  
  const handleToggleExpand = (phaseId: string) => {
    setPhases(phases.map(phase => 
      phase.id === phaseId ? { ...phase, expanded: !phase.expanded } : phase
    ));
  };
  
  const handleToggleCategory = (categoryId: string) => {
    setSelectedCategories(prev => {
      if (prev.includes(categoryId)) {
        return prev.filter(id => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };
  
  const handleCreateTasks = () => {
    // Create actual tasks from the breakdown
    for (const phase of phases) {
      for (const phaseTask of phase.tasks) {
        const newTask: Partial<Task> = {
          title: phaseTask.title,
          description: phaseTask.description || '',
          completed: false,
          archived: false,
          projectId: project.id,
          categoryIds: selectedCategories,
          parentTaskId: null,
          size: 'medium',
          priority: 'medium',
          energyLevel: 'medium',
          // Add the phase name to the task description or as a tag
          tags: [phase.title]
        };
        
        addTask(newTask);
      }
    }
    
    if (onClose) {
      onClose();
    }
  };
  
  // Render a phase and its tasks
  const renderPhase = (phase: Phase) => {
    const hasChildren = phase.tasks.length > 0;
    
    return (
      <div key={phase.id} className="mb-4">
        <div className="bg-blue-50 p-3 rounded-md mb-2 relative group">
          <div className="flex items-center">
            {hasChildren && (
              <button
                className="mr-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                onClick={() => handleToggleExpand(phase.id)}
              >
                {phase.expanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
              </button>
            )}
            
            <div className="mr-2">
              <Clock size={16} className="text-blue-600" />
            </div>
            
            <input
              className="flex-grow bg-transparent border-0 focus:ring-0 p-0 font-medium"
              value={phase.title}
              onChange={(e) => handleUpdatePhase(phase.id, { title: e.target.value })}
              placeholder="Phase name"
            />
            
            <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity flex space-x-1">
              <Button
                variant="ghost"
                size="xs"
                icon={<Plus size={14} />}
                onClick={() => handleAddTask(phase.id)}
              >
                Task
              </Button>
              
              <Button
                variant="ghost"
                size="xs"
                className="text-red-500 hover:text-red-700"
                icon={<Trash2 size={14} />}
                onClick={() => handleDeletePhase(phase.id)}
              >
                Delete
              </Button>
            </div>
          </div>
          
          <div className="mt-2">
            <textarea
              className="w-full text-sm bg-blue-50 border-0 focus:ring-0 resize-none"
              value={phase.description || ''}
              onChange={(e) => handleUpdatePhase(phase.id, { description: e.target.value })}
              placeholder="Describe this phase (optional)..."
              rows={1}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = `${target.scrollHeight}px`;
              }}
            />
          </div>
        </div>
        
        {/* Tasks */}
        {phase.expanded && hasChildren && (
          <div className="pl-6 space-y-2">
            {phase.tasks.map(task => (
              <div key={task.id} className="bg-green-50 p-3 rounded-md relative group">
                <div className="flex items-center">
                  <div className="mr-2">
                    <Target size={16} className="text-green-600" />
                  </div>
                  
                  <input
                    className="flex-grow bg-transparent border-0 focus:ring-0 p-0"
                    value={task.title}
                    onChange={(e) => handleUpdateTask(phase.id, task.id, { title: e.target.value })}
                    placeholder="Task title"
                  />
                  
                  <div className="absolute right-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      variant="ghost"
                      size="xs"
                      className="text-red-500 hover:text-red-700"
                      icon={<Trash2 size={14} />}
                      onClick={() => handleDeleteTask(phase.id, task.id)}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
                
                <div className="mt-2">
                  <textarea
                    className="w-full text-sm bg-green-50 border-0 focus:ring-0 resize-none"
                    value={task.description || ''}
                    onChange={(e) => handleUpdateTask(phase.id, task.id, { description: e.target.value })}
                    placeholder="Describe this task..."
                    rows={1}
                    onInput={(e) => {
                      const target = e.target as HTMLTextAreaElement;
                      target.style.height = 'auto';
                      target.style.height = `${target.scrollHeight}px`;
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    );
  };
  
  return (
    <div className="space-y-6 bg-white rounded-lg shadow p-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 mb-1">
          Project Breakdown: {project.name}
        </h2>
        <p className="text-gray-600">
          Break down your project into phases and tasks
        </p>
      </div>
      
      <div className="bg-blue-50 p-4 rounded-md">
        <h3 className="font-medium text-blue-700 flex items-center mb-2">
          <Clock size={18} className="mr-2" />
          Project Phases
        </h3>
        <p className="text-sm text-blue-900 mb-3">
          Start by dividing your project into phases or stages. Then add specific tasks to each phase.
        </p>
        
        <div className="flex space-x-2 mb-3">
          <input
            type="text"
            value={newPhaseName}
            onChange={(e) => setNewPhaseName(e.target.value)}
            className="flex-grow rounded-md border-blue-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
            placeholder="Add a new phase"
          />
          <Button
            variant="secondary"
            onClick={handleAddPhase}
          >
            Add Phase
          </Button>
        </div>
        
        <div>
          <h4 className="text-xs font-medium text-blue-800 mb-2">Suggested phases:</h4>
          <div className="flex flex-wrap gap-2">
            {phaseSuggestions.map(phase => (
              <button
                key={phase}
                className="px-3 py-1 bg-white text-blue-700 rounded-full text-sm border border-blue-200 hover:bg-blue-100"
                onClick={() => handleAddSuggestedPhase(phase)}
              >
                {phase}
              </button>
            ))}
          </div>
        </div>
      </div>
      
      <div className="space-y-2">
        {phases.map(phase => renderPhase(phase))}
        
        {phases.length === 0 && (
          <div className="text-center py-8 text-gray-500 italic">
            Start by adding a project phase above
          </div>
        )}
      </div>
      
      {phases.length > 0 && phases.some(phase => phase.tasks.length > 0) && (
        <div>
          <div className="mb-4">
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
          
          <div className="flex justify-end">
            <Button
              variant="primary"
              icon={<Save size={16} />}
              onClick={handleCreateTasks}
            >
              Create Tasks
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimplifiedProjectBreakdown;