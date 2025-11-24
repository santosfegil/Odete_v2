import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { DashboardData } from '../types';

interface FinanceCardProps {
  onShowBudget?: () => void;
}

export const FinanceCard: React.FC<FinanceCardProps> = ({ onShowBudget }) => {
  // Estado: Começa no mês atual
  const [currentDate, setCurrentDate] = useState(new Date());
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  // Navegação
  const handlePrevMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  // Fetch Data (Chama a RPC que criamos)
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { data: result, error } = await supabase.rpc('get_finance_dashboard_data', {
          p_month: currentDate.getMonth() + 1, // JS é 0-11, Postgres é 1-12
          p_year: currentDate.getFullYear()
        });

        if (error) throw error;
        setData(result as DashboardData);
      } catch (err) {
        console.error('Erro ao carregar card:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [currentDate]);

  // Cálculos de Data
  const year = currentDate.getFullYear();
  const monthIndex = currentDate.getMonth();
  const lastDayOfMonth = new Date(year, monthIndex + 1, 0).getDate();
  const monthName = currentDate.toLocaleString('pt-BR', { month: 'long' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);
  
  // Regra 5: Restam X dias (Baseado no dia atual vs último dia)
  const today = new Date();
  const isCurrentMonth = today.getMonth() === monthIndex && today.getFullYear() === year;
  const daysLeft = isCurrentMonth ? Math.max(0, lastDayOfMonth - today.getDate()) : 0;

  // Cálculos Financeiros
  const totalUsed = (data?.spent || 0) + (data?.owed || 0) + (data?.invested || 0);
  // Regra 4: Disponível = Orçamento - (Tudo que saiu ou está comprometido)
  const available = Math.max(0, (data?.budget || 0) - totalUsed);
  // Regra 4: Por dia
  const dailyAvailable = daysLeft > 0 ? available / daysLeft : 0;

  // Porcentagens para a barra
  const budgetSafe = data?.budget || 1; // Evita divisão por zero
  const spentPct = ((data?.spent || 0) / budgetSafe) * 100;
  const owedPct = ((data?.owed || 0) / budgetSafe) * 100;
  const investedPct = ((data?.invested || 0) / budgetSafe) * 100;

  // Formatter
  const toMoney = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // Regra 2: Verifica se tem dados
  const hasData = (data?.budget || 0) > 0 || (data?.income || 0) > 0 || totalUsed > 0;

  return (
    <div className="rounded-3xl bg-emerald-100 dark:bg-emerald-900/40 p-6 text-stone-900 dark:text-stone-100 shadow-lg transition-all min-h-[440px] flex flex-col justify-between">
      
      {/* Navegação e Datas (Regra 1 e 2) */}
      <div>
        <div className="flex items-center justify-center mb-1">
          <button onClick={handlePrevMonth} className="p-2 text-stone-500 rounded-full dark:text-stone-400 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="mx-4 text-center">
            <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200">
              {capitalizedMonth}
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              {year}
            </p>
          </div>
          <button onClick={handleNextMonth} className="p-2 text-stone-500 rounded-full dark:text-stone-400 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
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
          {/* Regra 3: Valores principais (Moeda correta) */}
          <div className="my-2 text-center">
            <p className="mt-1 text-4xl font-extrabold tracking-tight text-stone-900 dark:text-white">
              {toMoney(available)}
            </p>
            <p className="mt-2 text-xs font-medium text-stone-500 dark:text-stone-400 max-w-[220px] mx-auto leading-relaxed">
              disponíveis dos {toMoney(data?.budget || 0)} de orçamento
            </p>
          </div>

          {/* Barra de Progresso e Legendas */}
          <div className="space-y-3 mt-4">
            {/* Regra 4 e 5: Dias restantes e valor por dia */}
            <div className="flex justify-between text-sm text-stone-600 dark:text-stone-400 font-medium items-end">
              <span className="text-xs">Restam {daysLeft} dias</span>
              <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                {toMoney(dailyAvailable)} / dia
              </span>
            </div>
            
            <div className="h-2.5 w-full rounded-full bg-stone-300 dark:bg-stone-700 overflow-hidden flex">
              <div className="h-full bg-emerald-500" style={{ width: `${spentPct}%` }} />
              <div className="h-full bg-amber-400" style={{ width: `${owedPct}%` }} />
              <div className="h-full bg-indigo-500" style={{ width: `${investedPct}%` }} />
            </div>

            {/* Regra 6: Legenda Atualizada (Gasto, Devido, Investido) */}
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
            </div>
          </div>

          {/* Regra 7: Cards inferiores (Recebido e Guardado) */}
          <div className="mt-6 grid grid-cols-2 gap-4">
            <div className="rounded-2xl bg-white/70 p-3 text-center dark:bg-stone-800/50 shadow-sm">
              <p className="text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400 font-bold mb-1">
                Recebido
              </p>
              <p className="text-base font-bold text-emerald-600 dark:text-emerald-400">
                {toMoney(data?.income || 0)}
              </p>
            </div>
            <div className="rounded-2xl bg-white/70 p-3 text-center dark:bg-stone-800/50 shadow-sm">
              <p className="text-[10px] uppercase tracking-wider text-stone-500 dark:text-stone-400 font-bold mb-1">
                Guardado
              </p>
              <p className="text-base font-bold text-indigo-600 dark:text-indigo-400">
                {toMoney(data?.saved || 0)}
              </p>
            </div>
          </div>
        </>
      )}

      {/* Botão Intocável conforme pedido */}
      <button
        onClick={onShowBudget}
        className="mt-6 w-full rounded-full bg-stone-900 py-4 text-center font-bold text-white transition-transform active:scale-[0.98] hover:bg-stone-800 dark:bg-stone-800 dark:hover:bg-stone-700 shadow-lg hover:shadow-xl"
      >
        Ver meu orçamento
      </button>
    </div>
  );
};