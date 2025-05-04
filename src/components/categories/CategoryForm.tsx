import React, { useState, useEffect } from 'react';
import { Category } from '../../types';
import { useAppContext } from '../../context/AppContext';
import Button from '../common/Button';

interface CategoryFormProps {
  category?: Category;
  onClose: () => void;
  isEdit?: boolean;
}

const CategoryForm: React.FC<CategoryFormProps> = ({
  category,
  onClose,
  isEdit = false,
}) => {
  const { addCategory, updateCategory } = useAppContext();
  
  const initialState: Partial<Category> = {
    name: '',
    color: '#3B82F6', // Default blue color
    ...category,
  };
  
  const [formData, setFormData] = useState<Partial<Category>>(initialState);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (category) {
      setFormData({ ...category });
    } else {
      setFormData(initialState);
    }
  }, [category]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: { [key: string]: string } = {};
    
    if (!formData.name?.trim()) {
      newErrors.name = 'Category name is required';
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }
    
    if (isEdit && category) {
      updateCategory({ ...category, ...formData } as Category);
    } else {
      addCategory(formData);
    }
    
    onClose();
  };

  // Predefined color palette
  const colorPalette = [
    '#3B82F6', // Blue
    '#8B5CF6', // Purple
    '#EC4899', // Pink
    '#EF4444', // Red
    '#F59E0B', // Amber
    '#10B981', // Green
    '#06B6D4', // Cyan
    '#6366F1', // Indigo
    '#A855F7', // Violet
    '#F97316', // Orange
  ];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700">
          Category Name <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          id="name"
          name="name"
          value={formData.name || ''}
          onChange={handleChange}
          className={`mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm ${
            errors.name ? 'border-red-500' : ''
          }`}
          placeholder="Enter category name"
          autoFocus
        />
        {errors.name && (
          <p className="mt-1 text-sm text-red-500">{errors.name}</p>
        )}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Category Color
        </label>
        <div className="grid grid-cols-5 gap-2">
          {colorPalette.map(color => (
            <div
              key={color}
              className={`h-8 w-full rounded-md cursor-pointer transition-all ${
                formData.color === color
                  ? 'ring-2 ring-offset-2 ring-indigo-500 scale-110'
                  : 'hover:scale-105'
              }`}
              style={{ backgroundColor: color }}
              onClick={() => setFormData(prev => ({ ...prev, color }))}
            ></div>
          ))}
        </div>
      </div>

      <div className="pt-4 border-t border-gray-200 flex justify-end space-x-3">
        <Button
          type="button"
          variant="secondary"
          onClick={onClose}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          variant="primary"
        >
          {isEdit ? 'Update Category' : 'Create Category'}
        </Button>
      </div>
    </form>
  );
};

export default CategoryForm;