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
    const fetchData = async () => {
      setLoading(true);
      try {
        const { data: result, error } = await supabase.rpc('get_investment_summary', { 
          year_input: currentYear 
        });

        if (error) throw error;
        
        const historyData = result.history || [];

        setData({
          year: currentYear,
          total_invested: result.year_total || 0,
          monthly_goal: result.monthly_goal || 0,
          history: historyData
        });
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [currentYear]);

  const handlePrevious = () => setCurrentYear(prev => prev - 1);
  const handleNext = () => setCurrentYear(prev => prev + 1);
  const handleBackToCurrent = () => setCurrentYear(actualYear);

  const getStatusStyle = (status: string) => {
    switch (status) {
      case 'success':
        return 'bg-emerald-500 text-white hover:bg-emerald-600 border-none';
      case 'warning':
        return 'bg-amber-400 text-white hover:bg-amber-500 border-none';
      case 'future':
        return 'bg-stone-50 text-stone-300 dark:bg-stone-900 dark:text-stone-600 border border-stone-100 dark:border-stone-800';
      default: 
        return 'bg-stone-100 text-stone-500 dark:bg-stone-800 dark:text-stone-400 border border-stone-200 dark:border-stone-700';
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-white pb-24 flex flex-col">
      <header className="bg-white dark:bg-stone-900 p-4 flex items-center shadow-sm sticky top-0 z-10">
        <button
          onClick={onBack}
          className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors"
        >
          <ArrowLeft size={24} />
        </button>
        <h1 className="text-lg font-bold ml-2">Histórico de Investimentos</h1>
      </header>

      <div className="p-6 space-y-6 flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center mt-10 text-stone-500">Carregando...</div>
        ) : (
          <div className="bg-white dark:bg-stone-900 rounded-[2rem] p-6 shadow-sm border border-stone-100 dark:border-stone-800 relative">
            
            {/* Header do Ano + Navegação */}
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-4xl font-extrabold tracking-tight">{currentYear}</h2>
                
                {/* Botão "Atual" idêntico ao do FinanceCard */}
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
                  className="w-10 h-10 flex items-center justify-center bg-stone-100 dark:bg-stone-800 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                >
                  <ChevronLeft size={18} />
                </button>
                <button
                  onClick={handleNext}
                  className="w-10 h-10 flex items-center justify-center bg-stone-100 dark:bg-stone-800 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors"
                >
                  <ChevronRight size={18} />
                </button>
              </div>
            </div>

            {/* Texto Descritivo */}
            <p className="text-stone-600 dark:text-stone-300 text-sm mb-8 leading-relaxed font-medium">
              <strong className="text-emerald-600 text-xl dark:text-emerald-400 font-bold mr-1"> 
                 R$ {data?.total_invested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} 
              </strong>
              <div> é o seu valor investido em {currentYear}</div>
            </p>

            {/* Grid de Meses */}
            <div className="grid grid-cols-4 gap-3">
              {MONTH_NAMES.map((name, index) => {
                const monthStatus = data?.history.find(h => h.month_num === index + 1);
                const status = monthStatus ? monthStatus.status : 'empty';
                const total = monthStatus ? monthStatus.total : 0;

                return (
                  <div
                    key={index}
                    className={`
                      aspect-[4/3] flex items-center justify-center rounded-2xl text-xs font-bold transition-all
                      ${getStatusStyle(status)}
                    `}
                    title={`Investido: R$ ${total.toFixed(2)}`}
                  >
                    {name}
                  </div>
                );
              })}
            </div>

            {/* Legenda */}
            <div className="mt-8 flex gap-6 justify-center text-[10px] text-stone-500 dark:text-stone-400 font-bold">
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