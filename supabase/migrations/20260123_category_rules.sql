-- Migration: category_rules
-- Data: 2026-01-23
-- Descrição: Tabela para regras de classificação automática de transações

CREATE TABLE IF NOT EXISTS category_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  
  -- Critérios de match (usa o primeiro disponível)
  match_receiver_document TEXT,      -- CPF/CNPJ exato (melhor)
  match_receiver_name TEXT,          -- Nome do favorecido
  match_amount_min NUMERIC,          -- Range de valor (para name match)
  match_amount_max NUMERIC,
  match_description_contains TEXT,   -- Fallback: texto parcial
  
  -- Ação a aplicar
  target_category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  target_tag_id UUID REFERENCES tags(id) ON DELETE SET NULL,
  
  -- Metadata
  rule_name TEXT,                    -- Nome amigável (ex: "Aluguel")
  priority INTEGER DEFAULT 0,        -- Maior = mais importante
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_category_rules_user ON category_rules(user_id);
CREATE INDEX IF NOT EXISTS idx_category_rules_document ON category_rules(match_receiver_document) WHERE match_receiver_document IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_category_rules_active ON category_rules(user_id, is_active) WHERE is_active = TRUE;

-- RLS
ALTER TABLE category_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own rules" ON category_rules
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own rules" ON category_rules
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own rules" ON category_rules
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own rules" ON category_rules
  FOR DELETE USING (auth.uid() = user_id);
