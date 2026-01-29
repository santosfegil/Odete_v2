// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PluggyClient } from "npm:pluggy-sdk";

console.log("🚀 Função create-pluggy-token iniciada!")

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseClient = createClient(supabaseUrl, supabaseAnonKey);

    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Token de autenticação não fornecido.');
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      console.error("Erro de Auth:", authError);
      throw new Error('Usuário não autenticado ou token inválido.');
    }

    console.log(`👤 Gerando token para usuário ID: ${user.id}`);

    const clientId = Deno.env.get('PLUGGY_CLIENT_ID');
    const clientSecret = Deno.env.get('PLUGGY_CLIENT_SECRET');

    if (!clientId || !clientSecret) {
      throw new Error('Credenciais da Pluggy não configuradas (Secrets).');
    }

    const pluggyClient = new PluggyClient({
      clientId,
      clientSecret,
    });

    // ========================================
    // 🔧 CORREÇÃO PRINCIPAL: URL do Webhook
    // ========================================
    // Monta a URL correta das Edge Functions do Supabase
    // Formato: https://[project-ref].supabase.co/functions/v1/sync-bank-data
    const projectRef = supabaseUrl.match(/https:\/\/([^.]+)\./)?.[1];
    if (!projectRef) {
      throw new Error('Não foi possível extrair project-ref da SUPABASE_URL');
    }

    const webhookBaseUrl = `https://${projectRef}.supabase.co/functions/v1/sync-bank-data`;
    const webhookUrlWithId = `${webhookBaseUrl}?clientUserId=${user.id}`;
    
    console.log(`🔗 Webhook URL: ${webhookUrlWithId}`);

    // Gera o Connect Token
    const data = await pluggyClient.createConnectToken(undefined, {
      clientUserId: user.id,          // Método Principal
      webhookUrl: webhookUrlWithId,   // Método de Backup
      options: {
        includeSandbox: true
      }
    });

    console.log(`✅ Token criado: ${data.accessToken.substring(0, 20)}...`);

    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("🚨 Erro ao criar token:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});