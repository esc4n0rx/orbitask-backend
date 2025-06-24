 
const { z } = require('zod');

// Schema para registro de usuário
const registerSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email('Email deve ter um formato válido')
      .min(1, 'Email é obrigatório'),
    password: z
      .string()
      .min(6, 'Senha deve ter pelo menos 6 caracteres')
      .max(100, 'Senha muito longa'),
    full_name: z
      .string()
      .min(2, 'Nome deve ter pelo menos 2 caracteres')
      .max(100, 'Nome muito longo')
      .trim()
  })
});

// Schema para login
const loginSchema = z.object({
  body: z.object({
    email: z
      .string()
      .email('Email deve ter um formato válido')
      .min(1, 'Email é obrigatório'),
    password: z
      .string()
      .min(1, 'Senha é obrigatória')
  })
});

module.exports = {
  registerSchema,
  loginSchema
};