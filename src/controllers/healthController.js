const supabase = require('../config/supabase');
const metricsCollector = require('../utils/metrics');
const { logger } = require('../utils/logger');

class HealthController {
  /**
   * Health check básico
   * GET /health
   */
  static async basic(req, res, next) {
    try {
      res.status(200).json({
        status: 'OK',
        message: 'Orbitask API está funcionando!',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        correlationId: req.correlationId
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Health check detalhado com verificações de dependências
   * GET /health/detailed
   */
  static async detailed(req, res, next) {
    try {
      const healthData = {
        status: 'OK',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || '1.0.0',
        environment: process.env.NODE_ENV || 'development',
        correlationId: req.correlationId,
        checks: {}
      };

      // Verifica conexão com o banco de dados
      const dbCheck = await HealthController.checkDatabase();
      healthData.checks.database = dbCheck;

      // Verifica uso de memória
      const memoryCheck = HealthController.checkMemory();
      healthData.checks.memory = memoryCheck;

      // Verifica espaço em disco
      const diskCheck = HealthController.checkDisk();
      healthData.checks.disk = diskCheck;

      // Verifica variáveis de ambiente críticas
      const envCheck = HealthController.checkEnvironment();
      healthData.checks.environment = envCheck;

      // Determina status geral baseado nos checks
      const allChecksHealthy = Object.values(healthData.checks)
        .every(check => check.status === 'healthy');

      if (!allChecksHealthy) {
        healthData.status = 'DEGRADED';
        res.status(503);
      }

      res.json(healthData);

    } catch (error) {
      logger.error('Health Check Failed', {
        error: error.message,
        correlationId: req.correlationId
      });

      res.status(503).json({
        status: 'ERROR',
        message: 'Health check failed',
        timestamp: new Date().toISOString(),
        error: error.message,
        correlationId: req.correlationId
      });
    }
  }

  /**
   * Endpoint para métricas de sistema
   * GET /health/metrics
   */
  static async metrics(req, res, next) {
    try {
      const metrics = metricsCollector.getMetrics();
      
      res.json({
        status: 'OK',
        timestamp: new Date().toISOString(),
        correlationId: req.correlationId,
        metrics
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Liveness probe - verifica se o processo está vivo
   * GET /health/live
   */
  static async liveness(req, res, next) {
    try {
      res.status(200).json({
        status: 'alive',
        timestamp: new Date().toISOString(),
        pid: process.pid
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Readiness probe - verifica se está pronto para receber tráfego
   * GET /health/ready
   */
  static async readiness(req, res, next) {
    try {
      // Verifica se consegue conectar no banco
      const dbCheck = await HealthController.checkDatabase();
      
      if (dbCheck.status !== 'healthy') {
        return res.status(503).json({
          status: 'not_ready',
          reason: 'database_unavailable',
          timestamp: new Date().toISOString()
        });
      }

      res.status(200).json({
        status: 'ready',
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      res.status(503).json({
        status: 'not_ready',
        reason: 'internal_error',
        timestamp: new Date().toISOString(),
        error: error.message
      });
    }
  }

  /**
   * Verifica conexão com o banco de dados
   */
  static async checkDatabase() {
    try {
      const startTime = Date.now();
      
      // Cara, aqui fazemos uma query simples para testar a conexão
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .limit(1);

      const duration = Date.now() - startTime;

      if (error) {
        return {
          status: 'unhealthy',
          message: 'Database connection failed',
          error: error.message,
          responseTime: `${duration}ms`
        };
      }

      return {
        status: 'healthy',
        message: 'Database connection successful',
        responseTime: `${duration}ms`
      };

    } catch (error) {
      return {
        status: 'unhealthy',
        message: 'Database check failed',
        error: error.message
      };
    }
  }

  /**
   * Verifica uso de memória
   */
  static checkMemory() {
    const memUsage = process.memoryUsage();
    const totalMem = memUsage.heapTotal;
    const usedMem = memUsage.heapUsed;
    const memoryUsagePercent = (usedMem / totalMem) * 100;

    const status = memoryUsagePercent > 90 ? 'unhealthy' : 
                   memoryUsagePercent > 75 ? 'warning' : 'healthy';

    return {
      status,
      message: `Memory usage: ${memoryUsagePercent.toFixed(2)}%`,
      details: {
        heapUsed: `${Math.round(usedMem / 1024 / 1024)}MB`,
        heapTotal: `${Math.round(totalMem / 1024 / 1024)}MB`,
        rss: `${Math.round(memUsage.rss / 1024 / 1024)}MB`,
        external: `${Math.round(memUsage.external / 1024 / 1024)}MB`
      }
    };
  }

  /**
   * Verifica espaço em disco (simulado - em produção usaria fs.stats)
   */
  static checkDisk() {
    // Em produção, você implementaria uma verificação real de disco
    // Por agora, retornamos um status simulado
    return {
      status: 'healthy',
      message: 'Disk space check not implemented',
      details: {
        note: 'In production, implement actual disk space checking'
      }
    };
  }

  /**
   * Verifica variáveis de ambiente críticas
   */
  static checkEnvironment() {
    const requiredEnvVars = [
      'SUPABASE_URL',
      'SUPABASE_ANON_KEY',
      'JWT_SECRET'
    ];

    const missingVars = requiredEnvVars.filter(envVar => !process.env[envVar]);

    if (missingVars.length > 0) {
      return {
        status: 'unhealthy',
        message: 'Missing required environment variables',
        missing: missingVars
      };
    }

    return {
      status: 'healthy',
      message: 'All required environment variables are set',
      nodeEnv: process.env.NODE_ENV || 'development'
    };
  }
}

module.exports = HealthController;