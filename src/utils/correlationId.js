const { v4: uuidv4 } = require('uuid');

/**
 * Gera um correlation ID único para rastrear requisições
 * @returns {string} UUID v4
 */
const generateCorrelationId = () => {
  return uuidv4();
};

/**
 * Extrai correlation ID do header da requisição ou gera um novo
 * @param {Object} req - Request object do Express
 * @returns {string} Correlation ID
 */
const extractOrGenerateCorrelationId = (req) => {
  // Cara, aqui verificamos se já existe um correlation ID nos headers
  // Isso permite que serviços upstream mantenham o mesmo ID
  const existingId = req.get('X-Correlation-ID') || 
                    req.get('X-Request-ID') || 
                    req.get('X-Trace-ID');
  
  return existingId || generateCorrelationId();
};

/**
 * Middleware para adicionar correlation ID às requisições
 */
const correlationIdMiddleware = (req, res, next) => {
  // Gera ou extrai correlation ID
  req.correlationId = extractOrGenerateCorrelationId(req);
  
  // Adiciona o ID no header de resposta para debugging
  res.set('X-Correlation-ID', req.correlationId);
  
  next();
};

module.exports = {
  generateCorrelationId,
  extractOrGenerateCorrelationId,
  correlationIdMiddleware
};