const supabase = require('../config/supabase');

class TaskModel {
  /**
   * Cria uma nova task
   * @param {Object} taskData - Dados da task
   * @returns {Object} Task criada
   */
  static async create(taskData) {
    const { title, description, list_id, priority = 'medium', due_date, created_by } = taskData;

    // Pega a próxima posição disponível na lista
    const nextPosition = await this.getNextPosition(list_id);

    const { data, error } = await supabase
      .from('tasks')
      .insert([{
        title,
        description,
        list_id,
        priority,
        due_date,
        created_by,
        position: nextPosition,
        status: 'todo', // Status padrão
        created_at: new Date().toISOString()
      }])
      .select(`
        *,
        users:created_by(id, full_name, email),
        assigned_user:assigned_to(id, full_name, email, avatar_url),
        lists(id, name, board_id)
      `)
      .single();

    if (error) {
      throw error;
    }

    return {
      ...data,
      created_by_user: data.users,
      list: data.lists,
      users: undefined,
      lists: undefined
    };
  }

  /**
   * Lista todas as tasks de um board com filtros opcionais
   * @param {string} boardId - ID do board
   * @param {Object} filters - Filtros opcionais
   * @returns {Array} Lista de tasks
   */
  static async findByBoard(boardId, filters = {}) {
    let query = supabase
      .from('tasks')
      .select(`
        *,
        users:created_by(id, full_name, email),
        assigned_user:assigned_to(id, full_name, email, avatar_url),
        lists!inner(id, name, board_id)
      `)
      .eq('lists.board_id', boardId);

    // Aplicar filtros
    if (filters.assigned_to) {
      query = query.eq('assigned_to', filters.assigned_to);
    }

    if (filters.priority) {
      query = query.eq('priority', filters.priority);
    }

    if (filters.status) {
      query = query.eq('status', filters.status);
    }

    if (filters.search) {
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
    }

    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;

    if (error) {
      throw error;
    }

    return data.map(task => ({
      ...task,
      created_by_user: task.users,
      list: task.lists,
      users: undefined,
      lists: undefined
    }));
  }

  /**
   * Busca task por ID com detalhes completos
   * @param {string} taskId - ID da task
   * @returns {Object|null} Task encontrada ou null
   */
  static async findById(taskId) {
    const { data, error } = await supabase
      .from('tasks')
      .select(`
        *,
        users:created_by(id, full_name, email),
        assigned_user:assigned_to(id, full_name, email, avatar_url),
        lists(
          id, name, board_id,
          boards(id, name, station_id)
        ),
        task_comments(
          id, content, created_at, updated_at,
          users:user_id(id, full_name, email, avatar_url)
        )
      `)
      .eq('id', taskId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (data) {
      return {
        ...data,
        created_by_user: data.users,
        list: data.lists,
        board: data.lists?.boards,
        comments: data.task_comments.map(comment => ({
          ...comment,
          user: comment.users,
          users: undefined
        })).sort((a, b) => new Date(a.created_at) - new Date(b.created_at)),
        users: undefined,
        lists: undefined,
        task_comments: undefined
      };
    }

    return null;
  }

  /**
   * Atualiza uma task
   * @param {string} taskId - ID da task
   * @param {Object} updateData - Dados para atualizar
   * @returns {Object} Task atualizada
   */
  static async update(taskId, updateData) {
    const { data, error } = await supabase
      .from('tasks')
      .update({
        ...updateData,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select(`
        *,
        users:created_by(id, full_name, email),
        assigned_user:assigned_to(id, full_name, email, avatar_url),
        lists(id, name, board_id)
      `)
      .single();

    if (error) {
      throw error;
    }

    return {
      ...data,
      created_by_user: data.users,
      list: data.lists,
      users: undefined,
      lists: undefined
    };
  }

  /**
   * Atribui uma task para um usuário
   * @param {string} taskId - ID da task
   * @param {string|null} userId - ID do usuário (null para desatribuir)
   * @returns {Object} Task atualizada
   */
  static async assign(taskId, userId) {
    return await this.update(taskId, { assigned_to: userId });
  }

  /**
   * Move uma task para outra lista
   * @param {string} taskId - ID da task
   * @param {string} newListId - ID da nova lista
   * @param {number} newPosition - Nova posição (opcional)
   * @returns {Object} Task movida
   */
  static async move(taskId, newListId, newPosition = null) {
    // Se não especificou posição, coloca no final da lista
    if (newPosition === null) {
      newPosition = await this.getNextPosition(newListId);
    }

    // Cara, aqui preciso ajustar as posições das outras tasks na lista de destino
    await supabase
      .from('tasks')
      .update({ position: supabase.rpc('increment_position') })
      .eq('list_id', newListId)
      .gte('position', newPosition);

    // Move a task
    const { data, error } = await supabase
      .from('tasks')
      .update({
        list_id: newListId,
        position: newPosition,
        updated_at: new Date().toISOString()
      })
      .eq('id', taskId)
      .select(`
        *,
        users:created_by(id, full_name, email),
        assigned_user:assigned_to(id, full_name, email, avatar_url),
        lists(id, name, board_id)
      `)
      .single();

    if (error) {
      throw error;
    }

    return {
      ...data,
      created_by_user: data.users,
      list: data.lists,
      users: undefined,
      lists: undefined
    };
  }

  /**
   * Apaga uma task
   * @param {string} taskId - ID da task
   * @returns {boolean} True se apagada com sucesso
   */
  static async delete(taskId) {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId);

    if (error) {
      throw error;
    }

    return true;
  }

  /**
   * Adiciona um comentário à task
   * @param {string} taskId - ID da task
   * @param {string} userId - ID do usuário
   * @param {string} content - Conteúdo do comentário
   * @returns {Object} Comentário criado
   */
  static async addComment(taskId, userId, content) {
    const { data, error } = await supabase
      .from('task_comments')
      .insert([{
        task_id: taskId,
        user_id: userId,
        content,
        created_at: new Date().toISOString()
      }])
      .select(`
        *,
        users:user_id(id, full_name, email, avatar_url)
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
   * Lista comentários de uma task
   * @param {string} taskId - ID da task
   * @returns {Array} Lista de comentários
   */
  static async getComments(taskId) {
    const { data, error } = await supabase
      .from('task_comments')
      .select(`
        *,
        users:user_id(id, full_name, email, avatar_url)
      `)
      .eq('task_id', taskId)
      .order('created_at', { ascending: true });

    if (error) {
      throw error;
    }

    return data.map(comment => ({
      ...comment,
      user: comment.users,
      users: undefined
    }));
  }

  /**
   * Atualiza um comentário
   * @param {string} commentId - ID do comentário
   * @param {string} content - Novo conteúdo
   * @returns {Object} Comentário atualizado
   */
  static async updateComment(commentId, content) {
    const { data, error } = await supabase
      .from('task_comments')
      .update({
        content,
        updated_at: new Date().toISOString()
      })
      .eq('id', commentId)
      .select(`
        *,
        users:user_id(id, full_name, email, avatar_url)
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
   * Apaga um comentário
   * @param {string} commentId - ID do comentário
   * @returns {boolean} True se apagado com sucesso
   */
  static async deleteComment(commentId) {
    const { error } = await supabase
      .from('task_comments')
      .delete()
      .eq('id', commentId);

    if (error) {
      throw error;
    }

    return true;
  }

  /**
   * Busca comentário por ID
   * @param {string} commentId - ID do comentário
   * @returns {Object|null} Comentário encontrado ou null
   */
  static async findCommentById(commentId) {
    const { data, error } = await supabase
      .from('task_comments')
      .select(`
        *,
        users:user_id(id, full_name, email),
        tasks(id, title, list_id, lists(board_id, boards(station_id)))
      `)
      .eq('id', commentId)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    if (data) {
      return {
        ...data,
        user: data.users,
        task: data.tasks,
        users: undefined,
        tasks: undefined
      };
    }

    return null;
  }

  /**
   * Pega a próxima posição disponível para uma task na lista
   * @param {string} listId - ID da lista
   * @returns {number} Próxima posição
   */
  static async getNextPosition(listId) {
    const { data, error } = await supabase
      .from('tasks')
      .select('position')
      .eq('list_id', listId)
      .order('position', { ascending: false })
      .limit(1);

    if (error) {
      throw error;
    }

    return data.length > 0 ? data[0].position + 1 : 0;
  }
}

module.exports = TaskModel;