# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Odete is a personal finance management app (in Brazilian Portuguese) built with React + TypeScript + Vite. It features an AI assistant powered by Google Gemini that helps users manage their finances, budgets, goals, and achievements.

## Development Commands

```bash
npm run dev          # Start development server
npm run build        # Production build
npm run lint         # Run ESLint
npm run typecheck    # TypeScript type checking
npm run preview      # Preview production build
```

## Architecture

### Frontend (React + Vite)

- **Entry Point**: `src/main.tsx` → `src/App.tsx`
- **Navigation**: Screen-based navigation managed via React state in `App.tsx` (no router library)
- **Screens**: `src/screens/` - Full-page views (Home, Chat, Wallet, Budget, Profile, TransactionScreen, etc.)
- **Components**: `src/components/` - Reusable UI components and modals
- **Styling**: Tailwind CSS with a green/emerald theme (`bg-emerald-*`, `text-stone-*`)

### State & Data

- **Auth Context**: `src/contexts/AuthContext.tsx` - Supabase auth wrapper providing `useAuth()` hook
- **Supabase Client**: `src/lib/supabase.ts` - Database and auth client
- **Custom Hooks**: `src/hooks/` and `src/lib/` - Data fetching hooks (patrimony, monthly investment, category rules)
- **Types**: `src/types.ts` - Shared TypeScript interfaces

### Key Components

- **CategoryEditModal**: `src/components/CategoryEditModal.tsx` - Modal for editing transaction categories with similar transaction detection
- **BudgetModal**: `src/components/BudgetModal.tsx` - Budget management with icon mapping (ICON_MAP)
- **TransactionScreen**: `src/screens/TransactionScreen.tsx` - Transaction history with filtering, tagging, and ignore feature

### AI Integration

- **GeminiService**: `src/services/geminiService.ts` - Handles AI chat with proxy fallback
  - Primary: Calls Supabase Edge Function `odete-chat` (proxy mode)
  - Fallback: Direct Gemini API (requires `VITE_GEMINI_API_KEY`)
  - Supports function calling for financial queries (checkBalance, checkExpenses)

### Backend (Supabase Edge Functions)

Located in `supabase/functions/`:

- **odete-chat**: AI chat proxy - fetches system prompts from `ai_prompts` table and calls Gemini API server-side
- **sync-bank-data**: Syncs bank accounts/transactions from Pluggy API
- **create-pluggy-token**: Generates Pluggy connect tokens

### Database Schema

Key tables (see `src/docs/architecture/DATABASE_SCHEMA.md` for full schema):

- `users`, `accounts`, `transactions` - Core financial data
- `categories`, `budgets`, `goals` - Budget and goal tracking
- `category_rules` - Auto-categorization rules based on receiver/description patterns
- `ai_chat_sessions`, `ai_chat_messages`, `ai_prompts` - Chat history and AI config
- `bank_connections` - Pluggy bank integration
- `achievements`, `user_achievements`, `weekly_challenges` - Gamification

Key Views:

- `view_transactions_details` - Enriched transaction view with category, account, and bank info (includes `ignored_in_charts` for filtering)

REGRA: Antes de gerar qualquer código SQL ou queries Supabase JS, LEIA o arquivo database_schema.md para confirmar nomes de colunas e relacionamentos.

Não alucine tabelas ou campos. Se não estiver no arquivo, assuma que não existe.

## Environment Variables

Required in `.env`:

```
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
VITE_GEMINI_API_KEY=proxy-mode  # Use "proxy-mode" to force backend proxy
```

Edge Functions require (set in Supabase Dashboard):

- `GEMINI_API_KEY`
- `PLUGGY_CLIENT_ID`, `PLUGGY_CLIENT_SECRET`
- `SERVICE_ROLE_KEY`

## Key Patterns

- **Screen Navigation**: `App.tsx` uses boolean flags (`showProfile`, `showBudget`, etc.) to control which screen renders
- **AI Chat Modes**: Two personalities - "mimar" (nurturing) and "julgar" (critical) - prompts stored in `ai_prompts` table
- **Financial Data**: Uses Supabase RPC functions for complex queries (`get_finance_dashboard_data`, `get_budget_summary`, etc.)
- **Bank Integration**: Pluggy widget for connecting Brazilian banks; data synced via Edge Function
- **Ignored Transactions**: Transactions can be marked as `ignored_in_charts` - they remain visible (with strikethrough) but excluded from totals
- **Category Icons**: Use `ICON_MAP` in BudgetModal/CategoryEditModal to map `icon_key` strings to Lucide icons
- **Similar Transactions**: `useCategoryRules` hook finds similar transactions by receiver_document, receiver_name, or description patterns

## Recent Features (Jan 2026)

- **Category Edit Modal**: Edit transaction categories with similar transaction detection and batch update capability
- **Category Rules**: Auto-categorization system that learns from user corrections
- **Ignore from Budget**: Mark transactions to exclude from budget calculations while keeping them visible
- **Weekly Challenges**: Gamification with tag-based financial challenges

## Regras de Comportamento

- **Quando o usuário reportar que algo não funciona: DEBUGAR PRIMEIRO.** Não saia mudando código. Investigue o problema, leia logs, verifique dados no banco, entenda a causa raiz antes de propor qualquer alteração.
- **Não assuma que o código está errado.** A tela pode já funcionar — o problema pode ser nos dados, permissões, ou configuração.
- **Não altere código sem autorização explícita do usuário.**
