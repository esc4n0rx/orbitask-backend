const supabase = require('../config/supabase');
const { getTemplateData } = require('../utils/boardTemplates');

class BoardModel {
  /**
   * Cria um novo board com listas baseadas no template
   * @param {Object} boardData - Dados do board
   * @returns {Object} Board criado com listas
   */
  static async create(boardData) {
    const { name, description, station_id, created_by, template = 'kanban', color } = boardData;

    // Verifica limite de boards por station
    const boardCount = await this.countByStation(station_id);
    if (boardCount >= 10) {
      throw new Error('Limite de 10 boards por station atingido');
    }

    // Inicia transação para criar board + listas
    const { data: newBoard, error: boardError } = await supabase
      .from('boards')
      .insert([{
        name,
        description,
        station_id,
        created_by,
        template_type: template,
        color,
        created_at: new Date().toISOString()
      }])
      .select('*')
      .single();

    if (boardError) {
      throw boardError;
    }

    // Cara, agora crio as listas padrão baseadas no template escolhido
    const templateData = getTemplateData(template);
    if (templateData && templateData.lists) {
      const listsToCreate = templateData.lists.map(list => ({
        name: list.name,
        board_id: newBoard.id,
        position: list.position,
        created_at: new Date().toISOString()
      }));

      const { data: createdLists, error: listsError } = await supabase
        .from('lists')
        .insert(listsToCreate)
        .select('*');

      if (listsError) {
        // Se deu erro nas listas, remove o board criado
        await supabase.from('boards').delete().eq('id', newBoard.id);
        throw listsError;
      }

      return {
        ...newBoard,
        lists: createdLists
      };
    }

    return newBoard;
  }

  /**
   * Lista todos os boards de uma station
   * @param {string} stationId - ID da station
   * @returns {Array} Lista de boards
   */
  static async findByStation(stationId) {
    const { data, error } = await supabase
      .from('boards')
      .select(`
        *,
        users:created_by(id, full_name, email),
        lists(id, name, position)
      `)
      .eq('station_id', stationId)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data.map(board => ({
      ...board,
      created_by_user: board.users,
      users: undefined,
      lists: board.lists.sort((a, b) => a.position - b.position)
    }));
  }

  /**
   * Busca board por ID com todas as informações
   * @param {string} boardId - ID do board
   * @returns {Object|null} Board encontrado ou null
   */
  static async findById(boardId) {
    const { data, error } = await supabase
      .from('boards')
      .select(`
        *,
        users:created_by(id, full_name, email),
        stations(id, name, owner_id),
        lists(
          id, name, position,
          tasks(
            id, title, description, assigned_to, priority, status, due_date, position, created_by,
            users:assigned_to(id, full_name, email, avatar_url)
          )
        )
      `)
      .eq('id', boardId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (data) {
      return {
        ...data,
        created_by_user: data.users,
        station: data.stations,
        users: undefined,
        stations: undefined,
        lists: data.lists
          .sort((a, b) => a.position - b.position)
          .map(list => ({
            ...list,
            tasks: list.tasks
              .sort((a, b) => a.position - b.position)
              .map(task => ({
                ...task,
                assigned_user: task.users,
                users: undefined
              }))
          }))
      };
    }

    return null;
  }

  /**
   * Atualiza um board
   * @param {string} boardId - ID do board
   * @param {Object} updateData - Dados para atualizar
   * @returns {Object} Board atualizado
   */
  static async update(boardId, updateData) {
    const { data, error } = await supabase
      .from('boards')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', boardId)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Apaga um board e todas suas listas/tasks
   * @param {string} boardId - ID do board
   * @returns {boolean} True se apagado com sucesso
   */
  static async delete(boardId) {
    // O CASCADE no banco já vai apagar listas e tasks automaticamente
    const { error } = await supabase
      .from('boards')
      .delete()
      .eq('id', boardId);

    if (error) {
      throw error;
    }

    return true;
  }

  /**
   * Conta quantos boards uma station tem
   * @param {string} stationId - ID da station
   * @returns {number} Número de boards
   */
  static async countByStation(stationId) {
    const { count, error } = await supabase
      .from('boards')
      .select('*', { count: 'exact', head: true })
      .eq('station_id', stationId);

    if (error) {
      throw error;
    }

    return count || 0;
  }
}

module.exports = BoardModel;