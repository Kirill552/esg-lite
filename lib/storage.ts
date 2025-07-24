// lib/storage.ts - Глобальное хранилище для документов и OCR результатов

interface DocumentInfo {
  documentId: string;
  fileName: string;
  fileKey: string;
}

interface OCRResult {
  documentId: string;
  status: 'processing' | 'completed' | 'failed' | 'not_started';
  textPreview?: string;
  textLength?: number;
  error?: string;
  processedAt?: string;
}

// Глобальное хранилище документов (уже существует)
declare global {
  var __documents__: Map<string, DocumentInfo> | undefined;
  var __ocrResults__: Map<string, OCRResult> | undefined;
}

// Инициализация хранилища документов
if (!globalThis.__documents__) {
  globalThis.__documents__ = new Map();
}

// Инициализация хранилища OCR результатов
if (!globalThis.__ocrResults__) {
  globalThis.__ocrResults__ = new Map();
}

export const documents = globalThis.__documents__;
export const ocrResults = globalThis.__ocrResults__;

export type { DocumentInfo }; 