const { z } = require('zod');

// Schema para criar board
const createBoardSchema = z.object({
  params: z.object({
    stationId: z.string().uuid('ID da station deve ser um UUID válido')
  }),
  body: z.object({
    name: z
      .string()
      .min(2, 'Nome deve ter pelo menos 2 caracteres')
      .max(100, 'Nome muito longo')
      .trim(),
    description: z
      .string()
      .max(500, 'Descrição muito longa')
      .optional()
      .nullable(),
    template: z
      .enum(['kanban', 'sprint', 'personal', 'bugs'], {
        errorMap: () => ({ message: 'Template deve ser: kanban, sprint, personal ou bugs' })
      })
      .default('kanban'),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve estar no formato hexadecimal (#000000)')
      .optional()
      .nullable()
  })
});

// Schema para editar board
const updateBoardSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID do board deve ser um UUID válido')
  }),
  body: z.object({
    name: z
      .string()
      .min(2, 'Nome deve ter pelo menos 2 caracteres')
      .max(100, 'Nome muito longo')
      .trim()
      .optional(),
    description: z
      .string()
      .max(500, 'Descrição muito longa')
      .optional()
      .nullable(),
    color: z
      .string()
      .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve estar no formato hexadecimal (#000000)')
      .optional()
      .nullable()
  })
});

// Schema para buscar boards da station
const getBoardsSchema = z.object({
  params: z.object({
    stationId: z.string().uuid('ID da station deve ser um UUID válido')
  })
});

// Schema para buscar board por ID
const getBoardSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID do board deve ser um UUID válido')
  })
});

// Schema para apagar board
const deleteBoardSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID do board deve ser um UUID válido')
  })
});

module.exports = {
  createBoardSchema,
  updateBoardSchema,
  getBoardsSchema,
  getBoardSchema,
  deleteBoardSchema
};