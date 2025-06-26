require('dotenv').config();

// Cara, inicializa o Sentry antes de qualquer coisa se estiver em produção
if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  const Sentry = require('@sentry/node');
  
  // Configuração básica do Sentry
  const sentryConfig = {
    dsn: process.env.SENTRY_DSN,
    // Performance Monitoring
    tracesSampleRate: 0.1, // 10% das transações
    environment: process.env.NODE_ENV,
    beforeSend(event) {
      // Filtra erros que não queremos no Sentry
      if (event.exception) {
        const error = event.exception.values[0];
        if (error && error.type === 'ValidationError') {
          return null; // Não envia erros de validação
        }
      }
      return event;
    }
  };

  // Tenta adicionar profiling se disponível
  try {
    const { ProfilingIntegration } = require('@sentry/profiling-node');
    if (ProfilingIntegration) {
      sentryConfig.integrations = [new ProfilingIntegration()];
      sentryConfig.profilesSampleRate = 0.1; // 10% dos profiles
    }
  } catch (error) {
    console.warn('Sentry Profiling não disponível:', error.message);
    // Continua sem profiling
  }
  
  Sentry.init(sentryConfig);
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/docs/swagger');

// Importação dos utilitários de monitoramento
const { correlationIdMiddleware } = require('./src/utils/correlationId');
const loggingMiddleware = require('./src/middlewares/loggingMiddleware');
const { metricsMiddleware } = require('./src/middlewares/metricsMiddleware');
const { logger } = require('./src/utils/logger');

// Importação da nova configuração de CORS
const { corsOptions, corsDebugMiddleware } = require('./src/middlewares/corsMiddleware');

// Importações das rotas
const authRoutes = require('./src/routes/authRoutes');
const stationRoutes = require('./src/routes/stationRoutes');
const memberRoutes = require('./src/routes/memberRoutes');
const boardRoutes = require('./src/routes/boardRoutes');
const taskRoutes = require('./src/routes/taskRoutes');
const healthRoutes = require('./src/routes/healthRoutes');
const aiRoutes = require('./src/routes/aiRoutes');

// Importação dos middlewares
const errorMiddleware = require('./src/middlewares/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de monitoramento (devem vir primeiro)
app.use(correlationIdMiddleware);
app.use(metricsMiddleware);
app.use(loggingMiddleware);

// Middleware de debug CORS (antes do CORS)
app.use(corsDebugMiddleware);

// Configuração de segurança HELMET (corrigida para evitar erros)
app.use(helmet({
  // Política de recursos cross-origin
  crossOriginResourcePolicy: { 
    policy: "cross-origin" 
  },
  
  // Remove a configuração problemática do crossOriginOpenerPolicy
  // e usa a configuração padrão segura do Helmet
  crossOriginOpenerPolicy: false, // Desabilita para evitar conflitos
  
  // Desabilita para evitar conflitos com CORS
  crossOriginEmbedderPolicy: false,
  
  // Configurações específicas para API
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"], // Para Swagger UI
      scriptSrc: ["'self'"], 
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      fontSrc: ["'self'"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
    },
  },
  
  // Headers de segurança adicionais
  hsts: {
    maxAge: 31536000, // 1 ano
    includeSubDomains: true,
    preload: true
  },
  
  // Previne ataques de clickjacking
  frameguard: { action: 'deny' },
  
  // Previne MIME type sniffing
  noSniff: true,
  
  // Força HTTPS (apenas em produção)
  ...(process.env.NODE_ENV === 'production' && {
    forceHTTPS: true
  })
}));

// Aplicação da configuração CORS melhorada
app.use(cors(corsOptions));

// Middlewares de parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Middleware adicional para garantir headers CORS em todas as respostas
app.use((req, res, next) => {
  const origin = req.get('Origin');
  
  // Sempre adiciona o Vary header para cache correto
  res.vary('Origin');
  
  // Em desenvolvimento, adiciona headers extras para debug
  if (process.env.NODE_ENV !== 'production') {
    res.set('X-Debug-CORS', 'enabled');
    res.set('X-Debug-Environment', process.env.NODE_ENV);
  }
  
  next();
});

// Rota de teste para CORS (remover em produção)
if (process.env.NODE_ENV !== 'production') {
  app.get('/api/cors-test', (req, res) => {
    res.json({
      message: 'CORS está funcionando!',
      origin: req.get('Origin'),
      timestamp: new Date().toISOString(),
      headers: {
        'access-control-allow-origin': res.get('Access-Control-Allow-Origin'),
        'access-control-allow-credentials': res.get('Access-Control-Allow-Credentials')
      }
    });
  });
}

// Documentação Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Health checks (sem autenticação para facilitar monitoramento)
app.use('/health', healthRoutes);

// Rotas da aplicação
app.use('/api/auth', authRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/stations', memberRoutes);
app.use('/api', boardRoutes);
app.use('/api', taskRoutes);
app.use('/api', aiRoutes);

// Rota para endpoints não encontrados
app.use('*', (req, res) => {
  logger.warn('Route Not Found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    origin: req.get('Origin'),
    userAgent: req.get('User-Agent')
  });
  
  res.status(404).json({
    error: 'Endpoint não encontrado',
    message: 'A rota solicitada não existe'
  });
});

// Middleware de tratamento de erros CORS
app.use((error, req, res, next) => {
  if (error.message && error.message.includes('CORS')) {
    logger.error('CORS Error', {
      error: error.message,
      origin: req.get('Origin'),
      method: req.method,
      url: req.originalUrl,
      userAgent: req.get('User-Agent')
    });
    
    return res.status(403).json({
      error: 'CORS Error',
      message: 'Origem não permitida',
      details: process.env.NODE_ENV !== 'production' ? {
        origin: req.get('Origin'),
        allowedOrigins: require('./src/middlewares/corsMiddleware').getAllowedOrigins()
      } : undefined
    });
  }
  
  next(error);
});

// Middleware de tratamento de erros (deve ser o último)
app.use(errorMiddleware);

// Inicialização do servidor com tratamento de erro
const server = app.listen(PORT, () => {
  logger.info('Server Started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    allowedOrigins: require('./src/middlewares/corsMiddleware').getAllowedOrigins(),
    timestamp: new Date().toISOString()
  });
}).on('error', (error) => {
  logger.error('Server Start Error', {
    error: error.message,
    port: PORT,
    code: error.code
  });
  process.exit(1);
});

// Graceful shutdown
const gracefulShutdown = () => {
  logger.info('Graceful shutdown initiated');
  
  server.close(() => {
    logger.info('Server closed');
    process.exit(0);
  });
  
  // Force close after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown');
    process.exit(1);
  }, 30000);
};

// Tratamento de sinais de shutdown
process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);

// Tratamento de erros não capturados
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', {
    error: error.message,
    stack: error.stack
  });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', {
    reason: reason,
    promise: promise
  });
  process.exit(1);
});