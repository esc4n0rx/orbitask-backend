 
/**
 * Middleware global para tratamento de erros
 * Deve ser o último middleware registrado no app
 */
const errorMiddleware = (error, req, res, next) => {
    console.error('Erro capturado:', error);
  
    // Erro de validação do Zod
    if (error.name === 'ZodError') {
      return res.status(400).json({
        error: 'Dados inválidos',
        details: error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message
        }))
      });
    }
  
    // Erro do Supabase
    if (error.code && error.code.startsWith('PGRST')) {
      return res.status(400).json({
        error: 'Erro de banco de dados',
        message: 'Verifique os dados informados'
      });
    }
  
    // Erro padrão
    res.status(error.status || 500).json({
      error: error.message || 'Erro interno do servidor',
      message: 'Algo deu errado. Tente novamente.'
    });
  };
  
  module.exports = errorMiddleware;