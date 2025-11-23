import React from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { FinanceData } from '../types';

interface FinanceCardProps {
  data: FinanceData;
  onShowBudget?: () => void;
}

export const FinanceCard: React.FC<FinanceCardProps> = ({ data, onShowBudget }) => {
  const progressPercentage = Math.min(
    100,
    (data.totalSpent / data.totalBudget) * 100
  );

  return (
    <div className="rounded-3xl bg-emerald-100 dark:bg-emerald-900/40 p-6 text-stone-900 dark:text-stone-100 shadow-lg transition-all">
      {/* Month Navigation */}
     
        <div className="flex items-center justify-center mb-4">
          <button className="p-2 text-stone-500 rounded-full dark:text-stone-400 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition-colors">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="mx-4 text-center">
            <h2 className="text-lg font-semibold text-stone-800 dark:text-stone-200">
              {data.month}
            </h2>
            <p className="text-sm text-stone-500 dark:text-stone-400">
              {data.year}
            </p>
          </div>
          <button className="p-2 text-stone-500 rounded-full dark:text-stone-400 hover:bg-stone-200/50 dark:hover:bg-stone-800/50 transition-colors">
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>
 

      {/* Main Savings Amount */}
      <div className="my-6 text-center">
        <p className="text-sm font-medium text-emerald-600 dark:text-emerald-400">
          Você poupou esse mês
        </p>
        <p className="mt-1 text-5xl font-extrabold tracking-tight text-stone-900 dark:text-white">
          <span className="align-top text-3xl font-semibold">$</span>
          {data.savedAmount.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}
          <span className="align-top text-3xl font-semibold">,00</span>
        </p>
        <p className="mt-2 text-sm text-stone-500 dark:text-stone-400">
         
        </p>
      </div>

      {/* Progress Bar Section */}
      <div className="space-y-4">
        <div className="flex justify-between text-sm text-stone-600 dark:text-stone-400 font-medium">
          <span>Restam {data.daysLeft} dias</span>
          <span>Muito bem!</span>
        </div>
        <div className="h-2.5 w-full rounded-full bg-stone-300 dark:bg-stone-700 overflow-hidden">
          <div
            className="h-2.5 rounded-full bg-emerald-500 transition-all duration-1000 ease-out"
            style={{ width: `${progressPercentage}%` }}
          ></div>
        </div>

        {/* Legend */}
        <div className="space-y-2 text-sm pt-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="mr-2 h-2 w-2 rounded-full bg-emerald-500"></span>
              <span className="font-medium text-stone-800 dark:text-stone-200">
                Gasto
              </span>
            </div>
            <span className="font-medium text-stone-800 dark:text-stone-200">
              ${data.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="mr-2 h-2 w-2 rounded-full ring-1 ring-stone-400 dark:ring-stone-500"></span>
              <span className="text-stone-500 dark:text-stone-400">
                Restante
              </span>
            </div>
            <span className="text-stone-500 dark:text-stone-400">
              $
              {(data.totalBudget - data.totalSpent).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
              })}
            </span>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="mt-6 grid grid-cols-2 gap-4">
        <div className="rounded-2xl bg-white/70 p-4 text-center dark:bg-stone-800/50 shadow-sm">
          <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
            Recebido
          </p>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400">
            ${data.received.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
        <div className="rounded-2xl bg-white/70 p-4 text-center dark:bg-stone-800/50 shadow-sm">
          <p className="text-xs text-stone-500 dark:text-stone-400 font-medium">
            Investido
          </p>
          <p className="text-lg font-bold text-stone-800 dark:text-stone-200">
            ${data.invested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {/* CTA Button */}
      <button
        onClick={onShowBudget}
        className="mt-6 w-full rounded-full bg-stone-900 py-4 text-center font-bold text-white transition-transform active:scale-[0.98] hover:bg-stone-800 dark:bg-stone-800 dark:hover:bg-stone-700 shadow-lg hover:shadow-xl"
      >
        Ver meu orçamento
      </button>
    </div>
  );
};