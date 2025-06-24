const StationModel = require('../models/stationModel');
const StationMemberModel = require('../models/stationMemberModel');

class StationController {
  /**
   * Cria uma nova station
   * POST /api/stations
   */
  static async create(req, res, next) {
    try {
      const { name, description } = req.body;
      const userId = req.user.id;

      // Cria a station
      const newStation = await StationModel.create({
        name,
        description,
        owner_id: userId
      });

      // Cara, aqui eu adiciono automaticamente o criador como owner na tabela de membros
      // Isso facilita as consultas depois
      await StationMemberModel.addMember(newStation.id, req.user.email, 'owner');

      res.status(201).json({
        message: 'Station criada com sucesso! 🚀',
        station: newStation
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Lista todas as stations do usuário
   * GET /api/stations
   */
  static async list(req, res, next) {
    try {
      const userId = req.user.id;

      const stations = await StationModel.findByUserId(userId);

      res.status(200).json({
        message: `Encontradas ${stations.length} stations`,
        stations
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Obtém detalhes de uma station específica
   * GET /api/stations/:id
   */
  static async getById(req, res, next) {
    try {
      // req.station vem do stationAuthMiddleware
      const station = req.station;
      const userRole = req.userRole;

      // Busca quantidade de membros
      const memberCount = await StationMemberModel.countMembers(station.id);

      res.status(200).json({
        station: {
          ...station,
          member_count: memberCount,
          user_role: userRole
        }
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Atualiza uma station
   * PUT /api/stations/:id
   */
  static async update(req, res, next) {
    try {
      const stationId = req.params.id;
      const updateData = req.body;

      const updatedStation = await StationModel.update(stationId, updateData);

      res.status(200).json({
        message: 'Station atualizada com sucesso!',
        station: updatedStation
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Completa uma station (soft delete)
   * DELETE /api/stations/:id
   */
  static async complete(req, res, next) {
    try {
      const stationId = req.params.id;

      const completedStation = await StationModel.complete(stationId);

      res.status(200).json({
        message: 'Station completada e movida para o histórico',
        station: completedStation
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = StationController;