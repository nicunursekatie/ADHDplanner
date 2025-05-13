import React, { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';
import Card from '../components/common/Card';
import Button from '../components/common/Button';
import Modal from '../components/common/Modal';
import { testDexieDatabase } from '../utils/testDexie';
import { analyzeImportFile, convertImportFormat } from '../utils/importAnalyzer';
import { Download, Upload, Trash2, AlertCircle, Loader, Database, Check, FileText } from 'lucide-react';

const SettingsPage: React.FC = () => {
  const {
    exportData,
    importData,
    resetData,
    initializeSampleData,
    performDatabaseMaintenance,
    tasks, // Get these state values to force re-renders when they change
    projects,
    categories,
    // Storage management
    getCurrentStorage
  } = useAppContext();

  const [importModalOpen, setImportModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const [importSuccess, setImportSuccess] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isPerformingMaintenance, setIsPerformingMaintenance] = useState(false);
  const [maintenanceSuccess, setMaintenanceSuccess] = useState(false);
  const [isEmergencyResetting, setIsEmergencyResetting] = useState(false);
  const [emergencyResetModalOpen, setEmergencyResetModalOpen] = useState(false);
  const [emergencyResetSuccess, setEmergencyResetSuccess] = useState(false);
  // File analysis states
  const [isAnalyzingFile, setIsAnalyzingFile] = useState(false);
  const [fileAnalysisResult, setFileAnalysisResult] = useState<{
    valid: boolean;
    topLevelKeys: string[];
    format: string;
    hasTasksData: boolean;
    needsConversion: boolean;
    conversionHints: string[];
  } | null>(null);
  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [convertedContent, setConvertedContent] = useState<string | null>(null);

  // State for database test
  const [testResults, setTestResults] = useState<{success: boolean; message: string; details?: {test: string; success: boolean; message: string}[]}>(null);
  const [isTesting, setIsTesting] = useState(false);

  // Using Dexie for storage

  // Moved to useEffect

  // Just log the storage type once on component mount
  useEffect(() => {
    const storage = getCurrentStorage();
    console.log('SettingsPage: Using storage type:', storage);
  }, [getCurrentStorage]);
  
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
        setFileAnalysisResult(null); // Reset any previous analysis
        setConvertedContent(null);
      }
    } catch (error) {
      console.error('Error selecting file:', error);
      setImportError('Error selecting file. Please try again.');
    }
  };

  // Function to analyze the import file format
  const handleAnalyzeFile = () => {
    if (!importFile) {
      setImportError('Please select a file to analyze');
      return;
    }

    setIsAnalyzingFile(true);
    setImportError(null);

    const reader = new FileReader();

    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const analysisResult = analyzeImportFile(content);
        setFileAnalysisResult(analysisResult);
        setShowAnalysisModal(true);

        // If the file needs conversion, try to convert it
        if (analysisResult.needsConversion && analysisResult.format !== 'unknown') {
          try {
            const converted = convertImportFormat(content, analysisResult.format);
            setConvertedContent(converted);
          } catch (conversionError) {
            console.error('Error converting file:', conversionError);
          }
        }
      } catch (error) {
        console.error('Error analyzing file:', error);
        setImportError('Error analyzing file. The file may be corrupted or in an unsupported format.');
      } finally {
        setIsAnalyzingFile(false);
      }
    };

    reader.onerror = () => {
      setImportError('Error reading the file. The file might be corrupt or inaccessible.');
      setIsAnalyzingFile(false);
    };

    reader.readAsText(importFile);
  };

  const handleImportData = (useConverted = false) => {
    if (!importFile && !useConverted) {
      setImportError('Please select a file to import');
      return;
    }

    if (useConverted && !convertedContent) {
      setImportError('No converted content available. Please analyze the file first.');
      return;
    }

    // Show loading state
    setIsImporting(true);
    setImportError(null);

    // Safety check for large files if not using converted content
    if (!useConverted && importFile && importFile.size > 25 * 1024 * 1024) { // 25MB limit
      setImportError('File is too large. Please select a file smaller than 25MB or use the Emergency Reset option if needed.');
      setIsImporting(false);
      return;
    }

    // Set up a progress indicator using a timeout to update UI during long imports
    // This gives users feedback that the app is still working even if it's slow
    const progressInterval = window.setInterval(() => {
      document.title = `Importing... ${Math.floor(Date.now() / 1000) % 3 + 1}`;
    }, 1000);

    // If using converted content, proceed directly with that
    if (useConverted && convertedContent) {
      processImport(convertedContent, progressInterval);
      return;
    }

    // Otherwise read from the file
    // Use a small timeout to let the UI update before starting the import
    setTimeout(() => {
      try {
        const reader = new FileReader();

        reader.onload = async (e) => {
          try {
            const content = e.target?.result as string;
            processImport(content, progressInterval);
          } catch (error) {
            handleImportError(error, progressInterval);
          }
        };

        reader.onerror = (error) => {
          console.error('FileReader error:', error);
          setImportError('Error reading the file. The file might be corrupt or inaccessible.');
          setIsImporting(false);
          clearInterval(progressInterval);
          document.title = "ADHDplanner";
        };

        reader.readAsText(importFile!);
      } catch (error) {
        handleImportError(error, progressInterval);
      }
    }, 100);
  };

  // Helper function to process the import content
  const processImport = async (content: string, progressInterval: number) => {
    try {
      // Skip validation when using an analyzed file
      const isAlreadyAnalyzed = fileAnalysisResult && fileAnalysisResult.valid;

      if (!isAlreadyAnalyzed) {
        // Only do validation if file hasn't been analyzed
        const trimmedContent = content.trim();

        // Accept both object and array formats
        if (!(
          (trimmedContent.startsWith('{') && trimmedContent.endsWith('}')) ||
          (trimmedContent.startsWith('[') && trimmedContent.endsWith(']'))
        )) {
          // Simple check for something that doesn't even remotely look like JSON
          if (!(trimmedContent.includes('{') || trimmedContent.includes('['))) {
            console.error('File doesn\'t appear to be JSON at all');
            setImportError('This doesn\'t appear to be a JSON file. Please select a .json file.');
            setIsImporting(false);
            clearInterval(progressInterval);
            document.title = "ADHDplanner";
            return;
          }

          // If it has brackets but they don't match up, let's try to proceed anyway
          console.warn('File has JSON-like characters but doesn\'t have matching brackets');
          console.log('Will attempt to import anyway and rely on robust parsing logic...');
        }

        // Much more lenient check for required properties - look for data-related keywords
        const possibleDataTerms = [
          'task', 'todo', 'item', 'project', 'list', 'category', 'tag', 'label',
          'plan', 'schedule', 'event', 'entry', 'note', 'journal'
        ];

        // Check for any data-related terms case-insensitively
        const hasAnyDataTerms = possibleDataTerms.some(term =>
          new RegExp(`["']?${term}(s)?["']?`, 'i').test(content)
        );

        if (!hasAnyDataTerms) {
          console.warn('File lacks expected data-related terms');
          // Continue anyway - user has explicitly chosen to import this
          console.log('Continuing import despite unrecognized format...');
        } else {
          console.log('Import basic validation passed, proceeding with import...');
        }
      } else {
        console.log('Using already analyzed file, skipping validation checks...');
      }

      // Start import with processed data chunks
      console.log('Starting data import...');

      // Use a timeout to allow UI updates during processing
      const result = await Promise.race([
        importData(content),
        new Promise<boolean>((_, reject) => {
          // Set a generous timeout for large imports (120 seconds)
          setTimeout(() => reject(new Error('Import timeout - operation took too long')), 120000);
        })
      ]);

      if (result) {
        console.log('Import succeeded!');
        setImportSuccess(true);
        setImportError(null);
        setShowAnalysisModal(false); // Close analysis modal if open
        clearInterval(progressInterval);
        document.title = "ADHDplanner";

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
          // Don't reload the page - manually trigger data refresh instead
          console.log('Manually refreshing data after import');
        }, 2000);
      } else {
        console.error('Import returned false');
        setImportError('Failed to import data. Make sure the file is a valid export file or try analyzing it first.');
        clearInterval(progressInterval);
        document.title = "ADHDplanner";
      }
    } catch (error) {
      handleImportError(error, progressInterval);
    } finally {
      setIsImporting(false);
    }
  };

  // Helper function to handle import errors
  const handleImportError = (error: unknown, progressInterval: number) => {
    console.error('Import error:', error);
    let errorMessage = 'An unexpected error occurred during import.';

    if (error instanceof Error) {
      console.error('Error details:', error.message);
      // Provide more specific error message based on the error type
      if (error.message.includes('schema') || error.message.includes('property')) {
        errorMessage = 'The import file contains data that does not match the expected format. Try analyzing the file first.';
      } else if (error.message.includes('duplicate')) {
        errorMessage = 'The import failed due to duplicate data. Please reset your data before importing.';
      } else if (error.message.includes('memory') || error.message.includes('allocation failed')) {
        errorMessage = 'The browser ran out of memory. Try using the Emergency Reset option first, or import a smaller file.';
      } else if (error.message.includes('timeout')) {
        errorMessage = 'The import process timed out. Try using the Emergency Reset option first, or import a smaller file.';
      } else if (error.message.includes('JSON')) {
        errorMessage = 'The file format appears to be invalid. Try using the Analyze File option to check compatibility.';
      }
    }

    setImportError(`${errorMessage} Please try again or try analyzing the file to check compatibility.`);
    setIsImporting(false);
    clearInterval(progressInterval);
    document.title = "ADHDplanner";
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

  const handleEmergencyResetClick = () => {
    setEmergencyResetModalOpen(true);
  };

  const handleEmergencyResetConfirm = async () => {
    try {
      setIsEmergencyResetting(true);

      // Completely reset the database directly
      console.log('Starting emergency database reset...');

      // First try to delete the database entirely
      try {
        await window.indexedDB.deleteDatabase('ADHDPlannerDB');
        console.log('Database deleted successfully');
      } catch (deleteError) {
        console.error('Error deleting database:', deleteError);
      }

      // Then reset all data in context
      await resetData();

      console.log('Emergency reset completed');
      setEmergencyResetSuccess(true);

      // Close the modal after a success delay
      setTimeout(() => {
        setEmergencyResetModalOpen(false);
        // Don't reload the page, let things initialize naturally
        console.log('Emergency reset completed - not reloading page');
      }, 2000);

    } catch (error) {
      console.error('Error during emergency reset:', error);
    } finally {
      setIsEmergencyResetting(false);
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
          
          <div className="flex flex-col md:flex-row md:items-center justify-between py-2 border-b border-gray-200">
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

          <div className="flex flex-col md:flex-row md:items-center justify-between py-2">
            <div>
              <h3 className="text-lg font-medium text-gray-900">Emergency Reset</h3>
              <p className="text-sm text-gray-500">
                Fix database crashes by completely deleting and recreating the database (cannot be undone)
              </p>
              <p className="text-xs text-red-500 mt-1">
                Only use this if the app is repeatedly crashing or showing memory errors
              </p>
            </div>
            <Button
              variant="danger"
              className="mt-2 md:mt-0"
              onClick={handleEmergencyResetClick}
              disabled={isEmergencyResetting}
            >
              {isEmergencyResetting ? (
                <>
                  <Loader size={16} className="mr-2 animate-spin" />
                  Resetting...
                </>
              ) : (
                'Emergency Reset'
              )}
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
                Select a task/todo data file (.json) to import. This will add the data to your existing data.
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

              {isImporting && (
                <div className="p-3 bg-blue-50 text-blue-700 rounded-md mt-3">
                  <div className="flex items-center mb-2">
                    <Loader size={16} className="mr-2 animate-spin" />
                    <p className="text-sm font-medium">Import in progress. Please be patient.</p>
                  </div>
                  <ul className="text-xs list-disc list-inside space-y-1">
                    <li>The import process may take several minutes for large files</li>
                    <li>Please do not close your browser tab during import</li>
                    <li>If the app becomes unresponsive, you may need to use Emergency Reset</li>
                  </ul>
                </div>
              )}

              <div className="flex flex-wrap justify-between gap-2 pt-4">
                <Button
                  variant="secondary"
                  size="small"
                  icon={<FileText size={14} />}
                  onClick={handleAnalyzeFile}
                  disabled={!importFile || isImporting || isAnalyzingFile}
                >
                  {isAnalyzingFile ? 'Analyzing...' : 'Analyze File Format'}
                </Button>

                <div className="flex space-x-2">
                  <Button
                    variant="secondary"
                    onClick={() => setImportModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  {fileAnalysisResult && fileAnalysisResult.valid ? (
                    <Button
                      variant="primary"
                      onClick={() => handleImportData(!!convertedContent)}
                      disabled={isImporting}
                    >
                      {isImporting ? (
                        <>
                          <Loader size={16} className="mr-2 animate-spin" />
                          Importing... (please wait)
                        </>
                      ) : (
                        'Import Analyzed File'
                      )}
                    </Button>
                  ) : (
                    <Button
                      variant="primary"
                      onClick={() => handleImportData(false)}
                      disabled={!importFile || isImporting}
                    >
                      {isImporting ? (
                        <>
                          <Loader size={16} className="mr-2 animate-spin" />
                          Importing... (please wait)
                        </>
                      ) : (
                        'Import'
                      )}
                    </Button>
                  )}
                </div>
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
              <div className="mt-3 p-3 bg-blue-50 rounded-md">
                <p className="text-sm text-blue-700 font-medium">Data loaded:</p>
                <ul className="text-xs text-blue-600 mt-1 space-y-1">
                  <li>Tasks: {tasks.length}</li>
                  <li>Projects: {projects.length}</li>
                  <li>Categories: {categories.length}</li>
                </ul>
              </div>
              <p className="mt-3 text-xs text-gray-500">
                If you don't see your imported data, please navigate to a different page and then back.
              </p>

              <div className="flex justify-center space-x-3 mt-4">
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => {
                    // Close the modal first
                    setImportModalOpen(false);
                    // Then navigate to tasks page using window.location
                    window.location.hash = "#/tasks";
                  }}
                >
                  View Tasks
                </Button>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={() => {
                    // Close the modal first
                    setImportModalOpen(false);
                    // Then navigate to projects page
                    window.location.hash = "#/projects";
                  }}
                >
                  View Projects
                </Button>
              </div>
            </div>
          )}
        </div>
      </Modal>

      {/* File Analysis Modal */}
      <Modal
        isOpen={showAnalysisModal}
        onClose={() => setShowAnalysisModal(false)}
        title="File Analysis Results"
      >
        <div className="space-y-4">
          {fileAnalysisResult && (
            <>
              <div className={`p-3 rounded-md ${fileAnalysisResult.valid ? 'bg-green-50' : 'bg-red-50'}`}>
                <h3 className={`text-lg font-medium ${fileAnalysisResult.valid ? 'text-green-700' : 'text-red-700'}`}>
                  {fileAnalysisResult.valid
                    ? `Valid ${fileAnalysisResult.format} format`
                    : 'Invalid file format'}
                </h3>
                <p className="text-sm mt-1">
                  {fileAnalysisResult.needsConversion
                    ? 'This file needs conversion to be imported'
                    : 'This file can be imported directly'}
                </p>

                {fileAnalysisResult.topLevelKeys.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium">File contains:</p>
                    <ul className="text-xs mt-1 space-y-1">
                      {fileAnalysisResult.topLevelKeys.map((key, index) => (
                        <li key={index} className="text-gray-600">{key}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {fileAnalysisResult.conversionHints.length > 0 && (
                  <div className="mt-3">
                    <p className="text-sm font-medium">Analysis notes:</p>
                    <ul className="text-xs mt-1 space-y-1 list-disc list-inside">
                      {fileAnalysisResult.conversionHints.map((hint, index) => (
                        <li key={index} className="text-gray-600">{hint}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {convertedContent && (
                <div className="p-3 bg-blue-50 rounded-md">
                  <h3 className="text-md font-medium text-blue-700">Conversion Available</h3>
                  <p className="text-sm mt-1">
                    We've converted your file to a compatible format. You can import the converted data.
                  </p>
                </div>
              )}

              <div className="flex justify-between pt-4">
                <Button
                  variant="secondary"
                  onClick={() => setShowAnalysisModal(false)}
                >
                  Close
                </Button>

                {convertedContent && (
                  <Button
                    variant="primary"
                    onClick={() => {
                      handleImportData(true); // Import using the converted content
                      setShowAnalysisModal(false);
                    }}
                  >
                    Import Converted Data
                  </Button>
                )}
              </div>
            </>
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

      {/* Emergency Reset Modal */}
      <Modal
        isOpen={emergencyResetModalOpen}
        onClose={() => !isEmergencyResetting && setEmergencyResetModalOpen(false)}
        title="Emergency Database Reset"
      >
        <div className="space-y-4">
          {!emergencyResetSuccess ? (
            <>
              <div className="p-3 bg-red-50 text-red-700 rounded-md flex items-start">
                <AlertCircle size={16} className="mr-2 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-sm font-medium">WARNING: Last resort action</p>
                  <p className="text-sm">This will completely delete the database and recreate it from scratch.</p>
                  <p className="text-sm mt-2">All your data will be permanently lost. This action is only recommended if the app is constantly crashing or showing memory errors.</p>
                </div>
              </div>

              <p className="text-gray-600 font-medium">
                What this does:
              </p>
              <ul className="list-disc list-inside space-y-1 text-sm text-gray-600">
                <li>Completely deletes the IndexedDB database</li>
                <li>Recreates a fresh database structure</li>
                <li>Removes all stored data</li>
                <li>Reloads the application</li>
              </ul>

              <div className="flex justify-end space-x-3 pt-4">
                <Button
                  variant="secondary"
                  onClick={() => setEmergencyResetModalOpen(false)}
                  disabled={isEmergencyResetting}
                >
                  Cancel
                </Button>
                <Button
                  variant="danger"
                  onClick={handleEmergencyResetConfirm}
                  disabled={isEmergencyResetting}
                >
                  {isEmergencyResetting ? (
                    <>
                      <Loader size={16} className="mr-2 animate-spin" />
                      Resetting...
                    </>
                  ) : (
                    'Perform Emergency Reset'
                  )}
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-4">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100">
                <Check size={24} className="text-green-600" />
              </div>
              <h3 className="mt-2 text-lg font-medium text-gray-900">Database Reset Complete</h3>
              <p className="mt-1 text-sm text-gray-500">
                Reloading application...
              </p>
            </div>
          )}
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