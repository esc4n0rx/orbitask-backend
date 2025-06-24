const { z } = require('zod');

// Schema para criar task
const createTaskSchema = z.object({
  params: z.object({
    listId: z.string().uuid('ID da lista deve ser um UUID válido')
  }),
  body: z.object({
    title: z
      .string()
      .min(1, 'Título é obrigatório')
      .max(200, 'Título muito longo')
      .trim(),
    description: z
      .string()
      .max(2000, 'Descrição muito longa')
      .optional()
      .nullable(),
    priority: z
      .enum(['low', 'medium', 'high', 'urgent'], {
        errorMap: () => ({ message: 'Prioridade deve ser: low, medium, high ou urgent' })
      })
      .default('medium'),
    due_date: z
      .string()
      .datetime('Data deve estar no formato ISO 8601')
      .optional()
      .nullable()
  })
});

// Schema para editar task
const updateTaskSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID da task deve ser um UUID válido')
  }),
  body: z.object({
    title: z
      .string()
      .min(1, 'Título é obrigatório')
      .max(200, 'Título muito longo')
      .trim()
      .optional(),
    description: z
      .string()
      .max(2000, 'Descrição muito longa')
      .optional()
      .nullable(),
    priority: z
      .enum(['low', 'medium', 'high', 'urgent'], {
        errorMap: () => ({ message: 'Prioridade deve ser: low, medium, high ou urgent' })
      })
      .optional(),
    status: z
      .enum(['todo', 'in_progress', 'review', 'done'], {
        errorMap: () => ({ message: 'Status deve ser: todo, in_progress, review ou done' })
      })
      .optional(),
    due_date: z
      .string()
      .datetime('Data deve estar no formato ISO 8601')
      .optional()
      .nullable()
  })
});

// Schema para atribuir task
const assignTaskSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID da task deve ser um UUID válido')
  }),
  body: z.object({
    assigned_to: z
      .string()
      .uuid('ID do usuário deve ser um UUID válido')
      .optional()
      .nullable()
  })
});

// Schema para mover task entre listas
const moveTaskSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID da task deve ser um UUID válido')
  }),
  body: z.object({
    list_id: z
      .string()
      .uuid('ID da lista deve ser um UUID válido'),
    position: z
      .number()
      .int('Posição deve ser um número inteiro')
      .min(0, 'Posição deve ser maior ou igual a 0')
      .optional()
  })
});

// Schema para buscar tasks do board
const getBoardTasksSchema = z.object({
  params: z.object({
    boardId: z.string().uuid('ID do board deve ser um UUID válido')
  }),
  query: z.object({
    assigned_to: z.string().uuid().optional(),
    priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
    status: z.enum(['todo', 'in_progress', 'review', 'done']).optional(),
    search: z.string().optional()
  }).optional()
});

// Schema para buscar task por ID
const getTaskSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID da task deve ser um UUID válido')
  })
});

// Schema para apagar task
const deleteTaskSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID da task deve ser um UUID válido')
  })
});

// Schema para adicionar comentário
const addCommentSchema = z.object({
  params: z.object({
    taskId: z.string().uuid('ID da task deve ser um UUID válido')
  }),
  body: z.object({
    content: z
      .string()
      .min(1, 'Comentário não pode estar vazio')
      .max(1000, 'Comentário muito longo')
      .trim()
  })
});

// Schema para editar comentário
const updateCommentSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID do comentário deve ser um UUID válido')
  }),
  body: z.object({
    content: z
      .string()
      .min(1, 'Comentário não pode estar vazio')
      .max(1000, 'Comentário muito longo')
      .trim()
  })
});

// Schema para buscar comentários da task
const getCommentsSchema = z.object({
  params: z.object({
    taskId: z.string().uuid('ID da task deve ser um UUID válido')
  })
});

// Schema para apagar comentário
const deleteCommentSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID do comentário deve ser um UUID válido')
  })
});

module.exports = {
  createTaskSchema,
  updateTaskSchema,
  assignTaskSchema,
  moveTaskSchema,
  getBoardTasksSchema,
  getTaskSchema,
  deleteTaskSchema,
  addCommentSchema,
  updateCommentSchema,
  getCommentsSchema,
  deleteCommentSchema
};