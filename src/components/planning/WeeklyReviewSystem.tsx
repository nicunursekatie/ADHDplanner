import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Task, Project } from '../../types';
import Card from '../common/Card';
import Button from '../common/Button';
import { ImprovedTaskCard } from '../tasks/ImprovedTaskCard';
import { formatDate } from '../../utils/helpers';
import { 
  Calendar, 
  CheckCircle, 
  ChevronRight, 
  ClipboardList, 
  Clock, 
  LayoutGrid, 
  NotebookPen, 
  Plus, 
  RefreshCw 
} from 'lucide-react';

interface WeeklyReviewSystemProps {
  onTaskCreated?: () => void;
}

type ReviewSection = {
  id: string;
  title: string;
  icon: React.ReactNode;
  description: string;
  prompts: string[];
  complete: boolean;
}

const WeeklyReviewSystem: React.FC<WeeklyReviewSystemProps> = ({ onTaskCreated }) => {
  const { tasks, projects, quickAddTask, updateTask } = useAppContext();
  const [taskInput, setTaskInput] = useState('');
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [reviewComplete, setReviewComplete] = useState(false);
  
  // Get dates for this week and next week
  const today = new Date();
  const nextWeek = new Date();
  nextWeek.setDate(today.getDate() + 7);
  
  const incompleteTasks = tasks.filter(task => !task.completed);
  const tasksDueThisWeek = incompleteTasks.filter(task => 
    task.dueDate && 
    task.dueDate >= formatDate(today) && 
    task.dueDate <= formatDate(nextWeek)
  );
  
  const overdueTasks = incompleteTasks.filter(task => 
    task.dueDate && task.dueDate < formatDate(today)
  );
  
  // Get recently completed tasks (within last 7 days)
  const lastWeek = new Date();
  lastWeek.setDate(today.getDate() - 7);
  const recentlyCompleted = tasks.filter(task => 
    task.completed && 
    new Date(task.updatedAt) >= lastWeek
  );
  
  // Review sections with guided prompts
  const [reviewSections, setReviewSections] = useState<ReviewSection[]>([
    {
      id: 'reflect',
      title: 'Reflect on Your Week',
      icon: <NotebookPen size={18} />,
      description: "Review what went well and what you'd like to improve",
      prompts: [
        'What went well this week?',
        'What were your biggest accomplishments?',
        "What didn't go as planned?",
        'What would make next week better?',
        "Any patterns you're noticing in your productivity?"
      ],
      complete: false
    },
    {
      id: 'overdue',
      title: 'Review Overdue Tasks',
      icon: <Clock size={18} />,
      description: `You have ${overdueTasks.length} overdue tasks to review`,
      prompts: [
        'Do these tasks still need to be done?',
        'What prevented you from completing these?',
        'Can any of these be broken down into smaller steps?',
        'Should any of these be delegated or dropped?',
        'Which ones are actually urgent vs. just feeling urgent?'
      ],
      complete: false
    },
    {
      id: 'upcoming',
      title: 'Plan for the Week Ahead',
      icon: <Calendar size={18} />,
      description: 'Set yourself up for success next week',
      prompts: [
        'What are your top 3 priorities for next week?',
        'Any important deadlines or events coming up?',
        'Are there preparations you need to make?',
        'Any potential obstacles you should plan for?',
        'Is your calendar aligned with your priorities?'
      ],
      complete: false
    },
    {
      id: 'projects',
      title: 'Review Current Projects',
      icon: <LayoutGrid size={18} />,
      description: `Check progress on your ${projects.length} projects`,
      prompts: [
        'Are all your projects moving forward?',
        'Are there projects that need more attention?',
        'Any projects missing next actions?',
        'Should any projects be put on hold?',
        'Are there any dependencies blocking progress?'
      ],
      complete: false
    },
    {
      id: 'life-areas',
      title: 'Life Areas Check-In',
      icon: <ClipboardList size={18} />,
      description: 'Make sure nothing important is slipping through the cracks',
      prompts: [
        'Health: Any appointments, medications, or health habits to track?',
        'Relationships: Birthdays, special occasions, or people to connect with?',
        'Home: Any maintenance, cleaning, or household purchases needed?',
        'Personal growth: Progress on learning or hobbies?',
        'Finances: Bills to pay, budgets to review, financial decisions?'
      ],
      complete: false
    }
  ]);
  
  const handleAddTask = () => {
    if (taskInput.trim()) {
      quickAddTask(taskInput);
      setTaskInput('');
      if (onTaskCreated) {
        onTaskCreated();
      }
    }
  };
  
  const handleNextPrompt = () => {
    if (activeSectionId) {
      const section = reviewSections.find(s => s.id === activeSectionId);
      if (section) {
        if (currentPromptIndex < section.prompts.length - 1) {
          setCurrentPromptIndex(currentPromptIndex + 1);
        } else {
          // Mark section as complete if we've gone through all prompts
          const updatedSections = reviewSections.map(s => 
            s.id === activeSectionId ? { ...s, complete: true } : s
          );
          setReviewSections(updatedSections);
          setActiveSectionId(null);
          setCurrentPromptIndex(0);
          
          // Check if all sections are complete
          if (updatedSections.every(s => s.complete)) {
            setReviewComplete(true);
          }
        }
      }
    }
  };
  
  const handleCompleteTask = (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (task) {
      const updatedTask: Task = {
        ...task,
        completed: !task.completed,
        updatedAt: new Date().toISOString()
      };
      updateTask(updatedTask);
    }
  };
  
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="p-4 bg-blue-50 border-b border-blue-100 flex justify-between items-center">
          <div className="flex items-center">
            <RefreshCw className="w-5 h-5 text-blue-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Weekly Review</h3>
          </div>
          {reviewComplete && (
            <div className="flex items-center text-green-600 text-sm font-medium">
              <CheckCircle size={16} className="mr-1" />
              Review Complete!
            </div>
          )}
        </div>
        
        <div className="p-4">
          {/* Section List */}
          {!activeSectionId && (
            <div className="space-y-3">
              {reviewSections.map(section => (
                <div 
                  key={section.id}
                  className={`p-3 rounded-lg flex items-center justify-between cursor-pointer transition-colors ${
                    section.complete 
                      ? 'bg-green-50 border border-green-100' 
                      : 'bg-gray-50 hover:bg-gray-100 border border-gray-100'
                  }`}
                  onClick={() => {
                    setActiveSectionId(section.id);
                    setCurrentPromptIndex(0);
                  }}
                >
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full mr-3 ${section.complete ? 'bg-green-100 text-green-600' : 'bg-blue-100 text-blue-600'}`}>
                      {section.complete ? <CheckCircle size={18} /> : section.icon}
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{section.title}</h4>
                      <p className="text-sm text-gray-600">{section.description}</p>
                    </div>
                  </div>
                  <ChevronRight size={20} className="text-gray-400" />
                </div>
              ))}
            </div>
          )}
          
          {/* Active Section */}
          {activeSectionId && (
            <div>
              {reviewSections.filter(s => s.id === activeSectionId).map(section => (
                <div key={section.id} className="space-y-4">
                  <div className="flex items-center mb-2">
                    <div className="p-2 rounded-full mr-3 bg-blue-100 text-blue-600">
                      {section.icon}
                    </div>
                    <h3 className="text-lg font-medium">{section.title}</h3>
                  </div>
                  
                  <div className="bg-blue-50 rounded-lg p-4 mb-4">
                    <p className="text-blue-800 font-medium mb-1">Prompt {currentPromptIndex + 1} of {section.prompts.length}:</p>
                    <p className="text-gray-800">{section.prompts[currentPromptIndex]}</p>
                  </div>
                  
                  {/* Task entry for this prompt */}
                  <div className="flex mb-4">
                    <input
                      type="text"
                      value={taskInput}
                      onChange={(e) => setTaskInput(e.target.value)}
                      className="flex-1 rounded-l-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
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
                  
                  {/* Relevant task lists based on the section */}
                  {activeSectionId === 'overdue' && overdueTasks.length > 0 && (
                    <div className="border rounded-lg p-3 bg-gray-50">
                      <h4 className="font-medium text-gray-700 mb-2">Overdue Tasks:</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {overdueTasks.slice(0, 5).map(task => (
                          <ImprovedTaskCard
                            key={task.id}
                            task={task}
                            projects={projects}
                            categories={[]}
                            onComplete={() => handleCompleteTask(task.id)}
                          />
                        ))}
                        {overdueTasks.length > 5 && (
                          <p className="text-center text-sm text-gray-500 pt-2">
                            + {overdueTasks.length - 5} more overdue tasks
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {activeSectionId === 'upcoming' && tasksDueThisWeek.length > 0 && (
                    <div className="border rounded-lg p-3 bg-gray-50">
                      <h4 className="font-medium text-gray-700 mb-2">Tasks Due This Week:</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {tasksDueThisWeek.slice(0, 5).map(task => (
                          <ImprovedTaskCard
                            key={task.id}
                            task={task}
                            projects={projects}
                            categories={[]}
                          />
                        ))}
                        {tasksDueThisWeek.length > 5 && (
                          <p className="text-center text-sm text-gray-500 pt-2">
                            + {tasksDueThisWeek.length - 5} more tasks this week
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {activeSectionId === 'projects' && projects.length > 0 && (
                    <div className="border rounded-lg p-3 bg-gray-50">
                      <h4 className="font-medium text-gray-700 mb-2">Your Projects:</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {projects.map(project => {
                          const projectTasks = incompleteTasks.filter(t => t.projectId === project.id);
                          return (
                            <div key={project.id} className="p-3 rounded-lg bg-white border">
                              <div className="flex items-center mb-2">
                                <div 
                                  className="w-3 h-3 rounded-full mr-2" 
                                  style={{ backgroundColor: project.color }}
                                ></div>
                                <h5 className="font-medium">{project.name}</h5>
                                <span className="ml-auto text-sm text-gray-500">
                                  {projectTasks.length} tasks
                                </span>
                              </div>
                              {projectTasks.length === 0 && (
                                <p className="text-sm text-gray-500 italic">No active tasks in this project</p>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                  
                  {activeSectionId === 'reflect' && recentlyCompleted.length > 0 && (
                    <div className="border rounded-lg p-3 bg-gray-50">
                      <h4 className="font-medium text-gray-700 mb-2">Recently Completed:</h4>
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {recentlyCompleted.slice(0, 5).map(task => (
                          <ImprovedTaskCard
                            key={task.id}
                            task={task}
                            projects={projects}
                            categories={[]}
                          />
                        ))}
                        {recentlyCompleted.length > 5 && (
                          <p className="text-center text-sm text-gray-500 pt-2">
                            + {recentlyCompleted.length - 5} more completed tasks
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                  
                  <div className="flex justify-between pt-3 border-t border-gray-100">
                    <Button 
                      variant="outline"
                      onClick={() => {
                        setActiveSectionId(null);
                        setCurrentPromptIndex(0);
                      }}
                    >
                      Back to Review
                    </Button>
                    <Button onClick={handleNextPrompt}>
                      {currentPromptIndex < section.prompts.length - 1 ? 'Next Prompt' : 'Complete Section'}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default WeeklyReviewSystem;