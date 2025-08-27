import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import metaService, { MetaTargetingSpec, BatchPostalCodeResult, PostalCodeReachEstimate } from '../services/metaService';
import CountrySelector from '../components/CountrySelector';

interface ResultsPageProps {}

interface ProcessingResult {
  postalCode: string;
  country: string;
  postalCodeOnly: {
    users_lower_bound?: number;
    users_upper_bound?: number;
  };
  withTargeting: {
    users_lower_bound?: number;
    users_upper_bound?: number;
  };
  status: 'pending' | 'processing' | 'completed' | 'error';
  error?: string;
}

const ResultsPage: React.FC<ResultsPageProps> = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<ProcessingResult[]>([]);
  const [selectedCountry, setSelectedCountry] = useState('US');
  const [adAccountId, setAdAccountId] = useState('');
  const [targetingSpec, setTargetingSpec] = useState<MetaTargetingSpec | null>(null);
  const [postalCodes, setPostalCodes] = useState<string[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    errors: 0,
    success: 0
  });

  // Use ref to track processing state to avoid closure issues
  const isProcessingRef = useRef(false);

  useEffect(() => {
    // Load data from localStorage or location state
    const loadData = async () => {
      try {
        console.log('🔄 Loading data...');
        
        // Get ad account ID
        const config = await metaService.getAdAccountConfig();
        setAdAccountId(config.ad_account_id);
        console.log('✅ Ad Account ID loaded:', config.ad_account_id);

        // Load targeting spec from localStorage
        const savedTargetingSpec = localStorage.getItem('targetingSpec');
        const savedInterests = localStorage.getItem('selectedInterests');
        
        console.log('📋 Saved data:', { 
          hasTargetingSpec: !!savedTargetingSpec, 
          hasInterests: !!savedInterests 
        });
        
        if (savedTargetingSpec && savedInterests) {
          const parsedTargetingSpec = JSON.parse(savedTargetingSpec);
          const parsedInterests = JSON.parse(savedInterests);
          
          // Convert to MetaTargetingSpec (without geo_locations)
          const metaTargetingSpec: MetaTargetingSpec = {
            interests: parsedInterests.map((interest: any) => ({
              id: interest.id,
              name: interest.name
            })),
            age_min: parsedTargetingSpec.age_min || 18,
            age_max: parsedTargetingSpec.age_max || 65,
            genders: parsedTargetingSpec.genders?.filter((g: string) => g !== 'all') || [],
            device_platforms: parsedTargetingSpec.devices?.filter((d: string) => d !== 'all') || []
          };
          
          setTargetingSpec(metaTargetingSpec);
          console.log('✅ Targeting spec loaded:', metaTargetingSpec);
        } else {
          console.warn('⚠️ No targeting spec found in localStorage');
        }

        // Load postal codes from localStorage (from uploaded file) or fallback to project
        const uploadedPostalCodes = localStorage.getItem('uploadedPostalCodes');
        const uploadedPostalCodesCount = localStorage.getItem('uploadedPostalCodesCount');
        let postalCodesList = [];
        
        console.log('🔍 Checking localStorage for postal codes...');
        console.log('🔍 uploadedPostalCodes:', uploadedPostalCodes);
        console.log('🔍 uploadedPostalCodesCount:', uploadedPostalCodesCount);
        
        if (uploadedPostalCodes) {
          // Use uploaded postal codes
          postalCodesList = JSON.parse(uploadedPostalCodes);
          console.log('✅ Using uploaded postal codes from localStorage:', postalCodesList);
        } else {
          // Fallback to project postal codes
          const urlParams = new URLSearchParams(window.location.search);
          const projectIdParam = urlParams.get('projectId') || localStorage.getItem('currentProjectId') || '1';
          const projectId = parseInt(projectIdParam, 10);
          console.log('📦 Loading postal codes for project:', projectId);
          const projectData = await metaService.getProjectPostalCodes(projectId);
          postalCodesList = projectData.postalCodes.map(pc => pc.postal_code);
          console.log('✅ Using project postal codes:', postalCodesList);
        }
        
        setPostalCodes(postalCodesList);
        setStats(prev => ({ ...prev, total: postalCodesList.length }));

        // Initialize results array
        const initialResults = postalCodesList.map((code: string) => ({
          postalCode: code,
          country: selectedCountry,
          postalCodeOnly: {},
          withTargeting: {},
          status: 'pending' as const
        }));
        setResults(initialResults);
        console.log('✅ Results array initialized with', initialResults.length, 'items');

      } catch (error) {
        console.error('❌ Error loading data:', error);
        toast.error('Erreur lors du chargement des données');
        navigate('/upload');
      }
    };

    loadData();
  }, []); // Empty dependency array - only run once on mount

  const processPostalCode = async (postalCode: string, index: number) => {
    if (!adAccountId || !targetingSpec) {
      console.error('❌ Missing required data for processing:', { adAccountId: !!adAccountId, targetingSpec: !!targetingSpec });
      return;
    }

    try {
      console.log(`🔄 Processing postal code ${postalCode} (index ${index})`);
      
      // Update status to processing
      setResults(prev => prev.map((result, i) => 
        i === index ? { ...result, status: 'processing' } : result
      ));

      // 1. Get reach estimate for postal code only
      const postalCodeOnlySpec: MetaTargetingSpec = {
        country_code: selectedCountry,
        age_min: 18,
        age_max: 65,
        genders: ['1', '2'],
        device_platforms: ['mobile', 'desktop']
      };

      console.log('📊 Getting postal code only estimate...');
      const postalCodeOnlyResult = await metaService.getPostalCodeReachEstimate(
        adAccountId,
        postalCode,
        postalCodeOnlySpec
      );
      console.log('✅ Postal code only result:', postalCodeOnlyResult.reachEstimate);

      // 2. Get reach estimate with targeting (without geo_locations)
      const withTargetingSpec: MetaTargetingSpec = {
        ...targetingSpec,
        country_code: selectedCountry
      };

      console.log('🎯 Getting targeting estimate...');
      const withTargetingResult = await metaService.getPostalCodeReachEstimate(
        adAccountId,
        postalCode,
        withTargetingSpec
      );
      console.log('✅ Targeting result:', withTargetingResult.reachEstimate);

      // Update results
      setResults(prev => prev.map((result, i) => 
        i === index ? {
          ...result,
          postalCodeOnly: {
            users_lower_bound: postalCodeOnlyResult.reachEstimate.users_lower_bound,
            users_upper_bound: postalCodeOnlyResult.reachEstimate.users_upper_bound
          },
          withTargeting: {
            users_lower_bound: withTargetingResult.reachEstimate.users_lower_bound,
            users_upper_bound: withTargetingResult.reachEstimate.users_upper_bound
          },
          status: 'completed'
        } : result
      ));

      setStats(prev => ({ ...prev, completed: prev.completed + 1, success: prev.success + 1 }));
      console.log(`✅ Successfully processed ${postalCode}`);

    } catch (error) {
      console.error(`❌ Error processing postal code ${postalCode}:`, error);
      
      setResults(prev => prev.map((result, i) => 
        i === index ? { 
          ...result, 
          status: 'error',
          error: error instanceof Error ? error.message : 'Erreur inconnue'
        } : result
      ));

      setStats(prev => ({ ...prev, completed: prev.completed + 1, errors: prev.errors + 1 }));
    }
  };

  const startProcessing = async () => {
    if (!adAccountId || !targetingSpec || postalCodes.length === 0) {
      toast.error('Données manquantes pour le traitement');
      console.error('Missing data:', { adAccountId, targetingSpec: !!targetingSpec, postalCodesLength: postalCodes.length });
      return;
    }

    console.log('🚀 Starting processing with:', {
      adAccountId,
      targetingSpec,
      postalCodes,
      totalCodes: postalCodes.length
    });

    setIsProcessing(true);
    isProcessingRef.current = true;
    setProgress(0);
    setCurrentIndex(0);
    setStats(prev => ({ ...prev, completed: 0, errors: 0, success: 0 }));

    // Process postal codes sequentially to respect rate limits
    for (let i = 0; i < postalCodes.length; i++) {
      // Check if processing was stopped
      if (!isProcessingRef.current) {
        console.log('⏹️ Processing stopped by user');
        break; // Allow stopping
      }

      console.log(`📦 Processing postal code ${i + 1}/${postalCodes.length}: ${postalCodes[i]}`);
      console.log(`🔍 isProcessing state: ${isProcessingRef.current}`);
      
      setCurrentIndex(i);
      await processPostalCode(postalCodes[i], i);
      
      // Update progress
      const newProgress = ((i + 1) / postalCodes.length) * 100;
      setProgress(newProgress);
      console.log(`📊 Progress: ${newProgress.toFixed(1)}%`);

      // Add delay to respect rate limits
      if (i < postalCodes.length - 1) {
        console.log('⏳ Waiting 1 second before next request...');
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log('✅ Processing completed');
    setIsProcessing(false);
    isProcessingRef.current = false;
    toast.success('Traitement terminé !');
  };

  const stopProcessing = () => {
    console.log('⏹️ Stopping processing...');
    setIsProcessing(false);
    isProcessingRef.current = false;
    toast('Traitement arrêté', { icon: '⏹️' });
  };

  // Update results when country changes
  useEffect(() => {
    if (results.length > 0) {
      setResults(prev => prev.map(result => ({
        ...result,
        country: selectedCountry
      })));
    }
  }, [selectedCountry, results.length]);

  const formatNumber = (num: number | undefined) => {
    if (num === undefined) return 'N/A';
    // Use simple number formatting for CSV export to avoid encoding issues
    return num.toString();
  };

  const exportResults = () => {
    // Add BOM for proper UTF-8 encoding
    const BOM = '\uFEFF';
    
    // Create CSV content with proper encoding
    const csvContent = [
      'Code Postal,Pays,Audience Code Postal (min),Audience Code Postal (max),Audience avec Targeting (min),Audience avec Targeting (max),Statut,Erreur',
      ...results.map(result => {
        // Escape any commas in the data to prevent CSV parsing issues
        const escapeCsvField = (field: string) => {
          if (field.includes(',') || field.includes('"') || field.includes('\n')) {
            return `"${field.replace(/"/g, '""')}"`;
          }
          return field;
        };
        
        return [
          escapeCsvField(result.postalCode),
          escapeCsvField(result.country),
          escapeCsvField(formatNumber(result.postalCodeOnly.users_lower_bound)),
          escapeCsvField(formatNumber(result.postalCodeOnly.users_upper_bound)),
          escapeCsvField(formatNumber(result.withTargeting.users_lower_bound)),
          escapeCsvField(formatNumber(result.withTargeting.users_upper_bound)),
          escapeCsvField(result.status),
          escapeCsvField(result.error || '')
        ].join(',');
      })
    ].join('\n');

    // Create blob with proper encoding
    const blob = new Blob([BOM + csvContent], { 
      type: 'text/csv;charset=utf-8' 
    });
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resultats_codes_postaux_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Export CSV terminé !');
  };

  const exportResultsExcel = () => {
    // Add BOM for proper UTF-8 encoding
    const BOM = '\uFEFF';
    
    // Create CSV content with semicolon separator (better for Excel)
    const csvContent = [
      'Code Postal;Pays;Audience Code Postal (min);Audience Code Postal (max);Audience avec Targeting (min);Audience avec Targeting (max);Statut;Erreur',
      ...results.map(result => {
        // Escape any semicolons in the data to prevent CSV parsing issues
        const escapeCsvField = (field: string) => {
          if (field.includes(';') || field.includes('"') || field.includes('\n')) {
            return `"${field.replace(/"/g, '""')}"`;
          }
          return field;
        };
        
        return [
          escapeCsvField(result.postalCode),
          escapeCsvField(result.country),
          escapeCsvField(formatNumber(result.postalCodeOnly.users_lower_bound)),
          escapeCsvField(formatNumber(result.postalCodeOnly.users_upper_bound)),
          escapeCsvField(formatNumber(result.withTargeting.users_lower_bound)),
          escapeCsvField(formatNumber(result.withTargeting.users_upper_bound)),
          escapeCsvField(result.status),
          escapeCsvField(result.error || '')
        ].join(';');
      })
    ].join('\n');

    // Create blob with proper encoding
    const blob = new Blob([BOM + csvContent], { 
      type: 'text/csv;charset=utf-8' 
    });
    
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `resultats_codes_postaux_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Export Excel terminé !');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Résultats du Traitement</h1>
          <p className="mt-2 text-gray-600">
            Traitement en lot des codes postaux avec estimation d'audience
          </p>
        </div>

        {/* Debug Info */}
        <div className="mb-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <h3 className="text-sm font-medium text-yellow-800 mb-2">Debug Info</h3>
          <div className="text-xs text-yellow-700 space-y-1">
            <div>Ad Account ID: {adAccountId || 'Non chargé'}</div>
            <div>Targeting Spec: {targetingSpec ? 'Chargé' : 'Non chargé'}</div>
            <div>Postal Codes: {postalCodes.length} codes</div>
            <div>Results: {results.length} résultats</div>
            <div>Country: {selectedCountry}</div>
          </div>
        </div>

        {/* Country Selection */}
        <div className="mb-6">
          <CountrySelector
            selectedCountry={selectedCountry}
            onCountryChange={setSelectedCountry}
          />
        </div>

        {/* Processing Controls */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">
              Contrôles de Traitement
            </h2>
            <div className="flex space-x-4">
              {!isProcessing ? (
                <button
                  onClick={startProcessing}
                  disabled={postalCodes.length === 0}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Démarrer le Traitement
                </button>
              ) : (
                <button
                  onClick={stopProcessing}
                  className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Arrêter le Traitement
                </button>
              )}
              <div className="flex space-x-2">
                <button
                  onClick={exportResults}
                  disabled={results.length === 0}
                  className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Exporter CSV
                </button>
                <button
                  onClick={exportResultsExcel}
                  disabled={results.length === 0}
                  className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Exporter Excel
                </button>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">Progression</span>
              <span className="text-sm font-medium text-gray-700">{Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-blue-600 h-3 rounded-full transition-all duration-500 ease-out"
                style={{ width: `${progress}%` }}
              ></div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-4 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-900">{stats.total}</div>
              <div className="text-sm text-gray-600">Total</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.completed}</div>
              <div className="text-sm text-blue-600">Traités</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.success}</div>
              <div className="text-sm text-green-600">Succès</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{stats.errors}</div>
              <div className="text-sm text-red-600">Erreurs</div>
            </div>
          </div>
        </div>

        {/* Results Table */}
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Résultats en Temps Réel</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Code Postal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Pays
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Audience Code Postal
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Audience avec Targeting
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Statut
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.map((result, index) => (
                  <tr key={result.postalCode} className={index === currentIndex && isProcessing ? 'bg-blue-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {result.postalCode}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {result.country}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {result.status === 'completed' ? (
                        <span>
                          {formatNumber(result.postalCodeOnly.users_lower_bound)} - {formatNumber(result.postalCodeOnly.users_upper_bound)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {result.status === 'completed' ? (
                        <span>
                          {formatNumber(result.withTargeting.users_lower_bound)} - {formatNumber(result.withTargeting.users_upper_bound)}
                        </span>
                      ) : (
                        <span className="text-gray-400">-</span>
                      )}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {result.status === 'pending' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          En attente
                        </span>
                      )}
                      {result.status === 'processing' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600 mr-1"></div>
                          Traitement
                        </span>
                      )}
                      {result.status === 'completed' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                          Terminé
                        </span>
                      )}
                      {result.status === 'error' && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                          Erreur
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResultsPage;
