import React from 'react';
import { CheckCircleIcon, ExclamationTriangleIcon, ClockIcon } from '@heroicons/react/24/outline';
import { ProjectData } from '../../hooks/useProject';

interface ResultsHeaderProps {
  project: ProjectData;
  progress: number;
  isProcessing: boolean;
}

export const ResultsHeader: React.FC<ResultsHeaderProps> = ({
  project,
  progress,
  isProcessing
}) => {
  const getStatusIcon = () => {
    if (isProcessing) {
      return <ClockIcon className="w-6 h-6 text-yellow-500 animate-pulse" />;
    }
    if (project.error_postal_codes > 0) {
      return <ExclamationTriangleIcon className="w-6 h-6 text-orange-500" />;
    }
    return <CheckCircleIcon className="w-6 h-6 text-green-500" />;
  };

  const getStatusText = () => {
    if (isProcessing) return 'Processing...';
    if (project.error_postal_codes > 0) return 'Completed with errors';
    return 'Completed successfully';
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mb-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{project.name}</h1>
            <p className="text-sm text-gray-600 mt-1">{getStatusText()}</p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold text-blue-600">{progress}%</div>
          <div className="text-sm text-gray-500">Complete</div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="mt-6">
        <div className="flex justify-between text-sm text-gray-600 mb-2">
          <span>Progress</span>
          <span>{project.processed_postal_codes} of {project.total_postal_codes}</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div 
            className={`h-2 rounded-full transition-all duration-300 ${
              isProcessing ? 'bg-blue-500' : 'bg-green-500'
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mt-6">
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {project.processed_postal_codes - project.error_postal_codes}
          </div>
          <div className="text-sm text-gray-500">Successful</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {project.error_postal_codes}
          </div>
          <div className="text-sm text-gray-500">Errors</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-600">
            {project.total_postal_codes - project.processed_postal_codes}
          </div>
          <div className="text-sm text-gray-500">Pending</div>
        </div>
      </div>
    </div>
  );
};

export default ResultsHeader;