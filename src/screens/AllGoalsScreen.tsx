import React, { useEffect, useState } from 'react';
import { ArrowLeft, Plus, Umbrella, Check, Link } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { EditGoalModal } from '../components/EditGoalModal'; // Importe o novo componente

interface AllGoalsScreenProps {
  onBack: () => void;
  onCreateGoal: () => void;
}

interface GoalItem {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  progress: number;
  is_automated: boolean;
  linked_account_name?: string;
}

export default function AllGoalsScreen({ onBack, onCreateGoal }: AllGoalsScreenProps) {
  const [goals, setGoals] = useState<GoalItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Estado para controlar qual meta está sendo editada
  const [selectedGoal, setSelectedGoal] = useState<GoalItem | null>(null);

  const fetchGoals = async () => {
    // setLoading(true); // Opcional: se quiser spinner a cada refresh
    try {
      const { data, error } = await supabase.rpc('get_goals_with_progress');
      if (error) throw error;
      setGoals(data || []);
    } catch (err) {
      console.error('Erro ao buscar metas:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGoals();
  }, []);

  const handleGoalUpdated = () => {
    // Recarrega a lista após edição ou exclusão
    fetchGoals();
  };

  return (
    <div className="relative flex-1 flex flex-col w-full h-full bg-stone-50 dark:bg-stone-900">
      
      <div className="sticky top-0 z-10 p-6 bg-stone-50 dark:bg-stone-900 flex items-center justify-between">
        <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors">
          <ArrowLeft size={24} className="text-stone-800 dark:text-stone-200" />
        </button>
        <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">Minhas Metas</h1>
        <div className="w-8"></div>
      </div>

      <main className="flex-1 overflow-y-auto p-6 pt-0 pb-32 space-y-4">
        {loading ? (
          <p className="text-center text-stone-500 mt-10">Carregando suas conquistas...</p>
        ) : goals.length === 0 ? (
          <div className="text-center mt-10 opacity-60">
            <Umbrella size={48} className="mx-auto mb-4 text-stone-400" />
            <p className="text-stone-600">Nenhuma meta ainda.</p>
            <p className="text-sm text-stone-400">Que tal planejar a próxima viagem?</p>
          </div>
        ) : (
          goals.map((goal) => (
            <button
              key={goal.id}
              onClick={() => setSelectedGoal(goal)} // Abre o modal ao clicar
              className="w-full text-left p-5 bg-white dark:bg-stone-800 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-700 relative overflow-hidden transition-transform active:scale-[0.98]"
            >
              {goal.is_automated && (
                <div className="absolute top-4 right-4 text-emerald-500 bg-emerald-50 dark:bg-emerald-900/30 px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1">
                  <Link size={10} />
                  AUTO
                </div>
              )}

              <div className="flex items-center gap-4 mb-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${
                  goal.progress >= 100 
                    ? 'bg-emerald-500 text-white' 
                    : 'bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600'
                }`}>
                  {goal.progress >= 100 ? <Check size={24} /> : <Umbrella size={24} />}
                </div>
                <div>
                  <h2 className="font-bold text-stone-900 dark:text-white text-lg leading-tight">{goal.title}</h2>
                  {goal.is_automated && (
                    <p className="text-xs text-stone-400 mt-1">Vinculado a: {goal.linked_account_name}</p>
                  )}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm font-medium">
                  <span className="text-stone-500 dark:text-stone-400">
                    {goal.progress.toFixed(0)}% concluído
                  </span>
                  <span className="text-stone-900 dark:text-stone-200">
                    R$ {goal.current_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-stone-400">/ {goal.target_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</span>
                  </span>
                </div>
                
                <div className="h-3 w-full bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
                    style={{ width: `${Math.min(goal.progress, 100)}%` }}
                  />
                </div>
              </div>
            </button>
          ))
        )}
      </main>

      <div className="absolute bottom-8 right-6 flex flex-col items-center gap-2 pointer-events-none">
        <span className="text-sm font-medium text-stone-500 dark:text-stone-400 shadow-sm bg-white/80 dark:bg-black/50 px-2 py-1 rounded-lg backdrop-blur-sm">
          Nova Meta
        </span>
        <button
          onClick={onCreateGoal}
          className="pointer-events-auto w-16 h-16 bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 rounded-full flex items-center justify-center shadow-xl hover:scale-105 transition-transform"
        >
          <Plus size={32} />
        </button>
      </div>

      {/* Renderização do Modal de Edição */}
      {selectedGoal && (
        <EditGoalModal 
          goal={selectedGoal} 
          onClose={() => setSelectedGoal(null)} 
          onSuccess={handleGoalUpdated}
        />
      )}
    </div>
  );
}