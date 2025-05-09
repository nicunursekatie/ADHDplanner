#\!/bin/bash
# Script to apply subtask handling improvements to ADHDplanner

# Check if the DailyPlannerGrid.tsx file exists
if [ \! -f "./src/components/planner/DailyPlannerGrid.tsx" ]; then
  echo "Error: DailyPlannerGrid.tsx not found. Make sure you're in the project root directory."
  exit 1
fi

echo "Making backup of original file..."
cp ./src/components/planner/DailyPlannerGrid.tsx ./src/components/planner/DailyPlannerGrid.tsx.bak

echo "Applying subtask handling improvements..."

# 1. Remove AlertCircle from imports
sed -i 's/{ Plus, Clock, GripVertical, Edit, AlertCircle, Info }/{ Plus, Clock, GripVertical, Edit, Info }/g' ./src/components/planner/DailyPlannerGrid.tsx

# 2. Update unscheduled tasks filter to only show top-level tasks
sed -i '/const isDueOnOrBefore/a \ \ \ \ const isTopLevelTask = \!task.parentTaskId;' ./src/components/planner/DailyPlannerGrid.tsx
sed -i 's/return isIncomplete && \!hasTimeBlock && isDueOnOrBefore;/return isIncomplete && \!hasTimeBlock && isDueOnOrBefore && isTopLevelTask;/g' ./src/components/planner/DailyPlannerGrid.tsx

# 3. Update handleRemoveTaskFromBlock to also remove subtasks
sed -i '/const handleRemoveTaskFromBlock = (taskId: string) => {/a \ \ \ \ \/\/ Find the task to check if it has subtasks\n    const taskToRemove = tasks.find(t => t.id === taskId);\n    const subtaskIds = taskToRemove?.subtasks || [];' ./src/components/planner/DailyPlannerGrid.tsx
sed -i 's/taskIds: block.taskIds.filter(id => id \!== taskId)/taskIds: block.taskIds.filter(id => id \!== taskId \&\& \!subtaskIds.includes(id))/g' ./src/components/planner/DailyPlannerGrid.tsx

# 4. Enhance DraggableTask to show subtask indicators
sed -i '/const style = transform/a \ \ \ \ \/\/ Check if task has subtasks for visual indicator\n    const hasSubtasks = task.subtasks \&\& task.subtasks.length > 0;\n    const subtaskCount = hasSubtasks ? task.subtasks.length : 0;' ./src/components/planner/DailyPlannerGrid.tsx
sed -i 's/<div className="flex items-center mb-2 text-gray-400">/<div className="flex items-center justify-between mb-2 text-gray-400">/g' ./src/components/planner/DailyPlannerGrid.tsx
sed -i 's/<GripVertical size={16} className="mr-2" \/>/<div className="flex items-center">\n            <GripVertical size={16} className="mr-2" \/>/g' ./src/components/planner/DailyPlannerGrid.tsx
sed -i 's/<span className="text-sm">Drag to schedule<\/span>/<span className="text-sm">Drag to schedule<\/span>\n          <\/div>\n          {hasSubtasks \&\& (\n            <div className="flex items-center bg-indigo-50 px-2 py-0.5 rounded text-xs">\n              <span className="text-indigo-600 font-medium">{subtaskCount} subtask{subtaskCount \!== 1 ? '\''s'\'' : '\''\'}'}<\/span>\n            <\/div>\n          )}/g' ./src/components/planner/DailyPlannerGrid.tsx

# 5. Fix handling of subtasks in time blocks
sed -i 's/if (task \&\& \!blockTasks.some(t => t.id === id)) blockTasks.push(task);/if (task \&\& \!blockTasks.some(t => t.id === id) \&\& (\!task.parentTaskId || \!block.taskIds.includes(task.parentTaskId))) {\n                                  blockTasks.push(task);\n                                }/g' ./src/components/planner/DailyPlannerGrid.tsx

# 6. Add visual indicator for tasks with subtasks in time blocks
sed -i 's/<TaskCard\n                                      key={task.id}\n                                      task={task}\n                                      projects={projects}\n                                      categories={categories}\n                                      onDelete={() => handleRemoveTaskFromBlock(task.id)}\n                                    \/>/<div key={task.id} className="task-container">\n                                      {\/\* Add a visual parent indicator if this task has subtasks \*\/}\n                                      {task.subtasks \&\& task.subtasks.length > 0 \&\& (\n                                        <div className="mb-1 px-2 py-0.5 bg-indigo-50 text-indigo-600 text-xs rounded inline-flex items-center">\n                                          <span className="font-medium mr-1">{task.subtasks.length}<\/span>\n                                          <span>subtask{task.subtasks.length \!== 1 ? '\''s'\'' : '\''\'}'} included<\/span>\n                                        <\/div>\n                                      )}\n                                      <TaskCard\n                                        task={task}\n                                        projects={projects}\n                                        categories={categories}\n                                        onDelete={() => handleRemoveTaskFromBlock(task.id)}\n                                      \/>\n                                    <\/div>/g' ./src/components/planner/DailyPlannerGrid.tsx

# 7. Modify handleDragEnd to include subtasks when a parent task is dragged
sed -i '/const handleDragEnd = (event: DragEndEvent) => {/,/setActiveId(null);/ c\
  const handleDragEnd = (event: DragEndEvent) => {\
    const { active, over } = event;\
    \
    if (over && active.id \!== over.id) {\
      const taskId = active.id as string;\
      const blockId = over.id as string;\
      \
      // Find the task that was dragged\
      const draggedTask = tasks.find(t => t.id === taskId);\
      \
      // Only proceed if we found the task\
      if (draggedTask) {\
        const updatedBlocks = timeBlocks.map(block => {\
          if (block.id === blockId) {\
            // Initialize taskIds array if it doesnt exist\
            const taskIds = block.taskIds || [];\
            \
            // If using legacy taskId field, migrate to taskIds\
            if (block.taskId && \!taskIds.includes(block.taskId)) {\
              taskIds.push(block.taskId);\
            }\
            \
            // Create a new array with the dragged task and its subtasks\
            const newTaskIds = [...taskIds];\
            \
            // Add the parent task if its not already in the array\
            if (\!newTaskIds.includes(taskId)) {\
              newTaskIds.push(taskId);\
              \
              // Optionally add all subtasks of the dragged task to the time block as well\
              if (draggedTask.subtasks && draggedTask.subtasks.length > 0) {\
                draggedTask.subtasks.forEach(subtaskId => {\
                  if (\!newTaskIds.includes(subtaskId)) {\
                    newTaskIds.push(subtaskId);\
                  }\
                });\
              }\
            }\
            \
            return { \
              ...block, \
              taskId: null, // Clear legacy field\
              taskIds: newTaskIds \
            };\
          }\
          return block;\
        });\
        \
        saveDailyPlan({\
          id: date,\
          date,\
          timeBlocks: updatedBlocks,\
        });\
      }\
    }\
    \
    setActiveId(null);\
  };' ./src/components/planner/DailyPlannerGrid.tsx

echo "Changes applied successfully\!"
echo "A backup of the original file has been created at ./src/components/planner/DailyPlannerGrid.tsx.bak"
echo "Run 'npm run lint' to check for any linting issues."
echo "Run 'npm run dev' to test your changes."
