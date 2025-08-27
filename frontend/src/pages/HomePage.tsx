import React from 'react';
import { Link } from 'react-router-dom';

const HomePage: React.FC = () => {
  return (
    <div className="space-y-8">
      {/* Hero Section */}
      <div className="text-center py-12">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Analysez votre audience Meta avec précision
        </h1>
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
          Scout Interest vous permet d'analyser la taille d'audience Meta pour vos codes postaux 
          croisés avec des critères d'intérêt spécifiques. Optimisez vos campagnes publicitaires 
          avec des données géolocalisées précises.
        </p>
        <div className="flex justify-center space-x-4">
          <Link
            to="/upload"
            className="btn-primary text-lg px-8 py-3"
          >
            Commencer l'analyse
          </Link>
          <button className="btn-secondary text-lg px-8 py-3">
            Voir la démo
          </button>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-3 gap-8">
        <div className="card text-center">
          <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Upload de fichiers
          </h3>
          <p className="text-gray-600">
            Importez vos listes de codes postaux depuis Excel ou CSV avec validation automatique.
          </p>
        </div>

        <div className="card text-center">
          <div className="w-12 h-12 bg-success-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-success-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Analyse en temps réel
          </h3>
          <p className="text-gray-600">
            Suivez le progrès de votre analyse avec des graphiques et métriques en temps réel.
          </p>
        </div>

        <div className="card text-center">
          <div className="w-12 h-12 bg-warning-100 rounded-lg flex items-center justify-center mx-auto mb-4">
            <svg className="w-6 h-6 text-warning-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Export complet
          </h3>
          <p className="text-gray-600">
            Exportez vos résultats en Excel, CSV, JSON ou PDF avec des visualisations avancées.
          </p>
        </div>
      </div>

      {/* Stats Section */}
      <div className="card">
        <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
          Statistiques de performance
        </h2>
        <div className="grid md:grid-cols-4 gap-6">
          <div className="text-center">
            <div className="text-3xl font-bold text-primary-600">200+</div>
            <div className="text-sm text-gray-600">Appels API/heure</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-success-600">99.9%</div>
            <div className="text-sm text-gray-600">Taux de succès</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-warning-600">&lt;2s</div>
            <div className="text-sm text-gray-600">Temps de réponse</div>
          </div>
          <div className="text-center">
            <div className="text-3xl font-bold text-error-600">24/7</div>
            <div className="text-sm text-gray-600">Monitoring</div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="card bg-gradient-to-r from-primary-600 to-primary-700 text-white text-center">
        <h2 className="text-2xl font-bold mb-4">
          Prêt à optimiser vos campagnes Meta ?
        </h2>
        <p className="text-primary-100 mb-6">
          Rejoignez des centaines d'annonceurs qui utilisent Scout Interest pour maximiser leur ROI.
        </p>
        <Link
          to="/upload"
          className="bg-white text-primary-600 hover:bg-gray-100 font-medium py-3 px-8 rounded-lg transition-colors duration-200"
        >
          Commencer maintenant
        </Link>
      </div>
    </div>
  );
};

export default HomePage;
