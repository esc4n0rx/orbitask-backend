const express = require('express');
const StationMemberController = require('../controllers/stationMemberController');
const validate = require('../middlewares/validationMiddleware');
const authMiddleware = require('../middlewares/authMiddleware');
const stationAuthMiddleware = require('../middlewares/stationAuthMiddleware');
const { requireAdmin, requireMember } = require('../middlewares/roleMiddleware');
const {
  addMemberSchema,
  updateMemberRoleSchema,
  removeMemberSchema,
  getMembersSchema
} = require('../schemas/memberSchemas');

const router = express.Router();

/**
 * @swagger
 * /api/stations/{stationId}/members:
 *   post:
 *     tags: [Station Members]
 *     summary: Adiciona um membro à station (apenas admin+)
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
 *               email:
 *                 type: string
 *                 format: email
 *               role:
 *                 type: string
 *                 enum: [admin, leader, member]
 *                 default: member
 *     responses:
 *       201:
 *         description: Membro adicionado com sucesso
 *       404:
 *         description: Usuário não encontrado
 *       409:
 *         description: Usuário já é membro
 */
router.post('/:stationId/members', authMiddleware, stationAuthMiddleware, requireAdmin, validate(addMemberSchema), StationMemberController.addMember);

/**
 * @swagger
 * /api/stations/{stationId}/members:
 *   get:
 *     tags: [Station Members]
 *     summary: Lista todos os membros da station
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
 *         description: Lista de membros
 */
router.get('/:stationId/members', authMiddleware, stationAuthMiddleware, requireMember, validate(getMembersSchema), StationMemberController.getMembers);

/**
 * @swagger
 * /api/stations/{stationId}/members/{userId}:
 *   put:
 *     tags: [Station Members]
 *     summary: Atualiza o role de um membro (apenas admin+)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: userId
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
 *               role:
 *                 type: string
 *                 enum: [admin, leader, member]
 *     responses:
 *       200:
 *         description: Role atualizado
 *       400:
 *         description: Não pode alterar role do owner
 *       403:
 *         description: Permissão insuficiente
 */
router.put('/:stationId/members/:userId', authMiddleware, stationAuthMiddleware, requireAdmin, validate(updateMemberRoleSchema), StationMemberController.updateMemberRole);

/**
 * @swagger
 * /api/stations/{stationId}/members/{userId}:
 *   delete:
 *     tags: [Station Members]
 *     summary: Remove um membro da station (apenas admin+)
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: stationId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *       - in: path
 *         name: userId
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Membro removido
 *       400:
 *         description: Não pode remover owner ou a si mesmo
 */
router.delete('/:stationId/members/:userId', authMiddleware, stationAuthMiddleware, requireAdmin, validate(removeMemberSchema), StationMemberController.removeMember);

module.exports = router;