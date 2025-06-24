const { z } = require('zod');

// Schema para criar lista
const createListSchema = z.object({
  params: z.object({
    boardId: z.string().uuid('ID do board deve ser um UUID válido')
  }),
  body: z.object({
    name: z
      .string()
      .min(1, 'Nome é obrigatório')
      .max(100, 'Nome muito longo')
      .trim()
  })
});

// Schema para editar lista
const updateListSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID da lista deve ser um UUID válido')
  }),
  body: z.object({
    name: z
      .string()
      .min(1, 'Nome é obrigatório')
      .max(100, 'Nome muito longo')
      .trim()
  })
});

// Schema para reordenar listas
const reorderListSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID da lista deve ser um UUID válido')
  }),
  body: z.object({
    position: z
      .number()
      .int('Posição deve ser um número inteiro')
      .min(0, 'Posição deve ser maior ou igual a 0')
  })
});

// Schema para buscar listas do board
const getListsSchema = z.object({
  params: z.object({
    boardId: z.string().uuid('ID do board deve ser um UUID válido')
  })
});

// Schema para apagar lista
const deleteListSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID da lista deve ser um UUID válido')
  })
});

module.exports = {
  createListSchema,
  updateListSchema,
  reorderListSchema,
  getListsSchema,
  deleteListSchema
};