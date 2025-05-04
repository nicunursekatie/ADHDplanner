import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { Download, Upload, Trash2, AlertCircle } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { exportData, importData, resetData, initializeSampleData } = useAppContext();
  
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  
  const handleExportData = () => {
    const data = exportData();
    const blob = new Blob([data], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `taskmanager-export-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };
  
  const handleImportClick = () => {
    setImportModalOpen(true);
    setImportFile(null);
    setImportError(null);
    setImportSuccess(false);
  };
  
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImportFile(e.target.files[0]);
      setImportError(null);
    }
  };
  
  const handleImportData = () => {
    if (!importFile) {
      setImportError('Please select a file to import');
      return;
    }
    
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const result = importData(content);
        
        if (result) {
          setImportSuccess(true);
          setImportError(null);
          
          // Close modal after success
          setTimeout(() => {
            setImportModalOpen(false);
          }, 2000);
        } else {
          setImportError('Failed to import data. Make sure the file is a valid TaskManager export.');
        }
      } catch (error) {
        setImportError('Invalid file format. Please select a valid JSON file.');
      }
    };
    
    reader.onerror = () => {
      setImportError('Error reading the file');
    };
    
    reader.readAsText(importFile);
  };
  
  const handleResetClick = () => {
    setResetModalOpen(true);
  };
  
  const handleResetConfirm = () => {
    resetData();
    setResetModalOpen(false);
  };
  
  const handleLoadSampleData = () => {
    initializeSampleData();
  };
  
  return (
    <div className="space-y-6 max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between md:items-center bg-white rounded-lg shadow-sm p-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Settings</h1>
          <p className="text-gray-600">Manage your data and preferences</p>
        </div>
      </div>
      
      {/* Data Management */}
      <Card title="Data Management">
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between py-2 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Export Data</h3>
              <p className="text-sm text-gray-500">
                Download all your tasks, projects, and categories as a JSON file
              </p>
            </div>
            <Button
              variant="primary"
              icon={<Download size={16} />}
              className="mt-2 md:mt-0"
              onClick={handleExportData}
            >
              Export
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between py-2 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Import Data</h3>
              <p className="text-sm text-gray-500">
                Import previously exported data into TaskManager
              </p>
            </div>
            <Button
              variant="secondary"
              icon={<Upload size={16} />}
              className="mt-2 md:mt-0"
              onClick={handleImportClick}
            >
              Import
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between py-2 border-b border-gray-200">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Sample Data</h3>
              <p className="text-sm text-gray-500">
                Load sample tasks, projects, and categories for demonstration
              </p>
            </div>
            <Button
              variant="secondary"
              className="mt-2 md:mt-0"
              onClick={handleLoadSampleData}
            >
              Load Samples
            </Button>
          </div>
          
          <div className="flex flex-col md:flex-row md:items-center justify-between py-2">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Reset Data</h3>
              <p className="text-sm text-gray-500">
                Delete all data and start fresh (cannot be undone)
              </p>
            </div>
            <Button
              variant="danger"
              icon={<Trash2 size={16} />}
              className="mt-2 md:mt-0"
              onClick={handleResetClick}
            >
              Reset
            </Button>
          </div>
        </div>
      </Card>
      
      {/* About */}
      <Card title="About TaskManager">
        <div className="space-y-2">
          <p className="text-sm text-gray-600">
            TaskManager is a personal productivity app that helps you organize your tasks, projects, and daily schedule.
          </p>
          <p className="text-sm text-gray-600">
            Version 1.0.0
          </p>
        </div>
      </Card>
      
      {/* Import Modal */}
      <Modal
        isOpen={importModalOpen}
        onClose={() => setImportModalOpen(false)}
        title="Import Data"
      >
        <div className="space-y-4">
          {!importSuccess ? (
            <>
              <p className="text-gray-600">
                Select a TaskManager export file (.json) to import. This will add the data to your existing data.
              </p>
              
              <div className="mt-4">
                <input
                  type="file"
                  accept=".json"
                  className="block w-full text-sm text-gray-500
                    file:mr-4 file:py-2 file:px-4
                    file:rounded-md file:border-0
                    file:text-sm file:font-medium
                    file:bg-indigo-50 file:text-indigo-700
                    hover:file:bg-indigo-100"
                  onChange={handleFileChange}
                />
              </div>
              
              {importError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-md flex items-start">
                  <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                  <p className="text-sm">{importError}</p>
                </div>
              )}
              
              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => setImportModalOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  onClick={handleImportData}
                  disabled={!importFile}
                >
                  Import
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <CheckIcon className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Import Successful</h3>
              <p className="mt-1 text-sm text-gray-500">
                Your data has been imported successfully.
              </p>
            </div>
          )}
        </div>
      </Modal>
      
      {/* Reset Modal */}
      <Modal
        isOpen={resetModalOpen}
        onClose={() => setResetModalOpen(false)}
        title="Reset Data"
      >
        <div className="space-y-4">
          <div className="p-3 bg-red-50 text-red-700 rounded-md flex items-start">
            <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
            <div>
              <p className="text-sm font-medium">Warning: This action cannot be undone</p>
              <p className="text-sm">All your tasks, projects, and categories will be permanently deleted.</p>
            </div>
          </div>
          
          <p className="text-gray-600">
            Consider exporting your data before resetting if you might want to restore it later.
          </p>
          
          <div className="flex justify-end space-x-3 pt-4">
            <Button
              variant="secondary"
              onClick={() => setResetModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="danger"
              onClick={handleResetConfirm}
            >
              Reset All Data
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
};

// Check icon for success message
const CheckIcon = ({ className }: { className?: string }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    className={className} 
    fill="none" 
    viewBox="0 0 24 24" 
    stroke="currentColor"
  >
    <path 
      strokeLinecap="round" 
      strokeLinejoin="round" 
      strokeWidth={2} 
      d="M5 13l4 4L19 7" 
    />
  </svg>
);

export default SettingsPage;