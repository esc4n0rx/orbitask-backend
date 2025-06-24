/**
 * Templates pré-definidos para boards
 * Cada template define as listas padrão que serão criadas automaticamente
 */

const BOARD_TEMPLATES = {
    kanban: {
      name: 'Kanban Básico',
      description: 'Template padrão com fluxo básico de trabalho',
      lists: [
        { name: 'A Fazer', position: 0 },
        { name: 'Em Progresso', position: 1 },
        { name: 'Revisão', position: 2 },
        { name: 'Concluído', position: 3 }
      ]
    },
    
    sprint: {
      name: 'Sprint Agile',
      description: 'Template para metodologia ágil com sprint planning',
      lists: [
        { name: 'Backlog', position: 0 },
        { name: 'Sprint Planning', position: 1 },
        { name: 'Em Desenvolvimento', position: 2 },
        { name: 'Em Teste', position: 3 },
        { name: 'Deploy', position: 4 },
        { name: 'Finalizado', position: 5 }
      ]
    },
  
    personal: {
      name: 'Pessoal',
      description: 'Template para gerenciamento de tarefas pessoais',
      lists: [
        { name: 'Ideias', position: 0 },
        { name: 'Para Hoje', position: 1 },
        { name: 'Esta Semana', position: 2 },
        { name: 'Feito', position: 3 }
      ]
    },
  
    bugs: {
      name: 'Controle de Bugs',
      description: 'Template para rastreamento e correção de bugs',
      lists: [
        { name: 'Reportados', position: 0 },
        { name: 'Em Análise', position: 1 },
        { name: 'Em Correção', position: 2 },
        { name: 'Em Teste', position: 3 },
        { name: 'Corrigidos', position: 4 }
      ]
    }
  };
  
  /**
   * Retorna todos os templates disponíveis
   * @returns {Object} Templates disponíveis
   */
  const getAvailableTemplates = () => {
    return Object.keys(BOARD_TEMPLATES).map(key => ({
      id: key,
      name: BOARD_TEMPLATES[key].name,
      description: BOARD_TEMPLATES[key].description
    }));
  };
  
  /**
   * Retorna as listas de um template específico
   * @param {string} templateId - ID do template
   * @returns {Array|null} Listas do template ou null se não encontrado
   */
  const getTemplateData = (templateId) => {
    return BOARD_TEMPLATES[templateId] || null;
  };
  
  module.exports = {
    BOARD_TEMPLATES,
    getAvailableTemplates,
    getTemplateData
  };