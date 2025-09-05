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
    console.log('🎯 Interest groups updated:', groups);
    const totalInterests = groups.reduce((total, group) => total + group.interests.length, 0);
    console.log('🎯 Total interests:', totalInterests);
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
    console.log('🚀 [SUBMIT] Starting form submission...', { projectId, filename });
    console.log('🚀 [SUBMIT] Current URL:', window.location.href);
    console.log('🚀 [SUBMIT] Project ID type:', typeof projectId, 'Value:', projectId);
    
    const totalInterests = interestGroups.reduce((total, group) => total + group.interests.length, 0);  
    // Permettre le targeting sans intérêts (targeting géographique uniquement)
    if (totalInterests === 0) {
      console.log('⚠️ No interests selected, proceeding with geographic targeting only');
    }

    const advancedTargetingSpec = getAdvancedTargetingSpec();
    console.log('🎯 [SUBMIT] Advanced targeting spec:', advancedTargetingSpec);
    
    // Use Project ID from state (not from URL)
    if (!projectId) {
      console.error('❌ [SUBMIT] Project ID missing');
      toast.error('Project ID missing. Please upload a file first.');
      navigate('/upload');
      return;
    }
    
    try {
      // 1. First save the targeting spec to the project
      console.log('🚀 [API] Saving targeting spec...');
      toast.loading('Saving targeting configuration...');
      
      const updateUrl = `/api/projects/${parseInt(projectId)}`;
      console.log('🔍 [API] PATCH URL:', updateUrl);
      
      const updateResponse = await fetch(updateUrl, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          targeting_spec: advancedTargetingSpec
        })
      });
      
      console.log('🔍 [API] PATCH response status:', updateResponse.status);
      console.log('🔍 [API] PATCH response ok:', updateResponse.ok);
      
      if (!updateResponse.ok) {
        const errorText = await updateResponse.text();
        console.error('❌ [API] PATCH failed:', errorText);
        throw new Error(`Failed to save targeting configuration: ${errorText}`);
      }
      
      const updateResult = await updateResponse.json();
      console.log('✅ [API] PATCH success:', updateResult);
      
      // 2. Create async job for Meta API processing
      console.log('🚀 [API] Creating async processing job...');
      toast.dismiss();
      toast.loading('Starting background processing...');
      
      const jobUrl = '/api/jobs/start';
      console.log('🔍 [API] POST URL:', jobUrl);
      console.log('🔍 [API] POST body:', { projectId: parseInt(projectId), targetingSpec: advancedTargetingSpec });
      
      const jobResponse = await fetch(jobUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          projectId: parseInt(projectId),
          targetingSpec: advancedTargetingSpec
        })
      });
      
      console.log('🔍 [API] POST response status:', jobResponse.status);
      console.log('🔍 [API] POST response ok:', jobResponse.ok);
      
      if (!jobResponse.ok) {
        const errorText = await jobResponse.text();
        console.error('❌ [API] POST failed:', errorText);
        throw new Error(`Failed to start processing job: ${errorText}`);
      }
      
      const jobResult = await jobResponse.json();
      console.log('✅ [API] POST success:', jobResult);
      
      // 3. Trigger job processing immediately
      console.log('🚀 Triggering job worker...');
      try {
        fetch('/api/jobs/trigger', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        }).catch(error => {
          console.warn('⚠️ Worker trigger failed (will retry via cron):', error);
        });
      } catch (error) {
        console.warn('⚠️ Worker trigger failed (will retry via cron):', error);
      }
      
      // 4. Immediately redirect to results page with job info
      toast.dismiss();
      toast.success('Processing started! Redirecting to results...');
      
      const targetProjectId = parseInt(projectId);
      const targetJobId = jobResult.data?.jobId;
      
      console.log('🚀 [REDIRECT] Pre-navigation debug:', {
        projectId,
        targetProjectId,
        jobResult,
        targetJobId,
        filename,
        targetUrl: `/results/${targetProjectId}`
      });
      
      // Vérifier que les données sont valides avant la redirection
      if (!targetProjectId || isNaN(targetProjectId)) {
        console.error('❌ [REDIRECT] Invalid projectId:', projectId);
        toast.error('Invalid project ID. Cannot redirect to results.');
        return;
      }
      
      console.log('🚀 [REDIRECT] Starting navigation to:', `/results/${targetProjectId}`);
      console.log('🚀 [REDIRECT] Current location:', window.location.pathname);
      console.log('🚀 [REDIRECT] Navigate function available:', typeof navigate);
      
      // FORCER LA REDIRECTION IMMÉDIATEMENT avec window.location.href
      console.log('🔄 [REDIRECT] FORCING immediate redirect with window.location.href');
      const targetUrl = `/results/${targetProjectId}`;
      
      // Sauvegarder les données dans sessionStorage pour la page de destination
      sessionStorage.setItem('redirectData', JSON.stringify({
        projectId: targetProjectId,
        filename: filename,
        jobId: targetJobId,
        jobStatus: 'processing'
      }));
      
      // Redirection FORCÉE
      window.location.href = targetUrl;
      
      // Au cas où window.location.href ne marche pas non plus (très rare)
      setTimeout(() => {
        if (window.location.pathname !== targetUrl) {
          console.log('⚠️ [REDIRECT] Even window.location.href failed, trying window.location.replace');
          window.location.replace(targetUrl);
        }
      }, 100);
      
    } catch (error) {
      toast.dismiss();
      console.error('❌ Error in targeting submission:', error);
      toast.error((error as Error).message || 'Error starting analysis');
    }
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
              {interestGroups.map(group => group.interests.length > 0 && (
                <div key={group.id} className="text-xs text-gray-600">
                  {group.name}: {group.interests.map(i => i.name).join(', ')}
                </div>
              ))}
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
          className="btn-primary px-8 py-3"
        >
          Continue to Analysis
        </button>
      </div>
    </div>
  );
};

export default TargetingPage;
