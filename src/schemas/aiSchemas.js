const { z } = require('zod');

// Schema para perguntas gerais à IA
const askAiSchema = z.object({
  body: z.object({
    query: z
      .string()
      .min(1, 'Pergunta não pode estar vazia')
      .max(1000, 'Pergunta muito longa (máximo 1000 caracteres)')
      .trim(),
    context_type: z
      .enum(['station', 'board', 'task'], {
        errorMap: () => ({ message: 'Tipo de contexto deve ser: station, board ou task' })
      })
      .default('station'),
    context_id: z
      .string()
      .uuid('ID do contexto deve ser um UUID válido')
      .optional()
  })
});

// Schema para perguntas sobre station específica
const askStationAiSchema = z.object({
  params: z.object({
    stationId: z.string().uuid('ID da station deve ser um UUID válido')
  }),
  body: z.object({
    query: z
      .string()
      .min(1, 'Pergunta não pode estar vazia')
      .max(1000, 'Pergunta muito longa (máximo 1000 caracteres)')
      .trim()
  })
});

// Schema para perguntas sobre board específico
const askBoardAiSchema = z.object({
  params: z.object({
    boardId: z.string().uuid('ID do board deve ser um UUID válido')
  }),
  body: z.object({
    query: z
      .string()
      .min(1, 'Pergunta não pode estar vazia')
      .max(1000, 'Pergunta muito longa (máximo 1000 caracteres)')
      .trim()
  })
});

// Schema para perguntas sobre task específica
const askTaskAiSchema = z.object({
  params: z.object({
    taskId: z.string().uuid('ID da task deve ser um UUID válido')
  }),
  body: z.object({
    query: z
      .string()
      .min(1, 'Pergunta não pode estar vazia')
      .max(1000, 'Pergunta muito longa (máximo 1000 caracteres)')
      .trim()
  })
});

module.exports = {
  askAiSchema,
  askStationAiSchema,
  askBoardAiSchema,
  askTaskAiSchema
};