const { z } = require('zod');

// Schema para criar station
const createStationSchema = z.object({
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
      .nullable()
  })
});

// Schema para editar station
const updateStationSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID da station deve ser um UUID válido')
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
      .nullable()
  })
});

// Schema para buscar station por ID
const getStationSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID da station deve ser um UUID válido')
  })
});

// Schema para completar station
const completeStationSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID da station deve ser um UUID válido')
  })
});

module.exports = {
  createStationSchema,
  updateStationSchema,
  getStationSchema,
  completeStationSchema
};