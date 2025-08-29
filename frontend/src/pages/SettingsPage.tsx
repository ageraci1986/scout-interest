import React from 'react';
import Layout from '../components/Layout';
import RateLimitSettings from '../components/RateLimitSettings';

const SettingsPage: React.FC = () => {
  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              ⚙️ Paramètres
            </h1>
            <p className="text-gray-600">
              Configurez les limitations API et optimisez les performances de traitement
            </p>
          </div>

          <RateLimitSettings />
        </div>
      </div>
    </Layout>
  );
};

export default SettingsPage;


