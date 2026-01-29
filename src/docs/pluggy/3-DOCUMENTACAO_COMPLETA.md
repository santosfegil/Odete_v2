# Pluggy API - Documentação Completa Consolidada

> **Data de compilação:** Janeiro 2025
> **Fonte:** https://docs.pluggy.ai
> **Total de seções:** 75+

---

## Sumário

1. [Get Started](#get-started)
2. [Glossário](#glossário)
3. [Pluggy Connect Widget](#pluggy-connect-widget)
4. [Connections](#connections)
5. [Products](#products)
6. [Intelligence APIs](#intelligence-apis)
7. [Payments](#payments)
8. [Smart Transfers](#smart-transfers)
9. [Integrating with our API](#integrating-with-our-api)

---

## Get Started

### Welcome to Pluggy!

Com uma única API, você traz os dados financeiros dos seus usuários para que possa desenvolver produtos únicos para seus clientes em poucas horas.

### Sandbox

O Sandbox é um ambiente de testes fornecido por Pluggy onde você pode:

- Testar qualquer fluxo de login e cenários
- Usar contas de teste (Pluggy Bank)
- Validar sua integração antes de ir para produção
- Sem dados reais ou custos

**Como usar:**

1. Configurar sua aplicação em modo sandbox no Dashboard
2. Obter credenciais de teste do Pluggy Bank connector
3. Fazer requisições normalmente (API Key funciona igual)
4. Na requisição GET /connectors, adicione `sandbox=true` para ver apenas connectors de teste

**Credenciais de teste padrão do Pluggy Bank:**

- User: testuser
- Password: testpass
- MFA: 123456 (quando necessário)

Pluggy permite que você:

- Conecte, gerencie e delete conexões ou items através da API
- Acesse dados financeiros padronizados de múltiplas instituições
- Implemente fluxos de consentimento seguros e conformes

**Próximos passos:**

- 🤓 Conceitos: Veja o Glossário
- 🚀 Quick Start: Visite nosso repositório de quickstarts no GitHub
- 📚 API Reference: Acesse nossa referência de API completa

---

## Glossário

### Conceitos Fundamentais

#### Product

Um **Product** representa dados padronizados de uma instituição financeira com um conjunto específico de atributos para um propósito específico.

Produtos disponíveis:

- Accounts (Contas)
- Credit Cards (Cartões de Crédito)
- Investments (Investimentos)
- Identity (Identidade)
- Transactions (Transações)
- Loans (Empréstimos)

#### Connector

Um **Connector** representa um integration com uma instituição financeira que recupera produtos específicos com base no acesso do usuário.

Tipos de connectors:

- Direct Connectors (Conexão direta com instituição)
- Open Finance Connectors (Regulados - Brasil)
- Sandbox Connectors (Para testes)

#### Item

Um **Item** é a representação de uma conexão através de um connector específico de uma Instituição e serve como ponto de entrada para acessar o conjunto de produtos recuperados.

Para criar um Item, a forma mais fácil é através do **Pluggy Connect Widget**, onde o usuário pode:

1. Fornecer seu consentimento
2. Seguir os passos de autenticação
3. Habilitar acesso a todos os seus produtos

#### API Key

Uma **API Key** funciona como um segredo de API e expira 2 horas após sua criação. É usada para autenticar todas as requisições feitas para a API da Pluggy.

Características:

- Gerada usando CLIENT_ID e CLIENT_SECRET
- Expira em 2 horas
- Pode ser revogada do Dashboard
- Usada para chamadas server-side

#### Connect Token

Um **Connect Token** é outro tipo de segredo de API com características diferentes:

- Expira 30 minutos após criação
- Orientado para uso client-side
- Acesso restrito a: GET /items/:id, GET /accounts?itemId
- Gerado via POST /connect_token usando API Key

---

## Pluggy Connect Widget

### Introdução ao Connect Widget

O Pluggy Connect é um widget drop-in que permite que seus usuários se conectem facilmente à sua aplicação através do Pluggy.

**Benefícios:**

- Fluxo de autenticação pré-construído
- Suporte a múltiplos tipos de autenticação (1-step, 2-step, MFA)
- Tratamento automático de erros
- Customização visual integrada

### Autenticação

#### Divisão de Permissões

**API Key:**

- Expiração: 2 horas
- Uso: Backend applications
- Permissões:
  - Criar Connect Tokens
  - Ler dados de usuários (todos os produtos)
  - Configurar Webhooks
  - Criar, atualizar e deletar Items
  - Revisar Connectors e categorias de transações

**Connect Token:**

- Expiração: 30 minutos
- Uso: Frontend applications (Web ou Mobile)
- Permissões: Acesso limitado ao widget de conexão

### Ambientes e Configurações

O widget do Connect é disponível para os seguintes ambientes:

- Web (React, Vue, Angular, etc.)
- Mobile (iOS, Android)
- React Native
- Webview

**Callbacks:** Quando usando o Pluggy Connect Widget no frontend, você tem acesso a callbacks para eventos:

- `onSuccess`: Executado quando a conta é conectada com sucesso
- `onError`: Executado quando há um erro
- Esses callbacks são úteis para melhorar a UX

**Exemplo React:**

```jsx
<PluggyConnect
  connectToken={token}
  onSuccess={({ item }) => console.log(item.id)}
  onError={({ message, data: { item } }) => showErrorPage(message)}
/>
```

### Webhooks

#### Como Configurar Webhooks

**Fluxo:**

1. Criar um endpoint para escutar eventos de webhook da Pluggy
2. Criar um webhook apontando para esse endpoint via Dashboard ou API
3. Quando um evento ocorre (ex: item conectado), Pluggy envia uma notificação

**Por que Webhooks são importantes:**

- Callbacks no frontend são inconsistentes
- Não é possível confiar em lógica de negócio ou integridade de BD apenas com callbacks
- Webhooks garantem entrega server-side confiável

---

## Connections

### Item

Um Item é a representação de uma conexão com um Connector específico de uma Instituição e serve como ponto de entrada para acessar o conjunto de produtos recuperados do usuário que deu consentimento.

#### Ciclo de Vida do Item (Item Lifecycle)

Os states que um Item pode ter:

1. **CREATED**: Item foi criado mas ainda não foi autenticado
2. **WAITING_USER_INPUT**: Aguardando ação do usuário (autenticação, MFA, etc)
3. **RUNNING**: Sincronização em progresso
4. **SUCCESS**: Sincronização completada com sucesso
5. **ERROR**: Erro durante sincronização
6. **WAITING_USER_DECISION**: Aguardando decisão do usuário (ex: seleção de contas)
7. **EXPIRED**: Item expirou (consentimento, link, etc)
8. **DELETED**: Item foi deletado

#### Criando um Item

**Via Direct Connector:**

```bash
curl -X POST https://api.pluggy.ai/items \
  -H "X-API-KEY: YOUR_API_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "connectorId": "1",
    "credentials": {
      "user": "username",
      "password": "password"
    }
  }'
```

**Via Open Finance (Brasil):**

1. Usuário insere CPF (Pessoa Física) ou CNPJ (Pessoa Jurídica)
2. Redirecionado para página de login da instituição (pop-up)
3. Completa autenticação (QR code, link, credenciais, etc)
4. Seleciona quais informações compartilhar
5. Consentimento confirmado e redirecionado de volta
6. Widget finaliza a sincronização dos dados

### Erros e Validações

Os erros são retornados em formato específico com:

- Código de erro
- Mensagem descritiva
- Detalhes adicionais (quando aplicável)

### Warnings e Status Codes

#### Status Codes HTTP Padrão

- `200 OK`: Requisição bem-sucedida
- `201 Created`: Recurso criado com sucesso
- `400 Bad Request`: Erro na validação dos dados
- `401 Unauthorized`: Falha de autenticação (API Key/token inválido)
- `404 Not Found`: Recurso não encontrado
- `429 Too Many Requests`: Rate limit excedido
- `500 Internal Server Error`: Erro interno do servidor

### Consentimento e Expiração (Consents)

- Usuário fornece consentimento quando conecta através do widget
- Consentimento pode ser revogado
- Links de autenticação expiram após tempo determinado
- Items expiram se não forem usados por tempo prolongado

---

## Products

Os produtos são os dados específicos que você pode acessar através de um Item.

### Account (Contas)

Dados de contas bancárias e similares.

**Informações retornadas:**

- ID da conta
- Número da conta
- Tipo de conta
- Saldo
- Limite (se aplicável)
- Moeda
- Status

### Credit Card Bills (Faturas de Cartão de Crédito)

Dados de cartões de crédito e suas faturas.

**Informações retornadas:**

- ID do cartão
- Últimas 4 dígitos
- Saldo
- Limite de crédito
- Data de vencimento
- Transações da fatura

### Transactions (Transações)

Transações e movimentações das contas e cartões.

**Informações retornadas:**

- ID da transação
- Descrição
- Data
- Valor
- Status (POSTED, PENDING, etc)
- Categoria
- Tipo (DEBIT, CREDIT)
- Merchant (para alguns casos)

#### Transaction Categorization (Categorização de Transações)

Cada transação é enriquecida usando nossa DataEnrichment API, que melhora e agrega valor às transações.

**Categorização automática:**

- Transações são categorizadas automaticamente
- Usa nosso Categorizador próprio
- Oferece múltiplos níveis de categorias
- Exemplos: Alimentação, Transporte, Saúde, etc

### Investment (Investimentos)

Dados de investimentos do usuário.

**Informações retornadas:**

- Portfolio completo
- Detalhes de cada investimento
- Saldo atualizado
- Performance
- Taxa de rentabilidade

### Investment's Transactions (Transações de Investimentos)

Movimentações em investimentos (compra, venda, resgate, etc).

### Loan (Empréstimos)

Dados de empréstimos do usuário.

**Informações retornadas:**

- Saldo devedor
- Taxa de juros
- Data de vencimento
- Parcelas pagas/pendentes
- Próximo vencimento

### Identity (Identidade)

Dados pessoais do usuário.

**Informações retornadas:**

- Nome completo
- CPF/CNPJ
- Data de nascimento
- Endereço
- Telefone
- Email
- Ocupação/Profissão

---

## Intelligence APIs

### Connection Insights

Análise inteligente das conexões e dados do usuário.

**Usa machine learning para:**

- Detectar padrões de comportamento
- Identificar anomalias
- Fornecer insights sobre saúde financeira

### Transaction Enrichment (Enrich API)

API que permite categorizar e enriquecer seus próprios dados de transações recuperados fora do Pluggy.

**Funcionalidades:**

- Categorização de transações próprias
- Extração de merchant
- Indicadores-chave sobre transações
- Padronização de dados

### Recurring Payments Analysis

Análise de pagamentos recorrentes do usuário.

**Identifica:**

- Assinaturas
- Pagamentos periódicos
- Despesas recorrentes
- Oportunidades de economia

---

## PAYMENTS

### Payments Overview

Pluggy oferece APIs para processar pagamentos de forma instantânea, segura e fácil.

**Tipos de pagamentos suportados:**

- PIX (transferência instantânea)
- PIX Agendado (transfers agendadas)
- PIX Automático (débito recorrente)
- Boleto
- TED

### Payment Intent Lifecycle and Errors

Um Payment Intent representa uma intenção de pagamento.

**Estados:**

1. CREATED: Payment intent criado
2. PENDING: Aguardando confirmação
3. AUTHORIZED: Autorizado
4. COMPLETED: Concluído com sucesso
5. FAILED: Falhou
6. CANCELLED: Cancelado
7. EXPIRED: Expirou

### Scheduled Payments (Pix Agendado)

Permite agendar PIX para data futura.

**Funcionalidades:**

- Agendar transferência para data específica
- Modificar ou cancelar agendamento
- Receber confirmações via webhook

### PIX Automatico

Débito recorrente via PIX.

**Características:**

- Usuário autoriza débito recorrente
- Débitos automáticos periódicos
- Pode ser revogado a qualquer momento

---

## Smart Transfers

### Introduction

Smart Transfers API permite pagamentos instantâneos, fáceis e seguros.

**Diferenças do Payment Initiation:**

- Consentimento único (preauthorization)
- Automatiza processo de pagamento
- Sem interação adicional do usuário
- Todas as contas devem pertencer ao mesmo dono (mesmo CPF/CNPJ)

### Creating a Preauthorization

**Fluxo:**

1. Usuário autoriza débito de uma conta (preauthorization)
2. Especifica recipients autorizados
3. Define limite/período de validade

```bash
curl --location 'https://api.pluggy.ai/smart-transfers/preauthorizations' \
  -H 'Content-Type: application/json' \
  -H 'X-API-KEY: YOUR_API_KEY' \
  -d '{
    "debtorAccountId": "account-id",
    "recipientIds": ["recipient1", "recipient2"],
    "expiresAt": "2025-12-31T23:59:59Z"
  }'
```

### Creating a Payment

Após preauthorization, você pode enviar pagamentos:

```bash
curl --location 'https://api.pluggy.ai/smart-transfers/payments' \
  -H 'Content-Type: application/json' \
  -H 'X-API-KEY: YOUR_API_KEY' \
  -d '{
    "preauthorizationId": "preauth-id",
    "recipientId": "recipient-id",
    "amount": 100,
    "description": "Meu pagamento automático"
  }'
```

**Campos:**

- `preauthorizationId`: ID da preauthorização
- `recipientId`: Um dos recipients autorizados
- `amount`: Valor a enviar
- `description`: Descrição (opcional)

---

## Integrating with our API

### Basic Concepts

Antes de começar a integração, entenda os conceitos básicos:

- **Item**: Conexão entre usuário e instituição
- **Product**: Tipo de dado (Account, Transaction, etc)
- **Connector**: Integração específica com instituição
- **API Key**: Token de autenticação server-side
- **Connect Token**: Token client-side limitado

### Run in Postman

Pluggy fornece coleção do Postman para testar a API.

**Como usar:**

1. Importar coleção no Postman
2. Configurar variáveis de ambiente (API Key, etc)
3. Testar endpoints diretamente

### Connect an Account

Passo a passo para conectar uma conta através do Pluggy Connect.

**Fluxo básico:**

1. Frontend gera Connect Token (via backend)
2. Usuário abre widget com Connect Token
3. Usuário se autentica na instituição
4. Widget retorna Item ID via callback
5. Backend recebe confirmação via webhook
6. Agora você pode acessar os dados do Item

### Server-Side SDKs

Pluggy fornece SDKs para múltiplas linguagens:

- **Node.js**: JavaScript/TypeScript
- **Python**: Python 3.x
- **Java**: Java 8+
- **Ruby**: Ruby 2.7+
- **PHP**: PHP 7.4+
- **C#/.NET**: .NET Core

**Vantagens de usar SDKs:**

- Autenticação automática
- Tratamento de erros
- Rate limiting handling
- Requisições type-safe
- Exemplos inclusos

### No-Code Integrations

Para não-developers, Pluggy oferece integrações com plataformas no-code:

- **Bubble**: Integração step-by-step disponível
- **Make/Zapier**: Automações
- **Outras**: Mais integrações em desenvolvimento

### Error Codes

Pluggy retorna códigos de erro específicos:

**Erros de Autenticação (40x):**

- `401`: API Key/Token inválido
- `403`: Acesso não autorizado

**Erros de Validação (4xx):**

- `400`: Bad Request (dados inválidos)
- `422`: Unprocessable Entity (validação falhou)

**Erros de Rate Limit:**

- `429`: Too Many Requests

**Erros de Servidor (5xx):**

- `500`: Internal Server Error
- `503`: Service Unavailable

### Rate Limits

Pluggy implementa rate limiting para proteger a API:

**Limites padrão:**

- Requisições por segundo: Varia por endpoint
- Sincronizações simultâneas: Limitadas
- Requisições por hora: Varia por plano

**Como lidar:**

- Implementar retry com backoff exponencial
- Cache de dados quando possível
- Monitorar headers de rate limit

### Webhook

Webhooks permitem receber eventos em tempo real quando algo acontece na Pluggy.

**Eventos disponíveis:**

- Item conectado com sucesso
- Item teve erro na sincronização
- Dados foram atualizados
- Pagamento foi processado
- Etc

**Configuração:**

1. Criar endpoint que recebe POST requests
2. Registrar webhook URL no Dashboard
3. Pluggy enviará eventos para seu endpoint
4. Seu endpoint deve responder com 200 OK

**Segurança:**

- Validar assinatura do webhook (HMAC-SHA256)
- Implementar idempotência (em caso de retry)

---

## Integration Tutorials

### Creating a Use Case from Scratch

Passo a passo para criar uma aplicação simples que integra com Pluggy.

**O que vamos construir:**
Uma aplicação de PFM (Personal Financial Management) simples que:

1. Permite usuário conectar sua conta bancária
2. Exibe transações
3. Categoriza despesas
4. Oferece insights básicos

### Pluggy's Integration Checklist

Checklist para integração completa:

**[ ] 1. Get your API keys**

- Signup no Dashboard
- Copiar CLIENT_ID e CLIENT_SECRET
- Criar aplicação no Dashboard

**[ ] 2. Create your first Item**

- Implementar endpoint para criar Item
- Testar com credenciais de sandbox
- Verificar se dados são retornados

**[ ] 3. Use our SDKs to Authenticate**

- Escolher SDK apropriado para seu backend
- Instalar via package manager
- Implementar autenticação

**[ ] 4. Setup PluggyConnect Widget on your app**

- Instalar widget no frontend
- Implementar callbacks
- Testar fluxo de conexão

**[ ] 5. Data sync: Update an Item**

- Implementar update periódico
- Usar endpoint PATCH /items/{id}
- Lidar com MFA se necessário

**[ ] 6. Setup Two-way sync with Webhooks**

- Criar endpoint de webhook
- Registrar no Dashboard
- Implementar processamento de eventos

**[ ] 7. Consent management: Delete an Item**

- Implementar delete de Item
- Respeitar direito do usuário
- Registrar consentimento revogado

**[ ] 8. Subscribe to our Status Page**

- Inscrever-se em https://status.pluggy.ai/
- Receber notificações de indisponibilidade
- Monitorar serviço

---

## Boleto

### Boleto Management API

API para gerenciar Boletos (títulos de cobrança brasileiros).

**Funcionalidades:**

- Criar boletos
- Acompanhar pagamento
- Receber notificações
- Validação automática
- Integração com instituições

---

## Resumo de Endpoints Principais

### Authentication

- `POST /auth` - Autenticar e obter API Key
- `POST /connect_token` - Criar Connect Token

### Items

- `POST /items` - Criar novo Item
- `GET /items/{id}` - Recuperar Item
- `PATCH /items/{id}` - Atualizar Item (trigger sync)
- `DELETE /items/{id}` - Deletar Item

### Connectors

- `GET /connectors` - Listar todos connectors
- `GET /connectors/{id}` - Detalhes do connector

### Accounts

- `GET /accounts` - Listar contas de um Item
- `GET /accounts/{id}` - Detalhes da conta

### Transactions

- `GET /transactions` - Listar transações
- `GET /transactions/{id}` - Detalhes da transação

### Investments

- `GET /investments` - Listar investimentos
- `GET /investments/{id}` - Detalhes do investimento

### Identity

- `GET /identity/{id}` - Dados de identidade

### Webhooks

- `POST /webhooks` - Registrar webhook
- `GET /webhooks` - Listar webhooks
- `DELETE /webhooks/{id}` - Remover webhook

---

## Recursos Adicionais

- **Status Page**: https://status.pluggy.ai/
- **GitHub Quickstarts**: https://github.com/pluggyai/quickstart
- **Dashboard**: https://dashboard.pluggy.ai/
- **Website**: https://pluggy.ai/

---

**Última atualização:** Janeiro 2025  
**Compilado de:** https://docs.pluggy.ai
