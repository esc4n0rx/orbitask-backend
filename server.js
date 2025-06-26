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

// Importações das rotas
const authRoutes = require('./src/routes/authRoutes');
const stationRoutes = require('./src/routes/stationRoutes');
const memberRoutes = require('./src/routes/memberRoutes');
const boardRoutes = require('./src/routes/boardRoutes');
const taskRoutes = require('./src/routes/taskRoutes');
const healthRoutes = require('./src/routes/healthRoutes');
const aiRoutes = require('./src/routes/aiRoutes'); // Nova rota

// Importação dos middlewares
const errorMiddleware = require('./src/middlewares/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuração do CORS
const corsOptions = {
  origin: function (origin, callback) {
    // Lista de origens permitidas
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:3001',
      'https://localhost:3000',
      'https://localhost:3001',
      'https://orbitask-frontend.vercel.app'
    ];

    // Permite requisições sem origin (ex: Postman, apps mobile)
    if (!origin) return callback(null, true);
    
    // Verifica se a origin está na lista permitida
    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      // Em desenvolvimento, permite qualquer localhost
      if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
        callback(null, true);
      } else {
        callback(new Error('Não permitido pelo CORS'));
      }
    }
  },
  credentials: true, // Permite envio de cookies e headers de autenticação
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'X-Correlation-ID'
  ],
  exposedHeaders: ['X-Correlation-ID'],
  maxAge: 86400 // Cache preflight por 24 horas
};

// Middlewares de monitoramento (devem vir primeiro)
app.use(correlationIdMiddleware);
app.use(metricsMiddleware);
app.use(loggingMiddleware);

// Middlewares de segurança e configuração
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(cors(corsOptions));
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

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
app.use('/api', aiRoutes); // Nova rota da IA

// Rota para endpoints não encontrados
app.use('*', (req, res) => {
  logger.warn('Route Not Found', {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('User-Agent')
  });
  
  res.status(404).json({
    error: 'Endpoint não encontrado',
    message: 'A rota solicitada não existe'
  });
});

// Middleware de tratamento de erros (deve ser o último)
app.use(errorMiddleware);

// Inicialização do servidor
app.listen(PORT, () => {
  logger.info('Server Started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    timestamp: new Date().toISOString()
  });
});

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
