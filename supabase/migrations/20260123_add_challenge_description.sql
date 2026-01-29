-- Migration: Add description column to weekly_challenges
-- Data: 2026-01-23
-- Descrição: Adiciona campo de descrição para desafios semanais

ALTER TABLE weekly_challenges
ADD COLUMN IF NOT EXISTS description TEXT;

COMMENT ON COLUMN weekly_challenges.description IS 'Descrição detalhada do desafio para exibição ao usuário';
