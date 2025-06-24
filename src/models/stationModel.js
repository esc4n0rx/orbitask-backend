const supabase = require('../config/supabase');

class StationModel {
  /**
   * Cria uma nova station
   * @param {Object} stationData - Dados da station (name, description, owner_id)
   * @returns {Object} Station criada
   */
  static async create(stationData) {
    const { name, description, owner_id } = stationData;
    
    const { data, error } = await supabase
      .from('stations')
      .insert([{
        name,
        description,
        owner_id,
        created_at: new Date().toISOString()
      }])
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Lista todas as stations do usuário (como membro ou owner)
   * @param {string} userId - ID do usuário
   * @returns {Array} Lista de stations
   */
  static async findByUserId(userId) {
    // Busca stations onde o usuário é owner OU é membro
    const { data, error } = await supabase
      .from('stations')
      .select(`
        *,
        station_members!inner(role, joined_at),
        users:owner_id(full_name, email)
      `)
      .or(`owner_id.eq.${userId},station_members.user_id.eq.${userId}`)
      .is('completed_at', null) // Só stations ativas
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    // Cara, aqui eu limpo os dados pra ficar mais organizadinho na resposta
    return data.map(station => ({
      ...station,
      owner: station.users,
      user_role: station.station_members[0]?.role || 'owner',
      users: undefined,
      station_members: undefined
    }));
  }

  /**
   * Busca station por ID
   * @param {string} stationId - ID da station
   * @returns {Object|null} Station encontrada ou null
   */
  static async findById(stationId) {
    const { data, error } = await supabase
      .from('stations')
      .select(`
        *,
        users:owner_id(id, full_name, email)
      `)
      .eq('id', stationId)
      .is('completed_at', null)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (data) {
      return {
        ...data,
        owner: data.users,
        users: undefined
      };
    }

    return null;
  }

  /**
   * Atualiza uma station
   * @param {string} stationId - ID da station
   * @param {Object} updateData - Dados para atualizar
   * @returns {Object} Station atualizada
   */
  static async update(stationId, updateData) {
    const { data, error } = await supabase
      .from('stations')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', stationId)
      .is('completed_at', null)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Marca uma station como completada (soft delete)
   * @param {string} stationId - ID da station
   * @returns {Object} Station completada
   */
  static async complete(stationId) {
    const { data, error } = await supabase
      .from('stations')
      .update({
        completed_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', stationId)
      .is('completed_at', null)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Verifica se usuário tem acesso à station
   * @param {string} stationId - ID da station
   * @param {string} userId - ID do usuário
   * @returns {Object|null} Dados do acesso ou null
   */
  static async checkUserAccess(stationId, userId) {
    // Verifica se é owner da station
    const stationData = await this.findById(stationId);
    if (!stationData) return null;

    if (stationData.owner_id === userId) {
      return {
        station: stationData,
        role: 'owner',
        hasAccess: true
      };
    }

    // Verifica se é membro da station
    const { data: memberData, error } = await supabase
      .from('station_members')
      .select('role, joined_at')
      .eq('station_id', stationId)
      .eq('user_id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (memberData) {
      return {
        station: stationData,
        role: memberData.role,
        hasAccess: true
      };
    }

    return {
      station: stationData,
      role: null,
      hasAccess: false
    };
  }
}

module.exports = StationModel;