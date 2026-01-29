import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { WeeklyChallenge } from '../types';

export function useWeeklyChallenge() {
  const [challenge, setChallenge] = useState<WeeklyChallenge | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchChallenge = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setChallenge(null);
        return;
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      // 1. Buscar desafio ativo (que ainda não terminou)
      const { data: challenges, error: errChallenge } = await supabase
        .from('weekly_challenges')
        .select('*')
        .eq('user_id', user.id)
        .gte('end_date', today.toISOString()) // Desafio ainda não terminou
        .order('created_at', { ascending: false })
        .limit(1);

      if (errChallenge) throw errChallenge;

      if (!challenges || challenges.length === 0) {
        setChallenge(null);
        return;
      }

      const activeChallenge = challenges[0];
      
      // 2. Calcular início do desafio usando apenas a parte da data (sem hora)
      const challengeStartStr = activeChallenge.start_date.split('T')[0]; // "2026-01-23"
      const [startYear, startMonth, startDay] = challengeStartStr.split('-').map(Number);
      const challengeStart = new Date(startYear, startMonth - 1, startDay); // Mês é 0-indexed
      
      // Data de hoje (apenas data, sem hora)
      const todayLocal = new Date();
      const todayDate = new Date(todayLocal.getFullYear(), todayLocal.getMonth(), todayLocal.getDate());

      // 3. Calcular qual dia do desafio é hoje (0 a 6)
      const msPerDay = 24 * 60 * 60 * 1000;
      const daysSinceStart = Math.floor((todayDate.getTime() - challengeStart.getTime()) / msPerDay);
      const todayIndex = Math.max(0, Math.min(6, daysSinceStart)); // Clamp entre 0 e 6

      // Debug
      console.log('📅 Challenge Start:', challengeStartStr, '| Today:', todayDate.toISOString().split('T')[0], '| Days Since Start:', daysSinceStart, '| Today Index:', todayIndex);

      // 4. Calcular fim do desafio
      const challengeEnd = new Date(challengeStart);
      challengeEnd.setDate(challengeStart.getDate() + 6);
      challengeEnd.setHours(23, 59, 59, 999);

      // 5. Buscar transações do período do desafio
      // Se tem tag_id, busca via transaction_tags; se tem category_id, filtra direto
      let transactions: { amount: number; date: string }[] = [];

      if (activeChallenge.tag_id) {
        // Buscar transações vinculadas a essa tag
        const { data: taggedTxIds, error: errTagged } = await supabase
          .from('transaction_tags')
          .select('transaction_id')
          .eq('tag_id', activeChallenge.tag_id);

        if (errTagged) throw errTagged;

        if (taggedTxIds && taggedTxIds.length > 0) {
          const txIds = taggedTxIds.map(t => t.transaction_id);
          const { data: trans, error: errTrans } = await supabase
            .from('transactions')
            .select('amount, date')
            .in('id', txIds)
            .eq('type', 'expense')
            .gte('date', challengeStart.toISOString())
            .lte('date', challengeEnd.toISOString());

          if (errTrans) throw errTrans;
          transactions = trans || [];
        }
      } else if (activeChallenge.category_id) {
        // Buscar transações por categoria
        const { data: trans, error: errTrans } = await supabase
          .from('transactions')
          .select('amount, date')
          .eq('user_id', activeChallenge.user_id)
          .eq('category_id', activeChallenge.category_id)
          .eq('type', 'expense')
          .gte('date', challengeStart.toISOString())
          .lte('date', challengeEnd.toISOString());

        if (errTrans) throw errTrans;
        transactions = trans || [];
      }

      // 6. Calcular Progresso por dia do desafio
      const dailyLimit = activeChallenge.target_amount / 7;
      const weekdayAbbrev = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S']; // Dom, Seg, Ter, Qua, Qui, Sex, Sab
      
      let totalSpent = 0;

      const progress = Array.from({ length: 7 }, (_, index) => {
        // Calcular a data deste dia do desafio
        const dayDate = new Date(challengeStart);
        dayDate.setDate(challengeStart.getDate() + index);
        const dayStart = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate());
        const dayEnd = new Date(dayDate.getFullYear(), dayDate.getMonth(), dayDate.getDate(), 23, 59, 59, 999);

        // Somar transações deste dia
        const dayTotal = transactions.reduce((acc, t) => {
          const tDate = new Date(t.date);
          return (tDate >= dayStart && tDate <= dayEnd) ? acc + Math.abs(Number(t.amount)) : acc;
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

        // Dia da semana (S, S, D, S, T, Q, Q) baseado na data real
        const dayOfWeek = dayDate.getDay(); // 0=Dom, 1=Seg...
        const dayLabel = weekdayAbbrev[dayOfWeek];
        
        // Data formatada como DD/MM
        const day = dayDate.getDate().toString().padStart(2, '0');
        const month = (dayDate.getMonth() + 1).toString().padStart(2, '0');
        const dateLabel = `${day}/${month}`;

        return { day: dayLabel, date: dateLabel, status };
      });

      setChallenge({
        id: activeChallenge.id,
        title: activeChallenge.title,
        description: activeChallenge.description || undefined,
        category: 'custom',
        currentAmount: totalSpent,
        targetAmount: activeChallenge.target_amount,
        averageSpent: activeChallenge.average_spent || 0,
        savingTarget: activeChallenge.saving_target || 0,
        weekProgress: progress as any
      });

    } catch (error) {
      console.error('Erro geral no hook:', error);
    } finally {
      setLoading(false);
    }
  };

  // Função para criar um novo desafio
  const createChallenge = async (data: {
    title: string;
    description?: string;
    target_amount: number;
    category_id: string;
    start_date: Date;
  }) => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Usuário não logado');

    const end_date = new Date(data.start_date);
    end_date.setDate(end_date.getDate() + 6); // 1 semana

    const { error } = await supabase.from('weekly_challenges').insert({
      user_id: user.id,
      title: data.title,
      description: data.description || null,
      category_id: data.category_id,
      target_amount: data.target_amount,
      average_spent: 0,
      saving_target: 0,
      start_date: data.start_date.toISOString(),
      end_date: end_date.toISOString()
    });

    if (error) throw error;
    await fetchChallenge(); // Recarrega o desafio ativo
  };

  useEffect(() => {
    fetchChallenge();
  }, []);

  return { challenge, loading, refetch: fetchChallenge, createChallenge };
}