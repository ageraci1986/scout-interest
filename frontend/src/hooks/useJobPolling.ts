import { useState, useEffect, useCallback, useRef } from 'react';
import { toast } from 'react-hot-toast';

interface JobStatus {
  jobId: string;
  projectId: number;
  projectName: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'retrying';
  progress: number;
  totalItems: number;
  processedItems: number;
  failedItems: number;
  currentBatch: number;
  retryCount: number;
  lastError?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
}

interface UseJobPollingProps {
  jobId?: string;
  projectId?: string | number; // Fallback pour polling basé sur projet
  enabled?: boolean;
  onComplete?: (job: JobStatus) => void;
  onError?: (job: JobStatus) => void;
  pollingInterval?: number;
}

interface UseJobPollingReturn {
  job: JobStatus | null;
  loading: boolean;
  error: string | null;
  startPolling: (jobId?: string, fallbackProjectId?: string | number) => void;
  stopPolling: () => void;
}

export const useJobPolling = ({
  jobId: initialJobId,
  projectId,
  enabled = false, // DISABLED TO STOP RESOURCE CONSUMPTION
  onComplete,
  onError,
  pollingInterval = 2000 // 2 seconds
}: UseJobPollingProps = {}): UseJobPollingReturn => {
  const [job, setJob] = useState<JobStatus | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [jobId, setJobId] = useState<string | undefined>(initialJobId);
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastStatusRef = useRef<string | null>(null);

  // Fonction pour chercher les jobs d'un projet quand jobId n'est pas disponible
  const fetchLatestJobForProject = useCallback(async (currentProjectId: string | number) => {
    try {
      setError(null);
      
      // Chercher le job le plus récent pour ce projet
      const response = await fetch(`/api/projects/${currentProjectId}/status`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch project status');
      }

      // Si le projet a un job en cours, retourner ses infos
      if (data.data && data.data.currentJob) {
        return data.data.currentJob;
      }
      
      return null;
    } catch (err) {
      console.error('❌ Project job polling error:', err);
      return null;
    }
  }, []);

  const fetchJobStatus = useCallback(async (currentJobId?: string, fallbackProjectId?: string | number) => {
    try {
      setError(null);
      
      let jobData: JobStatus | null = null;
      
      // Essayer d'abord avec le jobId si disponible
      if (currentJobId) {
        const response = await fetch(`/api/jobs/status/${currentJobId}`);
        const data = await response.json();

        if (response.ok) {
          jobData = data.data as JobStatus;
        }
      }
      
      // Fallback : chercher le job le plus récent du projet
      if (!jobData && fallbackProjectId) {
        console.log(`🔄 Fallback: searching for latest job for project ${fallbackProjectId}`);
        jobData = await fetchLatestJobForProject(fallbackProjectId);
      }
      
      // Si on a trouvé un job
      if (jobData) {
        setJob(jobData);

        // Check for status changes and show notifications
        const currentStatus = jobData.status;
        if (lastStatusRef.current && lastStatusRef.current !== currentStatus) {
          switch (currentStatus) {
            case 'running':
              toast.success('🚀 Meta API processing started');
              break;
            case 'completed':
              toast.success('✅ Meta API processing completed successfully!');
              onComplete?.(jobData);
              break;
            case 'failed':
              toast.error(`❌ Meta API processing failed: ${jobData.lastError || 'Unknown error'}`);
              onError?.(jobData);
              break;
            case 'retrying':
              toast.loading(`🔄 Retrying... (attempt ${jobData.retryCount})`);
              break;
          }
        }
        lastStatusRef.current = currentStatus;

        // Stop polling if job is completed or failed
        if (currentStatus === 'completed' || currentStatus === 'failed') {
          stopPolling();
        }
      } else {
        throw new Error('No job found');
      }

    } catch (err) {
      console.error('❌ Job polling error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch job status');
    }
  }, [onComplete, onError, fetchLatestJobForProject]);

  const startPolling = useCallback((newJobId?: string, fallbackProjectId?: string | number) => {
    console.log(`🔄 Starting job polling for job ${newJobId || 'unknown'} (project fallback: ${fallbackProjectId})`);
    
    if (newJobId) setJobId(newJobId);
    setLoading(true);
    setError(null);
    lastStatusRef.current = null;

    // Clear any existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }

    // Fetch immediately
    fetchJobStatus(newJobId, fallbackProjectId || projectId);

    // Set up polling interval
    intervalRef.current = setInterval(() => {
      fetchJobStatus(newJobId, fallbackProjectId || projectId);
    }, pollingInterval);

  }, [fetchJobStatus, pollingInterval, projectId]);

  const stopPolling = useCallback(() => {
    console.log('⏹️ Stopping job polling');
    
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setLoading(false);
  }, []);

  // DISABLED - Auto-start polling if jobId or projectId is provided and enabled
  useEffect(() => {
    // EMERGENCY: DISABLE ALL POLLING TO STOP RESOURCE CONSUMPTION
    console.log('🚨 Job polling disabled to conserve Vercel resources');
    return () => {
      stopPolling();
    };
  }, [stopPolling]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    job,
    loading,
    error,
    startPolling,
    stopPolling
  };
};