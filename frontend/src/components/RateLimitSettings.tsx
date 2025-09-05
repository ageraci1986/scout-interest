import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import metaService from '../services/metaService';

interface RateLimitConfig {
  currentEnvironment: string;
  availableEnvironments: {
    [key: string]: {
      name: string;
      description: string;
      reachEstimate: {
        callsPerMinute: number;
        callsPerHour: number;
        maxConcurrent: number;
        minTimeBetweenCalls: number;
      };
      search: {
        callsPerMinute: number;
        callsPerHour: number;
        maxConcurrent: number;
        minTimeBetweenCalls: number;
      };
    };
  };
  currentConfig: any;
  batchSizes: any;
  batchDelays: any;
}

interface ProcessingEstimate {
  totalCodes: number;
  environment: string;
  estimation: {
    estimatedMinutes: number;
    estimatedSeconds: number;
    batches: number;
    batchSize: number;
    timePerBatch: number;
  };
  config: any;
}

const RateLimitSettings: React.FC = () => {
  const [config, setConfig] = useState<RateLimitConfig | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('');
  const [estimateCodes, setEstimateCodes] = useState<number>(100);
  const [estimate, setEstimate] = useState<ProcessingEstimate | null>(null);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadConfig();
  }, []);

  const loadConfig = async () => {
    try {
      setLoading(true);
      const response = await metaService.getRateLimitsConfig();
      setConfig(response);
      setSelectedEnvironment(response.currentEnvironment);
    } catch (error) {
      console.error('Error loading rate limits config:', error);
      toast.error('Erreur lors du chargement de la configuration');
    } finally {
      setLoading(false);
    }
  };

  const handleEnvironmentChange = async (environment: string) => {
    try {
      setUpdating(true);
      await metaService.updateRateLimitEnvironment(environment);
      setSelectedEnvironment(environment);
      await loadConfig(); // Recharger la config
      toast.success(`Environnement mis à jour vers ${environment}`);
    } catch (error) {
      console.error('Error updating environment:', error);
      toast.error('Error updating environment');
    } finally {
      setUpdating(false);
    }
  };

  const handleEstimate = async () => {
    try {
      const response = await metaService.estimateProcessingTime(estimateCodes, selectedEnvironment);
      setEstimate(response);
    } catch (error) {
      console.error('Error estimating processing time:', error);
      toast.error('Erreur lors de l\'estimation');
    }
  };

  if (loading) {
    return (
      <div className="card">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      </div>
    );
  }

  if (!config) {
    return (
      <div className="card">
        <p className="text-red-600">Error: Unable to load configuration</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Configuration actuelle */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">⚙️ API Rate Limits Configuration</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Current environment
            </label>
            <select
              value={selectedEnvironment}
              onChange={(e) => handleEnvironmentChange(e.target.value)}
              disabled={updating}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {Object.entries(config.availableEnvironments).map(([key, env]) => (
                <option key={key} value={key}>
                  {env.name} - {env.description}
                </option>
              ))}
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Selected environment
            </label>
            <div className="px-3 py-2 bg-gray-50 border border-gray-300 rounded-md">
              <strong>{config.availableEnvironments[selectedEnvironment]?.name}</strong>
              <p className="text-sm text-gray-600">
                {config.availableEnvironments[selectedEnvironment]?.description}
              </p>
            </div>
          </div>
        </div>

        {/* Détails de la configuration */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h3 className="text-lg font-medium mb-3">📊 Reach Estimate API</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Calls/minute:</span>
                <span className="font-mono">{config.currentConfig.reachEstimate.callsPerMinute}</span>
              </div>
              <div className="flex justify-between">
                <span>Calls/hour:</span>
                <span className="font-mono">{config.currentConfig.reachEstimate.callsPerHour.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Concurrent max:</span>
                <span className="font-mono">{config.currentConfig.reachEstimate.maxConcurrent}</span>
              </div>
              <div className="flex justify-between">
                <span>Min delay (ms):</span>
                <span className="font-mono">{config.currentConfig.reachEstimate.minTimeBetweenCalls}</span>
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-lg font-medium mb-3">🔍 Search API</h3>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Calls/minute:</span>
                <span className="font-mono">{config.currentConfig.search.callsPerMinute}</span>
              </div>
              <div className="flex justify-between">
                <span>Calls/hour:</span>
                <span className="font-mono">{config.currentConfig.search.callsPerHour.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span>Concurrent max:</span>
                <span className="font-mono">{config.currentConfig.search.maxConcurrent}</span>
              </div>
              <div className="flex justify-between">
                <span>Min delay (ms):</span>
                <span className="font-mono">{config.currentConfig.search.minTimeBetweenCalls}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Estimateur de temps de traitement */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">⏱️ Processing Time Estimator</h2>
        
        <div className="flex flex-col sm:flex-row gap-4 mb-4">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Number of postal codes
            </label>
            <input
              type="number"
              value={estimateCodes}
              onChange={(e) => setEstimateCodes(parseInt(e.target.value) || 0)}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          
          <div className="flex items-end">
            <button
              onClick={handleEstimate}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              Estimate
            </button>
          </div>
        </div>

        {estimate && (
          <div className="bg-blue-50 border border-blue-200 rounded-md p-4">
            <h3 className="text-lg font-medium text-blue-900 mb-3">
              Estimation for {estimate.totalCodes} postal codes
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-medium text-blue-800 mb-2">⏱️ Estimated time</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Minutes:</span>
                    <span className="font-mono font-medium">{estimate.estimation.estimatedMinutes}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Seconds:</span>
                    <span className="font-mono font-medium">{estimate.estimation.estimatedSeconds}</span>
                  </div>
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-blue-800 mb-2">📦 Configuration</h4>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span>Batches:</span>
                    <span className="font-mono font-medium">{estimate.estimation.batches}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Batch size:</span>
                    <span className="font-mono font-medium">{estimate.estimation.batchSize}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Time/batch:</span>
                    <span className="font-mono font-medium">{estimate.estimation.timePerBatch}ms</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Informations sur les environnements */}
      <div className="card">
        <h2 className="text-xl font-semibold mb-4">ℹ️ Informations sur les Environnements</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(config.availableEnvironments).map(([key, env]) => (
            <div key={key} className="border border-gray-200 rounded-md p-4">
              <h3 className="font-medium text-lg mb-2">{env.name}</h3>
              <p className="text-sm text-gray-600 mb-3">{env.description}</p>
              
              <div className="space-y-2 text-xs">
                <div className="flex justify-between">
                  <span>Reach/min:</span>
                  <span className="font-mono">{env.reachEstimate.callsPerMinute}</span>
                </div>
                <div className="flex justify-between">
                  <span>Search/min:</span>
                  <span className="font-mono">{env.search.callsPerMinute}</span>
                </div>
                <div className="flex justify-between">
                  <span>Concurrent:</span>
                  <span className="font-mono">{env.reachEstimate.maxConcurrent}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default RateLimitSettings;


