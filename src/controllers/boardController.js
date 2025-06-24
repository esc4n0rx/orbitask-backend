const BoardModel = require('../models/boardModel');
const { getAvailableTemplates } = require('../utils/boardTemplates');

class BoardController {
  /**
   * Lista templates disponíveis
   * GET /api/board-templates
   */
  static async getTemplates(req, res, next) {
    try {
      const templates = getAvailableTemplates();

      res.status(200).json({
        message: 'Templates disponíveis',
        templates
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Cria um novo board na station
   * POST /api/stations/:stationId/boards
   */
  static async create(req, res, next) {
    try {
      const { stationId } = req.params;
      const { name, description, template, color } = req.body;
      const userId = req.user.id;

      const newBoard = await BoardModel.create({
        name,
        description,
        station_id: stationId,
        created_by: userId,
        template,
        color
      });

      res.status(201).json({
        message: 'Board criado com sucesso! 🚀',
        board: newBoard
      });

    } catch (error) {
      if (error.message === 'Limite de 10 boards por station atingido') {
        return res.status(400).json({
          error: 'Limite atingido',
          message: 'Esta station já possui o limite de 10 boards'
        });
      }
      next(error);
    }
  }

  /**
   * Lista todos os boards da station
   * GET /api/stations/:stationId/boards
   */
  static async listByStation(req, res, next) {
    try {
      const { stationId } = req.params;

      const boards = await BoardModel.findByStation(stationId);

      res.status(200).json({
        message: `${boards.length} boards encontrados`,
        boards
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtém detalhes completos de um board
   * GET /api/boards/:id
   */
  static async getById(req, res, next) {
    try {
      // req.board vem do boardAuthMiddleware
      const board = req.board;

      res.status(200).json({
        board
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualiza um board
   * PUT /api/boards/:id
   */
  static async update(req, res, next) {
    try {
      const boardId = req.params.id;
      const updateData = req.body;

      const updatedBoard = await BoardModel.update(boardId, updateData);

      res.status(200).json({
        message: 'Board atualizado com sucesso!',
        board: updatedBoard
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Apaga um board
   * DELETE /api/boards/:id
   */
  static async delete(req, res, next) {
    try {
      const boardId = req.params.id;

      await BoardModel.delete(boardId);

      res.status(200).json({
        message: 'Board apagado com sucesso'
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = BoardController;