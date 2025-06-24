 
const { createClient } = require('@supabase/supabase-js');

// Cara, aqui configuramos o cliente do Supabase que vai ser usado em toda a aplicação
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('SUPABASE_URL e SUPABASE_ANON_KEY são obrigatórios no .env');
}

const supabase = createClient(supabaseUrl, supabaseKey);

module.exports = supabase;