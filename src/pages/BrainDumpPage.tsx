import React from 'react';
import BrainDumpPrompt from '../components/tasks/BrainDumpPrompt';

const BrainDumpPage: React.FC = () => {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center bg-white rounded-lg shadow-sm p-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Brain Dump</h1>
          <p className="text-gray-600">Capture all those thoughts spinning in your head</p>
        </div>
      </div>
      
      <BrainDumpPrompt />
      
      <div className="bg-white rounded-lg shadow-sm p-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-3">How to Use Brain Dump</h2>
        
        <div className="space-y-4">
          <div className="flex items-start">
            <div className="bg-indigo-100 text-indigo-700 rounded-full w-6 h-6 flex items-center justify-center font-semibold mr-3 mt-0.5">1</div>
            <div>
              <h3 className="font-medium text-gray-800">Don't filter or judge</h3>
              <p className="text-gray-600 text-sm">
                Write down everything that comes to mind. Don't worry about organizing or prioritizing yet.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="bg-indigo-100 text-indigo-700 rounded-full w-6 h-6 flex items-center justify-center font-semibold mr-3 mt-0.5">2</div>
            <div>
              <h3 className="font-medium text-gray-800">Use the prompts</h3>
              <p className="text-gray-600 text-sm">
                The prompts will help jog your memory about different areas of your life. Keep clicking through them.
              </p>
            </div>
          </div>
          
          <div className="flex items-start">
            <div className="bg-indigo-100 text-indigo-700 rounded-full w-6 h-6 flex items-center justify-center font-semibold mr-3 mt-0.5">3</div>
            <div>
              <h3 className="font-medium text-gray-800">Make it a regular habit</h3>
              <p className="text-gray-600 text-sm">
                Try doing a brain dump daily or whenever you're feeling overwhelmed by too many thoughts.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrainDumpPage;