'use client'

import { useState, useCallback } from 'react'
import { useDropzone } from 'react-dropzone'
import { cn, formatFileSize, isValidFileType, isValidFileSize } from '@/lib/utils'
import { FileType } from '@/types'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { ProgressModal } from '@/components/ui/ProgressModal'
import { useProgressModal } from '@/lib/hooks/useProgressModal'

interface FileUploadProps {
  onFileSelect: (file: File) => void
  acceptedFileTypes: FileType[]
  maxFileSizeInMB: number
  className?: string
}

interface UploadedFileInfo {
  file: File
  preview?: string
}

export function FileUpload({ 
  onFileSelect, 
  acceptedFileTypes, 
  maxFileSizeInMB, 
  className 
}: FileUploadProps) {
  const [uploadedFile, setUploadedFile] = useState<UploadedFileInfo | null>(null)
  const [error, setError] = useState<string>('')
  const [isDragActive, setIsDragActive] = useState(false)
  
  // Хук для управления прогресс-модалкой
  const [progressState, progressActions] = useProgressModal()

  // Mapping file types to MIME types
  const mimeTypes = {
    pdf: 'application/pdf',
    csv: 'text/csv',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    xls: 'application/vnd.ms-excel',
  }

  const acceptedMimeTypes = acceptedFileTypes.map(type => mimeTypes[type])

  const validateFile = useCallback((file: File): boolean => {
    const fileSize = (file.size / 1024 / 1024).toFixed(2) + ' МБ'
    const fileExtension = file.name.split('.').pop()?.toLowerCase()

    // Проверка типа файла
    if (!isValidFileType(file)) {
      progressActions.setError(
        'Неподдерживаемый тип файла',
        {
          type: 'file-type',
          allowedTypes: acceptedFileTypes,
          actualType: fileExtension || 'неизвестно'
        }
      )
      return false
    }

    // Проверка размера файла
    if (!isValidFileSize(file)) {
      progressActions.setError(
        `Файл слишком большой. Максимальный размер: ${maxFileSizeInMB} МБ`,
        {
          type: 'file-size',
          maxSize: maxFileSizeInMB + ' МБ',
          actualSize: fileSize
        }
      )
      return false
    }

    return true
  }, [acceptedFileTypes, maxFileSizeInMB, progressActions])

  const onDrop = useCallback((acceptedFiles: File[]) => {
    setError('')
    setIsDragActive(false)

    if (acceptedFiles.length === 0) {
      setError('Файл не выбран или имеет неподдерживаемый формат')
      return
    }

    const file = acceptedFiles[0]
    const isValid = validateFile(file)

    if (!isValid) {
      return // Ошибка уже показана в ProgressModal
    }

    // Создаем preview для PDF файлов (опционально)
    let preview: string | undefined
    if (file.type === 'application/pdf') {
      preview = URL.createObjectURL(file)
    }

    setUploadedFile({ file, preview })
    onFileSelect(file)
  }, [validateFile, onFileSelect])

  const onDragEnter = useCallback(() => {
    setIsDragActive(true)
  }, [])

  const onDragLeave = useCallback(() => {
    setIsDragActive(false)
  }, [])

  const { getRootProps, getInputProps, open } = useDropzone({
    onDrop,
    onDragEnter,
    onDragLeave,
    accept: {
      'application/pdf': ['.pdf'],
      'text/csv': ['.csv'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
    },
    maxFiles: 1,
    multiple: false,
  })

  const clearFile = () => {
    setUploadedFile(null)
    setError('')
    if (uploadedFile?.preview) {
      URL.revokeObjectURL(uploadedFile.preview)
    }
  }

  return (
    <div className={cn('w-full max-w-[340px] mx-auto md:max-w-none', className)}>
      {!uploadedFile ? (
        <Card
          {...getRootProps()}
          className={cn(
            'upload-area cursor-pointer transition-all duration-200 min-h-[180px] flex items-center justify-center',
            'max-w-[340px] w-full mx-auto', // Ограничиваем драг-область для мобильных
            isDragActive && 'border-primary-500 bg-primary-50',
            error && 'border-error-300 bg-error-50'
          )}
          variant="outlined"
        >
          <input {...getInputProps()} />
          <div className="text-center pointer-events-none"> {/* Делаем текст неклинкабельным */}
            <svg
              className={cn(
                'mx-auto h-12 w-12 mb-4',
                isDragActive ? 'text-primary-500' : 'text-gray-400',
                error && 'text-error-400'
              )}
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {isDragActive ? 'Отпустите файл здесь' : 'Загрузите файл'}
            </h3>
            
            <p className="text-sm text-gray-600 mb-4">
              Перетащите PDF или *.jpeg* сюда или{' '}
              <button
                type="button"
                className="text-primary-600 hover:text-primary-700 font-medium pointer-events-auto"
                onClick={(e) => {
                  e.stopPropagation()
                  open()
                }}
              >
                выберите файл
              </button>
            </p>
            
            <div className="text-xs text-gray-500">
              <p>Поддерживаемые форматы: {acceptedFileTypes.join(', ').toUpperCase()}</p>
              <p>Максимальный размер: {maxFileSizeInMB} МБ</p>
            </div>
          </div>
        </Card>
      ) : (
        <Card>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex-shrink-0">
                <svg
                  className="h-10 w-10 text-success-500"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {uploadedFile.file.name}
                </p>
                <p className="text-sm text-gray-500">
                  {formatFileSize(uploadedFile.file.size)}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={clearFile}
            >
              Удалить
            </Button>
          </div>
        </Card>
      )}

      {error && (
        <div className="mt-3 p-3 bg-error-50 border border-error-200 rounded-lg">
          <p className="text-sm text-error-700">{error}</p>
        </div>
      )}
      
      {/* Progress Modal */}
      <ProgressModal
        isOpen={progressState.isOpen}
        progress={progressState.progress}
        status={progressState.status}
        message={progressState.message}
        details={progressState.details}
        fileName={progressState.fileName}
        fileSize={progressState.fileSize}
        errorDetails={progressState.errorDetails}
        onClose={progressActions.close}
      />
    </div>
  )
} 