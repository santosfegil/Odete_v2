-- Migration: update view_transactions_details to include ignored_in_charts
-- Data: 2026-01-23
-- Descrição: Adiciona campo ignored_in_charts à view para suportar feature de ignorar do orçamento

-- Primeiro, vamos recriar a view com o campo ignored_in_charts
-- Nota: O usuário precisará adaptar isso baseado na definição atual da view

-- Se a view usa SECURITY DEFINER ou outras opções, preserve-as
CREATE OR REPLACE VIEW view_transactions_details AS
SELECT 
    t.id,
    t.user_id,
    t.description,
    t.amount,
    t.date,
    t.type,
    t.status,
    t.ignored_in_charts,
    COALESCE(
        (SELECT array_agg(tags.name) 
         FROM transaction_tags tt 
         JOIN tags ON tt.tag_id = tags.id 
         WHERE tt.transaction_id = t.id
        ), 
        ARRAY[]::text[]
    ) as tags,
    c.name as category_name,
    c.icon_key as category_icon,
    c.color_hex as category_color,
    a.name as account_name,
    i.logo_url as bank_logo,
    i.name as bank_name
FROM transactions t
LEFT JOIN categories c ON t.category_id = c.id
LEFT JOIN accounts a ON t.account_id = a.id
LEFT JOIN institutions i ON a.institution_id = i.id;
