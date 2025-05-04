import React from 'react';
import { Edit, Trash, ArrowRight } from 'lucide-react';
import { Project } from '../../types';
import { useAppContext } from '../../context/AppContext';
import Button from '../common/Button';
import { Link } from 'react-router-dom';

interface ProjectCardProps {
  project: Project;
  taskCount: number;
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
}

const ProjectCard: React.FC<ProjectCardProps> = ({
  project,
  taskCount,
  onEdit,
  onDelete,
}) => {
  return (
    <div className="bg-white rounded-lg shadow-sm overflow-hidden border border-gray-100 transition-all hover:shadow-md">
      <div 
        className="h-2"
        style={{ backgroundColor: project.color }}
      ></div>
      <div className="p-4">
        <div className="flex justify-between items-start">
          <h3 className="text-lg font-medium text-gray-900">
            {project.name}
          </h3>
          <div className="flex space-x-1">
            <button
              onClick={() => onEdit(project)}
              className="p-1 text-gray-400 hover:text-gray-500 rounded"
            >
              <Edit size={16} />
            </button>
            <button
              onClick={() => onDelete(project.id)}
              className="p-1 text-gray-400 hover:text-red-500 rounded"
            >
              <Trash size={16} />
            </button>
          </div>
        </div>
        
        {project.description && (
          <p className="mt-2 text-sm text-gray-500">
            {project.description}
          </p>
        )}
        
        <div className="mt-4 flex justify-between items-center">
          <div className="text-sm text-gray-500">
            {taskCount} task{taskCount !== 1 ? 's' : ''}
          </div>
          
          <Link to={`/projects/${project.id}`}>
            <Button
              variant="outline"
              size="sm"
              icon={<ArrowRight size={14} />}
            >
              View
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProjectCard;