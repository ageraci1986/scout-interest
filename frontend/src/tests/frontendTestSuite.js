/**
 * Suite de tests complète pour Scout Interest Frontend
 * Teste TOUTES les étapes du processus utilisateur côté frontend
 */

// Configuration des tests
const TEST_CONFIG = {
  // URL de base - sera mise à jour après déploiement
  BASE_URL: process.env.REACT_APP_TEST_URL || window.location.origin,
  API_URL: '/api',
  
  // Données de test
  TEST_FILE_CONTENT: 'postal_code\n10001\n90210\n60601\n33101\n77001',
  TEST_FILE_NAME: 'test-postal-codes.csv',
  TEST_POSTAL_CODES: ['10001', '90210', '60601', '33101', '77001'],
  
  // Timeout pour les tests
  TIMEOUT: 30000
};

class FrontendTestSuite {
  constructor() {
    this.results = {
      total: 0,
      passed: 0,
      failed: 0,
      errors: []
    };
    this.testData = {
      projectId: null,
      postalCodes: [],
      targetingSpec: null
    };
    
    // Créer un conteneur de test dans le DOM
    this.createTestContainer();
  }

  // Créer un conteneur pour les tests
  createTestContainer() {
    const container = document.createElement('div');
    container.id = 'test-container';
    container.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0,0,0,0.9);
      color: white;
      padding: 20px;
      overflow-y: auto;
      z-index: 10000;
      font-family: monospace;
      font-size: 14px;
      line-height: 1.4;
    `;
    document.body.appendChild(container);
    this.container = container;
  }

  // Utilitaire pour les logs
  log(emoji, message) {
    const logMessage = `${emoji} ${message}`;
    console.log(logMessage);
    
    const logElement = document.createElement('div');
    logElement.textContent = logMessage;
    logElement.style.marginBottom = '5px';
    this.container.appendChild(logElement);
    
    // Auto-scroll
    this.container.scrollTop = this.container.scrollHeight;
  }

  // Utilitaire pour les assertions
  assert(condition, message) {
    this.results.total++;
    if (condition) {
      this.results.passed++;
      this.log('✅', `PASS: ${message}`);
      return true;
    } else {
      this.results.failed++;
      this.results.errors.push(message);
      this.log('❌', `FAIL: ${message}`);
      return false;
    }
  }

  // Utilitaire pour attendre
  wait(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Test des services frontend
  async testFrontendServices() {
    this.log('🔧', 'Testing Frontend Services...');

    try {
      // Test ProjectService
      const { default: projectService } = await import('../services/projectService');
      this.assert(typeof projectService.getUserProjects === 'function', 'ProjectService has getUserProjects method');
      this.assert(typeof projectService.createProject === 'function', 'ProjectService has createProject method');
      this.assert(typeof projectService.getProject === 'function', 'ProjectService has getProject method');
      this.assert(typeof projectService.updateProject === 'function', 'ProjectService has updateProject method');

      // Test UploadService
      const { default: uploadService } = await import('../services/uploadService');
      this.assert(typeof uploadService.uploadFile === 'function', 'UploadService has uploadFile method');

      // Test MetaService
      const { default: metaService } = await import('../services/metaService');
      this.assert(typeof metaService.searchInterests === 'function', 'MetaService has searchInterests method');
      this.assert(typeof metaService.getReachEstimate === 'function', 'MetaService has getReachEstimate method');

    } catch (error) {
      this.assert(false, `Frontend services test failed: ${error.message}`);
    }
  }

  // Test de chargement des projets
  async testLoadProjects() {
    this.log('📋', 'Testing Load Projects...');

    try {
      const { default: projectService } = await import('../services/projectService');
      const projects = await projectService.getUserProjects('anonymous');
      
      this.assert(Array.isArray(projects), 'getUserProjects returns array');
      this.log('📊', `Found ${projects.length} existing projects`);
      
    } catch (error) {
      this.assert(false, `Load projects failed: ${error.message}`);
    }
  }

  // Test d'upload de fichier (simulation)
  async testFileUpload() {
    this.log('📤', 'Testing File Upload...');

    try {
      // Créer un fichier simulé
      const fileContent = TEST_CONFIG.TEST_FILE_CONTENT;
      const file = new Blob([fileContent], { type: 'text/csv' });
      file.name = TEST_CONFIG.TEST_FILE_NAME;

      const { default: uploadService } = await import('../services/uploadService');
      const result = await uploadService.uploadFile(file);

      this.assert(result.success === true, 'File upload returns success');
      this.assert(result.project_id, 'File upload returns project ID');
      this.assert(Array.isArray(result.results), 'File upload returns results array');
      this.assert(result.results.length === TEST_CONFIG.TEST_POSTAL_CODES.length, 
                 `File upload processes all ${TEST_CONFIG.TEST_POSTAL_CODES.length} postal codes`);

      // Sauvegarder les données pour les tests suivants
      this.testData.projectId = result.project_id;
      this.testData.postalCodes = TEST_CONFIG.TEST_POSTAL_CODES;

      this.log('📊', `Created project: ${this.testData.projectId}`);

    } catch (error) {
      this.assert(false, `File upload failed: ${error.message}`);
    }
  }

  // Test de récupération d'un projet
  async testGetProject() {
    this.log('📖', 'Testing Get Project...');

    if (!this.testData.projectId) {
      this.assert(false, 'No project ID available for get project test');
      return;
    }

    try {
      const { default: projectService } = await import('../services/projectService');
      const project = await projectService.getProject(this.testData.projectId);

      this.assert(project.id === this.testData.projectId, 'Get project returns correct ID');
      this.assert(project.name, 'Get project returns name');
      this.assert(project.status, 'Get project returns status');

    } catch (error) {
      this.assert(false, `Get project failed: ${error.message}`);
    }
  }

  // Test de recherche d'intérêts
  async testInterestSearch() {
    this.log('🔍', 'Testing Interest Search...');

    try {
      const { default: metaService } = await import('../services/metaService');
      const searchQueries = ['technology', 'business', 'finance'];

      for (const query of searchQueries) {
        const interests = await metaService.searchInterests(query);

        this.assert(Array.isArray(interests), `Interest search for "${query}" returns array`);
        this.assert(interests.length > 0, `Interest search for "${query}" returns results`);

        if (interests.length > 0) {
          const firstInterest = interests[0];
          this.assert(firstInterest.id, 'Interest has ID');
          this.assert(firstInterest.name, 'Interest has name');
        }
      }

    } catch (error) {
      this.assert(false, `Interest search failed: ${error.message}`);
    }
  }

  // Test d'estimation d'audience
  async testReachEstimate() {
    this.log('🎯', 'Testing Reach Estimate...');

    try {
      const { default: metaService } = await import('../services/metaService');
      
      const advancedTargetingSpec = {
        interestGroups: [
          {
            id: 'test-group',
            name: 'Technology',
            operator: 'OR',
            interests: [
              { id: '6002714398572', name: 'Technology', audience_size: 1000000, path: ['Technology'] }
            ]
          }
        ],
        age_min: 25,
        age_max: 45,
        genders: ['1'],
        device_platforms: ['mobile'],
        countries: ['US']
      };

      const estimate = await metaService.getReachEstimate('act_323074088483830', advancedTargetingSpec);

      this.assert(estimate, 'Reach estimate returns data');
      this.assert(typeof estimate.users_lower_bound === 'number', 'Reach estimate has lower bound');
      this.assert(typeof estimate.users_upper_bound === 'number', 'Reach estimate has upper bound');

      this.testData.targetingSpec = advancedTargetingSpec;

    } catch (error) {
      this.assert(false, `Reach estimate failed: ${error.message}`);
    }
  }

  // Test de sauvegarde du targeting
  async testSaveTargeting() {
    this.log('💾', 'Testing Save Targeting...');

    if (!this.testData.projectId || !this.testData.targetingSpec) {
      this.assert(false, 'Missing project ID or targeting spec for save targeting test');
      return;
    }

    try {
      const { default: projectService } = await import('../services/projectService');
      
      const updatedProject = await projectService.updateProject(
        this.testData.projectId, 
        { targeting_spec: this.testData.targetingSpec }
      );

      this.assert(updatedProject.id === this.testData.projectId, 'Save targeting returns correct project ID');

    } catch (error) {
      this.assert(false, `Save targeting failed: ${error.message}`);
    }
  }

  // Test du traitement parallèle
  async testParallelProcessing() {
    this.log('⚡', 'Testing Parallel Processing...');

    if (!this.testData.projectId || !this.testData.targetingSpec || !this.testData.postalCodes.length) {
      this.assert(false, 'Missing data for parallel processing test');
      return;
    }

    try {
      // Simuler l'appel au traitement parallèle
      const response = await fetch('/api/meta/batch-postal-codes-reach-estimate-v2', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          adAccountId: 'act_323074088483830',
          postalCodes: this.testData.postalCodes,
          countryCode: 'US',
          targetingSpec: this.testData.targetingSpec,
          projectId: this.testData.projectId
        })
      });

      const result = await response.json();

      this.assert(response.ok, 'Parallel processing request succeeds');
      this.assert(result.success === true, 'Parallel processing returns success');
      this.assert(result.data.totalProcessed === this.testData.postalCodes.length, 
                 'Parallel processing handles all postal codes');
      this.assert(result.data.successful > 0, 'Parallel processing has successful results');
      this.assert(Array.isArray(result.data.results), 'Parallel processing returns results array');

      // Vérifier la structure des résultats
      const results = result.data.results;
      if (results.length > 0) {
        const firstResult = results[0];
        this.assert(firstResult.postalCode, 'Result has postal code');
        this.assert(firstResult.success !== undefined, 'Result has success flag');

        if (firstResult.success) {
          this.assert(firstResult.postalCodeOnlyEstimate, 'Successful result has baseline estimate');
          this.assert(firstResult.postalCodeWithTargetingEstimate, 'Successful result has targeted estimate');
        }
      }

      this.log('📊', `Processed: ${result.data.totalProcessed}, Success: ${result.data.successful}, Errors: ${result.data.errors || 0}`);

    } catch (error) {
      this.assert(false, `Parallel processing failed: ${error.message}`);
    }
  }

  // Test de conversion des données
  async testDataConversion() {
    this.log('🔄', 'Testing Data Conversion...');

    // Test de conversion des résultats backend vers frontend
    const mockBackendResult = {
      postalCode: '75001',
      countryCode: 'US',
      success: true,
      postalCodeOnlyEstimate: {
        data: {
          users_lower_bound: 50000,
          users_upper_bound: 60000,
          estimate_ready: true
        }
      },
      postalCodeWithTargetingEstimate: {
        data: {
          users_lower_bound: 30000,
          users_upper_bound: 40000,
          estimate_ready: true
        }
      }
    };

    // Simuler la conversion comme dans ResultsPage
    const converted = {
      postalCode: mockBackendResult.postalCode || mockBackendResult.postal_code,
      country: mockBackendResult.countryCode || mockBackendResult.country_code,
      postalCodeOnly: {
        users_lower_bound: mockBackendResult.postalCodeOnlyEstimate?.data?.users_lower_bound || 
                          mockBackendResult.postal_code_only_estimate?.data?.users_lower_bound,
        users_upper_bound: mockBackendResult.postalCodeOnlyEstimate?.data?.users_upper_bound || 
                          mockBackendResult.postal_code_only_estimate?.data?.users_upper_bound
      },
      withTargeting: {
        users_lower_bound: mockBackendResult.postalCodeWithTargetingEstimate?.data?.users_lower_bound || 
                          mockBackendResult.postal_code_with_targeting_estimate?.data?.users_lower_bound,
        users_upper_bound: mockBackendResult.postalCodeWithTargetingEstimate?.data?.users_upper_bound || 
                          mockBackendResult.postal_code_with_targeting_estimate?.data?.users_upper_bound
      },
      status: mockBackendResult.success ? 'completed' : 'error',
      error: mockBackendResult.error_message
    };

    this.assert(converted.postalCode === '75001', 'Data conversion preserves postal code');
    this.assert(converted.country === 'US', 'Data conversion preserves country');
    this.assert(converted.postalCodeOnly.users_lower_bound === 50000, 'Data conversion preserves baseline estimate');
    this.assert(converted.withTargeting.users_lower_bound === 30000, 'Data conversion preserves targeted estimate');
    this.assert(converted.status === 'completed', 'Data conversion sets correct status');

    // Vérifier l'impact du targeting
    const hasTargetingImpact = converted.withTargeting.users_lower_bound && 
                             converted.postalCodeOnly.users_lower_bound &&
                             converted.withTargeting.users_lower_bound !== converted.postalCodeOnly.users_lower_bound;

    this.assert(hasTargetingImpact, 'Data conversion detects targeting impact');

    const impactPercentage = ((converted.postalCodeOnly.users_lower_bound - converted.withTargeting.users_lower_bound) / 
                             converted.postalCodeOnly.users_lower_bound * 100).toFixed(1);

    this.assert(parseFloat(impactPercentage) > 0, 'Targeting impact calculation is positive');
    this.log('📈', `Targeting impact: ${impactPercentage}% reduction`);
  }

  // Test de localStorage
  async testLocalStorage() {
    this.log('💾', 'Testing LocalStorage...');

    try {
      // Test de sauvegarde des codes postaux
      const testPostalCodes = ['10001', '90210', '60601'];
      localStorage.setItem('uploadedPostalCodes', JSON.stringify(testPostalCodes));

      const retrieved = JSON.parse(localStorage.getItem('uploadedPostalCodes') || '[]');
      this.assert(Array.isArray(retrieved), 'LocalStorage stores postal codes as array');
      this.assert(retrieved.length === testPostalCodes.length, 'LocalStorage preserves postal codes count');
      this.assert(retrieved[0] === testPostalCodes[0], 'LocalStorage preserves postal codes content');

      // Test de sauvegarde de l'ad account ID
      const testAdAccountId = 'act_123456789';
      localStorage.setItem('adAccountId', testAdAccountId);

      const retrievedAdAccountId = localStorage.getItem('adAccountId');
      this.assert(retrievedAdAccountId === testAdAccountId, 'LocalStorage stores ad account ID');

      // Nettoyer
      localStorage.removeItem('uploadedPostalCodes');
      localStorage.removeItem('adAccountId');

    } catch (error) {
      this.assert(false, `LocalStorage test failed: ${error.message}`);
    }
  }

  // Exécuter tous les tests
  async runAllTests() {
    this.log('🚀', 'Starting Complete Frontend Test Suite...');
    this.log('🌐', `Testing against: ${TEST_CONFIG.BASE_URL}`);
    this.log('', ''); // Ligne vide

    const tests = [
      () => this.testFrontendServices(),
      () => this.testLocalStorage(),
      () => this.testLoadProjects(),
      () => this.testFileUpload(),
      () => this.testGetProject(),
      () => this.testInterestSearch(),
      () => this.testReachEstimate(),
      () => this.testSaveTargeting(),
      () => this.testParallelProcessing(),
      () => this.testDataConversion()
    ];

    for (const test of tests) {
      try {
        await test();
        this.log('', ''); // Ligne vide entre les tests
        await this.wait(500); // Petite pause entre les tests
      } catch (error) {
        this.assert(false, `Test execution error: ${error.message}`);
        this.log('', '');
      }
    }

    this.printSummary();
  }

  // Afficher le résumé des tests
  printSummary() {
    this.log('', '='.repeat(60));
    this.log('📊', 'FRONTEND TEST SUITE SUMMARY');
    this.log('', '='.repeat(60));
    
    this.log('📋', `Total Tests: ${this.results.total}`);
    this.log('✅', `Passed: ${this.results.passed}`);
    this.log('❌', `Failed: ${this.results.failed}`);
    
    const successRate = ((this.results.passed / this.results.total) * 100).toFixed(1);
    this.log('📈', `Success Rate: ${successRate}%`);
    
    if (this.results.failed > 0) {
      this.log('', '');
      this.log('❌', 'Failed Tests:');
      this.results.errors.forEach(error => this.log('', `   - ${error}`));
    }
    
    this.log('', '');
    if (this.results.failed === 0) {
      this.log('🎉', 'ALL FRONTEND TESTS PASSED! UI is ready for users.');
    } else {
      this.log('🚨', 'SOME TESTS FAILED! Fix issues before deployment.');
    }

    // Ajouter un bouton pour fermer
    const closeButton = document.createElement('button');
    closeButton.textContent = 'Close Test Results';
    closeButton.style.cssText = `
      position: fixed;
      top: 20px;
      right: 20px;
      padding: 10px 20px;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 5px;
      cursor: pointer;
      font-size: 16px;
      z-index: 10001;
    `;
    closeButton.onclick = () => {
      document.body.removeChild(this.container);
      document.body.removeChild(closeButton);
    };
    document.body.appendChild(closeButton);
    
    return this.results.failed === 0;
  }
}

// Fonction pour lancer les tests depuis la console
window.runFrontendTests = async function() {
  const testSuite = new FrontendTestSuite();
  return await testSuite.runAllTests();
};

// Export pour utilisation dans d'autres modules
export { FrontendTestSuite, TEST_CONFIG };
