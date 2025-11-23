import React from 'react';
import { TrendingUp, DollarSign, PiggyBank, Wallet, Home, ArrowUp } from 'lucide-react';
import { InvestmentData } from '../types';

interface InvestmentCardProps {
  data: InvestmentData;
}

export const InvestmentCard: React.FC<InvestmentCardProps> = ({ data }) => {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-emerald-500 p-6 text-white shadow-lg dark:bg-emerald-600">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-100 dark:text-emerald-200">Patrimônio</p>
            <p className="mt-1 text-4xl font-extrabold tracking-tight">
              <span className="align-top text-2xl font-semibold">R$</span>
              {data.totalEquity.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('R$', '').trim().split(',')[0]}
              <span className="align-top text-2xl font-semibold">,{data.totalEquity.toFixed(2).split('.')[1]}</span>
            </p>
          </div>
          <TrendingUp className="h-8 w-8 text-emerald-100 dark:text-emerald-200" />
        </div>

        <div className="mt-4 flex items-center justify-between text-sm">
          <div className="flex items-center rounded-full bg-white/20 px-3 py-1 text-xs font-semibold">
            <ArrowUp className="mr-1 h-4 w-4" />
            <span>{data.equityGrowthPercent.toFixed(1)}%</span>
          </div>
          <span className="text-emerald-100 dark:text-emerald-200">últimos 30 dias</span>
        </div>

        <div className="mt-6 space-y-4 border-t border-white/20 pt-4">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <p className="font-medium text-emerald-50">Valor em Investimentos</p>
            </div>
            <p className="font-semibold text-white">
              R$ {data.investments.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <PiggyBank className="h-5 w-5 text-white" />
              </div>
              <p className="font-medium text-emerald-50">Reserva de Emergência</p>
            </div>
            <p className="font-semibold text-white">
              R$ {data.emergencyReserve.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <p className="font-medium text-emerald-50">Valor em Conta Corrente</p>
            </div>
            <p className="font-semibold text-white">
              R$ {data.checkingAccount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center">
              <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20">
                <Home className="h-5 w-5 text-white" />
              </div>
              <p className="font-medium text-emerald-50">Valor em imóveis</p>
            </div>
            <p className="font-semibold text-white">
              R$ {data.realEstate.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>

      <div className="rounded-3xl bg-stone-100 p-6 dark:bg-stone-800/80">
        <p className="text-sm font-medium text-stone-500 dark:text-stone-400">Previsão do patrimônio</p>
        <p className="mt-1 text-3xl font-extrabold tracking-tight text-stone-900 dark:text-stone-100">
          <span className="align-top text-xl font-semibold">R$</span>
          {data.projectedEquity.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('R$', '').trim().split(',')[0]}
          <span className="align-top text-xl font-semibold">,{data.projectedEquity.toFixed(2).split('.')[1]}</span>
        </p>

        <div className="relative mt-6 pt-4">
          <div className="h-2 w-full rounded-full bg-stone-200 dark:bg-stone-700">
            <div
              className="h-2 rounded-full bg-stone-900 dark:bg-stone-100"
              style={{ width: `${data.projectionProgress}%` }}
            ></div>
          </div>
          <div className="absolute -top-1 left-0 text-xs font-medium text-stone-600 dark:text-stone-300">
            Janeiro
          </div>
          <div
            className="absolute -top-1.5 text-xs font-medium text-stone-800 dark:text-stone-200"
            style={{ left: `${data.projectionProgress}%`, transform: 'translateX(-50%)' }}
          >
            {data.currentMonth}
          </div>
          <div className="absolute -top-1 right-0 text-xs font-medium text-stone-600 dark:text-stone-300">
            Dezembro
          </div>
        </div>
      </div>
    </div>
  );
};
