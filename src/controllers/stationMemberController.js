const StationMemberModel = require('../models/stationMemberModel');

class StationMemberController {
  /**
   * Adiciona um membro à station
   * POST /api/stations/:stationId/members
   */
  static async addMember(req, res, next) {
    try {
      const { stationId } = req.params;
      const { email, role } = req.body;

      const newMember = await StationMemberModel.addMember(stationId, email, role);

      res.status(201).json({
        message: 'Membro adicionado com sucesso à station! 👨‍🚀',
        member: newMember
      });

    } catch (error) {
      if (error.message === 'Usuário não encontrado com este email') {
        return res.status(404).json({
          error: 'Usuário não encontrado',
          message: 'Não existe um usuário cadastrado com este email'
        });
      }

      if (error.message === 'Usuário já é membro desta station') {
        return res.status(409).json({
          error: 'Usuário já é membro',
          message: 'Este usuário já faz parte da station'
        });
      }

      next(error);
    }
  }

  /**
   * Lista todos os membros da station
   * GET /api/stations/:stationId/members
   */
  static async getMembers(req, res, next) {
    try {
      const { stationId } = req.params;

      const members = await StationMemberModel.getMembers(stationId);

      res.status(200).json({
        message: `${members.length} membros encontrados`,
        members
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualiza o role de um membro
   * PUT /api/stations/:stationId/members/:userId
   */
  static async updateMemberRole(req, res, next) {
    try {
      const { stationId, userId } = req.params;
      const { role } = req.body;
      const currentUserRole = req.userRole;

      // Cara, não pode alterar o role do owner da station
      if (req.station.owner_id === userId) {
        return res.status(400).json({
          error: 'Operação não permitida',
          message: 'Não é possível alterar o role do owner da station'
        });
      }

      // Verifica se está tentando promover alguém para um role superior ao seu
      const roleHierarchy = { member: 1, leader: 2, admin: 3, owner: 4 };
      const currentUserLevel = roleHierarchy[currentUserRole];
      const targetRoleLevel = roleHierarchy[role];

      if (targetRoleLevel >= currentUserLevel) {
        return res.status(403).json({
          error: 'Permissão insuficiente',
          message: 'Você não pode promover alguém para um role igual ou superior ao seu'
        });
      }

      const updatedMember = await StationMemberModel.updateMemberRole(stationId, userId, role);

      res.status(200).json({
        message: 'Role do membro atualizado com sucesso!',
        member: updatedMember
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Remove um membro da station
   * DELETE /api/stations/:stationId/members/:userId
   */
  static async removeMember(req, res, next) {
    try {
      const { stationId, userId } = req.params;

      // Não pode remover o owner da station
      if (req.station.owner_id === userId) {
        return res.status(400).json({
          error: 'Operação não permitida',
          message: 'Não é possível remover o owner da station'
        });
      }

      // Não pode se remover
      if (req.user.id === userId) {
        return res.status(400).json({
          error: 'Operação não permitida',
          message: 'Você não pode se remover da station. Peça para um admin fazer isso.'
        });
      }

      await StationMemberModel.removeMember(stationId, userId);

      res.status(200).json({
        message: 'Membro removido da station com sucesso'
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = StationMemberController;