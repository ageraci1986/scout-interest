import React from 'react';

interface ProcessingDetails {
  currentBatch: number;
  totalBatches: number;
  batchSize: number;
  currentPostalCode: string;
  estimatedTimeRemaining: string;
  rateLimitInfo: {
    callsThisMinute: number;
    callsThisHour: number;
    maxCallsPerMinute: number;
    maxCallsPerHour: number;
    currentTier: string;
    scoreUsed: number;
    maxScore: number;
  };
  performance: {
    averageTimePerCode: number;
    codesPerMinute: number;
    startTime: number | null;
    elapsedTime: string;
  };
}

interface ProcessingProgressProps {
  progress: number;
  stats: {
    total: number;
    completed: number;
    success: number;
    errors: number;
  };
  processingDetails: ProcessingDetails;
  isProcessing: boolean;
}

const ProcessingProgress: React.FC<ProcessingProgressProps> = ({
  progress,
  stats,
  processingDetails,
  isProcessing
}) => {
  const formatTime = (seconds: number): string => {
    if (seconds < 60) return `${Math.round(seconds)}s`;
    if (seconds < 3600) return `${Math.round(seconds / 60)}m ${Math.round(seconds % 60)}s`;
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.round((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  const getRateLimitColor = (used: number, max: number): string => {
    const percentage = (used / max) * 100;
    if (percentage < 50) return 'text-green-600';
    if (percentage < 80) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getProgressColor = (progress: number): string => {
    if (progress < 30) return 'bg-blue-600';
    if (progress < 70) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  return (
    <div className="space-y-6">
      {/* Barre de progression principale */}
      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">📊 Progression du Traitement</h3>
          <div className="flex items-center space-x-2">
            <div className="text-sm text-gray-600">
              {stats.completed}/{stats.total} codes traités
            </div>
            {isProcessing && (
              <div className="flex items-center space-x-1">
                <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                <span className="text-xs text-green-600 font-medium">En cours</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="mb-4">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>{Math.round(progress)}%</span>
            <span>{processingDetails.estimatedTimeRemaining}</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all duration-500 ${getProgressColor(progress)}`}
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Statistiques rapides */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
            <div className="text-sm text-gray-600">Total</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold text-green-600 ${isProcessing ? 'animate-pulse' : ''}`}>
              {stats.success}
            </div>
            <div className="text-sm text-gray-600">Succès</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold text-red-600 ${isProcessing ? 'animate-pulse' : ''}`}>
              {stats.errors}
            </div>
            <div className="text-sm text-gray-600">Erreurs</div>
          </div>
          <div className="text-center">
            <div className={`text-2xl font-bold text-yellow-600 ${isProcessing ? 'animate-pulse' : ''}`}>
              {stats.completed}
            </div>
            <div className="text-sm text-gray-600">Terminés</div>
          </div>
        </div>
      </div>

              {/* Détails du traitement en cours */}
        {isProcessing && (
          <div className="card">
            <h3 className="text-lg font-semibold mb-4">⚡ Traitement en Cours</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Informations sur le batch */}
              <div>
                <h4 className="font-medium text-gray-800 mb-3">📦 Batch Processing</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Batch actuel:</span>
                    <span className="font-mono">{processingDetails.currentBatch}/{processingDetails.totalBatches}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Taille batch:</span>
                    <span className="font-mono">{processingDetails.batchSize} codes</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Code en cours:</span>
                    <span className="font-mono text-blue-600">{processingDetails.currentPostalCode || '...'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Progression:</span>
                    <span className="font-mono text-green-600">{Math.round(progress)}%</span>
                  </div>
                </div>
              </div>

              {/* Performance */}
              <div>
                <h4 className="font-medium text-gray-800 mb-3">🚀 Performance</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span>Temps moyen/code:</span>
                    <span className="font-mono">{processingDetails.performance.averageTimePerCode.toFixed(1)}s</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Codes/minute:</span>
                    <span className="font-mono">{processingDetails.performance.codesPerMinute.toFixed(1)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Temps écoulé:</span>
                    <span className="font-mono">{processingDetails.performance.elapsedTime}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Temps restant:</span>
                    <span className="font-mono text-orange-600">{processingDetails.estimatedTimeRemaining}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Barre de progression animée */}
            <div className="mt-4">
              <div className="flex justify-between text-sm text-gray-600 mb-2">
                <span>Progression en temps réel</span>
                <span>{Math.round(progress)}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="h-2 bg-gradient-to-r from-blue-500 to-green-500 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
          </div>
        )}

      {/* Informations sur les limitations Meta API */}
      <div className="card">
        <h3 className="text-lg font-semibold mb-4">🔒 Limitations Meta API</h3>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Tier et Score */}
          <div>
            <h4 className="font-medium text-gray-800 mb-3">📋 Tier & Score</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span>Tier actuel:</span>
                <span className={`font-medium ${
                  processingDetails.rateLimitInfo.currentTier === 'standard' ? 'text-green-600' : 'text-yellow-600'
                }`}>
                  {processingDetails.rateLimitInfo.currentTier === 'standard' ? 'Standard' : 'Development'}
                </span>
              </div>
              <div className="flex justify-between">
                <span>Score utilisé:</span>
                <span className={`font-mono ${getRateLimitColor(
                  processingDetails.rateLimitInfo.scoreUsed,
                  processingDetails.rateLimitInfo.maxScore
                )}`}>
                  {processingDetails.rateLimitInfo.scoreUsed}/{processingDetails.rateLimitInfo.maxScore}
                </span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    getRateLimitColor(processingDetails.rateLimitInfo.scoreUsed, processingDetails.rateLimitInfo.maxScore).replace('text-', 'bg-')
                  }`}
                  style={{ width: `${(processingDetails.rateLimitInfo.scoreUsed / processingDetails.rateLimitInfo.maxScore) * 100}%` }}
                />
              </div>
            </div>
          </div>

          {/* Limites par minute/heure */}
          <div>
            <h4 className="font-medium text-gray-800 mb-3">⏱️ Limites Temporelles</h4>
            <div className="space-y-3">
              {/* Par minute */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Par minute:</span>
                  <span className={`font-mono ${getRateLimitColor(
                    processingDetails.rateLimitInfo.callsThisMinute,
                    processingDetails.rateLimitInfo.maxCallsPerMinute
                  )}`}>
                    {processingDetails.rateLimitInfo.callsThisMinute}/{processingDetails.rateLimitInfo.maxCallsPerMinute}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      getRateLimitColor(processingDetails.rateLimitInfo.callsThisMinute, processingDetails.rateLimitInfo.maxCallsPerMinute).replace('text-', 'bg-')
                    }`}
                    style={{ width: `${(processingDetails.rateLimitInfo.callsThisMinute / processingDetails.rateLimitInfo.maxCallsPerMinute) * 100}%` }}
                  />
                </div>
              </div>

              {/* Par heure */}
              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Par heure:</span>
                  <span className={`font-mono ${getRateLimitColor(
                    processingDetails.rateLimitInfo.callsThisHour,
                    processingDetails.rateLimitInfo.maxCallsPerHour
                  )}`}>
                    {processingDetails.rateLimitInfo.callsThisHour.toLocaleString()}/{processingDetails.rateLimitInfo.maxCallsPerHour.toLocaleString()}
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div
                    className={`h-2 rounded-full transition-all duration-300 ${
                      getRateLimitColor(processingDetails.rateLimitInfo.callsThisHour, processingDetails.rateLimitInfo.maxCallsPerHour).replace('text-', 'bg-')
                    }`}
                    style={{ width: `${(processingDetails.rateLimitInfo.callsThisHour / processingDetails.rateLimitInfo.maxCallsPerHour) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Avertissements */}
        {(processingDetails.rateLimitInfo.callsThisMinute / processingDetails.rateLimitInfo.maxCallsPerMinute > 0.8 ||
          processingDetails.rateLimitInfo.callsThisHour / processingDetails.rateLimitInfo.maxCallsPerHour > 0.8) && (
          <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-md">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-yellow-800">
                  Attention: Limites API approchées
                </h3>
                <div className="mt-2 text-sm text-yellow-700">
                  <p>
                    Vous approchez des limites de l'API Meta. Le système ralentira automatiquement pour éviter les erreurs de rate limiting.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProcessingProgress;
