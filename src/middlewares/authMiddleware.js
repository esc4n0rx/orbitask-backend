 
const { verifyToken } = require('../utils/jwt');

/**
 * Middleware para proteger rotas que precisam de autenticação
 * Verifica se o token JWT é válido e adiciona os dados do usuário ao req.user
 */
const authMiddleware = (req, res, next) => {
  try {
    // Pega o token do header Authorization
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.status(401).json({ 
        error: 'Token de acesso necessário',
        message: 'Forneça um token válido no header Authorization' 
      });
    }

    // Formato esperado: "Bearer SEU_TOKEN_AQUI"
    const token = authHeader.split(' ')[1];
    
    if (!token) {
      return res.status(401).json({ 
        error: 'Token malformado',
        message: 'Use o formato: Bearer SEU_TOKEN' 
      });
    }

    // Verifica se o token é válido
    const decoded = verifyToken(token);
    
    // Adiciona os dados do usuário ao request para uso nos controllers
    req.user = decoded;
    
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({ 
        error: 'Token expirado',
        message: 'Faça login novamente' 
      });
    }
    
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({ 
        error: 'Token inválido',
        message: 'Token fornecido não é válido' 
      });
    }

    return res.status(500).json({ 
      error: 'Erro na autenticação',
      message: 'Erro interno do servidor' 
    });
  }
};

module.exports = authMiddleware;