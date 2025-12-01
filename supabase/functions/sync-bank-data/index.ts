import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient, SupabaseClient } from "https://esm.sh/@supabase/supabase-js@2";
import { createHmac } from "https://deno.land/std@0.201.0/crypto/mod.ts";

const PLUGGY_API_URL = "https://api.pluggy.ai";
const supabaseAdmin: SupabaseClient = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
);

// Interface para o mapeamento de contas (para evitar o erro de tipagem anterior)
interface AccountMap {
    [externalId: string]: string;
}

/**
 * Função Core: Realiza a sincronização de Contas e Transações para um Item/Usuário específico.
 * @param itemId - ID do Item da Pluggy.
 * @param user_id - ID do Usuário do Supabase.
 * @param bank_connection_id - ID interno da conexão do Supabase.
 */
async function syncDataForItem(itemId: string, user_id: string, bank_connection_id: string, apiKey: string) {
    
    // 1. Buscar Contas (Accounts) da Pluggy e Mapear
    const accountsResponse = await fetch(`${PLUGGY_API_URL}/accounts?itemId=${itemId}`, {
      headers: { "X-API-KEY": apiKey },
    });
    const { results: accounts } = await accountsResponse.json();

    const accountsToUpsert = accounts.map((acc: any) => ({
      external_id: acc.id, 
      user_id: user_id,
      bank_connection_id: bank_connection_id,
      name: acc.name,
      type: acc.type,
      balance: acc.balance,
      currency: acc.currency,
      updated_at: new Date().toISOString(),
    }));

    // 2. Salvar Contas na tabela 'accounts'
    if (accountsToUpsert.length > 0) {
        const { error: accError } = await supabaseAdmin
            .from("accounts")
            .upsert(accountsToUpsert, { onConflict: 'external_id' }); 
        if (accError) throw accError;
    }

    // 3. Buscar IDs internos das contas (para o FK nas Transações)
    const pluggyAccountIds = accounts.map((acc: any) => acc.id);
    const { data: internalAccounts, error: fetchAccError } = await supabaseAdmin
        .from('accounts')
        .select('id, external_id')
        .in('external_id', pluggyAccountIds);
        
    if (fetchAccError) throw fetchAccError;

    const accountMap: AccountMap = internalAccounts.reduce((map, acc: any) => {
        map[acc.external_id] = acc.id;
        return map;
    }, {} as AccountMap);


    // 4. Buscar e Salvar Transações (últimos 30 dias)
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - 30);
    const fromString = fromDate.toISOString().split('T')[0];

    for (const acc of accounts) {
        const transResponse = await fetch(
            `${PLUGGY_API_URL}/transactions?accountId=${acc.id}&from=${fromString}`, 
            { headers: { "X-API-KEY": apiKey } }
        );
        const { results: transactions } = await transResponse.json();

        const transactionsToUpsert = transactions.map((tx: any) => ({
            external_id: tx.id,
            user_id: user_id, 
            account_id: accountMap[acc.id], // ID interno da Conta
            description: tx.description,
            amount: tx.amount,
            date: tx.date,
            status: tx.status,
            type: tx.amount < 0 ? 'EXPENSE' : 'INCOME',
        }));

        if (transactionsToUpsert.length > 0) {
            const { error: txError } = await supabaseAdmin
                .from("transactions")
                .upsert(transactionsToUpsert, { onConflict: 'external_id' });
            
            if (txError) throw txError;
        }
    }
    
    return { user_id };
}

/**
 * Função auxiliar para gerar a Pluggy API Key.
 */
async function getPluggyApiKey(): Promise<string> {
    const clientId = Deno.env.get("PLUGGY_CLIENT_ID");
    const clientSecret = Deno.env.get("PLUGGY_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
        throw new Error("Credenciais Pluggy não definidas.");
    }
    
    const authResponse = await fetch(`${PLUGGY_API_URL}/auth`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ clientId, clientSecret }),
    });
    
    const { apiKey } = await authResponse.json();
    if (!apiKey) throw new Error("Falha ao obter Pluggy API Key.");
    
    return apiKey;
}

/**
 * Função para verificar a assinatura do Webhook.
 */
function verifySignature(signature: string, body: string, secret: string): boolean {
    const [signatureVersion, signatureHash] = signature.split('=');
    if (signatureVersion !== 'v1') return false;

    const hmac = createHmac("sha256", secret);
    hmac.update(body);
    const expectedHash = hmac.toString('hex');

    return expectedHash === signatureHash;
}

// --------------------------------------------------------------------------
// Ponto de Entrada da Edge Function
// --------------------------------------------------------------------------

serve(async (req) => {
  const isWebhook = req.headers.has("X-Pluggy-Signature");
  let itemId: string;
  let user_id: string;
  let bank_connection_id: string;

  try {
    const apiKey = await getPluggyApiKey();
    const contentType = req.headers.get("content-type") || "";

    if (isWebhook) {
      // ** Lógica para Webhook (Chamada Autônoma) **
      const secret = Deno.env.get("PLUGGY_WEBHOOK_SECRET");
      if (!secret) throw new Error("PLUGGY_WEBHOOK_SECRET não está definida.");
      
      const signature = req.headers.get("X-Pluggy-Signature");
      const rawBody = await req.text();
      
      if (!signature || !verifySignature(signature, rawBody, secret)) {
        console.warn("Webhook: Assinatura inválida.");
        return new Response(JSON.stringify({ error: "Assinatura inválida." }), { status: 401 });
      }

      const webhookPayload = JSON.parse(rawBody);
      itemId = webhookPayload.item?.id;

      if (!itemId) {
        // Ignora eventos sem ID de item (ex: ITEM_CREATED sem dados)
        return new Response(JSON.stringify({ message: "Payload de Webhook sem Item ID." }), { status: 200 });
      }

      // Busca o user_id e bank_connection_id a partir do itemId (provider_id)
      const { data: connData, error: connError } = await supabaseAdmin
        .from("bank_connections")
        .select('id, user_id')
        .eq('provider_id', itemId)
        .single();
        
      if (connError || !connData) {
        // Se a conexão ainda não foi salva (o que não deveria acontecer), ignora.
        console.warn(`Webhook: Item ID ${itemId} não encontrado no DB. Ignorando.`);
        return new Response(JSON.stringify({ message: "Item não vinculado a um usuário." }), { status: 200 });
      }

      user_id = connData.user_id;
      bank_connection_id = connData.id;
      
    } else {
      // ** Lógica para Sincronização Manual (Chamada do Frontend) **
      const userToken = req.headers.get("Authorization")?.replace("Bearer ", "");
      if (!userToken) throw new Error("User Token ausente. Requisição manual requer autenticação.");
      
      const { user } = await supabaseAdmin.auth.getUser(userToken);
      if (!user) throw new Error("Falha na autenticação do usuário.");
      user_id = user.id;

      const { itemId: manualItemId } = await req.json();
      itemId = manualItemId;
      if (!itemId) throw new Error("Item ID é obrigatório para sincronização manual.");

      // Salva/Atualiza na Tabela 'bank_connections' e pega o ID interno
      const { data: connData, error: connError } = await supabaseAdmin
          .from("bank_connections")
          .upsert({ user_id, provider_id: itemId }, { onConflict: 'provider_id' })
          .select('id')
          .single();

      if (connError || !connData) throw connError;
      bank_connection_id = connData.id;
    }

    // ----------------------------------------------------------------------
    // Execução da Sincronização Core (Comum aos dois fluxos)
    // ----------------------------------------------------------------------
    await syncDataForItem(itemId, user_id, bank_connection_id, apiKey);
    
    return new Response(JSON.stringify({ message: "Sincronização concluída!" }), {
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    let errorMessage = "Erro desconhecido durante a sincronização.";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'object' && error !== null && 'message' in error) {
        errorMessage = (error as { message: string }).message;
    }
    
    console.error("Erro na Edge Function:", errorMessage);

    return new Response(JSON.stringify({ error: "Erro na sincronização: " + errorMessage }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});