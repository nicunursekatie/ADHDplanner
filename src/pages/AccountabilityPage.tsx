import React from 'react';
import AccountabilityCheckIn from '../components/planning/AccountabilityCheckIn';

const AccountabilityPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center bg-white rounded-lg shadow-sm p-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Accountability Check-In</h1>
          <p className="text-gray-600">Learn from incomplete tasks to plan better</p>
        </div>
      </div>
      
      <AccountabilityCheckIn />
      
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">Why Accountability Matters for ADHD</h2>
        
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="bg-orange-100 text-orange-700 rounded-full w-6 h-6 flex items-center justify-center font-semibold mr-3 mt-0.5">1</div>
            <div>
              <h3 className="font-medium text-gray-800">Not About Blame</h3>
              <p className="text-gray-600 text-sm">
                The goal isn't to feel bad about incomplete tasks, but to understand patterns and adjust your approach.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="bg-orange-100 text-orange-700 rounded-full w-6 h-6 flex items-center justify-center font-semibold mr-3 mt-0.5">2</div>
            <div>
              <h3 className="font-medium text-gray-800">Identify Patterns</h3>
              <p className="text-gray-600 text-sm">
                Do certain types of tasks consistently get missed? Are there specific reasons tasks don't get done?
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="bg-orange-100 text-orange-700 rounded-full w-6 h-6 flex items-center justify-center font-semibold mr-3 mt-0.5">3</div>
            <div>
              <h3 className="font-medium text-gray-800">Adjust and Improve</h3>
              <p className="text-gray-600 text-sm">
                Use what you learn to create more realistic plans, break down complex tasks, or schedule work when you have the right energy.
              </p>
            </div>
          </div>
        </div>
        
        <div className="mt-4 bg-orange-50 border border-orange-100 rounded-lg p-3 text-sm text-gray-700">
          <p>
            <strong>Remember:</strong> With ADHD, traditional planning approaches often don't work. 
            This system helps you discover what actually works for <em>you</em>, based on real data from your own experience.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AccountabilityPage;