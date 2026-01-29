# Pluggy - Guia de Integração Rápida

> Comece a integração com Pluggy em menos de 10 minutos!

---

## ⚡ Início Rápido (5 Minutos)

### Passo 1: Signup e Obter Credenciais

1. Acesse https://dashboard.pluggy.ai/
2. Crie uma conta (email + senha)
3. Crie uma aplicação
4. Copie o `CLIENT_ID` e `CLIENT_SECRET`

### Passo 2: Testar com cURL (2 minutos)

#### Gerar API Key

```bash
curl -X POST https://api.pluggy.ai/auth \
  -H "Content-Type: application/json" \
  -d '{
    "clientId": "seu_client_id",
    "clientSecret": "seu_client_secret"
  }'
```

Copie o `accessToken` da resposta.

#### Listar Connectors (instituições)

```bash
curl -X GET "https://api.pluggy.ai/connectors?sandbox=true" \
  -H "X-API-KEY: seu_access_token"
```

**Pronto!** Você conseguiu se autenticar! ✅

### Passo 3: Criar um Item (Conexão de Teste)

```bash
curl -X POST https://api.pluggy.ai/items \
  -H "X-API-KEY: seu_access_token" \
  -H "Content-Type: application/json" \
  -d '{
    "connectorId": "1",
    "credentials": {
      "user": "testuser",
      "password": "testpass"
    }
  }'
```

Guarde o ID do item na resposta!

### Passo 4: Verificar Status

```bash
curl -X GET https://api.pluggy.ai/items/seu_item_id \
  -H "X-API-KEY: seu_access_token"
```

Aguarde até que o status seja `SUCCESS`.

### Passo 5: Buscar Dados

```bash
curl -X GET "https://api.pluggy.ai/transactions?itemId=seu_item_id" \
  -H "X-API-KEY: seu_access_token"
```

**Pronto!** Você conseguiu conectar uma conta e puxar transações! 🎉

---

## 🛠️ Integração no Backend (Node.js)

### Instalação

```bash
npm install pluggy-sdk
```

### Exemplo Básico

```javascript
import { PluggyClient } from "pluggy-sdk";

// 1. Criar cliente
const client = new PluggyClient({
  clientId: process.env.PLUGGY_CLIENT_ID,
  clientSecret: process.env.PLUGGY_CLIENT_SECRET,
});

// 2. Criar Item
const item = await client.createItem({
  connectorId: "1",
  credentials: {
    user: "testuser",
    password: "testpass",
  },
});

console.log("Item criado:", item.id);

// 3. Aguardar sincronização
let itemData = await client.getItem(item.id);
while (itemData.status === "RUNNING" || itemData.status === "CREATED") {
  await new Promise((r) => setTimeout(r, 1000));
  itemData = await client.getItem(item.id);
}

if (itemData.status === "SUCCESS") {
  // 4. Buscar transações
  const transactions = await client.fetchTransactions(item.id);
  console.log("Transações:", transactions);

  // 5. Buscar contas
  const accounts = await client.fetchAccounts(item.id);
  console.log("Contas:", accounts);
}
```

---

## 💻 Integração no Frontend (React)

### Instalação

```bash
npm install @pluggyai/plug-ui
```

### Exemplo Básico

```jsx
import React, { useState } from "react";
import { PluggyConnect } from "@pluggyai/plug-ui";

export default function MyComponent() {
  const [itemId, setItemId] = useState(null);

  const handleSuccess = ({ item }) => {
    console.log("Item conectado com sucesso:", item.id);
    setItemId(item.id);
    // Agora envie para seu backend fazer o processamento
  };

  const handleError = ({ message, data }) => {
    console.error("Erro ao conectar:", message);
  };

  return (
    <div>
      <h1>Conecte sua Conta Bancária</h1>
      {!itemId ? (
        <PluggyConnect
          connectToken={seu_connect_token}
          onSuccess={handleSuccess}
          onError={handleError}
          onOpen={() => console.log("Widget aberto")}
          onClose={() => console.log("Widget fechado")}
        />
      ) : (
        <p>✅ Conta conectada! Item ID: {itemId}</p>
      )}
    </div>
  );
}
```

---

## 🎯 Padrão Recomendado: Backend + Frontend + Webhooks

### Arquitetura

```
┌─────────────────┐
│   Frontend      │
│   (React, Vue)  │
└────────┬────────┘
         │
    1. Gera Connect Token
         │
         ▼
┌─────────────────┐         ┌──────────────────┐
│  Backend (Node) │◄────────┤  Pluggy API      │
│  - Autentica    │ 2. Item │  - Conecta conta │
│  - Processa     │ criado  │  - Pula dados    │
│  - Webhooks     │         │  - Sincroniza    │
└─────────────────┘         └──────────────────┘
         │
         │ 3. Webhook de sucesso
         │
         ▼
    Processar dados
    (Salvar BD, etc)
```

### Código Exemplo

#### Backend (Express.js)

```javascript
import express from "express";
import { PluggyClient } from "pluggy-sdk";

const app = express();
const client = new PluggyClient({
  clientId: process.env.PLUGGY_CLIENT_ID,
  clientSecret: process.env.PLUGGY_CLIENT_SECRET,
});

// 1. Endpoint para gerar Connect Token
app.post("/api/connect-token", async (req, res) => {
  try {
    const connectToken = await client.createConnectToken();
    res.json({ connectToken });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 2. Endpoint para processar dados após conexão
app.post("/api/process-item", async (req, res) => {
  try {
    const { itemId } = req.body;

    // Buscar dados do item
    const item = await client.getItem(itemId);
    const transactions = await client.fetchTransactions(itemId);
    const accounts = await client.fetchAccounts(itemId);

    // Salvar no banco de dados
    await saveUserData({
      itemId,
      item,
      transactions,
      accounts,
    });

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// 3. Webhook para receber notificações
app.post("/api/webhooks/pluggy", async (req, res) => {
  try {
    const { event, data } = req.body;

    if (event === "item.sync.completed") {
      const { itemId } = data;

      // Processar item completamente sincronizado
      const transactions = await client.fetchTransactions(itemId);
      await saveTransactions(itemId, transactions);

      console.log(`Item ${itemId} sincronizado com sucesso!`);
    }

    res.json({ ok: true });
  } catch (error) {
    console.error("Erro no webhook:", error);
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => {
  console.log("Servidor rodando na porta 3000");
});
```

#### Frontend (React)

```jsx
import React, { useState } from "react";
import { PluggyConnect } from "@pluggyai/plug-ui";

export default function BankingIntegration() {
  const [connectToken, setConnectToken] = useState(null);
  const [connected, setConnected] = useState(false);

  // Gerar token ao montar componente
  React.useEffect(() => {
    fetch("/api/connect-token", { method: "POST" })
      .then((res) => res.json())
      .then((data) => setConnectToken(data.connectToken));
  }, []);

  const handleSuccess = async ({ item }) => {
    // Enviar item ID para backend processar
    await fetch("/api/process-item", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ itemId: item.id }),
    });

    setConnected(true);
  };

  if (!connectToken) return <div>Carregando...</div>;

  return (
    <div style={{ maxWidth: "500px", margin: "0 auto" }}>
      <h1>Conecte Sua Conta Bancária</h1>

      {connected ? (
        <div
          style={{
            padding: "20px",
            backgroundColor: "#e8f5e9",
            borderRadius: "8px",
            textAlign: "center",
          }}
        >
          <h2>✅ Conta Conectada!</h2>
          <p>Seus dados estão sendo processados...</p>
        </div>
      ) : (
        <PluggyConnect
          connectToken={connectToken}
          onSuccess={handleSuccess}
          onError={({ message }) => console.error(message)}
        />
      )}
    </div>
  );
}
```

---

## 🔐 Configuração de Webhooks

### 1. Criar Endpoint

Seu backend precisa ter um endpoint POST que receba webhooks:

```javascript
app.post("/api/webhooks/pluggy", (req, res) => {
  const { event, data } = req.body;
  console.log("Webhook recebido:", event);

  if (event === "item.sync.completed") {
    // Processar item sincronizado
  } else if (event === "item.sync.failed") {
    // Lidar com erro
  }

  res.json({ ok: true });
});
```

### 2. Registrar no Dashboard

1. Vá para Dashboard → Webhooks
2. Adicione URL: `https://seu-dominio.com/api/webhooks/pluggy`
3. Selecione eventos a monitorar
4. Salve

### 3. Validar Webhook (Segurança)

```javascript
import crypto from "crypto";

function validateWebhook(req) {
  const signature = req.headers["x-pluggy-signature"];
  const secret = process.env.PLUGGY_WEBHOOK_SECRET;

  const body = JSON.stringify(req.body);
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  return signature === expectedSignature;
}
```

---

## 📱 Tipos de Ambiente

### Sandbox (Testes)

```javascript
// Connector ID 1 é sempre Pluggy Bank (sandbox)
const item = await client.createItem({
  connectorId: "1", // Sandbox
  credentials: {
    user: "testuser",
    password: "testpass",
  },
});
```

**Credenciais padrão:**

- Usuário: `testuser`
- Senha: `testpass`
- MFA: `123456`

### Produção (Real)

```javascript
// Use IDs reais de bancos
const item = await client.createItem({
  connectorId: "123", // Banco Real (ex: Itaú)
  credentials: {
    user: "cpf_usuario",
    password: "senha_real",
  },
});
```

---

## ⚠️ Tratamento de Erros

### Erros Comuns e Soluções

#### 1. "Invalid Credentials"

```javascript
try {
  const item = await client.createItem({
    connectorId: "1",
    credentials: {
      user: "testuser",
      password: "testpass",
    },
  });
} catch (error) {
  if (error.code === "INVALID_CREDENTIALS") {
    // Credenciais incorretas - peça ao usuário tentar novamente
    console.log("Credenciais inválidas. Tente novamente.");
  }
}
```

#### 2. "API Key Expired"

```javascript
// API Keys expiram em 2 horas
// Solução: Gere uma nova quando necessário

async function getValidApiKey() {
  const response = await fetch("https://api.pluggy.ai/auth", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      clientId: process.env.PLUGGY_CLIENT_ID,
      clientSecret: process.env.PLUGGY_CLIENT_SECRET,
    }),
  });

  const { result } = await response.json();
  return result.accessToken;
}
```

#### 3. "Rate Limit Exceeded"

```javascript
// Implementar retry com backoff exponencial
async function requestWithRetry(fn, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (error.status === 429) {
        // Rate limit
        const delay = Math.pow(2, i) * 1000; // 1s, 2s, 4s...
        await new Promise((r) => setTimeout(r, delay));
      } else {
        throw error;
      }
    }
  }
}
```

---

## 🧪 Checklist de Integração

- [ ] Signup no Dashboard (https://dashboard.pluggy.ai/)
- [ ] Copiar CLIENT_ID e CLIENT_SECRET
- [ ] Testar autenticação com cURL
- [ ] Instalar SDK apropriado (Node/Python/etc)
- [ ] Implementar geração de API Key no backend
- [ ] Implementar geração de Connect Token no backend
- [ ] Integrar PluggyConnect Widget no frontend
- [ ] Implementar callback de sucesso
- [ ] Criar endpoint para processar dados
- [ ] Configurar webhooks
- [ ] Implementar validação de webhooks
- [ ] Testar todo fluxo em sandbox
- [ ] Implementar tratamento de erros
- [ ] Implementar logging e monitoramento
- [ ] Ir para produção (trocar sandbox por connectors reais)

---

## 📚 Recursos Úteis

| Recurso               | Link                         |
| --------------------- | ---------------------------- |
| Dashboard             | https://dashboard.pluggy.ai/ |
| Status                | https://status.pluggy.ai/    |
| GitHub                | https://github.com/pluggyai  |
| Documentação Completa | https://docs.pluggy.ai/      |
| Postman Collection    | [Link no Dashboard]          |
| Email Support         | support@pluggy.ai            |

---

## 🆘 Troubleshooting

### Widget não abre

- Verifique se o Connect Token é válido (30 min de expiração)
- Confirme que está usando o token correto no widget

### Item fica em estado RUNNING

- Isso é normal, aguarde
- Configure webhooks para saber quando termina

### Credenciais não funcionam no Sandbox

- Use `testuser` / `testpass`
- Sem esses valores exatos, o mock connector falha

### Não recebo webhooks

- Confirme que a URL está acessível publicamente (não localhost!)
- Valide a assinatura do webhook
- Veja os logs no Dashboard

### API retorna 401

- API Key expirou (2h) - gere uma nova
- CLIENT_ID ou CLIENT_SECRET inválidos

---

## 🎓 Próximos Passos

Após integração básica funcionando:

1. **Enriquecer Dados**: Use Enrich API para categorizar transações
2. **Insights**: Implemente Connection Insights para análises
3. **Pagamentos**: Integre Pluggy Payments para processar PIX
4. **Smart Transfers**: Implemente débitos recorrentes
5. **Monitoramento**: Configure alertas em tempo real

---

**Última atualização:** Janeiro 2025  
**Dúvidas?** Entre em contato: support@pluggy.ai
