import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { WeeklyChallenge } from '../types';

export function useWeeklyChallenge() {
  const [challenge, setChallenge] = useState<WeeklyChallenge | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchChallenge = async () => {
    try {
      console.log("🔄 Buscando desafio...");
      const { data: { user } } = await supabase.auth.getUser();
      console.log("👤 Usuário Logado:", user?.id);

      const today = new Date();
      const startOfWeek = new Date(today);
      startOfWeek.setDate(today.getDate() - today.getDay());
      startOfWeek.setHours(0, 0, 0, 0);
      
      const endOfWeek = new Date(startOfWeek);
      endOfWeek.setDate(startOfWeek.getDate() + 6);
      endOfWeek.setHours(23, 59, 59, 999);

      // 1. Buscar desafio (Simplifiquei o filtro de data para debug)
      // Pegamos qualquer desafio ativo criado recentemente
      const { data: challenges, error: errChallenge } = await supabase
        .from('weekly_challenges')
        .select('*')
        .eq('user_id', user?.id) // Garante que é do usuário logado
        .limit(1);

      if (errChallenge) {
        console.error("❌ Erro ao buscar desafio:", errChallenge);
        throw errChallenge;
      }

      console.log("📦 Desafios encontrados:", challenges);

      if (!challenges || challenges.length === 0) {
        setChallenge(null);
        return;
      }

      const activeChallenge = challenges[0];

      // 2. Buscar transações
      const { data: trans, error: errTrans } = await supabase
        .from('transactions')
        .select('amount, date')
        .eq('user_id', activeChallenge.user_id)
        .eq('category_id', activeChallenge.category_id)
        .eq('type', 'expense') 
        .gte('date', startOfWeek.toISOString())
        .lte('date', endOfWeek.toISOString());

      if (errTrans) throw errTrans;

      const transactions = trans || [];
      console.log("💸 Transações da semana:", transactions.length);

      // 3. Calcular Progresso
      const dailyLimit = activeChallenge.target_amount / 7;
      const weekDays = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];
      const todayIndex = today.getDay(); 

      let totalSpent = 0;

      const progress = weekDays.map((dayLabel, index) => {
        const dayTotal = transactions.reduce((acc, t) => {
          const tDate = new Date(t.date);
          // Pequeno ajuste para garantir que o dia da semana bata com o fuso local
          // (getUTCDay vs getDay pode variar, usamos local aqui)
          return tDate.getDay() === index ? acc + Number(t.amount) : acc;
        }, 0);

        if (index <= todayIndex) {
           totalSpent += dayTotal;
        }

        let status: 'success' | 'failed' | 'pending' | 'today' = 'pending';

        if (index === todayIndex) {
          status = 'today';
        } else if (index < todayIndex) {
          status = dayTotal <= dailyLimit ? 'success' : 'failed';
        }

        return { day: dayLabel, status };
      });

      setChallenge({
        id: activeChallenge.id,
        title: activeChallenge.title,
        category: 'custom',
        currentAmount: totalSpent,
        targetAmount: activeChallenge.target_amount,
        averageSpent: activeChallenge.average_spent,
        savingTarget: activeChallenge.saving_target,
        weekProgress: progress as any
      });

    } catch (error) {
      console.error('Erro geral no hook:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchChallenge();
  }, []);

  return { challenge, loading, refetch: fetchChallenge };
}