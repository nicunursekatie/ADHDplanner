import React from 'react';
import { Edit, Trash } from 'lucide-react';
import { Category } from '../../types';

interface CategoryCardProps {
  category: Category;
  taskCount: number;
  onEdit: (category: Category) => void;
  onDelete: (categoryId: string) => void;
}

const CategoryCard: React.FC<CategoryCardProps> = ({
  category,
  taskCount,
  onEdit,
  onDelete,
}) => {
  return (
    <div 
      className="flex items-center justify-between p-3 rounded-lg shadow-sm border border-gray-100 bg-white hover:shadow-md transition-all"
    >
      <div className="flex items-center">
        <div 
          className="h-4 w-4 rounded-full mr-3" 
          style={{ backgroundColor: category.color }}
        ></div>
        <span className="font-medium">{category.name}</span>
      </div>
      
      <div className="flex items-center space-x-4">
        <span className="text-sm text-gray-500">
          {taskCount} task{taskCount !== 1 ? 's' : ''}
        </span>
        
        <div className="flex space-x-1">
          <button
            onClick={() => onEdit(category)}
            className="p-1 text-gray-400 hover:text-gray-500 rounded"
          >
            <Edit size={16} />
          </button>
          <button
            onClick={() => onDelete(category.id)}
            className="p-1 text-gray-400 hover:text-red-500 rounded"
          >
            <Trash size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default CategoryCard;