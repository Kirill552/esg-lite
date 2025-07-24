'use client'

import { useState } from 'react'
import { FileUpload } from '@/components/upload/FileUpload'
import { Card } from '@/components/ui/Card'
import { Button } from '@/components/ui/Button'
import { FileType } from '@/types'
import { 
  Upload, 
  FileText, 
  AlertCircle, 
  CheckCircle, 
  Loader2,
  Download,
  Eye
} from 'lucide-react'

import Link from 'next/link'

export default function UploadPage() {
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingComplete, setProcessingComplete] = useState(false)
  const [fileUploaded, setFileUploaded] = useState(false)
  const [uploadedFileInfo, setUploadedFileInfo] = useState<{documentId: string, fileKey: string} | null>(null)
  const [error, setError] = useState('')
  // убрали тестовые кнопки, поэтому состояния больше не нужны

  const maxFileSizeInMB = 10
  const acceptedFileTypes: FileType[] = ['pdf', 'csv', 'xlsx', 'xls'] // Поддерживаем Excel файлы

  const handleFileSelect = (file: File) => {
    setSelectedFile(file)
    setError('')
    setProcessingComplete(false)
    setFileUploaded(false)
    setUploadedFileInfo(null)
  }

  const handleProcessFile = async () => {
    if (!selectedFile) return

    setIsProcessing(true)
    setError('')

    try {
      // Загружаем файл через API
      const formData = new FormData()
      formData.append('file', selectedFile)

      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })

      if (!uploadResponse.ok) {
        throw new Error('Ошибка загрузки файла')
      }

      const uploadResult = await uploadResponse.json()
      
      if (!uploadResult.success) {
        throw new Error(uploadResult.error || 'Ошибка загрузки файла')
      }

      console.log('✅ Файл загружен:', uploadResult.data)
      setFileUploaded(true)
      setUploadedFileInfo(uploadResult.data)
      
    } catch (err: any) {
      console.error('❌ Ошибка загрузки:', err)
      setError(err.message || 'Ошибка загрузки файла. Попробуйте еще раз.')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleRunOCR = async () => {
    if (!uploadedFileInfo) return

    setIsProcessing(true)
    setError('')

    try {
      console.log('🔍 Запускаем OCR для документа:', uploadedFileInfo.documentId)

      const ocrResponse = await fetch('/api/ocr', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          documentId: uploadedFileInfo.documentId
        }),
      })

      if (!ocrResponse.ok) {
        throw new Error('Ошибка OCR обработки')
      }

      const ocrResult = await ocrResponse.json()
      
      if (!ocrResult.success) {
        throw new Error(ocrResult.error || 'Ошибка OCR обработки')
      }

      console.log('✅ OCR завершен:', ocrResult.data)
      setProcessingComplete(true)
      
    } catch (err: any) {
      console.error('❌ Ошибка OCR:', err)
      setError(err.message || 'Ошибка OCR обработки. Попробуйте еще раз.')
    } finally {
      setIsProcessing(false)
    }
  }

  const resetUpload = () => {
    setSelectedFile(null)
    setProcessingComplete(false)
    setFileUploaded(false)
    setUploadedFileInfo(null)
    setError('')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-slate-900 mb-4">
            Загрузка документов
          </h1>
          <p className="text-xl text-slate-600 max-w-2xl mx-auto">
            Загрузите PDF счета за электроэнергию или CSV/Excel файлы для автоматического 
            создания отчётов по 296-ФЗ
          </p>
        </div>

        {/* Блок тестирования системы удалён */}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Upload Area */}
          <div className="lg:col-span-2">
            <Card className="p-8 border-0 bg-white/70 backdrop-blur-sm">
              <div className="mb-6">
                <h2 className="text-2xl font-semibold text-slate-900 mb-2">
                  Выберите файл
                </h2>
                <p className="text-slate-600">
                  Поддерживаются файлы: PDF, CSV, Excel XLS/XLSX (до {maxFileSizeInMB} МБ)
                </p>
              </div>

              {!selectedFile ? (
                <FileUpload
                  onFileSelect={handleFileSelect}
                  acceptedFileTypes={acceptedFileTypes}
                  maxFileSizeInMB={maxFileSizeInMB}
                  className="mb-6"
                />
              ) : (
                <div className="mb-6">
                  <div className="flex items-center p-4 bg-emerald-50 border border-emerald-200 rounded-lg mb-4">
                    <FileText className="w-8 h-8 text-emerald-600 mr-4" />
                    <div className="flex-1">
                      <h3 className="font-medium text-emerald-900">
                        {selectedFile.name}
                      </h3>
                      <p className="text-sm text-emerald-600">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} МБ
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={resetUpload}
                      className="text-emerald-600 hover:text-emerald-700"
                    >
                      Изменить
                    </Button>
                  </div>
                  
                  {/* Кнопка загрузки файла */}
                  {!fileUploaded && (
                    <Button
                      onClick={handleProcessFile}
                      disabled={isProcessing}
                      className="w-full bg-gradient-to-r from-emerald-500 to-green-600 text-white hover:from-emerald-600 hover:to-green-700 transition-all duration-200"
                      size="lg"
                    >
                      {isProcessing ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Загружаем файл 
                        </>
                      ) : (
                        <>
                          <Upload className="w-5 h-5 mr-2" />
                          📁 Загрузить файл 
                        </>
                      )}
                    </Button>
                  )}
                </div>
              )}

              {error && (
                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
                  <AlertCircle className="w-5 h-5 text-red-600 mr-3" />
                  <p className="text-red-700">{error}</p>
                </div>
              )}

              {fileUploaded && !processingComplete && (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                    <p className="text-green-700 font-medium">
                      ✅ Файл успешно загружен! Теперь запустите распознавание текста.
                    </p>
                  </div>
                  
                  <Button
                    onClick={handleRunOCR}
                    disabled={isProcessing}
                    className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700 transition-all duration-200"
                    size="lg"
                  >
                    {isProcessing ? (
                      <>
                        <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        Распознаём текст...
                      </>
                    ) : (
                      <>
                        <Eye className="w-5 h-5 mr-2" />
                        🔍 Распознать текст
                      </>
                    )}
                  </Button>
                </div>
              )}

              {processingComplete && (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
                    <CheckCircle className="w-5 h-5 text-green-600 mr-3" />
                    <p className="text-green-700 font-medium">
                      Файл успешно обработан! Отчёты готовы к скачиванию.
                    </p>
                  </div>
                  
                  <div className="space-y-4">
                    <Link href="/reports">
                      <Button variant="primary" size="lg" className="w-full bg-gradient-to-r from-blue-500 to-indigo-600 text-white hover:from-blue-600 hover:to-indigo-700">
                        <Download className="w-5 h-5 mr-2" />
                        Перейти к отчётам
                      </Button>
                    </Link>
                    
                    <Link href="/documents">
                      <Button variant="secondary" size="lg" className="w-full">
                        <FileText className="w-5 h-5 mr-2" />
                        Управление документами
                      </Button>
                    </Link>
                  </div>
                  
                  <Button
                    variant="ghost"
                    onClick={resetUpload}
                    className="w-full"
                  >
                    Загрузить другой файл
                  </Button>
                </div>
              )}
            </Card>
          </div>

          {/* Info Sidebar */}
          <div className="space-y-6">
            <Card className="p-6 border-0 bg-white/60 backdrop-blur-sm">
              <h3 className="font-bold text-slate-900 mb-4">
                📋 Что происходит при обработке?
              </h3>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-xs font-medium text-emerald-700">1</span>
                  </div>
                  <p>Автоматическое распознавание данных из документа</p>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-xs font-medium text-emerald-700">2</span>
                  </div>
                  <p>Расчёт углеродного следа по 296-ФЗ</p>
                </div>
                <div className="flex items-start">
                  <div className="w-6 h-6 bg-emerald-100 rounded-full flex items-center justify-center mr-3 mt-0.5">
                    <span className="text-xs font-medium text-emerald-700">3</span>
                  </div>
                  <p>Генерация отчётов PDF и CSV/XML</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-0 bg-white/60 backdrop-blur-sm">
              <h3 className="font-bold text-slate-900 mb-4">
                💡 Поддерживаемые форматы
              </h3>
              <div className="space-y-3 text-sm text-slate-600">
                <div className="flex items-center">
                  <FileText className="w-4 h-4 text-slate-500 mr-2" />
                  <p>PDF счета за электроэнергию</p>
                </div>
                <div className="flex items-center">
                  <FileText className="w-4 h-4 text-slate-500 mr-2" />
                  <p>CSV файлы с данными</p>
                </div>
                <div className="flex items-center">
                  <FileText className="w-4 h-4 text-slate-500 mr-2" />
                  <p>Excel файлы XLS/XLSX с таблицами</p>
                </div>
              </div>
            </Card>

            <Card className="p-6 border-0 bg-gradient-to-br from-emerald-50 to-green-50/50">
              <h3 className="font-bold text-slate-900 mb-4">
                🔒 Безопасность данных
              </h3>
              <p className="text-sm text-slate-600">
                Все загруженные файлы обрабатываются локально и удаляются после 
                создания отчётов. Ваши данные остаются конфиденциальными.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  )
} 