const { logger } = require('../utils/logger');

/**
 * Configuração avançada de CORS para o Orbitask
 * Suporta diferentes ambientes e domínios
 */

// Lista de origens permitidas por ambiente
const getAllowedOrigins = () => {
  const baseOrigins = [
    // Desenvolvimento local
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:5173', // Vite dev server
    'https://localhost:3000',
    'https://localhost:3001',
    
    // Produção Vercel - domínios específicos conhecidos
    'https://orbitask-frontend.vercel.app',
    'https://orbitask.vercel.app',
    
    // Adicione outros domínios de produção aqui
    process.env.FRONTEND_URL, // URL configurável via env
  ].filter(Boolean); // Remove valores undefined/null

  // Em desenvolvimento, permite qualquer localhost
  if (process.env.NODE_ENV !== 'production') {
    return baseOrigins;
  }

  return baseOrigins;
};

/**
 * Verifica se uma origem é permitida
 * @param {string} origin - URL de origem da requisição
 * @returns {boolean} Se a origem é permitida
 */
const isOriginAllowed = (origin) => {
  const allowedOrigins = getAllowedOrigins();
  
  // Permite requisições sem origin (Postman, apps mobile, etc.)
  if (!origin) {
    return true;
  }

  // Verifica se está na lista exata
  if (allowedOrigins.includes(origin)) {
    return true;
  }

  // Em desenvolvimento, permite qualquer localhost
  if (process.env.NODE_ENV !== 'production') {
    if (origin.includes('localhost') || origin.includes('127.0.0.1')) {
      return true;
    }
  }

  // Permite subdomínios do Vercel (para preview deployments)
  if (origin.endsWith('.vercel.app')) {
    // Verifica se é um subdomain válido do projeto
    const vercelPattern = /^https:\/\/orbitask.*\.vercel\.app$/;
    if (vercelPattern.test(origin)) {
      return true;
    }
  }

  return false;
};

/**
 * Configuração do middleware CORS
 */
const corsOptions = {
  origin: function (origin, callback) {
    const isAllowed = isOriginAllowed(origin);
    
    // Log para debug
    logger.info('CORS Origin Check', {
      origin: origin || 'no-origin',
      allowed: isAllowed,
      environment: process.env.NODE_ENV
    });

    if (isAllowed) {
      callback(null, true);
    } else {
      logger.warn('CORS Origin Blocked', {
        origin: origin || 'no-origin',
        allowedOrigins: getAllowedOrigins(),
        userAgent: 'unknown' // Será preenchido no middleware se disponível
      });
      
      callback(new Error(`CORS: Origem '${origin}' não permitida`));
    }
  },
  
  // Permite envio de cookies e headers de autenticação
  credentials: true,
  
  // Métodos HTTP permitidos
  methods: [
    'GET', 
    'POST', 
    'PUT', 
    'DELETE', 
    'OPTIONS', 
    'PATCH', 
    'HEAD'
  ],
  
  // Headers permitidos nas requisições
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'Pragma',
    'X-Correlation-ID',
    'X-Request-ID',
    'User-Agent'
  ],
  
  // Headers expostos ao frontend
  exposedHeaders: [
    'X-Correlation-ID',
    'X-Request-ID',
    'X-Total-Count',
    'X-RateLimit-Limit',
    'X-RateLimit-Remaining'
  ],
  
  // Cache do preflight por 24 horas
  maxAge: 86400,
  
  // Permite que o browser envie headers nas requisições preflight
  preflightContinue: false,
  
  // Status code para requisições OPTIONS bem-sucedidas
  optionsSuccessStatus: 204
};

/**
 * Middleware adicional para debug de CORS
 */
const corsDebugMiddleware = (req, res, next) => {
  // Adiciona headers de debug em desenvolvimento
  if (process.env.NODE_ENV !== 'production') {
    res.set('X-Debug-Origin', req.get('Origin') || 'no-origin');
    res.set('X-Debug-Method', req.method);
  }

  // Log detalhado para requisições OPTIONS (preflight)
  if (req.method === 'OPTIONS') {
    logger.info('CORS Preflight Request', {
      origin: req.get('Origin'),
      method: req.get('Access-Control-Request-Method'),
      headers: req.get('Access-Control-Request-Headers'),
      url: req.originalUrl,
      userAgent: req.get('User-Agent')
    });
  }

  next();
};

module.exports = {
  corsOptions,
  corsDebugMiddleware,
  isOriginAllowed,
  getAllowedOrigins
};