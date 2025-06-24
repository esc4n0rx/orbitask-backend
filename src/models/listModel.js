const supabase = require('../config/supabase');

class ListModel {
  /**
   * Cria uma nova lista no board
   * @param {Object} listData - Dados da lista
   * @returns {Object} Lista criada
   */
  static async create(listData) {
    const { name, board_id } = listData;

    // Pega a próxima posição disponível
    const nextPosition = await this.getNextPosition(board_id);

    const { data, error } = await supabase
      .from('lists')
      .insert([{
        name,
        board_id,
        position: nextPosition,
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
   * Lista todas as listas de um board
   * @param {string} boardId - ID do board
   * @returns {Array} Lista de listas
   */
  static async findByBoard(boardId) {
    const { data, error } = await supabase
      .from('lists')
      .select(`
        *,
        tasks(
          id, title, assigned_to, priority, status, due_date, position,
          users:assigned_to(id, full_name, avatar_url)
        )
      `)
      .eq('board_id', boardId)
      .order('position', { ascending: true });

    if (error) {
      throw error;
    }

    return data.map(list => ({
      ...list,
      tasks: list.tasks
        .sort((a, b) => a.position - b.position)
        .map(task => ({
          ...task,
          assigned_user: task.users,
          users: undefined
        }))
    }));
  }

  /**
   * Busca lista por ID
   * @param {string} listId - ID da lista
   * @returns {Object|null} Lista encontrada ou null
   */
  static async findById(listId) {
    const { data, error } = await supabase
      .from('lists')
      .select(`
        *,
        boards(id, name, station_id)
      `)
      .eq('id', listId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (data) {
      return {
        ...data,
        board: data.boards,
        boards: undefined
      };
    }

    return null;
  }

  /**
   * Atualiza uma lista
   * @param {string} listId - ID da lista
   * @param {Object} updateData - Dados para atualizar
   * @returns {Object} Lista atualizada
   */
  static async update(listId, updateData) {
    const { data, error } = await supabase
      .from('lists')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', listId)
      .select('*')
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Reordena uma lista (atualiza posição)
   * @param {string} listId - ID da lista
   * @param {number} newPosition - Nova posição
   * @returns {Object} Lista reordenada
   */
  static async reorder(listId, newPosition) {
    // Busca dados atuais da lista
    const currentList = await this.findById(listId);
    if (!currentList) {
      throw new Error('Lista não encontrada');
    }

    const boardId = currentList.board.id;
    const oldPosition = currentList.position;

    // Se a posição não mudou, não faz nada
    if (oldPosition === newPosition) {
      return currentList;
    }

    // Cara, aqui preciso ajustar as posições das outras listas
    if (newPosition > oldPosition) {
      // Movendo para baixo: diminui posição das listas entre old e new
      await supabase
        .from('lists')
        .update({ position: supabase.rpc('decrement_position') })
        .eq('board_id', boardId)
        .gt('position', oldPosition)
        .lte('position', newPosition);
    } else {
      // Movendo para cima: aumenta posição das listas entre new e old
      await supabase
        .from('lists')
        .update({ position: supabase.rpc('increment_position') })
        .eq('board_id', boardId)
        .gte('position', newPosition)
        .lt('position', oldPosition);
    }

    // Atualiza a posição da lista atual
    return await this.update(listId, { position: newPosition });
  }

  /**
   * Apaga uma lista e todas suas tasks
   * @param {string} listId - ID da lista
   * @returns {boolean} True se apagada com sucesso
   */
  static async delete(listId) {
    const { error } = await supabase
      .from('lists')
      .delete()
      .eq('id', listId);

    if (error) {
      throw error;
    }

    return true;
  }

  /**
   * Pega a próxima posição disponível para uma lista no board
   * @param {string} boardId - ID do board
   * @returns {number} Próxima posição
   */
  static async getNextPosition(boardId) {
    const { data, error } = await supabase
      .from('lists')
      .select('position')
      .eq('board_id', boardId)
      .order('position', { ascending: false })
      .limit(1);

    if (error) {
      throw error;
    }

    return data.length > 0 ? data[0].position + 1 : 0;
  }
}

module.exports = ListModel;