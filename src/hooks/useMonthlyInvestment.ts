import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

export function useMonthlyInvestment() {
  const [data, setData] = useState({
    currentInvested: 0,
    monthlyGoal: 0,
    loading: true
  });

  const fetchData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const date = new Date();
      const firstDay = new Date(date.getFullYear(), date.getMonth(), 1).toISOString();
      const nextMonth = new Date(date.getFullYear(), date.getMonth() + 1, 1).toISOString();

      // 1. Buscar ID da categoria "Investimento"
      // Usando ILIKE para garantir que pegue variações de nome conforme solicitado
      const { data: categories } = await supabase
        .from('categories')
        .select('id')
        .ilike('name', '%Investimento%') 
        .limit(1);

      if (!categories || categories.length === 0) {
        setData(prev => ({ ...prev, loading: false }));
        return;
      }
      const catId = categories[0].id;

      // 2. Somar transações dessa categoria no mês atual
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount')
        .eq('user_id', user.id)
        .eq('category_id', catId)
        .gte('date', firstDay)
        .lt('date', nextMonth);

      const totalInvested = transactions?.reduce((sum, t) => sum + t.amount, 0) || 0;

      // 3. Buscar a Meta (Budget)
      const { data: budget } = await supabase
        .from('budgets')
        .select('amount_limit')
        .eq('user_id', user.id)
        .eq('category_id', catId)
        .eq('month', date.getMonth() + 1)
        .eq('year', date.getFullYear())
        .maybeSingle();

      setData({
        currentInvested: totalInvested,
        monthlyGoal: budget?.amount_limit || 0, // Se não tiver meta, assume 0
        loading: false
      });

    } catch (error) {
      console.error('Erro hook investimento:', error);
      setData(prev => ({ ...prev, loading: false }));
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return { ...data, refetch: fetchData };
}