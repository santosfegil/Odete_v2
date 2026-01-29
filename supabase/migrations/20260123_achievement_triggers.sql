-- Migration: Achievement Automation Triggers
-- Data: 2026-01-23
-- Descrição: Triggers para conceder medalhas automaticamente quando o usuário atinge critérios específicos

-- ============================================================
-- FUNÇÃO: Conceder medalha ao usuário (helper reutilizável)
-- ============================================================
CREATE OR REPLACE FUNCTION grant_achievement(p_user_id uuid, p_achievement_title text)
RETURNS void AS $$
BEGIN
  INSERT INTO user_achievements (user_id, achievement_id, earned_at)
  SELECT p_user_id, id, NOW()
  FROM achievements
  WHERE title = p_achievement_title
  ON CONFLICT DO NOTHING; -- Evita duplicatas
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================================
-- TRIGGER 1: Realizador - Concluiu sua primeira meta (goals)
-- ============================================================
CREATE OR REPLACE FUNCTION check_goal_achievements()
RETURNS TRIGGER AS $$
DECLARE
  completed_goals_count INTEGER;
BEGIN
  -- Só dispara quando uma meta é marcada como concluída
  IF NEW.is_completed = true AND (OLD.is_completed = false OR OLD.is_completed IS NULL) THEN
    
    -- Conta quantas metas o usuário já concluiu
    SELECT COUNT(*) INTO completed_goals_count
    FROM goals
    WHERE user_id = NEW.user_id AND is_completed = true;
    
    -- Medalha: Realizador (1ª meta)
    IF completed_goals_count = 1 THEN
      PERFORM grant_achievement(NEW.user_id, 'Realizador');
    END IF;
    
    -- Medalha: Sonhador Prático (3 metas)
    IF completed_goals_count = 3 THEN
      PERFORM grant_achievement(NEW.user_id, 'Sonhador Prático');
    END IF;
    
    -- Medalha: Conquistador (9 metas)
    IF completed_goals_count = 9 THEN
      PERFORM grant_achievement(NEW.user_id, 'Conquistador');
    END IF;
    
    -- Medalha: Mestre das Conquistas (12 metas)
    IF completed_goals_count = 12 THEN
      PERFORM grant_achievement(NEW.user_id, 'Mestre das Conquistas');
    END IF;
    
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_goal_achievements ON goals;
CREATE TRIGGER trigger_goal_achievements
  AFTER UPDATE ON goals
  FOR EACH ROW
  EXECUTE FUNCTION check_goal_achievements();

-- ============================================================
-- TRIGGER 2: Planejador - Criou sua primeira meta
-- ============================================================
CREATE OR REPLACE FUNCTION check_first_goal_created()
RETURNS TRIGGER AS $$
DECLARE
  goals_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO goals_count
  FROM goals
  WHERE user_id = NEW.user_id;
  
  IF goals_count = 1 THEN
    PERFORM grant_achievement(NEW.user_id, 'Planejador');
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_first_goal_created ON goals;
CREATE TRIGGER trigger_first_goal_created
  AFTER INSERT ON goals
  FOR EACH ROW
  EXECUTE FUNCTION check_first_goal_created();

-- ============================================================
-- TRIGGER 3: Auto-desafiante - Criou seu primeiro desafio
-- ============================================================
CREATE OR REPLACE FUNCTION check_first_challenge_created()
RETURNS TRIGGER AS $$
DECLARE
  challenges_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO challenges_count
  FROM weekly_challenges
  WHERE user_id = NEW.user_id;
  
  IF challenges_count = 1 THEN
    PERFORM grant_achievement(NEW.user_id, 'Auto-desafiante');
  END IF;
  
  RETURN NEW;  
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_first_challenge_created ON weekly_challenges;
CREATE TRIGGER trigger_first_challenge_created
  AFTER INSERT ON weekly_challenges
  FOR EACH ROW
  EXECUTE FUNCTION check_first_challenge_created();

-- ============================================================
-- TRIGGER 4: Conectado - Primeira conta OpenBanking
-- ============================================================
CREATE OR REPLACE FUNCTION check_first_bank_connection()
RETURNS TRIGGER AS $$
DECLARE
  connections_count INTEGER;
BEGIN
  IF NEW.status = 'connected' THEN
    SELECT COUNT(*) INTO connections_count
    FROM bank_connections
    WHERE user_id = NEW.user_id AND status = 'connected';
    
    IF connections_count = 1 THEN
      PERFORM grant_achievement(NEW.user_id, 'Conectado');
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_first_bank_connection ON bank_connections;
CREATE TRIGGER trigger_first_bank_connection
  AFTER INSERT OR UPDATE ON bank_connections
  FOR EACH ROW
  EXECUTE FUNCTION check_first_bank_connection();

-- ============================================================
-- TRIGGER 5: Curioso - Primeira pergunta para a Odete
-- ============================================================
CREATE OR REPLACE FUNCTION check_first_chat_message()
RETURNS TRIGGER AS $$
DECLARE
  user_messages_count INTEGER;
  session_user_id UUID;
BEGIN
  -- Só conta mensagens do usuário (não do modelo)
  IF NEW.role = 'user' THEN
    -- Busca o user_id da sessão
    SELECT user_id INTO session_user_id
    FROM ai_chat_sessions
    WHERE id = NEW.session_id;
    
    IF session_user_id IS NOT NULL THEN
      SELECT COUNT(*) INTO user_messages_count
      FROM ai_chat_messages m
      JOIN ai_chat_sessions s ON m.session_id = s.id
      WHERE s.user_id = session_user_id AND m.role = 'user';
      
      IF user_messages_count = 1 THEN
        PERFORM grant_achievement(session_user_id, 'Curioso');
      END IF;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_first_chat_message ON ai_chat_messages;
CREATE TRIGGER trigger_first_chat_message
  AFTER INSERT ON ai_chat_messages
  FOR EACH ROW
  EXECUTE FUNCTION check_first_chat_message();

-- ============================================================
-- NOTA: Medalhas de orçamento/investimento mensal
-- Essas medalhas requerem análise de dados históricos e são
-- melhor implementadas via Edge Function com job periódico (CRON)
-- Exemplos: "Controle Iniciante", "Economia Trimestral", etc.
-- ============================================================
