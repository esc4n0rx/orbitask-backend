const StationModel = require('../models/stationModel');

/**
 * Middleware para verificar se o usuário tem acesso à station
 * Deve ser usado após o authMiddleware
 */
const stationAuthMiddleware = async (req, res, next) => {
  try {
    const stationId = req.params.stationId || req.params.id;
    const userId = req.user.id;

    if (!stationId) {
      return res.status(400).json({
        error: 'ID da station necessário',
        message: 'Forneça o ID da station na URL'
      });
    }

    // Verifica acesso do usuário à station
    const accessData = await StationModel.checkUserAccess(stationId, userId);

    if (!accessData) {
      return res.status(404).json({
        error: 'Station não encontrada',
        message: 'Esta station não existe ou foi completada'
      });
    }

    if (!accessData.hasAccess) {
      return res.status(403).json({
        error: 'Acesso negado',
        message: 'Você não tem permissão para acessar esta station'
      });
    }

    // Adiciona os dados da station e role do usuário ao request
    req.station = accessData.station;
    req.userRole = accessData.role;

    next();
  } catch (error) {
    console.error('Erro no stationAuthMiddleware:', error);
    return res.status(500).json({
      error: 'Erro na verificação de acesso',
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = stationAuthMiddleware;