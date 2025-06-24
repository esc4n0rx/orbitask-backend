const metricsCollector = require('../utils/metrics');

/**
 * Middleware específico para coleta de métricas
 * Funciona em conjunto com o loggingMiddleware
 */
const metricsMiddleware = (req, res, next) => {
  const startTime = process.hrtime.bigint();

  // Override do res.end para capturar métricas finais
  const originalEnd = res.end;
  
  res.end = function(...args) {
    const endTime = process.hrtime.bigint();
    const duration = Number(endTime - startTime) / 1000000; // Convert to ms

    // Registra a requisição nas métricas
    metricsCollector.recordHttpRequest(
      req.method,
      req.route?.path || req.path || 'unknown',
      res.statusCode,
      Math.round(duration)
    );

    return originalEnd.apply(this, args);
  };

  next();
};

/**
 * Middleware para tracking de erros nas métricas
 */
const errorMetricsMiddleware = (error, req, res, next) => {
  // Registra o erro nas métricas
  metricsCollector.recordError(error, error.name || 'UnknownError');
  
  // Passa o erro adiante
  next(error);
};

module.exports = {
  metricsMiddleware,
  errorMetricsMiddleware
};