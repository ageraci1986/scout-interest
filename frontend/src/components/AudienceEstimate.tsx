import React, { useState, useEffect } from 'react';
import { MetaTargetingSpec, DeliveryEstimate } from '../services/metaService';
import metaService from '../services/metaService';
import toast from 'react-hot-toast';

interface AudienceEstimateProps {
  adAccountId: string;
  targetingSpec: MetaTargetingSpec;
  totalCount?: number;
}

const AudienceEstimate: React.FC<AudienceEstimateProps> = ({ 
  adAccountId, 
  targetingSpec, 
  totalCount = 100 
}) => {
  const [estimate, setEstimate] = useState<DeliveryEstimate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get audience estimate from Meta API
  const getAudienceEstimate = async () => {
    if (!adAccountId) {
      setError('Ad Account ID non configuré');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      const deliveryEstimate = await metaService.getDeliveryEstimate(adAccountId, targetingSpec);
      setEstimate(deliveryEstimate);
      setLastUpdate(new Date());
      toast.success('Estimation d\'audience mise à jour');
    } catch (error) {
      console.error('Error getting audience estimate:', error);
      setError('Erreur lors de l\'estimation de l\'audience');
      
      // Fallback to calculated estimate
      const calculatedEstimate = calculateFallbackEstimate();
      setEstimate(calculatedEstimate);
      toast.error('Erreur API - Utilisation d\'une estimation calculée');
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback calculation when API fails
  const calculateFallbackEstimate = (): DeliveryEstimate => {
    // Simple fallback calculation
    const baseAudience = 1000000; // 1M base audience
    const ageRange = (targetingSpec.age_max || 65) - (targetingSpec.age_min || 18);
    const ageFactor = ageRange / 47; // Assuming 18-65 range
    
    const filteredAudience = Math.round(baseAudience * ageFactor);
    
    return {
      estimate_ready: true,
      users_lower_bound: Math.round(filteredAudience * 0.8),
      users_upper_bound: Math.round(filteredAudience * 1.2),
      estimate_mau_lower_bound: Math.round(filteredAudience * 0.7),
      estimate_mau_upper_bound: Math.round(filteredAudience * 1.3)
    };
  };

  // Auto-refresh when targeting spec changes
  useEffect(() => {
    if (adAccountId) {
      getAudienceEstimate();
    }
  }, [adAccountId, targetingSpec]);

  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null) return '0';
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('fr-FR', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    }).format(date);
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-medium text-gray-900">
          Estimation d'Audience
        </h3>
        <button
          onClick={getAudienceEstimate}
          disabled={isLoading || !adAccountId}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Calcul...' : 'Actualiser'}
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Loading State */}
      {isLoading && (
        <div className="flex items-center justify-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Calcul en cours...</span>
        </div>
      )}

      {/* Results Display */}
      {estimate && !isLoading && (
        <div className="space-y-4">
          {/* Main Audience Numbers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-green-800">Taille d'audience (min)</p>
                  <p className="text-2xl font-bold text-green-900">
                    {formatNumber(estimate.users_lower_bound)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-blue-800">Taille d'audience (max)</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {formatNumber(estimate.users_upper_bound)}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Additional Metrics */}
          {estimate.estimate_mau_lower_bound && estimate.estimate_mau_upper_bound && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Utilisateurs actifs mensuels (MAU)</h4>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Minimum</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatNumber(estimate.estimate_mau_lower_bound)}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Maximum</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatNumber(estimate.estimate_mau_upper_bound)}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Last Update */}
          {lastUpdate && (
            <div className="text-xs text-gray-500 text-center">
              Dernière mise à jour : {formatDate(lastUpdate)}
            </div>
          )}
        </div>
      )}

      {/* No Results */}
      {!estimate && !isLoading && !error && (
        <div className="text-center py-8 text-gray-500">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <p className="mt-2">Aucune estimation disponible</p>
          <p className="text-sm">Cliquez sur "Actualiser" pour calculer l'audience</p>
        </div>
      )}
    </div>
  );
};

export default AudienceEstimate;
