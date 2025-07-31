import { notFound } from 'next/navigation'
import { cookies } from 'next/headers'

interface OCRResult {
  documentId: string
  status: 'processing' | 'completed' | 'failed' | 'not_started'
  textPreview?: string
  textLength?: number
  error?: string
  processedAt?: string
}

type PageParams = Promise<{ documentId: string }>

async function getOCRResult(documentId: string): Promise<OCRResult | null> {
  try {
    const cookieStore = await cookies()
    const res = await fetch(`http://localhost:3000/api/ocr?documentId=${documentId}`, {
      cache: 'no-store',
      headers: {
        Cookie: cookieStore.toString(),
      },
    })

    if (!res.ok) return null
    const json = await res.json()
    if (!json.success) return null
    return json.data as OCRResult
  } catch {
    return null
  }
}

export default async function ReportPage({ params }: { params: PageParams }) {
  const { documentId } = await params
  console.log('🔍 ReportPage loading for documentId:', documentId)
  
  const data = await getOCRResult(documentId)
  console.log('📊 OCR data received:', data)
  
  if (!data) notFound()

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-blue-50 py-12">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-slate-900 mb-4">OCR-результат</h1>
        <p className="text-sm text-slate-500 mb-6">Document ID: {documentId}</p>

        {/* Debug info */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded">
          <p className="text-sm text-blue-800">Debug: Status = {data.status}</p>
        </div>

        {data.status === 'completed' && (
          <>
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Извлечённый текст (превью)</h2>
            <pre className="whitespace-pre-wrap bg-white p-4 border rounded-md text-sm text-slate-800">
              {data.textPreview}
            </pre>
            <p className="mt-2 text-slate-600 text-sm">Всего символов: {data.textLength}</p>
          </>
        )}

        {data.status === 'processing' && (
          <p className="text-slate-700">Документ ещё обрабатывается, попробуйте обновить страницу чуть позже.</p>
        )}

        {data.status === 'failed' && (
          <p className="text-red-600">Ошибка обработки: {data.error}</p>
        )}

        {data.status === 'not_started' && (
          <p className="text-yellow-600">OCR ещё не запущен для этого документа.</p>
        )}
      </div>
    </div>
  )
} 