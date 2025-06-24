const { ORBIT_AI_SYSTEM_PROMPT, generateContextualPrompt } = require('../utils/prompts');
const { logger } = require('../utils/logger');

class AiService {
  constructor() {
    this.apiUrl = 'https://conductor.arcee.ai/v1/chat/completions';
    this.apiToken = process.env.ARCEE_TOKEN;
    
    if (!this.apiToken) {
      throw new Error('ARCEE_TOKEN é obrigatório no .env');
    }
  }

  /**
   * Envia uma pergunta para a Orbit AI com contexto
   * @param {string} userQuery - Pergunta do usuário
   * @param {Object} contextData - Dados contextuais da station/board/task
   * @param {string} correlationId - ID de correlação para logs
   * @returns {Object} Resposta da IA
   */
  async askOrbitAI(userQuery, contextData, correlationId) {
    try {
      const startTime = Date.now();

      // Gera o prompt contextual
      const contextualPrompt = generateContextualPrompt(userQuery, contextData);

      // Cara, aqui montamos a requisição para a API da Arcee
      const requestBody = {
        model: "auto",
        messages: [
          {
            role: "system",
            content: ORBIT_AI_SYSTEM_PROMPT
          },
          {
            role: "user",
            content: contextualPrompt
          }
        ],
        temperature: 0.7, // Um pouco de criatividade, mas não muito
        max_tokens: 1000,  // Limite razoável para respostas
        top_p: 0.9
      };

      logger.info('AI Request Started', {
        correlationId,
        contextDataSize: JSON.stringify(contextData).length,
        userQueryLength: userQuery.length
      });

      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.text();
        throw new Error(`API Error: ${response.status} - ${errorData}`);
      }

      const data = await response.json();
      const duration = Date.now() - startTime;

      logger.info('AI Request Completed', {
        correlationId,
        duration: `${duration}ms`,
        tokensUsed: data.usage?.total_tokens || 'unknown'
      });

      // Extrai a resposta da IA
      const aiResponse = data.choices?.[0]?.message?.content;
      
      if (!aiResponse) {
        throw new Error('Resposta vazia da API da IA');
      }

      return {
        response: aiResponse,
        metadata: {
          tokens_used: data.usage?.total_tokens || 0,
          model_used: data.model || 'auto',
          response_time_ms: duration,
          timestamp: new Date().toISOString()
        }
      };

    } catch (error) {
      logger.error('AI Service Error', {
        correlationId,
        error: error.message,
        userQuery: userQuery.substring(0, 100) // Log apenas início da query por segurança
      });

      // Retorna uma resposta de fallback em caso de erro
      return {
        response: "Desculpe, não consegui processar sua pergunta no momento. Tente novamente em alguns instantes ou reformule sua pergunta.",
        metadata: {
          error: true,
          error_message: error.message,
          timestamp: new Date().toISOString()
        }
      };
    }
  }

  /**
   * Verifica se a API da Arcee está disponível
   * @returns {boolean} Status da API
   */
  async checkApiHealth() {
    try {
      const response = await fetch(this.apiUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiToken}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          model: "auto",
          messages: [{ role: "user", content: "health check" }],
          max_tokens: 10
        })
      });

      return response.ok;
    } catch (error) {
      logger.error('AI API Health Check Failed', { error: error.message });
      return false;
    }
  }
}

module.exports = new AiService();