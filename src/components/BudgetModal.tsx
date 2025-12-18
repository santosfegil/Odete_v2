import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, Plus, Search, Trash2, Home, ShoppingCart, Car, Heart, 
  Music, GraduationCap, Plane, Dumbbell, Zap, Dog, Briefcase, 
  TrendingUp, Gift, MoreHorizontal, Check, ArrowRight, ArrowLeft, 
  CheckSquare, AlertTriangle, ShoppingBag, Loader2, Coffee 
} from 'lucide-react';
import { supabase } from '../lib/supabase';

// --- TIPOS ---
// Define exatamente o que esperamos da RPC, mas permite flexibilidade
interface RPCReturnItem {
  category_id: string;
  category_name: string;
  icon_key: string | null;
  category_scope: string; 
  budget_limit: number;
  spent_amount: number;
}

interface BudgetModalProps {
  onClose: () => void;
  onSuccess: () => void;
  currentDate: Date;
}

// --- 1. MAPEAMENTO DE ÍCONES (ICON MAP) ---
const ICON_MAP: Record<string, React.ElementType> = {
    'home': Home,
    'food': ShoppingCart,
    'shopping': ShoppingBag,
    'car': Car,
    'transport': Car,
    'health': Heart,
    'fun': Music,
    'education': GraduationCap,
    'travel': Plane,
    'gym': Dumbbell,
    'bill': Zap,
    'pet': Dog,
    'income': Briefcase,
    'invest': TrendingUp,
    'gift': Gift,
    'other': MoreHorizontal,
};

// --- HELPER DE ÍCONES (Robustez para garantir que sempre apareça algo) ---
const getIcon = (iconKey: string | null | undefined, categoryName: string, size = 24) => {
    // 1. Tenta a chave exata do banco
    if (iconKey && ICON_MAP[iconKey]) {
        const Icon = ICON_MAP[iconKey];
        return <Icon size={size} />;
    }

    // 2. Tenta adivinhar pelo nome (Fallback do seu código original)
    const n = (categoryName || '').toLowerCase();
    if (n.includes('moradia') || n.includes('aluguel') || n.includes('casa')) return <Home size={size} />;
    if (n.includes('aliment') || n.includes('mercado') || n.includes('food')) return <ShoppingCart size={size} />;
    if (n.includes('transporte') || n.includes('uber') || n.includes('carro')) return <Car size={size} />;
    if (n.includes('saúde') || n.includes('farma') || n.includes('médico')) return <Heart size={size} />;
    if (n.includes('luz') || n.includes('internet') || n.includes('conta')) return <Zap size={size} />;
    if (n.includes('lazer') || n.includes('diversão')) return <Music size={size} />;
    if (n.includes('educa') || n.includes('curso')) return <GraduationCap size={size} />;
    if (n.includes('viagem')) return <Plane size={size} />;
    if (n.includes('academia') || n.includes('gym')) return <Dumbbell size={size} />;
    if (n.includes('invest')) return <TrendingUp size={size} />;
    if (n.includes('salário') || n.includes('receita')) return <Briefcase size={size} />;

    // 3. Genérico
    return <MoreHorizontal size={size} />;
};

// Helper de Moeda
const toMoney = (val: number) => val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });


export const formatCurrency = (value) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 2,
    }).format(value);
  };

export const BudgetModal: React.FC<BudgetModalProps> = ({ onClose, onSuccess, currentDate }) => {
  // STATES
  const [items, setItems] = useState<RPCReturnItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // UI STATES
  const [step, setStep] = useState<0 | 1 | 2>(0); 
  const [activeTab, setActiveTab] = useState<'expense' | 'income'>('expense');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState(false);
  const [itemToDeleteId, setItemToDeleteId] = useState<string | null>(null);

  // WIZARD STATES
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [tempValues, setTempValues] = useState<Record<string, number>>({});
  const [isSelectionMode, setIsSelectionMode] = useState(false);

  // --- CARREGAMENTO DE DADOS ---
  const fetchBudgets = async () => {
    setLoading(true);
    try {
      console.log('--- Buscando dados do Orçamento ---');
      const { data, error } = await supabase.rpc('get_budget_summary', {
        p_month: currentDate.getMonth() + 1,
        p_year: currentDate.getFullYear()
      });

      if (error) throw error;
      
      console.log('Dados recebidos:', data); // Verifique isso no console do navegador
      setItems(data || []);
    } catch (err) {
      console.error('Erro ao carregar orçamentos:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, [currentDate]);

  // --- FILTROS INTELIGENTES ---
  
  const activeItems = useMemo(() => 
    items.filter(i => i.category_scope === activeTab && (i.budget_limit || 0) > 0),
  [items, activeTab]);

  // 2. Itens DISPONÍVEIS para adicionar
  const availableToAdd = useMemo(() => 
    items.filter(i => {
      // Aqui usamos category_scope direto, sem precisar da função getCategoryType
      const isCorrectType = i.category_scope === activeTab;
      const noBudget = (!i.budget_limit || i.budget_limit === 0);
      const matchesSearch = i.category_name.toLowerCase().includes(searchTerm.toLowerCase());
      return isCorrectType && noBudget && matchesSearch;
    }),
  [items, searchTerm, activeTab]);

  // 3. Totais (Cabeçalho)
  const totalIncome = useMemo(() => items.filter(c => c.category_scope === 'income').reduce((acc, c) => acc + (c.budget_limit || 0), 0), [items]);
  const totalExpenses = useMemo(() => items.filter(c => c.category_scope === 'expense').reduce((acc, c) => acc + (c.budget_limit || 0), 0), [items]);const totalSaved = totalIncome - totalExpenses;

  // Totais Projetados (Wizard)
  const totalWizardInput = Object.values(tempValues).reduce((acc, v) => acc + v, 0);
  const projectedIncome = activeTab === 'income' ? totalIncome + totalWizardInput : totalIncome;
  const projectedExpenses = activeTab === 'expense' ? totalExpenses + totalWizardInput : totalExpenses;
  const projectedSaved = projectedIncome - projectedExpenses;

  // --- ACTIONS DATABASE ---

  const handleUpsertBudget = async (categoryId: string, amount: number) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { error } = await supabase.from('budgets').upsert({
        user_id: user.id,
        category_id: categoryId,
        amount_limit: amount,
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear()
      }, { onConflict: 'user_id, category_id, month, year' });

      if (error) throw error;

      // Atualização Otimista local para não precisar recarregar tudo e piscar a tela
      setItems(prev => prev.map(i => i.category_id === categoryId ? { ...i, budget_limit: amount } : i));
      onSuccess(); 
    } catch (err) {
      console.error('Erro ao salvar:', err);
    }
  };

  const executeDelete = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const idsToDelete = itemToDeleteId ? [itemToDeleteId] : selectedIds;

      // Para "excluir" o orçamento, na verdade fazemos um upsert com valor 0 ou deletamos a row. 
      // Deletar a row é mais limpo.
      const { error } = await supabase.from('budgets').delete().in('category_id', idsToDelete).match({
        user_id: user.id,
        month: currentDate.getMonth() + 1,
        year: currentDate.getFullYear()
      });

      if (error) throw error;

      setDeleteConfirmation(false);
      setItemToDeleteId(null);
      setSelectedIds([]);
      setIsSelectionMode(false);
      setEditingId(null);
      fetchBudgets(); // Recarrega para garantir
      onSuccess();
    } catch (err) {
      console.error('Erro ao excluir:', err);
    }
  };

  const confirmAddWizard = async () => {
    try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;
  
        const upsertData = selectedIds.map(catId => ({
          user_id: user.id,
          category_id: catId,
          amount_limit: tempValues[catId] || 0,
          month: currentDate.getMonth() + 1,
          year: currentDate.getFullYear()
        }));
  
        const { error } = await supabase.from('budgets').upsert(upsertData, { onConflict: 'user_id, category_id, month, year' });
        if (error) throw error;
  
        setStep(0);
        setSelectedIds([]);
        setTempValues({});
        
        // ORDEM IMPORTANTE:
        onSuccess(); // Atualiza os dados do pai
        onClose();   // Fecha o modal explicitamente (só quando termina o wizard)
        
      } catch (err) {
        console.error('Erro wizard:', err);
      }
   
  };

  // --- RENDER ---
  const handleCardClick = (id: string) => {
    if (editingId === id) return;
    setEditingId(id);
  };

  const startAdd = () => {
    setEditingId(null);
    setSelectedIds([]);
    setSearchTerm('');
    setStep(1);
  };

  const toggleSelectWizard = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  const goToValues = () => {
    const init: Record<string, number> = {};
    selectedIds.forEach(id => init[id] = 0);
    setTempValues(init);
    setStep(2);
  };

  const toggleSelectHome = (id: string) => {
    if (!isSelectionMode) return;
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };

  if (loading && step === 0) {
    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[50]">
            <Loader2 className="animate-spin text-white" size={48} />
        </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[50] p-4 font-sans text-stone-900" onClick={() => setEditingId(null)}>
      <div 
        className="bg-emerald-50 dark:bg-stone-900 w-full max-w-md rounded-[2rem] shadow-2xl flex flex-col h-[85vh] overflow-hidden border border-white/50 dark:border-stone-800 relative transition-all"
        onClick={(e) => e.stopPropagation()} 
      >
        
        {/* TELA 0: HOME */}
        {step === 0 && (
          <>
            <div className="p-6 pb-2 bg-transparent dark:bg-stone-900 z-10" onClick={() => setEditingId(null)}>
              <div className="flex justify-between items-center mb-4">
                {isSelectionMode ? (
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setIsSelectionMode(false); setSelectedIds([]) }} className="text-stone-500 font-bold text-sm">Cancelar</button>
                    <span className="font-bold dark:text-white text-red-500">{selectedIds.length} para excluir</span>
                  </div>
                ) : (
                  <h3 className="text-2xl font-extrabold text-stone-900 dark:text-white">Orçamento</h3>
                )}
                
                <div className="flex gap-2">
                  <button 
                    onClick={() => {
                      setIsSelectionMode(!isSelectionMode);
                      setSelectedIds([]);
                      setEditingId(null);
                    }}
                    className={`p-2 rounded-full transition-colors ${isSelectionMode ? 'bg-red-100 text-red-600' : 'bg-white dark:bg-stone-800 text-stone-500 hover:bg-stone-200'}`}
                  >
                    <Trash2 size={20} />
                  </button>
                  <button onClick={onClose} className="p-2 bg-white dark:bg-stone-800 rounded-full hover:bg-stone-200"><X size={20} /></button>
                </div>
              </div>

              {!isSelectionMode && (
                <div className="flex justify-between items-center bg-white dark:bg-stone-800 p-4 rounded-2xl mb-4 shadow-sm">
                  <div className="text-center flex-1">
                    <p className="text-[10px]  font-bold text-stone-500 mb-1 tracking-wider">Receita esperada</p>
                    <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{toMoney(totalIncome)}</p>
                  </div>
                  <div className="h-8 w-px bg-stone-200 dark:bg-stone-700"></div>
                  <div className="text-center flex-1">
                    <p className="text-[10px]  font-bold text-stone-500 mb-1 tracking-wider">Gasto esperado</p>
                    <p className="text-sm font-extrabold text-stone-900 dark:text-white">{toMoney(totalExpenses)}</p>
                  </div>
                  <div className="h-8 w-px bg-stone-200 dark:bg-stone-700"></div>
                  <div className="text-center flex-1">
                    <p className="text-[10px]  font-bold text-stone-500 mb-1 tracking-wider">Economia esperada</p>
                    <p className={`text-sm font-extrabold ${totalSaved >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                      {toMoney(totalSaved)}
                    </p>
                  </div>
                </div>
              )}

              {!isSelectionMode && (
                <div className="flex bg-stone-200/50 dark:bg-stone-800 p-1 rounded-2xl">
                  <button onClick={() => {setActiveTab('expense'); setEditingId(null)}} className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'expense' ? 'bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-white' : 'text-stone-400'}`}>
                    Despesas
                  </button>
                  <button onClick={() => {setActiveTab('income'); setEditingId(null)}} className={`flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${activeTab === 'income' ? 'bg-white dark:bg-stone-700 shadow-sm text-stone-900 dark:text-white' : 'text-stone-400'}`}>
                    Receitas
                  </button>
                </div>
              )}
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-24 custom-scrollbar" onClick={() => setEditingId(null)}>
              <div className="grid grid-cols-3 gap-2">
                
                {/* Botão Adicionar */}
                {!isSelectionMode && (
                  <button 
                    onClick={(e) => { e.stopPropagation(); startAdd(); }}
                    className="aspect-square rounded-2xl border-2 border-dashed border-emerald-300 dark:border-stone-700 flex flex-col items-center justify-center gap-2 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-100/50 dark:hover:bg-emerald-900/20 transition-all group"
                  >
                    <div className="p-2 rounded-full bg-emerald-100 dark:bg-emerald-900/50 group-hover:scale-110 transition-transform text-emerald-600">
                      <Plus size={20} />
                    </div>
                    <span className="text-[10px] font-bold">Adicionar</span>
                  </button>
                )}

                {/* Cards Ativos */}
                {activeItems.map(item => {
                  const isEditing = editingId === item.category_id;
                  const isSelected = selectedIds.includes(item.category_id);
                  const budget = item.budget_limit || 0;
                  const spent = item.spent_amount || 0;
                  const isOver = spent > budget;
                  const progress = budget > 0 ? Math.min((spent / budget) * 100, 100) : 0;
                  
                  // Tenta pegar chave do ícone de várias formas
                  const iconKey = item.icon_key || item.category_icon; 

                  return (
                    <div 
                      key={item.category_id}
                      onClick={(e) => { e.stopPropagation(); isSelectionMode ? toggleSelectHome(item.category_id) : handleCardClick(item.category_id); }}
                      className={`
                        relative flex flex-col justify-between p-3 rounded-2xl text-left transition-all duration-200 border aspect-square cursor-pointer
                        ${isEditing 
                          ? 'bg-white dark:bg-stone-800 ring-2 ring-emerald-500 shadow-lg scale-105 z-10' 
                          : 'bg-white dark:bg-stone-800 border-transparent shadow-sm hover:scale-[1.02]'
                        }
                        ${isSelected && isSelectionMode ? 'ring-2 ring-red-500 bg-red-50 dark:bg-red-900/20' : ''}
                      `}
                    >
                      <div className="flex justify-between items-start w-full">
                        <div className={`p-2 rounded-xl ${isSelected ? 'bg-white/50 text-red-500' : 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400'}`}>
                          {getIcon(iconKey, item.category_name, 16)}
                        </div>
                        
                        {isSelectionMode && (
                          <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${isSelected ? 'bg-red-500 border-red-500' : 'border-stone-200 bg-white'}`}>
                            {isSelected && <Trash2 size={12} className="text-white" />}
                          </div>
                        )}

                        {isEditing && (
                          <button 
                            onClick={(e) => { e.stopPropagation(); setItemToDeleteId(item.category_id); setDeleteConfirmation(true); }}
                            className="p-1.5 bg-red-50 text-red-500 rounded-lg hover:bg-red-100 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        )}
                      </div>

                      <div className="w-full">
                        <span className="block font-bold text-stone-900 dark:text-white text-xs truncate mb-1">{item.category_name}</span>
                        
                        {isEditing ? (
                          <div className="relative animate-in fade-in duration-200">
                            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[10px] font-bold text-stone-400">R$</span>
                            <input 
                              type="number"
                              autoFocus
                              defaultValue={budget}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    handleUpsertBudget(item.category_id, parseFloat(e.currentTarget.value) || 0);
                                    setEditingId(null);
                                }
                              }}
                              onBlur={(e) => handleUpsertBudget(item.category_id, parseFloat(e.target.value) || 0)}
                              className="w-full bg-stone-50 dark:bg-stone-900 pl-4 py-1 rounded-md text-xs font-bold text-stone-900 dark:text-white outline-none focus:ring-1 focus:ring-emerald-500 transition-all"
                            />
                          </div>
                        ) : (
                          <>
                            <div className="h-1 w-full bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden mb-1">
                              <div 
                                className={`h-full rounded-full ${isOver ? 'bg-red-500' : 'bg-emerald-500'}`} 
                                style={{ width: `${progress}%` }}
                              />
                            </div>
                            <div className="text-[9px] text-stone-400 font-medium truncate flex justify-between items-center">
                            <span>
  <span className={isOver ? 'text-red-500 font-bold' : ''}>
    {/* Converte para número e formata BRL */}
    {Number(spent).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
  </span>
  {' / '}
  {/* Faz o mesmo para o budget para ficar padronizado */}
  {Number(budget).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
</span>
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            {isSelectionMode && selectedIds.length > 0 && (
              <div className="absolute bottom-6 left-6 right-6 animate-in slide-in-from-bottom-4">
                <button 
                  onClick={() => { setItemToDeleteId(null); setDeleteConfirmation(true); }}
                  className="w-full bg-red-500 text-white py-4 rounded-2xl font-bold shadow-xl flex items-center justify-center gap-2 hover:bg-red-600 transition-colors"
                >
                  <Trash2 size={20} /> Excluir {selectedIds.length}
                </button>
              </div>
            )}
          </>
        )}

        {/* TELA 1: SELEÇÃO ÍCONES (WIZARD) */}
        {step === 1 && (
          <div className="flex flex-col h-full bg-emerald-50 dark:bg-stone-900 animate-in slide-in-from-right duration-300">
            <div className="p-6 pb-2 flex items-center gap-3">
              <button onClick={() => setStep(0)} className="p-2 bg-white hover:bg-stone-200 dark:bg-stone-800 dark:hover:bg-stone-700 rounded-full transition-colors"><ArrowLeft size={24} className="text-stone-600 dark:text-white" /></button>
              <div>
                <h3 className="text-xl font-extrabold text-stone-900 dark:text-white">Adicionar</h3>
                <p className="text-xs text-stone-500">Selecione as categorias</p>
              </div>
            </div>

            <div className="px-6 py-4">
              <div className="flex items-center gap-3 bg-white dark:bg-stone-800 p-3 rounded-2xl shadow-sm">
                <Search className="text-stone-400" size={20} />
                <input 
                  autoFocus
                  placeholder="Buscar..."
                  className="flex-1 bg-transparent font-bold text-stone-900 dark:text-white outline-none placeholder:font-medium placeholder:text-stone-400"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                />
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-24 custom-scrollbar">
              <div className="grid grid-cols-3 gap-2">
                {availableToAdd.length === 0 && (
                     <div className="col-span-3 text-center py-10 text-stone-400 text-xs">
                        Nenhuma categoria disponível encontrada.
                     </div>
                )}
                {availableToAdd.map(item => {
                  const isSelected = selectedIds.includes(item.category_id);
                  const iconKey = item.icon_key || item.category_icon;

                  return (
                    <button 
                      key={item.category_id}
                      onClick={() => toggleSelectWizard(item.category_id)}
                      className={`
                        flex flex-col items-center justify-center p-3 rounded-2xl aspect-square transition-all duration-200 border
                        ${isSelected 
                          ? 'bg-stone-900 dark:bg-emerald-600 text-white transform scale-95 shadow-lg border-transparent' 
                          : 'bg-white dark:bg-stone-800 text-stone-500 hover:bg-stone-100 dark:hover:bg-stone-700 shadow-sm border-transparent'
                        }
                      `}
                    >
                      <div className={`mb-2 p-2 rounded-full ${isSelected ? 'bg-white/20' : 'bg-stone-100 dark:bg-stone-900 text-emerald-600 dark:text-emerald-400'}`}>
                        {getIcon(iconKey, item.category_name, 20)}
                      </div>
                      <span className="text-[10px] font-bold text-center truncate w-full">{item.category_name}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="absolute bottom-6 left-6 right-6">
              <button 
                onClick={goToValues}
                disabled={selectedIds.length === 0}
                className="w-full bg-stone-900 dark:bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg shadow-2xl hover:scale-[1.02] active:scale-[0.98] disabled:opacity-0 disabled:translate-y-10 transition-all flex items-center justify-center gap-2"
              >
                Continuar ({selectedIds.length}) <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* TELA 2: VALORES (WIZARD) */}
        {step === 2 && (
          <div className="flex flex-col h-full bg-emerald-50 dark:bg-stone-900 animate-in slide-in-from-right duration-300">
            <div className="p-6 bg-transparent dark:bg-stone-800 rounded-b-[2rem] z-10">
              <div className="flex justify-between items-center mb-4">
                <div className="flex items-center gap-2">
                  <button onClick={() => setStep(1)} className="p-2 bg-white hover:bg-stone-100 dark:bg-stone-800 dark:hover:bg-stone-700 rounded-full transition-colors"><ArrowLeft size={24} className="text-stone-600 dark:text-white" /></button>
                  <h3 className="text-xl font-extrabold text-stone-900 dark:text-white">Valores</h3>
                </div>
              </div>

              <div className="flex justify-between items-center bg-white dark:bg-stone-900 p-4 rounded-2xl shadow-sm">
                <div className="text-center flex-1">
                  <p className="text-[10px]  font-bold text-stone-500 mb-1 tracking-wider">Receita esperado</p>
                  <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">{toMoney(projectedIncome)}</p>
                </div>
                <div className="h-8 w-px bg-stone-200 dark:bg-stone-700"></div>
                <div className="text-center flex-1">
                  <p className="text-[10px]  font-bold text-stone-500 mb-1 tracking-wider">Gasto esperado</p>
                  <p className="text-sm font-extrabold text-stone-900 dark:text-white">{toMoney(projectedExpenses)}</p>
                </div>
                <div className="h-8 w-px bg-stone-200 dark:bg-stone-700"></div>
                <div className="text-center flex-1">
                  <p className="text-[10px]  font-bold text-stone-500 mb-1 tracking-wider">Economia esperada</p>
                  <p className={`text-sm font-extrabold ${projectedSaved >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-500'}`}>
                    {toMoney(projectedSaved)}
                  </p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar">
              <div className="grid grid-cols-3 gap-2">
                {selectedIds.map((catId, idx) => {
                  const item = items.find(i => i.category_id === catId);
                  const name = item?.category_name || '';
                  const iconKey = item?.icon_key || item?.category_icon;

                  return (
                    <div key={catId} className="bg-white dark:bg-stone-800 p-3 rounded-2xl shadow-sm flex flex-col justify-between aspect-square animate-in slide-in-from-bottom-4 fill-mode-both" style={{ animationDelay: `${idx * 50}ms` }}>
                      <div className="flex justify-between items-start w-full">
                        <div className="p-2 rounded-xl bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400">
                          {getIcon(iconKey, name, 16)}
                        </div>
                      </div>
                      
                      <div className="w-full">
                        <span className="block font-bold text-stone-900 dark:text-white text-[10px] mb-1 truncate">{name}</span>
                        <div className="relative">
                          <span className="absolute left-0 top-1/2 -translate-y-1/2 text-[10px] font-bold text-stone-400">R$</span>
                          <input 
                            type="number"
                            autoFocus={idx === 0}
                            placeholder="0"
                            value={tempValues[catId] || ''}
                            onChange={e => setTempValues(prev => ({...prev, [catId]: parseFloat(e.target.value) || 0}))}
                            className="w-full bg-transparent border-b border-stone-200 dark:border-stone-700 pl-4 py-0 text-xs font-bold text-stone-900 dark:text-white outline-none focus:border-emerald-500 transition-colors"
                          />
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            <div className="p-6 bg-transparent">
              <button 
                onClick={confirmAddWizard}
                className="w-full bg-stone-900 dark:bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg shadow-xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2"
              >
                <Check size={20} /> Concluir
              </button>
            </div>
          </div>
        )}

        {/* MODAL CONFIRMAÇÃO DELETAR */}
        {deleteConfirmation && (
          <div className="absolute inset-0 z-[100] flex items-center justify-center bg-black/50 p-6 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-stone-900 w-full max-w-sm rounded-3xl p-6 shadow-2xl text-center space-y-4 border border-stone-200 dark:border-stone-800">
              <div className="mx-auto w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center text-red-600"><AlertTriangle size={24} /></div>
              <div>
                <h3 className="text-xl font-bold text-stone-900 dark:text-white">Excluir?</h3>
                <p className="text-sm text-stone-500 dark:text-stone-400 mt-2">
                  {itemToDeleteId ? "Remover item do orçamento?" : `Remover limite de ${selectedIds.length} categorias?`}
                </p>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => { setDeleteConfirmation(false); setItemToDeleteId(null); }} className="flex-1 py-3 bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold rounded-xl hover:bg-stone-200 transition-colors">Cancelar</button>
                <button onClick={executeDelete} className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 transition-colors shadow-lg">Excluir</button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};