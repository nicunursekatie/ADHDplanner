import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Category } from '../types';
import CategoryCard from '../components/categories/CategoryCard';
import CategoryForm from '../components/categories/CategoryForm';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Empty from '../components/common/Empty';
import { Plus, Tag } from 'lucide-react';

const CategoriesPage: React.FC = () => {
  const { categories, tasks, deleteCategory } = useAppContext();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  
  const handleOpenModal = (category?: Category) => {
    if (category) {
      setEditingCategory(category);
    } else {
      setEditingCategory(null);
    }
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingCategory(null);
  };
  
  const handleOpenDeleteConfirm = (categoryId: string) => {
    setConfirmDelete(categoryId);
  };
  
  const handleCloseDeleteConfirm = () => {
    setConfirmDelete(null);
  };
  
  const handleDeleteCategory = () => {
    if (confirmDelete) {
      deleteCategory(confirmDelete);
      setConfirmDelete(null);
    }
  };
  
  // Count tasks for each category
  const getTaskCount = (categoryId: string): number => {
    return tasks.filter(task => task.categoryIds?.includes(categoryId) || false).length;
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center bg-white rounded-lg shadow-sm p-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Categories</h1>
          <p className="text-gray-600">
            {categories.length} categor{categories.length !== 1 ? 'ies' : 'y'}
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => handleOpenModal()}
          >
            New Category
          </Button>
        </div>
      </div>
      
      {/* Category list */}
      {categories.length > 0 ? (
        <div className="space-y-2">
          {categories.map(category => (
            <CategoryCard
              key={category.id}
              category={category}
              taskCount={getTaskCount(category.id)}
              onEdit={handleOpenModal}
              onDelete={handleOpenDeleteConfirm}
            />
          ))}
        </div>
      ) : (
        <Empty
          title="No categories yet"
          description="Create your first category to organize your tasks"
          icon={<Tag className="mx-auto h-12 w-12 text-gray-400" />}
          action={
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={16} />}
              onClick={() => handleOpenModal()}
            >
              New Category
            </Button>
          }
        />
      )}
      
      {/* Category Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingCategory ? 'Edit Category' : 'Create New Category'}
      >
        <CategoryForm
          category={editingCategory || undefined}
          onClose={handleCloseModal}
          isEdit={!!editingCategory}
        />
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={handleCloseDeleteConfirm}
        title="Delete Category"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete this category? Tasks associated with this category will remain, but will no longer have this category assigned.
          </p>
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={handleCloseDeleteConfirm}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleDeleteCategory}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default CategoriesPage;