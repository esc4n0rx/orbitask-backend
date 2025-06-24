const supabase = require('../config/supabase');
const UserModel = require('./userModel');

class StationMemberModel {
  /**
   * Adiciona um membro à station
   * @param {string} stationId - ID da station
   * @param {string} email - Email do usuário
   * @param {string} role - Role do membro
   * @returns {Object} Membro adicionado
   */
  static async addMember(stationId, email, role = 'member') {
    // Primeiro, verifica se o usuário existe
    const user = await UserModel.findByEmail(email);
    if (!user) {
      throw new Error('Usuário não encontrado com este email');
    }

    // Verifica se já é membro
    const existingMember = await this.findMember(stationId, user.id);
    if (existingMember) {
      throw new Error('Usuário já é membro desta station');
    }

    const { data, error } = await supabase
      .from('station_members')
      .insert([{
        station_id: stationId,
        user_id: user.id,
        role,
        joined_at: new Date().toISOString()
      }])
      .select(`
        *,
        users:user_id(id, email, full_name)
      `)
      .single();

    if (error) {
      throw error;
    }

    return {
      ...data,
      user: data.users,
      users: undefined
    };
  }

  /**
   * Lista todos os membros de uma station
   * @param {string} stationId - ID da station
   * @returns {Array} Lista de membros
   */
  static async getMembers(stationId) {
    const { data, error } = await supabase
      .from('station_members')
      .select(`
        *,
        users:user_id(id, email, full_name, avatar_url)
      `)
      .eq('station_id', stationId)
      .order('joined_at', { ascending: true });

    if (error) {
      throw error;
    }

    return data.map(member => ({
      ...member,
      user: member.users,
      users: undefined
    }));
  }

  /**
   * Busca um membro específico
   * @param {string} stationId - ID da station
   * @param {string} userId - ID do usuário
   * @returns {Object|null} Membro encontrado ou null
   */
  static async findMember(stationId, userId) {
    const { data, error } = await supabase
      .from('station_members')
      .select(`
        *,
        users:user_id(id, email, full_name, avatar_url)
      `)
      .eq('station_id', stationId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (data) {
      return {
        ...data,
        user: data.users,
        users: undefined
      };
    }

    return null;
  }

  /**
   * Atualiza o role de um membro
   * @param {string} stationId - ID da station
   * @param {string} userId - ID do usuário
   * @param {string} newRole - Novo role
   * @returns {Object} Membro atualizado
   */
  static async updateMemberRole(stationId, userId, newRole) {
    const { data, error } = await supabase
      .from('station_members')
      .update({ role: newRole })
      .eq('station_id', stationId)
      .eq('user_id', userId)
      .select(`
        *,
        users:user_id(id, email, full_name, avatar_url)
      `)
      .single();

    if (error) {
      throw error;
    }

    return {
      ...data,
      user: data.users,
      users: undefined
    };
  }

  /**
   * Remove um membro da station
   * @param {string} stationId - ID da station
   * @param {string} userId - ID do usuário
   * @returns {boolean} True se removido com sucesso
   */
  static async removeMember(stationId, userId) {
    const { error } = await supabase
      .from('station_members')
      .delete()
      .eq('station_id', stationId)
      .eq('user_id', userId);

    if (error) {
      throw error;
    }

    return true;
  }

  /**
   * Conta quantos membros uma station tem
   * @param {string} stationId - ID da station
   * @returns {number} Número de membros
   */
  static async countMembers(stationId) {
    const { count, error } = await supabase
      .from('station_members')
      .select('*', { count: 'exact', head: true })
      .eq('station_id', stationId);

    if (error) {
      throw error;
    }

    return count || 0;
  }
}

module.exports = StationMemberModel;