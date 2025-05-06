import React, { useState } from 'react';
import { TimeBlock } from '../../types';
import Modal from '../common/Modal';
import Button from '../common/Button';
import { Save, Trash2, X } from 'lucide-react';

interface TimeBlockModalProps {
  block: TimeBlock | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (updatedBlock: TimeBlock) => void;
  onDelete: (blockId: string) => void;
}

const TimeBlockModal: React.FC<TimeBlockModalProps> = ({
  block,
  isOpen,
  onClose,
  onSave,
  onDelete,
}) => {
  const [formData, setFormData] = useState<TimeBlock>(
    block ?? {
      id: '',
      startTime: '09:00',
      endTime: '10:00',
      taskId: null,
      title: '',
      description: '',
    }
  );

  // Update the form data when the block prop changes
  React.useEffect(() => {
    if (block) {
      setFormData(block);
    }
  }, [block]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    onClose();
  };

  const handleDelete = () => {
    if (block && window.confirm('Are you sure you want to delete this time block?')) {
      onDelete(block.id);
      onClose();
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={block ? 'Edit Time Block' : 'Add Custom Time Block'}>
      <div className="bg-indigo-50 border border-indigo-200 rounded-md p-3 mb-4">
        <h3 className="text-sm font-medium text-indigo-800 mb-1">Flexible Time Blocking</h3>
        <p className="text-xs text-indigo-700">
          Create as many custom time blocks as you need with any start and end times. Your time blocks will be sorted chronologically.
        </p>
      </div>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label htmlFor="startTime" className="block text-sm font-medium text-gray-700 mb-1">
              Start Time
            </label>
            <input
              id="startTime"
              type="time"
              name="startTime"
              value={formData.startTime}
              onChange={handleChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">Enter any time in 24-hour format (e.g., 14:30 for 2:30 PM)</p>
          </div>
          <div>
            <label htmlFor="endTime" className="block text-sm font-medium text-gray-700 mb-1">
              End Time
            </label>
            <input
              id="endTime"
              type="time"
              name="endTime"
              value={formData.endTime}
              onChange={handleChange}
              className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            />
            <p className="mt-1 text-xs text-gray-500">Enter any time in 24-hour format (e.g., 16:00 for 4:00 PM)</p>
          </div>
        </div>

        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            Title
          </label>
          <input
            id="title"
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Block title"
          />
        </div>

        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
            Description (Optional)
          </label>
          <textarea
            id="description"
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            rows={3}
            className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm"
            placeholder="Add details about this time block"
          />
        </div>

        <div className="flex justify-between pt-4">
          {block && (
            <Button type="button" variant="danger" size="sm" icon={<Trash2 size={16} />} onClick={handleDelete}>
              Delete
            </Button>
          )}
          <div className="flex space-x-2 ml-auto">
            <Button type="button" variant="secondary" size="sm" icon={<X size={16} />} onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" variant="primary" size="sm" icon={<Save size={16} />}>
              {block ? 'Save Changes' : 'Create Block'}
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
};

export default TimeBlockModal;