const express = require('express');
const AiController = require('../controllers/aiController');
const validate = require('../middlewares/validationMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');
const stationAuthMiddleware = require('../middlewares/stationAuthMiddleware');
const boardAuthMiddleware = require('../middlewares/boardAuthMiddleware');
const { aiAuthMiddleware, contextAccessMiddleware } = require('../middlewares/aiAuthMiddleware');
const { requireMember, requireLeader } = require('../middlewares/roleMiddleware');
const {
  askStationAiSchema,
  askBoardAiSchema,
  askTaskAiSchema
} = require('../schemas/aiSchemas');

const router = express.Router();

/**
 * @swagger
 * components:
 *   schemas:
 *     AiResponse:
 *       type: object
 *       properties:
 *         message:
 *           type: string
 *         query:
 *           type: string
 *         response:
 *           type: string
 *         context:
 *           type: object
 *         metadata:
 *           type: object
 *     AiQuery:
 *       type: object
 *       properties:
 *         query:
 *           type: string
 *           minLength: 1
 *           maxLength: 1000
 *           example: "Como está o progresso das tasks desta semana?"
 */

/**
 * @swagger
 * /api/ai/health:
 *   get:
 *     tags: [Orbit AI]
 *     summary: Verifica status da IA
 *     responses:
 *       200:
 *         description: IA funcionando
 *       503:
 *         description: IA indisponível
 */
router.get('/ai/health', AiController.healthCheck);

/**
 * @swagger
 * /api/stations/{stationId}/ai/ask:
 *   post:
 *     tags: [Orbit AI]
 *     summary: Faz pergunta à IA sobre uma station
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
 *             $ref: '#/components/schemas/AiQuery'
 *     responses:
 *       200:
 *         description: Resposta da IA
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AiResponse'
 *       400:
 *         description: Pergunta inválida
 *       403:
 *         description: Sem acesso à station
 *       503:
 *         description: IA indisponível
 */
router.post('/stations/:stationId/ai/ask', 
  authMiddleware, 
  stationAuthMiddleware, 
  requireMember, 
  aiAuthMiddleware,
  validate(askStationAiSchema), 
  AiController.askAboutStation
);

/**
 * @swagger
 * /api/stations/{stationId}/ai/suggestions:
 *   get:
 *     tags: [Orbit AI]
 *     summary: Obtém sugestões de melhoria da IA
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
 *         description: Sugestões da IA
 */
router.get('/stations/:stationId/ai/suggestions', 
  authMiddleware, 
  stationAuthMiddleware, 
  requireLeader, 
  aiAuthMiddleware,
  AiController.getStationSuggestions
);

/**
 * @swagger
 * /api/stations/{stationId}/ai/summary:
 *   get:
 *     tags: [Orbit AI]
 *     summary: Obtém resumo executivo da station
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
 *         description: Resumo da IA
 */
router.get('/stations/:stationId/ai/summary', 
  authMiddleware, 
  stationAuthMiddleware, 
  requireMember, 
  aiAuthMiddleware,
  AiController.getStationSummary
);

/**
 * @swagger
 * /api/boards/{boardId}/ai/ask:
 *   post:
 *     tags: [Orbit AI]
 *     summary: Faz pergunta à IA sobre um board
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
 *             $ref: '#/components/schemas/AiQuery'
 *     responses:
 *       200:
 *         description: Resposta da IA
 */
router.post('/boards/:boardId/ai/ask', 
  authMiddleware, 
  boardAuthMiddleware, 
  requireMember, 
  aiAuthMiddleware,
  validate(askBoardAiSchema), 
  AiController.askAboutBoard
);

/**
 * @swagger
 * /api/tasks/{taskId}/ai/ask:
 *   post:
 *     tags: [Orbit AI]
 *     summary: Faz pergunta à IA sobre uma task
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
 *             $ref: '#/components/schemas/AiQuery'
 *     responses:
 *       200:
 *         description: Resposta da IA
 */
router.post('/tasks/:taskId/ai/ask', 
  authMiddleware, 
  aiAuthMiddleware,
  contextAccessMiddleware,
  requireMember, 
  validate(askTaskAiSchema), 
  AiController.askAboutTask
);

module.exports = router;