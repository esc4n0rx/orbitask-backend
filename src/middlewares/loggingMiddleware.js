const { httpLog } = require('../utils/logger');
const metricsCollector = require('../utils/metrics');

/**
 * Middleware para logging de requisições HTTP
 * Registra todas as requisições com informações detalhadas
 */
const loggingMiddleware = (req, res, next) => {
  const startTime = Date.now();
  
  // Incrementa conexões ativas
  metricsCollector.incrementActiveConnections();

  // Cara, aqui capturamos o final da requisição para calcular duração e logar
  const originalEnd = res.end;
  const originalWrite = res.write;

  let chunks = [];

  // Override do método write para capturar response body se necessário
  res.write = function(chunk) {
    if (chunk) {
      chunks.push(Buffer.from(chunk));
    }
    return originalWrite.apply(this, arguments);
  };

  // Override do método end para capturar o fim da requisição
  res.end = function(chunk) {
    if (chunk) {
      chunks.push(Buffer.from(chunk));
    }

    const duration = Date.now() - startTime;
    const responseBody = Buffer.concat(chunks).toString('utf8');
    
    // Registra métricas
    metricsCollector.recordHttpRequest(
      req.method,
      req.route?.path || req.path,
      res.statusCode,
      duration
    );
    
    // Decrementa conexões ativas
    metricsCollector.decrementActiveConnections();

    // Faz o log da requisição
    httpLog(req, res, duration);

    // Log adicional para requisições lentas (> 1s)
    if (duration > 1000) {
      const { logger } = require('../utils/logger');
      logger.warn('Slow Request Detected', {
        method: req.method,
        url: req.originalUrl,
        duration: `${duration}ms`,
        correlationId: req.correlationId,
        userId: req.user?.id,
        statusCode: res.statusCode
      });
    }

    // Log para respostas grandes (> 1MB)
    const responseSize = responseBody.length;
    if (responseSize > 1024 * 1024) {
      const { logger } = require('../utils/logger');
      logger.warn('Large Response Detected', {
        method: req.method,
        url: req.originalUrl,
        responseSize: `${Math.round(responseSize / 1024 / 1024)}MB`,
        correlationId: req.correlationId,
        userId: req.user?.id
      });
    }

    return originalEnd.apply(this, arguments);
  };

  next();
};

module.exports = loggingMiddleware;