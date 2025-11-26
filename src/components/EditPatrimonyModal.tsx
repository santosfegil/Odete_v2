import React, { useState, useEffect } from 'react';
import { X, Save, Plus, Trash2, Home, DollarSign, Wallet, PiggyBank } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface EditPatrimonyModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface Asset {
  id?: string;
  name: string;
  amount: number;
  type?: string;
}

export const EditPatrimonyModal: React.FC<EditPatrimonyModalProps> = ({ onClose, onSuccess }) => {
  const [loading, setLoading] = useState(false);
  
  // Valores fixos (Strings para facilitar edição)
  const [investments, setInvestments] = useState<string>('');
  const [emergency, setEmergency] = useState<string>('');
  const [checking, setChecking] = useState<string>('');
  
  // IDs das contas fixas
  const [ids, setIds] = useState({ investments: '', emergency: '', checking: '' });

  // Lista de Bens
  const [assets, setAssets] = useState<Asset[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const { data: accounts } = await supabase.from('accounts').select('*');

    if (accounts) {
      const bens: Asset[] = [];
      
      accounts.forEach(acc => {
        if (acc.name === 'Meus Investimentos' && acc.type === 'investment') {
          setInvestments(acc.balance.toString());
          setIds(prev => ({ ...prev, investments: acc.id }));
        } else if (acc.name === 'Reserva de Emergência' && acc.type === 'investment') {
          setEmergency(acc.balance.toString());
          setIds(prev => ({ ...prev, emergency: acc.id }));
        } else if (acc.name === 'Conta Principal' && acc.type === 'bank') {
          setChecking(acc.balance.toString());
          setIds(prev => ({ ...prev, checking: acc.id }));
        } else if (['real_estate', 'vehicle', 'other_asset'].includes(acc.type)) {
          bens.push({ id: acc.id, name: acc.name, amount: acc.balance, type: acc.type });
        }
      });
      setAssets(bens);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    const user = (await supabase.auth.getUser()).data.user;
    
    if (!user) {
      setLoading(false);
      return;
    }

    // Arrays separados para Atualização e Criação
    const toUpsert = []; // Itens que já têm ID (ou os fixos que vamos garantir que existam)
    const toInsert = []; // Novos bens (sem ID)

    // Helper para limpar valor numérico
    const parseVal = (val: string | number) => typeof val === 'string' ? parseFloat(val.replace(',', '.')) || 0 : val;

    // 1. PREPARAR CONTAS FIXAS (Sempre Upsert)
    // Investimentos
    toUpsert.push({
      id: ids.investments || undefined, // undefined faz o upsert criar se não existir
      user_id: user.id,
      name: 'Meus Investimentos',
      type: 'investment',
      balance: parseVal(investments)
    });

    // Reserva
    toUpsert.push({
      id: ids.emergency || undefined,
      user_id: user.id,
      name: 'Reserva de Emergência',
      type: 'investment',
      balance: parseVal(emergency)
    });

    // Conta Corrente
    toUpsert.push({
      id: ids.checking || undefined,
      user_id: user.id,
      name: 'Conta Principal',
      type: 'bank',
      balance: parseVal(checking)
    });

    // 2. PREPARAR BENS
    assets.forEach(asset => {
      // Inferir tipo básico se for novo
      let type = asset.type || 'other_asset';
      if (!asset.id) {
        const lowerName = asset.name.toLowerCase();
        if (lowerName.includes('casa') || lowerName.includes('apt') || lowerName.includes('imóvel')) type = 'real_estate';
        else if (lowerName.includes('carro') || lowerName.includes('moto') || lowerName.includes('veículo')) type = 'vehicle';
      }

      const payload = {
        user_id: user.id,
        name: asset.name || 'Novo Bem',
        type: type,
        balance: asset.amount
      };

      if (asset.id) {
        // Se já tem ID, vai para atualização
        toUpsert.push({ ...payload, id: asset.id });
      } else {
        // Se não tem ID, vai para inserção limpa
        toInsert.push(payload);
      }
    });

    try {
      // Executa Upserts (Atualizações e Contas Fixas)
      const { error: errorUpsert } = await supabase.from('accounts').upsert(toUpsert);
      if (errorUpsert) throw errorUpsert;

      // Executa Inserts (Novos Bens) - SE houver
      if (toInsert.length > 0) {
        const { error: errorInsert } = await supabase.from('accounts').insert(toInsert);
        if (errorInsert) throw errorInsert;
      }

      onSuccess();
      onClose();
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      alert(`Erro ao salvar: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const addAsset = () => {
    setAssets([...assets, { name: '', amount: 0 }]);
  };

  const removeAsset = async (index: number) => {
    const assetToRemove = assets[index];
    
    if (assetToRemove.id) {
      const { error } = await supabase.from('accounts').delete().eq('id', assetToRemove.id);
      if (error) console.error('Erro ao deletar:', error);
    }

    const newAssets = assets.filter((_, i) => i !== index);
    setAssets(newAssets);
  };

  const updateAsset = (index: number, field: 'name' | 'amount', value: string | number) => {
    const newAssets = [...assets];
    // @ts-ignore
    newAssets[index] = { ...newAssets[index], [field]: value };
    setAssets(newAssets);
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-[60] p-4 transition-all">
      <div className="bg-emerald-50 dark:bg-stone-900 w-full max-w-md rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-white/50 dark:border-stone-800">
        
        {/* Cabeçalho */}
        <div className="p-6 pb-0 flex justify-between items-center">
          <h3 className="text-2xl font-extrabold text-stone-900 dark:text-white tracking-tight">
            Editar patrimônio
          </h3>
          <button 
            onClick={onClose} 
            className="p-2 bg-white dark:bg-stone-800 hover:bg-stone-100 dark:hover:bg-stone-700 rounded-full transition-colors shadow-sm"
          >
            <X className="text-stone-900 dark:text-white" size={20} />
          </button>
        </div>

        <div className="overflow-y-auto p-6 pt-4 space-y-6 custom-scrollbar">
          
          {/* Seção 1: Categorias Fixas */}
          <div className="space-y-4">
            {/* Investimentos */}
            <div className="bg-white dark:bg-stone-800 p-4 rounded-2xl shadow-sm border border-emerald-100/50 dark:border-stone-700">
              <label className="flex items-center gap-2 text-sm font-bold text-stone-700 dark:text-stone-300 mb-2">
                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-700 dark:text-emerald-400">
                  <DollarSign size={16} /> 
                </div>
                Valor em investimentos
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold">R$</span>
                <input
                  type="number"
                  value={investments}
                  onChange={(e) => setInvestments(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-10 pr-4 py-3 bg-stone-50 dark:bg-stone-900 rounded-xl font-bold text-lg text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all border-none"
                />
              </div>
            </div>

            {/* Reserva */}
            <div className="bg-white dark:bg-stone-800 p-4 rounded-2xl shadow-sm border border-emerald-100/50 dark:border-stone-700">
              <label className="flex items-center gap-2 text-sm font-bold text-stone-700 dark:text-stone-300 mb-2">
                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-700 dark:text-emerald-400">
                  <PiggyBank size={16} />
                </div>
                Reserva de emergência
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold">R$</span>
                <input
                  type="number"
                  value={emergency}
                  onChange={(e) => setEmergency(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-10 pr-4 py-3 bg-stone-50 dark:bg-stone-900 rounded-xl font-bold text-lg text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all border-none"
                />
              </div>
            </div>

            {/* Conta Corrente */}
            <div className="bg-white dark:bg-stone-800 p-4 rounded-2xl shadow-sm border border-emerald-100/50 dark:border-stone-700">
              <label className="flex items-center gap-2 text-sm font-bold text-stone-700 dark:text-stone-300 mb-2">
                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-700 dark:text-emerald-400">
                  <Wallet size={16} />
                </div>
                Conta corrente
              </label>
              <div className="relative">
                <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold">R$</span>
                <input
                  type="number"
                  value={checking}
                  onChange={(e) => setChecking(e.target.value)}
                  placeholder="0,00"
                  className="w-full pl-10 pr-4 py-3 bg-stone-50 dark:bg-stone-900 rounded-xl font-bold text-lg text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none transition-all border-none"
                />
              </div>
            </div>
          </div>

          {/* Seção 2: Bens (Lista Dinâmica) */}
          <div className="pt-2">
            <div className="flex justify-between items-center mb-4">
              <label className="flex items-center gap-2 text-sm font-bold text-stone-700 dark:text-stone-300">
                <div className="p-1.5 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-700 dark:text-emerald-400">
                  <Home size={16} />
                </div>
                Meus bens (Casa, Carro...)
              </label>
              <button 
                onClick={addAsset} 
                className="bg-white dark:bg-stone-800 hover:bg-emerald-50 dark:hover:bg-stone-700 text-stone-900 dark:text-white px-3 py-1.5 rounded-lg text-xs font-bold shadow-sm transition-all flex items-center gap-1"
              >
                <Plus size={14} /> Adicionar
              </button>
            </div>

            <div className="space-y-3">
              {assets.map((asset, index) => (
                <div key={index} className="flex gap-3 items-center animate-in fade-in slide-in-from-left-2 bg-white dark:bg-stone-800 p-3 rounded-2xl shadow-sm border border-emerald-100/50 dark:border-stone-700">
                  <input
                    type="text"
                    placeholder="Nome (ex: Carro)"
                    value={asset.name}
                    onChange={(e) => updateAsset(index, 'name', e.target.value)}
                    className="flex-1 p-2 bg-transparent text-sm font-bold focus:outline-none text-stone-900 dark:text-white placeholder:text-stone-400 placeholder:font-medium"
                  />
                  <div className="h-8 w-px bg-stone-200 dark:bg-stone-700"></div>
                  <div className="relative w-28">
                    <span className="absolute left-0 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-bold">R$</span>
                    <input
                      type="number"
                      placeholder="0,00"
                      value={asset.amount}
                      onChange={(e) => updateAsset(index, 'amount', parseFloat(e.target.value) || 0)}
                      className="w-full pl-6 py-2 bg-transparent text-sm font-bold text-right focus:outline-none text-stone-900 dark:text-white"
                    />
                  </div>
                  <button 
                    onClick={() => removeAsset(index)}
                    className="p-2 text-stone-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
              
              {assets.length === 0 && (
                <div className="text-center py-4">
                  <p className="text-xs text-stone-400 font-medium">Nenhum bem adicionado.</p>
                </div>
              )}
            </div>
          </div>

        </div>

        {/* Rodapé */}
        <div className="p-6 bg-white dark:bg-stone-900 border-t border-stone-100 dark:border-stone-800">
          <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-stone-900 dark:bg-emerald-600 text-white py-4 rounded-full font-bold text-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all shadow-xl flex items-center justify-center gap-2"
          >
            {loading ? 'Salvando...' : <><Save size={20} /> Salvar patrimônio</>}
          </button>
        </div>
      </div>
    </div>
  );
};