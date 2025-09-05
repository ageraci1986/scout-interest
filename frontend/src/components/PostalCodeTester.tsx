import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import metaService, { MetaTargetingSpec, PostalCodeReachEstimate } from '../services/metaService';
import CountrySelector from './CountrySelector';

interface PostalCodeTesterProps {
  adAccountId: string;
  className?: string;
}

const PostalCodeTester: React.FC<PostalCodeTesterProps> = ({
  adAccountId,
  className = ''
}) => {
  const [postalCode, setPostalCode] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [ageMin, setAgeMin] = useState(18);
  const [ageMax, setAgeMax] = useState(65);
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<PostalCodeReachEstimate | null>(null);

  const handleTest = async () => {
    if (!postalCode.trim()) {
      toast.error('Please enter a postal code');
      return;
    }

    setIsLoading(true);
    setResult(null);

    try {
      const targetingSpec: MetaTargetingSpec = {
        country_code: selectedCountry,
        age_min: ageMin,
        age_max: ageMax,
        genders: ['1', '2'], // Both genders
        device_platforms: ['mobile', 'desktop']
      };

      const result = await metaService.getPostalCodeReachEstimate(
        adAccountId,
        postalCode.trim(),
        targetingSpec
      );

      setResult(result);
      toast.success(`Reach estimate calculated for ${postalCode}`);
    } catch (error: any) {
      console.error('Error testing postal code:', error);
      toast.error(error.response?.data?.message || 'Error testing postal code');
    } finally {
      setIsLoading(false);
    }
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('fr-FR').format(num);
  };

  return (
    <div className={`bg-white rounded-lg shadow-md p-6 ${className}`}>
      <h3 className="text-lg font-semibold text-gray-900 mb-4">
        Meta Postal Code Test
      </h3>
      
      <div className="space-y-4">
        {/* Country Selection */}
        <CountrySelector
          selectedCountry={selectedCountry}
          onCountryChange={setSelectedCountry}
        />

        {/* Postal Code Input */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Postal Code
          </label>
          <input
            type="text"
            value={postalCode}
            onChange={(e) => setPostalCode(e.target.value)}
            placeholder="Ex: 10001, 75001"
            className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>

        {/* Age Range */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Minimum age
            </label>
            <input
              type="number"
              value={ageMin}
              onChange={(e) => setAgeMin(parseInt(e.target.value) || 18)}
              min="13"
              max="65"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Maximum age
            </label>
            <input
              type="number"
              value={ageMax}
              onChange={(e) => setAgeMax(parseInt(e.target.value) || 65)}
              min="13"
              max="65"
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>

        {/* Test Button */}
        <button
          onClick={handleTest}
          disabled={isLoading || !postalCode.trim()}
          className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLoading ? 'Calculating...' : 'Test Postal Code'}
        </button>

        {/* Results */}
        {result && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <h4 className="font-medium text-gray-900 mb-3">Results</h4>
            
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Postal code:</span>
                <span className="text-sm font-medium">{result.postalCode}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Country:</span>
                <span className="text-sm font-medium">{result.zipCodeData.country_name}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">City:</span>
                <span className="text-sm font-medium">{result.zipCodeData.primary_city}</span>
              </div>
              
              <div className="flex justify-between">
                <span className="text-sm text-gray-600">Region:</span>
                <span className="text-sm font-medium">{result.zipCodeData.region}</span>
              </div>
              
              <div className="border-t pt-3">
                <h5 className="text-sm font-medium text-gray-800 mb-2">Audience Estimate</h5>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Audience size (min):</span>
                  <span className="text-sm font-medium text-green-600">
                    {formatNumber(result.reachEstimate?.users_lower_bound || 0)} users
                  </span>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Audience size (max):</span>
                  <span className="text-sm font-medium text-green-600">
                    {formatNumber(result.reachEstimate?.users_upper_bound || 0)} users
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostalCodeTester;
