/**
 * Sistema de métricas para monitoramento de performance
 */

class MetricsCollector {
    constructor() {
      this.metrics = {
        httpRequests: {
          total: 0,
          byMethod: {},
          byStatus: {},
          byEndpoint: {}
        },
        responseTime: {
          total: 0,
          count: 0,
          min: Infinity,
          max: 0,
          avg: 0
        },
        errors: {
          total: 0,
          byType: {},
          last24h: []
        },
        database: {
          queries: 0,
          totalTime: 0,
          avgTime: 0,
          errors: 0
        },
        memory: {
          heapUsed: 0,
          heapTotal: 0,
          external: 0,
          rss: 0
        },
        activeConnections: 0,
        uptime: 0
      };
  
      // Cara, aqui iniciamos a coleta de métricas de sistema a cada minuto
      this.startSystemMetricsCollection();
    }
  
    /**
     * Registra uma requisição HTTP
     */
    recordHttpRequest(method, endpoint, statusCode, duration) {
      // Incrementa contadores
      this.metrics.httpRequests.total++;
      
      // Por método
      this.metrics.httpRequests.byMethod[method] = 
        (this.metrics.httpRequests.byMethod[method] || 0) + 1;
      
      // Por status code
      const statusRange = `${Math.floor(statusCode / 100)}xx`;
      this.metrics.httpRequests.byStatus[statusRange] = 
        (this.metrics.httpRequests.byStatus[statusRange] || 0) + 1;
      
      // Por endpoint (limita para não explodir na memória)
      if (Object.keys(this.metrics.httpRequests.byEndpoint).length < 100) {
        this.metrics.httpRequests.byEndpoint[endpoint] = 
          (this.metrics.httpRequests.byEndpoint[endpoint] || 0) + 1;
      }
  
      // Atualiza métricas de tempo de resposta
      this.updateResponseTimeMetrics(duration);
    }
  
    /**
     * Atualiza métricas de tempo de resposta
     */
    updateResponseTimeMetrics(duration) {
      this.metrics.responseTime.total += duration;
      this.metrics.responseTime.count++;
      this.metrics.responseTime.min = Math.min(this.metrics.responseTime.min, duration);
      this.metrics.responseTime.max = Math.max(this.metrics.responseTime.max, duration);
      this.metrics.responseTime.avg = this.metrics.responseTime.total / this.metrics.responseTime.count;
    }
  
    /**
     * Registra um erro
     */
    recordError(error, type = 'unknown') {
      this.metrics.errors.total++;
      this.metrics.errors.byType[type] = (this.metrics.errors.byType[type] || 0) + 1;
      
      // Mantém histórico das últimas 24h
      const errorRecord = {
        timestamp: new Date(),
        type,
        message: error.message,
        stack: error.stack
      };
      
      this.metrics.errors.last24h.push(errorRecord);
      
      // Remove erros antigos (mais de 24h)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      this.metrics.errors.last24h = this.metrics.errors.last24h.filter(
        err => err.timestamp > oneDayAgo
      );
    }
  
    /**
     * Registra operação de banco de dados
     */
    recordDatabaseOperation(duration, error = null) {
      this.metrics.database.queries++;
      this.metrics.database.totalTime += duration;
      this.metrics.database.avgTime = this.metrics.database.totalTime / this.metrics.database.queries;
      
      if (error) {
        this.metrics.database.errors++;
      }
    }
  
    /**
     * Coleta métricas do sistema periodicamente
     */
    startSystemMetricsCollection() {
      setInterval(() => {
        const memUsage = process.memoryUsage();
        this.metrics.memory = {
          heapUsed: memUsage.heapUsed,
          heapTotal: memUsage.heapTotal,
          external: memUsage.external,
          rss: memUsage.rss
        };
        
        this.metrics.uptime = process.uptime();
      }, 60000); // A cada minuto
    }
  
    /**
     * Incrementa contador de conexões ativas
     */
    incrementActiveConnections() {
      this.metrics.activeConnections++;
    }
  
    /**
     * Decrementa contador de conexões ativas
     */
    decrementActiveConnections() {
      this.metrics.activeConnections--;
    }
  
    /**
     * Retorna todas as métricas
     */
    getMetrics() {
      return {
        ...this.metrics,
        timestamp: new Date(),
        memoryFormatted: {
          heapUsed: this.formatBytes(this.metrics.memory.heapUsed),
          heapTotal: this.formatBytes(this.metrics.memory.heapTotal),
          external: this.formatBytes(this.metrics.memory.external),
          rss: this.formatBytes(this.metrics.memory.rss)
        }
      };
    }
  
    /**
     * Formata bytes para leitura humana
     */
    formatBytes(bytes) {
      if (bytes === 0) return '0 Bytes';
      const k = 1024;
      const sizes = ['Bytes', 'KB', 'MB', 'GB'];
      const i = Math.floor(Math.log(bytes) / Math.log(k));
      return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
  
    /**
     * Reseta métricas (útil para testes)
     */
    reset() {
      this.metrics = {
        httpRequests: { total: 0, byMethod: {}, byStatus: {}, byEndpoint: {} },
        responseTime: { total: 0, count: 0, min: Infinity, max: 0, avg: 0 },
        errors: { total: 0, byType: {}, last24h: [] },
        database: { queries: 0, totalTime: 0, avgTime: 0, errors: 0 },
        memory: { heapUsed: 0, heapTotal: 0, external: 0, rss: 0 },
        activeConnections: 0,
        uptime: 0
      };
    }
  }
  
  // Instância singleton
  const metricsCollector = new MetricsCollector();
  
  module.exports = metricsCollector;