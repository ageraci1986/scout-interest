import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeftIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';

interface PostalCodeResult {
  postal_code: string;
  geo_audience: number | null;
  targeting_audience: number | null;
  status: 'pending' | 'processing' | 'completed' | 'error';
}

interface Project {
  id: number;
  name: string;
  postal_codes: string[];
  results: PostalCodeResult[];
  status: string;
  created_at: string;
  targeting_spec?: any;
}

const ResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  
  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const projectId = params.projectId || location.state?.projectId;

  useEffect(() => {
    if (!projectId) {
      toast.error('No project selected');
      navigate('/');
      return;
    }

    fetchProject();
  }, [projectId]);

  const fetchProject = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/projects/${projectId}`);
      
      if (!response.ok) {
        throw new Error(`Failed to fetch project: ${response.statusText}`);
      }
      
      const data = await response.json();
      setProject(data);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load project');
      console.error('Error fetching project:', err);
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (!project || !project.results || project.results.length === 0) {
      toast.error('No data to export');
      return;
    }

    const headers = ['Postal Code', 'Geo Audience', 'Targeting Audience', 'Status'];
    const csvContent = [
      headers.join(','),
      ...project.results.map(result => [
        result.postal_code,
        result.geo_audience || '',
        result.targeting_audience || '',
        result.status
      ].join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${project.name}_results.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('CSV exported successfully!');
  };

  const exportToXLSX = () => {
    if (!project || !project.results || project.results.length === 0) {
      toast.error('No data to export');
      return;
    }

    // Simple XLSX export using basic XML structure
    const headers = ['Postal Code', 'Geo Audience', 'Targeting Audience', 'Status'];
    const rows = project.results.map(result => [
      result.postal_code,
      result.geo_audience || '',
      result.targeting_audience || '',
      result.status
    ]);

    // Create a simple table for Excel
    const xmlContent = `<?xml version="1.0"?>
<Workbook xmlns="urn:schemas-microsoft-com:office:spreadsheet" xmlns:ss="urn:schemas-microsoft-com:office:spreadsheet">
<Worksheet ss:Name="Results">
<Table>
<Row>${headers.map(h => `<Cell><Data ss:Type="String">${h}</Data></Cell>`).join('')}</Row>
${rows.map(row => `<Row>${row.map(cell => `<Cell><Data ss:Type="String">${cell}</Data></Cell>`).join('')}</Row>`).join('')}
</Table>
</Worksheet>
</Workbook>`;

    const blob = new Blob([xmlContent], { type: 'application/vnd.ms-excel' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${project.name}_results.xlsx`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('XLSX exported successfully!');
  };

  const handleStartAnalysis = async () => {
    if (!project) return;
    
    try {
      toast.loading('Starting Meta API analysis...', { id: 'analysis' });
      
      const response = await fetch('/api/meta/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          projectId: project.id,
          postalCodes: project.postal_codes,
          targeting: location.state?.targeting || project.targeting_spec || {}
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to start analysis');
      }
      
      toast.success('Analysis started!', { id: 'analysis' });
      
      // Refresh data every 3 seconds while processing
      const interval = setInterval(fetchProject, 3000);
      
      // Clear interval after 2 minutes to avoid infinite polling
      setTimeout(() => clearInterval(interval), 120000);
      
    } catch (err) {
      toast.error('Failed to start analysis', { id: 'analysis' });
      console.error('Error starting analysis:', err);
    }
  };

  if (loading && !project) {
    return <LoadingSpinner size="lg" message="Loading results..." fullScreen />;
  }

  if (error && !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Error</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={() => navigate('/')} variant="primary">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Project Not Found</h2>
          <Button onClick={() => navigate('/')} variant="primary">
            Back to Home
          </Button>
        </div>
      </div>
    );
  }

  const hasResults = project.results && project.results.length > 0;
  const pendingResults = project.results?.filter(r => r.status === 'pending' || r.status === 'processing').length || 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              onClick={() => navigate('/')}
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Back to Home</span>
            </Button>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button onClick={fetchProject} variant="secondary" size="sm">
              Refresh
            </Button>
            
            {hasResults && (
              <div className="flex items-center space-x-2">
                <Button onClick={exportToCSV} variant="secondary" size="sm">
                  <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                  CSV
                </Button>
                <Button onClick={exportToXLSX} variant="secondary" size="sm">
                  <ArrowDownTrayIcon className="w-4 h-4 mr-1" />
                  XLSX
                </Button>
              </div>
            )}
            
            {(!hasResults || pendingResults > 0) && (
              <Button onClick={handleStartAnalysis} variant="primary" size="sm">
                {hasResults ? 'Continue Analysis' : 'Start Analysis'}
              </Button>
            )}
          </div>
        </div>

        {/* Status */}
        {pendingResults > 0 && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
            <div className="flex items-center">
              <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse mr-3"></div>
              <span className="text-yellow-800">
                Processing {pendingResults} postal codes...
              </span>
            </div>
          </div>
        )}

        {/* Results Table */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-medium text-gray-900">
              Postal Codes Analysis ({project.postal_codes?.length || 0} codes)
            </h2>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Postal Code
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Geo Audience
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Targeting Audience
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {project.postal_codes?.map((postalCode, index) => {
                  const result = project.results?.find(r => r.postal_code === postalCode);
                  
                  return (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {postalCode}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {result?.geo_audience !== null && result?.geo_audience !== undefined 
                          ? result.geo_audience.toLocaleString() 
                          : '-'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {result?.targeting_audience !== null && result?.targeting_audience !== undefined 
                          ? result.targeting_audience.toLocaleString() 
                          : '-'
                        }
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {result ? (
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            result.status === 'completed' 
                              ? 'bg-green-100 text-green-800'
                              : result.status === 'processing'
                              ? 'bg-yellow-100 text-yellow-800'
                              : result.status === 'error'
                              ? 'bg-red-100 text-red-800'
                              : 'bg-gray-100 text-gray-800'
                          }`}>
                            {result.status}
                          </span>
                        ) : (
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 text-gray-800">
                            pending
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Empty State */}
        {!project.postal_codes || project.postal_codes.length === 0 && (
          <div className="text-center py-12">
            <p className="text-gray-500">No postal codes found in this project.</p>
            <Button 
              onClick={() => navigate('/upload')} 
              variant="primary" 
              className="mt-4"
            >
              Upload File
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsPage;