import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { RefreshCw, X } from 'lucide-react';
import { getISOWeekAndYear } from '../../utils/helpers';

interface WeeklyReviewReminderProps {
  onDismiss?: () => void;
}

// Key for storing the last dismissed date in localStorage
const DISMISSED_KEY = 'weeklyReview_lastDismissed';

const WeeklyReviewReminder: React.FC<WeeklyReviewReminderProps> = ({ onDismiss }) => {
  const { getLatestWeeklyReview } = useAppContext();
  const [shouldShow, setShouldShow] = useState(false);
  
  useEffect(() => {
    // Get current week info
    const today = new Date();
    const { weekNumber, weekYear } = getISOWeekAndYear(today);
    
    // Get last completed review
    const latestReview = getLatestWeeklyReview();
    
    // Check if review is already done for this week
    const isReviewCompleted = latestReview &&
      latestReview.weekNumber === weekNumber &&
      latestReview.weekYear === weekYear &&
      latestReview.isComplete;
    
    if (isReviewCompleted) {
      setShouldShow(false);
      return;
    }
    
    // Check if notification was dismissed recently
    const lastDismissed = localStorage.getItem(DISMISSED_KEY);
    if (lastDismissed) {
      const [dismissedYear, dismissedWeek] = lastDismissed.split('-').map(n => parseInt(n, 10));
      
      // If dismissed in the current week, don't show again
      if (dismissedYear === weekYear && dismissedWeek === weekNumber) {
        setShouldShow(false);
        return;
      }
    }
    
    // If we got here, we should show the reminder
    setShouldShow(true);
  }, [getLatestWeeklyReview]);
  
  const handleDismiss = () => {
    // Get current week and store dismissal
    const { weekNumber, weekYear } = getISOWeekAndYear(new Date());
    localStorage.setItem(DISMISSED_KEY, `${weekYear}-${weekNumber}`);
    
    setShouldShow(false);
    if (onDismiss) onDismiss();
  };
  
  if (!shouldShow) return null;
  
  return (
    <div className="bg-blue-50 border-b border-blue-200 p-2 mb-4">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center">
          <RefreshCw className="h-5 w-5 text-blue-600 mr-2" />
          <span className="text-sm text-blue-800">
            Your weekly review is due. Keeping this habit consistent helps prevent things from slipping.
          </span>
        </div>
        <div className="flex items-center space-x-3">
          <Link
            to="/weekly-review"
            className="text-xs bg-blue-600 hover:bg-blue-700 text-white py-1 px-3 rounded-full transition-colors"
          >
            Do it now
          </Link>
          <Link
            to="/journal"
            className="text-xs bg-violet-600 hover:bg-violet-700 text-white py-1 px-3 rounded-full transition-colors"
          >
            View journal entries
          </Link>
          <button
            onClick={handleDismiss}
            className="p-1 text-blue-600 hover:text-blue-800 rounded-full hover:bg-blue-100"
            aria-label="Dismiss"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WeeklyReviewReminder;