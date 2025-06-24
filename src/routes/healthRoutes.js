const express = require('express');
const HealthController = require('../controllers/healthController');

const router = express.Router();

/**
 * @swagger
 * /health:
 *   get:
 *     tags: [Health Check]
 *     summary: Health check básico da API
 *     responses:
 *       200:
 *         description: API está funcionando
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *                   example: OK
 *                 message:
 *                   type: string
 *                   example: Orbitask API está funcionando!
 *                 timestamp:
 *                   type: string
 *                   format: date-time
 *                 uptime:
 *                   type: number
 *                   example: 3600.5
 */
router.get('/', HealthController.basic);

/**
 * @swagger
 * /health/detailed:
 *   get:
 *     tags: [Health Check]
 *     summary: Health check detalhado com verificação de dependências
 *     responses:
 *       200:
 *         description: Sistema saudável
 *       503:
 *         description: Sistema com problemas
 */
router.get('/detailed', HealthController.detailed);

/**
 * @swagger
 * /health/metrics:
 *   get:
 *     tags: [Health Check]
 *     summary: Métricas de performance e sistema
 *     responses:
 *       200:
 *         description: Métricas coletadas
 */
router.get('/metrics', HealthController.metrics);

/**
 * @swagger
 * /health/live:
 *   get:
 *     tags: [Health Check]
 *     summary: Liveness probe - verifica se o processo está vivo
 *     responses:
 *       200:
 *         description: Processo está vivo
 */
router.get('/live', HealthController.liveness);

/**
 * @swagger
 * /health/ready:
 *   get:
 *     tags: [Health Check]
 *     summary: Readiness probe - verifica se está pronto para tráfego
 *     responses:
 *       200:
 *         description: Pronto para receber requisições
 *       503:
 *         description: Não está pronto
 */
router.get('/ready', HealthController.readiness);

module.exports = router;