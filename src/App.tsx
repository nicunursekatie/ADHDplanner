import React, { useEffect, useState } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/layout/Layout';

// Pages
import Dashboard from './pages/Dashboard';
import EnhancedTasksPage from './pages/EnhancedTasksPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import CategoriesPage from './pages/CategoriesPage';
import WhatNowPage from './pages/WhatNowPage';
import CalendarPage from './pages/CalendarPage';
import EnhancedPlanningPage from './pages/EnhancedPlanningPage';
import PlannerPage from './pages/PlannerPage';
import SettingsPage from './pages/SettingsPage';

// Memory Tools Pages
import BrainDumpPage from './pages/BrainDumpPage';
import WeeklyReviewPage from './pages/WeeklyReviewPage';
import AccountabilityPage from './pages/AccountabilityPage';
// JOURNAL FEATURE DISABLED: import JournalPage from './pages/JournalPage';

// Emergency database reset component
const EmergencyReset: React.FC = () => {
  const [status, setStatus] = useState<string>('Initializing emergency database reset...');

  useEffect(() => {
    const performEmergencyReset = async () => {
      try {
        setStatus('Closing any open database connections...');

        // Wait a moment for connections to close
        await new Promise(resolve => setTimeout(resolve, 1000));

        setStatus('Deleting IndexedDB database...');

        // Try to delete the database
        const deleteRequest = window.indexedDB.deleteDatabase('ADHDPlannerDB');

        deleteRequest.onerror = () => {
          setStatus('Error deleting database. Please try again or clear all site data manually.');
        };

        deleteRequest.onsuccess = () => {
          setStatus('Database successfully deleted. Reloading application...');

          // Wait a moment before reloading to show success message
          setTimeout(() => {
            // Remove the emergency reset parameter and reload
            const url = new URL(window.location.href);
            url.searchParams.delete('emergency_reset');
            window.location.href = url.toString();
          }, 2000);
        };
      } catch (error) {
        console.error('Error during emergency reset:', error);
        setStatus('Error during emergency reset. Please try clearing browser data manually.');
      }
    };

    performEmergencyReset();
  }, []);

  return (
    <div className="flex items-center justify-center min-h-screen bg-red-50">
      <div className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-xl font-bold text-red-600 mb-4">Emergency Database Reset</h1>
        <div className="animate-pulse mb-4 bg-amber-100 p-4 rounded-md">
          <p className="text-amber-800">{status}</p>
        </div>
        <p className="text-sm text-gray-600">
          This operation will completely delete and reset the application database. All data will be lost.
        </p>
      </div>
    </div>
  );
};

function App() {
  // Check if the URL has an emergency_reset parameter
  const urlParams = new URLSearchParams(window.location.search);
  const isEmergencyReset = urlParams.get('emergency_reset') === 'true';

  // If emergency reset is requested, show the reset screen
  if (isEmergencyReset) {
    return <EmergencyReset />;
  }

  return (
    <AppProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<EnhancedTasksPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/what-now" element={<WhatNowPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/planner" element={<PlannerPage />} />
            <Route path="/planning" element={<EnhancedPlanningPage />} />
            <Route path="/settings" element={<SettingsPage />} />

            {/* Memory Tools Routes */}
            <Route path="/brain-dump" element={<BrainDumpPage />} />
            <Route path="/weekly-review" element={<WeeklyReviewPage />} />
            <Route path="/accountability" element={<AccountabilityPage />} />
            {/* JOURNAL FEATURE DISABLED: <Route path="/journal" element={<JournalPage />} /> */}
          </Routes>
        </Layout>
      </Router>
    </AppProvider>
  );
}

export default App;