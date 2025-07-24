'use client';

import { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import { Upload, File, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';

interface UploadResult {
  success: boolean;
  data?: {
    filename: string;
    size: number;
    type: string;
    fileKey: string;
    url: string;
  };
  error?: string;
}

export default function FileUpload() {
  const [uploadStatus, setUploadStatus] = useState<'idle' | 'uploading' | 'success' | 'error'>('idle');
  const [uploadResult, setUploadResult] = useState<UploadResult | null>(null);
  const [uploadProgress, setUploadProgress] = useState(0);

  const uploadFile = async (file: File): Promise<UploadResult> => {
    const formData = new FormData();
    formData.append('file', file);

    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Upload failed');
    }

    return await response.json();
  };

  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    if (acceptedFiles.length === 0) return;

    const file = acceptedFiles[0];
    setUploadStatus('uploading');
    setUploadProgress(0);

    // Симуляция прогресса
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return 90;
        }
        return prev + Math.random() * 20;
      });
    }, 200);

    try {
      const result = await uploadFile(file);
      
      clearInterval(progressInterval);
      setUploadProgress(100);
      setUploadStatus('success');
      setUploadResult(result);

      // Запускаем OCR обработку для PDF
      if (file.type === 'application/pdf') {
        console.log('Starting OCR processing for PDF...');
        // OCR будет запущен автоматически в API
      }

    } catch (error) {
      clearInterval(progressInterval);
      setUploadStatus('error');
      setUploadResult({
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      });
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'application/pdf': ['.pdf'],
      'text/csv': ['.csv'],
      'application/vnd.ms-excel': ['.xls', '.xlsx'],
    },
    maxFiles: 1,
    maxSize: 10 * 1024 * 1024, // 10MB
  });

  const resetUpload = () => {
    setUploadStatus('idle');
    setUploadResult(null);
    setUploadProgress(0);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div
        {...getRootProps()}
        className={`
          relative border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors
          ${isDragActive ? 'border-blue-400 bg-blue-50' : 'border-gray-300 hover:border-gray-400'}
          ${uploadStatus === 'uploading' ? 'pointer-events-none opacity-75' : ''}
        `}
      >
        <input {...getInputProps()} />
        
        {uploadStatus === 'idle' && (
          <>
            <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
            <p className="text-lg font-medium text-gray-700 mb-2">
              {isDragActive ? 'Отпустите файл здесь' : 'Загрузите файл'}
            </p>
            <p className="text-sm text-gray-500">
              Поддерживаются PDF, CSV файлы до 10MB
            </p>
          </>
        )}

        {uploadStatus === 'uploading' && (
          <>
            <Loader2 className="w-12 h-12 mx-auto mb-4 text-blue-500 animate-spin" />
            <p className="text-lg font-medium text-gray-700 mb-2">Загрузка...</p>
            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
              <div 
                className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-500">{Math.round(uploadProgress)}%</p>
          </>
        )}

        {uploadStatus === 'success' && uploadResult?.success && (
          <>
            <CheckCircle2 className="w-12 h-12 mx-auto mb-4 text-green-500" />
            <p className="text-lg font-medium text-green-700 mb-2">Успешно загружено!</p>
            <div className="text-sm text-gray-600 space-y-1">
              <p>📄 {uploadResult.data?.filename}</p>
              <p>📊 {(uploadResult.data?.size || 0 / 1024 / 1024).toFixed(2)} MB</p>
              {uploadResult.data?.type === 'application/pdf' && (
                <p className="text-blue-600">🔍 OCR обработка запущена...</p>
              )}
            </div>
          </>
        )}

        {uploadStatus === 'error' && (
          <>
            <AlertCircle className="w-12 h-12 mx-auto mb-4 text-red-500" />
            <p className="text-lg font-medium text-red-700 mb-2">Ошибка загрузки</p>
            <p className="text-sm text-red-600">{uploadResult?.error}</p>
          </>
        )}
      </div>

      {(uploadStatus === 'success' || uploadStatus === 'error') && (
        <button
          onClick={resetUpload}
          className="mt-4 w-full px-4 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded-md transition-colors"
        >
          Загрузить другой файл
        </button>
      )}
    </div>
  );
} 