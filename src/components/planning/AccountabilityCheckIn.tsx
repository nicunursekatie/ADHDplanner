import React, { useState, useEffect } from 'react';
import { useAppContext } from '../../context/AppContext';
import { Task } from '../../types';
import Card from '../common/Card';
import Button from '../common/Button';
import { formatDate } from '../../utils/helpers';
import { 
  AlertCircle, 
  BarChart2, 
  CheckCircle, 
  ChevronDown, 
  Clock, 
  EyeOff, 
  ListChecks, 
  RefreshCw, 
  TrendingUp, 
  X
} from 'lucide-react';

interface AccountabilityCheckInProps {
  onTaskUpdated?: () => void;
}

type Reason = {
  id: string;
  text: string;
  frequency: number;
  isCommon: boolean;
};

type TaskWithReason = {
  task: Task;
  selectedReason: string | null;
  customReason: string;
  action: 'reschedule' | 'break_down' | 'delegate' | 'abandon' | null;
};

const AccountabilityCheckIn: React.FC<AccountabilityCheckInProps> = ({ onTaskUpdated }) => {
  const { tasks, updateTask } = useAppContext();
  const [expandedTask, setExpandedTask] = useState<string | null>(null);
  const [tasksWithReasons, setTasksWithReasons] = useState<TaskWithReason[]>([]);
  const [showProgress, setShowProgress] = useState(false);
  const [showCompleted, setShowCompleted] = useState(false);
  const [completionRate, setCompletionRate] = useState(0);
  
  // Common reasons for not completing tasks
  const [commonReasons, setCommonReasons] = useState<Reason[]>([
    { id: 'forgot', text: 'I forgot about it', frequency: 0, isCommon: true },
    { id: 'no_time', text: "I didn't have enough time", frequency: 0, isCommon: true },
    { id: 'too_difficult', text: 'It was more difficult than expected', frequency: 0, isCommon: true },
    { id: 'energy', text: "I didn't have the energy", frequency: 0, isCommon: true },
    { id: 'focus', text: "I couldn't focus enough", frequency: 0, isCommon: true },
    { id: 'motivation', text: "I wasn't motivated", frequency: 0, isCommon: true },
    { id: 'prerequisite', text: 'A prerequisite task wasn\'t completed', frequency: 0, isCommon: true },
    { id: 'resources', text: 'I was missing resources or information', frequency: 0, isCommon: true },
    { id: 'interruptions', text: 'I was interrupted too many times', frequency: 0, isCommon: true },
    { id: 'not_clear', text: 'The task wasn\'t clear enough', frequency: 0, isCommon: true },
    { id: 'not_important', text: 'It turned out not to be important', frequency: 0, isCommon: true }
  ]);
  
  // Get date for 7 days ago
  const today = new Date();
  const lastWeek = new Date();
  lastWeek.setDate(today.getDate() - 7);
  const lastWeekStr = formatDate(lastWeek);
  
  // Find tasks that were due in the last 7 days and weren't completed
  const overdueTasks = tasks.filter(task => 
    !task.completed && 
    task.dueDate && 
    task.dueDate < formatDate(today) &&
    task.dueDate >= lastWeekStr
  );
  
  // Find tasks that were completed in the last 7 days
  const completedTasks = tasks.filter(task => 
    task.completed && 
    new Date(task.updatedAt) >= lastWeek
  );
  
  useEffect(() => {
    // Calculate completion rate
    const tasksWithDueDates = tasks.filter(task => 
      task.dueDate && 
      task.dueDate >= lastWeekStr && 
      task.dueDate < formatDate(today)
    );
    
    const completedOnTime = tasksWithDueDates.filter(task => 
      task.completed && 
      new Date(task.updatedAt).toISOString().split('T')[0] <= task.dueDate!
    );
    
    const rate = tasksWithDueDates.length > 0 
      ? Math.round((completedOnTime.length / tasksWithDueDates.length) * 100) 
      : 0;
    
    setCompletionRate(rate);
    
    // Initialize tasks with reasons
    setTasksWithReasons(overdueTasks.map(task => ({
      task,
      selectedReason: null,
      customReason: '',
      action: null
    })));
  }, [tasks]);
  
  const handleReasonSelect = (taskId: string, reasonId: string) => {
    setTasksWithReasons(prev => 
      prev.map(item => 
        item.task.id === taskId 
          ? { ...item, selectedReason: reasonId } 
          : item
      )
    );
    
    // Increment frequency for this reason
    setCommonReasons(prev => 
      prev.map(reason => 
        reason.id === reasonId 
          ? { ...reason, frequency: reason.frequency + 1 } 
          : reason
      )
    );
  };
  
  const handleCustomReasonChange = (taskId: string, value: string) => {
    setTasksWithReasons(prev => 
      prev.map(item => 
        item.task.id === taskId 
          ? { ...item, customReason: value, selectedReason: value ? 'custom' : null } 
          : item
      )
    );
  };
  
  const handleActionSelect = (taskId: string, action: 'reschedule' | 'break_down' | 'delegate' | 'abandon' | null) => {
    setTasksWithReasons(prev => 
      prev.map(item => 
        item.task.id === taskId 
          ? { ...item, action } 
          : item
      )
    );
  };
  
  const handleTaskUpdate = (taskWithReason: TaskWithReason) => {
    const { task, action } = taskWithReason;
    
    let updatedTask: Task = { ...task };
    
    // Apply action to the task
    if (action === 'reschedule') {
      // Set due date to tomorrow
      const tomorrow = new Date();
      tomorrow.setDate(today.getDate() + 1);
      updatedTask.dueDate = formatDate(tomorrow);
    } else if (action === 'abandon') {
      // Mark as completed but add note about abandonment
      updatedTask.completed = true;
      updatedTask.description = `${updatedTask.description}\n[Abandoned: Not relevant or necessary anymore]`;
    }
    
    // Add the reason to task description for future reference
    const reasonText = taskWithReason.selectedReason === 'custom' 
      ? taskWithReason.customReason 
      : commonReasons.find(r => r.id === taskWithReason.selectedReason)?.text || '';
    
    if (reasonText && action !== 'abandon') {
      updatedTask.description = `${updatedTask.description}\n[Incomplete: ${reasonText}]`;
    }
    
    updatedTask.updatedAt = new Date().toISOString();
    
    // Update the task
    updateTask(updatedTask);
    
    // Remove from list
    setTasksWithReasons(prev => prev.filter(item => item.task.id !== task.id));
    
    if (onTaskUpdated) {
      onTaskUpdated();
    }
  };
  
  // Get the most common reasons for not completing tasks
  const topReasons = [...commonReasons]
    .sort((a, b) => b.frequency - a.frequency)
    .slice(0, 3);
  
  return (
    <div className="space-y-6">
      <Card className="overflow-hidden">
        <div className="p-4 bg-orange-50 border-b border-orange-100 flex justify-between items-center">
          <div className="flex items-center">
            <RefreshCw className="w-5 h-5 text-orange-600 mr-2" />
            <h3 className="text-lg font-medium text-gray-900">Accountability Check-In</h3>
          </div>
          <Button 
            variant="ghost" 
            size="sm"
            onClick={() => setShowProgress(!showProgress)}
          >
            {showProgress ? 'Hide Stats' : 'Show Stats'}
          </Button>
        </div>
        
        {showProgress && (
          <div className="p-4 bg-gray-50 border-b border-gray-100">
            <div className="flex flex-col sm:flex-row justify-between items-center mb-3">
              <h4 className="font-medium text-gray-700 mb-2 sm:mb-0">Your Past Week Performance</h4>
              <div className="flex items-center text-sm">
                <span className="mr-2">Showing tasks from</span>
                <span className="font-medium">{lastWeekStr}</span>
                <span className="mx-1">to</span>
                <span className="font-medium">{formatDate(today)}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
              <div className="bg-white p-3 rounded-lg border shadow-sm">
                <div className="flex items-center mb-1">
                  <CheckCircle size={16} className="text-green-500 mr-2" />
                  <h5 className="text-sm font-medium text-gray-700">Task Completion Rate</h5>
                </div>
                <div className="flex items-end justify-between">
                  <div className="text-2xl font-bold text-gray-900">{completionRate}%</div>
                  <div className={`text-sm ${completionRate >= 70 ? 'text-green-600' : completionRate >= 50 ? 'text-yellow-600' : 'text-red-600'}`}>
                    {completedTasks.length} completed
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-3 rounded-lg border shadow-sm">
                <div className="flex items-center mb-1">
                  <Clock size={16} className="text-orange-500 mr-2" />
                  <h5 className="text-sm font-medium text-gray-700">Tasks Needing Attention</h5>
                </div>
                <div className="flex items-end justify-between">
                  <div className="text-2xl font-bold text-gray-900">{overdueTasks.length}</div>
                  <div className="text-sm text-gray-600">
                    {overdueTasks.length > 0 ? 'Review below' : 'All caught up!'}
                  </div>
                </div>
              </div>
              
              <div className="bg-white p-3 rounded-lg border shadow-sm">
                <div className="flex items-center mb-1">
                  <BarChart2 size={16} className="text-blue-500 mr-2" />
                  <h5 className="text-sm font-medium text-gray-700">Common Blockers</h5>
                </div>
                <div className="text-sm">
                  {topReasons.length > 0 ? (
                    <ol className="list-decimal list-inside">
                      {topReasons.map((reason, index) => (
                        <li key={reason.id} className={`truncate ${index === 0 ? 'font-medium' : ''}`}>
                          {reason.text}
                        </li>
                      ))}
                    </ol>
                  ) : (
                    <div className="text-gray-600 italic">No data yet</div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="text-sm text-gray-600">
              <span className="font-medium">Tip:</span> Patterns in why tasks don't get completed can help you plan better.
            </div>
          </div>
        )}
        
        <div className="p-4">
          <div className="mb-4">
            <h4 className="font-medium text-gray-900 mb-1">Tasks to Review</h4>
            <p className="text-sm text-gray-600">
              Understanding why tasks don't get completed helps you plan more effectively.
            </p>
          </div>
          
          {tasksWithReasons.length === 0 ? (
            <div className="text-center py-6">
              <CheckCircle size={48} className="mx-auto mb-3 text-green-500" />
              <h4 className="text-lg font-medium text-gray-900 mb-1">All caught up!</h4>
              <p className="text-gray-600">
                You have no overdue tasks from the past week that need reviewing.
              </p>
              
              <Button
                variant="outline"
                className="mt-3"
                onClick={() => setShowCompleted(!showCompleted)}
              >
                {showCompleted ? 'Hide' : 'Show'} Completed Tasks
              </Button>
              
              {showCompleted && completedTasks.length > 0 && (
                <div className="mt-4 text-left">
                  <h5 className="font-medium text-gray-700 mb-2 flex items-center">
                    <CheckCircle size={16} className="text-green-500 mr-2" />
                    Completed Tasks
                  </h5>
                  <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-3">
                    {completedTasks.map(task => (
                      <div key={task.id} className="p-2 rounded-lg bg-green-50 border border-green-100">
                        <div className="flex items-center">
                          <CheckCircle size={16} className="text-green-600 mr-2 flex-shrink-0" />
                          <span className="text-gray-800">{task.title}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {tasksWithReasons.map(taskWithReason => (
                <div 
                  key={taskWithReason.task.id} 
                  className="border rounded-lg overflow-hidden"
                >
                  <div 
                    className={`p-3 bg-gray-50 flex items-center justify-between cursor-pointer
                      ${expandedTask === taskWithReason.task.id ? 'border-b border-gray-200' : ''}
                    `}
                    onClick={() => setExpandedTask(
                      expandedTask === taskWithReason.task.id ? null : taskWithReason.task.id
                    )}
                  >
                    <div className="flex items-center">
                      <AlertCircle size={16} className="text-orange-500 mr-2" />
                      <span className="font-medium">{taskWithReason.task.title}</span>
                    </div>
                    <ChevronDown 
                      size={18} 
                      className={`text-gray-500 transition-transform ${
                        expandedTask === taskWithReason.task.id ? 'transform rotate-180' : ''
                      }`} 
                    />
                  </div>
                  
                  {expandedTask === taskWithReason.task.id && (
                    <div className="p-3">
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">
                          Why wasn't this task completed?
                        </h5>
                        <div className="space-y-2">
                          {commonReasons.slice(0, 6).map(reason => (
                            <div key={reason.id} className="flex items-center">
                              <input 
                                type="radio" 
                                id={`${taskWithReason.task.id}-${reason.id}`}
                                name={`reason-${taskWithReason.task.id}`}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                checked={taskWithReason.selectedReason === reason.id}
                                onChange={() => handleReasonSelect(taskWithReason.task.id, reason.id)}
                              />
                              <label 
                                htmlFor={`${taskWithReason.task.id}-${reason.id}`}
                                className="ml-2 text-sm text-gray-700"
                              >
                                {reason.text}
                              </label>
                            </div>
                          ))}
                          
                          <div className="pt-1">
                            <div className="flex items-center">
                              <input 
                                type="radio" 
                                id={`${taskWithReason.task.id}-custom`}
                                name={`reason-${taskWithReason.task.id}`}
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300"
                                checked={taskWithReason.selectedReason === 'custom'}
                                onChange={() => handleReasonSelect(taskWithReason.task.id, 'custom')}
                              />
                              <label 
                                htmlFor={`${taskWithReason.task.id}-custom`}
                                className="ml-2 text-sm text-gray-700"
                              >
                                Other reason:
                              </label>
                            </div>
                            
                            <input 
                              type="text"
                              className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500 sm:text-sm"
                              placeholder="Enter your reason..."
                              value={taskWithReason.customReason}
                              onChange={(e) => handleCustomReasonChange(taskWithReason.task.id, e.target.value)}
                              onClick={() => handleReasonSelect(taskWithReason.task.id, 'custom')}
                            />
                          </div>
                        </div>
                      </div>
                      
                      <div className="mb-4">
                        <h5 className="text-sm font-medium text-gray-700 mb-2">
                          What would you like to do with this task?
                        </h5>
                        <div className="grid grid-cols-2 gap-2">
                          <Button
                            variant={taskWithReason.action === 'reschedule' ? 'secondary' : 'outline'}
                            size="sm"
                            className="justify-center"
                            onClick={() => handleActionSelect(taskWithReason.task.id, 'reschedule')}
                            icon={<RefreshCw size={14} />}
                          >
                            Reschedule
                          </Button>
                          <Button
                            variant={taskWithReason.action === 'break_down' ? 'secondary' : 'outline'}
                            size="sm"
                            className="justify-center"
                            onClick={() => handleActionSelect(taskWithReason.task.id, 'break_down')}
                            icon={<ListChecks size={14} />}
                          >
                            Break down
                          </Button>
                          <Button
                            variant={taskWithReason.action === 'delegate' ? 'secondary' : 'outline'}
                            size="sm"
                            className="justify-center"
                            onClick={() => handleActionSelect(taskWithReason.task.id, 'delegate')}
                            icon={<TrendingUp size={14} />}
                          >
                            Delegate
                          </Button>
                          <Button
                            variant={taskWithReason.action === 'abandon' ? 'secondary' : 'outline'}
                            size="sm"
                            className="justify-center"
                            onClick={() => handleActionSelect(taskWithReason.task.id, 'abandon')}
                            icon={<EyeOff size={14} />}
                          >
                            Abandon
                          </Button>
                        </div>
                      </div>
                      
                      <div className="flex justify-end space-x-2 border-t pt-3">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setExpandedTask(null)}
                          icon={<X size={14} />}
                        >
                          Cancel
                        </Button>
                        <Button
                          size="sm"
                          disabled={!taskWithReason.selectedReason || !taskWithReason.action}
                          onClick={() => handleTaskUpdate(taskWithReason)}
                          icon={<CheckCircle size={14} />}
                        >
                          Save & Continue
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
};

export default AccountabilityCheckIn;