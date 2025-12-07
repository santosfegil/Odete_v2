import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";

const PLUGGY_API_URL = "https://api.pluggy.ai";

// 1. Configuração do Cliente Supabase Admin
const supabaseAdmin: SupabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SERVICE_ROLE_KEY") ?? "" // Usando o nome correto que configuramos
);

interface AccountMap {
    [externalId: string]: string;
}

// 2. Função de Mapeamento de Tipos
function mapPluggyAccountType(pluggyType: string, pluggySubtype: string): string {
  if (pluggyType === 'BANK') return 'bank';
  if (pluggyType === 'CREDIT') return 'credit_card';
  if (pluggyType === 'INVESTMENT') return 'investment';
  return 'other_asset';
}

// 3. Função Core de Sincronização
async function syncDataForItem(itemId: string, user_id: string, bank_connection_id: string, apiKey: string) {
    console.log(`[SYNC] Iniciando. ItemID: ${itemId}, UserID: ${user_id}`);

    // A. Buscar Contas
    const accountsResponse = await fetch(`${PLUGGY_API_URL}/accounts?itemId=${itemId}`, {
      headers: { "X-API-KEY": apiKey },
    });
    
    if (!accountsResponse.ok) {
        const errText = await accountsResponse.text();
        throw new Error(`Erro Pluggy API (Accounts): ${errText}`);
    }

    const { results: accounts } = await accountsResponse.json();
    console.log(`[SYNC] Contas encontradas: ${accounts?.length || 0}`);

    if (!accounts || accounts.length === 0) return { user_id };

    const accountsToUpsert = accounts.map((acc: any) => ({
      external_id: acc.id, 
      user_id: user_id,
      bank_connection_id: bank_connection_id,
      name: `${acc.name} (${acc.number})`,
      type: mapPluggyAccountType(acc.type, acc.subtype),
      balance: acc.balance,
      currency: acc.currency,
      updated_at: new Date().toISOString(),
    }));

    const { error: accError } = await supabaseAdmin
        .from("accounts")
        .upsert(accountsToUpsert, { onConflict: 'external_id' }); 
    
    if (accError) {
        console.error("[SYNC_ERROR] Falha ao salvar contas:", accError);
        throw accError;
    }

    // B. Buscar IDs internos para relacionamento
    const pluggyAccountIds = accounts.map((acc: any) => acc.id);
    const { data: internalAccounts, error: fetchAccError } = await supabaseAdmin
        .from('accounts')
        .select('id, external_id')
        .in('external_id', pluggyAccountIds);
        
    if (fetchAccError) throw fetchAccError;

    const accountMap: AccountMap = internalAccounts.reduce((map: any, acc: any) => {
        map[acc.external_id] = acc.id;
        return map;
    }, {} as AccountMap);

    // C. Buscar e Salvar Transações
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30); // Últimos 30 dias
    const fromString = fromDate.toISOString().split('T')[0];

    for (const acc of accounts) {
        if (!accountMap[acc.id]) continue;

        const transResponse = await fetch(
            `${PLUGGY_API_URL}/transactions?accountId=${acc.id}&from=${fromString}`, 
            { headers: { "X-API-KEY": apiKey } }
        );
        const { results: transactions } = await transResponse.json();

        if (!transactions || transactions.length === 0) continue;

        const transactionsToUpsert = transactions.map((tx: any) => ({
            external_id: tx.id,
            user_id: user_id, 
            account_id: accountMap[acc.id],
            description: tx.description,
            amount: tx.amount,
            date: tx.date,
            status: tx.status === 'POSTED' ? 'paid' : 'pending',
            type: tx.amount < 0 ? 'expense' : 'income',
        }));

        const { error: txError } = await supabaseAdmin
            .from("transactions")
            .upsert(transactionsToUpsert, { onConflict: 'external_id' });
        
        if (txError) console.error(`[SYNC_ERROR] Falha transações conta ${acc.id}:`, txError);
    }
    
    console.log("[SYNC] Sucesso.");
    return { user_id };
}

async function getPluggyApiKey(): Promise<string> {
    const clientId = Deno.env.get("PLUGGY_CLIENT_ID");
    const clientSecret = Deno.env.get("PLUGGY_CLIENT_SECRET");

    if (!clientId || !clientSecret) throw new Error("Credenciais Pluggy ausentes.");
    
    const authResponse = await fetch(`${PLUGGY_API_URL}/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, clientSecret }),
    });
    
    const { apiKey } = await authResponse.json();
    return apiKey;
}

// --------------------------------------------------------------------------
// Handler Principal (SEM VERIFICAÇÃO DE ASSINATURA)
// --------------------------------------------------------------------------

serve(async (req) => {
  // Tenta detectar se é Webhook pelo evento
  const bodyText = await req.text();
  let bodyJson;
  try {
      bodyJson = JSON.parse(bodyText);
  } catch(e) {
      bodyJson = {};
  }

  // Verifica se veio do botão (tem itemId direto) ou do webhook (tem evento e item dentro)
  const itemId = bodyJson.itemId || bodyJson.item?.id;
  
  let user_id: string;
  let bank_connection_id: string;

  try {
    const apiKey = await getPluggyApiKey();

    // Se tiver cabeçalho de auth, assumimos chamada manual do App (Seguro)
    const authHeader = req.headers.get("Authorization");

    if (authHeader) {
        // --- FLUXO MANUAL (APP) ---
        const userToken = authHeader.replace("Bearer ", "");
        const { data: { user }, error: userError } = await supabaseAdmin.auth.getUser(userToken);
        
        if (userError || !user) throw new Error("Usuário não autenticado.");
        user_id = user.id;

        if (!itemId) throw new Error("itemId é obrigatório.");

        // Salva conexão
        const { data: connData, error: connError } = await supabaseAdmin
            .from("bank_connections")
            .upsert({ user_id, provider_id: itemId }, { onConflict: 'provider_id' })
            .select('id')
            .single();

        if (connError) throw connError;
        bank_connection_id = connData.id;

    } else {
        // --- FLUXO WEBHOOK (SEM AUTH DE USUÁRIO) ---
        // Como removemos a assinatura, confiamos apenas que o itemId existe no nosso banco.
        if (!itemId) {
            return new Response(JSON.stringify({ message: "Ignorado: payload sem ItemID" }), { status: 200 });
        }

        // Buscamos quem é o dono desse Item no banco
        const { data: connData, error: connError } = await supabaseAdmin
            .from("bank_connections")
            .select('id, user_id')
            .eq('provider_id', itemId)
            .single();
            
        if (connError || !connData) {
            console.warn(`[WEBHOOK] ItemID ${itemId} desconhecido. Ignorando.`);
            return new Response(JSON.stringify({ message: "Item desconhecido." }), { status: 200 });
        }

        user_id = connData.user_id;
        bank_connection_id = connData.id;
    }

    // Executa Sync
    await syncDataForItem(itemId, user_id, bank_connection_id, apiKey);
    
    return new Response(JSON.stringify({ message: "Sincronização concluída!" }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error: any) {
    console.error("[FATAL ERROR]", error);
    return new Response(JSON.stringify({ error: error.message || "Erro desconhecido" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});