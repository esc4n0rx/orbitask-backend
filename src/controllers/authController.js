const UserModel = require('../models/userModel');
const { generateToken } = require('../utils/jwt');

class AuthController {
  /**
   * Registra um novo usuário
   * POST /api/auth/register
   */
  static async register(req, res, next) {
    try {
      const { email, password, full_name } = req.body;

      // Verifica se o usuário já existe
      const existingUser = await UserModel.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          error: 'Usuário já existe',
          message: 'Este email já está cadastrado no sistema'
        });
      }

      // Cria o novo usuário
      const newUser = await UserModel.create({ email, password, full_name });

      // Gera token JWT para o usuário
      const token = generateToken({
        id: newUser.id,
        email: newUser.email
      });

      res.status(201).json({
        message: 'Usuário criado com sucesso!',
        user: newUser,
        token
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Autentica um usuário existente
   * POST /api/auth/login
   */
  static async login(req, res, next) {
    try {
      const { email, password } = req.body;

      // Busca o usuário pelo email
      const user = await UserModel.findByEmail(email);
      if (!user) {
        return res.status(401).json({
          error: 'Credenciais inválidas',
          message: 'Email ou senha incorretos'
        });
      }

      // Verifica se a senha está correta
      const isPasswordValid = await UserModel.comparePassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          error: 'Credenciais inválidas',
          message: 'Email ou senha incorretos'
        });
      }

      // Gera token JWT
      const token = generateToken({
        id: user.id,
        email: user.email
      });

      // Remove a senha da resposta
      const { password: _, ...userWithoutPassword } = user;

      res.status(200).json({
        message: 'Login realizado com sucesso!',
        user: userWithoutPassword,
        token
      });

    } catch (error) {
      next(error);
    }
  }

  /**
   * Retorna informações do usuário autenticado
   * GET /api/auth/me
   */
  static async me(req, res, next) {
    try {
      // req.user vem do authMiddleware
      const user = await UserModel.findById(req.user.id);
      
      if (!user) {
        return res.status(404).json({
          error: 'Usuário não encontrado',
          message: 'Token válido mas usuário não existe mais'
        });
      }

      res.status(200).json({
        user
      });

    } catch (error) {
      next(error);
    }
  }
}

module.exports = AuthController;
