-- Migration: Corrige account_creation_type para contas Open Finance existentes
-- Data: 2026-01-23
-- Descrição: Atualiza contas que têm external_id (vieram do Pluggy) mas não têm account_creation_type definido

UPDATE accounts
SET account_creation_type = 'automatic'
WHERE external_id IS NOT NULL 
  AND (account_creation_type IS NULL OR account_creation_type != 'automatic');

-- Também garante que contas manuais (sem external_id) tenham o tipo correto
UPDATE accounts
SET account_creation_type = 'manual'
WHERE external_id IS NULL 
  AND (account_creation_type IS NULL OR account_creation_type = '');
