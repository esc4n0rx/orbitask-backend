const { z } = require('zod');

// Schema para adicionar membro
const addMemberSchema = z.object({
  params: z.object({
    stationId: z.string().uuid('ID da station deve ser um UUID válido')
  }),
  body: z.object({
    email: z
      .string()
      .email('Email deve ter um formato válido')
      .min(1, 'Email é obrigatório'),
    role: z
      .enum(['admin', 'leader', 'member'], {
        errorMap: () => ({ message: 'Role deve ser: admin, leader ou member' })
      })
      .default('member')
  })
});

// Schema para atualizar role do membro
const updateMemberRoleSchema = z.object({
  params: z.object({
    stationId: z.string().uuid('ID da station deve ser um UUID válido'),
    userId: z.string().uuid('ID do usuário deve ser um UUID válido')
  }),
  body: z.object({
    role: z.enum(['admin', 'leader', 'member'], {
      errorMap: () => ({ message: 'Role deve ser: admin, leader ou member' })
    })
  })
});

// Schema para remover membro
const removeMemberSchema = z.object({
  params: z.object({
    stationId: z.string().uuid('ID da station deve ser um UUID válido'),
    userId: z.string().uuid('ID do usuário deve ser um UUID válido')
  })
});

// Schema para listar membros
const getMembersSchema = z.object({
  params: z.object({
    stationId: z.string().uuid('ID da station deve ser um UUID válido')
  })
});

module.exports = {
  addMemberSchema,
  updateMemberRoleSchema,
  removeMemberSchema,
  getMembersSchema
};