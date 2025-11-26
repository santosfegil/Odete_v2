import React, { useState, useEffect } from 'react';
import { ArrowLeft, Save, Loader2 } from 'lucide-react'; // Ícones
import { BudgetCategoryCard } from '../components/BudgetCategoryCard';
import { BudgetCategory } from '../types';
import { supabase } from '../lib/supabase';

interface BudgetScreenProps {
  onBack: () => void;
}

export const BudgetScreen: React.FC<BudgetScreenProps> = ({ onBack }) => {
  const [categories, setCategories] = useState<BudgetCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  // Buscar dados do banco
  useEffect(() => {
    const fetchBudgets = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase.rpc('get_budget_summary', {
          p_month: currentMonth,
          p_year: currentYear
        });

        if (error) throw error;

        // Mapear o retorno do SQL para o tipo BudgetCategory do frontend
        const mappedCategories: BudgetCategory[] = (data || []).map((item: any) => ({
          id: item.category_id,
          name: item.category_name,
          icon: item.category_icon || 'category', // Ícone padrão se vier nulo
          budget: item.budget_limit,
          spent: item.spent_amount,
          remaining: item.budget_limit - item.spent_amount
        }));

        setCategories(mappedCategories);
      } catch (err) {
        console.error('Erro ao carregar orçamentos:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchBudgets();
  }, []);

  const handleBudgetChange = (id: string, newBudget: number) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === id
          ? { ...cat, budget: newBudget, remaining: newBudget - cat.spent }
          : cat
      )
    );
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const user = (await supabase.auth.getUser()).data.user;
      if (!user) return;

      // Prepara os dados para salvar na tabela 'budgets'
      const budgetsToUpsert = categories.map(cat => ({
        user_id: user.id,
        category_id: cat.id,
        amount_limit: cat.budget,
        month: currentMonth,
        year: currentYear
      }));

      // Upsert: Atualiza se existir (mesmo user/cat/mes/ano), cria se não existir
      // Para o upsert funcionar, é ideal ter uma constraint unique no banco (user_id, category_id, month, year)
      // Mas faremos um loop simples para garantir neste MVP caso não tenha a constraint configurada:
      
      // Opção segura: Delete antigos desse mês e insira os novos
      // (Ou use upsert se tiver certeza da constraint UNIQUE)
      
      // Vamos usar upsert assumindo que a tabela budgets tem constraints, 
      // mas vou usar uma query que deleta e insere para garantir sem erros de constraint complexa agora.
      
      const { error } = await supabase.from('budgets').upsert(
        budgetsToUpsert, 
        { onConflict: 'user_id, category_id, month, year' } 
      );

      // Se der erro de constraint no upsert acima, o ideal é criar a constraint no banco:
      // ALTER TABLE budgets ADD CONSTRAINT unique_budget_per_month UNIQUE (user_id, category_id, month, year);
      
      if (error) {
        // Fallback: Se der erro no upsert, tentamos deletar e inserir (mais lento, mas seguro)
        console.warn("Tentando fallback de delete/insert...", error);
        await supabase.from('budgets').delete().match({ user_id: user.id, month: currentMonth, year: currentYear });
        await supabase.from('budgets').insert(budgetsToUpsert);
      }

      onBack(); // Volta para a home e o FinanceCard deve atualizar
    } catch (err) {
      console.error('Erro ao salvar:', err);
      alert('Erro ao salvar orçamento');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto flex h-screen max-w-md flex-col bg-stone-50 dark:bg-stone-950">
      <header className="flex items-center justify-between p-6 pb-2 sticky top-0 bg-stone-50 dark:bg-stone-950 z-10">
        <button
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-full text-stone-600 hover:bg-stone-200/60 dark:text-stone-300 dark:hover:bg-stone-800/60 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-stone-900 dark:text-white">Definir Orçamento</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-grow overflow-y-auto px-6 pt-4 pb-32 custom-scrollbar">
        {loading ? (
          <div className="flex justify-center mt-20">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : categories.length === 0 ? (
          <div className="text-center mt-10 text-stone-500">
            Nenhuma categoria de despesa encontrada.
          </div>
        ) : (
          <div className="space-y-4">
            {categories.map((category) => (
              <BudgetCategoryCard
                key={category.id}
                category={category}
                onBudgetChange={handleBudgetChange}
              />
            ))}
          </div>
        )}
      </main>

      <footer className="p-6 fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-gradient-to-t from-stone-50 via-stone-50 to-transparent dark:from-stone-950 dark:via-stone-950">
        <button
          onClick={handleSave}
          disabled={saving || loading}
          className="w-full rounded-full bg-stone-900 py-4 text-center font-bold text-white transition-all hover:bg-stone-800 active:scale-[0.98] disabled:opacity-70 dark:bg-emerald-600 dark:hover:bg-emerald-500 shadow-xl flex items-center justify-center gap-2"
        >
          {saving ? (
            <>Salavando...</>
          ) : (
            'Salvar Orçamento'
          )}
        </button>
      </footer>
    </div>
  );
};

export default BudgetScreen;