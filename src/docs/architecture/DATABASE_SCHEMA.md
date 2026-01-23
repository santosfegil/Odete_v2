### Tabela/View: `accounts`

| Coluna                | Tipo                     | Obrigatório? |
| --------------------- | ------------------------ | ------------ |
| id                    | uuid                     | NO           |
| user_id               | uuid                     | NO           |
| institution_id        | uuid                     | YES          |
| bank_connection_id    | uuid                     | YES          |
| name                  | character varying        | NO           |
| type                  | USER-DEFINED             | NO           |
| balance               | numeric                  | NO           |
| currency              | character varying        | NO           |
| created_at            | timestamp with time zone | NO           |
| account_json          | jsonb                    | YES          |
| credit_limit          | real                     | YES          |
| closing_date          | date                     | YES          |
| due_date              | date                     | YES          |
| external_id           | text                     | NO           |
| account_creation_type | USER-DEFINED             | YES          |

---

### Tabela/View: `achievements`

| Coluna      | Tipo              | Obrigatório? |
| ----------- | ----------------- | ------------ |
| id          | uuid              | NO           |
| title       | character varying | NO           |
| description | text              | NO           |
| category    | USER-DEFINED      | NO           |
| icon_slug   | character varying | NO           |

---

### Tabela/View: `ai_chat_messages`

| Coluna     | Tipo                     | Obrigatório? |
| ---------- | ------------------------ | ------------ |
| id         | uuid                     | NO           |
| session_id | uuid                     | NO           |
| role       | text                     | YES          |
| content    | text                     | YES          |
| metadata   | jsonb                    | YES          |
| created_at | timestamp with time zone | YES          |

---

### Tabela/View: `ai_chat_sessions`

| Coluna      | Tipo                     | Obrigatório? |
| ----------- | ------------------------ | ------------ |
| id          | uuid                     | NO           |
| user_id     | uuid                     | NO           |
| title       | text                     | YES          |
| mode        | text                     | YES          |
| preview     | text                     | YES          |
| is_archived | boolean                  | YES          |
| created_at  | timestamp with time zone | YES          |
| updated_at  | timestamp with time zone | YES          |

---

### Tabela/View: `ai_prompts`

| Coluna             | Tipo                     | Obrigatório? |
| ------------------ | ------------------------ | ------------ |
| id                 | uuid                     | NO           |
| slug               | text                     | NO           |
| version            | integer                  | NO           |
| system_instruction | text                     | NO           |
| is_active          | boolean                  | YES          |
| created_at         | timestamp with time zone | YES          |

---

### Tabela/View: `ai_provider_config`

| Coluna           | Tipo                     | Obrigatório? |
| ---------------- | ------------------------ | ------------ |
| id               | bigint                   | NO           |
| context_name     | text                     | NO           |
| current_provider | text                     | NO           |
| model_name       | text                     | NO           |
| temperature      | numeric                  | NO           |
| max_tokens       | integer                  | YES          |
| extra_config     | jsonb                    | YES          |
| created_at       | timestamp with time zone | NO           |
| updated_at       | timestamp with time zone | NO           |

---

### Tabela/View: `balance_history`

| Coluna     | Tipo                     | Obrigatório? |
| ---------- | ------------------------ | ------------ |
| id         | uuid                     | NO           |
| account_id | uuid                     | NO           |
| date       | date                     | NO           |
| balance    | numeric                  | NO           |
| created_at | timestamp with time zone | NO           |

---

### Tabela/View: `bank_connections`

| Coluna         | Tipo                     | Obrigatório? |
| -------------- | ------------------------ | ------------ |
| id             | uuid                     | NO           |
| user_id        | uuid                     | NO           |
| institution_id | uuid                     | NO           |
| provider_id    | character varying        | NO           |
| access_token   | text                     | NO           |
| refresh_token  | text                     | YES          |
| status         | USER-DEFINED             | NO           |
| last_sync_at   | timestamp with time zone | YES          |
| error_message  | text                     | YES          |
| created_at     | timestamp with time zone | NO           |

---

### Tabela/View: `budgets`

| Coluna       | Tipo                     | Obrigatório? |
| ------------ | ------------------------ | ------------ |
| id           | uuid                     | NO           |
| user_id      | uuid                     | NO           |
| category_id  | uuid                     | NO           |
| amount_limit | numeric                  | NO           |
| month        | integer                  | NO           |
| year         | integer                  | NO           |
| created_at   | timestamp with time zone | NO           |

---

### Tabela/View: `categories`

| Coluna             | Tipo                     | Obrigatório? |
| ------------------ | ------------------------ | ------------ |
| id                 | uuid                     | NO           |
| name               | character varying        | NO           |
| scope              | USER-DEFINED             | NO           |
| investment_class   | USER-DEFINED             | YES          |
| investment_product | USER-DEFINED             | YES          |
| icon_url           | character varying        | YES          |
| color_hex          | character varying        | YES          |
| is_system          | boolean                  | NO           |
| created_at         | timestamp with time zone | NO           |
| icon_key           | character varying        | YES          |
| user_id            | uuid                     | YES          |

---

### Tabela/View: `goals`

| Coluna            | Tipo                     | Obrigatório? |
| ----------------- | ------------------------ | ------------ |
| id                | uuid                     | NO           |
| user_id           | uuid                     | NO           |
| title             | character varying        | NO           |
| target_amount     | numeric                  | NO           |
| current_amount    | numeric                  | NO           |
| deadline          | date                     | YES          |
| is_completed      | boolean                  | NO           |
| created_at        | timestamp with time zone | NO           |
| linked_account_id | uuid                     | YES          |

---

### Tabela/View: `institutions`

| Coluna    | Tipo              | Obrigatório? |
| --------- | ----------------- | ------------ |
| id        | uuid              | NO           |
| name      | character varying | NO           |
| code      | character varying | YES          |
| logo_url  | character varying | NO           |
| color_hex | character varying | YES          |

---

### Tabela/View: `knowledge_base`

| Coluna     | Tipo                     | Obrigatório? |
| ---------- | ------------------------ | ------------ |
| id         | uuid                     | NO           |
| question   | text                     | NO           |
| answer     | text                     | NO           |
| category   | text                     | YES          |
| embedding  | USER-DEFINED             | YES          |
| created_at | timestamp with time zone | YES          |

---

### Tabela/View: `loan_details`

| Coluna               | Tipo                     | Obrigatório? |
| -------------------- | ------------------------ | ------------ |
| id                   | uuid                     | NO           |
| account_id           | uuid                     | NO           |
| installment_value    | numeric                  | NO           |
| interest_rate        | numeric                  | NO           |
| interest_rate_yearly | numeric                  | YES          |
| amortization_system  | character varying        | YES          |
| due_day              | integer                  | YES          |
| total_installments   | integer                  | YES          |
| paid_installments    | integer                  | YES          |
| created_at           | timestamp with time zone | YES          |
| periodicity          | text                     | YES          |
| cet                  | numeric                  | YES          |
| contract_due_date    | date                     | YES          |

---

### Tabela/View: `monthly_consolidated`

| Coluna           | Tipo                     | Obrigatório? |
| ---------------- | ------------------------ | ------------ |
| id               | uuid                     | NO           |
| user_id          | uuid                     | NO           |
| period_month     | integer                  | NO           |
| period_year      | integer                  | NO           |
| total_income     | numeric                  | NO           |
| total_expense    | numeric                  | NO           |
| total_investment | numeric                  | NO           |
| updated_at       | timestamp with time zone | NO           |

---

### Tabela/View: `recurring_transactions`

| Coluna                 | Tipo                     | Obrigatório? |
| ---------------------- | ------------------------ | ------------ |
| id                     | uuid                     | NO           |
| user_id                | uuid                     | NO           |
| account_id             | uuid                     | NO           |
| destination_account_id | uuid                     | YES          |
| category_id            | uuid                     | NO           |
| amount                 | numeric                  | NO           |
| type                   | USER-DEFINED             | NO           |
| frequency              | USER-DEFINED             | NO           |
| start_date             | date                     | NO           |
| next_execution_date    | date                     | NO           |
| active                 | boolean                  | NO           |
| created_at             | timestamp with time zone | NO           |

---

### Tabela/View: `retirement_plan_accounts`

| Coluna     | Tipo | Obrigatório? |
| ---------- | ---- | ------------ |
| plan_id    | uuid | NO           |
| account_id | uuid | NO           |

---

### Tabela/View: `retirement_plans`

| Coluna                    | Tipo                     | Obrigatório? |
| ------------------------- | ------------------------ | ------------ |
| id                        | uuid                     | NO           |
| user_id                   | uuid                     | NO           |
| target_retirement_age     | integer                  | NO           |
| desired_monthly_income    | numeric                  | NO           |
| other_income_sources      | numeric                  | NO           |
| monthly_contribution      | numeric                  | NO           |
| calculated_patrimony_goal | numeric                  | NO           |
| updated_at                | timestamp with time zone | NO           |
| assumptions_selic         | numeric                  | YES          |
| assumptions_inflation     | numeric                  | YES          |

---

### Tabela/View: `subscription_invoices`

| Coluna          | Tipo                     | Obrigatório? |
| --------------- | ------------------------ | ------------ |
| id              | uuid                     | NO           |
| subscription_id | uuid                     | NO           |
| amount          | numeric                  | NO           |
| status          | USER-DEFINED             | NO           |
| pdf_url         | character varying        | YES          |
| created_at      | timestamp with time zone | NO           |

---

### Tabela/View: `subscription_plans`

| Coluna           | Tipo              | Obrigatório? |
| ---------------- | ----------------- | ------------ |
| id               | uuid              | NO           |
| name             | character varying | NO           |
| price            | numeric           | NO           |
| features_json    | jsonb             | YES          |
| store_product_id | character varying | YES          |

---

### Tabela/View: `sync_logs`

| Coluna           | Tipo                     | Obrigatório? |
| ---------------- | ------------------------ | ------------ |
| id               | uuid                     | NO           |
| connection_id    | uuid                     | NO           |
| status           | USER-DEFINED             | NO           |
| records_imported | integer                  | NO           |
| error_code       | character varying        | YES          |
| error_summary    | character varying        | YES          |
| error_details    | jsonb                    | YES          |
| created_at       | timestamp with time zone | NO           |

---

### Tabela/View: `tags`

| Coluna     | Tipo                     | Obrigatório? |
| ---------- | ------------------------ | ------------ |
| id         | uuid                     | NO           |
| user_id    | uuid                     | NO           |
| name       | character varying        | NO           |
| color_hex  | character varying        | YES          |
| created_at | timestamp with time zone | NO           |

---

### Tabela/View: `transaction_tags`

| Coluna         | Tipo | Obrigatório? |
| -------------- | ---- | ------------ |
| transaction_id | uuid | NO           |
| tag_id         | uuid | NO           |

---

### Tabela/View: `transactions`

| Coluna                 | Tipo                     | Obrigatório? |
| ---------------------- | ------------------------ | ------------ |
| id                     | uuid                     | NO           |
| user_id                | uuid                     | NO           |
| account_id             | uuid                     | NO           |
| destination_account_id | uuid                     | YES          |
| category_id            | uuid                     | NO           |
| amount                 | numeric                  | NO           |
| type                   | USER-DEFINED             | NO           |
| date                   | timestamp with time zone | NO           |
| description            | text                     | YES          |
| ignored_in_charts      | boolean                  | NO           |
| installment_number     | integer                  | YES          |
| total_installments     | integer                  | YES          |
| parent_transaction_id  | uuid                     | YES          |
| attachment_url         | character varying        | YES          |
| external_id            | character varying        | YES          |
| status                 | USER-DEFINED             | NO           |
| created_at             | timestamp with time zone | NO           |
| updated_at             | timestamp with time zone | NO           |
| transaction_json       | jsonb                    | YES          |
| bill_date              | date                     | YES          |

---

### Tabela/View: `user_achievements`

| Coluna         | Tipo                     | Obrigatório? |
| -------------- | ------------------------ | ------------ |
| id             | uuid                     | NO           |
| user_id        | uuid                     | NO           |
| achievement_id | uuid                     | NO           |
| earned_at      | timestamp with time zone | NO           |

---

### Tabela/View: `user_memories`

| Coluna     | Tipo                     | Obrigatório? |
| ---------- | ------------------------ | ------------ |
| id         | uuid                     | NO           |
| user_id    | uuid                     | NO           |
| fact       | text                     | NO           |
| category   | text                     | YES          |
| created_at | timestamp with time zone | YES          |

---

### Tabela/View: `user_subscriptions`

| Coluna           | Tipo                     | Obrigatório? |
| ---------------- | ------------------------ | ------------ |
| id               | uuid                     | NO           |
| user_id          | uuid                     | NO           |
| plan_id          | uuid                     | NO           |
| provider         | USER-DEFINED             | NO           |
| status           | USER-DEFINED             | NO           |
| is_auto_renewing | boolean                  | NO           |
| start_date       | timestamp with time zone | NO           |
| end_date         | timestamp with time zone | YES          |
| gateway_id       | character varying        | YES          |
| created_at       | timestamp with time zone | NO           |

---

### Tabela/View: `users`

| Coluna          | Tipo                     | Obrigatório? |
| --------------- | ------------------------ | ------------ |
| id              | uuid                     | NO           |
| current_plan_id | uuid                     | YES          |
| name            | character varying        | NO           |
| cpf             | character varying        | YES          |
| birth_date      | date                     | YES          |
| email           | character varying        | NO           |
| phone           | character varying        | YES          |
| password_hash   | character varying        | YES          |
| created_at      | timestamp with time zone | NO           |

---

### Tabela/View: `view_budget_progress`

| Coluna         | Tipo              | Obrigatório? |
| -------------- | ----------------- | ------------ |
| user_id        | uuid              | YES          |
| month          | integer           | YES          |
| year           | integer           | YES          |
| category_id    | uuid              | YES          |
| category_name  | character varying | YES          |
| icon_key       | character varying | YES          |
| category_scope | USER-DEFINED      | YES          |
| budget_limit   | numeric           | YES          |
| spent_amount   | numeric           | YES          |

---

### Tabela/View: `view_transactions_details`

| Coluna         | Tipo                     | Obrigatório? |
| -------------- | ------------------------ | ------------ |
| id             | uuid                     | YES          |
| user_id        | uuid                     | YES          |
| description    | text                     | YES          |
| amount         | numeric                  | YES          |
| date           | timestamp with time zone | YES          |
| type           | USER-DEFINED             | YES          |
| status         | USER-DEFINED             | YES          |
| tags           | ARRAY                    | YES          |
| category_name  | character varying        | YES          |
| category_icon  | character varying        | YES          |
| category_color | character varying        | YES          |
| account_name   | character varying        | YES          |
| bank_logo      | character varying        | YES          |
| bank_name      | character varying        | YES          |

---

### Tabela/View: `weekly_challenges`

| Coluna        | Tipo                     | Obrigatório? |
| ------------- | ------------------------ | ------------ |
| id            | uuid                     | NO           |
| user_id       | uuid                     | NO           |
| title         | text                     | NO           |
| category_id   | uuid                     | NO           |
| target_amount | numeric                  | NO           |
| average_spent | numeric                  | NO           |
| saving_target | numeric                  | NO           |
| start_date    | timestamp with time zone | NO           |
| end_date      | timestamp with time zone | NO           |
| created_at    | timestamp with time zone | YES          |

---

### Tabela/View: `weekly_expenses`

| Coluna        | Tipo                     | Obrigatório? |
| ------------- | ------------------------ | ------------ |
| id            | uuid                     | NO           |
| user_id       | uuid                     | NO           |
| week_start    | date                     | NO           |
| week_end      | date                     | NO           |
| total_expense | numeric                  | NO           |
| updated_at    | timestamp with time zone | NO           |

---

### Função (RPC): `copy_budgets_to_new_month`

- **Retorno:** `void`
- **Argumentos:** `target_month integer DEFAULT NULL::integer, target_year integer DEFAULT NULL::integer`
- **Linguagem:** plpgsql

---

### Função (RPC): `calculate_monthly_consolidated`

- **Retorno:** `void`
- **Argumentos:** `p_user_id uuid, p_month integer, p_year integer`
- **Linguagem:** plpgsql

---

### Função (RPC): `trigger_recalculate_consolidated`

- **Retorno:** `trigger`
- **Argumentos:** ``
- **Linguagem:** plpgsql

---

### Função (RPC): `get_goals_with_progress`

- **Retorno:** `record`
- **Argumentos:** ``
- **Linguagem:** plpgsql

---

### Função (RPC): `toggle_transaction_tag`

- **Retorno:** `void`
- **Argumentos:** `p_transaction_id uuid, p_tag_name text`
- **Linguagem:** plpgsql

---

### Função (RPC): `set_current_timestamp_updated_at`

- **Retorno:** `trigger`
- **Argumentos:** ``
- **Linguagem:** plpgsql

---

### Função (RPC): `get_spending_history`

- **Retorno:** `record`
- **Argumentos:** ``
- **Linguagem:** plpgsql

---

### Função (RPC): `get_weekly_daily_spending`

- **Retorno:** `record`
- **Argumentos:** ``
- **Linguagem:** plpgsql

---

### Função (RPC): `get_investment_summary`

- **Retorno:** `json`
- **Argumentos:** `year_input integer`
- **Linguagem:** plpgsql

---

### Função (RPC): `vector_in`

- **Retorno:** `vector`
- **Argumentos:** `cstring, oid, integer`
- **Linguagem:** c

---

### Função (RPC): `vector_out`

- **Retorno:** `cstring`
- **Argumentos:** `vector`
- **Linguagem:** c

---

### Função (RPC): `vector_typmod_in`

- **Retorno:** `integer`
- **Argumentos:** `cstring[]`
- **Linguagem:** c

---

### Função (RPC): `vector_recv`

- **Retorno:** `vector`
- **Argumentos:** `internal, oid, integer`
- **Linguagem:** c

---

### Função (RPC): `vector_send`

- **Retorno:** `bytea`
- **Argumentos:** `vector`
- **Linguagem:** c

---

### Função (RPC): `l2_distance`

- **Retorno:** `double precision`
- **Argumentos:** `vector, vector`
- **Linguagem:** c

---

### Função (RPC): `inner_product`

- **Retorno:** `double precision`
- **Argumentos:** `vector, vector`
- **Linguagem:** c

---

### Função (RPC): `cosine_distance`

- **Retorno:** `double precision`
- **Argumentos:** `vector, vector`
- **Linguagem:** c

---

### Função (RPC): `l1_distance`

- **Retorno:** `double precision`
- **Argumentos:** `vector, vector`
- **Linguagem:** c

---

### Função (RPC): `vector_dims`

- **Retorno:** `integer`
- **Argumentos:** `vector`
- **Linguagem:** c

---

### Função (RPC): `vector_norm`

- **Retorno:** `double precision`
- **Argumentos:** `vector`
- **Linguagem:** c

---

### Função (RPC): `l2_normalize`

- **Retorno:** `vector`
- **Argumentos:** `vector`
- **Linguagem:** c

---

### Função (RPC): `binary_quantize`

- **Retorno:** `bit`
- **Argumentos:** `vector`
- **Linguagem:** c

---

### Função (RPC): `subvector`

- **Retorno:** `vector`
- **Argumentos:** `vector, integer, integer`
- **Linguagem:** c

---

### Função (RPC): `vector_add`

- **Retorno:** `vector`
- **Argumentos:** `vector, vector`
- **Linguagem:** c

---

### Função (RPC): `vector_sub`

- **Retorno:** `vector`
- **Argumentos:** `vector, vector`
- **Linguagem:** c

---

### Função (RPC): `vector_mul`

- **Retorno:** `vector`
- **Argumentos:** `vector, vector`
- **Linguagem:** c

---

### Função (RPC): `vector_concat`

- **Retorno:** `vector`
- **Argumentos:** `vector, vector`
- **Linguagem:** c

---

### Função (RPC): `vector_lt`

- **Retorno:** `boolean`
- **Argumentos:** `vector, vector`
- **Linguagem:** c

---

### Função (RPC): `vector_le`

- **Retorno:** `boolean`
- **Argumentos:** `vector, vector`
- **Linguagem:** c

---

### Função (RPC): `vector_eq`

- **Retorno:** `boolean`
- **Argumentos:** `vector, vector`
- **Linguagem:** c

---

### Função (RPC): `vector_ne`

- **Retorno:** `boolean`
- **Argumentos:** `vector, vector`
- **Linguagem:** c

---

### Função (RPC): `vector_ge`

- **Retorno:** `boolean`
- **Argumentos:** `vector, vector`
- **Linguagem:** c

---

### Função (RPC): `vector_gt`

- **Retorno:** `boolean`
- **Argumentos:** `vector, vector`
- **Linguagem:** c

---

### Função (RPC): `vector_cmp`

- **Retorno:** `integer`
- **Argumentos:** `vector, vector`
- **Linguagem:** c

---

### Função (RPC): `vector_l2_squared_distance`

- **Retorno:** `double precision`
- **Argumentos:** `vector, vector`
- **Linguagem:** c

---

### Função (RPC): `vector_negative_inner_product`

- **Retorno:** `double precision`
- **Argumentos:** `vector, vector`
- **Linguagem:** c

---

### Função (RPC): `vector_spherical_distance`

- **Retorno:** `double precision`
- **Argumentos:** `vector, vector`
- **Linguagem:** c

---

### Função (RPC): `vector_accum`

- **Retorno:** `double precision[]`
- **Argumentos:** `double precision[], vector`
- **Linguagem:** c

---

### Função (RPC): `vector_avg`

- **Retorno:** `vector`
- **Argumentos:** `double precision[]`
- **Linguagem:** c

---

### Função (RPC): `vector_combine`

- **Retorno:** `double precision[]`
- **Argumentos:** `double precision[], double precision[]`
- **Linguagem:** c

---

### Função (RPC): `hnsw_halfvec_support`

- **Retorno:** `internal`
- **Argumentos:** `internal`
- **Linguagem:** c

---

### Função (RPC): `avg`

- **Retorno:** `vector`
- **Argumentos:** `vector`
- **Linguagem:** internal

---

### Função (RPC): `sum`

- **Retorno:** `vector`
- **Argumentos:** `vector`
- **Linguagem:** internal

---

### Função (RPC): `vector`

- **Retorno:** `vector`
- **Argumentos:** `vector, integer, boolean`
- **Linguagem:** c

---

### Função (RPC): `array_to_vector`

- **Retorno:** `vector`
- **Argumentos:** `integer[], integer, boolean`
- **Linguagem:** c

---

### Função (RPC): `array_to_vector`

- **Retorno:** `vector`
- **Argumentos:** `real[], integer, boolean`
- **Linguagem:** c

---

### Função (RPC): `array_to_vector`

- **Retorno:** `vector`
- **Argumentos:** `double precision[], integer, boolean`
- **Linguagem:** c

---

### Função (RPC): `array_to_vector`

- **Retorno:** `vector`
- **Argumentos:** `numeric[], integer, boolean`
- **Linguagem:** c

---

### Função (RPC): `vector_to_float4`

- **Retorno:** `real[]`
- **Argumentos:** `vector, integer, boolean`
- **Linguagem:** c

---

### Função (RPC): `ivfflathandler`

- **Retorno:** `index_am_handler`
- **Argumentos:** `internal`
- **Linguagem:** c

---

### Função (RPC): `hnswhandler`

- **Retorno:** `index_am_handler`
- **Argumentos:** `internal`
- **Linguagem:** c

---

### Função (RPC): `ivfflat_halfvec_support`

- **Retorno:** `internal`
- **Argumentos:** `internal`
- **Linguagem:** c

---

### Função (RPC): `ivfflat_bit_support`

- **Retorno:** `internal`
- **Argumentos:** `internal`
- **Linguagem:** c

---

### Função (RPC): `hnsw_bit_support`

- **Retorno:** `internal`
- **Argumentos:** `internal`
- **Linguagem:** c

---

### Função (RPC): `hnsw_sparsevec_support`

- **Retorno:** `internal`
- **Argumentos:** `internal`
- **Linguagem:** c

---

### Função (RPC): `halfvec_in`

- **Retorno:** `halfvec`
- **Argumentos:** `cstring, oid, integer`
- **Linguagem:** c

---

### Função (RPC): `halfvec_out`

- **Retorno:** `cstring`
- **Argumentos:** `halfvec`
- **Linguagem:** c

---

### Função (RPC): `halfvec_typmod_in`

- **Retorno:** `integer`
- **Argumentos:** `cstring[]`
- **Linguagem:** c

---

### Função (RPC): `halfvec_recv`

- **Retorno:** `halfvec`
- **Argumentos:** `internal, oid, integer`
- **Linguagem:** c

---

### Função (RPC): `halfvec_send`

- **Retorno:** `bytea`
- **Argumentos:** `halfvec`
- **Linguagem:** c

---

### Função (RPC): `l2_distance`

- **Retorno:** `double precision`
- **Argumentos:** `halfvec, halfvec`
- **Linguagem:** c

---

### Função (RPC): `inner_product`

- **Retorno:** `double precision`
- **Argumentos:** `halfvec, halfvec`
- **Linguagem:** c

---

### Função (RPC): `cosine_distance`

- **Retorno:** `double precision`
- **Argumentos:** `halfvec, halfvec`
- **Linguagem:** c

---

### Função (RPC): `l1_distance`

- **Retorno:** `double precision`
- **Argumentos:** `halfvec, halfvec`
- **Linguagem:** c

---

### Função (RPC): `vector_dims`

- **Retorno:** `integer`
- **Argumentos:** `halfvec`
- **Linguagem:** c

---

### Função (RPC): `l2_norm`

- **Retorno:** `double precision`
- **Argumentos:** `halfvec`
- **Linguagem:** c

---

### Função (RPC): `l2_normalize`

- **Retorno:** `halfvec`
- **Argumentos:** `halfvec`
- **Linguagem:** c

---

### Função (RPC): `binary_quantize`

- **Retorno:** `bit`
- **Argumentos:** `halfvec`
- **Linguagem:** c

---

### Função (RPC): `subvector`

- **Retorno:** `halfvec`
- **Argumentos:** `halfvec, integer, integer`
- **Linguagem:** c

---

### Função (RPC): `halfvec_add`

- **Retorno:** `halfvec`
- **Argumentos:** `halfvec, halfvec`
- **Linguagem:** c

---

### Função (RPC): `halfvec_sub`

- **Retorno:** `halfvec`
- **Argumentos:** `halfvec, halfvec`
- **Linguagem:** c

---

### Função (RPC): `halfvec_mul`

- **Retorno:** `halfvec`
- **Argumentos:** `halfvec, halfvec`
- **Linguagem:** c

---

### Função (RPC): `halfvec_concat`

- **Retorno:** `halfvec`
- **Argumentos:** `halfvec, halfvec`
- **Linguagem:** c

---

### Função (RPC): `halfvec_lt`

- **Retorno:** `boolean`
- **Argumentos:** `halfvec, halfvec`
- **Linguagem:** c

---

### Função (RPC): `halfvec_le`

- **Retorno:** `boolean`
- **Argumentos:** `halfvec, halfvec`
- **Linguagem:** c

---

### Função (RPC): `halfvec_eq`

- **Retorno:** `boolean`
- **Argumentos:** `halfvec, halfvec`
- **Linguagem:** c

---

### Função (RPC): `halfvec_ne`

- **Retorno:** `boolean`
- **Argumentos:** `halfvec, halfvec`
- **Linguagem:** c

---

### Função (RPC): `halfvec_ge`

- **Retorno:** `boolean`
- **Argumentos:** `halfvec, halfvec`
- **Linguagem:** c

---

### Função (RPC): `halfvec_gt`

- **Retorno:** `boolean`
- **Argumentos:** `halfvec, halfvec`
- **Linguagem:** c

---

### Função (RPC): `halfvec_cmp`

- **Retorno:** `integer`
- **Argumentos:** `halfvec, halfvec`
- **Linguagem:** c

---

### Função (RPC): `halfvec_l2_squared_distance`

- **Retorno:** `double precision`
- **Argumentos:** `halfvec, halfvec`
- **Linguagem:** c

---

### Função (RPC): `halfvec_negative_inner_product`

- **Retorno:** `double precision`
- **Argumentos:** `halfvec, halfvec`
- **Linguagem:** c

---

### Função (RPC): `halfvec_spherical_distance`

- **Retorno:** `double precision`
- **Argumentos:** `halfvec, halfvec`
- **Linguagem:** c

---

### Função (RPC): `halfvec_accum`

- **Retorno:** `double precision[]`
- **Argumentos:** `double precision[], halfvec`
- **Linguagem:** c

---

### Função (RPC): `halfvec_avg`

- **Retorno:** `halfvec`
- **Argumentos:** `double precision[]`
- **Linguagem:** c

---

### Função (RPC): `halfvec_combine`

- **Retorno:** `double precision[]`
- **Argumentos:** `double precision[], double precision[]`
- **Linguagem:** c

---

### Função (RPC): `avg`

- **Retorno:** `halfvec`
- **Argumentos:** `halfvec`
- **Linguagem:** internal

---

### Função (RPC): `sum`

- **Retorno:** `halfvec`
- **Argumentos:** `halfvec`
- **Linguagem:** internal

---

### Função (RPC): `halfvec`

- **Retorno:** `halfvec`
- **Argumentos:** `halfvec, integer, boolean`
- **Linguagem:** c

---

### Função (RPC): `halfvec_to_vector`

- **Retorno:** `vector`
- **Argumentos:** `halfvec, integer, boolean`
- **Linguagem:** c

---

### Função (RPC): `vector_to_halfvec`

- **Retorno:** `halfvec`
- **Argumentos:** `vector, integer, boolean`
- **Linguagem:** c

---

### Função (RPC): `array_to_halfvec`

- **Retorno:** `halfvec`
- **Argumentos:** `integer[], integer, boolean`
- **Linguagem:** c

---

### Função (RPC): `array_to_halfvec`

- **Retorno:** `halfvec`
- **Argumentos:** `real[], integer, boolean`
- **Linguagem:** c

---

### Função (RPC): `array_to_halfvec`

- **Retorno:** `halfvec`
- **Argumentos:** `double precision[], integer, boolean`
- **Linguagem:** c

---

### Função (RPC): `array_to_halfvec`

- **Retorno:** `halfvec`
- **Argumentos:** `numeric[], integer, boolean`
- **Linguagem:** c

---

### Função (RPC): `halfvec_to_float4`

- **Retorno:** `real[]`
- **Argumentos:** `halfvec, integer, boolean`
- **Linguagem:** c

---

### Função (RPC): `hamming_distance`

- **Retorno:** `double precision`
- **Argumentos:** `bit, bit`
- **Linguagem:** c

---

### Função (RPC): `jaccard_distance`

- **Retorno:** `double precision`
- **Argumentos:** `bit, bit`
- **Linguagem:** c

---

### Função (RPC): `sparsevec_in`

- **Retorno:** `sparsevec`
- **Argumentos:** `cstring, oid, integer`
- **Linguagem:** c

---

### Função (RPC): `sparsevec_out`

- **Retorno:** `cstring`
- **Argumentos:** `sparsevec`
- **Linguagem:** c

---

### Função (RPC): `sparsevec_typmod_in`

- **Retorno:** `integer`
- **Argumentos:** `cstring[]`
- **Linguagem:** c

---

### Função (RPC): `sparsevec_recv`

- **Retorno:** `sparsevec`
- **Argumentos:** `internal, oid, integer`
- **Linguagem:** c

---

### Função (RPC): `sparsevec_send`

- **Retorno:** `bytea`
- **Argumentos:** `sparsevec`
- **Linguagem:** c

---

### Função (RPC): `l2_distance`

- **Retorno:** `double precision`
- **Argumentos:** `sparsevec, sparsevec`
- **Linguagem:** c

---

### Função (RPC): `inner_product`

- **Retorno:** `double precision`
- **Argumentos:** `sparsevec, sparsevec`
- **Linguagem:** c

---

### Função (RPC): `check_cc_bill_date`

- **Retorno:** `trigger`
- **Argumentos:** ``
- **Linguagem:** plpgsql

---

### Função (RPC): `cosine_distance`

- **Retorno:** `double precision`
- **Argumentos:** `sparsevec, sparsevec`
- **Linguagem:** c

---

### Função (RPC): `l1_distance`

- **Retorno:** `double precision`
- **Argumentos:** `sparsevec, sparsevec`
- **Linguagem:** c

---

### Função (RPC): `l2_norm`

- **Retorno:** `double precision`
- **Argumentos:** `sparsevec`
- **Linguagem:** c

---

### Função (RPC): `l2_normalize`

- **Retorno:** `sparsevec`
- **Argumentos:** `sparsevec`
- **Linguagem:** c

---

### Função (RPC): `sparsevec_lt`

- **Retorno:** `boolean`
- **Argumentos:** `sparsevec, sparsevec`
- **Linguagem:** c

---

### Função (RPC): `sparsevec_le`

- **Retorno:** `boolean`
- **Argumentos:** `sparsevec, sparsevec`
- **Linguagem:** c

---

### Função (RPC): `sparsevec_eq`

- **Retorno:** `boolean`
- **Argumentos:** `sparsevec, sparsevec`
- **Linguagem:** c

---

### Função (RPC): `sparsevec_ne`

- **Retorno:** `boolean`
- **Argumentos:** `sparsevec, sparsevec`
- **Linguagem:** c

---

### Função (RPC): `sparsevec_ge`

- **Retorno:** `boolean`
- **Argumentos:** `sparsevec, sparsevec`
- **Linguagem:** c

---

### Função (RPC): `sparsevec_gt`

- **Retorno:** `boolean`
- **Argumentos:** `sparsevec, sparsevec`
- **Linguagem:** c

---

### Função (RPC): `sparsevec_cmp`

- **Retorno:** `integer`
- **Argumentos:** `sparsevec, sparsevec`
- **Linguagem:** c

---

### Função (RPC): `sparsevec_l2_squared_distance`

- **Retorno:** `double precision`
- **Argumentos:** `sparsevec, sparsevec`
- **Linguagem:** c

---

### Função (RPC): `sparsevec_negative_inner_product`

- **Retorno:** `double precision`
- **Argumentos:** `sparsevec, sparsevec`
- **Linguagem:** c

---

### Função (RPC): `sparsevec`

- **Retorno:** `sparsevec`
- **Argumentos:** `sparsevec, integer, boolean`
- **Linguagem:** c

---

### Função (RPC): `vector_to_sparsevec`

- **Retorno:** `sparsevec`
- **Argumentos:** `vector, integer, boolean`
- **Linguagem:** c

---

### Função (RPC): `sparsevec_to_vector`

- **Retorno:** `vector`
- **Argumentos:** `sparsevec, integer, boolean`
- **Linguagem:** c

---

### Função (RPC): `halfvec_to_sparsevec`

- **Retorno:** `sparsevec`
- **Argumentos:** `halfvec, integer, boolean`
- **Linguagem:** c

---

### Função (RPC): `sparsevec_to_halfvec`

- **Retorno:** `halfvec`
- **Argumentos:** `sparsevec, integer, boolean`
- **Linguagem:** c

---

### Função (RPC): `array_to_sparsevec`

- **Retorno:** `sparsevec`
- **Argumentos:** `integer[], integer, boolean`
- **Linguagem:** c

---

### Função (RPC): `array_to_sparsevec`

- **Retorno:** `sparsevec`
- **Argumentos:** `real[], integer, boolean`
- **Linguagem:** c

---

### Função (RPC): `array_to_sparsevec`

- **Retorno:** `sparsevec`
- **Argumentos:** `double precision[], integer, boolean`
- **Linguagem:** c

---

### Função (RPC): `array_to_sparsevec`

- **Retorno:** `sparsevec`
- **Argumentos:** `numeric[], integer, boolean`
- **Linguagem:** c

---

### Função (RPC): `get_budget_summary`

- **Retorno:** `record`
- **Argumentos:** `p_month integer, p_year integer`
- **Linguagem:** plpgsql

---

### Função (RPC): `handle_new_user`

- **Retorno:** `trigger`
- **Argumentos:** ``
- **Linguagem:** plpgsql

---

### Função (RPC): `get_finance_dashboard_data`

- **Retorno:** `json`
- **Argumentos:** `p_month integer, p_year integer`
- **Linguagem:** plpgsql
