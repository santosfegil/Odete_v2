// Setup type definitions for built-in Supabase Runtime APIs
import "jsr:@supabase/functions-js/edge-runtime.d.ts"

console.log("Função create-pluggy-token iniciada!")

Deno.serve(async (req) => {
  // 1. Configuração de CORS (Para seu Frontend React conseguir acessar)
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Responde ao "pre-flight" do navegador (verificação de segurança antes do request real)
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 2. Acessa as chaves que você configurou nos Secrets do Supabase
    // IMPORTANTE: Certifique-se de ter rodado o comando 'supabase secrets set ...'
    const clientId = Deno.env.get('PLUGGY_CLIENT_ID')
    const clientSecret = Deno.env.get('PLUGGY_CLIENT_SECRET')

    if (!clientId || !clientSecret) {
      throw new Error('As chaves PLUGGY_CLIENT_ID e PLUGGY_CLIENT_SECRET não foram encontradas no servidor.')
    }

    // 3. Passo A: Autenticar na Pluggy para pegar a API KEY (Mestra)
    const authResponse = await fetch('https://api.pluggy.ai/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientId, clientSecret }),
    })

    if (!authResponse.ok) {
      const errorText = await authResponse.text()
      throw new Error(`Erro na Autenticação Pluggy: ${errorText}`)
    }

    const { apiKey } = await authResponse.json()

    // 4. Passo B: Gerar o Connect Token (Temporário para o Frontend)
    const tokenResponse = await fetch('https://api.pluggy.ai/connect_token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-KEY': apiKey,
      },
      body: JSON.stringify({
        // Aqui você pode adicionar opções extras no futuro, como webhookUrl
      }),
    })

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text()
      throw new Error(`Erro ao gerar Connect Token: ${errorText}`)
    }

    const data = await tokenResponse.json()

    // 5. Retorna o token para o seu botão no React
    return new Response(JSON.stringify(data), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    // Tratamento de erro seguro
    console.error(error)
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})