import React, { useState, useRef } from 'react';
import { TimeBlock } from '../../types';
import Button from '../common/Button';
import { X, Save } from 'lucide-react';

interface TimeBlockFormProps {
  block: TimeBlock;
  onSave: (updatedBlock: TimeBlock) => void;
  onCancel: () => void;
  onDelete: (blockId: string) => void;
}

const TimeBlockForm: React.FC<TimeBlockFormProps> = ({
  block,
  onSave,
  onCancel,
  onDelete
}) => {
  const [formData, setFormData] = useState<TimeBlock>({
    ...block,
    taskIds: block.taskIds || []
  });
  
  const startTimeRef = useRef<HTMLInputElement>(null);
  const endTimeRef = useRef<HTMLInputElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const descriptionRef = useRef<HTMLTextAreaElement>(null);
  
  // Remove automatic focus that was causing issues
  
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    e.stopPropagation();
    const { name, value } = e.target;
    console.log(`Updating ${name} to ${value}`); // Debug log
    setFormData(prev => {
      const newData = {
        ...prev,
        [name]: value
      };
      console.log('New form data:', newData); // Debug log
      return newData;
    });
  };
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onSave(formData);
  };
  
  const handleDelete = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onDelete(block.id);
  };
  
  return (
    <form 
      onSubmit={handleSubmit} 
      onClick={e => e.stopPropagation()}
      className="space-y-4"
    >
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Start Time
          </label>
          <input
            ref={startTimeRef}
            type="time"
            name="startTime"
            value={formData.startTime || ''}
            onChange={handleChange}
            onClick={e => {
              e.stopPropagation();
              e.preventDefault(); // Prevent any default browser behavior
              startTimeRef.current?.focus();
            }}
            onFocus={e => e.stopPropagation()}
            onKeyDown={e => e.stopPropagation()}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            End Time
          </label>
          <input
            ref={endTimeRef}
            type="time"
            name="endTime"
            value={formData.endTime || ''}
            onChange={handleChange}
            onClick={e => {
              e.stopPropagation();
              e.preventDefault(); // Prevent any default browser behavior
              endTimeRef.current?.focus();
            }}
            onFocus={e => e.stopPropagation()}
            onKeyDown={e => e.stopPropagation()}
            className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Title
        </label>
        <input
          ref={titleRef}
          type="text"
          name="title"
          value={formData.title || ''}
          onChange={handleChange}
          onClick={e => {
            e.stopPropagation(); 
            titleRef.current?.focus();
          }}
          onFocus={e => e.stopPropagation()}
          onKeyDown={e => e.stopPropagation()}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          placeholder="Block title"
        />
      </div>
      
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Description (Optional)
        </label>
        <textarea
          ref={descriptionRef}
          name="description"
          value={formData.description || ''}
          onChange={handleChange}
          onClick={e => {
            e.stopPropagation();
            descriptionRef.current?.focus();
          }}
          onFocus={e => e.stopPropagation()}
          onKeyDown={e => e.stopPropagation()}
          rows={2}
          className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          placeholder="Add details about this time block"
        />
      </div>
      
      <div className="flex justify-between">
        <Button
          variant="danger"
          size="sm"
          icon={<X size={16} />}
          onClick={handleDelete}
          type="button"
        >
          Delete Block
        </Button>
        
        <div className="space-x-2">
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onCancel();
            }}
            type="button"
          >
            Cancel
          </Button>
          
          <Button
            variant="primary"
            size="sm"
            icon={<Save size={16} />}
            type="submit"
          >
            Save Changes
          </Button>
        </div>
      </div>
    </form>
  );
};

export default TimeBlockForm;