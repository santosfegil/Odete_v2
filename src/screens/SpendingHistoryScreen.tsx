import { ChevronLeft, ChevronRight, ArrowLeft, Calendar } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface SpendingHistoryScreenProps {
  onBack: () => void;
}

interface YearData {
  year: number;
  total_invested: number;
  monthly_goal: number;
  history: {
    month_num: number;
    total: number;
    status: 'success' | 'warning' | 'future' | 'empty';
  }[];
}

const MONTH_NAMES = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];

export default function SpendingHistoryScreen({ onBack }: SpendingHistoryScreenProps) {
  const actualYear = new Date().getFullYear();
  const [currentYear, setCurrentYear] = useState(actualYear);
  const [data, setData] = useState<YearData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      setLoading(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Usuário não autenticado');

        // Buscar dados mensais consolidados diretamente da tabela
        const { data: monthlyData, error } = await supabase
          .from('monthly_consolidated')
          .select('period_month, total_investment')
          .eq('user_id', user.id)
          .eq('period_year', currentYear)
          .order('period_month', { ascending: true });

        if (error) throw error;

        // Calcular total investido no ano
        const yearTotal = monthlyData?.reduce((sum, row) => sum + (row.total_investment || 0), 0) || 0;

        // Buscar todos os budgets de investimento para o ano (categorias com scope = 'investment')
        const { data: budgetsData } = await supabase
          .from('budgets')
          .select('amount_limit, month, categories!inner(scope)')
          .eq('user_id', user.id)
          .eq('categories.scope', 'investment')
          .eq('year', currentYear);

        // Construir histórico mensal
        const currentMonth = new Date().getMonth() + 1;

        const history = MONTH_NAMES.map((_, index) => {
          const monthNum = index + 1;

          // Total investido neste mês (de monthly_consolidated)
          const monthData = monthlyData?.find(m => m.period_month === monthNum);
          const total = monthData?.total_investment || 0;

          // Meta do mês = soma de todos os budgets de investimento para este mês
          const monthBudgets = budgetsData?.filter(b => b.month === monthNum) || [];
          const monthlyGoal = monthBudgets.reduce((sum, b) => sum + (b.amount_limit || 0), 0);

          let status: 'success' | 'warning' | 'future' | 'empty';
          if (currentYear > actualYear || (currentYear === actualYear && monthNum > currentMonth)) {
            status = 'future';
          } else if (total >= monthlyGoal && monthlyGoal > 0) {
            status = 'success';       // 🟢 Meta batida: investiu >= meta
          } else if (total > 0) {
            status = 'warning';       // 🟡 Parcial: investiu algo, mas < meta
          } else {
            status = 'empty';         // Cinza: não investiu nada
          }

          return { month_num: monthNum, total, status };
        });

        // Meta mensal geral (para exibição, usar a soma do mês atual ou média)
        const currentMonthBudgets = budgetsData?.filter(b => b.month === currentMonth) || [];
        const displayMonthlyGoal = currentMonthBudgets.reduce((sum, b) => sum + (b.amount_limit || 0), 0);

        setData({
          year: currentYear,
          total_invested: yearTotal,
          monthly_goal: displayMonthlyGoal,
          history
        });

      } catch (err) {
        console.error('Erro ao buscar histórico:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchHistory();
  }, [currentYear, actualYear]);

  const handlePrevious = () => setCurrentYear(prev => prev - 1);
  const handleNext = () => setCurrentYear(prev => prev + 1);
  const handleBackToCurrent = () => setCurrentYear(actualYear);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-emerald-500 text-white hover:bg-emerald-600 border-none shadow-md shadow-emerald-200 dark:shadow-none';
      case 'warning':
        return 'bg-amber-400 text-white hover:bg-amber-500 border-none shadow-md shadow-amber-200 dark:shadow-none';
      case 'future':
        return 'bg-stone-50 text-stone-300 dark:bg-stone-800/50 dark:text-stone-600 border border-stone-100 dark:border-stone-800 cursor-default';
      default:
        return 'bg-stone-100 text-stone-400 dark:bg-stone-800 dark:text-stone-500 border border-stone-200 dark:border-stone-700';
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-white pb-24 flex flex-col">
      <header className="bg-stone-50 dark:bg-stone-950 p-6 flex items-center sticky top-0 z-10">
        <button
          onClick={onBack}
          className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-xl font-bold text-stone-900 dark:text-white absolute left-1/2 -translate-x-1/2 whitespace-nowrap">
          Histórico de investimentos
        </h1>
        <div className="w-8"></div>
      </header>

      <div className="p-6 space-y-6 flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center mt-20">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-emerald-500"></div>
          </div>
        ) : (
          <div className="bg-white dark:bg-stone-900 rounded-[2rem] p-6 shadow-sm border border-stone-100 dark:border-stone-800 relative">

            {/* Header do Ano + Navegação */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-4xl font-extrabold tracking-tight text-stone-900 dark:text-white">{currentYear}</h2>

                {currentYear !== actualYear && (
                  <button
                    onClick={handleBackToCurrent}
                    className="flex items-center gap-1 p-1.5 bg-emerald-50 dark:bg-emerald-900/30 rounded-lg text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition-all animate-in fade-in zoom-in"
                    title="Voltar para o ano atual"
                  >
                    <Calendar size={12} />
                    Atual
                  </button>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={handlePrevious}
                  className="w-10 h-10 flex items-center justify-center bg-stone-100 dark:bg-stone-800 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors text-stone-600 dark:text-stone-300"
                >
                  <ChevronLeft size={20} />
                </button>
                <button
                  onClick={handleNext}
                  className="w-10 h-10 flex items-center justify-center bg-stone-100 dark:bg-stone-800 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors text-stone-600 dark:text-stone-300"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            {/* Texto Descritivo */}
            <div className="mb-8">
              <p className="text-emerald-600 dark:text-emerald-400 text-3xl font-bold tracking-tight">
                R$ {(data?.total_invested ?? 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              <p className="text-stone-500 dark:text-stone-400 text-sm font-medium mt-1">
                Total investido em {currentYear}
              </p>
            </div>

            {/* Grid de Meses */}
            <div className="grid grid-cols-4 gap-3">
              {MONTH_NAMES.map((name, index) => {
                const monthData = data?.history.find(h => h.month_num === index + 1);
                const status = monthData?.status || 'empty';
                const total = monthData?.total || 0;

                return (
                  <div
                    key={index}
                    className={`
                      aspect-[4/3] flex flex-col items-center justify-center rounded-2xl text-xs font-bold transition-all
                      ${getStatusStyle(status)}
                    `}
                  >
                    <span className="text-xs font-bold">{name}</span>
                    {total > 0 && (
                      <span className="text-[9px] font-semibold opacity-80 mt-0.5">
                        {total.toLocaleString('pt-BR', { notation: 'compact' })}
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Legenda */}
            <div className="mt-8 flex gap-6 justify-center text-[10px] text-stone-500 dark:text-stone-400 font-bold  tracking-wide">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> Meta batida
              </div>
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-amber-400"></div> Parcial
              </div>
            </div>

          </div>
        )}
      </div>
    </div>
  );
}