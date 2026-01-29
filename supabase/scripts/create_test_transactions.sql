-- Script para criar transações de teste para funcionalidade de categorias similares
-- Execute este script no SQL Editor do Supabase

-- IMPORTANTE: Substitua 'SEU_USER_ID' pelo seu user_id real
-- Você pode descobrir seu user_id com: SELECT id FROM auth.users LIMIT 1;

-- Primeiro, descubra seu user_id e uma categoria de "Outros"
-- SELECT id FROM auth.users LIMIT 1;
-- SELECT id FROM categories WHERE name = 'Outros' AND user_id IS NULL LIMIT 1;

DO $$
DECLARE
  v_user_id uuid;
  v_category_outros uuid;
  v_account_id uuid;
BEGIN
  -- Pega o primeiro usuário (ajuste se necessário)
  SELECT id INTO v_user_id FROM auth.users LIMIT 1;
  
  -- Pega a categoria "Outros"
  SELECT id INTO v_category_outros FROM categories WHERE name = 'Outros' AND user_id IS NULL LIMIT 1;
  
  -- Pega a primeira conta do usuário
  SELECT id INTO v_account_id FROM accounts WHERE user_id = v_user_id LIMIT 1;

  -- =============================================
  -- CENÁRIO 1: Transações com mesmo receiver_document (CPF/CNPJ)
  -- =============================================
  INSERT INTO transactions (user_id, account_id, description, amount, date, type, status, category_id, receiver_document, receiver_name)
  VALUES 
    (v_user_id, v_account_id, 'Pix para Supermercado ABC', -150.00, NOW() - INTERVAL '5 days', 'expense', 'paid', v_category_outros, '12345678000190', 'SUPERMERCADO ABC LTDA'),
    (v_user_id, v_account_id, 'Pix para Supermercado ABC - Compras Mensais', -220.50, NOW() - INTERVAL '12 days', 'expense', 'paid', v_category_outros, '12345678000190', 'SUPERMERCADO ABC LTDA'),
    (v_user_id, v_account_id, 'PIX - SUPERMERCADO ABC', -95.30, NOW() - INTERVAL '20 days', 'expense', 'paid', v_category_outros, '12345678000190', 'SUPERMERCADO ABC LTDA');

  -- =============================================
  -- CENÁRIO 2: Transações com mesmo receiver_name + valor próximo
  -- =============================================
  INSERT INTO transactions (user_id, account_id, description, amount, date, type, status, category_id, receiver_name)
  VALUES 
    (v_user_id, v_account_id, 'PIX Recebido - Freelance Design', -500.00, NOW() - INTERVAL '3 days', 'expense', 'paid', v_category_outros, 'JOAO SILVA DESENVOLVEDOR'),
    (v_user_id, v_account_id, 'PIX para João - Projeto Web', -520.00, NOW() - INTERVAL '15 days', 'expense', 'paid', v_category_outros, 'JOAO SILVA DESENVOLVEDOR'),
    (v_user_id, v_account_id, 'Pagamento JOAO SILVA', -480.00, NOW() - INTERVAL '30 days', 'expense', 'paid', v_category_outros, 'JOAO SILVA DESENVOLVEDOR');

  -- =============================================
  -- CENÁRIO 3: Transações com descrição similar (primeiras 3 palavras)
  -- =============================================
  INSERT INTO transactions (user_id, account_id, description, amount, date, type, status, category_id)
  VALUES 
    (v_user_id, v_account_id, 'NETFLIX ASSINATURA MENSAL', -55.90, NOW() - INTERVAL '2 days', 'expense', 'paid', v_category_outros),
    (v_user_id, v_account_id, 'NETFLIX ASSINATURA MENSAL - Premium', -55.90, NOW() - INTERVAL '32 days', 'expense', 'paid', v_category_outros),
    (v_user_id, v_account_id, 'NETFLIX ASSINATURA MENSAL Janeiro', -45.90, NOW() - INTERVAL '60 days', 'expense', 'paid', v_category_outros);

  RAISE NOTICE 'Criadas 9 transações de teste para o usuário %', v_user_id;
END $$;

-- Para verificar as transações criadas:
-- SELECT id, description, amount, receiver_document, receiver_name, category_id 
-- FROM transactions 
-- WHERE description LIKE '%NETFLIX%' OR receiver_name = 'SUPERMERCADO ABC LTDA' OR receiver_name = 'JOAO SILVA DESENVOLVEDOR'
-- ORDER BY created_at DESC;
