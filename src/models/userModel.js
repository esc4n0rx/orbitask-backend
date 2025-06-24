const supabase = require('../config/supabase');
const bcrypt = require('bcryptjs');

class UserModel {
  /**
   * Cria um novo usuário no banco
   * @param {Object} userData - Dados do usuário (email, password, full_name)
   * @returns {Object} Usuário criado (sem a senha)
   */
  static async create(userData) {
    const { email, password, full_name } = userData;
    
    // Hash da senha antes de salvar
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);
    
    const { data, error } = await supabase
      .from('users')
      .insert([{
        email,
        password: hashedPassword,
        full_name,
        created_at: new Date().toISOString()
      }])
      .select('id, email, full_name, created_at')
      .single();

    if (error) {
      throw error;
    }

    return data;
  }

  /**
   * Busca usuário por email
   * @param {string} email - Email do usuário
   * @returns {Object|null} Usuário encontrado ou null
   */
  static async findByEmail(email) {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      throw error;
    }

    return data;
  }

  /**
   * Busca usuário por ID
   * @param {string} id - ID do usuário
   * @returns {Object|null} Usuário encontrado ou null (sem senha)
   */
  static async findById(id) {
    const { data, error } = await supabase
      .from('users')
      .select('id, email, full_name, created_at, updated_at')
      .eq('id', id)
      .single();

    if (error && error.code !== 'PGRST116') {
      throw error;
    }

    return data;
  }

  /**
   * Verifica se a senha fornecida confere com o hash
   * @param {string} plainPassword - Senha em texto
   * @param {string} hashedPassword - Hash da senha
   * @returns {boolean} True se a senha confere
   */
  static async comparePassword(plainPassword, hashedPassword) {
    return await bcrypt.compare(plainPassword, hashedPassword);
  }
}

module.exports = UserModel;
