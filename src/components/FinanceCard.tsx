import React, { useState, useEffect, useCallback } from 'react';
import { ArrowRight,ChevronLeft, ChevronRight, Loader2, Calendar, Settings } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { DashboardData } from '../types';
import { BudgetModal } from './BudgetModal';

export const FinanceCard: React.FC = () => {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showBudgetModal, setShowBudgetModal] = useState(false);


  interface DashboardData {
    budget: number;
    income: number;
    spent: number;
    owed: number;
    invested: number;
  }

  const today = new Date();
  const isCurrentMonth = 
    currentDate.getMonth() === today.getMonth() && 
    currentDate.getFullYear() === today.getFullYear();

  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleBackToCurrent = () => {
    setCurrentDate(new Date());
  };

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const { data: result, error } = await supabase.rpc('get_finance_dashboard_data', {
        p_month: currentDate.getMonth() + 1,
        p_year: currentDate.getFullYear()
      });

      if (error) throw error;
      setData(result as DashboardData);
    } catch (err) {
      console.error('Erro ao carregar card:', err);
    } finally {
      setLoading(false);
    }
  }, [currentDate]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Cálculos
  const year = currentDate.getFullYear();
  const monthIndex = currentDate.getMonth();
  const lastDayOfMonth = new Date(year, monthIndex + 1, 0).getDate();
  const monthName = currentDate.toLocaleString('pt-BR', { month: 'long' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  const daysLeft = isCurrentMonth ? Math.max(0, lastDayOfMonth - today.getDate()) : 0;

  // Lógica Financeira
  const totalOutflows = (data?.spent || 0) + (data?.owed || 0) + (data?.invested || 0);
  const available = Math.max(0, (data?.budget || 0) - totalOutflows);
  const dailyAvailable = daysLeft > 0 ? available / daysLeft : 0;

  const budgetSafe = data?.budget || 1;
  const spentPct = ((data?.spent || 0) / budgetSafe) * 100;
  const owedPct = ((data?.owed || 0) / budgetSafe) * 100;
  const investedPct = ((data?.invested || 0) / budgetSafe) * 100;

  const toMoney = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });
  const hasData = (data?.budget || 0) > 0 || (data?.income || 0) > 0 || totalOutflows > 0;

  return (
    <>
      <div className="rounded-3xl bg-emerald-100 dark:bg-emerald-900/40 p-6 text-stone-900 dark:text-stone-100 shadow-lg transition-all min-h-[440px] flex flex-col justify-between relative">
        

      <div className="flex items-center justify-between mb-4">
  <h2 className="text-lg font-bold text-stone-900 dark:text-white">
    Orçamento
  </h2>
  
  <button
    className="bg-stone-900 dark:bg-stone-700 text-white text-[10px] font-bold py-1.5 px-3 rounded-full flex items-center hover:bg-stone-800 transition-colors"
  >
    Ver gastos
    <ArrowRight size={12} className="ml-1" />
  </button>
</div>
        {/* Cabeçalho */}
        <div>
          <div className="grid grid-cols-3 items-center mb-1 relative">
            
            {/* Esquerda: Botão Voltar para Hoje */}
            <div className="justify-self-start flex flex-col">
              {!isCurrentMonth && (
                <button 
                  onClick={handleBackToCurrent} // CORRIGIDO: Volta a data, não abre modal
                  className="flex items-center gap-1 p-1.5 bg-white/50 dark:bg-black/20 rounded-lg text-xs font-bold text-emerald-700 dark:text-emerald-400 hover:bg-white/80 transition-all"
                  title="Voltar para hoje"
                >
                  <Calendar size={12} />
                  Atual
                </button>
              )}
            </div>

            {/* Centro: Navegação de Mês */}
            <div className="flex items-center justify-center gap-4 justify-self-center">
              <button onClick={handlePrevMonth} className="p-2 text-stone-500 rounded-full dark:text-stone-400 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition-colors">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <div className="mx-4 text-center min-w-[100px]">
                <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200 leading-tight">
                  {capitalizedMonth}
                </h2>
              </div>
              <button onClick={handleNextMonth} className="p-2 text-stone-500 rounded-full dark:text-stone-400 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition-colors">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>

            {/* Direita: Configurações (Abre Modal) */}
            <div className="justify-self-end flex items-center gap-1">
              <button 
                onClick={() => setShowBudgetModal(true)} // CORRIGIDO: Agora abre o modal certo
                className="p-2 text-stone-500 rounded-full dark:text-stone-400 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition-colors"
              >
                <Settings className="w-5 h-5" />
              </button>
            </div>
          </div>
          <p className="text-center text-xs text-stone-500 dark:text-stone-400 font-medium mb-4">
            1 - {lastDayOfMonth}
          </p>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
          </div>
        ) : !hasData ? (
          <div className="flex-1 flex flex-col items-center justify-center text-stone-500 opacity-80">
            <p className="font-medium">Sem dados esse mês</p>
          </div>
        ) : (
          <>
            <div className="my-2 text-center">
              <p className="mt-1 text-4xl font-extrabold tracking-tight text-stone-900 dark:text-white">
                {toMoney(available)}
              </p>
              <p className="mt-2 text-xs font-medium text-stone-500 dark:text-stone-400 max-w-[220px] mx-auto leading-relaxed">
                disponíveis dos <strong> {toMoney(data?.budget || 0)}</strong> de gasto esperado
              </p>
            </div>

            <div className="space-y-3 mt-4">
              <div className="flex justify-between text-sm text-stone-600 dark:text-stone-400 font-medium items-end">
                <span className="text-xs">{daysLeft} dias para o fim do mês</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  {toMoney(dailyAvailable)} / dia
                </span>
              </div>
              
              <div className="h-2.5 w-full rounded-full bg-stone-300 dark:bg-stone-700 overflow-hidden flex">
                <div className="h-full bg-emerald-500" style={{ width: `${spentPct}%` }} />
                <div className="h-full bg-amber-400" style={{ width: `${owedPct}%` }} />
                <div className="h-full bg-indigo-500" style={{ width: `${investedPct}%` }} />
              </div>

              <div className="space-y-1.5 text-xs pt-1">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="mr-2 h-2 w-2 rounded-full bg-emerald-500"></span>
                    <span className="text-stone-600 dark:text-stone-300">Gasto</span>
                  </div>
                  <span className="font-semibold text-stone-800 dark:text-stone-200">
                    {toMoney(data?.spent || 0)}
                  </span>
                </div>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="mr-2 h-2 w-2 rounded-full bg-amber-400"></span>
                    <span className="text-stone-600 dark:text-stone-300">Devido</span>
                  </div>
                  <span className="font-semibold text-stone-800 dark:text-stone-200">
                    {toMoney(data?.owed || 0)}
                  </span>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <span className="mr-2 h-2 w-2 rounded-full bg-indigo-500"></span>
                    <span className="text-stone-600 dark:text-stone-300">Investido</span>
                  </div>
                  <span className="font-semibold text-stone-800 dark:text-stone-200">
                    {toMoney(data?.invested || 0)}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-1 mt-1 border-t border-stone-300/50 dark:border-stone-700/50">
                  <span className="text-stone-700 dark:text-stone-200 font-bold ml-4">Total</span>
                  <span className="font-bold text-stone-900 dark:text-white">
                    {toMoney(totalOutflows)}
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-4">
              <div className="rounded-2xl bg-white/70 p-3 text-center dark:bg-stone-800/50 shadow-sm">
                <p className="text-[10px] tracking-wider text-stone-500 dark:text-stone-400 font-bold mb-1">
                  Entradas
                </p>
                <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                  {toMoney(data?.income || 0)}
                </p>
              </div>
              <div className="rounded-2xl bg-white/70 p-3 text-center dark:bg-stone-800/50 shadow-sm">
                <p className="text-[10px] tracking-wider text-stone-500 dark:text-stone-400 font-bold mb-1">
                  Saídas
                </p>
                <p className="text-base font-bold text-yellow-600 dark:text-red-400">
                  {toMoney(totalOutflows)}
                </p>
              </div>
            </div>
          </>
        )}
      </div>

      {showBudgetModal && (
        <BudgetModal
          onClose={() => setShowBudgetModal(false)}
          onSuccess={() => {
            loadData(); // Atualiza os dados do card após salvar
          }}
          currentDate={currentDate}
        />
      )}
    </>
  );
};