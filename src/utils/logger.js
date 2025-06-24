const winston = require('winston');
const DailyRotateFile = require('winston-daily-rotate-file');
const path = require('path');

// Cara, aqui definimos os níveis customizados para o contexto da aplicação
const customLevels = {
  levels: {
    error: 0,
    warn: 1,
    info: 2,
    http: 3,
    debug: 4
  },
  colors: {
    error: 'red',
    warn: 'yellow',
    info: 'green',
    http: 'magenta',
    debug: 'blue'
  }
};

// Formato customizado para logs estruturados
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.errors({ stack: true }),
  winston.format.json(),
  winston.format.printf(({ timestamp, level, message, correlationId, userId, method, url, statusCode, duration, stack, ...meta }) => {
    const logObject = {
      timestamp,
      level,
      message,
      correlationId,
      userId,
      method,
      url,
      statusCode,
      duration,
      environment: process.env.NODE_ENV || 'development',
      service: 'orbitask-api'
    };

    // Adiciona stack trace se for erro
    if (stack) {
      logObject.stack = stack;
    }

    // Adiciona metadados extras se existirem
    if (Object.keys(meta).length > 0) {
      logObject.meta = meta;
    }

    return JSON.stringify(logObject);
  })
);

// Transports - onde os logs serão enviados
const transports = [];

// Console transport para desenvolvimento
if (process.env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      level: 'debug',
      format: winston.format.combine(
        winston.format.colorize({ all: true }),
        winston.format.simple()
      )
    })
  );
}

// File transports para produção
if (process.env.NODE_ENV === 'production') {
  // Logs de aplicação geral
  transports.push(
    new DailyRotateFile({
      filename: path.join(process.cwd(), 'logs', 'application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '14d',
      level: 'info',
      format: logFormat
    })
  );

  // Logs de erro separados
  transports.push(
    new DailyRotateFile({
      filename: path.join(process.cwd(), 'logs', 'error-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m',
      maxFiles: '30d',
      level: 'error',
      format: logFormat
    })
  );

  // Logs HTTP para análise de tráfego
  transports.push(
    new DailyRotateFile({
      filename: path.join(process.cwd(), 'logs', 'http-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '50m',
      maxFiles: '7d',
      level: 'http',
      format: logFormat
    })
  );
}

// Criação do logger principal
const logger = winston.createLogger({
  levels: customLevels.levels,
  format: logFormat,
  defaultMeta: {
    service: 'orbitask-api'
  },
  transports,
  // Não sai da aplicação em caso de erro
  exitOnError: false
});

// Adiciona cores personalizadas
winston.addColors(customLevels.colors);

// Helper functions para diferentes tipos de log
const logHelpers = {
  /**
   * Log de requisição HTTP
   */
  httpLog: (req, res, duration) => {
    const logData = {
      method: req.method,
      url: req.originalUrl || req.url,
      statusCode: res.statusCode,
      duration: `${duration}ms`,
      correlationId: req.correlationId,
      userId: req.user?.id || 'anonymous',
      userAgent: req.get('User-Agent'),
      ip: req.ip || req.connection.remoteAddress,
      contentLength: res.get('Content-Length') || 0
    };

    // Diferencia por status code
    if (res.statusCode >= 400 && res.statusCode < 500) {
      logger.warn('HTTP Request - Client Error', logData);
    } else if (res.statusCode >= 500) {
      logger.error('HTTP Request - Server Error', logData);
    } else {
      logger.http('HTTP Request', logData);
    }
  },

  /**
   * Log de erro de aplicação
   */
  errorLog: (error, req = null, additionalData = {}) => {
    const errorData = {
      message: error.message,
      stack: error.stack,
      name: error.name,
      correlationId: req?.correlationId,
      userId: req?.user?.id,
      method: req?.method,
      url: req?.originalUrl || req?.url,
      ...additionalData
    };

    logger.error('Application Error', errorData);
  },

  /**
   * Log de operação de banco de dados
   */
  dbLog: (operation, table, duration, correlationId, error = null) => {
    const dbData = {
      operation,
      table,
      duration: `${duration}ms`,
      correlationId
    };

    if (error) {
      logger.error('Database Error', { ...dbData, error: error.message });
    } else {
      logger.info('Database Operation', dbData);
    }
  },

  /**
   * Log de autenticação
   */
  authLog: (event, userId, correlationId, additionalData = {}) => {
    const authData = {
      event,
      userId,
      correlationId,
      ...additionalData
    };

    logger.info('Authentication Event', authData);
  },

  /**
   * Log de operação de negócio
   */
  businessLog: (operation, entityType, entityId, userId, correlationId, additionalData = {}) => {
    const businessData = {
      operation,
      entityType,
      entityId,
      userId,
      correlationId,
      ...additionalData
    };

    logger.info('Business Operation', businessData);
  }
};

module.exports = {
  logger,
  ...logHelpers
};