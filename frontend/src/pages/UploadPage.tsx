import React, { useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useNavigate } from 'react-router-dom';
import uploadService, { UploadResponse, ValidationResponse } from '../services/uploadService';
import toast from 'react-hot-toast';

const UploadPage: React.FC = () => {
  const navigate = useNavigate();
  const [uploadedFiles, setUploadedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [validationResult, setValidationResult] = useState<ValidationResponse | null>(null);

  const onDrop = (acceptedFiles: File[]) => {
    setUploadedFiles(acceptedFiles);
    setUploadResult(null);
    setValidationResult(null);
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
      const result = await uploadService.uploadFile(uploadedFiles[0]);
      setUploadResult(result);
      
      // Save postal codes to localStorage for the results page
      if (result.data && result.data.statistics) {
        console.log('📋 Upload result data:', result.data);
        console.log('📋 Headers:', result.data.headers);
        console.log('📋 Preview rows:', result.data.preview?.rows);
        
        // Find the postal code column more robustly
        const postalCodeColumnIndex = result.data.headers.findIndex((header: string) => {
          const lowerHeader = header.toLowerCase();
          return lowerHeader.includes('postal') || 
                 lowerHeader.includes('code') || 
                 lowerHeader.includes('zip') ||
                 lowerHeader.includes('cp') ||
                 lowerHeader.includes('postcode');
        });
        
        console.log('🔍 Postal code column index:', postalCodeColumnIndex);
        console.log('🔍 Postal code column name:', postalCodeColumnIndex >= 0 ? result.data.headers[postalCodeColumnIndex] : 'Not found');
        
        let postalCodes: string[] = [];
        
        if (postalCodeColumnIndex >= 0 && result.data.preview?.rows) {
          postalCodes = result.data.preview.rows
            .map((row: any) => {
              const code = row.data[postalCodeColumnIndex];
              return code && code.toString().trim() !== '' ? code.toString().trim() : null;
            })
            .filter((code: string | null) => code !== null);
        } else {
          // Fallback: try to extract from any column that looks like postal codes
          console.log('⚠️ No specific postal code column found, trying fallback extraction...');
          if (result.data.preview?.rows) {
            postalCodes = result.data.preview.rows
              .flatMap((row: any) => 
                row.data
                  .map((cell: any) => cell?.toString().trim())
                  .filter((cell: string) => {
                    // Look for patterns that look like postal codes (5 digits for US, 5 digits for FR, etc.)
                    return /^\d{5}$/.test(cell) || /^\d{4,6}$/.test(cell);
                  })
              )
              .filter((code: string, index: number, arr: string[]) => arr.indexOf(code) === index); // Remove duplicates
          }
        }
        
        console.log('📦 Extracted postal codes:', postalCodes);
        
        // Save to localStorage
        localStorage.setItem('uploadedPostalCodes', JSON.stringify(postalCodes));
        localStorage.setItem('uploadedPostalCodesCount', postalCodes.length.toString());
        console.log('✅ Saved postal codes to localStorage:', postalCodes);
        
        if (postalCodes.length === 0) {
          console.warn('⚠️ No postal codes extracted from the file!');
          toast.error('Aucun code postal trouvé dans le fichier. Vérifiez le format de votre fichier.');
        }
      }
      
      toast.success('File uploaded and processed successfully!');
    } catch (error) {
      console.error('Upload error:', error);
      toast.error('Upload failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleValidate = async () => {
    if (uploadedFiles.length === 0) {
      toast.error('Please select a file first');
      return;
    }

    setIsUploading(true);
    try {
      const result = await uploadService.validateFile(uploadedFiles[0]);
      setValidationResult(result);
      toast.success('File validated successfully!');
    } catch (error) {
      console.error('Validation error:', error);
      toast.error('Validation failed. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Upload de vos codes postaux
        </h1>
        <p className="text-lg text-gray-600">
          Importez votre fichier Excel ou CSV contenant vos codes postaux pour commencer l'analyse.
        </p>
      </div>

      {/* Upload Zone */}
      <div className="card">
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors duration-200 ${
            isDragActive
              ? 'border-primary-400 bg-primary-50'
              : 'border-gray-300 hover:border-primary-400 hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          <div className="space-y-4">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto">
              <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
            </div>
            <div>
              <p className="text-lg font-medium text-gray-900">
                {isDragActive ? 'Déposez le fichier ici' : 'Glissez-déposez votre fichier ici'}
              </p>
              <p className="text-gray-500 mt-2">ou cliquez pour sélectionner</p>
            </div>
            <p className="text-sm text-gray-400">
              Formats supportés: .xlsx, .xls, .csv (max 10MB)
            </p>
          </div>
        </div>
      </div>

      {/* File Preview */}
      {uploadedFiles.length > 0 && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Fichier sélectionné
          </h3>
          <div className="space-y-3">
            {uploadedFiles.map((file, index) => (
              <div key={index} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{file.name}</p>
                    <p className="text-sm text-gray-500">
                      {(file.size / 1024 / 1024).toFixed(2)} MB
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setUploadedFiles([])}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Buttons */}
      {uploadedFiles.length > 0 && (
        <div className="flex justify-center space-x-4">
          <button
            onClick={handleValidate}
            disabled={isUploading}
            className={`btn-secondary text-lg px-6 py-3 ${
              isUploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isUploading ? (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-gray-600 border-t-transparent rounded-full animate-spin"></div>
                <span>Validation...</span>
              </div>
            ) : (
              'Valider le fichier'
            )}
          </button>
          <button
            onClick={handleUpload}
            disabled={isUploading}
            className={`btn-primary text-lg px-8 py-3 ${
              isUploading ? 'opacity-50 cursor-not-allowed' : ''
            }`}
          >
            {isUploading ? (
              <div className="flex items-center space-x-2">
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                <span>Upload en cours...</span>
              </div>
            ) : (
              'Continuer vers l\'analyse'
            )}
          </button>
        </div>
      )}

      {/* Validation Results */}
      {validationResult && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Résultats de la validation
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{validationResult.data.statistics.valid}</div>
              <div className="text-sm text-green-700">Codes postaux valides</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{validationResult.data.statistics.invalid}</div>
              <div className="text-sm text-red-700">Codes postaux invalides</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{validationResult.data.statistics.duplicates}</div>
              <div className="text-sm text-yellow-700">Doublons</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{validationResult.data.statistics.total}</div>
              <div className="text-sm text-blue-700">Total</div>
            </div>
          </div>
          
          {/* Preview Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {validationResult.data.headers.map((header, index) => (
                    <th key={index} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {validationResult.data.preview.rows.slice(0, 5).map((row, index) => (
                  <tr key={index}>
                    {row.data.map((cell: any, cellIndex: number) => (
                      <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Upload Results */}
      {uploadResult && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">
            Fichier traité avec succès
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{uploadResult.data.statistics.valid}</div>
              <div className="text-sm text-green-700">Codes postaux valides</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{uploadResult.data.statistics.invalid}</div>
              <div className="text-sm text-red-700">Codes postaux invalides</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{uploadResult.data.statistics.duplicates}</div>
              <div className="text-sm text-yellow-700">Doublons</div>
            </div>
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{uploadResult.data.statistics.total}</div>
              <div className="text-sm text-blue-700">Total</div>
            </div>
          </div>
          
          <div className="text-center">
            <button 
              onClick={() => {
                // Save upload ID to localStorage for tracking
                localStorage.setItem('currentUploadId', uploadResult.data.uploadId.toString());
                // Create a mock project ID for now (in real app, this would come from user session)
                const projectId = uploadResult.data.uploadId;
                localStorage.setItem('currentProjectId', projectId.toString());
                navigate(`/targeting?projectId=${projectId}`);
              }}
              className="btn-primary"
            >
              Continuer vers le targeting
            </button>
          </div>
        </div>
      )}

      {/* Instructions */}
      <div className="card bg-blue-50 border-blue-200">
        <h3 className="text-lg font-semibold text-blue-900 mb-3">
          Instructions pour le format du fichier
        </h3>
        <div className="space-y-2 text-blue-800">
          <p>• Votre fichier doit contenir une colonne avec les codes postaux</p>
          <p>• Les codes postaux peuvent être dans n'importe quelle colonne</p>
          <p>• Formats supportés: Excel (.xlsx, .xls) et CSV</p>
          <p>• Taille maximale: 10 MB</p>
          <p>• Nous détecterons automatiquement la colonne des codes postaux</p>
        </div>
      </div>
    </div>
  );
};

export default UploadPage;
