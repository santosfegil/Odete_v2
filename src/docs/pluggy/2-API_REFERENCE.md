# Pluggy API - Referência Completa de Endpoints

> Referência rápida de todos os endpoints principais da API Pluggy

---

## 🔐 Autenticação

### Gerar API Key

**POST** `/auth`

Troca CLIENT_ID e CLIENT_SECRET por um API Key.

```bash
curl -X POST https://api.pluggy.ai/auth \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "YOUR_CLIENT_ID",
    "clientSecret": "YOUR_CLIENT_SECRET"
  }'
```

**Resposta:**

```json
{
  "accessToken": "your_api_key_here",
  "expiresIn": 7200
}
```

---

### Criar Connect Token

**POST** `/connect_token`

Gera um token limitado para uso no frontend (expires em 30 minutos).

```bash
curl -X POST https://api.pluggy.ai/connect_token \
  -H "X-API-KEY: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'
```

**Resposta:**

```json
{
  "requestId": "request_id",
  "result": {
    "connectToken": "connect_token_here"
  }
}
```

---

## 📦 Items (Conexões)

### Criar Item

**POST** `/items`

Cria uma nova conexão com uma instituição.

```bash
curl -X POST https://api.pluggy.ai/items \
  -H "X-API-KEY: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "connectorId": "1",
    "credentials": {
      "user": "seu_usuario",
      "password": "sua_senha"
    },
    "clientMutationId": "optional_id"
  }'
```

**Resposta:**

```json
{
  "requestId": "request_id",
  "result": {
    "item": {
      "id": "item_id",
      "connectorId": "1",
      "status": "CREATED",
      "error": null,
      "createdAt": "2025-01-23T10:00:00Z"
    }
  }
}
```

---

### Recuperar Item

**GET** `/items/{id}`

Obtém detalhes e status de um Item.

```bash
curl -X GET https://api.pluggy.ai/items/item_id \
  -H "X-API-KEY: YOUR_API_KEY"
```

**Resposta:**

```json
{
  "requestId": "request_id",
  "result": {
    "item": {
      "id": "item_id",
      "status": "SUCCESS",
      "connectorId": "1",
      "createdAt": "2025-01-23T10:00:00Z",
      "updatedAt": "2025-01-23T10:05:00Z",
      "error": null,
      "executionStatus": "IDLE"
    }
  }
}
```

---

### Atualizar Item (Trigger Sincronização)

**PATCH** `/items/{id}`

Dispara uma nova sincronização do Item, opcionalmente com novas credenciais.

```bash
# Sem credenciais (usa as armazenadas)
curl -X PATCH https://api.pluggy.ai/items/item_id \
  -H "X-API-KEY: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{}'

# Com credenciais atualizadas
curl -X PATCH https://api.pluggy.ai/items/item_id \
  -H "X-API-KEY: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "credentials": {
      "user": "novo_usuario",
      "password": "nova_senha"
    }
  }'

# Com MFA Token
curl -X PATCH https://api.pluggy.ai/items/item_id \
  -H "X-API-KEY: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "credentials": {
      "token": "123456"
    }
  }'
```

---

### Deletar Item

**DELETE** `/items/{id}`

Remove um Item e revoga o consentimento do usuário.

```bash
curl -X DELETE https://api.pluggy.ai/items/item_id \
  -H "X-API-KEY: YOUR_API_KEY"
```

**Resposta:**

```json
{
  "requestId": "request_id",
  "result": true
}
```

---

## 🔌 Connectors

### Listar Todos os Connectors

**GET** `/connectors`

Lista todos os connectors disponíveis (instituições).

```bash
curl -X GET https://api.pluggy.ai/connectors \
  -H "X-API-KEY: YOUR_API_KEY"

# Apenas sandbox
curl -X GET "https://api.pluggy.ai/connectors?sandbox=true" \
  -H "X-API-KEY: YOUR_API_KEY"
```

**Resposta:**

```json
{
  "requestId": "request_id",
  "result": {
    "connectors": [
      {
        "id": "1",
        "name": "Pluggy Bank",
        "type": "SANDBOX",
        "credentialFields": [
          {
            "name": "user",
            "label": "Usuário",
            "type": "text",
            "required": true
          }
        ]
      }
    ],
    "total": 150
  }
}
```

---

### Obter Detalhes do Connector

**GET** `/connectors/{id}`

Detalhes de um connector específico incluindo campos de credencial.

```bash
curl -X GET https://api.pluggy.ai/connectors/1 \
  -H "X-API-KEY: YOUR_API_KEY"
```

---

## 💰 Contas (Accounts)

### Listar Contas

**GET** `/accounts`

Lista todas as contas de um Item.

```bash
curl -X GET "https://api.pluggy.ai/accounts?itemId=item_id" \
  -H "X-API-KEY: YOUR_API_KEY"
```

**Resposta:**

```json
{
  "requestId": "request_id",
  "result": {
    "accounts": [
      {
        "id": "account_id",
        "itemId": "item_id",
        "name": "Conta Corrente",
        "number": "123456",
        "bankCode": "001",
        "type": "CHECKING",
        "subtype": "NORMAL",
        "balance": 1500.5,
        "limit": 5000.0,
        "currency": "BRL",
        "status": "OPEN"
      }
    ],
    "total": 1
  }
}
```

---

### Obter Conta Específica

**GET** `/accounts/{id}`

Detalhes de uma conta específica.

```bash
curl -X GET https://api.pluggy.ai/accounts/account_id \
  -H "X-API-KEY: YOUR_API_KEY"
```

---

## 📊 Transações (Transactions)

### Listar Transações

**GET** `/transactions`

Lista transações com filtros opcionais.

```bash
curl -X GET "https://api.pluggy.ai/transactions?itemId=item_id&accountId=account_id&from=2025-01-01&to=2025-01-31" \
  -H "X-API-KEY: YOUR_API_KEY"
```

**Parâmetros:**

- `itemId` (required): ID do Item
- `accountId` (optional): Filtrar por conta específica
- `from` (optional): Data inicial (YYYY-MM-DD)
- `to` (optional): Data final (YYYY-MM-DD)
- `limit` (optional): Limite de resultados (default 100)
- `offset` (optional): Paginação

**Resposta:**

```json
{
  "requestId": "request_id",
  "result": {
    "transactions": [
      {
        "id": "transaction_id",
        "accountId": "account_id",
        "date": "2025-01-15",
        "description": "SUPERMERCADO XYZ",
        "amount": -150.0,
        "balance": 1350.5,
        "type": "DEBIT",
        "status": "POSTED",
        "category": "Groceries"
      }
    ],
    "total": 45
  }
}
```

---

### Obter Transação Específica

**GET** `/transactions/{id}`

Detalhes de uma transação.

```bash
curl -X GET https://api.pluggy.ai/transactions/transaction_id \
  -H "X-API-KEY: YOUR_API_KEY"
```

---

## 💳 Cartões de Crédito (Credit Cards)

### Listar Cartões

**GET** `/credit-cards`

Lista todos os cartões de um Item.

```bash
curl -X GET "https://api.pluggy.ai/credit-cards?itemId=item_id" \
  -H "X-API-KEY: YOUR_API_KEY"
```

**Resposta:**

```json
{
  "requestId": "request_id",
  "result": {
    "creditCards": [
      {
        "id": "card_id",
        "itemId": "item_id",
        "name": "Meu Cartão",
        "lastDigits": "1234",
        "balance": 250.0,
        "limit": 10000.0,
        "dueDate": "2025-02-10",
        "issuer": "MASTERCARD"
      }
    ]
  }
}
```

---

## 📈 Investimentos (Investments)

### Listar Investimentos

**GET** `/investments`

Lista todos os investimentos.

```bash
curl -X GET "https://api.pluggy.ai/investments?itemId=item_id" \
  -H "X-API-KEY: YOUR_API_KEY"
```

**Resposta:**

```json
{
  "requestId": "request_id",
  "result": {
    "investments": [
      {
        "id": "investment_id",
        "itemId": "item_id",
        "name": "Fundo de Ações",
        "type": "MUTUAL_FUND",
        "balance": 5000.0,
        "quantity": 100,
        "unitPrice": 50.0
      }
    ]
  }
}
```

---

### Listar Transações de Investimentos

**GET** `/investment-transactions`

Movimentações de investimentos.

```bash
curl -X GET "https://api.pluggy.ai/investment-transactions?itemId=item_id" \
  -H "X-API-KEY: YOUR_API_KEY"
```

---

## 🏦 Empréstimos (Loans)

### Listar Empréstimos

**GET** `/loans`

Lista todos os empréstimos.

```bash
curl -X GET "https://api.pluggy.ai/loans?itemId=item_id" \
  -H "X-API-KEY: YOUR_API_KEY"
```

**Resposta:**

```json
{
  "requestId": "request_id",
  "result": {
    "loans": [
      {
        "id": "loan_id",
        "itemId": "item_id",
        "name": "Empréstimo Pessoal",
        "balance": 5000.0,
        "rate": 2.5,
        "nextDueDate": "2025-02-10",
        "totalAmount": 10000.0
      }
    ]
  }
}
```

---

## 👤 Identidade (Identity)

### Obter Identidade

**GET** `/identity/{id}`

Dados pessoais do usuário.

```bash
curl -X GET https://api.pluggy.ai/identity/identity_id \
  -H "X-API-KEY: YOUR_API_KEY"
```

**Resposta:**

```json
{
  "requestId": "request_id",
  "result": {
    "identity": {
      "id": "identity_id",
      "fullName": "João da Silva",
      "document": "123.456.789-00",
      "documentType": "CPF",
      "birthDate": "1990-05-15",
      "email": "joao@email.com",
      "phone": "11999999999",
      "jobTitle": "Engenheiro"
    }
  }
}
```

---

### Obter Identidade por Item

**GET** `/identity?itemId={itemId}`

Identidade do usuário associada a um Item.

```bash
curl -X GET "https://api.pluggy.ai/identity?itemId=item_id" \
  -H "X-API-KEY: YOUR_API_KEY"
```

---

## 🪝 Webhooks

### Registrar Webhook

**POST** `/webhooks`

Registra um novo endpoint para receber eventos.

```bash
curl -X POST https://api.pluggy.ai/webhooks \
  -H "X-API-KEY: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "https://seu-dominio.com/webhook",
    "event": "item.sync.completed"
  }'
```

**Resposta:**

```json
{
  "requestId": "request_id",
  "result": {
    "webhook": {
      "id": "webhook_id",
      "url": "https://seu-dominio.com/webhook",
      "event": "item.sync.completed",
      "createdAt": "2025-01-23T10:00:00Z"
    }
  }
}
```

---

### Listar Webhooks

**GET** `/webhooks`

Lista todos os webhooks registrados.

```bash
curl -X GET https://api.pluggy.ai/webhooks \
  -H "X-API-KEY: YOUR_API_KEY"
```

---

### Deletar Webhook

**DELETE** `/webhooks/{id}`

Remove um webhook.

```bash
curl -X DELETE https://api.pluggy.ai/webhooks/webhook_id \
  -H "X-API-KEY: YOUR_API_KEY"
```

---

## 💸 Pagamentos (Payments)

### Criar Payment Intent

**POST** `/payment-intents`

Cria uma intenção de pagamento.

```bash
curl -X POST https://api.pluggy.ai/payment-intents \
  -H "X-API-KEY: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "amount": 100.00,
    "type": "PIX",
    "description": "Pagamento de teste"
  }'
```

---

### Obter Payment Intent

**GET** `/payment-intents/{id}`

Detalhes de uma intenção de pagamento.

```bash
curl -X GET https://api.pluggy.ai/payment-intents/payment_intent_id \
  -H "X-API-KEY: YOUR_API_KEY"
```

---

## 🔄 Smart Transfers

### Criar Preauthorização

**POST** `/smart-transfers/preauthorizations`

Autoriza débitos recorrentes.

```bash
curl -X POST https://api.pluggy.ai/smart-transfers/preauthorizations \
  -H "X-API-KEY: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "debtorAccountId": "account_id",
    "recipientIds": ["recipient_1", "recipient_2"],
    "expiresAt": "2025-12-31T23:59:59Z"
  }'
```

---

### Criar Pagamento (Smart Transfer)

**POST** `/smart-transfers/payments`

Envia um pagamento usando preauthorização.

```bash
curl -X POST https://api.pluggy.ai/smart-transfers/payments \
  -H "X-API-KEY: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "preauthorizationId": "preauth_id",
    "recipientId": "recipient_id",
    "amount": 100.00,
    "description": "Meu pagamento automático"
  }'
```

---

## 🔍 Enrich API

### Enriquecer Transação

**POST** `/enrich`

Categoriza e enriquece dados de transação própria.

```bash
curl -X POST https://api.pluggy.ai/enrich \
  -H "X-API-KEY: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "description": "SUPERMERCADO ABC",
    "amount": 150.00,
    "date": "2025-01-15"
  }'
```

**Resposta:**

```json
{
  "requestId": "request_id",
  "result": {
    "category": "Groceries",
    "merchantName": "Supermercado ABC",
    "confidence": 0.95
  }
}
```

---

## 📋 Categorias de Transações

### Listar Categorias

**GET** `/categories`

Árvore completa de categorias disponíveis.

```bash
curl -X GET https://api.pluggy.ai/categories \
  -H "X-API-KEY: YOUR_API_KEY"
```

---

## Headers e Autenticação

### Headers Obrigatórios

```
X-API-KEY: seu_api_key_aqui
Content-Type: application/json (para POST/PATCH)
```

### Headers Opcionais

```
X-Request-ID: seu-id-unico (para rastreamento)
```

---

## Tratamento de Erros

### Estrutura de Erro

```json
{
  "requestId": "request_id",
  "errors": [
    {
      "code": "INVALID_CREDENTIALS",
      "message": "As credenciais fornecidas são inválidas",
      "details": {
        "field": "password"
      }
    }
  ]
}
```

### Códigos de Erro Comuns

| Código              | Significado                    | Status HTTP |
| ------------------- | ------------------------------ | ----------- |
| INVALID_CREDENTIALS | Credenciais inválidas          | 400         |
| UNAUTHORIZED        | API Key inválida/expirada      | 401         |
| FORBIDDEN           | Sem permissão para recurso     | 403         |
| NOT_FOUND           | Recurso não encontrado         | 404         |
| RATE_LIMIT_EXCEEDED | Limite de requisições atingido | 429         |
| INTERNAL_ERROR      | Erro interno do servidor       | 500         |

---

## Paginação

A maioria dos endpoints que retornam listas suporta paginação:

```bash
curl -X GET "https://api.pluggy.ai/transactions?itemId=item_id&limit=50&offset=0" \
  -H "X-API-KEY: YOUR_API_KEY"
```

**Parâmetros:**

- `limit`: Número de items por página (default 100, máx 1000)
- `offset`: Número de items para pular

---

## Rate Limiting

Pluggy implementa rate limiting. Quando atingido:

- Status: `429 Too Many Requests`
- Headers retornados:
  - `X-RateLimit-Limit`: Limite de requisições
  - `X-RateLimit-Remaining`: Requisições restantes
  - `X-RateLimit-Reset`: Unix timestamp de reset

---

## Exemplos de Fluxos Completos

### 1. Criar e Sincronizar um Item

```bash
# 1. Gerar API Key
API_KEY=$(curl -X POST https://api.pluggy.ai/auth \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "YOUR_CLIENT_ID",
    "clientSecret": "YOUR_CLIENT_SECRET"
  }' | jq -r '.result.accessToken')

# 2. Criar Item
ITEM_ID=$(curl -X POST https://api.pluggy.ai/items \
  -H "X-API-KEY: $API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "connectorId": "1",
    "credentials": {"user": "testuser", "password": "testpass"}
  }' | jq -r '.result.item.id')

# 3. Aguardar sincronização (polling)
while true; do
  STATUS=$(curl -X GET https://api.pluggy.ai/items/$ITEM_ID \
    -H "X-API-KEY: $API_KEY" | jq -r '.result.item.status')

  if [ "$STATUS" = "SUCCESS" ]; then
    echo "Item sincronizado com sucesso!"
    break
  elif [ "$STATUS" = "ERROR" ]; then
    echo "Erro na sincronização"
    break
  fi

  sleep 2
done

# 4. Buscar transações
curl -X GET "https://api.pluggy.ai/transactions?itemId=$ITEM_ID" \
  -H "X-API-KEY: $API_KEY"
```

---

## Recursos Úteis

- **Dashboard**: https://dashboard.pluggy.ai/
- **Status Page**: https://status.pluggy.ai/
- **GitHub**: https://github.com/pluggyai
- **Email**: support@pluggy.ai

---

**Última atualização:** Janeiro 2025
