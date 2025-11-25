import { ChevronLeft, ChevronLeft as ArrowLeft, ChevronRight, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface MonthData {
  month_label: string;
  year_num: number;
  month_num: number;
  total_spent: number;
  total_budget: number;
  status: 'success' | 'warning';
}

interface SpendingHistoryScreenProps {
  onBack: () => void;
}

export default function SpendingHistoryScreen({ onBack }: SpendingHistoryScreenProps) {
  const [history, setHistory] = useState<MonthData[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const loadHistory = async () => {
      try {
        const { data, error } = await supabase.rpc('get_spending_history');
        if (error) throw error;
        setHistory(data || []);
      } catch (err) {
        console.error('Erro ao carregar histórico:', err);
      } finally {
        setLoading(false);
      }
    };
    loadHistory();
  }, []);

  const handlePrevious = () => setCurrentIndex((prev) => Math.max(0, prev - 1));
  const handleNext = () => setCurrentIndex((prev) => Math.min(history.length - 1, prev + 1));

  if (loading) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center">
        <Loader2 className="animate-spin text-emerald-500" />
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="min-h-screen bg-stone-50 p-6">
        <header className="flex items-center mb-6">
          <button onClick={onBack} className="p-2 hover:bg-stone-200 rounded-full"><ChevronLeft /></button>
          <h1 className="font-bold ml-2">Histórico</h1>
        </header>
        <p className="text-center text-stone-500">Ainda não há histórico de gastos.</p>
      </div>
    );
  }

  const currentData = history[currentIndex];
  const progress = currentData.total_budget > 0 
    ? Math.min((currentData.total_spent / currentData.total_budget) * 100, 100) 
    : 0;

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-white pb-8">
      <header className="bg-white dark:bg-stone-900 p-4 flex items-center shadow-sm sticky top-0 z-10">
        <button onClick={onBack} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors">
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold ml-2">Histórico de Gastos</h1>
      </header>

      <div className="p-6 space-y-6">
        <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 shadow-sm">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold">{currentData.month_label} <span className="text-sm text-stone-400">{currentData.year_num}</span></h2>
            <div className="flex gap-2">
              <button onClick={handleNext} disabled={currentIndex === history.length - 1} className="p-2 bg-stone-100 dark:bg-stone-800 rounded-full disabled:opacity-50">
                <ArrowLeft size={20} />
              </button>
              <button onClick={handlePrevious} disabled={currentIndex === 0} className="p-2 bg-stone-100 dark:bg-stone-800 rounded-full disabled:opacity-50">
                <ChevronRight size={20} />
              </button>
            </div>
          </div>

          <p className="text-stone-600 dark:text-stone-400 text-sm mb-4">
            {currentData.status === 'success' 
              ? 'Excelente! Você ficou dentro do orçamento.' 
              : 'Atenção: Você ultrapassou seu limite planejado.'}
          </p>

          <div className="flex justify-between items-center text-sm font-semibold mb-2">
            <span>R$ {currentData.total_spent.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
            <span className="text-stone-400">Meta: R$ {currentData.total_budget.toLocaleString('pt-BR', {minimumFractionDigits: 2})}</span>
          </div>

          <div className="w-full bg-stone-200 dark:bg-stone-800 rounded-full h-2 mb-6">
            <div
              className={`h-2 rounded-full transition-all ${currentData.status === 'success' ? 'bg-emerald-400' : 'bg-yellow-400'}`}
              style={{ width: `${progress}%` }}
            ></div>
          </div>
        </div>
      </div>
    </div>
  );
}