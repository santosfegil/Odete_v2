// ═══════════════════════════════════════════════════════════════════════════════
// sync-bank-data/index.ts
// Edge Function para sincronizar dados bancários via Pluggy API
// ═══════════════════════════════════════════════════════════════════════════════

// 1. IMPORTS E CONFIGURAÇÃO
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { PluggyClient } from "npm:pluggy-sdk";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-pluggy-secret-key",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

const pluggyClient = new PluggyClient({
  clientId: Deno.env.get("PLUGGY_CLIENT_ID")!,
  clientSecret: Deno.env.get("PLUGGY_CLIENT_SECRET")!,
});


// ═══════════════════════════════════════════════════════════════════════════════
// NOVA LÓGICA DE CATEGORIAS (Mapeamento Inteligente)
// ═══════════════════════════════════════════════════════════════════════════════

// Cache para não buscar no banco toda hora (ex: não buscar ID de Alimentação 50 vezes)
const systemCategoryCache: Record<string, string> = {};

// Mapa: O que vem da Pluggy -> O que temos no Sistema
const CATEGORY_MAP: Record<string, string> = {
  // Inglês (Padrão API Pluggy)
  'Eating Out': 'Alimentação',
  'Food & Drink': 'Alimentação',
  'Supermarket': 'Alimentação',
  'Restaurant': 'Alimentação',
  'Transport': 'Transporte',
  'Public Transport': 'Transporte',
  'Taxis & Ride Shares': 'Transporte',
  'Fuel': 'Transporte',
  'Parking': 'Transporte',
  'Housing': 'Moradia',
  'Utilities': 'Moradia',
  'Maintenance': 'Moradia',
  'Health': 'Saúde',
  'Wellness': 'Saúde',
  'Pharmacy': 'Saúde',
  'Doctor': 'Saúde',
  'Education': 'Educação',
  'Shopping': 'Compras',
  'Clothing': 'Compras',
  'Electronics': 'Compras',
  'Entertainment': 'Lazer',
  'Travel': 'Lazer',
  'Movies': 'Lazer',
  'Services': 'Serviços',
  'Subscriptions': 'Serviços',
  'Bank Charges': 'Serviços',
  'Taxes': 'Serviços',
  'Salary': 'Salário',
  'Paycheck': 'Salário',
  'Interest': 'Investimentos',
  'Dividends': 'Investimentos',
  // Português (Caso venha traduzido)
  'Comida e Bebida': 'Alimentação',
  'Transporte': 'Transporte',
  'Moradia': 'Moradia',
  'Saúde': 'Saúde',
  'Educação': 'Educação',
  'Compras': 'Compras',
  'Lazer': 'Lazer',
  'Serviços': 'Serviços',
  'Renda': 'Salário'
};

async function resolveCategory(pluggyCategoryName: string | undefined): Promise<string> {
  // 1. Normalização: Se vier vazio, assume 'Outros'
  const rawName = pluggyCategoryName || "Outros";
  
  // 2. Tradução: Tenta achar no mapa exato
  let targetName = CATEGORY_MAP[rawName];

  // 3. Tradução Inteligente (Busca por palavra-chave se não achou exato)
  if (!targetName) {
    const lower = rawName.toLowerCase();
    if (lower.includes('food') || lower.includes('mercado') || lower.includes('restaurante')) targetName = 'Alimentação';
    else if (lower.includes('uber') || lower.includes('99') || lower.includes('posto') || lower.includes('gas')) targetName = 'Transporte';
    else if (lower.includes('farmacia') || lower.includes('droga') || lower.includes('medico')) targetName = 'Saúde';
    else if (lower.includes('cinema') || lower.includes('ticket') || lower.includes('show')) targetName = 'Lazer';
    else targetName = 'Outros'; // Se não souber o que é, joga em Outros
  }

  // 4. Verifica se já temos o ID em memória (Cache)
  if (systemCategoryCache[targetName]) {
    return systemCategoryCache[targetName];
  }

  // 5. Busca no Banco de Dados (Buscando pelo NOME na tabela de sistema)
  // user_id null garante que é a categoria global
  const { data, error } = await supabaseAdmin
    .from("categories")
    .select("id")
    .eq("name", targetName)
    .is("user_id", null) 
    .maybeSingle();

  if (data) {
    systemCategoryCache[targetName] = data.id; // Salva no cache
    return data.id;
  }

  // 6. Fallback de Segurança (Caso extremo onde 'Alimentação' foi deletado)
  console.warn(`⚠️ Categoria sistema '${targetName}' não encontrada. Usando 'Outros'.`);
  
  const { data: fallback } = await supabaseAdmin
    .from("categories")
    .select("id")
    .eq("name", "Outros")
    .is("user_id", null)
    .single();

  if (fallback) {
    return fallback.id;
  }

  throw new Error("❌ ERRO CRÍTICO: Nenhuma categoria do sistema encontrada (nem 'Outros'). Rode o Seed do banco!");
}

// ═══════════════════════════════════════════════════════════════════════════════
// APLICAÇÃO DE REGRAS DE CATEGORIZAÇÃO DO USUÁRIO
// ═══════════════════════════════════════════════════════════════════════════════

interface CategoryRuleResult {
  categoryId: string | null;
  tagId: string | null;
}

async function applyCategoryRules(
  userId: string,
  receiverDocument: string | null,
  receiverName: string | null,
  amount: number,
  description: string
): Promise<CategoryRuleResult | null> {
  // Busca regras ativas do usuário, ordenadas por prioridade
  const { data: rules, error } = await supabaseAdmin
    .from('category_rules')
    .select('*')
    .eq('user_id', userId)
    .eq('is_active', true)
    .order('priority', { ascending: false });

  if (error || !rules || rules.length === 0) {
    return null; // Sem regras, usa Pluggy
  }

  for (const rule of rules) {
    // 1. Match por CPF/CNPJ (mais confiável)
    if (rule.match_receiver_document && receiverDocument) {
      if (receiverDocument === rule.match_receiver_document) {
        console.log(`📌 Regra aplicada [document]: ${rule.rule_name || rule.id}`);
        return { categoryId: rule.target_category_id, tagId: rule.target_tag_id };
      }
    }

    // 2. Match por nome + valor (com range)
    if (rule.match_receiver_name && receiverName) {
      const nameMatch = receiverName.toLowerCase().includes(rule.match_receiver_name.toLowerCase());
      const amountInRange = (
        (!rule.match_amount_min || amount >= rule.match_amount_min) &&
        (!rule.match_amount_max || amount <= rule.match_amount_max)
      );
      
      if (nameMatch && amountInRange) {
        console.log(`📌 Regra aplicada [name+amount]: ${rule.rule_name || rule.id}`);
        return { categoryId: rule.target_category_id, tagId: rule.target_tag_id };
      }
    }

    // 3. Match por descrição (fallback)
    if (rule.match_description_contains && description) {
      if (description.toLowerCase().includes(rule.match_description_contains.toLowerCase())) {
        console.log(`📌 Regra aplicada [description]: ${rule.rule_name || rule.id}`);
        return { categoryId: rule.target_category_id, tagId: rule.target_tag_id };
      }
    }
  }

  return null; // Nenhuma regra aplicável
}

// ═══════════════════════════════════════════════════════════════════════════════
// 2. MÉTODOS ADICIONAIS DO PLUGGY CLIENT (fetch direto para endpoints não cobertos pelo SDK)
// ═══════════════════════════════════════════════════════════════════════════════

async function getPluggyAccessToken(): Promise<string> {
  const res = await fetch("https://api.pluggy.ai/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId: Deno.env.get("PLUGGY_CLIENT_ID"),
      clientSecret: Deno.env.get("PLUGGY_CLIENT_SECRET"),
    }),
  });
  const data = await res.json();
  return data.apiKey;
}

async function fetchInvestments(itemId: string): Promise<{ results: any[] }> {
  const token = await getPluggyAccessToken();
  const res = await fetch(`https://api.pluggy.ai/investments?itemId=${itemId}`, {
    headers: { "X-API-KEY": token },
  });
  if (!res.ok) {
    console.warn("Investments endpoint retornou:", res.status);
    return { results: [] };
  }
  return res.json();
}

async function fetchLoans(itemId: string): Promise<{ results: any[] }> {
  const token = await getPluggyAccessToken();
  const res = await fetch(`https://api.pluggy.ai/loans?itemId=${itemId}`, {
    headers: { "X-API-KEY": token },
  });
  if (!res.ok) {
    console.warn("Loans endpoint retornou:", res.status);
    return { results: [] };
  }
  return res.json();
}

// ═══════════════════════════════════════════════════════════════════════════════
// 3. HELPER FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

function mapAccountType(pluggyType: string, pluggySubtype?: string): string {
  const type = pluggyType?.toUpperCase();
  const subtype = pluggySubtype?.toUpperCase();

  if (type === "CREDIT" && subtype === "CREDIT_CARD") return "credit_card";
  if (type === "CREDIT" && subtype === "LOAN") return "loan";
  if (type === "BANK") {
    console.log('brigadeiro', subtype); 
    if (subtype === "CHECKING_ACCOUNT") return "checking_account";
    if (subtype === "SAVINGS_ACCOUNT") return "savings_account";
    return "bank";
  }

  const map: Record<string, string> = {
    CHECKING_ACCOUNT: "bank",
    SAVINGS_ACCOUNT: "bank",
    CREDIT: "credit_card",
    INVESTMENT: "investment",
    LOAN_ACCOUNT: "loan",
    PAYMENT_ACCOUNT: "wallet",
  };
  return map[subtype ?? ""] || map[type] || "other_asset";
}

async function generateInvestmentHash(params: {
  accountId: string;
  date: string;
  amount: number;
  type: string;
  brokerageNumber?: string;
}): Promise<string> {
  const safe = (v: any) => (v ? String(v).trim().toUpperCase() : "NA");
  const raw = `${params.accountId}_${safe(params.date)}_${params.amount}_${safe(params.type)}_${safe(params.brokerageNumber)}`;
  const msgUint8 = new TextEncoder().encode(raw);
  const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return "INV_" + hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);
}

function generateAccountHash(params: {
  userId: string;
  institutionId: string;
  type: string;
  subtype?: string;
  identifier?: string;
  brand?: string;
}): string {
  const safeStr = (val?: string | null) => (val ? val.trim().toUpperCase() : "NA");
  const cleanId = params.identifier ? params.identifier.replace(/[^a-zA-Z0-9]/g, "") : "NA";
  return `${params.userId}_${params.institutionId}_${params.type}_${safeStr(params.subtype)}_${cleanId}_${safeStr(params.brand)}`;
}

function mapTransactionStatus(pluggyStatus: string): string {
  return pluggyStatus === "POSTED" ? "paid" : "pending";
}

function mapTransactionType(pluggyType: string): "income" | "expense" {
  return pluggyType === "CREDIT" ? "income" : "expense";
}

function calculateBillDate(transactionDate: string, closingDay: number | null, dueDay: number | null): string {
  const txDate = new Date(transactionDate);
  const txDay = txDate.getUTCDate();
  const txMonth = txDate.getUTCMonth();
  const txYear = txDate.getUTCFullYear();
  const effectiveClosingDay = closingDay ?? 1;
  const effectiveDueDay = dueDay ?? 10;
  let billMonth: number;
  let billYear: number;

  if (txDay <= effectiveClosingDay) {
    billMonth = txMonth;
    billYear = txYear;
  } else {
    billMonth = txMonth + 1;
    billYear = txYear;
    if (billMonth > 11) {
      billMonth = 0;
      billYear++;
    }
  }

  const lastDayOfMonth = new Date(billYear, billMonth + 1, 0).getUTCDate();
  const adjustedDueDay = Math.min(effectiveDueDay, lastDayOfMonth);
  const billDate = new Date(Date.UTC(billYear, billMonth, adjustedDueDay));
  return billDate.toISOString().split("T")[0];
}

const categoryCache: Record<string, string> = {};

async function getOrCreateCategory(userId: string, categoryName: string | undefined): Promise<string> {
  // Normaliza o nome para evitar duplicatas por casing ou espaços
  const safeName = (categoryName || "Outros").trim();
  const cacheKey = `${userId}-${safeName}`;

  // 1. Verifica memória (Cache L1)
  if (categoryCache[cacheKey]) return categoryCache[cacheKey];

  // 2. Tenta Inserir DIRETAMENTE
  // (Invertemos a lógica: tentar criar primeiro é mais seguro contra race conditions do que checar antes)
  const { data: created, error: insertError } = await supabaseAdmin
    .from("categories")
    .insert({
      user_id: userId,
      name: safeName,
      scope: "expense",
      is_system: false,
    })
    .select("id")
    .single();

  // Se inseriu com sucesso, salva no cache e retorna
  if (!insertError && created) {
    categoryCache[cacheKey] = created.id;
    return created.id;
  }

  // 3. Tratamento de Erro de Concorrência (Race Condition)
  // Se o erro for 23505, significa que outro processo criou essa categoria milissegundos atrás
  if (insertError && insertError.code === "23505") {
    console.log(`⚠️ Categoria '${safeName}' já existe (race condition). Buscando ID...`);
    
    const { data: existing, error: selectError } = await supabaseAdmin
      .from("categories")
      .select("id")
      .eq("user_id", userId)
      .eq("name", safeName) // Filtra pelo nome exato
      // Importante: Se o seu banco diferencia maiúsculas/minúsculas no constraint, garanta a busca correta
      .maybeSingle();

    if (existing) {
      categoryCache[cacheKey] = existing.id;
      return existing.id;
    }
    
    // Se deu erro 23505 mas não achou no select, algo muito estranho aconteceu (ex: deletaram a categoria nesse meio tempo)
    if (selectError) {
       console.error("Erro fatal ao recuperar categoria existente:", selectError);
       throw selectError;
    }
  }

  // Se for qualquer outro erro (ex: validação, permissão), explode o erro
  if (insertError) {
    console.error("Erro fatal criando categoria:", safeName, insertError.message);
    throw insertError;
  }

  // Fallback de segurança (teoricamente inalcançável)
  throw new Error(`Falha desconhecida ao gerenciar categoria: ${safeName}`);
}

// ═══════════════════════════════════════════════════════════════════════════════
// 4. SINCRONIZAÇÃO CORE
// ═══════════════════════════════════════════════════════════════════════════════

async function syncDataForItem(itemId: string, userId: string, bankConnectionId: string) {
  console.log("[1/6] Iniciando Sync. ItemId:", itemId);

  try {
    const { data: connection } = await supabaseAdmin
      .from("bank_connections")
      .select("institution_id")
      .eq("id", bankConnectionId)
      .single();
    const institutionId = connection?.institution_id ?? null;

    const assetsToSync: { id: string; internalId: string; origin: string; type: string; subtype?: string }[] = [];
    const pluggyIdToUuidMap: Record<string, string> = {};
    const accountMetadata: Record<string, { closingDay: number | null; dueDay: number | null }> = {};

    // A. CONTAS (BANK + CREDIT)
    console.log("[2/6] Buscando Contas...");
    const accountsRes = await pluggyClient.fetchAccounts(itemId);
    console.log("[2/6] Contas encontradas:", accountsRes.results.length);

    for (const account of accountsRes.results) {
      const accountType = mapAccountType(account.type, account.subtype);

      let closingDay: number | null = null;
      let dueDay: number | null = null;
      if (account.creditData?.balanceCloseDate) closingDay = new Date(account.creditData.balanceCloseDate).getUTCDate();
      if (account.creditData?.balanceDueDate) dueDay = new Date(account.creditData.balanceDueDate).getUTCDate();
      accountMetadata[account.id] = { closingDay, dueDay };

      let identifier = account.number;
      if (account.bankData?.transferNumber) identifier = account.bankData.transferNumber;

      const uniqueHash = generateAccountHash({
        userId,
        institutionId: institutionId || "UNKNOWN_INST",
        type: account.type,
        subtype: account.subtype,
        identifier: identifier,
        brand: account.creditData?.brand
      });

      const { data: upsertedAccount, error: accError } = await supabaseAdmin
        .from("accounts")
        .upsert({
          external_id: uniqueHash,
          user_id: userId,
          bank_connection_id: bankConnectionId,
          institution_id: institutionId,
          name: account.name,
          type: accountType,
          balance: account.balance,
          currency: account.currencyCode,
          account_json: account,
          credit_limit: account.creditData?.creditLimit ?? null,
          closing_date: account.creditData?.balanceCloseDate ?? null,
          due_date: account.creditData?.balanceDueDate ?? null,
        }, { onConflict: 'external_id' })
        .select('id')
        .single();

      if (upsertedAccount) {
        pluggyIdToUuidMap[account.id] = upsertedAccount.id;
        assetsToSync.push({
          id: account.id,
          internalId: upsertedAccount.id,
          origin: 'ACCOUNT',
          type: account.type,
          subtype: account.subtype
        });
      }

      if (accError) console.error("Erro conta:", account.name, accError.message);
    }

    // B. INVESTMENTS
    console.log("[3/6] Buscando Investimentos...");
    try {
      const investmentsRes = await fetchInvestments(itemId);
      console.log("[3/6] Investimentos encontrados:", investmentsRes.results?.length ?? 0);

      for (const inv of investmentsRes.results ?? []) {
        const assetIdentifier = inv.isin || inv.code || inv.number || inv.name;
        const uniqueHash = generateAccountHash({
          userId,
          institutionId: institutionId || "UNKNOWN_INST",
          type: "INVESTMENT",
          subtype: inv.subtype,
          identifier: assetIdentifier
        });

        const { error: invError } = await supabaseAdmin.from("accounts").upsert({
          external_id: uniqueHash,
          user_id: userId,
          bank_connection_id: bankConnectionId,
          institution_id: institutionId,
          name: inv.name,
          type: "investment",
          balance: inv.balance,
          currency: inv.currencyCode ?? "BRL",
          account_json: inv,
        }, { onConflict: 'external_id' });

        if (invError) console.error("Erro investimento:", inv.name, invError.message);
      }
    } catch (invErr) {
      console.warn("Investimentos não disponíveis para este item:", (invErr as Error).message);
    }

    // C. LOANS
    console.log("[4/6] Buscando Empréstimos...");
    try {
      const loansRes = await fetchLoans(itemId);
      console.log("[4/6] Empréstimos encontrados:", loansRes.results?.length ?? 0);

      for (const loan of loansRes.results ?? []) {
        const outstandingBalance = loan.payments?.contractOutstandingBalance ?? loan.contractAmount ?? 0;
        const loanIdentifier = loan.contractNumber || loan.productName;
        const uniqueHash = generateAccountHash({
          userId,
          institutionId: institutionId || "UNKNOWN_INST",
          type: "LOAN",
          subtype: "LOAN",
          identifier: loanIdentifier
        });

        const { data: savedLoan, error: loanAccError } = await supabaseAdmin
          .from("accounts")
          .upsert({
            external_id: uniqueHash,
            user_id: userId,
            bank_connection_id: bankConnectionId,
            institution_id: institutionId,
            name: loan.productName,
            type: "loan",
            balance: -Math.abs(outstandingBalance),
            currency: loan.currencyCode ?? "BRL",
            account_json: loan,
          }, { onConflict: 'external_id' })
          .select('id')
          .single();

        if (savedLoan) {
          assetsToSync.push({
            id: loan.id,
            internalId: savedLoan.id,
            origin: 'LOAN',
            type: 'LOAN'
          });
        }

        if (loanAccError) {
          console.error("Erro conta loan:", loan.productName, loanAccError.message);
          continue;
        }

        const interestRate = loan.interestRates?.[0]?.preFixedRate ?? null;
        const interestRateYearly = loan.interestRates?.[0]?.taxPeriodicity === "YEARLY" ? interestRate : null;

        const { error: detailError } = await supabaseAdmin.from("loan_details").upsert({
          installment_value: loan.installments?.balloonPayments?.[0]?.amount?.value ?? 0, // Renomeado de monthly_payment
          periodicity: loan.installmentPeriodicity ?? 'MONTHLY', // Novo campo
          contract_due_date: loan.dueDate, // Novo campo (Data Final)
          cet: loan.CET ?? null, // Novo campo
          account_id: savedLoan.id,
          interest_rate: interestRate ?? 0,
          interest_rate_yearly: interestRateYearly,
          amortization_system: loan.amortizationScheduled ?? null,
          due_day: loan.dueDate ? new Date(loan.dueDate).getUTCDate() : null,
          total_installments: loan.installments?.totalNumberOfInstallments ?? null,
          paid_installments: loan.installments?.paidInstallments ?? null,
        }, { onConflict: "account_id" });

        if (detailError) console.error("Erro loan_details:", loan.productName, detailError.message);
      }
    } catch (loanErr) {
      console.warn("Empréstimos não disponíveis para este item:", (loanErr as Error).message);
    }

    // D. TRANSACTIONS (Unificado)
    console.log("[5/6] Buscando Transações Unificadas...");
    for (const asset of assetsToSync) {
      const transactionsToUpsert: any[] = [];
      const pendingTagLinks: { external_id: string; tag_id: string }[] = [];

      if (asset.origin === 'ACCOUNT' || asset.origin === 'LOAN') {
        try {
          const { closingDay, dueDay } = accountMetadata[asset.id] ?? {};
          const isCredit = asset.type === "CREDIT" && asset.subtype === "CREDIT_CARD";

          const txRes = await pluggyClient.fetchTransactions(asset.id, { from: "2023-01-01", pageSize: 500 });

          for (const tx of txRes.results) {
            let billDateValue: string | null = null;
            if (isCredit) billDateValue = calculateBillDate(tx.date, closingDay, dueDay);

            // ═══════════════════════════════════════════════════════════════
            // EXTRAÇÃO DE DADOS DO FAVORECIDO (para regras de classificação)
            // ═══════════════════════════════════════════════════════════════
            const receiverDocument = tx.paymentData?.receiver?.documentNumber?.value || 
                                     tx.paymentData?.payer?.documentNumber?.value || 
                                     null;
            const receiverName = tx.paymentData?.receiver?.name || 
                                 tx.paymentData?.payer?.name || 
                                 tx.merchant?.name ||
                                 null;

            // ═══════════════════════════════════════════════════════════════
            // APLICAÇÃO DE REGRAS DO USUÁRIO (prioridade sobre Pluggy)
            // ═══════════════════════════════════════════════════════════════
            const ruleResult = await applyCategoryRules(
              userId,
              receiverDocument,
              receiverName,
              Math.abs(tx.amount),
              tx.description || ''
            );

            // Se regra aplicada, usa category/tag dela; senão, usa Pluggy
            const categoryId = ruleResult?.categoryId || await resolveCategory(tx.category);
            const tagIdFromRule = ruleResult?.tagId || null;

            // ═══════════════════════════════════════════════════════════════
            // GERAÇÃO DE HASH ÚNICO PARA DEDUPLICAÇÃO
            // ═══════════════════════════════════════════════════════════════
            const safe = (v: any) => (v ? String(v).trim() : "");
            const dateYMD = new Date(tx.date).toISOString().split("T")[0];
            const refNum = safe(tx.paymentData?.referenceNumber);
            const digLine = safe(tx.paymentData?.boletoMetadata?.digitableLine);

            let rawString = `${asset.internalId}_${dateYMD}_${tx.amount}_${safe(tx.description)}`;
            if (refNum || digLine) {
               rawString += `_${refNum}_${digLine}`;
            }

            const msgUint8 = new TextEncoder().encode(rawString);
            const hashBuffer = await crypto.subtle.digest("SHA-256", msgUint8);
            const hashArray = Array.from(new Uint8Array(hashBuffer));
            const transactionHash = "TX_" + hashArray.map(b => b.toString(16).padStart(2, '0')).join('').substring(0, 32);

            const transactionData: any = {
              user_id: userId,
              account_id: asset.internalId,
              category_id: categoryId,
              amount: Math.abs(tx.amount),
              type: mapTransactionType(tx.type),
              date: tx.date,
              description: tx.description,
              status: mapTransactionStatus(tx.status),
              external_id: transactionHash,
              transaction_json: tx,
              bill_date: billDateValue,
              receiver_document: receiverDocument,
              receiver_name: receiverName,
              updated_at: new Date().toISOString(),
            };

            transactionsToUpsert.push(transactionData);

            // Coleta pares external_id → tagId para vincular após upsert
            if (tagIdFromRule) {
              pendingTagLinks.push({ external_id: transactionHash, tag_id: tagIdFromRule });
            }
          }
        } catch (e) { console.warn(`Erro txs conta ${asset.id}:`, e); }
      }

      if (transactionsToUpsert.length > 0) {
        const { error: txnError } = await supabaseAdmin
          .from("transactions")
          .upsert(transactionsToUpsert, { onConflict: "external_id" });

        if (txnError) console.error(`Erro salvando txs do ativo ${asset.internalId}:`, txnError.message);
      }

      // Vincular tags das regras às transações (após upsert ter IDs)
      if (pendingTagLinks.length > 0) {
        const extIds = pendingTagLinks.map(p => p.external_id);
        const { data: savedTxs } = await supabaseAdmin
          .from("transactions")
          .select("id, external_id")
          .in("external_id", extIds);

        if (savedTxs) {
          const tagInserts = pendingTagLinks
            .map(p => {
              const tx = savedTxs.find(t => t.external_id === p.external_id);
              return tx ? { transaction_id: tx.id, tag_id: p.tag_id } : null;
            })
            .filter(Boolean);

          if (tagInserts.length > 0) {
            const { error: tagErr } = await supabaseAdmin
              .from("transaction_tags")
              .upsert(tagInserts as any[], { onConflict: "transaction_id,tag_id" });

            if (tagErr) console.error("Erro vinculando tags de regras:", tagErr.message);
            else console.log(`🏷️ ${tagInserts.length} tag(s) vinculada(s) via regras`);
          }
        }
      }
    }

    // E. ATUALIZAR STATUS DA CONEXÃO
    console.log("[6/6] Atualizando status da conexão...");
    await supabaseAdmin
      .from("bank_connections")
      .update({ last_sync_at: new Date().toISOString(), status: "active" })
      .eq("id", bankConnectionId);

    console.log("✅ Sincronização finalizada!");
  } catch (err) {
    console.error("❌ Erro fatal no sync:", err);
    throw err;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// 5. SERVIDOR HTTP
// ═══════════════════════════════════════════════════════════════════════════════

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const url = new URL(req.url);
    const payload = await req.json();
    const authHeader = req.headers.get("Authorization");

    let userId: string;
    let itemId: string;
    let bankConnectionId: string;

    const isWebhook = payload.event && !authHeader;

    if (isWebhook) {
      // FLUXO WEBHOOK
      console.log("📥 WEBHOOK:", payload.event);
      itemId = payload.itemId || payload.item?.id || payload.data?.item?.id;
      if (!itemId) return new Response(JSON.stringify({ error: "itemId não encontrado no webhook" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 400 });

      const userIdFromUrl = url.searchParams.get("userId");
      let clientUserId = payload.clientUserId || payload.item?.clientUserId || payload.data?.item?.clientUserId || userIdFromUrl;
      

      if (!clientUserId) {
        console.log(`⚠️ clientUserId não veio no payload. Buscando dono do itemId: ${itemId}...`);
        
        const { data: existingConnection } = await supabaseAdmin
          .from("bank_connections")
          .select("user_id")
          .eq("provider_id", itemId)
          .maybeSingle();

        if (existingConnection) {
          clientUserId = existingConnection.user_id;
          console.log(`✅ Usuário encontrado no banco: ${clientUserId}`);
        }
      }

      if (!clientUserId) {
        console.error("❌ clientUserId não encontrado nem no payload, nem no banco!");
        return new Response(JSON.stringify({ 
          warning: "clientUserId não identificado para este item", 
          itemId, 
          event: payload.event 
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 }); // Retorna 200 pro Webhook não ficar tentando reenviar
      }

      let institutionId: string | null = null;
      try {
        const item = await pluggyClient.fetchItem(itemId);
        if (item.connector) {
          const { data: instData } = await supabaseAdmin
            .from("institutions")
            .upsert({
              code: item.connector.id.toString(),
              name: item.connector.name,
              logo_url: item.connector.imageUrl,
              color_hex: item.connector.primaryColor ? `#${item.connector.primaryColor}` : null,
            }, { onConflict: "code" })
            .select("id")
            .single();

          if (instData) institutionId = instData.id;
        }
      } catch (err) {
        console.warn("Erro ao buscar instituição:", (err as Error).message);
      }

      if (!institutionId) {
        console.error("❌ Não foi possível obter institution_id");
        return new Response(JSON.stringify({ error: "institution_id obrigatório mas não encontrado", itemId }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
      }

      console.log("Criando conexão para User:", clientUserId);
      let conn: { id: string; user_id: string } | null = null;

      const { data: newConn, error: createError } = await supabaseAdmin
        .from("bank_connections")
        .insert({
          user_id: clientUserId,
          provider_id: itemId,
          institution_id: institutionId,
          access_token: itemId,
          status: "active",
        })
        .select("id, user_id")
        .single();

      if (newConn) {
        conn = newConn;
      } else if (createError?.code === "23505") {
        const { data: existing } = await supabaseAdmin
          .from("bank_connections")
          .select("id, user_id")
          .eq("provider_id", itemId)
          .single();
        conn = existing;
      } else {
        console.error("Erro ao criar conexão:", createError);
        throw createError;
      }

      if (!conn) {
        console.warn("Item sem conexão e sem clientUserId");
        return new Response(JSON.stringify({ warning: "Item recebido mas não foi possível criar/encontrar conexão", itemId }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
      }

      userId = conn.user_id;
      bankConnectionId = conn.id;

      console.log("🚀 Iniciando sync - User:", userId, "Item:", itemId);
      const syncPromise = syncDataForItem(itemId, userId, bankConnectionId);
      (globalThis as any).EdgeRuntime?.waitUntil?.(syncPromise);

      console.log("📤 Respondendo rápido para o Webhook...");
      return new Response(JSON.stringify({ message: "Processamento iniciado em background" }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    } else {
      // FLUXO MANUAL
      console.log("🖥️ MANUAL: Chamada do Frontend");
      if (!authHeader) throw new Error("Chamada manual requer token Authorization");

      const { data: { user }, error } = await supabaseAdmin.auth.getUser(authHeader.replace("Bearer ", ""));
      if (error || !user) throw new Error("Token inválido ou usuário não encontrado");
      userId = user.id;
      itemId = payload.itemId;

      if (!itemId) throw new Error("itemId não fornecido no body");

      console.log("Sync Manual - Item:", itemId, "User:", userId);

      let institutionId: string | null = null;
      try {
        const item = await pluggyClient.fetchItem(itemId);
        if (item.connector) {
          const { data: instData } = await supabaseAdmin
            .from("institutions")
            .upsert({
              code: item.connector.id.toString(),
              name: item.connector.name,
              logo_url: item.connector.imageUrl,
              color_hex: item.connector.primaryColor ? `#${item.connector.primaryColor}` : null,
            }, { onConflict: "code" })
            .select("id")
            .single();

          if (instData) institutionId = instData.id;
        }
      } catch (err) {
        console.warn("Erro ao buscar instituição:", (err as Error).message);
      }

      if (!institutionId) throw new Error("institution_id obrigatório mas não foi encontrado");

      const { data: conn, error: connError } = await supabaseAdmin
        .from("bank_connections")
        .insert({
          user_id: userId,
          provider_id: itemId,
          institution_id: institutionId,
          access_token: itemId,
          status: "active",
        })
        .select("id")
        .single();

      if (conn) {
        bankConnectionId = conn.id;
      } else if (connError?.code === "23505") {
        const { data: existing, error: fetchError } = await supabaseAdmin
          .from("bank_connections")
          .select("id")
          .eq("provider_id", itemId)
          .eq("user_id", userId)
          .single();

        if (fetchError || !existing) throw fetchError || new Error("Conexão não encontrada");
        bankConnectionId = existing.id;
      } else {
        throw connError;
      }

      await syncDataForItem(itemId, userId, bankConnectionId);

      return new Response(JSON.stringify({ success: true, type: "manual", itemId, userId }), { headers: { ...corsHeaders, "Content-Type": "application/json" }, status: 200 });
    }
  } catch (error) {
    console.error("❌ ERRO:", error);
    return new Response(JSON.stringify({ error: (error as Error).message, stack: (error as Error).stack }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
