import React from 'react';
import { ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import Button from '../ui/Button';

interface ExportControlsProps {
  onExport: (format: string) => Promise<void>;
  hasResults: boolean;
  loading?: boolean;
}

export const ExportControls: React.FC<ExportControlsProps> = ({
  onExport,
  hasResults,
  loading = false
}) => {
  const exportFormats = [
    { id: 'csv', label: 'CSV', extension: '.csv' },
    { id: 'excel', label: 'Excel', extension: '.xlsx' },
    { id: 'json', label: 'JSON', extension: '.json' }
  ];

  const handleExport = async (format: string) => {
    try {
      await onExport(format);
    } catch (error) {
      console.error(`Export failed:`, error);
    }
  };

  if (!hasResults) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
      <div className="flex items-center space-x-2 mb-4">
        <ArrowDownTrayIcon className="w-5 h-5 text-gray-500" />
        <h3 className="text-lg font-medium text-gray-900">Export Results</h3>
      </div>
      
      <p className="text-sm text-gray-600 mb-4">
        Download your results in different formats for further analysis.
      </p>

      <div className="flex flex-wrap gap-3">
        {exportFormats.map((format) => (
          <Button
            key={format.id}
            variant="secondary"
            size="sm"
            loading={loading}
            onClick={() => handleExport(format.id)}
            className="flex items-center space-x-2"
          >
            <ArrowDownTrayIcon className="w-4 h-4" />
            <span>
              Export {format.label}
              <span className="text-xs text-gray-500 ml-1">
                ({format.extension})
              </span>
            </span>
          </Button>
        ))}
      </div>

      <div className="mt-4 p-3 bg-blue-50 rounded-md">
        <div className="flex">
          <div className="ml-3">
            <h4 className="text-sm font-medium text-blue-800">
              Export Information
            </h4>
            <div className="mt-1 text-sm text-blue-700">
              <ul className="list-disc list-inside space-y-1">
                <li>CSV: Comma-separated values, compatible with Excel and most data tools</li>
                <li>Excel: Native Excel format with formatting and multiple sheets</li>
                <li>JSON: Raw data format for programmatic use</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExportControls;