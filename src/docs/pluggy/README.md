# 📚 Pluggy API - Documentação Consolidada

## Bem-vindo!

Esta é uma **documentação consolidada completa** da API Pluggy extraída de https://docs.pluggy.ai e compilada em Janeiro de 2025.

A documentação inclui **75+ páginas** da documentação oficial, traduzidas, resumidas e reorganizadas para melhor compreensão.

---

## 📂 Arquivos Inclusos

### 1. **PLUGGY_API_DOCUMENTACAO_COMPLETA.md** (19 KB)

Documentação completa com todos os conceitos, produtos e features.

**Contém:**

- ✅ Welcome & Get Started
- ✅ Glossário (Product, Connector, Item, API Key, Connect Token)
- ✅ Pluggy Connect Widget (Introdução, Autenticação, Ambientes)
- ✅ Connections (Item, Ciclo de Vida, Erros, Consents)
- ✅ Products (Account, Credit Card, Transaction, Investment, Loan, Identity)
- ✅ Intelligence APIs (Insights, Enrichment, Recurring Payments)
- ✅ Payments (PIX, Boleto, Scheduled, Automático)
- ✅ Smart Transfers
- ✅ Integration Guide
- ✅ Boleto Management

**Ideal para:** Entender completamente a plataforma e todos os conceitos

---

### 2. **PLUGGY_API_REFERENCE_ENDPOINTS.md** (15 KB)

Referência rápida de todos os endpoints com exemplos em cURL.

**Contém:**

- 🔐 Autenticação (Auth, Connect Token)
- 📦 Items CRUD (Create, Get, Update, Delete)
- 🔌 Connectors (List, Details)
- 💰 Accounts (List, Get)
- 📊 Transactions (List, Get)
- 💳 Credit Cards
- 📈 Investments
- 🏦 Loans
- 👤 Identity
- 🪝 Webhooks
- 💸 Payments
- 🔄 Smart Transfers
- 🔍 Enrich API

**Cada endpoint inclui:**

- Verbo HTTP e path
- Descrição
- Exemplo cURL completo
- Resposta JSON esperada
- Parâmetros explicados

**Ideal para:** Implementadores e devs que precisam de referência rápida

---

### 3. **PLUGGY_GUIA_INTEGRACAO_RAPIDA.md** (13 KB)

Guia passo-a-passo para começar em minutos.

**Contém:**

- ⚡ Quick Start (5 minutos com cURL)
- 🛠️ Backend Integration (Node.js com SDK)
- 💻 Frontend Integration (React com widget)
- 🎯 Padrão Recomendado (Backend + Frontend + Webhooks)
- 🔐 Configuração de Webhooks
- 📱 Tipos de Ambiente (Sandbox vs Produção)
- ⚠️ Tratamento de Erros
- 🧪 Checklist de Integração
- 🆘 Troubleshooting
- 🎓 Próximos Passos

**Ideal para:** Primeiros passos e implementação rápida

---

## 🚀 Como Usar Esta Documentação

### Cenário 1: Quero entender Pluggy completamente

→ Leia: **PLUGGY_API_DOCUMENTACAO_COMPLETA.md**

### Cenário 2: Preciso implementar algo específico agora

→ Use: **PLUGGY_API_REFERENCE_ENDPOINTS.md**

### Cenário 3: Vou começar a integração agora

→ Siga: **PLUGGY_GUIA_INTEGRACAO_RAPIDA.md**

### Cenário 4: Preciso resolver um problema

→ Consulte a seção de **Troubleshooting** no guia

---

## 📋 Conceitos-Chave (Resumo)

### Product

Dados padronizados de uma instituição financeira:

- Accounts (Contas)
- Credit Cards (Cartões)
- Transactions (Transações)
- Investments (Investimentos)
- Loans (Empréstimos)
- Identity (Identidade)

### Connector

Integração com uma instituição específica:

- Direct (Conexão direta)
- Open Finance (Regulado)
- Sandbox (Para testes)

### Item

Conexão entre usuário e instituição.

- Criado via Pluggy Connect ou API
- Ponto de entrada para acessar products
- Requer consentimento do usuário

### Autenticação

- **API Key**: 2 horas, servidor-side, acesso completo
- **Connect Token**: 30 minutos, cliente-side, acesso limitado

---

## 🔑 Endpoints Principais

```
POST   /auth                          # Gerar API Key
POST   /connect_token                 # Gerar Connect Token
POST   /items                         # Criar Item
GET    /items/{id}                    # Recuperar Item
PATCH  /items/{id}                    # Atualizar Item
DELETE /items/{id}                    # Deletar Item
GET    /connectors                    # Listar connectors
GET    /accounts?itemId=...           # Listar contas
GET    /transactions?itemId=...       # Listar transações
GET    /investments?itemId=...        # Listar investimentos
GET    /identity/{id}                 # Dados pessoais
POST   /webhooks                      # Registrar webhook
```

---

## 💻 Stack Recomendado

### Backend

- **Node.js**: `npm install pluggy-sdk`
- **Python**: `pip install pluggy`
- **Java**: Maven/Gradle com SDK Pluggy
- **Ruby/PHP/C#**: SDKs disponíveis

### Frontend

- **React**: `npm install @pluggyai/plug-ui`
- **Vue**: Widget genérico (HTML/JS)
- **Angular**: Widget genérico (HTML/JS)
- **Native Mobile**: React Native compatible

---

## 🧪 Quick Test (2 minutos)

```bash
# 1. Setup
CLIENT_ID="seu_client_id"
CLIENT_SECRET="seu_client_secret"

# 2. Autenticar
API_KEY=$(curl -X POST https://api.pluggy.ai/auth \
  -H "Content-Type: application/json" \
  -d "{\"clientId\":\"$CLIENT_ID\",\"clientSecret\":\"$CLIENT_SECRET\"}" \
  | jq -r '.result.accessToken')

# 3. Listar connectors
curl -X GET "https://api.pluggy.ai/connectors?sandbox=true" \
  -H "X-API-KEY: $API_KEY" | jq '.'

# Pronto! ✅
```

---

## 🌐 Recursos Oficiais

| Recurso          | URL                          |
| ---------------- | ---------------------------- |
| **Website**      | https://pluggy.ai/           |
| **Dashboard**    | https://dashboard.pluggy.ai/ |
| **Documentação** | https://docs.pluggy.ai/      |
| **Status**       | https://status.pluggy.ai/    |
| **GitHub**       | https://github.com/pluggyai  |
| **Email**        | support@pluggy.ai            |

---

## ✨ Features Principais

✅ **Múltiplas Instituições**: +150 bancos e fintech  
✅ **Open Finance**: Conectores regulados (Brasil)  
✅ **Smart Widgets**: UI pronta para uso  
✅ **SDKs**: Node, Python, Java, Ruby, PHP, C#  
✅ **Webhooks**: Notificações em tempo real  
✅ **Enrich API**: Categorização inteligente  
✅ **Payments**: PIX, Boleto, TED, Agendado  
✅ **Smart Transfers**: Débitos recorrentes  
✅ **Sandbox**: Ambiente de testes completo  
✅ **Dashboard**: Gerenciamento visual

---

## 🎯 Fluxo Típico de Integração

```
1. Signup no Dashboard
   ↓
2. Obter CLIENT_ID e CLIENT_SECRET
   ↓
3. Implementar backend:
   - Gerar API Key
   - Gerar Connect Token
   - Processar dados
   - Webhooks
   ↓
4. Integrar widget no frontend:
   - Usar Connect Token
   - Mostrar UI de conexão
   - Callback de sucesso
   ↓
5. Testar em sandbox:
   - Conectar conta teste
   - Validar dados
   - Testar webhooks
   ↓
6. Ir para produção:
   - Trocar connectors
   - Validar segurança
   - Deploy
```

---

## ⚠️ Pontos de Atenção

### Segurança

- 🔒 **Nunca exponha CLIENT_SECRET**
- 🔒 **API Keys expiram em 2 horas** (regenere quando necessário)
- 🔒 **Valide webhooks** (HMAC-SHA256)
- 🔒 **Use HTTPS** sempre

### Performance

- ⚡ **Cache dados** quando possível
- ⚡ **Implemente polling** para status de Item
- ⚡ **Use webhooks** ao invés de polling contínuo
- ⚡ **Respeite rate limits** (429 Too Many Requests)

### Consentimento

- 📋 **Item requer consentimento** do usuário
- 📋 **Consentimento pode expirar** (30+ dias)
- 📋 **Usuário pode revogar** acesso
- 📋 **LGPD/GDPR compliant**

---

## 🆘 Troubleshooting Rápido

| Problema                             | Solução                                              |
| ------------------------------------ | ---------------------------------------------------- |
| 401 Unauthorized                     | API Key expirada ou inválida. Gere uma nova.         |
| 429 Too Many Requests                | Rate limit atingido. Aguarde e tente depois.         |
| Item em RUNNING                      | Normal. Configure webhook para saber quando termina. |
| Connect Token inválido               | Token expires em 30 min. Gere um novo.               |
| Credenciais no Sandbox não funcionam | Use `testuser` / `testpass` exatamente.              |
| Webhook não chega                    | URL deve estar acessível publicamente.               |
| Dados não aparecem                   | Aguarde sincronização completar (status SUCCESS).    |

---

## 📊 Estatísticas da Documentação

- **Total de páginas processadas**: 75+
- **Endpoints documentados**: 30+
- **Exemplos de código**: 50+
- **Linguas suportadas**: Português (documentação compilada)
- **Última atualização**: Janeiro 2025
- **Tamanho total**: ~47 KB (3 arquivos)

---

## 🎓 Próximos Passos Recomendados

1. ✅ **Leia o guia rápido** (PLUGGY_GUIA_INTEGRACAO_RAPIDA.md)
2. ✅ **Teste com cURL** (use examples do guide)
3. ✅ **Implemente backend** (escolha seu SDK)
4. ✅ **Integre widget** (frontend)
5. ✅ **Configure webhooks** (produção)
6. ✅ **Teste em sandbox** (validar fluxo)
7. ✅ **Vá para produção** (trocar connectors)

---

## 📞 Suporte

- **Docs**: https://docs.pluggy.ai/
- **Status**: https://status.pluggy.ai/
- **Email**: support@pluggy.ai
- **GitHub Issues**: https://github.com/pluggyai/issues

---

## 📝 Notas Finais

Esta documentação consolidada foi criada com o objetivo de ser:

- ✅ **Completa**: Cobrindo todos os conceitos
- ✅ **Prática**: Com exemplos reais e runáveis
- ✅ **Organizada**: Dividida em 3 arquivos por propósito
- ✅ **Atualizada**: Baseada em documentação de Janeiro 2025
- ✅ **Acessível**: Em Português, sem jargão desnecessário

Esperamos que facilite sua integração com a Pluggy! 🚀

---

**Compilado em**: Janeiro 2025  
**Fonte**: https://docs.pluggy.ai  
**Versão**: 1.0

**Sugestões?** Abra uma issue no GitHub: https://github.com/pluggyai
