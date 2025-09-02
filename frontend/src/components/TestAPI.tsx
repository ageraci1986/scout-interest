import React, { useState } from 'react';
import projectService from '../services/projectService';
import uploadService from '../services/uploadService';

const TestAPI: React.FC = () => {
  const [testResults, setTestResults] = useState<string[]>([]);
  const [isTesting, setIsTesting] = useState(false);

  const addResult = (message: string) => {
    setTestResults(prev => [...prev, `${new Date().toLocaleTimeString()}: ${message}`]);
  };

  const testProjectsAPI = async () => {
    try {
      addResult('🧪 Testing Projects API...');
      const result = await projectService.getUserProjects('anonymous');
      
      if (result.success && result.projects) {
        addResult(`✅ Projects API: ${result.projects.length} projects loaded`);
        addResult(`📋 First project: ${result.projects[0]?.name || 'N/A'}`);
      } else {
        addResult(`❌ Projects API failed: ${result.error}`);
      }
    } catch (error: any) {
      addResult(`❌ Projects API error: ${error.message}`);
    }
  };

  const testUploadAPI = async () => {
    try {
      addResult('🧪 Testing Upload API...');
      
      // Créer un fichier de test
      const testFile = new File(['75001,75002,75003'], 'test.csv', { type: 'text/csv' });
      
      const result = await uploadService.uploadFile(testFile);
      
      if (result.success) {
        addResult(`✅ Upload API: Project ${result.project_id} created`);
        addResult(`📊 Summary: ${result.summary.total} total, ${result.summary.success} success, ${result.summary.error} errors`);
      } else {
        addResult(`❌ Upload API failed`);
      }
    } catch (error: any) {
      addResult(`❌ Upload API error: ${error.message}`);
    }
  };

  const runAllTests = async () => {
    setIsTesting(true);
    setTestResults([]);
    
    addResult('🚀 Starting API tests...');
    
    await testProjectsAPI();
    await testUploadAPI();
    
    addResult('✅ All tests completed!');
    setIsTesting(false);
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-4">🧪 Test de l'API</h2>
        
        <div className="space-y-4 mb-6">
          <button
            onClick={runAllTests}
            disabled={isTesting}
            className="btn-primary disabled:opacity-50"
          >
            {isTesting ? 'Tests en cours...' : 'Lancer Tous les Tests'}
          </button>
          
          <button
            onClick={testProjectsAPI}
            disabled={isTesting}
            className="btn-secondary disabled:opacity-50"
          >
            Tester Projects API
          </button>
          
          <button
            onClick={testUploadAPI}
            disabled={isTesting}
            className="btn-secondary disabled:opacity-50"
          >
            Tester Upload API
          </button>
          
          <button
            onClick={clearResults}
            className="btn-secondary"
          >
            Effacer les Résultats
          </button>
        </div>

        <div className="border border-gray-200 rounded-lg p-4 bg-gray-50">
          <h3 className="font-medium text-gray-900 mb-2">Résultats des Tests:</h3>
          <div className="space-y-1 max-h-96 overflow-y-auto">
            {testResults.length === 0 ? (
              <p className="text-gray-500 text-sm">Aucun test exécuté</p>
            ) : (
              testResults.map((result, index) => (
                <div key={index} className="text-sm font-mono">
                  {result}
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TestAPI;
