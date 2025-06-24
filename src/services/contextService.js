const StationModel = require('../models/stationModel');
const BoardModel = require('../models/boardModel');
const TaskModel = require('../models/taskModel');
const StationMemberModel = require('../models/stationMemberModel');

class ContextService {
  /**
   * Coleta contexto completo de uma station para a IA
   * @param {string} stationId - ID da station
   * @param {string} userId - ID do usuário fazendo a pergunta
   * @returns {Object} Contexto estruturado da station
   */
  static async getStationContext(stationId, userId) {
    try {
      // Dados básicos da station
      const station = await StationModel.findById(stationId);
      if (!station) {
        throw new Error('Station não encontrada');
      }

      // Membros da station
      const members = await StationMemberModel.getMembers(stationId);

      // Boards da station
      const boards = await BoardModel.findByStation(stationId);

      // Coleta tasks de todos os boards
      const allTasks = [];
      for (const board of boards) {
        const tasks = await TaskModel.findByBoard(board.id);
        allTasks.push(...tasks);
      }

      // Métricas calculadas
      const metrics = this.calculateStationMetrics(allTasks, members);

      return {
        station: {
          id: station.id,
          name: station.name,
          description: station.description,
          created_at: station.created_at,
          member_count: members.length
        },
        members: members.map(member => ({
          id: member.user.id,
          name: member.user.full_name,
          email: member.user.email,
          role: member.role,
          joined_at: member.joined_at
        })),
        boards: boards.map(board => ({
          id: board.id,
          name: board.name,
          description: board.description,
          created_at: board.created_at,
          lists_count: board.lists?.length || 0
        })),
        tasks: allTasks.map(task => ({
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          assigned_to: task.assigned_user?.full_name || 'Não atribuída',
          created_by: task.created_by_user?.full_name || 'Desconhecido',
          created_at: task.created_at,
          due_date: task.due_date,
          list_name: task.list?.name || 'Lista desconhecida'
        })),
        metrics,
        context_generated_at: new Date().toISOString(),
        requesting_user_id: userId
      };

    } catch (error) {
      throw new Error(`Erro ao coletar contexto: ${error.message}`);
    }
  }

  /**
   * Coleta contexto específico de um board
   * @param {string} boardId - ID do board
   * @param {string} userId - ID do usuário
   * @returns {Object} Contexto do board
   */
  static async getBoardContext(boardId, userId) {
    try {
      const board = await BoardModel.findById(boardId);
      if (!board) {
        throw new Error('Board não encontrado');
      }

      const tasks = await TaskModel.findByBoard(boardId);
      const metrics = this.calculateBoardMetrics(tasks);

      return {
        board: {
          id: board.id,
          name: board.name,
          description: board.description,
          station_name: board.station?.name,
          created_at: board.created_at
        },
        lists: board.lists?.map(list => ({
          id: list.id,
          name: list.name,
          tasks_count: list.tasks?.length || 0
        })) || [],
        tasks: tasks.map(task => ({
          id: task.id,
          title: task.title,
          status: task.status,
          priority: task.priority,
          assigned_to: task.assigned_user?.full_name || 'Não atribuída',
          created_at: task.created_at,
          due_date: task.due_date
        })),
        metrics,
        context_generated_at: new Date().toISOString(),
        requesting_user_id: userId
      };

    } catch (error) {
      throw new Error(`Erro ao coletar contexto do board: ${error.message}`);
    }
  }

  /**
   * Coleta contexto específico de uma task
   * @param {string} taskId - ID da task
   * @param {string} userId - ID do usuário
   * @returns {Object} Contexto da task
   */
  static async getTaskContext(taskId, userId) {
    try {
      const task = await TaskModel.findById(taskId);
      if (!task) {
        throw new Error('Task não encontrada');
      }

      return {
        task: {
          id: task.id,
          title: task.title,
          description: task.description,
          status: task.status,
          priority: task.priority,
          assigned_to: task.assigned_user?.full_name || 'Não atribuída',
          created_by: task.created_by_user?.full_name || 'Desconhecido',
          created_at: task.created_at,
          updated_at: task.updated_at,
          due_date: task.due_date,
          list_name: task.list?.name,
          board_name: task.board?.name,
          station_name: task.board?.station?.name
        },
        comments: task.comments?.map(comment => ({
          id: comment.id,
          content: comment.content,
          author: comment.user?.full_name,
          created_at: comment.created_at
        })) || [],
        context_generated_at: new Date().toISOString(),
        requesting_user_id: userId
      };

    } catch (error) {
      throw new Error(`Erro ao coletar contexto da task: ${error.message}`);
    }
  }

  /**
   * Calcula métricas da station
   * @param {Array} tasks - Lista de tasks
   * @param {Array} members - Lista de membros
   * @returns {Object} Métricas calculadas
   */
  static calculateStationMetrics(tasks, members) {
    const totalTasks = tasks.length;
    const tasksByStatus = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});

    const tasksByPriority = tasks.reduce((acc, task) => {
      acc[task.priority] = (acc[task.priority] || 0) + 1;
      return acc;
    }, {});

    const overdueTasks = tasks.filter(task => 
      task.due_date && new Date(task.due_date) < new Date() && task.status !== 'done'
    ).length;

    const unassignedTasks = tasks.filter(task => !task.assigned_to).length;

    const completionRate = totalTasks > 0 ? 
      Math.round((tasksByStatus.done || 0) / totalTasks * 100) : 0;

    return {
      total_tasks: totalTasks,
      tasks_by_status: tasksByStatus,
      tasks_by_priority: tasksByPriority,
      overdue_tasks: overdueTasks,
      unassigned_tasks: unassignedTasks,
      completion_rate: completionRate,
      active_members: members.length,
      avg_tasks_per_member: members.length > 0 ? Math.round(totalTasks / members.length) : 0
    };
  }

  /**
   * Calcula métricas específicas do board
   * @param {Array} tasks - Lista de tasks do board
   * @returns {Object} Métricas do board
   */
  static calculateBoardMetrics(tasks) {
    const totalTasks = tasks.length;
    const tasksByStatus = tasks.reduce((acc, task) => {
      acc[task.status] = (acc[task.status] || 0) + 1;
      return acc;
    }, {});

    const completionRate = totalTasks > 0 ? 
      Math.round((tasksByStatus.done || 0) / totalTasks * 100) : 0;

    return {
      total_tasks: totalTasks,
      tasks_by_status: tasksByStatus,
      completion_rate: completionRate
    };
  }
}

module.exports = ContextService;