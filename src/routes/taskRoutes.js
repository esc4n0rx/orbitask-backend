const express = require('express');
const TaskController = require('../controllers/taskController');
const validate = require('../middlewares/validationMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');
const boardAuthMiddleware = require('../middlewares/boardAuthMiddleware');
const { requireMember, requireLeader } = require('../middlewares/roleMiddleware');
const {
  createTaskSchema,
  updateTaskSchema,
  assignTaskSchema,
  moveTaskSchema,
  getBoardTasksSchema,
  getTaskSchema,
  deleteTaskSchema,
  addCommentSchema,
  updateCommentSchema,
  getCommentsSchema,
  deleteCommentSchema
} = require('../schemas/taskSchemas');

const router = express.Router();

/**
 * @swagger
 * /api/lists/{listId}/tasks:
 *   post:
 *     tags: [Tasks]
 *     summary: Cria uma nova task na lista
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: listId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *                 default: medium
 *               due_date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       201:
 *         description: Task criada com sucesso
 */
router.post('/lists/:listId/tasks', 
  authMiddleware, 
  requireMember, 
  validate(createTaskSchema), 
  TaskController.create
);

/**
 * @swagger
 * /api/boards/{boardId}/tasks:
 *   get:
 *     tags: [Tasks]
 *     summary: Lista todas as tasks do board com filtros
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: boardId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: assigned_to
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: query
 *         name: priority
 *         schema:
 *           type: string
 *           enum: [low, medium, high, urgent]
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [todo, in_progress, review, done]
 *       - in: query
 *         name: search
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Lista de tasks
 */
router.get('/boards/:boardId/tasks', 
  authMiddleware, 
  boardAuthMiddleware, 
  requireMember, 
  validate(getBoardTasksSchema), 
  TaskController.getByBoard
);

/**
 * @swagger
 * /api/tasks/{id}:
 *   get:
 *     tags: [Tasks]
 *     summary: Obtém detalhes completos de uma task
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Detalhes da task
 *       404:
 *         description: Task não encontrada
 */
router.get('/tasks/:id', 
  authMiddleware, 
  validate(getTaskSchema), 
  TaskController.getById
);

/**
 * @swagger
 * /api/tasks/{id}:
 *   put:
 *     tags: [Tasks]
 *     summary: Atualiza uma task
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 200
 *               description:
 *                 type: string
 *                 maxLength: 2000
 *               priority:
 *                 type: string
 *                 enum: [low, medium, high, urgent]
 *               status:
 *                 type: string
 *                 enum: [todo, in_progress, review, done]
 *               due_date:
 *                 type: string
 *                 format: date-time
 *     responses:
 *       200:
 *         description: Task atualizada
 */
router.put('/tasks/:id', 
  authMiddleware, 
  validate(updateTaskSchema), 
  TaskController.update
);

/**
 * @swagger
 * /api/tasks/{id}/assign:
 *   put:
 *     tags: [Tasks]
 *     summary: Atribui ou desatribui uma task (leader+)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               assigned_to:
 *                 type: string
 *                 format: uuid
 *                 nullable: true
 *     responses:
 *       200:
 *         description: Task atribuída/desatribuída
 *       400:
 *         description: Usuário não é membro da station
 */
router.put('/tasks/:id/assign', 
  authMiddleware, 
  requireLeader, 
  validate(assignTaskSchema), 
  TaskController.assign
);

/**
 * @swagger
 * /api/tasks/{id}/move:
 *   put:
 *     tags: [Tasks]
 *     summary: Move uma task entre listas
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               list_id:
 *                 type: string
 *                 format: uuid
 *               position:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Task movida
 */
router.put('/tasks/:id/move', 
  authMiddleware, 
  validate(moveTaskSchema), 
  TaskController.move
);

/**
 * @swagger
 * /api/tasks/{id}:
 *   delete:
 *     tags: [Tasks]
 *     summary: Apaga uma task
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Task apagada
 */
router.delete('/tasks/:id', 
  authMiddleware, 
  validate(deleteTaskSchema), 
  TaskController.delete
);

// ===== ROTAS DE COMENTÁRIOS =====

/**
 * @swagger
 * /api/tasks/{taskId}/comments:
 *   post:
 *     tags: [Task Comments]
 *     summary: Adiciona um comentário à task
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *     responses:
 *       201:
 *         description: Comentário adicionado
 */
router.post('/tasks/:taskId/comments', 
  authMiddleware, 
  validate(addCommentSchema), 
  TaskController.addComment
);

/**
 * @swagger
 * /api/tasks/{taskId}/comments:
 *   get:
 *     tags: [Task Comments]
 *     summary: Lista comentários da task
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: taskId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Lista de comentários
 */
router.get('/tasks/:taskId/comments', 
  authMiddleware, 
  validate(getCommentsSchema), 
  TaskController.getComments
);

/**
 * @swagger
 * /api/comments/{id}:
 *   put:
 *     tags: [Task Comments]
 *     summary: Atualiza um comentário (apenas autor)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               content:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 1000
 *     responses:
 *       200:
 *         description: Comentário atualizado
 *       403:
 *         description: Apenas o autor pode editar
 */
router.put('/comments/:id', 
  authMiddleware, 
  validate(updateCommentSchema), 
  TaskController.updateComment
);

/**
 * @swagger
 * /api/comments/{id}:
 *   delete:
 *     tags: [Task Comments]
 *     summary: Apaga um comentário (apenas autor)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Comentário apagado
 *       403:
 *         description: Apenas o autor pode apagar
 */
router.delete('/comments/:id', 
  authMiddleware, 
  validate(deleteCommentSchema), 
  TaskController.deleteComment
);

module.exports = router;