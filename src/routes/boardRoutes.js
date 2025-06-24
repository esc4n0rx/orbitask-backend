const express = require('express');
const BoardController = require('../controllers/boardController');
const ListController = require('../controllers/listController');
const validate = require('../middlewares/validationMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');
const stationAuthMiddleware = require('../middlewares/stationAuthMiddleware');
const boardAuthMiddleware = require('../middlewares/boardAuthMiddleware');
const { requireLeader, requireAdmin, requireMember } = require('../middlewares/roleMiddleware');
const {
  createBoardSchema,
  updateBoardSchema,
  getBoardsSchema,
  getBoardSchema,
  deleteBoardSchema
} = require('../schemas/boardSchemas');
const {
  createListSchema,
  updateListSchema,
  reorderListSchema,
  getListsSchema,
  deleteListSchema
} = require('../schemas/listSchemas');

const router = express.Router();

/**
 * @swagger
 * /api/board-templates:
 *   get:
 *     tags: [Board Templates]
 *     summary: Lista templates disponíveis para boards
 *     responses:
 *       200:
 *         description: Lista de templates
 */
router.get('/board-templates', BoardController.getTemplates);

/**
 * @swagger
 * /api/stations/{stationId}/boards:
 *   post:
 *     tags: [Boards]
 *     summary: Cria um novo board na station (leader+)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stationId
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
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               template:
 *                 type: string
 *                 enum: [kanban, sprint, personal, bugs]
 *                 default: kanban
 *               color:
 *                 type: string
 *                 pattern: '^#[0-9A-Fa-f]{6}$'
 *     responses:
 *       201:
 *         description: Board criado com sucesso
 *       400:
 *         description: Limite de boards atingido
 */
router.post('/stations/:stationId/boards', 
  authMiddleware, 
  stationAuthMiddleware, 
  requireLeader, 
  validate(createBoardSchema), 
  BoardController.create
);

/**
 * @swagger
 * /api/stations/{stationId}/boards:
 *   get:
 *     tags: [Boards]
 *     summary: Lista todos os boards da station
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Lista de boards
 */
router.get('/stations/:stationId/boards', 
  authMiddleware, 
  stationAuthMiddleware, 
  requireMember, 
  validate(getBoardsSchema), 
  BoardController.listByStation
);

/**
 * @swagger
 * /api/boards/{id}:
 *   get:
 *     tags: [Boards]
 *     summary: Obtém detalhes completos de um board
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
 *         description: Detalhes do board
 *       404:
 *         description: Board não encontrado
 */
router.get('/boards/:id', 
  authMiddleware, 
  boardAuthMiddleware, 
  requireMember, 
  validate(getBoardSchema), 
  BoardController.getById
);

/**
 * @swagger
 * /api/boards/{id}:
 *   put:
 *     tags: [Boards]
 *     summary: Atualiza um board (admin+ ou criador)
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
 *               name:
 *                 type: string
 *                 minLength: 2
 *                 maxLength: 100
 *               description:
 *                 type: string
 *                 maxLength: 500
 *               color:
 *                 type: string
 *                 pattern: '^#[0-9A-Fa-f]{6}$'
 *     responses:
 *       200:
 *         description: Board atualizado
 *       403:
 *         description: Permissão insuficiente
 */
router.put('/boards/:id', 
  authMiddleware, 
  boardAuthMiddleware, 
  requireLeader, 
  validate(updateBoardSchema), 
  BoardController.update
);

/**
 * @swagger
 * /api/boards/{id}:
 *   delete:
 *     tags: [Boards]
 *     summary: Apaga um board (admin+ ou criador)
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
 *         description: Board apagado
 *       403:
 *         description: Permissão insuficiente
 */
router.delete('/boards/:id', 
  authMiddleware, 
  boardAuthMiddleware, 
  requireAdmin, 
  validate(deleteBoardSchema), 
  BoardController.delete
);

// ===== ROTAS DE LISTAS =====

/**
 * @swagger
 * /api/boards/{boardId}/lists:
 *   post:
 *     tags: [Lists]
 *     summary: Cria uma nova lista no board (leader+)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: boardId
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
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *     responses:
 *       201:
 *         description: Lista criada com sucesso
 */
router.post('/boards/:boardId/lists', 
  authMiddleware, 
  boardAuthMiddleware, 
  requireLeader, 
  validate(createListSchema), 
  ListController.create
);

/**
 * @swagger
 * /api/boards/{boardId}/lists:
 *   get:
 *     tags: [Lists]
 *     summary: Lista todas as listas do board
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: boardId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Lista de listas
 */
router.get('/boards/:boardId/lists', 
  authMiddleware, 
  boardAuthMiddleware, 
  requireMember, 
  validate(getListsSchema), 
  ListController.getByBoard
);

/**
 * @swagger
 * /api/lists/{id}:
 *   put:
 *     tags: [Lists]
 *     summary: Atualiza uma lista (leader+)
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
 *               name:
 *                 type: string
 *                 minLength: 1
 *                 maxLength: 100
 *     responses:
 *       200:
 *         description: Lista atualizada
 */
router.put('/lists/:id', 
  authMiddleware, 
  // Cara, aqui precisa verificar acesso via lista -> board -> station
  validate(updateListSchema), 
  ListController.update
);

/**
 * @swagger
 * /api/lists/{id}/reorder:
 *   put:
 *     tags: [Lists]
 *     summary: Reordena uma lista (leader+)
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
 *               position:
 *                 type: number
 *                 minimum: 0
 *     responses:
 *       200:
 *         description: Lista reordenada
 */
router.put('/lists/:id/reorder', 
  authMiddleware, 
  validate(reorderListSchema), 
  ListController.reorder
);

/**
 * @swagger
 * /api/lists/{id}:
 *   delete:
 *     tags: [Lists]
 *     summary: Apaga uma lista (admin+)
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
 *         description: Lista apagada
 */
router.delete('/lists/:id', 
  authMiddleware, 
  validate(deleteListSchema), 
  ListController.delete
);

module.exports = router;