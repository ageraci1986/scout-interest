import React, { useState, useEffect } from 'react';
import { toast } from 'react-hot-toast';
import metaService, { MetaTargetingSpec } from '../services/metaService';
import AudienceEstimate from '../components/AudienceEstimate';
import PostalCodeTester from '../components/PostalCodeTester';

const AnalysisPage: React.FC = () => {
  const [adAccountId, setAdAccountId] = useState('');
  const [targetingSpec] = useState<MetaTargetingSpec>({
    geo_locations: [{ countries: ['US'] }],
    age_min: 18,
    age_max: 65,
    genders: ['1', '2'],
    device_platforms: ['mobile', 'desktop'],
    interests: []
  });
  const [totalCount] = useState(100);

  useEffect(() => {
    const fetchAdAccount = async () => {
      try {
        const config = await metaService.getAdAccountConfig();
        setAdAccountId(config.ad_account_id);
      } catch (error) {
        console.error('Error fetching ad account:', error);
        toast.error('Error retrieving ad account');
      }
    };

    fetchAdAccount();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Audience Analysis</h1>
          <p className="mt-2 text-gray-600">
            Analyze the audience size of your Meta advertising campaigns
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Audience Estimate Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              General Audience Estimate
            </h2>
            <AudienceEstimate
              adAccountId={adAccountId}
              targetingSpec={targetingSpec}
              totalCount={totalCount}
            />
          </div>

          {/* Postal Code Tester Section */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Meta Postal Code Test
            </h2>
            <PostalCodeTester
              adAccountId={adAccountId}
            />
          </div>
        </div>

        {/* Additional Features Section */}
        <div className="mt-8 bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">
            Advanced Features
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900">Geographic Targeting</h3>
              <p className="text-sm text-gray-500 mt-1">
                Test individual postal codes with real Meta data
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900">Reach Estimate</h3>
              <p className="text-sm text-gray-500 mt-1">
                Get real audience estimates from Meta
              </p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
              </div>
              <h3 className="font-medium text-gray-900">Multi-Country</h3>
              <p className="text-sm text-gray-500 mt-1">
                Support for over 100 countries for targeting
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisPage;
