import React from 'react';
import { Interest } from '../services/metaService';

interface SelectedInterestsProps {
  interests: Interest[];
  onRemoveInterest: (interestId: string) => void;
}

const SelectedInterests: React.FC<SelectedInterestsProps> = ({ interests, onRemoveInterest }) => {
  // Format audience size
  const formatAudienceSize = (size: number): string => {
    if (size >= 1000000) {
      return `${(size / 1000000).toFixed(1)}M`;
    } else if (size >= 1000) {
      return `${(size / 1000).toFixed(1)}K`;
    }
    return size.toString();
  };

  // Calculate total audience size
  const totalAudienceSize = interests.reduce((total, interest) => total + interest.audience_size, 0);

  if (interests.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <p>Aucun intérêt sélectionné</p>
        <p className="text-sm">Recherchez et sélectionnez des intérêts pour commencer</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex justify-between items-center">
          <div>
            <h3 className="text-lg font-semibold text-blue-900">
              {interests.length} intérêt{interests.length > 1 ? 's' : ''} sélectionné{interests.length > 1 ? 's' : ''}
            </h3>
            <p className="text-blue-700">
              Audience totale estimée: <span className="font-semibold">{formatAudienceSize(totalAudienceSize)}</span>
            </p>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">
              {formatAudienceSize(totalAudienceSize)}
            </div>
            <div className="text-sm text-blue-600">personnes</div>
          </div>
        </div>
      </div>

      {/* Interests List */}
      <div className="space-y-3">
        {interests.map((interest) => (
          <div
            key={interest.id}
            className="flex items-center justify-between p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
          >
            <div className="flex-1">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                  <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h4 className="font-medium text-gray-900">{interest.name}</h4>
                  <p className="text-sm text-gray-500">{interest.description}</p>
                  <div className="text-xs text-gray-400 mt-1">
                    {interest.path.join(' > ')}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <div className="font-semibold text-gray-900">
                  {formatAudienceSize(interest.audience_size)}
                </div>
                <div className="text-xs text-gray-500">personnes</div>
              </div>
              
              <button
                onClick={() => onRemoveInterest(interest.id)}
                className="text-gray-400 hover:text-red-500 transition-colors"
                title="Supprimer cet intérêt"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Clear All Button */}
      {interests.length > 1 && (
        <div className="text-center">
          <button
            onClick={() => interests.forEach(interest => onRemoveInterest(interest.id))}
            className="text-sm text-gray-500 hover:text-red-500 transition-colors"
          >
            Supprimer tous les intérêts
          </button>
        </div>
      )}
    </div>
  );
};

export default SelectedInterests;
