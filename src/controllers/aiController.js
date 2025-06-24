const aiService = require('../services/aiService');
const ContextService = require('../services/contextService');
const { logger } = require('../utils/logger');

class AiController {
  /**
   * Faz pergunta à IA sobre uma station específica
   * POST /api/stations/:stationId/ai/ask
   */
  static async askAboutStation(req, res, next) {
    try {
      const { stationId } = req.params;
      const { query } = req.body;
      const userId = req.user.id;
      const correlationId = req.correlationId;

      logger.info('AI Station Query', {
        stationId,
        userId,
        queryLength: query.length,
        correlationId
      });

      // Coleta contexto da station
      const contextData = await ContextService.getStationContext(stationId, userId);

      // Envia pergunta para a IA
      const aiResponse = await aiService.askOrbitAI(query, contextData, correlationId);

      res.status(200).json({
        message: 'Pergunta processada pela Orbit AI',
        query: query,
        response: aiResponse.response,
        context: {
          type: 'station',
          station_name: contextData.station.name,
          data_points: {
            members: contextData.members.length,
            boards: contextData.boards.length,
            tasks: contextData.tasks.length
          }
        },
        metadata: aiResponse.metadata
      });

    } catch (error) {
      logger.error('AI Station Query Error', {
        error: error.message,
        stationId: req.params.stationId,
        userId: req.user.id,
        correlationId: req.correlationId
      });
      next(error);
    }
  }

  /**
   * Faz pergunta à IA sobre um board específico
   * POST /api/boards/:boardId/ai/ask
   */
  static async askAboutBoard(req, res, next) {
    try {
      const { boardId } = req.params;
      const { query } = req.body;
      const userId = req.user.id;
      const correlationId = req.correlationId;

      logger.info('AI Board Query', {
        boardId,
        userId,
        queryLength: query.length,
        correlationId
      });

      // Coleta contexto do board
      const contextData = await ContextService.getBoardContext(boardId, userId);

      // Envia pergunta para a IA
      const aiResponse = await aiService.askOrbitAI(query, contextData, correlationId);

      res.status(200).json({
        message: 'Pergunta processada pela Orbit AI',
        query: query,
        response: aiResponse.response,
        context: {
          type: 'board',
          board_name: contextData.board.name,
          station_name: contextData.board.station_name,
          data_points: {
            lists: contextData.lists.length,
            tasks: contextData.tasks.length
          }
        },
        metadata: aiResponse.metadata
      });

    } catch (error) {
      logger.error('AI Board Query Error', {
        error: error.message,
        boardId: req.params.boardId,
        userId: req.user.id,
        correlationId: req.correlationId
      });
      next(error);
    }
  }

  /**
   * Faz pergunta à IA sobre uma task específica
   * POST /api/tasks/:taskId/ai/ask
   */
  static async askAboutTask(req, res, next) {
    try {
      const { taskId } = req.params;
      const { query } = req.body;
      const userId = req.user.id;
      const correlationId = req.correlationId;

      logger.info('AI Task Query', {
        taskId,
        userId,
        queryLength: query.length,
        correlationId
      });

      // Coleta contexto da task
      const contextData = await ContextService.getTaskContext(taskId, userId);

      // Envia pergunta para a IA
      const aiResponse = await aiService.askOrbitAI(query, contextData, correlationId);

      res.status(200).json({
        message: 'Pergunta processada pela Orbit AI',
        query: query,
        response: aiResponse.response,
        context: {
          type: 'task',
          task_title: contextData.task.title,
          board_name: contextData.task.board_name,
          station_name: contextData.task.station_name,
          data_points: {
            comments: contextData.comments.length,
            status: contextData.task.status,
            priority: contextData.task.priority
          }
        },
        metadata: aiResponse.metadata
      });

    } catch (error) {
      logger.error('AI Task Query Error', {
        error: error.message,
        taskId: req.params.taskId,
        userId: req.user.id,
        correlationId: req.correlationId
      });
      next(error);
    }
  }

  /**
   * Obtém sugestões da IA para melhorar a station
   * GET /api/stations/:stationId/ai/suggestions
   */
  static async getStationSuggestions(req, res, next) {
    try {
      const { stationId } = req.params;
      const userId = req.user.id;
      const correlationId = req.correlationId;

      // Coleta contexto da station
      const contextData = await ContextService.getStationContext(stationId, userId);

      // Pergunta específica para sugestões
      const suggestionQuery = `
        Analise os dados desta station e forneça 3-5 sugestões específicas para melhorar:
        1. Produtividade da equipe
        2. Organização dos projetos
        3. Gestão de prazos
        4. Distribuição de tarefas
        
        Base suas sugestões nos dados reais fornecidos e seja específico sobre o que pode ser melhorado.
      `;

      const aiResponse = await aiService.askOrbitAI(suggestionQuery, contextData, correlationId);

      res.status(200).json({
        message: 'Sugestões geradas pela Orbit AI',
        station_name: contextData.station.name,
        suggestions: aiResponse.response,
        analysis_based_on: {
          total_tasks: contextData.metrics.total_tasks,
          completion_rate: contextData.metrics.completion_rate,
          overdue_tasks: contextData.metrics.overdue_tasks,
          unassigned_tasks: contextData.metrics.unassigned_tasks,
          active_members: contextData.metrics.active_members
        },
        metadata: aiResponse.metadata
      });

    } catch (error) {
      logger.error('AI Station Suggestions Error', {
        error: error.message,
        stationId: req.params.stationId,
        userId: req.user.id,
        correlationId: req.correlationId
      });
      next(error);
    }
  }

  /**
   * Verifica status da IA e conectividade
   * GET /api/ai/health
   */
  static async healthCheck(req, res, next) {
    try {
      const isHealthy = await aiService.checkApiHealth();
      
      res.status(isHealthy ? 200 : 503).json({
        service: 'Orbit AI',
        status: isHealthy ? 'healthy' : 'unhealthy',
        api_configured: !!process.env.ARCEE_TOKEN,
        feature_enabled: process.env.AI_ENABLED === 'true',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtém resumo de atividades recentes da station
   * GET /api/stations/:stationId/ai/summary
   */
  static async getStationSummary(req, res, next) {
    try {
      const { stationId } = req.params;
      const userId = req.user.id;
      const correlationId = req.correlationId;

      // Coleta contexto da station
      const contextData = await ContextService.getStationContext(stationId, userId);

      // Pergunta específica para resumo
      const summaryQuery = `
        Forneça um resumo executivo desta station incluindo:
        1. Status geral do projeto
        2. Principais realizações
        3. Próximos passos importantes
        4. Alertas ou questões que precisam de atenção
        
        Mantenha o resumo conciso mas informativo.
      `;

      const aiResponse = await aiService.askOrbitAI(summaryQuery, contextData, correlationId);

      res.status(200).json({
        message: 'Resumo gerado pela Orbit AI',
        station_name: contextData.station.name,
        summary: aiResponse.response,
        key_metrics: {
          total_tasks: contextData.metrics.total_tasks,
          completion_rate: `${contextData.metrics.completion_rate}%`,
          overdue_tasks: contextData.metrics.overdue_tasks,
          team_size: contextData.metrics.active_members
        },
        generated_at: new Date().toISOString(),
        metadata: aiResponse.metadata
      });

    } catch (error) {
      logger.error('AI Station Summary Error', {
        error: error.message,
        stationId: req.params.stationId,
        userId: req.user.id,
        correlationId: req.correlationId
      });
      next(error);
    }
  }
}

module.exports = AiController;