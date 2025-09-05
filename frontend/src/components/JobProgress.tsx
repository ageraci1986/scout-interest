import React from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, ArrowPathIcon } from '@heroicons/react/24/outline';

interface JobProgressProps {
  job: {
    jobId: string;
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
  } | null;
  loading?: boolean;
}

const JobProgress: React.FC<JobProgressProps> = ({ job, loading = false }) => {
  if (!job && !loading) return null;

  const getStatusIcon = () => {
    if (!job) return <ArrowPathIcon className="h-5 w-5 animate-spin text-blue-500" />;
    
    switch (job.status) {
      case 'pending':
        return <ArrowPathIcon className="h-5 w-5 text-gray-400" />;
      case 'running':
        return <ArrowPathIcon className="h-5 w-5 animate-spin text-blue-500" />;
      case 'completed':
        return <CheckCircleIcon className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />;
      case 'retrying':
        return <ArrowPathIcon className="h-5 w-5 animate-spin text-yellow-500" />;
      default:
        return <ArrowPathIcon className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusMessage = () => {
    if (!job) return 'Loading job status...';
    
    switch (job.status) {
      case 'pending':
        return 'Waiting to start processing...';
      case 'running':
        return `Processing batch ${job.currentBatch + 1}... (${job.processedItems}/${job.totalItems} postal codes)`;
      case 'completed':
        return `All ${job.totalItems} postal codes processed successfully!`;
      case 'failed':
        return `Processing failed: ${job.lastError || 'Unknown error'}`;
      case 'retrying':
        return `Retrying... (attempt ${job.retryCount})`;
      default:
        return 'Unknown status';
    }
  };

  const getStatusColor = () => {
    if (!job) return 'bg-blue-50 border-blue-200';
    
    switch (job.status) {
      case 'pending':
        return 'bg-gray-50 border-gray-200';
      case 'running':
        return 'bg-blue-50 border-blue-200';
      case 'completed':
        return 'bg-green-50 border-green-200';
      case 'failed':
        return 'bg-red-50 border-red-200';
      case 'retrying':
        return 'bg-yellow-50 border-yellow-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  return (
    <div className={`rounded-lg border-2 p-4 ${getStatusColor()}`}>
      <div className="flex items-center space-x-3">
        {getStatusIcon()}
        <div className="flex-1">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium text-gray-900">
              Meta API Processing
            </p>
            {job && (
              <span className="text-xs text-gray-500">
                Job ID: {job.jobId.slice(0, 8)}...
              </span>
            )}
          </div>
          <p className="text-sm text-gray-600 mt-1">
            {getStatusMessage()}
          </p>
          
          {/* Progress bar */}
          {job && job.totalItems > 0 && (
            <div className="mt-3">
              <div className="flex justify-between text-xs text-gray-500 mb-1">
                <span>Progress</span>
                <span>{job.progress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    job.status === 'completed' ? 'bg-green-500' :
                    job.status === 'failed' ? 'bg-red-500' :
                    job.status === 'retrying' ? 'bg-yellow-500' :
                    'bg-blue-500'
                  }`}
                  style={{ width: `${job.progress}%` }}
                ></div>
              </div>
              
              {/* Stats */}
              <div className="flex justify-between text-xs text-gray-500 mt-2">
                <span>Processed: {job.processedItems}</span>
                <span>Total: {job.totalItems}</span>
                {job.failedItems > 0 && (
                  <span className="text-red-600">Failed: {job.failedItems}</span>
                )}
              </div>
            </div>
          )}
          
          {/* Timing info */}
          {job && (job.startedAt || job.completedAt) && (
            <div className="mt-2 text-xs text-gray-500">
              {job.startedAt && (
                <div>Started: {new Date(job.startedAt).toLocaleTimeString()}</div>
              )}
              {job.completedAt && (
                <div>Completed: {new Date(job.completedAt).toLocaleTimeString()}</div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default JobProgress;