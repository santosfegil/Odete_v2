import React, { useState } from 'react';
import { X, Save, Plus, Trash2, Home, DollarSign, Wallet, Car, Box } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { AccountItem } from '../hooks/usePatrimony';

interface EditPatrimonyModalProps {
  onClose: () => void;
  onSuccess: () => void;
  initialAccounts: AccountItem[];
}

type TabType = 'investments' | 'accounts' | 'assets';

// Função auxiliar para gerar ID
const generateUUID = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

export const EditPatrimonyModal: React.FC<EditPatrimonyModalProps> = ({ 
  onClose, 
  onSuccess, 
  initialAccounts 
}) => {
  const [loading, setLoading] = useState(false);
  const [items, setItems] = useState<any[]>(initialAccounts || []); 
  const [activeTab, setActiveTab] = useState<TabType>('accounts');
  const [itemToDelete, setItemToDelete] = useState<any | null>(null);

  // --- FILTROS ---
  const getFilteredItems = () => {
    switch (activeTab) {
      case 'investments': return items.filter(i => i.type === 'investment');
      case 'accounts': return items.filter(i => ['bank', 'wallet', 'checking_account', 'savings_account'].includes(i.type));
      case 'assets': return items.filter(i => ['real_estate', 'vehicle', 'other_asset'].includes(i.type));
      default: return [];
    }
  };

  // --- SALVAR ---
  const handleSave = async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Usuário não logado");

      const upsertList = items.map(item => {
        let cleanBalance = item.amount;
        if (typeof cleanBalance === 'string') cleanBalance = parseFloat(cleanBalance.replace(',', '.'));
        if (isNaN(cleanBalance)) cleanBalance = 0;

        const finalId = (item.id && item.id.length > 10) ? item.id : generateUUID();
        const finalExternalId = item.external_id || `manual-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const finalCreationType = item.account_creation_type || 'manual';

        return {
          id: finalId,
          user_id: user.id,
          name: item.name || 'Sem nome',
          type: item.type,
          balance: cleanBalance,
          external_id: finalExternalId,
          account_creation_type: finalCreationType
        };
      });

      const { error } = await supabase.from('accounts').upsert(upsertList);
      if (error) throw error;

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error(error);
      alert(`Erro ao salvar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // --- ADICIONAR ---
  const addItem = () => {
    let newType = 'bank';
    if (activeTab === 'investments') newType = 'investment';
    else if (activeTab === 'assets') newType = 'other_asset';

    const newItem = { 
      id: '', name: '', amount: 0, type: newType, external_id: null, account_creation_type: 'manual'
    };
    setItems([newItem, ...items]);
  };

  // --- EXCLUSÃO ---
  const requestDelete = (item: any) => setItemToDelete(item);
  const confirmDelete = async () => {
    if (!itemToDelete) return;
    if (itemToDelete.id && itemToDelete.id.length > 10) {
       await supabase.from('accounts').delete().eq('id', itemToDelete.id);
    }
    const index = items.indexOf(itemToDelete);
    if (index > -1) {
      const newItems = [...items];
      newItems.splice(index, 1);
      setItems(newItems);
    }
    setItemToDelete(null);
  };

  // --- ATUALIZAR ---
  const updateItem = (originalIndex: number, field: string, value: any) => {
    if (items[originalIndex].account_creation_type === 'automatic') return;
    const newItems = [...items];
    newItems[originalIndex] = { ...newItems[originalIndex], [field]: value };
    setItems(newItems);
  };

  const getIcon = (type: string) => {
    if (type === 'investment') return <DollarSign size={16} />;
    if (['bank', 'wallet'].includes(type)) return <Wallet size={16} />;
    if (type === 'vehicle') return <Car size={16} />;
    if (['real_estate', 'home'].includes(type)) return <Home size={16} />;
    return <Box size={16} />;
  };

  return (
    <>
      <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
        <div className="bg-emerald-50 dark:bg-stone-900 w-full max-w-md rounded-[2rem] flex flex-col max-h-[85vh] shadow-2xl border border-stone-200 dark:border-stone-800 relative">
          
          <div className="p-6 pb-2 flex justify-between items-center">
            <h3 className="text-xl font-extrabold text-stone-900 dark:text-white">Editar patrimônio</h3>
            <button onClick={onClose} className="p-2 bg-white dark:bg-stone-800 rounded-full hover:bg-stone-200 transition-colors">
              <X size={20} className="text-stone-900 dark:text-white" />
            </button>
          </div>

          <div className="px-6 py-4">
            <div className="flex bg-stone-200 dark:bg-stone-800 p-1 rounded-full relative">
              {(['accounts', 'investments', 'assets'] as TabType[]).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex-1 py-2 rounded-full text-sm font-bold transition-all duration-200 z-10 ${
                    activeTab === tab ? 'bg-white text-black shadow-sm' : 'text-stone-500 hover:text-stone-700 dark:text-stone-400'
                  }`}
                >
                  {tab === 'accounts' ? 'Contas' : tab === 'investments' ? 'Investimentos' : 'Bens'}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-6 pb-4 space-y-3 custom-scrollbar">
            <button 
              onClick={addItem}
              className="w-full py-3 border-2 border-dashed border-emerald-300 dark:border-emerald-800 rounded-2xl flex items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 font-bold hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors mb-4"
            >
              <Plus size={18} />
              Adicionar {activeTab === 'investments' ? 'investimento' : activeTab === 'accounts' ? 'conta' : 'bem'}
            </button>

            {getFilteredItems().length === 0 ? (
              <p className="text-center text-stone-400 text-sm py-4">Nada aqui ainda.</p>
            ) : (
              getFilteredItems().map((item) => {
                const realIndex = items.indexOf(item);
                const isAuto = item.account_creation_type === 'automatic';

                return (
                  // MUDANÇA AQUI: justify-between para separar os grupos
                  <div 
                    key={item.id || `temp-${realIndex}`} 
                    className={`flex items-center justify-between bg-white dark:bg-stone-800 p-3 rounded-2xl border border-stone-100 dark:border-stone-700 shadow-sm animate-in slide-in-from-top-2 ${isAuto ? 'opacity-80' : ''}`}
                  >
                    {/* GRUPO ESQUERDA: Ícone + Nome */}
                    <div className="flex items-center gap-3 flex-1 overflow-hidden mr-3">
                      <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-700 dark:text-emerald-400 shrink-0">
                        {getIcon(item.type)}
                      </div>
                      <input
                        value={item.name}
                        onChange={(e) => updateItem(realIndex, 'name', e.target.value)}
                        placeholder="Nome"
                        disabled={isAuto}
                        className={`flex-1 bg-transparent text-sm font-bold focus:outline-none dark:text-white truncate ${isAuto ? 'cursor-not-allowed text-stone-500' : ''}`}
                      />
                    </div>
                    
                    {/* GRUPO DIREITA: Valor + Botão */}
                    <div className="flex items-center gap-3 shrink-0">
                      <div className="relative w-28 shrink-0">
                        <span className="absolute left-0 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-bold">R$</span>
                        <input
                          type="number"
                          value={item.amount}
                          onChange={(e) => updateItem(realIndex, 'amount', parseFloat(e.target.value) || 0)}
                          disabled={isAuto}
                          className={`w-full pl-6 bg-transparent text-sm font-bold text-right focus:outline-none dark:text-white ${isAuto ? 'cursor-not-allowed text-stone-500' : ''}`}
                        />
                      </div>
                      
                      {!isAuto && (
                        <button 
                          onClick={() => requestDelete(item)} 
                          // Removi o mr-2 pois o gap-3 do grupo pai já cuida disso
                          className="p-1.5 text-stone-300 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                      {/* Espaço reservado para alinhar itens automáticos */}
                      {isAuto && <div className="w-7 h-7" />}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          <div className="p-6 bg-white dark:bg-stone-900 border-t border-stone-100 dark:border-stone-800 rounded-b-[2rem]">
            <button
              onClick={handleSave}
              disabled={loading}
              className="w-full bg-stone-900 dark:bg-emerald-600 text-white py-4 rounded-full font-bold text-lg hover:scale-[1.02] active:scale-[0.98] transition-all shadow-xl flex items-center justify-center gap-2"
            >
              {loading ? 'Salvando...' : <><Save size={20} /> Salvar alterações</>}
            </button>
          </div>
        </div>
      </div>

      {/* Modal de Confirmação */}
      {itemToDelete && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-4 animate-in fade-in duration-200">
          <div className="bg-white dark:bg-stone-900 rounded-3xl p-6 w-full max-w-sm shadow-2xl text-center space-y-4">
            <div>
              <h3 className="text-xl font-bold text-stone-900 dark:text-white mb-2">Excluir item?</h3>
              <p className="text-stone-500 dark:text-stone-400 text-sm">
                Essa ação removerá "{itemToDelete.name || 'este item'}" da sua lista. Você não poderá desfazer isso.
              </p>
            </div>
            <div className="flex gap-3 justify-end pt-2">
              <button onClick={() => setItemToDelete(null)} className="flex-1 py-3 text-stone-600 dark:text-stone-300 font-bold hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl transition-colors">Cancelar</button>
              <button onClick={confirmDelete} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors shadow-lg flex justify-center items-center gap-2"><Trash2 size={18} /> Excluir</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};