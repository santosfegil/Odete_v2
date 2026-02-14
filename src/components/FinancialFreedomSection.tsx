import { useState, useMemo } from 'react';
import { Circle, Check, Pencil, X } from 'lucide-react';
import { useFinancialFreedom } from '../lib/useFinancialFreedom';

export default function FinancialFreedomSection() {
  const [strategy, setStrategy] = useState<'relief' | 'economy'>('economy');
  const { data, loading, updateLoanOverride } = useFinancialFreedom();

  // Override editing state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [editSystem, setEditSystem] = useState('');

  const sortedDebts = useMemo(() => {
    if (!data?.debts) return [];
    const list = [...data.debts];
    if (strategy === 'relief') {
      return list.sort((a, b) => Math.abs(a.balance) - Math.abs(b.balance));
    } else {
      return list.sort((a, b) => (b.loan_details?.interest_rate || 0) - (a.loan_details?.interest_rate || 0));
    }
  }, [data, strategy]);

  const handleStartEdit = (debt: typeof sortedDebts[0]) => {
    setEditingId(debt.id);
    setEditValue(debt.loan_details?.monthly_payment?.toFixed(2) || '');
    setEditSystem(debt.loan_details?.amortization_system || 'PRICE');
  };

  const handleSaveEdit = async () => {
    if (!editingId) return;
    const updates: any = {};
    const numValue = parseFloat(editValue);
    if (!isNaN(numValue) && numValue > 0) {
      updates.installment_value = numValue;
    }
    if (editSystem) {
      updates.amortization_system = editSystem;
    }
    await updateLoanOverride(editingId, updates);
    setEditingId(null);
  };

  const fmt = (n: number) => n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  if (loading) return <div className="p-6 text-center text-stone-400">Calculando liberdade financeira...</div>;
  if (!data) return null;

  return (
    <div className="bg-[#FFFDF5] dark:bg-stone-800 rounded-3xl shadow-sm border border-[#F2EFE5] dark:border-stone-700 overflow-hidden mt-6 relative">
      <div className="px-6 pt-6">
        <h2 className="text-sm font-bold text-stone-900 dark:text-white uppercase tracking-wider">Empréstimos e financiamentos</h2>
      </div>

      {/* Header - Freedom Date */}
      <div className="pt-6 pb-4 px-6 text-center">
        <p className="text-stone-500 dark:text-stone-400 text-[10px] font-bold tracking-wider uppercase mb-1">
          Data sem pendências
        </p>
        <h1 className="text-lg font-bold text-stone-900 dark:text-white tracking-tight capitalize">
          {data.freedomDate}
        </h1>
      </div>

      {/* Stats Cards */}
      <div className="px-6 flex gap-3 mb-6">
        <div className="flex-1 bg-white dark:bg-stone-700 p-3 rounded-2xl shadow-sm border border-orange-50 dark:border-stone-600 flex flex-col items-center justify-center">
          <span className="text-stone-500 dark:text-stone-400 text-[10px] font-bold tracking-wider mb-1 text-center">
            Pague esse mês
          </span>
          <span className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
            R$ {fmt(data.payThisMonth)}
          </span>
        </div>
        <div className="flex-1 bg-white dark:bg-stone-700 p-3 rounded-2xl shadow-sm border border-orange-50 dark:border-stone-600 flex flex-col items-center justify-center">
          <span className="text-stone-500 dark:text-stone-400 text-[10px] font-bold tracking-wider mb-1 text-center">
            Dívida total
          </span>
          <span className="text-sm font-extrabold text-yellow-600 dark:text-yellow-400">
            R$ {fmt(data.totalDebt)}
          </span>
        </div>
      </div>

      <div className="h-px w-full bg-[#EAE8DC] dark:bg-stone-700 mb-4"></div>

      {/* Strategy Selector */}
      <div className="px-6 mb-6">
        <p className="text-stone-600 dark:text-stone-400 text-xs font-medium mb-2">
          Estratégia de pagamento
        </p>
        <div className="bg-[#EBE9DE] dark:bg-stone-700 p-1 rounded-full flex">
          <button onClick={() => setStrategy('relief')} className={`flex-1 py-2.5 text-[10px] font-bold tracking-wide rounded-full transition-all duration-300 z-10 ${strategy === 'relief' ? 'bg-white dark:bg-stone-600 text-stone-900 dark:text-white shadow-md' : 'text-stone-500 dark:text-stone-400'}`}>Alívio rápido</button>
          <button onClick={() => setStrategy('economy')} className={`flex-1 py-2.5 text-[10px] font-bold tracking-wide rounded-full transition-all duration-300 z-10 ${strategy === 'economy' ? 'bg-white dark:bg-stone-600 text-stone-900 dark:text-white shadow-md' : 'text-stone-500 dark:text-stone-400'}`}>Economia máxima</button>
        </div>
      </div>

      {/* Debt List */}
      <div className="px-6 mb-6">
        <h2 className="text-sm font-bold text-stone-900 dark:text-white mb-3">
          Pague nessa ordem
        </h2>

        <div className="space-y-3">
          {sortedDebts.map((debt) => {
            const isPaid = debt.paid_this_month;
            const details = debt.loan_details;
            const paidInst = details?.paid_installments || 0;
            const totalInst = details?.total_installments || 0;
            const progress = totalInst > 0 ? (paidInst / totalInst) * 100 : 0;
            const isEditing = editingId === debt.id;

            return (
              <div key={debt.id} className="bg-white dark:bg-stone-700 rounded-2xl p-3 shadow-sm border border-stone-100 dark:border-stone-600">
                {/* Top row: checkbox + name + payment */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-colors shrink-0 ${isPaid ? 'bg-emerald-500 border-emerald-500' : 'border-stone-300 dark:border-stone-500 text-transparent'}`}>
                      {isPaid ? <Check size={12} className="text-white" strokeWidth={3} /> : <Circle size={12} />}
                    </div>
                    <span className={`text-sm font-semibold truncate transition-all ${isPaid ? 'text-stone-400 line-through decoration-emerald-500 decoration-2' : 'text-stone-900 dark:text-white'}`}>
                      {debt.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <span className={`text-sm font-bold transition-all ${isPaid ? 'text-stone-300 line-through decoration-emerald-500 decoration-2' : 'text-stone-900 dark:text-white'}`}>
                      {details?.monthly_payment ? `R$ ${fmt(details.monthly_payment)}` : '—'}
                    </span>
                    <button
                      onClick={() => isEditing ? setEditingId(null) : handleStartEdit(debt)}
                      className="p-1 text-stone-400 hover:text-stone-600 dark:hover:text-stone-300 transition-colors"
                    >
                      {isEditing ? <X size={14} /> : <Pencil size={14} />}
                    </button>
                  </div>
                </div>

                {/* Details row */}
                <div className="flex items-center gap-3 mt-2 ml-7.5 text-[10px] font-bold text-stone-400">
                  <span>{details?.interest_rate}% a.m.</span>
                  {totalInst > 0 && <span>Parcela {paidInst}/{totalInst}</span>}
                  {details?.due_day && <span>Vence dia {details.due_day}</span>}
                  <span className="text-stone-300">{details?.amortization_system}</span>
                </div>

                {/* Progress bar */}
                {totalInst > 0 && (
                  <div className="mt-2 ml-7.5">
                    <div className="w-full h-1.5 bg-stone-100 dark:bg-stone-600 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 rounded-full transition-all duration-500"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Edit overlay */}
                {isEditing && (
                  <div className="mt-3 pt-3 border-t border-stone-100 dark:border-stone-600 space-y-2">
                    <div className="flex gap-2">
                      <div className="flex-1">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1 block">Parcela (R$)</label>
                        <input
                          type="number"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          className="w-full bg-stone-50 dark:bg-stone-600 border border-stone-200 dark:border-stone-500 rounded-xl py-2 px-3 text-sm font-bold outline-none focus:border-emerald-500 transition-colors"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="flex-1">
                        <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider mb-1 block">Modelo</label>
                        <select
                          value={editSystem}
                          onChange={(e) => setEditSystem(e.target.value)}
                          className="w-full bg-stone-50 dark:bg-stone-600 border border-stone-200 dark:border-stone-500 rounded-xl py-2 px-3 text-sm font-bold outline-none focus:border-emerald-500 transition-colors"
                        >
                          <option value="PRICE">PRICE</option>
                          <option value="SAC">SAC</option>
                        </select>
                      </div>
                    </div>
                    <button
                      onClick={handleSaveEdit}
                      className="w-full py-2 bg-emerald-500 text-white rounded-xl text-xs font-bold hover:bg-emerald-600 transition-colors"
                    >
                      Salvar
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer */}
      <div className="mx-4 mb-4 bg-[#FBF2D5] dark:bg-yellow-900/30 p-4 rounded-2xl border border-[#F5EBC0] dark:border-yellow-900/50">
        <p className="text-[#5C4D26] dark:text-yellow-200 text-[10px] leading-relaxed">
          {strategy === 'relief' ? 'Alívio Rápido prioriza dívidas com menor saldo total primeiro.' : 'Economia máxima prioriza dívidas com juros mais altos.'}
        </p>
      </div>
    </div>
  );
}
