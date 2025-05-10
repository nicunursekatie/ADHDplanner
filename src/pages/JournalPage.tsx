import React, { useState, useMemo } from 'react';
import { useAppContext } from '../context/AppContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import { BookOpen, Calendar, ChevronDown, ChevronUp, RefreshCw } from 'lucide-react';
import { JournalEntry } from '../types';
import { getISOWeekAndYear } from '../utils/helpers';

const JournalPage: React.FC = () => {
  const { journalEntries } = useAppContext();
  const [expandedEntryId, setExpandedEntryId] = useState<string | null>(null);
  
  // Group entries by week
  const entriesByWeek = useMemo(() => {
    const grouped: Record<string, {
      weekNumber: number;
      weekYear: number;
      entries: JournalEntry[];
    }> = {};
    
    journalEntries.forEach(entry => {
      if (!entry.weekNumber || !entry.weekYear) return;
      
      const key = `${entry.weekYear}-${entry.weekNumber}`;
      if (!grouped[key]) {
        grouped[key] = {
          weekNumber: entry.weekNumber,
          weekYear: entry.weekYear,
          entries: []
        };
      }
      
      grouped[key].entries.push(entry);
    });
    
    // Sort by week (most recent first)
    return Object.entries(grouped)
      .sort(([keyA], [keyB]) => keyB.localeCompare(keyA))
      .map(([_, value]) => value);
  }, [journalEntries]);
  
  // Get week date range string
  const getWeekDateRange = (weekNumber: number, weekYear: number): string => {
    // Get first day of the year
    const firstDayOfYear = new Date(weekYear, 0, 1);
    
    // Calculate first day of the week (Monday)
    const firstDayOfWeek = new Date(weekYear, 0, 1 + (weekNumber - 1) * 7);
    
    // Adjust to Monday (ISO week starts on Monday)
    const dayOfWeek = firstDayOfWeek.getDay() || 7;
    firstDayOfWeek.setDate(firstDayOfWeek.getDate() - dayOfWeek + 1);
    
    // Calculate last day of the week (Sunday)
    const lastDayOfWeek = new Date(firstDayOfWeek);
    lastDayOfWeek.setDate(lastDayOfWeek.getDate() + 6);
    
    // Format dates
    const options: Intl.DateTimeFormatOptions = { 
      month: 'short', 
      day: 'numeric' 
    };
    
    return `${firstDayOfWeek.toLocaleDateString('en-US', options)} - ${lastDayOfWeek.toLocaleDateString('en-US', options)}, ${weekYear}`;
  };
  
  // Get section name from ID
  const getSectionName = (sectionId: string): string => {
    const sections: Record<string, string> = {
      'reflect': 'Reflect on Your Week',
      'overdue': 'Overdue Tasks Review',
      'upcoming': 'Week Ahead Planning',
      'projects': 'Projects Review',
      'life-areas': 'Life Areas Check-in'
    };
    
    return sections[sectionId] || 'Journal Entry';
  };
  
  // Handle expanding/collapsing an entry
  const toggleEntry = (entryId: string) => {
    if (expandedEntryId === entryId) {
      setExpandedEntryId(null);
    } else {
      setExpandedEntryId(entryId);
    }
  };
  
  // Get current week info
  const { weekNumber: currentWeekNumber, weekYear: currentWeekYear } = useMemo(() => {
    return getISOWeekAndYear(new Date());
  }, []);
  
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center bg-white rounded-lg shadow-sm p-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Journal</h1>
          <p className="text-gray-600">Your weekly review reflections and insights</p>
        </div>
      </div>
      
      {journalEntries.length === 0 ? (
        <Card>
          <div className="p-6 text-center">
            <BookOpen className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No Journal Entries Yet</h3>
            <p className="text-gray-600 mb-4">
              You haven't created any journal entries yet. Journal entries are created during your weekly reviews.
            </p>
            <Button
              as="a"
              href="/weekly-review"
              variant="primary"
              size="sm"
              icon={<RefreshCw size={16} />}
            >
              Start Weekly Review
            </Button>
          </div>
        </Card>
      ) : (
        <div className="space-y-6">
          {entriesByWeek.map((weekData) => (
            <Card key={`${weekData.weekYear}-${weekData.weekNumber}`}>
              <div className="p-4 bg-indigo-50 border-b border-indigo-100 flex items-center">
                <Calendar className="w-5 h-5 text-indigo-600 mr-2" />
                <h3 className="text-lg font-medium text-gray-900">
                  Week {weekData.weekNumber}, {weekData.weekYear}
                  <span className="ml-2 text-sm font-normal text-gray-600">
                    {getWeekDateRange(weekData.weekNumber, weekData.weekYear)}
                  </span>
                </h3>
                
                {/* Show "Current Week" badge if this is the current week */}
                {weekData.weekNumber === currentWeekNumber && weekData.weekYear === currentWeekYear && (
                  <span className="ml-auto bg-green-100 text-green-800 text-xs font-medium px-2.5 py-0.5 rounded">
                    Current Week
                  </span>
                )}
              </div>
              
              <div className="divide-y divide-gray-200">
                {weekData.entries
                  .sort((a, b) => {
                    // Sort alphabetically by section ID
                    if (a.reviewSectionId && b.reviewSectionId) {
                      return a.reviewSectionId.localeCompare(b.reviewSectionId);
                    }
                    // Put entries with section IDs first
                    if (a.reviewSectionId && !b.reviewSectionId) return -1;
                    if (!a.reviewSectionId && b.reviewSectionId) return 1;
                    return 0;
                  })
                  .map(entry => (
                    <div key={entry.id} className="p-4">
                      <div
                        className="flex items-center justify-between cursor-pointer"
                        onClick={() => toggleEntry(entry.id)}
                      >
                        <div>
                          <h4 className="text-md font-medium text-gray-900">
                            {entry.reviewSectionId ? getSectionName(entry.reviewSectionId) : 'Journal Entry'}
                          </h4>
                          <p className="text-sm text-gray-500">
                            {new Date(entry.updatedAt).toLocaleDateString('en-US', {
                              weekday: 'short',
                              month: 'short',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </p>
                        </div>
                        <button
                          className="p-1 rounded-full hover:bg-gray-100"
                          aria-label={expandedEntryId === entry.id ? 'Collapse' : 'Expand'}
                        >
                          {expandedEntryId === entry.id ? (
                            <ChevronUp size={18} className="text-gray-500" />
                          ) : (
                            <ChevronDown size={18} className="text-gray-500" />
                          )}
                        </button>
                      </div>
                      
                      {expandedEntryId === entry.id && (
                        <div className="mt-3 p-3 bg-gray-50 rounded-md">
                          <div className="whitespace-pre-wrap text-gray-700">
                            {entry.content || <em className="text-gray-400">No content</em>}
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default JournalPage;