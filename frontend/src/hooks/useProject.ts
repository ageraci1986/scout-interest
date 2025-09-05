import { useState, useEffect, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import projectService from '../services/projectService';

export interface ProjectData {
  id: string;
  name: string;
  status: string;
  total_postal_codes: number;
  processed_postal_codes: number;
  error_postal_codes: number;
  processed_at?: string;
  results?: Array<{
    postal_code: string;
    success: boolean;
    audience_estimate: number;
    targeting_estimate: number;
    error?: string;
  }>;
}

interface UseProjectReturn {
  project: ProjectData | null;
  loading: boolean;
  error: string | null;
  isProcessing: boolean;
  progress: number;
  refetch: () => void;
  exportResults: (format: string) => Promise<void>;
}

export const useProject = (projectId: string | null): UseProjectReturn => {
  const [project, setProject] = useState<ProjectData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  
  const navigate = useNavigate();
  const pollingRef = useRef<NodeJS.Timeout | null>(null);
  const mountedRef = useRef(true);

  // Cleanup on unmount
  useEffect(() => {
    mountedRef.current = true;
    return () => {
      mountedRef.current = false;
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, []);

  const fetchProject = useCallback(async () => {
    if (!projectId || !mountedRef.current) return;

    setLoading(true);
    setError(null);

    try {
      const response = await projectService.getProject(projectId);
      
      if (!mountedRef.current) return;

      if (response.success && response.project) {
        // Transformer les résultats pour le frontend
        const transformedProject: any = { ...response.project };
        
        if (transformedProject.results && Array.isArray(transformedProject.results)) {
          transformedProject.results = transformedProject.results.map((result: any) => {
            // Parser les estimations JSON si elles sont des chaînes
            let postalCodeOnlyEstimate = result.postal_code_only_estimate;
            let postalCodeWithTargetingEstimate = result.postal_code_with_targeting_estimate;
            
            if (typeof postalCodeOnlyEstimate === 'string') {
              try {
                postalCodeOnlyEstimate = JSON.parse(postalCodeOnlyEstimate);
              } catch (e) {
                console.warn('Failed to parse postal_code_only_estimate:', e);
                postalCodeOnlyEstimate = { audience_size: 0 };
              }
            }
            
            if (typeof postalCodeWithTargetingEstimate === 'string') {
              try {
                postalCodeWithTargetingEstimate = JSON.parse(postalCodeWithTargetingEstimate);
              } catch (e) {
                console.warn('Failed to parse postal_code_with_targeting_estimate:', e);
                postalCodeWithTargetingEstimate = { audience_size: 0 };
              }
            }
            
            return {
              postal_code: result.postal_code,
              success: result.success,
              audience_estimate: postalCodeOnlyEstimate?.audience_size || 0,
              targeting_estimate: postalCodeWithTargetingEstimate?.audience_size || 0,
              error: result.error_message || undefined
            };
          });
        }
        
        setProject(transformedProject);
        
        // Logique corrigée pour déterminer si le projet est en cours de traitement
        const isStillProcessing = 
          transformedProject.status === 'processing' || 
          transformedProject.status === 'pending_targeting' ||
          (transformedProject.processed_postal_codes < transformedProject.total_postal_codes && 
           transformedProject.status !== 'completed');
        
        setIsProcessing(isStillProcessing);
        
        // Log pour debug
        console.log(`🔍 Project status: ${transformedProject.status}, processed: ${transformedProject.processed_postal_codes}/${transformedProject.total_postal_codes}, isProcessing: ${isStillProcessing}`);
      } else {
        throw new Error(response.error || 'Failed to fetch project');
      }
    } catch (err) {
      if (!mountedRef.current) return;
      
      const errorMessage = err instanceof Error ? err.message : 'Unknown error occurred';
      setError(errorMessage);
      toast.error(`Error loading project: ${errorMessage}`);
      
      // Redirect to home if project not found
      if (errorMessage.includes('not found') || errorMessage.includes('404')) {
        navigate('/');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [projectId, navigate]);

  // Setup polling for processing projects
  useEffect(() => {
    if (!projectId || !isProcessing) {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
      return;
    }

    // Initial fetch
    fetchProject();

    // Poll every 3 seconds while processing
    pollingRef.current = setInterval(() => {
      if (mountedRef.current && isProcessing) {
        console.log('🔄 Polling: fetching project data...');
        fetchProject();
      } else {
        console.log('🛑 Polling: project not processing, clearing interval');
        if (pollingRef.current) {
          clearInterval(pollingRef.current);
          pollingRef.current = null;
        }
      }
    }, 3000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
        pollingRef.current = null;
      }
    };
  }, [projectId, isProcessing, fetchProject]);

  // Initial fetch when projectId changes
  useEffect(() => {
    fetchProject();
  }, [fetchProject]);

  // Calculate progress
  const progress = project ? 
    Math.round((project.processed_postal_codes / project.total_postal_codes) * 100) : 0;

  const exportResults = useCallback(async (format: string) => {
    if (!project) return;

    try {
      toast.loading(`Exporting results as ${format.toUpperCase()}...`);
      
      // Temporaire : export simple via download
      const csvData = project.results?.map(r => ({
        postal_code: r.postal_code,
        success: r.success,
        audience_estimate: r.audience_estimate,
        error: r.error || ''
      }));
      
      if (csvData && csvData.length > 0) {
        const csvContent = [
          'postal_code,success,audience_estimate,error',
          ...csvData.map(row => `${row.postal_code},${row.success},${row.audience_estimate},"${row.error}"`)
        ].join('\n');
        
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.name}_results.${format}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
      
      toast.dismiss();
      toast.success(`Results exported successfully as ${format.toUpperCase()}`);
    } catch (err) {
      toast.dismiss();
      const errorMessage = err instanceof Error ? err.message : 'Export failed';
      toast.error(`Export failed: ${errorMessage}`);
    }
  }, [project]);

  const refetch = useCallback(() => {
    fetchProject();
  }, [fetchProject]);

  return {
    project,
    loading,
    error,
    isProcessing,
    progress,
    refetch,
    exportResults
  };
};

export default useProject;