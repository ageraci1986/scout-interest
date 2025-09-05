import React, { useEffect } from 'react';
import { useNavigate, useLocation, useParams } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import { ArrowLeftIcon } from '@heroicons/react/24/outline';

// Hooks and stores
import { useProject } from '../hooks/useProject';
import { useJobPolling } from '../hooks/useJobPolling';
import { useAppStore } from '../store/appStore';

// Components
import LoadingSpinner from '../components/ui/LoadingSpinner';
import Button from '../components/ui/Button';
import JobProgress from '../components/JobProgress';
import ResultsHeader from '../components/ResultsComponents/ResultsHeader';
import ResultsTable from '../components/ResultsComponents/ResultsTable';
import ExportControls from '../components/ResultsComponents/ExportControls';

const ResultsPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const params = useParams();
  
  // Get project ID from URL params, location state, or store
  const urlProjectId = params.projectId;
  const stateProjectId = location.state?.projectId;
  const { currentProject, setCurrentProject } = useAppStore();
  
  // PRIORITÉ CHANGÉE: URL d'abord, puis state, puis store (pour éviter le cache)
  const projectId = urlProjectId || stateProjectId || currentProject?.id;

  // Get job ID from location state (passed from TargetingPage after job creation)
  const jobId = location.state?.jobId;

  // Debug logs
  console.log('🔍 [RESULTS] ResultsPage - Project ID sources:', {
    urlProjectId,
    stateProjectId,
    currentProjectId: currentProject?.id,
    finalProjectId: projectId,
    jobId,
    locationState: location.state,
    params
  });
  
  console.log('🔍 [RESULTS] Full location object:', location);
  console.log('🔍 [RESULTS] URL params:', params);

  // Force clear du currentProject si on a un ID différent dans l'URL
  useEffect(() => {
    if (urlProjectId && currentProject && currentProject.id.toString() !== urlProjectId) {
      console.log('🔄 Clearing cached project, URL has different ID');
      setCurrentProject(null);
    }
  }, [urlProjectId, currentProject, setCurrentProject]);

  // Use optimized project hook
  const { 
    project, 
    loading, 
    error, 
    isProcessing, 
    progress, 
    refetch,
    exportResults 
  } = useProject(projectId);

  // Use job polling hook for real-time updates
  const { 
    job, 
    loading: jobLoading, 
    error: jobError,
    startPolling: startJobPolling 
  } = useJobPolling({
    jobId,
    projectId, // Fallback au cas où jobId n'est pas disponible
    enabled: !!(jobId || projectId),
    onComplete: () => {
      console.log('✅ Job completed, refreshing project data');
      refetch(); // Refresh project data when job completes
    },
    onError: (failedJob) => {
      console.error('❌ Job failed:', failedJob.lastError);
    }
  });

  // Update store when project changes
  useEffect(() => {
    if (project && project !== currentProject) {
      setCurrentProject(project);
    }
  }, [project, currentProject, setCurrentProject]);

  // Redirect if no project ID
  useEffect(() => {
    if (!projectId && !loading) {
      toast.error('No project selected');
      navigate('/');
    }
  }, [projectId, loading, navigate]);

  const handleBackToProjects = () => {
    navigate('/projects');
  };

  const handleBackToTargeting = () => {
    navigate('/targeting', { 
      state: { 
        projectId,
        editMode: true 
      } 
    });
  };

  const handleRefresh = async () => {
    console.log('🔄 [REFRESH] Button clicked, starting refresh...');
    
    // 1. Rafraîchir les données du projet
    refetch();
    
    // 2. Toujours déclencher le worker (pour débug)
    try {
      if (project && projectId) {
        console.log('🔍 [REFRESH] Project data:', {
          projectId,
          results: project.results?.length || 0,
          incompleteResults: project.results?.filter(r => r.audience_estimate === 0 || r.targeting_estimate === 0).length || 0
        });
        
        const hasIncompleteResults = project.results?.some(result => 
          result.audience_estimate === 0 || result.targeting_estimate === 0
        );
        
        console.log('🔍 [REFRESH] hasIncompleteResults:', hasIncompleteResults);
        
        if (hasIncompleteResults) {
          console.log('🔄 [REFRESH] Triggering worker due to incomplete results...');
          toast.loading('🚀 Triggering Meta API processing...', { id: 'worker-trigger' });
          
          const response = await fetch('/api/jobs/trigger', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          
          console.log('🔍 [REFRESH] Trigger response:', response.status, response.ok);
          
          if (response.ok) {
            const result = await response.json();
            console.log('✅ [REFRESH] Trigger successful:', result);
            toast.success(`✅ Meta API processing triggered! (${result.pendingJobs} jobs)`, { id: 'worker-trigger' });
            
            // Relancer le polling
            if (jobId || projectId) {
              console.log('🔄 [REFRESH] Restarting polling...');
              startJobPolling(jobId, projectId);
            }
          } else {
            const errorText = await response.text();
            console.error('❌ [REFRESH] Trigger failed:', errorText);
            toast.error('❌ Failed to trigger processing', { id: 'worker-trigger' });
          }
        } else {
          console.log('✅ [REFRESH] No incomplete results, just refreshing');
          toast.success('✅ Results refreshed - all data complete');
        }
      } else {
        console.log('⚠️ [REFRESH] No project data available');
        toast.success('📊 Results refreshed');
      }
    } catch (error) {
      console.error('❌ [REFRESH] Error during refresh:', error);
      toast.error('❌ Error during refresh: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  };

  // Show loading state
  if (loading && !project) {
    return (
      <LoadingSpinner 
        size="lg" 
        message="Loading project results..." 
        fullScreen 
      />
    );
  }

  // Show error state
  if (error && !project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Project</h2>
          <p className="text-gray-600 mb-4">{error}</p>
          <div className="space-x-3">
            <Button onClick={handleRefresh} variant="primary">
              Try Again
            </Button>
            <Button onClick={handleBackToProjects} variant="secondary">
              Back to Projects
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Project Not Found</h2>
          <p className="text-gray-600 mb-4">The requested project could not be found.</p>
          <Button onClick={handleBackToProjects} variant="primary">
            Back to Projects
          </Button>
        </div>
      </div>
    );
  }

  const hasResults = project.results && project.results.length > 0;

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-4">
            <Button
              onClick={handleBackToProjects}
              variant="ghost"
              size="sm"
              className="flex items-center space-x-2"
            >
              <ArrowLeftIcon className="w-4 h-4" />
              <span>Back to Projects</span>
            </Button>
          </div>

          <div className="flex items-center space-x-3">
            {isProcessing && (
              <div className="flex items-center space-x-2 text-sm text-yellow-600">
                <div className="w-2 h-2 bg-yellow-500 rounded-full animate-pulse"></div>
                <span>Processing...</span>
              </div>
            )}
            
            <Button
              onClick={handleRefresh}
              variant="secondary"
              size="sm"
              loading={loading}
            >
              Refresh
            </Button>

            {!isProcessing && (
              <Button
                onClick={handleBackToTargeting}
                variant="primary"
                size="sm"
              >
                Edit Targeting
              </Button>
            )}
          </div>
        </div>

        {/* Job Progress Indicator */}
        {job && (
          <div className="mb-6">
            <JobProgress job={job} loading={jobLoading} />
          </div>
        )}

        {/* Results Header */}
        <ResultsHeader 
          project={project} 
          progress={progress} 
          isProcessing={isProcessing} 
        />

        {/* Main Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Results Table - Takes up 2/3 of the width on large screens */}
          <div className="lg:col-span-2">
            <ResultsTable 
              results={project.results || []} 
              loading={loading} 
            />
          </div>

          {/* Side Panel */}
          <div className="space-y-6">
            {/* Export Controls */}
            <ExportControls
              onExport={exportResults}
              hasResults={hasResults || false}
              loading={loading}
            />

            {/* Project Info */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Project Information</h3>
              <dl className="space-y-3">
                <div>
                  <dt className="text-sm font-medium text-gray-500">Status</dt>
                  <dd className="text-sm text-gray-900 capitalize">{project.status}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Total Postal Codes</dt>
                  <dd className="text-sm text-gray-900">{project.total_postal_codes.toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Processed</dt>
                  <dd className="text-sm text-gray-900">{project.processed_postal_codes.toLocaleString()}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-gray-500">Errors</dt>
                  <dd className="text-sm text-gray-900">{project.error_postal_codes.toLocaleString()}</dd>
                </div>
                {project.processed_at && (
                  <div>
                    <dt className="text-sm font-medium text-gray-500">Last Updated</dt>
                    <dd className="text-sm text-gray-900">
                      {new Date(project.processed_at).toLocaleString()}
                    </dd>
                  </div>
                )}
              </dl>
            </div>

            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-3">
                <Button
                  onClick={() => navigate('/upload')}
                  variant="secondary"
                  size="sm"
                  className="w-full justify-center"
                >
                  Upload New File
                </Button>
                <Button
                  onClick={() => navigate('/targeting')}
                  variant="secondary"
                  size="sm"
                  className="w-full justify-center"
                >
                  Create New Analysis
                </Button>
                {hasResults && (
                  <Button
                    onClick={() => exportResults('csv')}
                    variant="primary"
                    size="sm"
                    className="w-full justify-center"
                  >
                    Quick Export CSV
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Processing Status Banner */}
        {isProcessing && (
          <div className="fixed bottom-4 right-4 bg-white border border-gray-200 rounded-lg shadow-lg p-4 max-w-sm">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <LoadingSpinner size="sm" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-900">Processing postal codes...</p>
                <p className="text-sm text-gray-500">
                  {progress}% complete ({project.processed_postal_codes}/{project.total_postal_codes})
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResultsPage;