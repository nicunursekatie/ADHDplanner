import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AppProvider } from './context/AppContext';
import Layout from './components/layout/Layout';

// Pages
import Dashboard from './pages/Dashboard';
import TasksPage from './pages/TasksPage';
import ProjectsPage from './pages/ProjectsPage';
import ProjectDetailPage from './pages/ProjectDetailPage';
import CategoriesPage from './pages/CategoriesPage';
import WhatNowPage from './pages/WhatNowPage';
import CalendarPage from './pages/CalendarPage';
import PlannerPage from './pages/PlannerPage';
import SettingsPage from './pages/SettingsPage';

function App() {
  return (
    <AppProvider>
      <Router>
        <Layout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/projects" element={<ProjectsPage />} />
            <Route path="/projects/:projectId" element={<ProjectDetailPage />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/what-now" element={<WhatNowPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/planner" element={<PlannerPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Routes>
        </Layout>
      </Router>
    </AppProvider>
  );
}

export default App;