import React, { useState, useEffect } from 'react';
import { X, Save, TrendingUp, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface InvestmentGoalModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

export const InvestmentGoalModal: React.FC<InvestmentGoalModalProps> = ({ onClose, onSuccess }) => {
  const [amount, setAmount] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [categoryId, setCategoryId] = useState<string | null>(null);

  useEffect(() => {
    fetchCurrentGoal();
  }, []);

  const fetchCurrentGoal = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Achar a categoria de Investimento (Conforme pedido: Name = Investimento)
      // Nota: Idealmente usaríamos scope='investment', mas seguindo a spec do prompt:
      const { data: categories } = await supabase
        .from('categories')
        .select('id')
        .ilike('name', '%Investimento%') // Flexível para "Investimentos" ou "Investimento"
        .limit(1);

      if (categories && categories.length > 0) {
        const catId = categories[0].id;
        setCategoryId(catId);

        // 2. Buscar o budget atual para este mês
        const date = new Date();
        const { data: budget } = await supabase
          .from('budgets')
          .select('amount_limit')
          .eq('user_id', user.id)
          .eq('category_id', catId)
          .eq('month', date.getMonth() + 1)
          .eq('year', date.getFullYear())
          .maybeSingle();

        if (budget) {
          setAmount(budget.amount_limit.toString());
        }
      }
    } catch (error) {
      console.error('Erro ao buscar meta:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!categoryId) {
      alert('Categoria "Investimento" não encontrada no sistema. Crie-a primeiro.');
      return;
    }

    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const date = new Date();
      const numericAmount = parseFloat(amount.replace(',', '.')) || 0;

      // Upsert na tabela budgets
      const { error } = await supabase.from('budgets').upsert({
        user_id: user.id,
        category_id: categoryId,
        amount_limit: numericAmount,
        month: date.getMonth() + 1,
        year: date.getFullYear()
      }, { onConflict: 'user_id, category_id, month, year' });

      if (error) throw error;

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar meta.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
      <div className="bg-white dark:bg-stone-900 w-full max-w-sm rounded-[2rem] p-6 shadow-2xl border border-stone-200 dark:border-stone-800 animate-in fade-in zoom-in duration-200">
        
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-100 dark:bg-emerald-900/30 rounded-full text-emerald-600 dark:text-emerald-400">
              <TrendingUp size={24} />
            </div>
            <div>
              <h3 className="text-lg font-bold text-stone-900 dark:text-white">Meta de aporte</h3>
              <p className="text-xs text-stone-500">Quanto quer investir este mês?</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors">
            <X size={20} className="text-stone-500" />
          </button>
        </div>

        {loading ? (
          <div className="py-8 flex justify-center"><Loader2 className="animate-spin text-emerald-500" /></div>
        ) : (
          <div className="mb-8">
            <label className="text-xs font-bold text-stone-500  tracking-wider mb-2 block">Valor mensal</label>
            <div className="flex items-center gap-2 border-b-2 border-emerald-100 dark:border-emerald-900/50 focus-within:border-emerald-500 py-2 transition-colors">
              <span className="text-xl font-bold text-stone-400">R$</span>
              <input 
                type="number" 
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0,00"
                className="w-full bg-transparent text-3xl font-extrabold text-stone-900 dark:text-white outline-none placeholder:text-stone-200"
                autoFocus
              />
            </div>
          </div>
        )}

        <button 
          onClick={handleSave}
          disabled={saving || loading}
          className="w-full bg-stone-900 dark:bg-emerald-600 text-white py-4 rounded-xl font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 disabled:opacity-70"
        >
          {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
          Salvar meta
        </button>
      </div>
    </div>
  );
};