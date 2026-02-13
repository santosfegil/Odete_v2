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
    const stripeSecretKey = Deno.env.get('STRIPE_SECRET_KEY')!;
    const webhookSecret = Deno.env.get('STRIPE_WEBHOOK_SECRET')!;
    const stripe = new Stripe(stripeSecretKey, { apiVersion: '2023-10-16' });

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceRoleKey = Deno.env.get('SERVICE_ROLE_KEY')!;
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    // Verificar assinatura do Stripe
    const body = await req.text();
    const signature = req.headers.get('stripe-signature');

    if (!signature) {
      return new Response('Webhook signature missing', { status: 400 });
    }

    let event: Stripe.Event;
    try {
      event = await stripe.webhooks.constructEventAsync(body, signature, webhookSecret);
    } catch (err) {
      console.error('Webhook signature verification failed:', err.message);
      return new Response(`Webhook Error: ${err.message}`, { status: 400 });
    }

    console.log(`Stripe event received: ${event.type}`);

    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session;
        const userId = session.metadata?.user_id;
        const planId = session.metadata?.plan_id;
        const customerId = session.customer as string;

        if (!userId || !planId) {
          console.error('Missing metadata in checkout session');
          break;
        }

        // Upsert user_subscriptions
        const { error: subError } = await adminClient
          .from('user_subscriptions')
          .upsert({
            user_id: userId,
            plan_id: planId,
            provider: 'stripe',
            status: 'active',
            gateway_id: customerId,
            is_auto_renewing: true,
            start_date: new Date().toISOString(),
          }, { onConflict: 'user_id' });

        if (subError) {
          console.error('Error upserting subscription:', subError);
          // Fallback: tentar insert se upsert falhar
          await adminClient.from('user_subscriptions').insert({
            user_id: userId,
            plan_id: planId,
            provider: 'stripe',
            status: 'active',
            gateway_id: customerId,
            is_auto_renewing: true,
            start_date: new Date().toISOString(),
          });
        }

        // Atualizar current_plan_id do usuario
        await adminClient
          .from('users')
          .update({ current_plan_id: planId })
          .eq('id', userId);

        console.log(`Subscription activated for user ${userId}`);
        break;
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: sub } = await adminClient
          .from('user_subscriptions')
          .select('id, user_id')
          .eq('gateway_id', customerId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (sub) {
          await adminClient
            .from('user_subscriptions')
            .update({
              status: subscription.status === 'active' ? 'active' : subscription.status,
              is_auto_renewing: !subscription.cancel_at_period_end,
            })
            .eq('id', sub.id);

          console.log(`Subscription updated for customer ${customerId}: ${subscription.status}`);
        }
        break;
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription;
        const customerId = subscription.customer as string;

        const { data: sub } = await adminClient
          .from('user_subscriptions')
          .select('id, user_id')
          .eq('gateway_id', customerId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (sub) {
          await adminClient
            .from('user_subscriptions')
            .update({
              status: 'canceled',
              is_auto_renewing: false,
              end_date: new Date().toISOString(),
            })
            .eq('id', sub.id);

          await adminClient
            .from('users')
            .update({ current_plan_id: null })
            .eq('id', sub.user_id);

          console.log(`Subscription canceled for customer ${customerId}`);
        }
        break;
      }

      case 'invoice.paid': {
        const invoice = event.data.object as Stripe.Invoice;
        const customerId = invoice.customer as string;

        const { data: sub } = await adminClient
          .from('user_subscriptions')
          .select('id')
          .eq('gateway_id', customerId)
          .order('created_at', { ascending: false })
          .limit(1)
          .single();

        if (sub) {
          await adminClient.from('subscription_invoices').insert({
            subscription_id: sub.id,
            amount: (invoice.amount_paid || 0) / 100,
            status: 'paid',
            pdf_url: invoice.invoice_pdf || null,
          });

          console.log(`Invoice recorded for customer ${customerId}`);
        }
        break;
      }

      default:
        console.log(`Unhandled event type: ${event.type}`);
    }

    return new Response(JSON.stringify({ received: true }), {
      headers: { 'Content-Type': 'application/json' },
      status: 200,
    });

  } catch (error) {
    console.error('Webhook handler error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
