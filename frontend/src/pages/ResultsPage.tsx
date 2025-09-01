import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import metaService, { MetaTargetingSpec, BatchPostalCodeResult, PostalCodeReachEstimate } from '../services/metaService';
import CountrySelector from '../components/CountrySelector';
import projectService from '../services/projectService';

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
  const [projectId, setProjectId] = useState<string | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    completed: 0,
    errors: 0,
    success: 0
  });

  // Use ref to track processing state to avoid closure issues
  const isProcessingRef = useRef(false);

  // Polling effect for real-time progress updates
  useEffect(() => {
    let pollInterval: NodeJS.Timeout | null = null;

    if (isProcessing && projectId) {
      console.log('🔄 Starting progress polling...');
      
      pollInterval = setInterval(async () => {
        try {
          // Get project status from backend
          const response = await fetch(`/api/projects/${projectId}/status`);
          if (response.ok) {
            const statusData = await response.json();
            
            if (statusData.success) {
              const { total, completed, success, errors } = statusData.data;
              
              // Update stats
              setStats({
                total: total || 0,
                completed: completed || 0,
                success: success || 0,
                errors: errors || 0
              });
              
              // Calculate progress percentage
              if (total > 0) {
                const progressPercent = Math.round((completed / total) * 100);
                setProgress(progressPercent);
                console.log(`📊 Progress update: ${completed}/${total} (${progressPercent}%)`);
              }
              
              // Check if processing is complete
              if (completed >= total && total > 0) {
                console.log('✅ Processing complete, stopping polling');
                setIsProcessing(false);
                isProcessingRef.current = false;
                if (pollInterval) {
                  clearInterval(pollInterval);
                }
              }
            }
          }
        } catch (error) {
          console.error('❌ Error polling progress:', error);
        }
      }, 2000); // Poll every 2 seconds
    }

    return () => {
      if (pollInterval) {
        clearInterval(pollInterval);
      }
    };
  }, [isProcessing, projectId]);

  useEffect(() => {
    // Load data from URL parameters and database
    const loadData = async () => {
      try {
        console.log('🔄 Loading data...');
        
        // Get ad account ID
        const config = await metaService.getAdAccountConfig();
        setAdAccountId(config.ad_account_id);
        console.log('✅ Ad Account ID loaded:', config.ad_account_id);

        // Get projectId from URL parameters
        const urlParams = new URLSearchParams(window.location.search);
        const projectIdParam = urlParams.get('projectId');
        const postalCodesParam = urlParams.get('postalCodes');
        
        if (projectIdParam) {
          console.log('📦 Loading data for project:', projectIdParam);
          setProjectId(projectIdParam);
          
          // Load project data from database
          const projectResult = await projectService.getProject(parseInt(projectIdParam, 10));
          if (projectResult.success && projectResult.project) {
            console.log('✅ Project loaded:', projectResult.project);
            
            // Use postal codes from URL if available, otherwise use defaults
            let postalCodesList = [];
            if (postalCodesParam) {
              try {
                postalCodesList = JSON.parse(decodeURIComponent(postalCodesParam));
                console.log('✅ Using postal codes from URL:', postalCodesList);
              } catch (error) {
                console.error('❌ Error parsing postal codes from URL:', error);
                postalCodesList = ['75001', '75002', '75003', '75004', '75005', '75006', '75007', '75008', '75009', '75010'];
              }
            } else {
              // Fallback to default postal codes
              postalCodesList = ['75001', '75002', '75003', '75004', '75005', '75006', '75007', '75008', '75009', '75010'];
              console.log('⚠️ No postal codes in URL, using defaults:', postalCodesList);
            }
            
            setPostalCodes(postalCodesList);
            setStats(prev => ({ ...prev, total: postalCodesList.length }));
            
            console.log('✅ Postal codes loaded:', postalCodesList);

            // Load existing results from database if project has results
            console.log('📋 Loading existing results for project:', projectIdParam);
            try {
              const result = await projectService.getProjectResults(parseInt(projectIdParam, 10));
              
              if (result.success && result.results && result.results.length > 0) {
                console.log('✅ Existing results found:', result.results.length, 'items');
                
                // Convertir les résultats de la base de données au format de l'interface
                const convertedResults = result.results.map((dbResult: any) => ({
                  postalCode: dbResult.postal_code,
                  country: dbResult.country_code,
                  postalCodeOnly: {
                    users_lower_bound: dbResult.postal_code_only_estimate?.data?.users_lower_bound,
                    users_upper_bound: dbResult.postal_code_only_estimate?.data?.users_upper_bound
                  },
                  withTargeting: {
                    users_lower_bound: dbResult.postal_code_with_targeting_estimate?.data?.users_lower_bound,
                    users_upper_bound: dbResult.postal_code_with_targeting_estimate?.data?.users_upper_bound
                  },
                  status: dbResult.success ? 'completed' as const : 'error' as const,
                  error: dbResult.error_message
                }));
                
                setResults(convertedResults);
                console.log('✅ Interface updated with existing results');
              } else {
                console.log('ℹ️ No existing results found, initializing empty results array');
                // Initialize results array only if no existing results
                const initialResults = postalCodesList.map((code: string) => ({
                  postalCode: code,
                  country: selectedCountry,
                  postalCodeOnly: {},
                  withTargeting: {},
                  status: 'pending' as const
                }));
                setResults(initialResults);
                console.log('✅ Results array initialized with', initialResults.length, 'items');
              }
            } catch (error) {
              console.error('❌ Error loading existing results:', error);
              // Fallback to empty results array
              const initialResults = postalCodesList.map((code: string) => ({
                postalCode: code,
                country: selectedCountry,
                postalCodeOnly: {},
                withTargeting: {},
                status: 'pending' as const
              }));
              setResults(initialResults);
              console.log('✅ Fallback: Results array initialized with', initialResults.length, 'items');
            }

            // Load targeting spec from project if available
            if (projectResult.project.targeting_spec) {
              console.log('✅ Loading targeting spec from project:', projectResult.project.targeting_spec);
              
              // Convert the targeting spec to the expected format
              const loadedTargetingSpec = projectResult.project.targeting_spec;
              let convertedTargetingSpec = { ...loadedTargetingSpec };
              
              // Keep interestGroups intact for proper AND/OR handling
              if (loadedTargetingSpec.interestGroups && loadedTargetingSpec.interestGroups.length > 0) {
                console.log('✅ Interest groups found:', loadedTargetingSpec.interestGroups.map((group: any) => ({
                  name: group.name,
                  operator: group.operator,
                  interestsCount: group.interests.length
                })));
                // Keep interestGroups as they are - don't convert to simple interests
              }
              
              // Ensure required fields are present
              if (!convertedTargetingSpec.genders || convertedTargetingSpec.genders.length === 0) {
                convertedTargetingSpec.genders = ['1', '2'];
              }
              if (!convertedTargetingSpec.device_platforms || convertedTargetingSpec.device_platforms.length === 0) {
                convertedTargetingSpec.device_platforms = ['mobile', 'desktop'];
              }
              
              console.log('✅ Converted targeting spec:', convertedTargetingSpec);
              setTargetingSpec(convertedTargetingSpec);
            } else {
              // Set default targeting spec if none is loaded
              const defaultTargetingSpec: MetaTargetingSpec = {
                age_min: 18,
                age_max: 65,
                genders: ['1', '2'],
                device_platforms: ['mobile', 'desktop']
              };
              setTargetingSpec(defaultTargetingSpec);
              console.log('✅ Default targeting spec set:', defaultTargetingSpec);
            }
          } else {
            console.error('❌ Failed to load project:', projectResult.error);
            toast.error('Erreur lors du chargement du projet');
            navigate('/projects');
            return;
          }
        } else {
          console.warn('⚠️ No projectId in URL, redirecting to projects page');
          navigate('/projects');
          return;
        }



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

  const startParallelProcessing = async () => {
    console.log('🔍 Debug - startParallelProcessing called');
    console.log('🔍 Debug - Current state:', {
      adAccountId: adAccountId || 'NOT_SET',
      targetingSpec: targetingSpec ? 'SET' : 'NOT_SET',
      postalCodesLength: postalCodes.length,
      targetingSpecDetails: targetingSpec
    });
    
             if (!adAccountId || !targetingSpec || postalCodes.length === 0) {
           toast.error('Données manquantes pour le traitement');
           console.error('Missing data:', { adAccountId, targetingSpec: !!targetingSpec, postalCodesLength: postalCodes.length });
           return;
         }

                 // Afficher un message informatif sur le traitement complet
        toast(`🚀 Lancement de l'analyse complète pour ${postalCodes.length} codes postaux. Le traitement peut prendre plusieurs minutes.`);

    // Récupérer le projectId depuis l'URL
    const urlParams = new URLSearchParams(window.location.search);
    const projectId = urlParams.get('projectId');
    console.log('🚀 Starting parallel processing with:', {
      adAccountId,
      targetingSpec,
      postalCodes,
      totalCodes: postalCodes.length,
      projectId: projectId || 'NOT_FOUND'
    });

    if (!projectId) {
      console.error('❌ No projectId found in URL');
      toast.error('Project ID manquant');
      return;
    }

    setIsProcessing(true);
    isProcessingRef.current = true;
    setProgress(0);
    setCurrentIndex(0);
    setStats(prev => ({ ...prev, completed: 0, errors: 0, success: 0 }));

    // Initialiser la progression au début
    setProgress(1); // 1% pour indiquer que le traitement va commencer
    
    // Polling des vraies statistiques de progression en temps réel
    const statsInterval = setInterval(async () => {
      if (!isProcessingRef.current) {
        clearInterval(statsInterval);
        return;
      }
      
      try {
        const response = await fetch('/api/meta/processing-status');
        if (response.ok) {
          const data = await response.json();
          if (data.success && data.data) {
            const stats = data.data;
            console.log(`📊 Real progress: ${stats.processed}/${stats.total} (${stats.successful} success, ${stats.errors} errors)`);
            
            // Mettre à jour les statistiques avec les vraies données
            setStats({
              total: stats.total || postalCodes.length,
              completed: stats.processed || 0,
              success: stats.successful || 0,
              errors: stats.errors || 0
            });
            
            // Mettre à jour la progression
            if (stats.total > 0) {
              const newProgress = (stats.processed / stats.total) * 100;
              setProgress(Math.min(newProgress, 95)); // Ne pas dépasser 95% avant la fin
            } else if (stats.isProcessing) {
              // Si le traitement est en cours mais qu'on n'a pas encore de total, afficher une progression minimale
              setProgress(5); // 5% pour indiquer que le traitement a commencé
            }
          }
        }
      } catch (error) {
        console.error('❌ Error fetching processing status:', error);
      }
    }, 1000); // Mise à jour toutes les secondes

    // Utiliser le backend pour le traitement parallèle optimisé
    try {
      const requestBody = {
        adAccountId,
        postalCodes,
        countryCode: selectedCountry,
        targetingSpec,
        projectId: parseInt(projectId, 10) // Convertir en nombre
      };

      console.log('📤 Sending request to backend:', {
        ...requestBody,
        postalCodes: `${requestBody.postalCodes.length} codes`
      });

      console.log('📤 Sending fetch request to:', '/api/meta/batch-postal-codes-reach-estimate-v2');
      let response;
      try {
                   // Utiliser le proxy du frontend
           const backendUrl = '/api/meta/batch-postal-codes-reach-estimate-v2';
           console.log('🔗 Using proxy URL:', backendUrl);
        
        // Créer un contrôleur d'abort pour le timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 secondes de timeout pour détecter plus vite les problèmes
        
                   try {
             console.log('🔍 Sending fetch request with body:', JSON.stringify(requestBody, null, 2));
         console.log('🔍 Request body size:', JSON.stringify(requestBody).length, 'characters');
         console.log('🔍 Interest groups in targeting spec:', requestBody.targetingSpec.interestGroups?.map((group: any) => ({
           name: group.name,
           operator: group.operator,
           interestsCount: group.interests.length,
           interests: group.interests.map((i: any) => i.name)
         })));
             response = await fetch(backendUrl, {
               method: 'POST',
               headers: {
                 'Content-Type': 'application/json',
               },
               body: JSON.stringify(requestBody),
               signal: controller.signal
             });
             clearTimeout(timeoutId);
                   } catch (fetchError: any) {
             clearTimeout(timeoutId);
             console.error('❌ Fetch error:', fetchError);
             console.error('❌ Error name:', fetchError.name);
             console.error('❌ Error message:', fetchError.message);
             if (fetchError.name === 'AbortError') {
               throw new Error('Request timeout after 10 seconds - La requête n\'arrive pas au backend');
             }
             throw fetchError;
           }

        console.log('📥 Response received:', {
          status: response.status,
          statusText: response.statusText,
          ok: response.ok
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('❌ Response error:', errorText);
          throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
        }
      } catch (error) {
        console.error('❌ Fetch error:', error);
        throw error;
      }

      const data = await response.json();
      console.log('✅ Backend parallel processing completed:', {
        success: data.success,
        projectId: data.data?.projectId,
        totalProcessed: data.data?.totalProcessed,
        successful: data.data?.successful,
        errors: data.data?.errors
      });

      // Vérifier s'il y a des erreurs Meta API dans la réponse
      if (data.data?.errors > 0 && data.data?.successful === 0) {
        console.warn('⚠️ Meta API errors detected:', data.data?.errorDetails);
        toast('⚠️ Limitations Meta API détectées. Certains codes postaux n\'ont pas pu être traités.');
      }

      // Récupérer les résultats depuis la base de données
      if (data.success && data.data?.projectId) {
        console.log('📋 Loading results from database for project:', data.data.projectId);
        try {
          const result = await projectService.getProjectResults(data.data.projectId);
          
          if (result.success && result.results) {
            console.log('✅ Results loaded from database:', result.results.length, 'items');
            console.log('✅ Results postal codes:', result.results.map((r: any) => r.postal_code));
            
            // Convertir les résultats de la base de données au format de l'interface
            const convertedResults = result.results.map((dbResult: any) => ({
              postalCode: dbResult.postal_code,
              country: dbResult.country_code,
              postalCodeOnly: {
                users_lower_bound: dbResult.postal_code_only_estimate?.data?.users_lower_bound,
                users_upper_bound: dbResult.postal_code_only_estimate?.data?.users_upper_bound
              },
              withTargeting: {
                users_lower_bound: dbResult.postal_code_with_targeting_estimate?.data?.users_lower_bound,
                users_upper_bound: dbResult.postal_code_with_targeting_estimate?.data?.users_upper_bound
              },
              status: dbResult.success ? 'completed' as const : 'error' as const,
              error: dbResult.error_message
            }));
            
            setResults(convertedResults);
            console.log('✅ Interface updated with database results');
          } else {
            console.error('❌ Failed to load results from database:', result.error);
          }
        } catch (error) {
          console.error('❌ Error loading results from database:', error);
        }
      }

      // Arrêter le polling des statistiques
      clearInterval(statsInterval);
      setProgress(100);

    } catch (error) {
      console.error('❌ Error during parallel processing:', error);
      
      // Détecter les erreurs Meta API
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage.includes('Meta') || errorMessage.includes('Facebook') || errorMessage.includes('rate limit') || errorMessage.includes('quota')) {
        toast.error('⚠️ Limitations Meta API atteintes. Le traitement a échoué à cause des quotas dépassés.');
        setProgress(0); // Réinitialiser la progression
      } else {
        toast.error('Erreur lors du traitement parallèle des codes postaux');
      }
    } finally {
      setIsProcessing(false);
      isProcessingRef.current = false;
      toast.success('Traitement terminé !');
    }
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
                  onClick={startParallelProcessing}
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
            {/* Status message */}
            <div className="mt-2 text-sm text-gray-600">
              {isProcessing ? (
                progress === 0 ? (
                  <span className="text-yellow-600">⏳ Initialisation du traitement...</span>
                ) : progress < 5 ? (
                  <span className="text-blue-600">🔄 Traitement en cours...</span>
                ) : (
                  <span className="text-blue-600">🔄 Traitement en cours - {stats.completed}/{stats.total} codes traités</span>
                )
              ) : (
                <span className="text-green-600">✅ Traitement terminé</span>
              )}
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
                  <tr key={`${result.postalCode}-${index}`} className={index === currentIndex && isProcessing ? 'bg-blue-50' : ''}>
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
