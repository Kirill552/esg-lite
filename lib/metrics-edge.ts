/**
 * Edge-совместимая версия метрик для middleware
 * Не использует Prisma и Node.js API
 */

export interface EdgeMetrics {
  timestamp: Date
  requestCount: number
  errorCount: number
}

export class EdgeMetricsCollector {
  private metrics: Map<string, EdgeMetrics> = new Map()

  /**
   * Записать простую метрику для middleware
   */
  recordRequest(key: string): void {
    const existing = this.metrics.get(key) || {
      timestamp: new Date(),
      requestCount: 0,
      errorCount: 0
    }
    
    existing.requestCount++
    existing.timestamp = new Date()
    
    this.metrics.set(key, existing)
  }

  /**
   * Записать ошибку для middleware
   */
  recordError(key: string): void {
    const existing = this.metrics.get(key) || {
      timestamp: new Date(),
      requestCount: 0,
      errorCount: 0
    }
    
    existing.errorCount++
    existing.timestamp = new Date()
    
    this.metrics.set(key, existing)
  }

  /**
   * Получить метрики для middleware
   */
  getMetrics(key: string): EdgeMetrics | null {
    return this.metrics.get(key) || null
  }

  /**
   * Очистить старые метрики
   */
  cleanup(): void {
    const now = Date.now()
    const maxAge = 60 * 60 * 1000 // 1 час
    
    for (const [key, metrics] of this.metrics.entries()) {
      if (now - metrics.timestamp.getTime() > maxAge) {
        this.metrics.delete(key)
      }
    }
  }
}

// Экспортируем singleton для middleware
export const edgeMetricsCollector = new EdgeMetricsCollector()