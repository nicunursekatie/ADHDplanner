import React from 'react';
import { Project } from '../../types';
import SimplifiedProjectBreakdown from './SimplifiedProjectBreakdown';

interface ProjectBreakdownProps {
  project: Project;
  onClose?: () => void;
}

const ProjectBreakdown: React.FC<ProjectBreakdownProps> = ({ 
  project,
  onClose
}) => {
  // Use our new simplified breakdown component
  return <SimplifiedProjectBreakdown project={project} onClose={onClose} />;
};

export default ProjectBreakdown;