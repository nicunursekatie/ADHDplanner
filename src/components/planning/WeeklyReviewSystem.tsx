import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Task, JournalEntry } from '../../types';
import { getISOWeekAndYear } from '../../utils/helpers';
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
  RefreshCw,
  Save,
  BookOpen,
  Loader
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
  const {
    tasks,
    projects,
    quickAddTask,
    updateTask,
    addJournalEntry,
    updateJournalEntry,
    getJournalEntriesForWeek
  } = useAppContext();

  // Refs for component lifecycle and performance
  const isMounted = useRef(true);
  const [taskInput, setTaskInput] = useState('');
  const [journalInput, setJournalInput] = useState('');
  const [currentJournalEntry, setCurrentJournalEntry] = useState<JournalEntry | null>(null);
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null);
  const [currentPromptIndex, setCurrentPromptIndex] = useState(0);
  const [isSavingJournal, setIsSavingJournal] = useState(false);
  const [reviewComplete, setReviewComplete] = useState(false);
  const [showJournal, setShowJournal] = useState(false);

  // Get dates for this week and next week using useMemo to avoid re-creating on every render
  const today = useMemo(() => new Date(), []);

  // Cleanup when component unmounts
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  // Get current week information
  const { weekNumber, weekYear } = useMemo(() => getISOWeekAndYear(today), [today]);
  const [currentWeekEntries, setCurrentWeekEntries] = useState<JournalEntry[]>([]);
  const nextWeek = useMemo(() => {
    const date = new Date();
    date.setDate(date.getDate() + 7);
    return date;
  }, []);
  
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
          // If there's journal content, save it before completing the section
          if (journalInput.trim()) {
            handleSaveJournal();
          } else if (!isSectionCompleted(activeSectionId)) {
            // Create a placeholder entry to mark this section as complete
            const todayStr = today.toISOString().split('T')[0];
            const newEntry = addJournalEntry({
              date: todayStr,
              content: "Section completed",
              reviewSectionId: activeSectionId,
              weekNumber,
              weekYear,
              isCompleted: true
            });
            setCurrentWeekEntries(prev => [...prev, newEntry]);
          }

          // Mark section as complete in UI
          const updatedSections = reviewSections.map(s =>
            s.id === activeSectionId ? { ...s, complete: true } : s
          );
          setReviewSections(updatedSections);
          setActiveSectionId(null);
          setCurrentPromptIndex(0);

          // Check if all sections are complete (either marked in UI or in database)
          const allSectionsComplete = updatedSections.every(s =>
            s.complete || isSectionCompleted(s.id)
          );

          if (allSectionsComplete) {
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

  // Get journal entries for the current week when component loads
  useEffect(() => {
    const entries = getJournalEntriesForWeek(weekNumber, weekYear);
    setCurrentWeekEntries(entries);

    // Check if the review is already complete for this week
    const allSectionsCompleted = reviewSections.every(section => {
      const sectionEntries = entries.filter(entry => entry.reviewSectionId === section.id);
      return sectionEntries.some(entry =>
        entry.isCompleted || (entry.content && entry.content.trim().length > 0)
      );
    });

    setReviewComplete(allSectionsCompleted);
  }, [weekNumber, weekYear, getJournalEntriesForWeek, reviewSections]);

  // Load current journal entry when section changes
  useEffect(() => {
    if (activeSectionId) {
      // Find an entry for this section in the current week
      const sectionEntry = currentWeekEntries.find(entry => entry.reviewSectionId === activeSectionId);

      if (sectionEntry) {
        setCurrentJournalEntry(sectionEntry);
        setJournalInput(sectionEntry.content || '');
        // Show journal if it exists
        setShowJournal(true);
      } else {
        setCurrentJournalEntry(null);
        setJournalInput('');
        // Hide journal if no entry exists yet
        setShowJournal(false);
      }
    }
  }, [activeSectionId, currentWeekEntries]);

  const handleSaveJournal = useCallback(() => {
    if (!journalInput.trim() || isSavingJournal) return;

    // Set loading state
    setIsSavingJournal(true);

    try {
      const todayStr = today.toISOString().split('T')[0];

      setTimeout(() => {
        if (!isMounted.current) return;

        try {
          if (currentJournalEntry) {
            // Update existing entry
            const updatedEntry: JournalEntry = {
              ...currentJournalEntry,
              content: journalInput,
              isCompleted: true, // Mark as completed when saved
              updatedAt: new Date().toISOString()
            };
            updateJournalEntry(updatedEntry);

            // Update the current week entries if component is still mounted
            if (isMounted.current) {
              setCurrentWeekEntries(prev =>
                prev.map(entry => entry.id === updatedEntry.id ? updatedEntry : entry)
              );
              setCurrentJournalEntry(updatedEntry);
            }
          } else {
            // Create new entry
            const newEntry = addJournalEntry({
              date: todayStr,
              content: journalInput,
              reviewSectionId: activeSectionId || undefined,
              weekNumber,
              weekYear,
              isCompleted: true
            });

            // Update state if component is still mounted
            if (isMounted.current) {
              setCurrentJournalEntry(newEntry);
              // Add to current week entries
              setCurrentWeekEntries(prev => [...prev, newEntry]);
            }
          }
        } catch (error) {
          console.error('Error saving journal entry:', error);
        } finally {
          // Reset loading state if component is still mounted
          if (isMounted.current) {
            setIsSavingJournal(false);
          }
        }
      }, 100); // Small delay to let UI update first
    } catch (error) {
      console.error('Error in handleSaveJournal:', error);
      if (isMounted.current) {
        setIsSavingJournal(false);
      }
    }
  }, [journalInput, currentJournalEntry, today, activeSectionId, weekNumber, weekYear, updateJournalEntry, addJournalEntry, isSavingJournal]);

  const toggleJournal = useCallback(() => {
    if (isMounted.current) {
      setShowJournal(prev => !prev);
    }
  }, []);

  // Helper to check if a section is completed based on journal entries
  const isSectionCompleted = (sectionId: string): boolean => {
    // Consider a section completed if:
    // 1. There's an entry for this section AND
    // 2. Either isCompleted is true OR it has content (for backwards compatibility)
    return currentWeekEntries.some(entry => {
      const hasReviewSectionId = entry.reviewSectionId === sectionId;
      const isExplicitlyCompleted = entry.isCompleted === true;
      const hasContent = entry.content && entry.content.trim().length > 0;
      return hasReviewSectionId && (isExplicitlyCompleted || hasContent);
    });
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
                    section.complete || isSectionCompleted(section.id)
                      ? 'bg-green-50 border border-green-100'
                      : 'bg-gray-50 hover:bg-gray-100 border border-gray-100'
                  }`}
                  onClick={() => {
                    setActiveSectionId(section.id);
                    setCurrentPromptIndex(0);
                  }}
                >
                  <div className="flex items-center">
                    <div className={`p-2 rounded-full mr-3 ${
                      section.complete || isSectionCompleted(section.id)
                        ? 'bg-green-100 text-green-600'
                        : 'bg-blue-100 text-blue-600'
                    }`}>
                      {section.complete || isSectionCompleted(section.id)
                        ? <CheckCircle size={18} />
                        : section.icon
                      }
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

                  {/* Journal Entry Button */}
                  <div className="mb-4">
                    <Button
                      variant={showJournal ? "default" : "outline"}
                      size="sm"
                      onClick={toggleJournal}
                      icon={<BookOpen size={16} />}
                      className="w-full"
                    >
                      {showJournal ? "Hide Journal Entry" : "Add Journal Entry"}
                    </Button>
                  </div>

                  {/* Journal Entry Text Area */}
                  {showJournal && (
                    <div className="mb-4 bg-gray-50 p-3 rounded-md border">
                      <div className="flex items-center mb-2">
                        <BookOpen size={16} className="text-blue-600 mr-2" />
                        <h4 className="text-sm font-medium text-gray-700">Journal Entry</h4>
                      </div>
                      <textarea
                        value={journalInput}
                        onChange={(e) => setJournalInput(e.target.value)}
                        className="w-full min-h-[120px] border-gray-300 rounded-md shadow-sm focus:border-blue-500 focus:ring-blue-500 text-sm p-2"
                        placeholder="Use this space to jot down reflections that aren't specific tasks. What insights are you having? What patterns are you noticing? How are you feeling about your progress?"
                      />
                      <div className="flex justify-end mt-2">
                        <Button
                          size="sm"
                          onClick={handleSaveJournal}
                          icon={isSavingJournal ? <Loader size={16} className="animate-spin" /> : <Save size={16} />}
                          disabled={isSavingJournal || !journalInput.trim()}
                        >
                          {isSavingJournal ? 'Saving...' : 'Save Entry'}
                        </Button>
                      </div>
                      {currentJournalEntry && (
                        <p className="text-xs text-gray-500 mt-2">
                          Last updated: {new Date(currentJournalEntry.updatedAt).toLocaleString()}
                        </p>
                      )}
                    </div>
                  )}
                  
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
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        onClick={() => {
                          setActiveSectionId(null);
                          setCurrentPromptIndex(0);
                        }}
                      >
                        Back to Review
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        as="a"
                        href="/journal"
                        icon={<BookOpen size={16} />}
                      >
                        View All Journal Entries
                      </Button>
                    </div>

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