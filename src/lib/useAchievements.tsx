import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { Medal, Achievement } from '../types';

export function useAchievements() {
  const [medals, setMedals] = useState<Medal[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAchievements = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // 1. Buscar todas as medalhas possíveis (Regras do jogo)
      const { data: allAchievements, error: errorAch } = await supabase
        .from('achievements')
        .select('*');

      if (errorAch) throw errorAch;

      // 2. Buscar medalhas que o usuário já tem (se estiver logado)
      let userAchievements: any[] = [];
      if (user) {
        const { data: ua, error: errorUser } = await supabase
          .from('user_achievements')
          .select('achievement_id, earned_at')
          .eq('user_id', user.id);
          
        if (!errorUser && ua) userAchievements = ua;
      }

      // 3. Cruzar os dados (Merge)
      const myEarnedIds = new Set(userAchievements.map(ua => ua.achievement_id));
      
      const mergedData: Medal[] = (allAchievements as Achievement[]).map(achievement => ({
        ...achievement,
        earned: myEarnedIds.has(achievement.id),
        earned_at: userAchievements.find(ua => ua.achievement_id === achievement.id)?.earned_at
      }));

      setMedals(mergedData);
    } catch (error) {
      console.error('Erro ao buscar medalhas:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAchievements();
  }, []);

  // Helpers para filtrar facilmente nas telas
  const earnedMedals = medals.filter(m => m.earned);
  
  return { medals, earnedMedals, loading, refetch: fetchAchievements };
}