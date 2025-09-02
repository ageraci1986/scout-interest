import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import uploadService, { UploadResponse } from '../services/uploadService';
import projectService from '../services/projectService';
import toast from 'react-hot-toast';

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);

  const onDrop = (acceptedFiles: File[]) => {
    setUploadedFiles(acceptedFiles);
    setUploadResult(null);
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'text/csv': ['.csv'],
    },
    multiple: false,
  });

  const handleUpload = async () => {
    if (uploadedFiles.length === 0) {
      toast.error('Please select a file first');
      return;
    }

    setIsUploading(true);
    try {
      console.log('📤 Starting file upload...');
      console.log('📁 File:', uploadedFiles[0].name, 'Size:', uploadedFiles[0].size);
      
      const result = await uploadService.uploadFile(uploadedFiles[0]);
      console.log('✅ Upload successful:', result);
      
      setUploadResult(result);
      
      // Save postal codes to localStorage for the results page
      if (result.success && result.results) {
        console.log('📋 Upload result data:', result);
        console.log('📋 Project ID:', result.project_id);
        console.log('📋 Results count:', result.results.length);
        console.log('📋 Summary:', result.summary);
        
        // Extract postal codes from results
        const postalCodes = result.results
          .filter(r => r.success)
          .map(r => r.postal_code)
          .filter((code: string, index: number, arr: string[]) => arr.indexOf(code) === index); // Remove duplicates
        
        console.log('📦 Extracted postal codes:', postalCodes);
        
        // Store postal codes in localStorage
        localStorage.setItem('uploadedPostalCodes', JSON.stringify(postalCodes));
        localStorage.setItem('uploadedPostalCodesCount', postalCodes.length.toString());
        localStorage.setItem('uploadedPostalCodesTotal', postalCodes.length.toString());
        localStorage.setItem('useBackendStorage', 'false');
        
        console.log('✅ Saved postal codes to storage:', postalCodes.length, 'total codes');
        
        if (postalCodes.length === 0) {
          console.warn('⚠️ No postal codes extracted from the file!');
          toast.error('No postal codes found in the file. Please check your file format.');
        } else {
          toast.success(`File uploaded successfully! ${postalCodes.length} postal codes detected.`);
          
          // Navigate to results page
          navigate('/results', { 
            state: { 
              projectId: result.project_id,
              postalCodes: postalCodes,
              filename: uploadedFiles[0].name
            }
          });
        }
      } else {
        console.error('❌ Upload failed:', result);
        toast.error('Upload failed. Please try again.');
      }
    } catch (error: any) {
      console.error('❌ Upload error:', error);
      toast.error(`Upload error: ${error.message}`);
    } finally {
      setIsUploading(false);
    }
  };

  const handleContinueToAnalysis = () => {
    if (uploadResult && uploadResult.success) {
      navigate('/targeting', { 
        state: { 
          projectId: uploadResult.project_id,
          filename: uploadedFiles[0].name
        }
      });
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">Upload de Fichier</h1>
        <p className="text-gray-600">
          Téléchargez votre fichier Excel ou CSV contenant des codes postaux pour commencer l'analyse
        </p>
      </div>

      {/* Zone de drop */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-primary-500 bg-primary-50'
            : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        <div className="space-y-4">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          
          {isDragActive ? (
            <div>
              <p className="text-lg font-medium text-primary-600">Déposez le fichier ici...</p>
            </div>
          ) : (
            <div>
              <p className="text-lg font-medium text-gray-900">
                Glissez-déposez votre fichier ici, ou cliquez pour sélectionner
              </p>
              <p className="text-sm text-gray-500 mt-2">
                Formats supportés: .xlsx, .xls, .csv
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Fichiers sélectionnés */}
      {uploadedFiles.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-medium text-gray-900 mb-3">Fichier sélectionné:</h3>
          <div className="bg-white rounded-lg border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <p className="font-medium text-gray-900">{uploadedFiles[0].name}</p>
                  <p className="text-sm text-gray-500">
                    {(uploadedFiles[0].size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>
              
              <button
                onClick={() => setUploadedFiles([])}
                className="text-red-500 hover:text-red-700"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Bouton d'upload */}
      {uploadedFiles.length > 0 && !uploadResult && (
        <div className="mt-6 text-center">
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className="btn-primary text-lg px-8 py-3 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isUploading ? (
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                <span>Upload en cours...</span>
              </div>
            ) : (
              'Uploader le Fichier'
            )}
          </button>
        </div>
      )}

      {/* Résultat de l'upload */}
      {uploadResult && (
        <div className="mt-8">
          <div className="bg-white rounded-lg border border-gray-200 p-6">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">Upload Réussi !</h3>
              <p className="text-gray-600">
                Votre fichier a été traité avec succès
              </p>
            </div>

            {/* Résumé */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="text-center p-4 bg-gray-50 rounded-lg">
                <div className="text-2xl font-bold text-gray-900">{uploadResult.summary.total}</div>
                <div className="text-sm text-gray-600">Codes postaux</div>
              </div>
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">{uploadResult.summary.success}</div>
                <div className="text-sm text-green-600">Traités</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{uploadResult.summary.error}</div>
                <div className="text-sm text-red-600">Erreurs</div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => navigate('/results', { 
                  state: { 
                    projectId: uploadResult.project_id,
                    filename: uploadedFiles[0].name
                  }
                })}
                className="btn-secondary"
              >
                Voir les Résultats
              </button>
              
              <button
                onClick={handleContinueToAnalysis}
                className="btn-primary"
              >
                Continuer vers l'Analyse
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UploadPage;
