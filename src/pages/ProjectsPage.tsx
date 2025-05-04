import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import { Project } from '../types';
import ProjectCard from '../components/projects/ProjectCard';
import ProjectForm from '../components/projects/ProjectForm';
import Modal from '../components/common/Modal';
import Button from '../components/common/Button';
import Empty from '../components/common/Empty';
import { Plus, Folder } from 'lucide-react';

const ProjectsPage: React.FC = () => {
  const { projects, tasks, deleteProject } = useAppContext();
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  
  const handleOpenModal = (project?: Project) => {
    if (project) {
      setEditingProject(project);
    } else {
      setEditingProject(null);
    }
    setIsModalOpen(true);
  };
  
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingProject(null);
  };
  
  const handleOpenDeleteConfirm = (projectId: string) => {
    setConfirmDelete(projectId);
  };
  
  const handleCloseDeleteConfirm = () => {
    setConfirmDelete(null);
  };
  
  const handleDeleteProject = () => {
    if (confirmDelete) {
      deleteProject(confirmDelete);
      setConfirmDelete(null);
    }
  };
  
  // Count tasks for each project
  const getTaskCount = (projectId: string): number => {
    return tasks.filter(task => task.projectId === projectId).length;
  };
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center bg-white rounded-lg shadow-sm p-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600">
            {projects.length} project{projects.length !== 1 ? 's' : ''}
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button
            variant="primary"
            icon={<Plus size={16} />}
            onClick={() => handleOpenModal()}
          >
            New Project
          </Button>
        </div>
      </div>
      
      {/* Project grid */}
      {projects.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {projects.map(project => (
            <ProjectCard
              key={project.id}
              project={project}
              taskCount={getTaskCount(project.id)}
              onEdit={handleOpenModal}
              onDelete={handleOpenDeleteConfirm}
            />
          ))}
        </div>
      ) : (
        <Empty
          title="No projects yet"
          description="Create your first project to organize your tasks"
          icon={<Folder className="mx-auto h-12 w-12 text-gray-400" />}
          action={
            <Button
              variant="primary"
              size="sm"
              icon={<Plus size={16} />}
              onClick={() => handleOpenModal()}
            >
              New Project
            </Button>
          }
        />
      )}
      
      {/* Project Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingProject ? 'Edit Project' : 'Create New Project'}
      >
        <ProjectForm
          project={editingProject || undefined}
          onClose={handleCloseModal}
          isEdit={!!editingProject}
        />
      </Modal>
      
      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!confirmDelete}
        onClose={handleCloseDeleteConfirm}
        title="Delete Project"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-gray-600">
            Are you sure you want to delete this project? Any tasks associated with this project will remain, but will no longer be assigned to any project.
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
              onClick={handleDeleteProject}
            >
              Delete
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default ProjectsPage;