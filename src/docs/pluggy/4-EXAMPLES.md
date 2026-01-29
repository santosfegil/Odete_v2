# Exemplos de Código - Pluggy

## TypeScript/Deno (Edge Functions)

### Autenticação

```typescript
async function getPluggyApiKey(): Promise<string> {
    const clientId = Deno.env.get("PLUGGY_CLIENT_ID");
    const clientSecret = Deno.env.get("PLUGGY_CLIENT_SECRET");

    const authResponse = await fetch("https://api.pluggy.ai/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ clientId, clientSecret }),
    });

    const { apiKey } = await authResponse.json();
    return apiKey;
}
```

### Buscar Contas

```typescript
const accountsResponse = await fetch(
    `https://api.pluggy.ai/accounts?itemId=${itemId}`,
    { headers: { "X-API-KEY": apiKey } }
);
const { results: accounts } = await accountsResponse.json();
```

### Buscar Transações

```typescript
const transResponse = await fetch(
    `https://api.pluggy.ai/transactions?accountId=${accountId}&from=${fromDate}`,
    { headers: { "X-API-KEY": apiKey } }
);
const { results: transactions } = await transResponse.json();
```

## Exemplos Adicionais

<!-- Cole aqui exemplos adicionais -->
