/**
 * Middleware para verificar permissões baseadas em roles
 * Deve ser usado após stationAuthMiddleware
 */

// Hierarquia de permissões: owner > admin > leader > member
const roleHierarchy = {
    owner: 4,
    admin: 3,
    leader: 2,
    member: 1
  };
  
  /**
   * Cria middleware que verifica se o usuário tem role mínimo necessário
   * @param {string} minRole - Role mínimo necessário
   * @returns {Function} Middleware do Express
   */
  const requireRole = (minRole) => {
    return (req, res, next) => {
      const userRole = req.userRole;
      
      if (!userRole) {
        return res.status(403).json({
          error: 'Acesso negado',
          message: 'Role do usuário não identificado'
        });
      }
  
      const userLevel = roleHierarchy[userRole];
      const minLevel = roleHierarchy[minRole];
  
      if (!userLevel || !minLevel) {
        return res.status(500).json({
          error: 'Erro de configuração',
          message: 'Role inválido configurado'
        });
      }
  
      if (userLevel < minLevel) {
        return res.status(403).json({
          error: 'Permissão insuficiente',
          message: `Esta ação requer pelo menos o role: ${minRole}`
        });
      }
  
      next();
    };
  };
  
  /**
   * Middleware que permite apenas owners
   */
  const requireOwner = requireRole('owner');
  
  /**
   * Middleware que permite admin ou superior
   */
  const requireAdmin = requireRole('admin');
  
  /**
   * Middleware que permite leader ou superior
   */
  const requireLeader = requireRole('leader');
  
  /**
   * Middleware que permite qualquer membro
   */
  const requireMember = requireRole('member');
  
  module.exports = {
    requireRole,
    requireOwner,
    requireAdmin,
    requireLeader,
    requireMember
  };