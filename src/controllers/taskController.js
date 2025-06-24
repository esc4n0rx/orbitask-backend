const TaskModel = require('../models/taskModel');
const StationMemberModel = require('../models/stationMemberModel');

class TaskController {
  /**
   * Cria uma nova task na lista
   * POST /api/lists/:listId/tasks
   */
  static async create(req, res, next) {
    try {
      const { listId } = req.params;
      const { title, description, priority, due_date } = req.body;
      const userId = req.user.id;

      const newTask = await TaskModel.create({
        title,
        description,
        list_id: listId,
        priority,
        due_date,
        created_by: userId
      });

      res.status(201).json({
        message: 'Task criada com sucesso! ✨',
        task: newTask
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Lista todas as tasks do board com filtros
   * GET /api/boards/:boardId/tasks
   */
  static async getByBoard(req, res, next) {
    try {
      const { boardId } = req.params;
      const filters = req.query;

      const tasks = await TaskModel.findByBoard(boardId, filters);

      res.status(200).json({
        message: `${tasks.length} tasks encontradas`,
        tasks,
        filters: filters
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtém detalhes completos de uma task
   * GET /api/tasks/:id
   */
  static async getById(req, res, next) {
    try {
      const taskId = req.params.id;

      const task = await TaskModel.findById(taskId);

      if (!task) {
        return res.status(404).json({
          error: 'Task não encontrada',
          message: 'Esta task não existe'
        });
      }

      res.status(200).json({
        task
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualiza uma task
   * PUT /api/tasks/:id
   */
  static async update(req, res, next) {
    try {
      const taskId = req.params.id;
      const updateData = req.body;

      const updatedTask = await TaskModel.update(taskId, updateData);

      res.status(200).json({
        message: 'Task atualizada com sucesso!',
        task: updatedTask
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Atribui uma task para um usuário
   * PUT /api/tasks/:id/assign
   */
  static async assign(req, res, next) {
    try {
      const taskId = req.params.id;
      const { assigned_to } = req.body;

      // Cara, se tá atribuindo pra alguém, verifica se essa pessoa é membro da station
      if (assigned_to) {
        const task = await TaskModel.findById(taskId);
        if (!task) {
          return res.status(404).json({
            error: 'Task não encontrada',
            message: 'Esta task não existe'
          });
        }

        const stationId = task.board.station_id;
        const member = await StationMemberModel.findMember(stationId, assigned_to);
        
        if (!member) {
          return res.status(400).json({
            error: 'Usuário não é membro',
            message: 'Só é possível atribuir tasks para membros da station'
          });
        }
      }

      const assignedTask = await TaskModel.assign(taskId, assigned_to);

      res.status(200).json({
        message: assigned_to ? 'Task atribuída com sucesso!' : 'Task desatribuída com sucesso!',
        task: assignedTask
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Move uma task entre listas
   * PUT /api/tasks/:id/move
   */
  static async move(req, res, next) {
    try {
      const taskId = req.params.id;
      const { list_id, position } = req.body;

      const movedTask = await TaskModel.move(taskId, list_id, position);

      res.status(200).json({
        message: 'Task movida com sucesso!',
        task: movedTask
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Apaga uma task
   * DELETE /api/tasks/:id
   */
  static async delete(req, res, next) {
    try {
      const taskId = req.params.id;

      await TaskModel.delete(taskId);

      res.status(200).json({
        message: 'Task apagada com sucesso'
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Adiciona comentário à task
   * POST /api/tasks/:taskId/comments
   */
  static async addComment(req, res, next) {
    try {
      const { taskId } = req.params;
      const { content } = req.body;
      const userId = req.user.id;

      const newComment = await TaskModel.addComment(taskId, userId, content);

      res.status(201).json({
        message: 'Comentário adicionado com sucesso!',
        comment: newComment
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Lista comentários da task
   * GET /api/tasks/:taskId/comments
   */
  static async getComments(req, res, next) {
    try {
      const { taskId } = req.params;

      const comments = await TaskModel.getComments(taskId);

      res.status(200).json({
        message: `${comments.length} comentários encontrados`,
        comments
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualiza um comentário
   * PUT /api/comments/:id
   */
  static async updateComment(req, res, next) {
    try {
      const commentId = req.params.id;
      const { content } = req.body;

      // Verifica se o comentário existe e se o usuário pode editá-lo
      const comment = await TaskModel.findCommentById(commentId);
      if (!comment) {
        return res.status(404).json({
          error: 'Comentário não encontrado',
          message: 'Este comentário não existe'
        });
      }

      // Só o autor do comentário pode editá-lo
      if (comment.user_id !== req.user.id) {
        return res.status(403).json({
          error: 'Permissão negada',
          message: 'Você só pode editar seus próprios comentários'
        });
      }

      const updatedComment = await TaskModel.updateComment(commentId, content);

      res.status(200).json({
        message: 'Comentário atualizado com sucesso!',
        comment: updatedComment
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Apaga um comentário
   * DELETE /api/comments/:id
   */
  static async deleteComment(req, res, next) {
    try {
      const commentId = req.params.id;

      // Verifica se o comentário existe e se o usuário pode apagá-lo
      const comment = await TaskModel.findCommentById(commentId);
      if (!comment) {
        return res.status(404).json({
          error: 'Comentário não encontrado',
          message: 'Este comentário não existe'
        });
      }

      // Só o autor do comentário pode apagá-lo
      if (comment.user_id !== req.user.id) {
        return res.status(403).json({
          error: 'Permissão negada',
          message: 'Você só pode apagar seus próprios comentários'
        });
      }

      await TaskModel.deleteComment(commentId);

      res.status(200).json({
        message: 'Comentário apagado com sucesso'
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = TaskController;