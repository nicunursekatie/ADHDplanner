import React, { useState } from 'react';
import { useAppContext } from '../context/AppContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { testDexieDatabase } from '../utils/testDexie';
import { Download, Upload, Trash2, AlertCircle, Loader, Database, Check, XCircle } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const { exportData, importData, resetData, initializeSampleData, performDatabaseMaintenance } = useAppContext();

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isPerformingMaintenance, setIsPerformingMaintenance] = useState(false);
  const [maintenanceSuccess, setMaintenanceSuccess] = useState(false);

  // State for database test
  const [testResults, setTestResults] = useState<{success: boolean; message: string; details?: {test: string; success: boolean; message: string}[]}>(null);
  const [isTesting, setIsTesting] = useState(false);
  
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
    setIsImporting(false);
    // Reset file input if it exists
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const timeoutRef = React.useRef<NodeJS.Timeout | null>(null);

  // Cleanup any timeout when component unmounts
  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (e.target.files && e.target.files[0]) {
        // Limit file size to 10MB to prevent browser freezing
        if (e.target.files[0].size > 10 * 1024 * 1024) {
          setImportError('File is too large. Please select a file smaller than 10MB.');
          // Reset the file input
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
          return;
        }

        setImportFile(e.target.files[0]);
        setImportError(null);
      }
    } catch (error) {
      console.error('Error selecting file:', error);
      setImportError('Error selecting file. Please try again.');
    }
  };

  const handleImportData = () => {
    if (!importFile) {
      setImportError('Please select a file to import');
      return;
    }

    // Show loading state
    setIsImporting(true);
    setImportError(null);

    // Use a small timeout to let the UI update before starting the import
    // This prevents the browser from freezing immediately
    setTimeout(() => {
      try {
        const reader = new FileReader();

        reader.onload = async (e) => {
          try {
            const content = e.target?.result as string;

            // Basic JSON validation before trying to import
            try {
              // Check if it's valid JSON at all
              const parsedJson = JSON.parse(content);

              // Basic structure validation
              if (!parsedJson || typeof parsedJson !== 'object') {
                setImportError('The file does not contain valid data. Please select a valid TaskManager export file.');
                setIsImporting(false);
                return;
              }

              // Check for expected properties to make sure this is a TaskManager export
              const requiredProperties = ['tasks', 'projects', 'categories'];
              const hasRequiredProps = requiredProperties.some(prop =>
                Object.prototype.hasOwnProperty.call(parsedJson, prop)
              );

              if (!hasRequiredProps) {
                setImportError('The file does not appear to be a TaskManager export. Please select a valid export file.');
                setIsImporting(false);
                return;
              }

              console.log('Import validation passed, proceeding with import...');
            } catch (jsonError) {
              console.error('JSON parsing error:', jsonError);
              setImportError('Invalid JSON format. Please select a valid export file.');
              setIsImporting(false);
              return;
            }

            // Handle the Promise properly with await
            console.log('Starting data import...');
            const result = await importData(content);

            if (result) {
              console.log('Import succeeded!');
              setImportSuccess(true);
              setImportError(null);
              setIsImporting(false);

              // Close modal after success
              if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
              }

              timeoutRef.current = setTimeout(() => {
                setImportModalOpen(false);
                // Reset file input
                if (fileInputRef.current) {
                  fileInputRef.current.value = '';
                }
              }, 2000);
            } else {
              console.error('Import returned false');
              setImportError('Failed to import data. Make sure the file is a valid TaskManager export file and try again.');
              setIsImporting(false);
            }
          } catch (error) {
            console.error('Import error:', error);
            let errorMessage = 'An unexpected error occurred during import.';

            if (error instanceof Error) {
              console.error('Error details:', error.message);
              // Provide more specific error message based on the error type
              if (error.message.includes('schema') || error.message.includes('property')) {
                errorMessage = 'The import file contains data that does not match the expected format. This might be due to a version mismatch.';
              } else if (error.message.includes('duplicate')) {
                errorMessage = 'The import failed due to duplicate data. Please reset your data before importing.';
              }
            }

            setImportError(`${errorMessage} Please try again or contact support if the problem persists.`);
            setIsImporting(false);
          }
        };

        reader.onerror = (error) => {
          console.error('FileReader error:', error);
          setImportError('Error reading the file. The file might be corrupt or inaccessible.');
          setIsImporting(false);
        };

        reader.readAsText(importFile);
      } catch (error) {
        console.error('Import process error:', error);
        setImportError('An unexpected error occurred. Please try again or try using a different file.');
        setIsImporting(false);
      }
    }, 100);
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

  const handleDatabaseMaintenance = async () => {
    try {
      setIsPerformingMaintenance(true);
      setMaintenanceSuccess(false);

      await performDatabaseMaintenance();

      setMaintenanceSuccess(true);

      // Reset success message after a delay
      setTimeout(() => {
        setMaintenanceSuccess(false);
      }, 3000);
    } catch (error) {
      console.error('Error during database maintenance:', error);
    } finally {
      setIsPerformingMaintenance(false);
    }
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
      
      {/* Storage Information */}
      <Card title="Storage Information">
        <div className="space-y-4">
          <div className="flex items-start space-x-3">
            <div className="mt-1">
              <Database size={24} className="text-indigo-500" />
            </div>
            <div>
              <h3 className="text-lg font-medium text-gray-900">Local IndexedDB Storage</h3>
              <p className="text-sm text-gray-500 mb-3">
                All your data is stored locally in your browser using IndexedDB,
                which means it's available even when you're offline. Regular backups
                are recommended using the Export feature above.
              </p>
              <p className="text-sm text-gray-600">
                Your data is stored only on this device and never sent to any server.
              </p>

              <div className="mt-4 space-y-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Button
                    variant="secondary"
                    size="small"
                    onClick={async () => {
                      setIsTesting(true);
                      try {
                        const results = await testDexieDatabase();
                        setTestResults(results);
                      } catch (error) {
                        console.error('Error running database tests:', error);
                        setTestResults({
                          success: false,
                          message: `Error running tests: ${error instanceof Error ? error.message : 'Unknown error'}`,
                          details: []
                        });
                      } finally {
                        setIsTesting(false);
                      }
                    }}
                    disabled={isTesting || isPerformingMaintenance}
                  >
                    {isTesting ? 'Testing...' : 'Test Database Connection'}
                  </Button>

                  <Button
                    variant="secondary"
                    size="small"
                    onClick={handleDatabaseMaintenance}
                    disabled={isTesting || isPerformingMaintenance}
                  >
                    {isPerformingMaintenance ? (
                      <>
                        <Loader size={14} className="mr-2 animate-spin" />
                        Optimizing...
                      </>
                    ) : (
                      'Optimize Database'
                    )}
                  </Button>

                  {maintenanceSuccess && (
                    <span className="inline-flex items-center text-sm text-green-700">
                      <Check size={14} className="mr-1" />
                      Database optimized
                    </span>
                  )}
                </div>

                {testResults && (
                  <div className={`mt-3 p-3 rounded-md ${
                    testResults.success ? 'bg-green-50' : 'bg-red-50'
                  }`}>
                    <div className="flex items-center mb-2">
                      {testResults.success ? (
                        <Check size={16} className="text-green-600 mr-2" />
                      ) : (
                        <XCircle size={16} className="text-red-600 mr-2" />
                      )}
                      <span className={`font-medium ${
                        testResults.success ? 'text-green-700' : 'text-red-700'
                      }`}>
                        {testResults.message}
                      </span>
                    </div>

                    {testResults.details && testResults.details.length > 0 && (
                      <div className="mt-2 space-y-1 text-sm">
                        {testResults.details.map((detail, idx) => (
                          <div key={idx} className="flex items-start">
                            {detail.success ? (
                              <Check size={12} className="text-green-600 mr-1 mt-1 flex-shrink-0" />
                            ) : (
                              <XCircle size={12} className="text-red-600 mr-1 mt-1 flex-shrink-0" />
                            )}
                            <div>
                              <span className="font-medium">{detail.test}:</span> {detail.message}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="mt-4 p-3 bg-blue-50 rounded-md text-sm text-blue-700">
                <h4 className="font-medium mb-1">Memory Usage Tips</h4>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Regularly use the "Optimize Database" feature if the app becomes slow</li>
                  <li>Archive completed tasks frequently to improve performance</li>
                  <li>Export your data regularly as a backup</li>
                  <li>If experiencing memory issues, try refreshing the page</li>
                </ul>
              </div>
            </div>
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
        onClose={() => {
          setImportModalOpen(false);
          setImportFile(null);
          setImportError(null);
          setIsImporting(false);
          // Reset file input if it exists
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }}
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
                  ref={fileInputRef}
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
                <p className="mt-1 text-xs text-gray-500">
                  Maximum file size: 10MB
                </p>
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
                  disabled={!importFile || isImporting}
                >
                  {isImporting ? (
                    <>
                      <Loader size={16} className="mr-2 animate-spin" />
                      Importing...
                    </>
                  ) : (
                    'Import'
                  )}
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