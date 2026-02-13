import "jsr:@supabase/functions-js/edge-runtime.d.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import Stripe from "https://esm.sh/stripe@14.14.0?target=deno";

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
      throw new Error('Token de autenticacao nao fornecido.');
    }

    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(
      authHeader.replace('Bearer ', '')
    );

    if (authError || !user) {
      throw new Error('Usuario nao autenticado ou token invalido.');
    }

    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY');
    if (!stripeSecretKey) {
      throw new Error('STRIPE_SECRET_KEY nao configurada.');
    }

    // Buscar gateway_id (Stripe Customer ID) do usuario
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    const { data: subscription, error: subError } = await adminClient
      .from('user_subscriptions')
      .select('gateway_id')
      .eq('user_id', user.id)
      .not('gateway_id', 'is', null)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (subError || !subscription?.gateway_id) {
      throw new Error('Nenhuma assinatura ativa encontrada. Entre em contato com o suporte.');
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2023-10-16',
    });

    // Determinar return_url a partir do Origin ou Referer
    const origin = req.headers.get('origin') || req.headers.get('referer') || supabaseUrl;

    const portalSession = await stripe.billingPortal.sessions.create({
      customer: subscription.gateway_id,
      return_url: origin,
    });

    return new Response(JSON.stringify({ url: portalSession.url }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error("Erro ao criar portal Stripe:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});
