import React, { useState, useMemo } from 'react';
import { Circle, Check,MessageCircle } from 'lucide-react';
import { useFinancialFreedom } from '../lib/useFinancialFreedom';

export default function FinancialFreedomSection() {
  const [strategy, setStrategy] = useState<'relief' | 'economy'>('economy');
  const { data, loading } = useFinancialFreedom();

  const sortedDebts = useMemo(() => {
    if (!data?.debts) return [];
    
    const list = [...data.debts];
    if (strategy === 'relief') {
      // Alívio Rápido: Ordena pelo Saldo Total (Menor primeiro)
      return list.sort((a, b) => Math.abs(a.balance) - Math.abs(b.balance));
    } else {
      // Economia Máxima: Ordena pela Taxa de Juros (Maior primeiro)
      return list.sort((a, b) => (b.loan_details?.interest_rate || 0) - (a.loan_details?.interest_rate || 0));
    }
  }, [data, strategy]);

  if (loading) return <div className="p-6 text-center text-stone-400">Calculando liberdade financeira...</div>;
  if (!data) return null; 

  return (
    <div className="bg-[#FFFDF5] dark:bg-stone-800 rounded-3xl shadow-sm border border-[#F2EFE5] dark:border-stone-700 overflow-hidden mt-6 relative">
      <div className="px-6 pt-6">
        <h2 className="text-lg font-bold text-stone-900 dark:text-white">Empréstimos e financiamentos</h2>
      </div>
{/* Chat com odete escondido
      <button className="absolute top-6 right-6 p-2 text-stone-400 hover:text-stone-600 dark:text-stone-500 dark:hover:text-stone-300 transition-colors rounded-full hover:bg-stone-100/50 dark:hover:bg-stone-700/50">
        <MessageCircle size={20} />
      </button>*/}

      {/* Header */}
      <div className="pt-8 pb-6 px-6 text-center">
        <p className="text-stone-500 dark:text-stone-400 text-sm font-medium mb-1 tracking-wide">
          Data sem pendências financeiras
        </p>
        <h1 className="text-4xl font-black text-stone-900 dark:text-white tracking-tight mt-2 capitalize">
          {data.freedomDate}
        </h1>
      </div>

      {/* Stats Cards */}
      <div className="px-6 flex gap-4 mb-8">
        <div className="flex-1 bg-white dark:bg-stone-700 p-4 rounded-2xl shadow-sm border border-orange-50 dark:border-stone-600 flex flex-col items-center justify-center">
          <span className="text-stone-500 dark:text-stone-400 text-[10px] font-bold tracking-wider mb-1 text-center">
            Juros evitados
          </span>
          <span className="text-xl font-black text-stone-900 dark:text-white">
            R$ {data.savedInterest.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
        <div className="flex-1 bg-white dark:bg-stone-700 p-4 rounded-2xl shadow-sm border border-orange-50 dark:border-stone-600 flex flex-col items-center justify-center">
          <span className="text-stone-500 dark:text-stone-400 text-[10px] font-bold tracking-wider mb-1 text-center">
            Dívida total
          </span>
          <span className="text-xl font-black text-yellow-600 dark:text-yellow-400">
            R$ {data.totalDebt.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </span>
        </div>
      </div>

      <div className="h-px w-full bg-[#EAE8DC] dark:bg-stone-700 mb-6"></div>

      {/* Selector */}
      <div className="px-6 mb-8">
        <p className="text-stone-600 dark:text-stone-400 text-sm font-medium mb-3">
          Escolha a estratégia de pagamento
        </p>
        <div className="bg-[#EBE9DE] dark:bg-stone-700 p-1.5 rounded-full flex relative">
          <button onClick={() => setStrategy('relief')} className={`flex-1 py-3 text-xs font-bold tracking-wide rounded-full transition-all duration-300 z-10 ${strategy === 'relief' ? 'bg-white dark:bg-stone-600 text-stone-900 dark:text-white shadow-md' : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'}`}>Alívio rápido</button>
          <button onClick={() => setStrategy('economy')} className={`flex-1 py-3 text-xs font-bold tracking-wide rounded-full transition-all duration-300 z-10 ${strategy === 'economy' ? 'bg-white dark:bg-stone-600 text-stone-900 dark:text-white shadow-md' : 'text-stone-500 dark:text-stone-400 hover:text-stone-700 dark:hover:text-stone-300'}`}>Economia máxima</button>
        </div>
      </div>

      {/* List */}
      <div className="px-6 mb-8">
        <h2 className="text-lg font-bold text-stone-900 dark:text-white mb-4">
          Pague nessa ordem
        </h2>
        
        <div className="space-y-4">
          {sortedDebts.map((debt) => {
            const isPaid = debt.paid_this_month;
            const details = debt.loan_details;

            return (
              <div key={debt.id} className="flex items-center justify-between group select-none">
                <div className="flex items-center gap-3">
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${isPaid ? 'bg-emerald-500 border-emerald-500' : 'border-stone-300 dark:border-stone-500 text-transparent'}`}>
                    {isPaid ? <Check size={14} className="text-white" strokeWidth={3} /> : <Circle size={16} />}
                  </div>
                  
                  <div>
                      <span className={`block font-semibold transition-all ${isPaid ? 'text-stone-400 line-through decoration-emerald-500 decoration-2' : 'text-stone-900 dark:text-white'}`}>
                          {debt.name}
                      </span>
                      <span className={`text-[10px] font-bold ${isPaid ? 'text-stone-300' : 'text-stone-400'}`}>
                          Juros: {details?.interest_rate}% a.m.
                      </span>
                  </div>
                </div>
                
                <span className={`font-black text-lg transition-all ${isPaid ? 'text-stone-300 line-through decoration-emerald-500 decoration-2' : 'text-stone-900 dark:text-white'}`}>
                  R$ {(details?.monthly_payment || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="mx-4 mb-4 bg-[#FBF2D5] dark:bg-yellow-900/30 p-5 rounded-2xl border border-[#F5EBC0] dark:border-yellow-900/50">
        <p className="text-[#5C4D26] dark:text-yellow-200 text-xs leading-relaxed">
          {strategy === 'relief' ? 'A estratégia de Alívio Rápido prioriza quitar as dívidas com menor saldo total primeiro.' : 'A estratégia de economia máxima prioriza as dívidas com juros mais altos.'}
        </p>
      </div>
    </div>
  );
}