import React, { useState, useEffect } from 'react';
import { Loader2,TrendingUp,X, Save, Wallet, Building2, PiggyBank } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface AccountOption {
  id: string;
  name: string;
  type: string;
  balance: number;
}

interface RetirementSettingsModalProps {
  onClose: () => void;
  // Retorna os IDs das contas que o usuário quer considerar
  onSave: (selectedAccountIds: string[]) => void;
  planId: string; // ID do plano de aposentadoria
  initialSelection?: string[]; // IDs já selecionados anteriormente
}

export const RetirementSettingsModal: React.FC<RetirementSettingsModalProps> = ({ onClose,planId, onSave, initialSelection = [] }) => {
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>(initialSelection);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true); // Garante o loading

      // 1. Buscar todas as contas possíveis (lógica que você já tinha)
      const allowedTypes = ['wallet', 'bank', 'investment', 'checking_account', 'savings_account'];
      const { data: allAccounts } = await supabase
        .from('accounts')
        .select('id, name, type, balance')
        .in('type', allowedTypes);

      if (allAccounts) {
        setAccounts(allAccounts);
      }

      // 2. NOVO: Buscar na tabela de junção o que já está salvo para este plano
      const { data: savedLinks } = await supabase
        .from('retirement_plan_accounts')
        .select('account_id')
        .eq('plan_id', planId);

      // 3. Atualizar a seleção visual
      if (savedLinks && savedLinks.length > 0) {
        // Se achou no banco, usa do banco
        setSelectedIds(savedLinks.map((link: any) => link.account_id));
      } else if (initialSelection.length > 0) {
        // Fallback para props antigas
        setSelectedIds(initialSelection);
      } else {
        // Se não tem nada salvo, padrão: selecionar tudo (sua lógica original)
        if (allAccounts) setSelectedIds(allAccounts.map(a => a.id));
      }

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const toggleAccount = (id: string) => {
    setSelectedIds(prev => 
      prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
    );
  };

const handleSaveInternal = async () => {
    try {
      // 1. Limpeza: Remove TUDO que estava vinculado a este plano antes
      // Isso garante que se você desmarcou uma conta, ela será removida.
      const { error: deleteError } = await supabase
        .from('retirement_plan_accounts')
        .delete()
        .eq('plan_id', planId);

      if (deleteError) throw deleteError;

      // 2. Inserção: Se houver contas selecionadas, cria as novas ligações
      if (selectedIds.length > 0) {
        const rowsToInsert = selectedIds.map(accountId => ({
          plan_id: planId,
          account_id: accountId
        }));

        const { error: insertError } = await supabase
          .from('retirement_plan_accounts')
          .insert(rowsToInsert);

        if (insertError) throw insertError;
      }

      // 3. Finalização
      onSave(selectedIds); // Avisa o pai para recarregar a tela (sem passar params)
      onClose(); // Fecha o modal

    } catch (error) {
      console.error('Erro ao salvar:', error);
      alert('Erro ao salvar alterações.');
    }
  };
  // Ícone helper
  const getIcon = (type: string) => {
    if (type.includes('invest')) return <TrendingUp size={18} />;
    if (type.includes('bank') || type.includes('checking')) return <Building2 size={18} />;
    return <Wallet size={18} />;
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
      <div className="bg-white dark:bg-stone-900 w-full max-w-sm rounded-[2rem] p-5 shadow-2xl border border-stone-200 dark:border-stone-800 flex flex-col max-h-[85vh] animate-in fade-in zoom-in duration-200">
        
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-bold text-stone-900 dark:text-white">Fontes de Aposentadoria</h3>
          <button onClick={onClose} className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors">
            <X size={20} className="text-stone-500 dark:text-stone-400"/>
          </button>
        </div>
        
        <p className="text-xs text-stone-500 mb-3">Selecione as contas a serem consideradas para sua aposentadoria.</p>

        <div className="flex-1 overflow-y-auto pr-1 custom-scrollbar">
          {loading ? (
            <div className="p-8 flex justify-center text-emerald-500">
                <Loader2 className="animate-spin" />
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-2"> 
              {accounts.map(acc => {
                const isSelected = selectedIds.includes(acc.id);
                return (
                  <button 
                    key={acc.id}
                    onClick={() => toggleAccount(acc.id)}
                    className={`
                      aspect-square rounded-xl p-1.5 flex flex-col items-center justify-center gap-0.5 transition-all border-2 relative
                      ${isSelected 
                        ? 'bg-emerald-50 border-emerald-500 dark:bg-emerald-900/20 dark:border-emerald-500' 
                        : 'bg-stone-50 border-transparent hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-700'
                      }
                    `}
                  >
                    {/* Ícone Compacto */}
                    <div className={`p-1.5 rounded-full shrink-0 ${isSelected ? 'bg-emerald-200 text-emerald-700' : 'bg-white dark:bg-stone-700 text-stone-400'}`}>
                        {getIcon(acc.type)}
                    </div>
                    
                    <div className="w-full px-0.5 flex flex-col justify-center min-h-0 overflow-hidden">
                        {/* Nome: Altura fixa menor (2em) e entrelinha apertada (leading-3) */}
                        <div className="h-[2em] flex items-center justify-center">
                          <span className={`text-[10px] font-bold leading-3 text-center line-clamp-2 break-words ${isSelected ? 'text-stone-900 dark:text-white' : 'text-stone-500 dark:text-stone-400'}`}>
                            {acc.name}
                          </span>
                        </div>
                        
                        {/* Valor Compacto */}
                        <p className={`text-[9px] font-medium text-center -mt-0.5 ${isSelected ? 'text-emerald-600 dark:text-emerald-400' : 'text-stone-400'}`}>
                          {acc.balance.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL', notation: "compact", maximumFractionDigits: 1 })}
                        </p>
                    </div>

                    {/* Bolinha de seleção menor */}
                    {isSelected && (
                      <div className="absolute top-1.5 right-1.5 w-1.5 h-1.5 bg-emerald-500 rounded-full shadow-sm" />
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>

        <div className="pt-4 mt-2 border-t border-stone-100 dark:border-stone-800 bg-white dark:bg-stone-900 z-10">
             <div className="flex justify-between items-center mb-3 text-sm font-bold">
                <span className="text-stone-500">Selecionado</span>
                <span className="text-stone-900 dark:text-white">
                    {accounts
                      .filter(a => selectedIds.includes(a.id))
                      .reduce((acc, curr) => acc + curr.balance, 0)
                      .toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
                    }
                </span>
             </div>
             <button onClick={handleSaveInternal} className="w-full bg-stone-900 dark:bg-emerald-600 text-white py-3 rounded-xl font-bold hover:scale-[1.02] transition-transform shadow-lg">
                Confirmar
             </button>
        </div>

      </div>
    </div>
  );
};