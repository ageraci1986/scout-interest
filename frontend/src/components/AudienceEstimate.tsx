import React, { useState, useEffect } from 'react';
import { MetaTargetingSpec, DeliveryEstimate, AdvancedTargetingSpec } from '../services/metaService';
import metaService from '../services/metaService';
import toast from 'react-hot-toast';

interface AudienceEstimateProps {
  adAccountId: string;
  targetingSpec?: MetaTargetingSpec;
  advancedTargetingSpec?: AdvancedTargetingSpec;
  totalCount?: number;
}

const AudienceEstimate: React.FC<AudienceEstimateProps> = ({ 
  adAccountId, 
  targetingSpec,
  advancedTargetingSpec,
  totalCount = 100 
}) => {
  const [estimate, setEstimate] = useState<DeliveryEstimate | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Get audience estimate from Meta API
  const getAudienceEstimate = async () => {
    if (!adAccountId) {
      setError('Ad Account ID not configured');
      return;
    }

    setIsLoading(true);
    setError(null);
    
    try {
      let deliveryEstimate: DeliveryEstimate;
      
      if (advancedTargetingSpec) {
        // Use advanced targeting with interest groups
        deliveryEstimate = await metaService.getAdvancedDeliveryEstimate(adAccountId, advancedTargetingSpec);
      } else if (targetingSpec) {
        // Use legacy targeting
        deliveryEstimate = await metaService.getDeliveryEstimate(adAccountId, targetingSpec);
      } else {
        throw new Error('No targeting specification provided');
      }
      
      setEstimate(deliveryEstimate);
      setLastUpdate(new Date());
      toast.success('Audience estimate updated');
    } catch (error) {
      console.error('Error getting audience estimate:', error);
      setError('Error estimating audience');
      
      // Fallback to calculated estimate
      const calculatedEstimate = calculateFallbackEstimate();
      setEstimate(calculatedEstimate);
      toast.error('API Error - Using calculated estimate');
    } finally {
      setIsLoading(false);
    }
  };

  // Fallback calculation when API fails
  const calculateFallbackEstimate = (): DeliveryEstimate => {
    // Simple fallback calculation
    const baseAudience = 1000000; // 1M base audience
    let ageRange = 47; // Default 18-65 range
    
    if (targetingSpec?.age_min && targetingSpec?.age_max) {
      ageRange = targetingSpec.age_max - targetingSpec.age_min;
    } else if (advancedTargetingSpec?.age_min && advancedTargetingSpec?.age_max) {
      ageRange = advancedTargetingSpec.age_max - advancedTargetingSpec.age_min;
    }
    
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
    if (adAccountId && (targetingSpec || advancedTargetingSpec)) {
      getAudienceEstimate();
    }
  }, [adAccountId, targetingSpec, advancedTargetingSpec]);

  const formatNumber = (num: number | undefined | null) => {
    if (num === undefined || num === null) return '0';
    return new Intl.NumberFormat('en-US').format(num);
  };

  const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
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
          Audience Estimate
        </h3>
        <button
          onClick={getAudienceEstimate}
          disabled={isLoading || !adAccountId}
          className="px-3 py-1 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Calculating...' : 'Refresh'}
        </button>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-sm text-gray-600 mt-2">Calculating audience...</p>
        </div>
      )}

      {/* Error State */}
      {error && !isLoading && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {estimate && !isLoading && (
        <div className="space-y-4">
          {/* Main Estimate */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <h4 className="text-lg font-semibold text-blue-900">
                  Estimated Audience Size
                </h4>
                <p className="text-sm text-blue-700">
                  {formatNumber(estimate.users_lower_bound)} - {formatNumber(estimate.users_upper_bound)} users
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-blue-600">
                  {formatNumber(estimate.users_upper_bound)}
                </div>
                <div className="text-xs text-blue-500">max users</div>
              </div>
            </div>
          </div>

          {/* Detailed Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-3">
              <h5 className="text-sm font-medium text-gray-700 mb-1">Minimum Audience</h5>
              <p className="text-lg font-semibold text-gray-900">
                {formatNumber(estimate.users_lower_bound)}
              </p>
              <p className="text-xs text-gray-500">users</p>
            </div>

            <div className="bg-gray-50 rounded-lg p-3">
              <h5 className="text-sm font-medium text-gray-700 mb-1">Maximum Audience</h5>
              <p className="text-lg font-semibold text-gray-900">
                {formatNumber(estimate.users_upper_bound)}
              </p>
              <p className="text-xs text-gray-500">users</p>
            </div>

            {estimate.estimate_mau_lower_bound && estimate.estimate_mau_upper_bound && (
              <>
                <div className="bg-gray-50 rounded-lg p-3">
                  <h5 className="text-sm font-medium text-gray-700 mb-1">Minimum MAU</h5>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatNumber(estimate.estimate_mau_lower_bound)}
                  </p>
                  <p className="text-xs text-gray-500">active users/month</p>
                </div>

                <div className="bg-gray-50 rounded-lg p-3">
                  <h5 className="text-sm font-medium text-gray-700 mb-1">Maximum MAU</h5>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatNumber(estimate.estimate_mau_upper_bound)}
                  </p>
                  <p className="text-xs text-gray-500">active users/month</p>
                </div>
              </>
            )}
          </div>

          {/* Status */}
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center">
              <div className={`w-2 h-2 rounded-full mr-2 ${estimate.estimate_ready ? 'bg-green-400' : 'bg-yellow-400'}`}></div>
              <span>{estimate.estimate_ready ? 'Estimate ready' : 'Estimate in progress'}</span>
            </div>
            {lastUpdate && (
              <span>Last update: {formatDate(lastUpdate)}</span>
            )}
          </div>
        </div>
      )}

      {/* No Data State */}
      {!estimate && !isLoading && !error && (
        <div className="text-center py-8 bg-gray-50 rounded-lg">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">No estimate</h3>
          <p className="mt-1 text-sm text-gray-500">
            Configure your targeting to get an audience estimate.
          </p>
        </div>
      )}
    </div>
  );
};

export default AudienceEstimate;
