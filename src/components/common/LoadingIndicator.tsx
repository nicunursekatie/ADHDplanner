import React from 'react';
import { useAppContext } from '../../context/AppContext';
import { RefreshCw } from 'lucide-react';

interface LoadingIndicatorProps {
  type?: 'tasks' | 'projects' | 'categories' | 'dailyPlans' | 'workSchedule' | 'journalEntries' | 'importExport';
}

const LoadingIndicator: React.FC<LoadingIndicatorProps> = ({ type }) => {
  const { loadingStates, isLoading } = useAppContext();
  
  // If a specific type is provided, check that specific loading state
  const isTypeLoading = type ? loadingStates[type] : false;
  
  // If no type is provided, show when any loading is happening
  const shouldShow = type ? isTypeLoading : isLoading;
  
  if (!shouldShow) return null;
  
  return (
    <div className="inline-flex items-center gap-1 text-sm text-gray-500 px-2 py-1 bg-gray-100 rounded">
      <RefreshCw size={14} className="animate-spin" />
      <span>
        {type ? `Loading ${type}...` : 'Loading...'}
      </span>
    </div>
  );
};

export default LoadingIndicator;