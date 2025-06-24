const express = require('express');
const StationController = require('../controllers/stationController');
const validate = require('../middlewares/validationMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');
const stationAuthMiddleware = require('../middlewares/stationAuthMiddleware');
const { requireAdmin, requireOwner } = require('../middlewares/roleMiddleware');
const {
  createStationSchema,
  updateStationSchema,
  getStationSchema,
  completeStationSchema
} = require('../schemas/stationSchemas');

const router = express.Router();

/**
 * @swagger
 * /api/stations:
 *   post:
 *     tags: [Stations]
 *     summary: Cria uma nova station
 *     security:
 *       - bearerAuth: []
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
 *     responses:
 *       201:
 *         description: Station criada com sucesso
 *       400:
 *         description: Dados inválidos
 */
router.post('/', authMiddleware, validate(createStationSchema), StationController.create);

/**
 * @swagger
 * /api/stations:
 *   get:
 *     tags: [Stations]
 *     summary: Lista todas as stations do usuário
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de stations
 */
router.get('/', authMiddleware, StationController.list);

/**
 * @swagger
 * /api/stations/{id}:
 *   get:
 *     tags: [Stations]
 *     summary: Obtém detalhes de uma station
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
 *         description: Detalhes da station
 *       404:
 *         description: Station não encontrada
 */
router.get('/:id', authMiddleware, stationAuthMiddleware, validate(getStationSchema), StationController.getById);

/**
 * @swagger
 * /api/stations/{id}:
 *   put:
 *     tags: [Stations]
 *     summary: Atualiza uma station (apenas admin+)
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
 *     responses:
 *       200:
 *         description: Station atualizada
 *       403:
 *         description: Permissão insuficiente
 */
router.put('/:id', authMiddleware, stationAuthMiddleware, requireAdmin, validate(updateStationSchema), StationController.update);

/**
 * @swagger
 * /api/stations/{id}:
 *   delete:
 *     tags: [Stations]
 *     summary: Completa uma station (apenas owner)
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
 *         description: Station completada
 *       403:
 *         description: Apenas o owner pode completar
 */
router.delete('/:id', authMiddleware, stationAuthMiddleware, requireOwner, validate(completeStationSchema), StationController.complete);

module.exports = router;