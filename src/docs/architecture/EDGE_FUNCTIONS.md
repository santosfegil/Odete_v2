# Edge Functions - Documentação

> Documentação das Supabase Edge Functions do projeto Odete

---

## Visão Geral

Edge Functions são funções serverless em **Deno** que rodam no Supabase. Diferente das funções RPC do PostgreSQL (documentadas em DATABASE_SCHEMA.md), essas funções rodam fora do banco de dados e podem fazer chamadas HTTP externas.

**Localização:** `supabase/functions/`

---

## Funções Disponíveis

### 1. `create-pluggy-token`

**Arquivo:** [supabase/functions/create-pluggy-token/index.ts](../../../supabase/functions/create-pluggy-token/index.ts)

**Propósito:** Gera um Connect Token da Pluggy para uso no widget de conexão bancária no frontend.

**Endpoint:** `POST /functions/v1/create-pluggy-token`

**Autenticação:** **Requer** `Authorization: Bearer <user_jwt_token>`

**Variáveis de Ambiente Necessárias:**
- `SUPABASE_URL` - URL do projeto Supabase
- `SUPABASE_ANON_KEY` - Chave anônima do Supabase
- `PLUGGY_CLIENT_ID` - Client ID da Pluggy
- `PLUGGY_CLIENT_SECRET` - Client Secret da Pluggy

**Fluxo:**
1. Valida token JWT do usuário via Supabase Auth
2. Autentica na Pluggy API usando `pluggy-sdk`
3. Extrai `project-ref` da SUPABASE_URL para montar webhook URL
4. Gera Connect Token com:
   - `clientUserId`: ID do usuário autenticado
   - `webhookUrl`: URL do sync-bank-data com userId no query string
   - `includeSandbox: true` para ambiente de testes
5. Retorna token para o frontend

**Request:**
```bash
curl -X POST https://your-project.supabase.co/functions/v1/create-pluggy-token \
  -H "Authorization: Bearer <user_jwt_token>"
```

**Response (Sucesso):**
```json
{
  "accessToken": "connect_token_here"
}
```

**Webhook URL gerada:**
```
https://[project-ref].supabase.co/functions/v1/sync-bank-data?clientUserId=[user_id]
```

**Usado por:** `src/components/OpenFinanceButton.tsx`

---

### 2. `sync-bank-data`

**Arquivo:** [supabase/functions/sync-bank-data/index.ts](../../../supabase/functions/sync-bank-data/index.ts)

**Propósito:** Sincroniza dados bancários completos (contas, investimentos, empréstimos e transações) da Pluggy para o banco de dados local.

**Endpoint:** `POST /functions/v1/sync-bank-data`

**Autenticação:**
- **Fluxo Manual (App):** Requer `Authorization: Bearer <user_token>`
- **Fluxo Webhook (Pluggy):** Sem autenticação, identifica usuário pelo `clientUserId` no payload ou query string

**Variáveis de Ambiente Necessárias:**
- `SUPABASE_URL` - URL do projeto Supabase
- `SUPABASE_SERVICE_ROLE_KEY` - Chave de serviço do Supabase (admin)
- `PLUGGY_CLIENT_ID` - Client ID da Pluggy
- `PLUGGY_CLIENT_SECRET` - Client Secret da Pluggy

---

#### Fluxo de Sincronização

A função executa 6 etapas principais:

1. **[1/6] Inicialização** - Valida itemId e busca institution_id
2. **[2/6] Contas (BANK + CREDIT)** - Sincroniza contas bancárias e cartões
3. **[3/6] Investimentos** - Sincroniza aplicações financeiras
4. **[4/6] Empréstimos** - Sincroniza contratos de crédito
5. **[5/6] Transações** - Sincroniza histórico de transações com categorização
6. **[6/6] Status** - Atualiza `last_sync_at` e `status: active`

---

#### Sistema de Categorização

A função possui um sistema inteligente de mapeamento de categorias:

**CATEGORY_MAP (Pluggy → Sistema):**
```typescript
{
  'Eating Out': 'Alimentação',
  'Food & Drink': 'Alimentação',
  'Supermarket': 'Alimentação',
  'Transport': 'Transporte',
  'Public Transport': 'Transporte',
  'Taxis & Ride Shares': 'Transporte',
  'Housing': 'Moradia',
  'Utilities': 'Moradia',
  'Health': 'Saúde',
  'Pharmacy': 'Saúde',
  'Education': 'Educação',
  'Shopping': 'Compras',
  'Entertainment': 'Lazer',
  'Services': 'Serviços',
  'Subscriptions': 'Serviços',
  'Salary': 'Salário',
  // + versões em português
}
```

**Fallback inteligente por palavras-chave:**
- `food`, `mercado`, `restaurante` → Alimentação
- `uber`, `99`, `posto`, `gas` → Transporte
- `farmacia`, `medico` → Saúde
- `cinema`, `show` → Lazer
- Demais → Outros

---

#### Mapeamento de Tipos de Conta

```typescript
function mapAccountType(pluggyType, pluggySubtype): string {
  // CREDIT + CREDIT_CARD → credit_card
  // CREDIT + LOAN → loan
  // BANK + CHECKING_ACCOUNT → checking_account
  // BANK + SAVINGS_ACCOUNT → savings_account
  // BANK (outros) → bank
  // INVESTMENT → investment
  // LOAN_ACCOUNT → loan
  // PAYMENT_ACCOUNT → wallet
  // default → other_asset
}
```

---

#### Deduplicação por Hash SHA-256

Transações são identificadas por hash único para evitar duplicatas:

```typescript
// Formato do hash:
const rawString = `${accountId}_${dateYMD}_${amount}_${description}_${referenceNumber}_${digitableLine}`;
const hash = "TX_" + SHA256(rawString).substring(0, 32);
```

Contas e investimentos usam hash similar:
```typescript
const hash = `${userId}_${institutionId}_${type}_${subtype}_${identifier}_${brand}`;
```

---

#### Request (Fluxo Manual)
```bash
curl -X POST https://your-project.supabase.co/functions/v1/sync-bank-data \
  -H "Authorization: Bearer <user_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{"itemId": "pluggy_item_id"}'
```

#### Request (Webhook da Pluggy)
```json
{
  "event": "item/updated",
  "itemId": "pluggy_item_id",
  "clientUserId": "user_uuid"
}
```

**Response (Sucesso):**
```json
{
  "success": true,
  "type": "manual",
  "itemId": "...",
  "userId": "..."
}
```

**Response (Webhook):**
```json
{
  "message": "Processamento iniciado em background"
}
```

---

#### Tabelas Afetadas

| Tabela | Operação | Descrição |
|--------|----------|-----------|
| `institutions` | UPSERT | Cria/atualiza banco a partir do connector Pluggy |
| `bank_connections` | INSERT/UPDATE | Registra conexão com status `active` |
| `accounts` | UPSERT | Contas bancárias, cartões, investimentos, empréstimos |
| `transactions` | UPSERT | Histórico de transações com categorias |
| `loan_details` | UPSERT | Detalhes de empréstimos (taxa, parcelas, etc) |
| `categories` | SELECT | Busca IDs das categorias do sistema |

---

#### Campos Sincronizados por Tipo

**Contas (accounts):**
- `external_id`, `name`, `type`, `balance`, `currency`
- `credit_limit`, `closing_date`, `due_date` (cartões)
- `account_json` (dados brutos da Pluggy)

**Transações (transactions):**
- `amount`, `type` (income/expense), `date`, `description`
- `status` (paid/pending), `category_id`, `bill_date` (cartões)
- `transaction_json` (dados brutos)

**Empréstimos (loan_details):**
- `installment_value`, `periodicity`, `contract_due_date`
- `interest_rate`, `interest_rate_yearly`, `cet`
- `amortization_system`, `total_installments`, `paid_installments`

---

**Usado por:**
- `src/components/OpenFinanceButton.tsx` (após sucesso do widget)
- Webhook da Pluggy (configurado automaticamente via create-pluggy-token)

---

### 3. `odete-chat`

**Arquivo:** [supabase/functions/odete-chat/index.ts](../../../supabase/functions/odete-chat/index.ts)

**Propósito:** Proxy server-side para a API do Google Gemini, protegendo a chave de API e buscando prompts do banco.

**Endpoint:** `POST /functions/v1/odete-chat`

**Autenticação:** Opcional (o cliente Supabase é criado com o token do usuário se fornecido)

**Variáveis de Ambiente Necessárias:**
- `SUPABASE_URL` - URL do projeto Supabase
- `SUPABASE_ANON_KEY` - Chave anônima do Supabase
- `GEMINI_API_KEY` - Chave da API do Google Gemini

**Fluxo:**
1. Cria cliente Supabase (com token do usuário se fornecido)
2. Busca prompt na tabela `ai_prompts` pelo slug:
   - `odete_mimar` (modo carinhoso)
   - `odete_julgar` (modo crítico)
3. Inicializa chat com Google Gemini (`gemini-2.5-flash`)
4. Envia mensagem e retorna resposta

**Request:**
```bash
curl -X POST https://your-project.supabase.co/functions/v1/odete-chat \
  -H "Authorization: Bearer <user_jwt_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "message": "Olá, como estou de dinheiro?",
    "history": [],
    "mode": "mimar"
  }'
```

**Parâmetros:**
| Campo | Tipo | Descrição |
|-------|------|-----------|
| message | string | Mensagem do usuário |
| history | array | Histórico de mensagens anteriores (formato Gemini) |
| mode | string | `"mimar"` ou `"julgar"` - define personalidade da IA |

**Response (Sucesso):**
```json
{
  "text": "Resposta da Odete aqui..."
}
```

**Tabelas Lidas:**
- `ai_prompts` - Busca `system_instruction` pelo `slug` e `is_active`

**Modelo de IA:** `gemini-2.5-flash` (temperatura: 0.7)

**Usado por:** `src/services/geminiService.ts`

---

## Configuração de Variáveis de Ambiente

### Via CLI
```bash
npx supabase secrets set PLUGGY_CLIENT_ID=xxx
npx supabase secrets set PLUGGY_CLIENT_SECRET=xxx
npx supabase secrets set GEMINI_API_KEY=xxx
npx supabase secrets set SUPABASE_SERVICE_ROLE_KEY=xxx
```

### Via Dashboard
1. Supabase Dashboard → Settings → Edge Functions
2. Adicionar cada variável

---

## Deploy

### Deploy Individual
```bash
npx supabase functions deploy sync-bank-data
npx supabase functions deploy create-pluggy-token
npx supabase functions deploy odete-chat
```

### Deploy Todas
```bash
npx supabase functions deploy
```

### Pré-requisitos
- Docker rodando localmente
- Projeto linkado: `npx supabase link --project-ref <project_id>`

---

## Logs e Debug

### Via CLI
```bash
npx supabase functions logs sync-bank-data
npx supabase functions logs create-pluggy-token
npx supabase functions logs odete-chat
```

### Via Dashboard
Supabase Dashboard → Edge Functions → Selecionar função → Logs

---

## Resumo de Endpoints

| Função | Método | Endpoint | Autenticação |
|--------|--------|----------|--------------|
| create-pluggy-token | POST | `/functions/v1/create-pluggy-token` | **Sim** (JWT) |
| sync-bank-data | POST | `/functions/v1/sync-bank-data` | Sim (Manual) / Não (Webhook) |
| odete-chat | POST | `/functions/v1/odete-chat` | Opcional |

---

## Dependências Externas

| Função | Dependências | APIs Externas |
|--------|--------------|---------------|
| create-pluggy-token | `pluggy-sdk`, `@supabase/supabase-js` | Pluggy API |
| sync-bank-data | `pluggy-sdk`, `@supabase/supabase-js` | Pluggy API (`/accounts`, `/investments`, `/loans`, `/transactions`) |
| odete-chat | `@google/genai`, `@supabase/supabase-js` | Google Gemini API |

---

**Última atualização:** Janeiro 2026
