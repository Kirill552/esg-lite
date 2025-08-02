import { useState, useCallback } from 'react';

export interface ProgressState {
  isOpen: boolean;
  progress: number;
  status: 'uploading' | 'processing' | 'completed' | 'error';
  message?: string;
  details?: string;
  fileName?: string;
  fileSize?: string;
  errorDetails?: {
    type: 'file-size' | 'file-type' | 'network' | 'server' | 'validation';
    allowedTypes?: string[];
    maxSize?: string;
    actualSize?: string;
    actualType?: string;
  };
}

export interface ProgressActions {
  startUpload: (fileName: string, fileSize: string) => void;
  updateProgress: (progress: number, message?: string) => void;
  setProcessing: (message?: string) => void;
  setCompleted: (message?: string) => void;
  setError: (message: string, errorDetails?: ProgressState['errorDetails']) => void;
  close: () => void;
  reset: () => void;
}

const initialState: ProgressState = {
  isOpen: false,
  progress: 0,
  status: 'uploading'
};

export function useProgressModal(): [ProgressState, ProgressActions] {
  const [state, setState] = useState<ProgressState>(initialState);

  const startUpload = useCallback((fileName: string, fileSize: string) => {
    setState({
      isOpen: true,
      progress: 0,
      status: 'uploading',
      message: 'Подготовка к загрузке...',
      fileName,
      fileSize
    });
  }, []);

  const updateProgress = useCallback((progress: number, message?: string) => {
    setState(prev => ({
      ...prev,
      progress,
      message: message || prev.message
    }));
  }, []);

  const setProcessing = useCallback((message?: string) => {
    setState(prev => ({
      ...prev,
      progress: 100,
      status: 'processing',
      message: message || 'Обрабатываем файл...',
      details: 'Извлекаем данные и создаем отчет'
    }));
  }, []);

  const setCompleted = useCallback((message?: string) => {
    setState(prev => ({
      ...prev,
      progress: 100,
      status: 'completed',
      message: message || 'Файл успешно обработан!',
      details: undefined
    }));
  }, []);

  const setError = useCallback((message: string, errorDetails?: ProgressState['errorDetails']) => {
    setState(prev => ({
      ...prev,
      status: 'error',
      message,
      errorDetails,
      details: undefined
    }));
  }, []);

  const close = useCallback(() => {
    setState(prev => ({
      ...prev,
      isOpen: false
    }));
  }, []);

  const reset = useCallback(() => {
    setState(initialState);
  }, []);

  const actions: ProgressActions = {
    startUpload,
    updateProgress,
    setProcessing,
    setCompleted,
    setError,
    close,
    reset
  };

  return [state, actions];
}
