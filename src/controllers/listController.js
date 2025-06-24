const ListModel = require('../models/listModel');

class ListController {
  /**
   * Cria uma nova lista no board
   * POST /api/boards/:boardId/lists
   */
  static async create(req, res, next) {
    try {
      const { boardId } = req.params;
      const { name } = req.body;

      const newList = await ListModel.create({
        name,
        board_id: boardId
      });

      res.status(201).json({
        message: 'Lista criada com sucesso!',
        list: newList
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Lista todas as listas do board
   * GET /api/boards/:boardId/lists
   */
  static async getByBoard(req, res, next) {
    try {
      const { boardId } = req.params;

      const lists = await ListModel.findByBoard(boardId);

      res.status(200).json({
        message: `${lists.length} listas encontradas`,
        lists
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualiza uma lista
   * PUT /api/lists/:id
   */
  static async update(req, res, next) {
    try {
      const listId = req.params.id;
      const { name } = req.body;

      const updatedList = await ListModel.update(listId, { name });

      res.status(200).json({
        message: 'Lista atualizada com sucesso!',
        list: updatedList
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Reordena uma lista (atualiza posição)
   * PUT /api/lists/:id/reorder
   */
  static async reorder(req, res, next) {
    try {
      const listId = req.params.id;
      const { position } = req.body;

      const reorderedList = await ListModel.reorder(listId, position);

      res.status(200).json({
        message: 'Lista reordenada com sucesso!',
        list: reorderedList
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Apaga uma lista
   * DELETE /api/lists/:id
   */
  static async delete(req, res, next) {
    try {
      const listId = req.params.id;

      await ListModel.delete(listId);

      res.status(200).json({
        message: 'Lista apagada com sucesso'
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = ListController;