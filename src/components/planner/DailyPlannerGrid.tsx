import React, { useState } from 'react';
import { DndContext, DragEndEvent, DragOverlay, useSensor, useSensors, PointerSensor, DragStartEvent, useDroppable, useDraggable } from '@dnd-kit/core';
import { Task, TimeBlock } from '../../types';
import { useAppContext } from '../../context/AppContext';
import { Plus, Clock, GripVertical, Edit } from 'lucide-react';
import Button from '../common/Button';
import TaskCard from '../tasks/TaskCard';
import Empty from '../common/Empty';
import { generateId } from '../../utils/helpers';
import TimeBlockModal from './TimeBlockModal';

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
    
    return isIncomplete && !hasTimeBlock && isDueOnOrBefore;
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
      
      const updatedBlocks = timeBlocks.map(block => {
        if (block.id === blockId) {
          // Initialize taskIds array if it doesn't exist
          const taskIds = block.taskIds || [];
          
          // If using legacy taskId field, migrate to taskIds
          if (block.taskId && !taskIds.includes(block.taskId)) {
            taskIds.push(block.taskId);
          }
          
          // Add the new task if it's not already in the array
          if (!taskIds.includes(taskId)) {
            taskIds.push(taskId);
          }
          
          return { 
            ...block, 
            taskId: null, // Clear legacy field
            taskIds: taskIds 
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
    
    setActiveId(null);
  };
  

  const handleAddBlock = () => {
    const newBlock: TimeBlock = {
      id: generateId(),
      startTime: '09:00',
      endTime: '10:00',
      taskId: null,
      taskIds: [],
      title: 'New Block',
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
          return { 
            ...block, 
            taskIds: block.taskIds.filter(id => id !== taskId) 
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

    return (
      <div ref={setNodeRef} style={style} {...attributes} {...listeners} className="touch-none">
        <div className="flex items-center mb-2 text-gray-400">
          <GripVertical size={16} className="mr-2" />
          <span className="text-sm">Drag to schedule</span>
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
              <h2 className="text-lg font-semibold text-gray-900 mb-2 sm:mb-0">Schedule</h2>
              <div className="flex space-x-2">
                <p className="text-sm text-gray-500 mr-2 self-center hidden sm:block">
                  Add as many time blocks as you need
                </p>
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
                            
                            // Add tasks from taskIds array
                            if (block.taskIds && block.taskIds.length > 0) {
                              block.taskIds.forEach(id => {
                                const task = tasks.find(t => t.id === id);
                                if (task && !blockTasks.some(t => t.id === id)) blockTasks.push(task);
                              });
                            }
                            
                            if (blockTasks.length > 0) {
                              return (
                                <div className="mt-3 space-y-2">
                                  {blockTasks.map(task => (
                                    <TaskCard
                                      key={task.id}
                                      task={task}
                                      projects={projects}
                                      categories={categories}
                                      onDelete={() => handleRemoveTaskFromBlock(task.id)}
                                    />
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