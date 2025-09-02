import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { TargetingSpec, MetaTargetingSpec, AdvancedTargetingSpec, InterestGroup } from '../services/metaService';
import metaService from '../services/metaService';
import InterestGroupManager from '../components/InterestGroupManager';
import AudienceEstimate from '../components/AudienceEstimate';
import toast from 'react-hot-toast';

const TargetingPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const projectId = location.state?.projectId;
  const filename = location.state?.filename;
  const [interestGroups, setInterestGroups] = useState<InterestGroup[]>([{
    id: 'default-group',
    name: 'Group 1',
    operator: 'OR',
    interests: []
  }]);

  const [targetingSpec, setTargetingSpec] = useState<TargetingSpec>({
    age_min: 18,
    age_max: 65,
    genders: ['all'],
    devices: ['all'],
    countries: ['FR']
  });
  const [adAccountId, setAdAccountId] = useState('');

  // Load uploaded postal codes count (mock for now)
  // const uploadedPostalCodesCount = 100; // This would come from the uploaded file

  useEffect(() => {
    // Vérifier que le Project ID est présent
    if (!projectId) {
      console.error('❌ No projectId found in state');
      toast.error('Project ID missing. Please upload a file first.');
      navigate('/upload');
      return;
    }

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
  }, [projectId, navigate]);

  // Convert TargetingSpec to MetaTargetingSpec
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getMetaTargetingSpec = (): MetaTargetingSpec => {
    // Flatten all interests from all groups
    const allInterests = interestGroups.flatMap(group => group.interests);
    return {
      interests: allInterests,
      geo_locations: targetingSpec.countries?.map(country => ({
        countries: [country]
      })) || [],
      age_min: targetingSpec.age_min || 18,
      age_max: targetingSpec.age_max || 65,
      genders: targetingSpec.genders?.filter(g => g !== 'all') || [],
      device_platforms: targetingSpec.devices?.filter(d => d !== 'all') || []
    };
  };

  // Convert to AdvancedTargetingSpec for AudienceEstimate
  const getAdvancedTargetingSpec = (): AdvancedTargetingSpec => {
    const spec = {
      interestGroups: interestGroups.length > 0 ? interestGroups : [{
        id: 'default-group',
        name: 'Main Group',
        operator: 'AND' as const,
        interests: []
      }],
      geo_locations: targetingSpec.countries?.map(country => ({
        countries: [country]
      })) || [],
      age_min: targetingSpec.age_min || 18,
      age_max: targetingSpec.age_max || 65,
      genders: targetingSpec.genders?.filter(g => g !== 'all') || [],
      device_platforms: targetingSpec.devices?.filter(d => d !== 'all') || [],
      countries: targetingSpec.countries || []
    };
    
    console.log('🎯 Advanced targeting spec generated:', spec);
    return spec;
  };

  // Handle interest groups change
  const handleInterestGroupsChange = (groups: InterestGroup[]) => {
    setInterestGroups(groups);
  };

  // Handle targeting spec changes
  const handleTargetingChange = (field: keyof TargetingSpec, value: any) => {
    setTargetingSpec(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle form submission
  const handleSubmit = async () => {
    const totalInterests = interestGroups.reduce((total, group) => total + group.interests.length, 0);
    if (totalInterests === 0) {
      toast.error('Please select at least one interest');
      return;
    }

    const advancedTargetingSpec = getAdvancedTargetingSpec();

    console.log('Advanced targeting spec:', advancedTargetingSpec);
    
    // Use Project ID from state (not from URL)
    if (!projectId) {
      toast.error('Project ID missing. Please upload a file first.');
      navigate('/upload');
      return;
    }
    
    // Save targeting spec to project
    try {
      const response = await fetch(`/api/projects/${projectId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targeting_spec: advancedTargetingSpec
        })
      });
      
      if (response.ok) {
        console.log('✅ Targeting spec saved to project');
        toast.success('Targeting configuration saved!');
      } else {
        console.error('❌ Failed to save targeting spec');
        toast.error('Failed to save targeting configuration');
      }
    } catch (error) {
      console.error('❌ Error saving targeting spec:', error);
      toast.error('Error saving targeting configuration');
    }
    
    // Get postal codes from localStorage
    const postalCodes = JSON.parse(localStorage.getItem('uploadedPostalCodes') || '[]');
    
    console.log('🚀 Navigating to results with project ID:', projectId);
    console.log('📦 Postal codes from storage:', postalCodes);
    
    // Navigate to results page with project ID and postal codes
    navigate('/results', { 
      state: { 
        projectId: projectId,
        postalCodes: postalCodes,
        filename: filename
      }
    });
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Targeting Configuration
        </h1>
        <p className="text-lg text-gray-600">
          Select interests and parameters to optimize your Meta audience.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Interest Groups */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Interest Groups with AND/OR Operators
            </h2>
            <InterestGroupManager
              interestGroups={interestGroups}
              onInterestGroupsChange={handleInterestGroupsChange}
            />
          </div>

          {/* Audience Estimate */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Audience Estimate</h3>
            <AudienceEstimate
              adAccountId={adAccountId}
              advancedTargetingSpec={interestGroups.length > 0 ? getAdvancedTargetingSpec() : undefined}
            />
          </div>
        </div>

        {/* Right Column - Advanced Parameters */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Advanced Parameters
            </h2>
            
            {/* Age Range */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Age Range
              </label>
              <div className="flex items-center space-x-4">
                <div className="flex-1">
                  <input
                    type="number"
                    min="13"
                    max="65"
                    value={targetingSpec.age_min}
                    onChange={(e) => handleTargetingChange('age_min', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Min age"
                  />
                </div>
                <span className="text-gray-500">to</span>
                <div className="flex-1">
                  <input
                    type="number"
                    min="13"
                    max="65"
                    value={targetingSpec.age_max}
                    onChange={(e) => handleTargetingChange('age_max', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Max age"
                  />
                </div>
              </div>
            </div>

            {/* Gender */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Gender
              </label>
              <div className="space-y-2">
                {[
                  { value: 'all', label: 'All' },
                  { value: '1', label: 'Men' },
                  { value: '2', label: 'Women' }
                ].map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="gender"
                      value={option.value}
                      checked={targetingSpec.genders?.includes(option.value)}
                      onChange={(e) => handleTargetingChange('genders', [e.target.value])}
                      className="mr-2 text-primary-600 focus:ring-primary-500"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>

            {/* Countries */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Country
              </label>
              <select
                value={targetingSpec.countries?.[0] || 'FR'}
                onChange={(e) => handleTargetingChange('countries', [e.target.value])}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="FR">France</option>
                <option value="BE">Belgium</option>
                <option value="CH">Switzerland</option>
                <option value="CA">Canada</option>
                <option value="US">United States</option>
                <option value="GB">United Kingdom</option>
                <option value="DE">Germany</option>
                <option value="IT">Italy</option>
                <option value="ES">Spain</option>
              </select>
            </div>

            {/* Devices */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Devices
              </label>
              <div className="space-y-2">
                {[
                  { value: 'all', label: 'All devices' },
                  { value: 'desktop', label: 'Desktop' },
                  { value: 'mobile', label: 'Mobile' },
                  { value: 'tablet', label: 'Tablet' }
                ].map((option) => (
                  <label key={option.value} className="flex items-center">
                    <input
                      type="radio"
                      name="devices"
                      value={option.value}
                      checked={targetingSpec.devices?.includes(option.value)}
                      onChange={(e) => handleTargetingChange('devices', [e.target.value])}
                      className="mr-2 text-primary-600 focus:ring-primary-500"
                    />
                    {option.label}
                  </label>
                ))}
              </div>
            </div>
          </div>

          {/* Targeting Preview */}
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Targeting Preview
            </h2>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div><strong>Interests:</strong> {interestGroups.reduce((total, group) => total + group.interests.length, 0)} selected</div>
              <div><strong>Age:</strong> {targetingSpec.age_min} - {targetingSpec.age_max} years</div>
              <div><strong>Gender:</strong> {targetingSpec.genders?.includes('all') ? 'All' : targetingSpec.genders?.includes('1') ? 'Men' : 'Women'}</div>
              <div><strong>Country:</strong> {targetingSpec.countries?.join(', ')}</div>
              <div><strong>Devices:</strong> {targetingSpec.devices?.includes('all') ? 'All' : targetingSpec.devices?.join(', ')}</div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center space-x-4">
        <button
          onClick={() => window.history.back()}
          className="btn-secondary px-8 py-3"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          disabled={interestGroups.reduce((total, group) => total + group.interests.length, 0) === 0}
          className={`btn-primary px-8 py-3 ${
            interestGroups.reduce((total, group) => total + group.interests.length, 0) === 0 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          Continue to Analysis
        </button>
      </div>
    </div>
  );
};

export default TargetingPage;
