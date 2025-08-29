import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import uploadService from '../services/uploadService';

const UploadTester: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testServerConnection = async () => {
    try {
      addResult('🔍 Testing server connection...');
      const response = await fetch('/api/health');
      const data = await response.json();
      addResult(`✅ Server connected: ${data.status}`);
      return true;
    } catch (error: any) {
      addResult(`❌ Server connection failed: ${error.message || error}`);
      return false;
    }
  };

  const testUploadEndpoint = async () => {
    try {
      addResult('🔍 Testing upload endpoint...');
      const response = await fetch('/api/upload/file', {
        method: 'POST',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        body: new FormData()
      });
      
      if (response.status === 400) {
        addResult('✅ Upload endpoint accessible (expected 400 for empty file)');
        return true;
      } else {
        addResult(`⚠️ Unexpected response: ${response.status}`);
        return false;
      }
    } catch (error: any) {
      addResult(`❌ Upload endpoint test failed: ${error.message || error}`);
      return false;
    }
  };

  const createTestFile = () => {
    const content = `Code Postal,Ville,Pays
10001,New York,US
10002,New York,US
75001,Paris,FR
75002,Paris,FR
75003,Paris,FR`;
    
    const blob = new Blob([content], { type: 'text/csv' });
    return new File([blob], 'test-postal-codes.csv', { type: 'text/csv' });
  };

  const testFileUpload = async () => {
    try {
      addResult('📤 Testing file upload...');
      const testFile = createTestFile();
      addResult(`📁 Created test file: ${testFile.name} (${testFile.size} bytes)`);
      
      const result = await uploadService.uploadFile(testFile);
      addResult(`✅ Upload successful: ${result.data.statistics.total} codes detected`);
      return true;
    } catch (error: any) {
      addResult(`❌ File upload failed: ${error.message || error}`);
      return false;
    }
  };

  const testCORS = async () => {
    try {
      addResult('🔍 Testing CORS...');
      const response = await fetch('/api/health', {
        method: 'OPTIONS'
      });
      addResult(`✅ CORS headers present: ${response.headers.get('access-control-allow-origin')}`);
      return true;
    } catch (error: any) {
      addResult(`❌ CORS test failed: ${error.message || error}`);
      return false;
    }
  };

  const runAllTests = async () => {
    setIsTesting(true);
    setTestResults([]);
    
    addResult('🚀 Starting upload system tests...');
    
    try {
      // Test 1: Connexion serveur
      const serverOk = await testServerConnection();
      if (!serverOk) {
        addResult('❌ Server tests failed, stopping...');
        return;
      }
      
      // Test 2: CORS
      await testCORS();
      
      // Test 3: Endpoint upload
      const endpointOk = await testUploadEndpoint();
      if (!endpointOk) {
        addResult('❌ Upload endpoint tests failed, stopping...');
        return;
      }
      
      // Test 4: Upload de fichier
      await testFileUpload();
      
      addResult('🎉 All tests completed!');
      
    } catch (error: any) {
      addResult(`❌ Test suite failed: ${error.message || error}`);
    } finally {
      setIsTesting(false);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">🧪 Test Upload System</h3>
        <div className="space-x-2">
          <button
            onClick={runAllTests}
            disabled={isTesting}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {isTesting ? 'Testing...' : 'Run Tests'}
          </button>
          <button
            onClick={clearResults}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            Clear
          </button>
        </div>
      </div>

      <div className="bg-gray-50 rounded-md p-4 max-h-96 overflow-y-auto">
        {testResults.length === 0 ? (
          <p className="text-gray-500 text-center py-8">
            Click "Run Tests" to start diagnostics
          </p>
        ) : (
          <div className="space-y-1">
            {testResults.map((result, index) => (
              <div key={index} className="text-sm font-mono">
                {result}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 text-sm text-gray-600">
        <p><strong>Tests included:</strong></p>
        <ul className="list-disc list-inside space-y-1 mt-2">
          <li>Server connection</li>
          <li>CORS configuration</li>
          <li>Upload endpoint accessibility</li>
          <li>File upload functionality</li>
        </ul>
      </div>
    </div>
  );
};

export default UploadTester;
