require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./src/docs/swagger');

// Importações das rotas
const authRoutes = require('./src/routes/authRoutes');
const stationRoutes = require('./src/routes/stationRoutes');
const memberRoutes = require('./src/routes/memberRoutes');
const boardRoutes = require('./src/routes/boardRoutes');
const taskRoutes = require('./src/routes/taskRoutes');

// Importação dos middlewares
const errorMiddleware = require('./src/middlewares/errorMiddleware');

const app = express();
const PORT = process.env.PORT || 3000;

// Middlewares de segurança e configuração
app.use(helmet());
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// Documentação Swagger
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Rota de health check
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'OK', 
    message: 'Orbitask API está funcionando!',
    timestamp: new Date().toISOString()
  });
});

// Rotas da aplicação
app.use('/api/auth', authRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/stations', memberRoutes);
app.use('/api', boardRoutes);
app.use('/api', taskRoutes);

// Rota para endpoints não encontrados
app.use('*', (req, res) => {
  res.status(404).json({ 
    error: 'Endpoint não encontrado',
    message: `Rota ${req.originalUrl} não existe nesta galáxia` 
  });
});

// Middleware global de tratamento de erros
app.use(errorMiddleware);

app.listen(PORT, () => {
  console.log(`🚀 Servidor Orbitask rodando na porta ${PORT}`);
  console.log(`📚 Documentação disponível em http://localhost:${PORT}/api-docs`);
});