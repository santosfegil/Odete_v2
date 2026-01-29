-- Migration: Add tag_id to weekly_challenges
-- Data: 2026-01-23
-- Descrição: Permite que desafios sejam baseados em tags além de categorias

ALTER TABLE weekly_challenges
ADD COLUMN IF NOT EXISTS tag_id UUID REFERENCES tags(id);

COMMENT ON COLUMN weekly_challenges.tag_id IS 'Tag opcional para filtrar transações do desafio (alternativa à categoria)';

-- Índice para performance
CREATE INDEX IF NOT EXISTS idx_weekly_challenges_tag_id ON weekly_challenges(tag_id);
