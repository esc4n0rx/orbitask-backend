const { requireMember } = require('./roleMiddleware');

/**
 * Middleware específico para verificar permissões de uso da IA
 * Adiciona verificações extras para uso da IA além da autenticação básica
 */
const aiAuthMiddleware = (req, res, next) => {
  // Verifica se a feature de IA está habilitada
  if (process.env.AI_ENABLED !== 'true') {
    return res.status(503).json({
      error: 'Feature não disponível',
      message: 'A Orbit AI está temporariamente desabilitada'
    });
  }

  // Verifica se o token da Arcee está configurado
  if (!process.env.ARCEE_TOKEN) {
    return res.status(503).json({
      error: 'Configuração incompleta',
      message: 'Serviço de IA não está configurado corretamente'
    });
  }

  // Verifica rate limiting básico por usuário (10 perguntas por minuto)
  const userId = req.user.id;
  const cacheKey = `ai_rate_limit_${userId}`;
  
  // Cara, aqui você pode implementar um sistema de cache como Redis
  // Por enquanto, deixamos essa verificação como placeholder
  // Em produção, implemente um rate limiting real
  
  next();
};

/**
 * Middleware para verificar se o usuário tem acesso ao contexto solicitado
 */
const contextAccessMiddleware = async (req, res, next) => {
  try {
    const contextType = req.body.context_type || req.params.contextType;
    const contextId = req.body.context_id || req.params.stationId || req.params.boardId || req.params.taskId;

    if (!contextId) {
      return res.status(400).json({
        error: 'Contexto obrigatório',
        message: 'ID do contexto é obrigatório para usar a IA'
      });
    }

    // Verifica acesso baseado no tipo de contexto
    switch (contextType) {
      case 'station':
        // Middleware stationAuthMiddleware já foi executado
        break;
      case 'board':
        // Middleware boardAuthMiddleware já foi executado
        break;
      case 'task':
        // Verifica se o usuário tem acesso à task
        const TaskModel = require('../models/taskModel');
        const task = await TaskModel.findById(contextId);
        
        if (!task) {
          return res.status(404).json({
            error: 'Task não encontrada',
            message: 'A task especificada não existe'
          });
        }

        // Verifica acesso à station da task
        const StationModel = require('../models/stationModel');
        const stationAccess = await StationModel.checkUserAccess(
          task.board.station_id, 
          req.user.id
        );

        if (!stationAccess || !stationAccess.hasAccess) {
          return res.status(403).json({
            error: 'Acesso negado',
            message: 'Você não tem acesso à station desta task'
          });
        }

        req.task = task;
        req.station = stationAccess.station;
        req.userRole = stationAccess.role;
        break;
      default:
        return res.status(400).json({
          error: 'Tipo de contexto inválido',
          message: 'Tipo de contexto deve ser: station, board ou task'
        });
    }

    next();
  } catch (error) {
    console.error('Erro no contextAccessMiddleware:', error);
    res.status(500).json({
      error: 'Erro na verificação de acesso',
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = {
  aiAuthMiddleware,
  contextAccessMiddleware
};