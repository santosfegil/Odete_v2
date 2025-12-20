import React, { useEffect, useState } from 'react';
import { ArrowLeft, CheckCircle2, XCircle, TrendingUp, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface HistoryItem {
  month: number;
  year: number;
  invested: number;
  goal: number;
  hit: boolean;
}

export const InvestmentHistoryModal: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Pegar Categoria Investimento
      const { data: cats } = await supabase.from('categories').select('id').ilike('name', '%Investimento%').limit(1);
      const catId = cats?.[0]?.id;

      if (!catId) return;

      // 2. Buscar transações dos últimos 6 meses
      const today = new Date();
      const sixMonthsAgo = new Date(today.getFullYear(), today.getMonth() - 5, 1);
      
      const { data: transactions } = await supabase
        .from('transactions')
        .select('amount, date')
        .eq('user_id', user.id)
        .eq('category_id', catId)
        .gte('date', sixMonthsAgo.toISOString());

      // 3. Buscar Budgets dos últimos 6 meses
      const { data: budgets } = await supabase
        .from('budgets')
        .select('amount_limit, month, year')
        .eq('user_id', user.id)
        .eq('category_id', catId);

      // 4. Consolidar dados em memória (Frontend processing)
      const consolidated: Record<string, HistoryItem> = {};

      // Inicializa os últimos 6 meses
      for (let i = 0; i < 6; i++) {
        const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
        const key = `${d.getMonth() + 1}/${d.getFullYear()}`;
        consolidated[key] = {
          month: d.getMonth() + 1,
          year: d.getFullYear(),
          invested: 0,
          goal: 0,
          hit: false
        };
      }

      // Soma Transações
      transactions?.forEach(t => {
        const d = new Date(t.date);
        const key = `${d.getMonth() + 1}/${d.getFullYear()}`;
        if (consolidated[key]) {
          consolidated[key].invested += t.amount;
        }
      });

      // Aplica Metas
      budgets?.forEach(b => {
        const key = `${b.month}/${b.year}`;
        if (consolidated[key]) {
          consolidated[key].goal = b.amount_limit;
        }
      });

      // Verifica Hits e converte para array
      const finalArray = Object.values(consolidated).map(item => ({
        ...item,
        hit: item.invested >= item.goal && item.goal > 0
      })).sort((a, b) => (b.year * 100 + b.month) - (a.year * 100 + a.month));

      setHistory(finalArray);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];

  return (
    <div className="fixed inset-0 bg-stone-50 dark:bg-stone-900 z-[50] flex flex-col animate-in slide-in-from-right duration-300">
      
      <div className="p-6 flex items-center gap-4 bg-white dark:bg-stone-800 shadow-sm z-10">
        <button onClick={onClose} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-full transition-colors">
          <ArrowLeft size={24} className="text-stone-900 dark:text-white" />
        </button>
        <h2 className="text-xl font-bold text-stone-900 dark:text-white">Histórico de Aportes</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {loading ? <div className="text-center p-10 text-stone-400">Carregando histórico...</div> : (
          history.map((item) => (
            <div key={`${item.month}-${item.year}`} className="bg-white dark:bg-stone-800 p-5 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-700 flex justify-between items-center">
              
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-full ${item.hit ? 'bg-emerald-100 text-emerald-600' : 'bg-stone-100 text-stone-400'}`}>
                  {item.hit ? <CheckCircle2 size={24} /> : <Calendar size={24} />}
                </div>
                <div>
                  <h3 className="font-bold text-stone-900 dark:text-white capitalize">
                    {monthNames[item.month - 1]} <span className="text-xs text-stone-400 font-normal">{item.year}</span>
                  </h3>
                  <div className="flex items-center gap-2 text-xs mt-1">
                    <span className="text-stone-500">Meta: <b>R$ {item.goal.toLocaleString('pt-BR')}</b></span>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className={`block text-lg font-extrabold ${item.hit ? 'text-emerald-600' : 'text-stone-900 dark:text-white'}`}>
                  R$ {item.invested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
                {!item.hit && item.goal > 0 && (
                  <span className="text-[10px] text-red-400 font-bold flex items-center justify-end gap-1">
                    <XCircle size={10} /> Faltou R$ {(item.goal - item.invested).toLocaleString('pt-BR')}
                  </span>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};