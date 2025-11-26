import React from 'react';
import { ArrowRight, CheckCircle } from 'lucide-react';

interface MonthlyInvestmentCardProps {
  currentInvested: number;
  monthlyGoal: number;
  monthName: string;
  onShowHistory: () => void;
}

export const MonthlyInvestmentCard: React.FC<MonthlyInvestmentCardProps> = ({
  currentInvested,
  monthlyGoal,
  monthName,
  onShowHistory,
}) => {
  const progressPercent = Math.min((currentInvested / monthlyGoal) * 100, 100);

  return (
    <div className="bg-emerald-100 dark:bg-emerald-900/40 p-6 rounded-3xl shadow-sm transition-all">
      {/* Header */}
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-bold text-stone-900 dark:text-white">
          Investimento Mensal
        </h2>
        <button
          onClick={onShowHistory}
          className="bg-stone-900 dark:bg-stone-700 text-white text-[10px] font-bold py-1.5 px-3 rounded-full flex items-center hover:bg-stone-800 transition-colors"
        >
          Ver todas
          <ArrowRight size={12} className="ml-1" />
        </button>
      </div>

      {/* Valor Principal Gigante */}
      <div className="flex flex-col items-start justify-center mb-6">
        <div className="flex items-baseline text-stone-900 dark:text-white leading-none -ml-1">
          <span className="text-xl font-bold mr-1">R$</span>
          <span className="text-5xl font-extrabold tracking-tighter">
            {currentInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 }).split(',')[0]}
          </span>
          <span className="text-xl font-bold ml-1">
            ,{currentInvested.toLocaleString('pt-BR', { minimumFractionDigits: 2 }).split(',')[1]}
          </span>
        </div>
        
        {/* Texto Descritivo */}
        <p className="text-stone-600 dark:text-stone-400 font-medium text-xs mt-1">
          investidos dos R$ {monthlyGoal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} desejados
        </p>
      </div>

      {/* Labels e Barra */}
      <div className="flex justify-between items-end mb-1.5 px-1">
        <span className="text-xs font-bold text-stone-700 dark:text-stone-300 tracking-wide">
          {monthName}
        </span>
        
        {monthlyGoal > currentInvested ? (
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400">
            Faltam R$ {(monthlyGoal - currentInvested).toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
          </span>
        ) : (
          <span className="text-xs font-bold text-emerald-700 dark:text-emerald-400 flex items-center gap-1">
            <CheckCircle size={12} /> Meta Batida
          </span>
        )}
      </div>

      {/* Barra de Progresso */}
      <div className="w-full bg-emerald-200 dark:bg-emerald-950/50 rounded-full h-3 overflow-hidden">
        <div
          className="bg-emerald-500 h-full rounded-full transition-all duration-1000 ease-out shadow-sm"
          style={{ width: `${progressPercent}%` }}
        ></div>
      </div>
    </div>
  );
};