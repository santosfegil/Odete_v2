import React, { useState } from 'react';
import { Check, Circle } from 'lucide-react';

export default function FinancialFreedomSection() {
  const [strategy, setStrategy] = useState<'relief' | 'economy'>('economy');

  return (
    <div className="bg-[#FFFDF5] dark:bg-stone-800 rounded-3xl shadow-sm border border-[#F2EFE5] dark:border-stone-700 overflow-hidden mt-6">
      
      {/* Header Section */}
      <div className="pt-8 pb-6 px-6 text-center">
        <p className="text-stone-500 dark:text-stone-400 text-sm font-medium mb-1 tracking-wide">
          Data sem pendências financeiras
        </p>
        <h1 className="text-4xl font-black text-stone-900 dark:text-white tracking-tight mt-2">
          Maio 2026
        </h1>
      </div>

      {/* Stats Cards */}
      <div className="px-6 flex gap-4 mb-8">
        <div className="flex-1 bg-white dark:bg-stone-700 p-4 rounded-2xl shadow-sm border border-orange-50 dark:border-stone-600 flex flex-col items-center justify-center">
          <span className="text-stone-500 dark:text-stone-400 text-xs font-medium uppercase tracking-wider mb-1">
            Juros evitados
          </span>
          <span className="text-2xl font-black text-stone-900 dark:text-white">
            R$ 1.200
          </span>
        </div>
        <div className="flex-1 bg-white dark:bg-stone-700 p-4 rounded-2xl shadow-sm border border-orange-50 dark:border-stone-600 flex flex-col items-center justify-center">
          <span className="text-stone-500 dark:text-stone-400 text-xs font-medium uppercase tracking-wider mb-1">
            Anos ganhos
          </span>
          <span className="text-2xl font-black text-stone-900 dark:text-white">
            5
          </span>
        </div>
      </div>

      {/* Divider */}
      <div className="h-px w-full bg-[#EAE8DC] dark:bg-stone-700 mb-6"></div>

      {/* Strategy Selector */}
      <div className="px-6 mb-8">
        <p className="text-stone-600 dark:text-stone-400 text-sm font-medium mb-3">
          Escolha a estratégia de pagamento
        </p>
        <div className="bg-[#EBE9DE] dark:bg-stone-700 p-1.5 rounded-full flex relative">
          <button
            onClick={() => setStrategy('relief')}
            className={`flex-1 py-3 text-sm rounded-full transition-all duration-300 z-10 ${
              strategy === 'relief'
                ? 'bg-white dark:bg-stone-600 text-stone-900 dark:text-white font-bold shadow-md'
                : 'text-stone-500 dark:text-stone-400 font-medium hover:text-stone-700 dark:hover:text-stone-300'
            }`}
          >
            Alívio rápido
          </button>
          <button
            onClick={() => setStrategy('economy')}
            className={`flex-1 py-3 text-sm rounded-full transition-all duration-300 z-10 ${
              strategy === 'economy'
                ? 'bg-white dark:bg-stone-600 text-stone-900 dark:text-white font-bold shadow-md'
                : 'text-stone-500 dark:text-stone-400 font-medium hover:text-stone-700 dark:hover:text-stone-300'
            }`}
          >
            Economia máxima
          </button>
        </div>
      </div>

      {/* Payment List */}
      <div className="px-6 mb-8">
        <h2 className="text-lg font-bold text-stone-900 dark:text-white mb-4">
          Pague este mês
        </h2>
        
        <div className="space-y-4">
          {/* Item 1 - Pago */}
          <div className="flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                <Check size={16} strokeWidth={4} />
              </div>
              <span className="text-stone-400 font-medium line-through decoration-stone-300">
                Parcela financiamento
              </span>
            </div>
            <span className="text-stone-900 dark:text-white font-bold text-lg">
              R$ 450,00
            </span>
          </div>

          {/* Item 2 - Pendente */}
          <div className="flex items-center justify-between group cursor-pointer">
            <div className="flex items-center gap-3">
              <div className="w-6 h-6 rounded-full border-2 border-stone-300 dark:border-stone-500 flex items-center justify-center text-transparent hover:border-emerald-500 transition-colors shrink-0">
                <Circle size={16} />
              </div>
              <span className="text-stone-700 dark:text-stone-300 font-semibold">
                Cheque especial
              </span>
            </div>
            <span className="text-stone-900 dark:text-white font-black text-xl">
              R$ 1.250,00
            </span>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="mx-4 mb-4 bg-[#FBF2D5] dark:bg-yellow-900/30 p-5 rounded-2xl border border-[#F5EBC0] dark:border-yellow-900/50">
        <p className="text-[#5C4D26] dark:text-yellow-200 text-sm leading-relaxed">
          {strategy === 'relief' ? (
            <>
              A <span className="font-bold text-[#3D3319] dark:text-yellow-100">estratégia de Alívio rápido</span> foca em quitar primeiro as dívidas de menor valor, gerando vitórias rápidas que motivam a continuar pagando as demais.
            </>
          ) : (
            <>
              A <span className="font-bold text-[#3D3319] dark:text-yellow-100">estratégia de Economia máxima</span> foca em priorizar as dívidas com juros mais altos, resultando em uma maior economia total ao longo do tempo.
            </>
          )}
        </p>
      </div>

    </div>
  );
}