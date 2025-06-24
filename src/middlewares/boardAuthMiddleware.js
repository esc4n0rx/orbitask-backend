const BoardModel = require('../models/boardModel');

/**
 * Middleware para verificar se o usuário tem acesso ao board
 * Deve ser usado após stationAuthMiddleware
 */
const boardAuthMiddleware = async (req, res, next) => {
  try {
    const boardId = req.params.boardId || req.params.id;
    const stationId = req.station?.id;
    const userRole = req.userRole;

    if (!boardId) {
      return res.status(400).json({
        error: 'ID do board necessário',
        message: 'Forneça o ID do board na URL'
      });
    }

    // Busca o board
    const board = await BoardModel.findById(boardId);

    if (!board) {
      return res.status(404).json({
        error: 'Board não encontrado',
        message: 'Este board não existe'
      });
    }

    // Verifica se o board pertence à station que o usuário tem acesso
    if (stationId && board.station_id !== stationId) {
      return res.status(403).json({
        error: 'Acesso negado',
        message: 'Este board não pertence à station acessada'
      });
    }

    // Se não temos station do middleware anterior, verifica acesso direto
    if (!stationId) {
      const StationModel = require('../models/stationModel');
      const stationAccess = await StationModel.checkUserAccess(board.station_id, req.user.id);
      
      if (!stationAccess || !stationAccess.hasAccess) {
        return res.status(403).json({
          error: 'Acesso negado',
          message: 'Você não tem acesso à station deste board'
        });
      }

      // Adiciona dados da station ao request
      req.station = stationAccess.station;
      req.userRole = stationAccess.role;
    }

    // Adiciona o board ao request
    req.board = board;

    next();
  } catch (error) {
    console.error('Erro no boardAuthMiddleware:', error);
    return res.status(500).json({
      error: 'Erro na verificação de acesso ao board',
      message: 'Erro interno do servidor'
    });
  }
};

module.exports = boardAuthMiddleware;