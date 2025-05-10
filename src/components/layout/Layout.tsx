import React, { ReactNode, useState } from 'react';
import Header from './Header';
import WeeklyReviewReminder from '../planning/WeeklyReviewReminder';

interface LayoutProps {
  children: ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  const [showReminder, setShowReminder] = useState(true);

  const handleDismissReminder = () => {
    setShowReminder(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      {showReminder && <WeeklyReviewReminder onDismiss={handleDismissReminder} />}
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {children}
      </main>
    </div>
  );
};

export default Layout;