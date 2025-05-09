import React, { useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, useSensor, useSensors, PointerSensor, DragStartEvent, useDroppable, useDraggable } from '@dnd-kit/core';
import { Task, TimeBlock } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { Plus, Clock, GripVertical, Edit, Info } from 'lucide-react';
import Button from '../common/Button';
import TaskCard from '../tasks/TaskCard';
import Empty from '../common/Empty';
import { generateId, calculateDuration } from '../../utils/helpers';
import TimeBlockModal from './TimeBlockModal';
import Card from '../common/Card';

interface DailyPlannerGridProps {
  date: string;
}

const DailyPlannerGrid: React.FC<DailyPlannerGridProps> = ({ date }) => {
  const { tasks, projects, categories, getDailyPlan, saveDailyPlan } = useAppContext();
  const [selectedBlock, setSelectedBlock] = useState<TimeBlock | null>(null);
  const [modalBlock, setModalBlock] = useState<TimeBlock | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  
  // Get time blocks for the current date
  const timeBlocks = getDailyPlan(date)?.timeBlocks || [];
  
  // Sort time blocks by start time for better organization
  const sortedTimeBlocks = [...timeBlocks].sort((a, b) => {
    return a.startTime.localeCompare(b.startTime);
  });
  
  // Get unscheduled tasks (tasks without time blocks)
  const unscheduledTasks = tasks.filter(task => {
    // Check if the task is in any block's taskIds array or the legacy taskId field
    const hasTimeBlock = timeBlocks.some(block => 
      block.taskId === task.id || (block.taskIds && block.taskIds.includes(task.id))
    );
    const isIncomplete = !task.completed;
    const taskDate = task.dueDate ? new Date(task.dueDate + 'T00:00:00').toISOString().split('T')[0] : null;
    const isDueOnOrBefore = !taskDate || taskDate <= date;
    // Only show top-level tasks, not subtasks (tasks without a parent)
    const isTopLevelTask = !task.parentTaskId;
    
    return isIncomplete && !hasTimeBlock && isDueOnOrBefore && isTopLevelTask;
  });
  
  // Configure DnD sensors
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      const taskId = active.id as string;
      const blockId = over.id as string;
      
      // Find the task that was dragged
      const draggedTask = tasks.find(t => t.id === taskId);
      
      // Only proceed if we found the task
      if (draggedTask) {
        const updatedBlocks = timeBlocks.map(block => {
          if (block.id === blockId) {
            // Initialize taskIds array if it doesn't exist
            const taskIds = block.taskIds || [];
            
            // If using legacy taskId field, migrate to taskIds
            if (block.taskId && !taskIds.includes(block.taskId)) {
              taskIds.push(block.taskId);
            }
            
            // Create a new array with the dragged task and its subtasks
            const newTaskIds = [...taskIds];
            
            // Add the parent task if it's not already in the array
            if (!newTaskIds.includes(taskId)) {
              newTaskIds.push(taskId);
              
              // Optionally add all subtasks of the dragged task to the time block as well
              if (draggedTask.subtasks && draggedTask.subtasks.length > 0) {
                draggedTask.subtasks.forEach(subtaskId => {
                  if (!newTaskIds.includes(subtaskId)) {
                    newTaskIds.push(subtaskId);
                  }
                });
              }
            }
            
            return { 
              ...block, 
              taskId: null, // Clear legacy field
              taskIds: newTaskIds 
            };
          }
          return block;
        });
        
        saveDailyPlan({
          id: date,
          date,
          timeBlocks: updatedBlocks,
        });
      }
    }
    
    setActiveId(null);
  };
  

  const handleAddBlock = () => {
    // Get current hour to set smarter default times
    const now = new Date();
    const currentHour = now.getHours();
    
    // Set start time to next whole hour and end time to 1 hour later
    const startHour = currentHour + 1;
    const endHour = startHour + 1;
    
    // Format as HH:00 strings
    const startTime = `${String(startHour % 24).padStart(2, '0')}:00`;
    const endTime = `${String(endHour % 24).padStart(2, '0')}:00`;
    
    const newBlock: TimeBlock = {
      id: generateId(),
      startTime,
      endTime,
      taskId: null,
      taskIds: [],
      title: 'New Time Block',
      description: '',
    };
    
    setModalBlock(newBlock);
    setIsModalOpen(true);
  };
  
  const handleEditBlock = (block: TimeBlock) => {
    setModalBlock(block);
    setIsModalOpen(true);
  };
  
  const handleDeleteBlock = (blockId: string) => {
    saveDailyPlan({
      id: date,
      date,
      timeBlocks: timeBlocks.filter(block => block.id !== blockId),
    });
    setSelectedBlock(null);
  };
  
  const handleSaveBlock = (updatedBlock: TimeBlock) => {
    let updatedBlocks;
    
    // Check if this is a new block or an existing one
    if (timeBlocks.some(block => block.id === updatedBlock.id)) {
      // Update existing block
      updatedBlocks = timeBlocks.map(block => 
        block.id === updatedBlock.id ? updatedBlock : block
      );
    } else {
      // Add new block
      updatedBlocks = [...timeBlocks, updatedBlock];
    }
    
    saveDailyPlan({
      id: date,
      date,
      timeBlocks: updatedBlocks,
    });
    
    setSelectedBlock(updatedBlock);
  };
  
  const handleRemoveTaskFromBlock = (taskId: string) => {
    // Find the task to check if it has subtasks
    const taskToRemove = tasks.find(t => t.id === taskId);
    const subtaskIds = taskToRemove?.subtasks || [];
    
    saveDailyPlan({
      id: date,
      date,
      timeBlocks: timeBlocks.map(block => {
        // Remove from legacy taskId field
        if (block.taskId === taskId) {
          return { ...block, taskId: null };
        }
        
        // Remove from taskIds array if present
        if (block.taskIds && block.taskIds.includes(taskId)) {
          // Also remove all subtasks of this task
          return { 
            ...block, 
            taskIds: block.taskIds.filter(id => id !== taskId && !subtaskIds.includes(id)) 
          };
        }
        
        return block;
      }),
    });
    
    // Task is only removed from time block, not deleted from the app
  };
  
  const handleBlockClick = (block: TimeBlock) => {
    const isCurrentlySelected = selectedBlock?.id === block.id;
    
    if (!isCurrentlySelected) {
      setSelectedBlock(block);
    } else {
      setSelectedBlock(null);
    }
  };

  const DroppableTimeBlock = ({ block, children }: { block: TimeBlock; children: React.ReactNode }) => {
    const { setNodeRef } = useDroppable({
      id: block.id,
    });
    
    return (
      <div ref={setNodeRef} className="h-full">
        {children}
      </div>
    );
  };

  const DraggableTask = ({ task }: { task: Task }) => {
    const { attributes, listeners, setNodeRef, transform } = useDraggable({
      id: task.id,
    });
    
    const style = transform ? {
      transform: `translate3d(${transform.x}px, ${transform.y}px, 0)`,
    } : undefined;

    // Check if task has subtasks for visual indicator
    const hasSubtasks = task.subtasks && task.subtasks.length > 0;
    const subtaskCount = hasSubtasks ? task.subtasks.length : 0;

    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none">
        <div className="flex items-center justify-between mb-2 text-gray-400">
          <div className="flex items-center">
            <GripVertical size={16} className="mr-2" />
            <span className="text-sm">Drag to schedule</span>
          </div>
          {hasSubtasks && (
            <div className="flex items-center bg-indigo-50 px-2 py-0.5 rounded text-xs">
              <span className="text-indigo-600 font-medium">{subtaskCount} subtask{subtaskCount !== 1 ? 's' : ''}</span>
            </div>
          )}
        </div>
        <TaskCard
          task={task}
          projects={projects}
          categories={categories}
          onDelete={() => handleRemoveTaskFromBlock(task.id)}
        />
      </div>
    );
  };
  
  return (
    <>
      {/* Info card for flexible time blocking */}
      <Card className="bg-blue-50 border border-blue-200 mb-6">
        <div className="flex items-start gap-3">
          <div className="bg-blue-100 p-2 rounded-full">
            <Info size={18} className="text-blue-600" />
          </div>
          <div>
            <h3 className="text-md font-medium text-blue-800 mb-1">Flexible Time Blocking</h3>
            <p className="text-sm text-blue-700">
              Create as many time blocks as you need with any custom start and end times.
              Your blocks will automatically be arranged chronologically throughout the day.
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <div className="bg-white border border-blue-200 rounded-md px-3 py-1 text-xs text-blue-700 flex items-center">
                <Clock size={12} className="mr-1" />
                Custom time ranges
              </div>
              <div className="bg-white border border-blue-200 rounded-md px-3 py-1 text-xs text-blue-700">
                Unlimited blocks
              </div>
              <div className="bg-white border border-blue-200 rounded-md px-3 py-1 text-xs text-blue-700">
                Drag & drop tasks
              </div>
            </div>
          </div>
        </div>
      </Card>
      
      <TimeBlockModal
        block={modalBlock}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleSaveBlock}
        onDelete={handleDeleteBlock}
      />
      
      <DndContext 
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
      <div className="grid grid-cols-4 gap-6 h-[calc(100vh-16rem)]">
        {/* Time Blocks */}
        <div className="col-span-3 bg-gray-50 rounded-lg overflow-hidden flex flex-col">
          <div className="p-6 border-b bg-white sticky top-0 z-10">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center">
              <h2 className="text-lg font-semibold text-gray-900 mb-2 sm:mb-0">Daily Schedule</h2>
              <div className="flex space-x-2">
                <div className="bg-blue-50 border border-blue-200 rounded-md p-2 mr-2 hidden sm:block">
                  <p className="text-sm text-blue-700">
                    <Clock size={14} className="inline mr-1" />
                    Add unlimited custom time blocks
                  </p>
                </div>
                <Button
                  variant="primary"
                  size="sm"
                  icon={<Plus size={16} />}
                  onClick={handleAddBlock}
                >
                  Add Time Block
                </Button>
              </div>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-6 max-h-[calc(100vh-18rem)]">
            {timeBlocks.length === 0 ? (
              <Empty
                title="No time blocks yet"
                description="Create custom time blocks to plan your day - add as many as you need with any start and end times"
                icon={<Clock className="h-12 w-12 text-gray-400" />}
                action={
                  <Button
                    variant="primary"
                    size="sm"
                    icon={<Plus size={16} />}
                    onClick={handleAddBlock}
                  >
                    Add Time Block
                  </Button>
                }
              />
            ) : (
              <div className="space-y-4">
                {sortedTimeBlocks.map(block => {
                  const isSelected = selectedBlock?.id === block.id;
                  
                  return (
                    <DroppableTimeBlock key={block.id} block={block}>
                      <div
                        className={`bg-white rounded-lg shadow-sm transition-all ${
                          isSelected ? 'ring-2 ring-indigo-500' : ''
                        }`}
                        onClick={() => handleBlockClick(block)}
                      >
                        <div className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <h3 className="font-medium text-gray-900">{block.title}</h3>
                            <div className="flex flex-col items-end">
                              <div className="flex items-center">
                                <span className="text-sm text-gray-500 mr-2">
                                  {block.startTime} - {block.endTime}
                                </span>
                                <button 
                                  className="p-1 rounded-full hover:bg-gray-100"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleEditBlock(block);
                                  }}
                                >
                                  <Edit size={14} className="text-gray-500" />
                                </button>
                              </div>
                              {(() => {
                                // Get formatted duration
                                const { hours, minutes } = calculateDuration(
                                  block.startTime, 
                                  block.endTime, 
                                  { formatted: true, allowOvernight: true }
                                );
                                
                                if (hours === 0 && minutes === 0) {
                                  return null;
                                }
                                
                                // Only show hours if there are any
                                const durationText = hours > 0 ? 
                                  `${hours}h ${minutes > 0 ? `${minutes}m` : ''}` : 
                                  `${minutes}m`;
                                
                                return (
                                  <span className="text-xs text-indigo-500 bg-indigo-50 px-2 py-0.5 rounded mt-1">
                                    {durationText}
                                  </span>
                                );
                              })()}
                            </div>
                          </div>
                          
                          {block.description && (
                            <p className="text-sm text-gray-600 mb-2">{block.description}</p>
                          )}
                              
                          {(() => {
                            // Get all tasks for this block
                            const blockTasks: Task[] = [];
                            
                            // Add task from legacy taskId field if present
                            if (block.taskId) {
                              const legacyTask = tasks.find(t => t.id === block.taskId);
                              if (legacyTask) blockTasks.push(legacyTask);
                            }
                            
                            // Add tasks from taskIds array, only including top-level tasks
                            if (block.taskIds && block.taskIds.length > 0) {
                              block.taskIds.forEach(id => {
                                const task = tasks.find(t => t.id === id);
                                // Only add top-level tasks or tasks whose parent is not in the same block
                                if (task && !blockTasks.some(t => t.id === id) && 
                                   (!task.parentTaskId || !block.taskIds.includes(task.parentTaskId))) {
                                  blockTasks.push(task);
                                }
                              });
                            }
                            
                            if (blockTasks.length > 0) {
                              return (
                                <div className="mt-3 space-y-2">
                                  {blockTasks.map(task => (
                                    <div key={task.id} className="task-container">
                                      {/* Add a visual parent indicator if this task has subtasks */}
                                      {task.subtasks && task.subtasks.length > 0 && (
                                        <div className="mb-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs rounded inline-flex items-center">
                                          <span className="font-medium mr-1">{task.subtasks.length}</span>
                                          <span>subtask{task.subtasks.length !== 1 ? 's' : ''} included</span>
                                        </div>
                                      )}
                                      <TaskCard
                                        task={task}
                                        projects={projects}
                                        categories={categories}
                                        onDelete={() => handleRemoveTaskFromBlock(task.id)}
                                      />
                                    </div>
                                  ))}
                                </div>
                              );
                            } else {
                              return (
                                <div className="mt-3 p-4 border-2 border-dashed border-gray-200 rounded-lg text-center text-sm text-gray-500">
                                  Drag a task here to schedule it
                                </div>
                              );
                            }
                          })()}
                        </div>
                      </div>
                    </DroppableTimeBlock>
                  );
                })}
              </div>
            )}
          </div>
        </div>
        
        {/* Unscheduled Tasks */}
        <div className="bg-white rounded-lg shadow-sm overflow-hidden flex flex-col">
          <div className="p-4 border-b bg-white sticky top-0 z-10">
            <h2 className="text-lg font-semibold text-gray-900">
              Unscheduled Tasks
            </h2>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 max-h-[calc(100vh-18rem)]">
            {unscheduledTasks.length > 0 ? (
              <div className="space-y-4">
                {unscheduledTasks.map(task => (
                  <DraggableTask key={task.id} task={task} />
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                No unscheduled tasks
              </div>
            )}
          </div>
        </div>
      </div>

      <DragOverlay>
        {activeId ? (
          <div className="opacity-50">
            <TaskCard
              task={tasks.find(t => t.id === activeId)!}
              projects={projects}
              categories={categories}
            />
          </div>
        ) : null}
      </DragOverlay>
    </DndContext>
    </>
  );
};

export default DailyPlannerGrid;