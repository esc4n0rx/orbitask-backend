 
/**
 * Middleware para validação de dados usando Zod
 * @param {Object} schema - Schema Zod para validação
 * @returns {Function} Middleware do Express
 */
const validate = (schema) => {
    return (req, res, next) => {
      try {
        // Valida os dados da requisição contra o schema
        schema.parse({
          body: req.body,
          query: req.query,
          params: req.params
        });
        next();
      } catch (error) {
        // Se a validação falhar, retorna erro 400 com detalhes
        return res.status(400).json({
          error: 'Dados inválidos',
          details: error.errors.map(err => ({
            field: err.path.join('.'),
            message: err.message
          }))
        });
      }
    };
  };
  
  module.exports = validate;