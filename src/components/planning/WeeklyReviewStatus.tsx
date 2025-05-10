import React, { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { useAppContext } from '../../context/AppContext';
import { RefreshCw, CheckCircle, AlertTriangle } from 'lucide-react';
import { getISOWeekAndYear } from '../../utils/helpers';

interface WeeklyReviewStatusProps {
  compact?: boolean;
}

const WeeklyReviewStatus: React.FC<WeeklyReviewStatusProps> = ({ compact = false }) => {
  const { getLatestWeeklyReview } = useAppContext();
  
  // Get current week information
  const today = useMemo(() => new Date(), []);
  const { weekNumber: currentWeekNumber, weekYear: currentWeekYear } = useMemo(() => 
    getISOWeekAndYear(today), [today]
  );
  
  // Get last completed review
  const latestReview = getLatestWeeklyReview();
  
  // Determine if review is due
  const isReviewDue = useMemo(() => {
    if (!latestReview) return true;
    
    // Check if we're in a new week compared to the last review
    if (latestReview.weekYear < currentWeekYear) return true;
    if (latestReview.weekYear === currentWeekYear && latestReview.weekNumber < currentWeekNumber) return true;
    
    return false;
  }, [latestReview, currentWeekNumber, currentWeekYear]);
  
  // Format date nicely for display
  const formatDate = (entries: { updatedAt: string }[]) => {
    if (!entries || entries.length === 0) return 'Never';
    
    // Find the most recent entry
    const sortedEntries = [...entries].sort((a, b) => 
      new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime()
    );
    
    const latestEntry = sortedEntries[0];
    const date = new Date(latestEntry.updatedAt);
    
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  // For compact version (used in dashboard)
  if (compact) {
    const statusColor = isReviewDue ? 'text-orange-600' : 'text-green-600';
    const bgColor = isReviewDue ? 'bg-orange-50' : 'bg-green-50';
    const Icon = isReviewDue ? AlertTriangle : CheckCircle;
    
    return (
      <Link to="/weekly-review">
        <div className={`p-2 rounded-lg ${bgColor} flex items-center justify-between hover:bg-opacity-70 transition-colors`}>
          <div className="flex items-center">
            <RefreshCw className={`w-4 h-4 ${statusColor} mr-1.5`} />
            <span className={`text-sm font-medium ${statusColor}`}>
              Weekly Review
            </span>
          </div>
          <div className="flex items-center">
            <span className="text-xs text-gray-600 mr-1">
              {isReviewDue ? 'Due now' : 'Completed'}
            </span>
            <Icon className={`w-4 h-4 ${statusColor}`} />
          </div>
        </div>
      </Link>
    );
  }
  
  // Full version (can be used in other places)
  return (
    <div className="bg-white rounded-lg shadow-sm p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center">
          <RefreshCw className="w-5 h-5 text-blue-600 mr-2" />
          <h3 className="text-lg font-medium text-gray-900">Weekly Review Status</h3>
        </div>
        <Link 
          to="/weekly-review"
          className={`px-3 py-1 rounded-full text-sm font-medium inline-flex items-center ${
            isReviewDue 
              ? 'bg-orange-100 text-orange-700 hover:bg-orange-200' 
              : 'bg-green-100 text-green-700 hover:bg-green-200'
          }`}
        >
          {isReviewDue ? (
            <>
              <AlertTriangle size={14} className="mr-1" />
              Review Due
            </>
          ) : (
            <>
              <CheckCircle size={14} className="mr-1" />
              Up to Date
            </>
          )}
        </Link>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">Current Week</div>
          <div className="font-medium">
            Week {currentWeekNumber}, {currentWeekYear}
          </div>
        </div>
        
        <div className="p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-500 mb-1">Last Review</div>
          <div className="font-medium">
            {latestReview 
              ? `Week ${latestReview.weekNumber}, ${latestReview.weekYear}`
              : 'No reviews yet'
            }
          </div>
          <div className="text-xs text-gray-500 mt-1">
            {latestReview 
              ? `Completed: ${formatDate(latestReview.entries)}`
              : 'Time to start your first review!'
            }
          </div>
        </div>
      </div>
      
      {isReviewDue && (
        <div className="mt-3 p-3 bg-orange-50 border border-orange-100 rounded-lg flex items-center">
          <AlertTriangle size={16} className="text-orange-600 mr-2 flex-shrink-0" />
          <div className="text-sm text-orange-700">
            {latestReview
              ? "It's time for your weekly review. Keeping this habit consistent helps prevent things from slipping through the cracks."
              : "You haven't completed a weekly review yet. Start this powerful habit to keep your tasks organized and your mind clear."
            }
          </div>
        </div>
      )}
      
      {!isReviewDue && (
        <div className="mt-3 p-3 bg-green-50 border border-green-100 rounded-lg flex items-center">
          <CheckCircle size={16} className="text-green-600 mr-2 flex-shrink-0" />
          <div className="text-sm text-green-700">
            Great job! You've completed your weekly review for this week. Your next review will be due next week.
          </div>
        </div>
      )}
    </div>
  );
};

export default WeeklyReviewStatus;