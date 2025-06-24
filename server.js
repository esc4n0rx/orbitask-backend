require('dotenv').config();

// Cara, inicializa o Sentry antes de qualquer coisa se estiver em produção
if (process.env.NODE_ENV === 'production' && process.env.SENTRY_DSN) {
  const Sentry = require('@sentry/node');
  const { ProfilingIntegration } = require('@sentry/profiling-node');
  
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      new ProfilingIntegration(),
    ],
    // Performance Monitoring
    tracesSampleRate: 0.1, // 10% das transações
    // Profiling
    profilesSampleRate: 0.1, // 10% dos profiles
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
  });
}

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/docs/swagger');

// Importação dos utilitários de monitoramento
const { correlationIdMiddleware } = require('./src/utils/correlationId');
const loggingMiddleware = require('./src/middlewares/loggingMiddleware');
const { metricsMiddleware, errorMetricsMiddleware } = require('./src/middlewares/metricsMiddleware');
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

// Middlewares de monitoramento (devem vir primeiro)
app.use(correlationIdMiddleware);
app.use(metricsMiddleware);
app.use(loggingMiddleware);

// Middlewares de segurança e configuração
app.use(helmet());
app.use(cors());
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
    correlationId: req.correlationId,
    userAgent: req.get('User-Agent'),
    ip: req.ip
  });

  res.status(404).json({ 
    error: 'Endpoint não encontrado',
    message: `Rota ${req.originalUrl} não existe nesta galáxia`,
    correlationId: req.correlationId
  });
});

// Middleware de métricas para erros
app.use(errorMetricsMiddleware);

// Middleware global de tratamento de erros (deve ser o último)
app.use(errorMiddleware);

// Graceful shutdown
process.on('SIGTERM', () => {
  logger.info('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  logger.info('SIGINT signal received: closing HTTP server');
  process.exit(0);
});

// Captura erros não tratados
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception', { error: error.message, stack: error.stack });
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection', { reason, promise });
  process.exit(1);
});

const server = app.listen(PORT, () => {
  logger.info('Server Started', {
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    nodeVersion: process.version,
    pid: process.pid,
    aiEnabled: process.env.AI_ENABLED === 'true'
  });
  
  console.log(`🚀 Servidor Orbitask rodando na porta ${PORT}`);
  console.log(`📚 Documentação disponível em http://localhost:${PORT}/api-docs`);
  console.log(`🔍 Health checks em http://localhost:${PORT}/health`);
  console.log(`📊 Métricas em http://localhost:${PORT}/health/metrics`);
  console.log(`🤖 Orbit AI ${process.env.AI_ENABLED === 'true' ? 'HABILITADA' : 'DESABILITADA'}`);
});

// Middleware para contar conexões ativas
server.on('connection', (socket) => {
  const metricsCollector = require('./src/utils/metrics');
  metricsCollector.incrementActiveConnections();
  
  socket.on('close', () => {
    metricsCollector.decrementActiveConnections();
  });
});

module.exports = app;