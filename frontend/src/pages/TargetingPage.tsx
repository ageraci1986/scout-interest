import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Interest, TargetingSpec, MetaTargetingSpec } from '../services/metaService';
import metaService from '../services/metaService';
import InterestSearch from '../components/InterestSearch';
import SelectedInterests from '../components/SelectedInterests';
import AudienceEstimate from '../components/AudienceEstimate';
import toast from 'react-hot-toast';

const TargetingPage: React.FC = () => {
  const navigate = useNavigate();
  const [selectedInterests, setSelectedInterests] = useState<Interest[]>([]);
  const [targetingSpec, setTargetingSpec] = useState<TargetingSpec>({
    age_min: 18,
    age_max: 65,
    genders: ['all'],
    devices: ['all'],
    countries: ['FR']
  });
  const [adAccountId, setAdAccountId] = useState('');

  // Load uploaded postal codes count (mock for now)
  const uploadedPostalCodesCount = 100; // This would come from the uploaded file

  useEffect(() => {
    const fetchAdAccount = async () => {
      try {
        const config = await metaService.getAdAccountConfig();
        setAdAccountId(config.ad_account_id);
      } catch (error) {
        console.error('Error fetching ad account:', error);
        toast.error('Erreur lors de la récupération de l\'ad account');
      }
    };

    fetchAdAccount();
  }, []);

  // Convert TargetingSpec to MetaTargetingSpec
  const getMetaTargetingSpec = (): MetaTargetingSpec => {
    return {
      interests: selectedInterests.map(interest => ({
        id: interest.id,
        name: interest.name
      })),
      geo_locations: targetingSpec.countries?.map(country => ({
        countries: [country]
      })) || [],
      age_min: targetingSpec.age_min || 18,
      age_max: targetingSpec.age_max || 65,
      genders: targetingSpec.genders?.filter(g => g !== 'all') || [],
      device_platforms: targetingSpec.devices?.filter(d => d !== 'all') || []
    };
  };

  // Handle interest selection
  const handleInterestSelect = (interest: Interest) => {
    setSelectedInterests(prev => [...prev, interest]);
  };

  // Handle interest removal
  const handleRemoveInterest = (interestId: string) => {
    setSelectedInterests(prev => prev.filter(interest => interest.id !== interestId));
  };

  // Handle targeting spec changes
  const handleTargetingChange = (field: keyof TargetingSpec, value: any) => {
    setTargetingSpec(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Handle form submission
  const handleSubmit = () => {
    if (selectedInterests.length === 0) {
      toast.error('Veuillez sélectionner au moins un intérêt');
      return;
    }

    const finalTargetingSpec: TargetingSpec = {
      ...targetingSpec,
      interests: selectedInterests
    };

    console.log('Targeting spec:', finalTargetingSpec);
    toast.success('Configuration du targeting sauvegardée !');
    
    // Save targeting data to localStorage for the analysis page
    localStorage.setItem('targetingSpec', JSON.stringify(finalTargetingSpec));
    localStorage.setItem('selectedInterests', JSON.stringify(selectedInterests));
    
    // Get current project ID from localStorage or URL
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('projectId') || localStorage.getItem('currentProjectId') || '1';
    localStorage.setItem('currentProjectId', projectId);
    
    // Navigate to results page with project ID
    navigate(`/results?projectId=${projectId}`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Configuration du Targeting
        </h1>
        <p className="text-lg text-gray-600">
          Sélectionnez les intérêts et paramètres pour optimiser votre audience Meta.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Left Column - Interest Search */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Recherche d'Intérêts
            </h2>
            <InterestSearch
              onInterestSelect={handleInterestSelect}
              selectedInterests={selectedInterests}
              targetingSpec={targetingSpec}
            />
          </div>

          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Intérêts Sélectionnés
            </h2>
            <SelectedInterests
              interests={selectedInterests}
              onRemoveInterest={handleRemoveInterest}
            />
          </div>

          {/* Real-time Audience Estimate */}
          <div className="card">
            <AudienceEstimate
              adAccountId={adAccountId}
              targetingSpec={getMetaTargetingSpec()}
              totalCount={uploadedPostalCodesCount}
            />
          </div>
        </div>

        {/* Right Column - Advanced Parameters */}
        <div className="space-y-6">
          <div className="card">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">
              Paramètres Avancés
            </h2>
            
            {/* Age Range */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Tranche d'âge
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
                    placeholder="Âge min"
                  />
                </div>
                <span className="text-gray-500">à</span>
                <div className="flex-1">
                  <input
                    type="number"
                    min="13"
                    max="65"
                    value={targetingSpec.age_max}
                    onChange={(e) => handleTargetingChange('age_max', parseInt(e.target.value))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    placeholder="Âge max"
                  />
                </div>
              </div>
            </div>

            {/* Gender */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Genre
              </label>
              <div className="space-y-2">
                {[
                  { value: 'all', label: 'Tous' },
                  { value: '1', label: 'Hommes' },
                  { value: '2', label: 'Femmes' }
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
                Pays
              </label>
              <select
                value={targetingSpec.countries?.[0] || 'FR'}
                onChange={(e) => handleTargetingChange('countries', [e.target.value])}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              >
                <option value="FR">France</option>
                <option value="BE">Belgique</option>
                <option value="CH">Suisse</option>
                <option value="CA">Canada</option>
                <option value="US">États-Unis</option>
                <option value="GB">Royaume-Uni</option>
                <option value="DE">Allemagne</option>
                <option value="IT">Italie</option>
                <option value="ES">Espagne</option>
              </select>
            </div>

            {/* Devices */}
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Appareils
              </label>
              <div className="space-y-2">
                {[
                  { value: 'all', label: 'Tous les appareils' },
                  { value: 'desktop', label: 'Ordinateur' },
                  { value: 'mobile', label: 'Mobile' },
                  { value: 'tablet', label: 'Tablette' }
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
              Aperçu du Targeting
            </h2>
            <div className="bg-gray-50 rounded-lg p-4 space-y-2 text-sm">
              <div><strong>Intérêts:</strong> {selectedInterests.length} sélectionné{selectedInterests.length > 1 ? 's' : ''}</div>
              <div><strong>Âge:</strong> {targetingSpec.age_min} - {targetingSpec.age_max} ans</div>
              <div><strong>Genre:</strong> {targetingSpec.genders?.includes('all') ? 'Tous' : targetingSpec.genders?.includes('1') ? 'Hommes' : 'Femmes'}</div>
              <div><strong>Pays:</strong> {targetingSpec.countries?.join(', ')}</div>
              <div><strong>Appareils:</strong> {targetingSpec.devices?.includes('all') ? 'Tous' : targetingSpec.devices?.join(', ')}</div>
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
          Retour
        </button>
        <button
          onClick={handleSubmit}
          disabled={selectedInterests.length === 0}
          className={`btn-primary px-8 py-3 ${
            selectedInterests.length === 0 ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          Continuer vers l'analyse
        </button>
      </div>
    </div>
  );
};

export default TargetingPage;
