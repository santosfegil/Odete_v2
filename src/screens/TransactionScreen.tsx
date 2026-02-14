import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  Search, Filter, Car, Zap, Coffee,
  ShoppingBag, Utensils, Briefcase, Plus, X, Tag, Sparkles,
  ChevronLeft, ChevronRight, Calendar, Clock, ArrowLeft,
  Landmark, Plane, Gift, Home, Gamepad2, FileText, TrendingUp, Loader2,
  EyeOff, Eye, Pencil
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCategoryRules } from '../lib/useCategoryRules';
import CategoryEditModal from '../components/CategoryEditModal';

// Interface alinhada com sua View do Supabase
interface TransactionDetail {
  id: string;
  description: string;
  amount: number;
  date: string;
  type: 'income' | 'expense';
  status: 'paid' | 'pending';
  tags: string[];
  category_name: string;
  category_icon: string;
  category_color: string;
  account_name: string;
  bank_logo: string | null;
  bank_name: string | null;
  ignored_in_charts: boolean;
  receiver_document?: string | null;
  receiver_name?: string | null;
}

interface TransactionScreenProps {
  onBack: () => void;
}

// Mapeamento para garantir que usamos os ícones bonitos do Lucide
// ao invés de emojis, mantendo o design do protótipo
const ICON_MAP: Record<string, React.ElementType> = {
  'food': Utensils,
  'meal': Utensils,
  'shopping': ShoppingBag,
  'transport': Car,
  'uber': Car,
  'health': Zap,
  'pharmacy': Zap,
  'entertainment': Gamepad2,
  'fun': Coffee,
  'bills': FileText,
  'salary': Briefcase,
  'income': TrendingUp,
  'investment': Landmark,
  'travel': Plane,
  'gift': Gift,
  'home': Home,
  'housing': Home,
};

const TransactionScreen: React.FC<TransactionScreenProps> = ({ onBack }) => {
  // --- ESTADOS ---
  const [transactions, setTransactions] = useState<TransactionDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const [activeFilter, setActiveFilter] = useState('Todos');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'pending'>('all');
  const [editingTxId, setEditingTxId] = useState<string | null>(null);
  
  const [newTagInput, setNewTagInput] = useState('');
  const [showTagModal, setShowTagModal] = useState(false);
  const [globalTagInput, setGlobalTagInput] = useState('');
  
  const [searchTerm, setSearchTerm] = useState('');
  
  // Modo de edição de categorias
  const [editMode, setEditMode] = useState(false);
  const [categoryEditTx, setCategoryEditTx] = useState<TransactionDetail | null>(null);

  // Similar transactions for tag batch editing
  const [similarForTags, setSimilarForTags] = useState<{ matches: any[]; matchType: string; matchValue: string } | null>(null);
  const [applyToSimilar, setApplyToSimilar] = useState(false);
  const [createTagRule, setCreateTagRule] = useState(false);
  const { findSimilarTransactions, createRule: createRuleInDb } = useCategoryRules();

  // --- LÓGICA DE DATA ---
  const today = new Date();
  const isCurrentMonth = 
    currentDate.getMonth() === today.getMonth() && 
    currentDate.getFullYear() === today.getFullYear();

  const handlePrevMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const handleNextMonth = () => setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const handleBackToCurrent = () => setCurrentDate(new Date());

  const monthName = currentDate.toLocaleString('pt-BR', { month: 'long', year: 'numeric' });
  const capitalizedMonth = monthName.charAt(0).toUpperCase() + monthName.slice(1);

  // --- BUSCA DADOS (SUPABASE) ---
  const fetchTransactions = useCallback(async () => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth(); 
      const start = new Date(Date.UTC(year, month, 1)).toISOString();
      const end = new Date(Date.UTC(year, month + 1, 0, 23, 59, 59)).toISOString();

      const { data, error } = await supabase
        .from('view_transactions_details')
        .select('*')
        .eq('user_id', user.id)
        .gte('date', start)
        .lte('date', end)
        .order('date', { ascending: false });

      if (error) throw error;
      setTransactions(data || []);
    } catch (err) { 
      console.error('Erro ao buscar transações:', err); 
    } finally { 
      setLoading(false); 
    }
  }, [currentDate]);

  const [systemTags, setSystemTags] = useState<string[]>([]);

  // 2. Adicione esta função para buscar as tags "soltas" do banco
  const fetchTags = useCallback(async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Busca na tabela 'tags' (ajuste o nome se sua tabela for diferente)
      const { data, error } = await supabase.from('tags').select('name').eq('user_id', user.id);
      
      if (error) throw error;
      if (data) setSystemTags(data.map((t: any) => t.name));
    } catch (err) {
      console.error('Erro tags:', err);
    }
  }, []);

  // 3. Adicione fetchTags no useEffect
  useEffect(() => { 
    fetchTransactions(); 
    fetchTags(); 
  }, [fetchTransactions, fetchTags]);


  useEffect(() => { 
    fetchTransactions(); 
  }, [fetchTransactions]);

  // --- FILTROS & CÁLCULOS ---
  const activeTx = transactions.find(t => t.id === editingTxId);

  // Find similar transactions when tag modal opens
  useEffect(() => {
    if (!activeTx) {
      setSimilarForTags(null);
      setApplyToSimilar(false);
      setCreateTagRule(false);
      return;
    }
    const search = async () => {
      const result = await findSimilarTransactions({
        id: activeTx.id,
        description: activeTx.description,
        amount: activeTx.amount,
        receiver_document: activeTx.receiver_document,
        receiver_name: activeTx.receiver_name,
      });
      setSimilarForTags(result);
    };
    search();
  }, [activeTx?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const allKnownTags = useMemo(() => {
    const usedTags = transactions.flatMap(t => t.tags || []);
    return Array.from(new Set([...systemTags, ...usedTags])).sort();
  }, [transactions, systemTags]);

  const txTagSuggestions = useMemo(() => {
    if (!newTagInput.trim()) return [];
    const search = newTagInput.toLowerCase().trim();
    return allKnownTags.filter(tag => 
      tag.toLowerCase().includes(search) && 
      !activeTx?.tags?.includes(tag)
    );
  }, [newTagInput, allKnownTags, activeTx]);

  const globalTagSuggestions = useMemo(() => {
    if (!globalTagInput.trim()) return [];
    const search = globalTagInput.toLowerCase().trim();
    return allKnownTags.filter(tag => tag.toLowerCase().includes(search));
  }, [globalTagInput, allKnownTags]);

  const filteredTransactions = useMemo(() => {
    let list = transactions;

    // 1. NOVO: Filtro por Texto (Campo de Busca)
    if (searchTerm) {
      const s = searchTerm.toLowerCase();
      list = list.filter(t => 
        t.description?.toLowerCase().includes(s) ||
        t.category_name?.toLowerCase().includes(s) ||
        t.account_name?.toLowerCase().includes(s) ||
        t.amount.toString().includes(s)
      );
    }
    
    // 2. Filtro de Botões (MANTIDO ORIGINAL)
    if (activeFilter !== 'Todos') {
        const f = activeFilter.replace('#', '').toLowerCase();
        list = list.filter(t => t.tags?.includes(f) || t.category_name?.toLowerCase() === f || t.account_name?.toLowerCase().includes(f));
    }

    // 3. Filtro de Status (MANTIDO ORIGINAL)
    if (statusFilter !== 'all') list = list.filter(t => t.status === statusFilter);
    
    return list;
  }, [activeFilter, statusFilter, transactions, searchTerm]); // Adicionado searchTerm nas dependências

  const totals = useMemo(() => {
    return filteredTransactions
      .filter(t => !t.ignored_in_charts) // Exclui ignoradas do total
      .reduce((acc, t) => {
        if (t.type === 'expense') {
            const val = Math.abs(t.amount);
            acc.total += val;
            if (t.status === 'pending') acc.pending += val;
            else acc.paid += val;
        }
        return acc; 
    }, { total: 0, pending: 0, paid: 0 });
  }, [filteredTransactions]);

  

  // --- AÇÕES ---
  const addNewGlobalTag = async () => {
    const val = globalTagInput.toLowerCase().trim();
    
    // Verifica na 'allKnownTags' para evitar duplicatas visuais
    if (val && !allKnownTags.includes(val)) {
      // 1. Atualiza visualmente na hora (Otimista)
      setSystemTags(prev => [...prev, val]);
      setGlobalTagInput('');

      // 2. Salva no banco
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('tags').insert([{ name: val, user_id: user.id }]);
      }
    }
  };

  const handleToggleTag = async (tag: string) => {
    if (!activeTx) return;
    const cleanTag = tag.toLowerCase().trim();

    // Determine which transactions to update
    const txIdsToUpdate = [activeTx.id];
    if (applyToSimilar && similarForTags?.matches) {
      const similarIds = similarForTags.matches.map(m => m.id);
      txIdsToUpdate.push(...similarIds);
    }

    // Optimistic Update for all affected transactions
    setTransactions(prev => prev.map(t => {
      if (txIdsToUpdate.includes(t.id)) {
        const currentTags = t.tags || [];
        const newTags = currentTags.includes(cleanTag)
          ? currentTags.filter(x => x !== cleanTag)
          : [...currentTags, cleanTag];
        return { ...t, tags: newTags };
      }
      return t;
    }));

    setNewTagInput('');

    // RPC Supabase - toggle for all affected transactions
    try {
      for (const txId of txIdsToUpdate) {
        await supabase.rpc('toggle_transaction_tag', {
          p_transaction_id: txId,
          p_tag_name: cleanTag
        });
      }

      // Create auto-rule if requested
      if (createTagRule && !activeTx.tags?.includes(cleanTag)) {
        const { data: { user } } = await supabase.auth.getUser();
        if (user) {
          // Find the tag ID
          const { data: tagRecord } = await supabase
            .from('tags')
            .select('id')
            .eq('user_id', user.id)
            .eq('name', cleanTag)
            .single();

          if (tagRecord && similarForTags) {
            const ruleData: any = {
              user_id: user.id,
              target_tag_id: tagRecord.id,
              priority: 10,
              is_active: true,
            };

            if (similarForTags.matchType === 'document' && activeTx.receiver_document) {
              ruleData.match_receiver_document = activeTx.receiver_document;
              ruleData.rule_name = `Tag: Doc ${activeTx.receiver_document.slice(-4)}`;
            } else if (similarForTags.matchType === 'name_amount' && activeTx.receiver_name) {
              ruleData.match_receiver_name = activeTx.receiver_name;
              ruleData.match_amount_min = activeTx.amount * 0.9;
              ruleData.match_amount_max = activeTx.amount * 1.1;
              ruleData.rule_name = `Tag: ${activeTx.receiver_name}`;
            } else {
              const keywords = activeTx.description.split(' ').slice(0, 3).join(' ');
              ruleData.match_description_contains = keywords;
              ruleData.rule_name = `Tag: ${keywords}`;
            }

            await createRuleInDb(ruleData);
          }
        }
      }
    } catch (error) {
      console.error("Erro ao atualizar tag:", error);
    }
  };

  const handleInputConfirm = () => {
    if (newTagInput && activeTx) {
      handleToggleTag(newTagInput);
    }
  };

  const toggleStatusFilter = (status: 'paid' | 'pending') => {
    setStatusFilter(prev => prev === status ? 'all' : status);
  };

  // Toggle para ignorar transação do orçamento
  const toggleIgnoredInCharts = async (txId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Previne abrir modal de tags
    
    const tx = transactions.find(t => t.id === txId);
    if (!tx) return;
    
    const newValue = !tx.ignored_in_charts;
    
    // Optimistic update
    setTransactions(prev => prev.map(t => 
      t.id === txId ? { ...t, ignored_in_charts: newValue } : t
    ));
    
    // Update in Supabase
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ ignored_in_charts: newValue })
        .eq('id', txId);
      
      if (error) throw error;
    } catch (err) {
      console.error('Erro ao atualizar ignored_in_charts:', err);
      // Revert on error
      setTransactions(prev => prev.map(t => 
        t.id === txId ? { ...t, ignored_in_charts: !newValue } : t
      ));
    }
  };

  // Helper para formatar data bonita (ex: "18 Dez, 14:30")
  const formatDateDisplay = (dateString: string) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleString('pt-BR', { month: 'short' }).replace('.', '');
    const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0;
    const time = hasTime ? `, ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}` : '';
    return `${day} ${month.charAt(0).toUpperCase() + month.slice(1)}${time}`;
  };

  return (
    <div className="fixed inset-0 z-[60] bg-stone-900 flex items-center justify-center p-0 sm:p-4 font-sans text-stone-900 animate-in slide-in-from-right duration-300">
      <div className="w-full h-full sm:h-[800px] sm:max-w-md bg-stone-50 sm:rounded-[2.5rem] shadow-2xl overflow-hidden relative border-0 sm:border-[6px] border-stone-900/20 flex flex-col">
        
        {/* CABEÇALHO */}
        <div className="bg-white/90 backdrop-blur-xl z-20 px-6 pt-10 pb-4 border-b border-stone-100 sticky top-0">
          
          {/* Navegação */}
          <div className="flex justify-between items-center mb-6">
            <div className="flex items-center gap-3">
                <button onClick={onBack} className="p-2.5 bg-stone-100 rounded-full text-stone-600 hover:bg-stone-200 transition-colors">
                    <ArrowLeft size={20} />
                </button>

                <div className="flex items-center gap-2 bg-stone-100/50 p-1 rounded-full">
                    <button onClick={handlePrevMonth} className="p-2 hover:bg-white rounded-full transition-all text-stone-500 hover:shadow-sm"><ChevronLeft size={18}/></button>
                    <span className="text-xs font-bold text-stone-600 min-w-[80px] text-center ">{capitalizedMonth}</span>
                    <button onClick={handleNextMonth} className="p-2 hover:bg-white rounded-full transition-all text-stone-500 hover:shadow-sm"><ChevronRight size={18}/></button>
                </div>

                {!isCurrentMonth && (
                    <button onClick={handleBackToCurrent} className="flex items-center gap-1.5 px-3 py-2 bg-emerald-100/50 text-emerald-700 rounded-full text-xs font-bold hover:bg-emerald-100 transition-colors animate-in fade-in zoom-in">
                        <Calendar size={14} />
                    </button>
                )}
            </div>

            <div className="flex gap-2">
              <button 
                onClick={() => setEditMode(!editMode)} 
                className={`p-3 rounded-full border transition-all shadow-sm active:scale-95 ${
                  editMode 
                    ? 'bg-amber-500 text-white border-amber-500' 
                    : 'bg-stone-50 text-stone-500 border-stone-100 hover:bg-stone-100'
                }`}
                title="Editar categorias"
              >
                <Pencil size={20} />
              </button>
              <button onClick={() => setShowTagModal(true)} className="p-3 bg-stone-50 rounded-full text-stone-500 border border-stone-100 hover:bg-stone-100 active:scale-95 transition-all shadow-sm">
                <Filter size={20} />
              </button>
            </div>
          </div>

          {/* TOTAIS */}
          <div className="mb-6">
             <div className="animate-in slide-in-from-bottom-2 fade-in duration-300">
                <p className="text-xs font-bold text-stone-400 mb-1">
                    {activeFilter === 'Todos' ? 'Gasto total' : `Gastos com ${activeFilter}`}
                </p>
                
                <h1 className="text-3xl font-extrabold text-stone-900 tracking-tight flex items-baseline gap-2">
                   {totals.total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                </h1>

                {/* Filtros de Status */}
                {totals.total > 0 && (
                    <div className="flex gap-3 mt-3">
                        <button onClick={() => toggleStatusFilter('paid')} className={`flex items-center gap-2 text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all border ${statusFilter === 'paid' ? 'bg-emerald-100 text-emerald-700 border-emerald-200 ring-2 ring-emerald-500/20' : 'bg-stone-50 text-stone-500 border-stone-100 hover:bg-stone-100'}`}>
                            <div className={`w-1.5 h-1.5 rounded-full ${statusFilter === 'paid' ? 'bg-emerald-600' : 'bg-emerald-400'}`} />
                            Pago: {totals.paid.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                            {statusFilter === 'paid' && <X size={10} className="ml-1 opacity-50"/>}
                        </button>

                        {(totals.pending > 0 || statusFilter === 'pending') && (
                            <button onClick={() => toggleStatusFilter('pending')} className={`flex items-center gap-2 text-[10px] font-bold px-3 py-1.5 rounded-xl transition-all border ${statusFilter === 'pending' ? 'bg-amber-100 text-amber-700 border-amber-200 ring-2 ring-amber-500/20' : 'bg-stone-50 text-stone-500 border-stone-100 hover:bg-stone-100'}`}>
                                <div className={`w-1.5 h-1.5 rounded-full ${statusFilter === 'pending' ? 'bg-amber-600' : 'bg-amber-400'}`} />
                                A Pagar: {totals.pending.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
                                {statusFilter === 'pending' && <X size={10} className="ml-1 opacity-50"/>}
                            </button>
                        )}
                    </div>
                )}
             </div>
          </div>

          {/* Filtros Pills */}
          <div className="space-y-4">
            {activeFilter === 'Todos' && (
                <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 group-focus-within:text-emerald-500 transition-colors" size={20} />
                <input type="text" placeholder="Buscar..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-stone-100/50 border-none rounded-2xl py-3.5 pl-11 pr-4 text-sm font-bold placeholder:font-medium placeholder:text-stone-400 focus:bg-white transition-all outline-none"/>
                </div>
            )}
            <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1 -mx-6 px-6">
  {/* CORREÇÃO: Usar 'allKnownTags' que junta as tags do sistema + tags das transações */}
  {['Todos', ...allKnownTags].map(tag => (
     <button 
       key={tag} 
       onClick={() => setActiveFilter(activeFilter === tag ? 'Todos' : tag)} 
       className={`px-4 py-2 rounded-xl text-xs font-bold border whitespace-nowrap ${
         activeFilter === tag 
           ? 'bg-stone-900 text-white' 
           : 'bg-white text-stone-500'
       }`}
     >
       {tag}
     </button>
  ))}
</div>
          </div>
        </div>

        {/* LISTA */}
        <div className="flex-1 px-4 py-4 space-y-3 overflow-y-auto pb-24 custom-scrollbar bg-stone-50">
          {loading ? (
             <div className="flex flex-col items-center justify-center h-40">
                <Loader2 className="animate-spin text-emerald-500 mb-2" size={30} />
                <p className="text-xs text-stone-400 font-bold">Carregando transações...</p>
             </div>
          ) : filteredTransactions.length === 0 ? (
             <div className="flex flex-col items-center justify-center h-40 text-stone-400">
                <Filter size={40} className="mb-2 opacity-20"/>
                <p className="text-sm font-bold mt-4">Nenhum gasto encontrado</p>
                {statusFilter !== 'all' && (
                    <button onClick={() => setStatusFilter('all')} className="mt-2 text-xs text-emerald-600 font-bold hover:underline">
                        Limpar filtro de status
                    </button>
                )}
             </div>
          ) : (
             filteredTransactions.map((tx) => {
                const isPending = tx.status === 'pending';
                // Resolve o ícone baseado no nome que vem do banco
                const IconComponent = ICON_MAP[tx.category_icon?.toLowerCase()] || Sparkles; 

                return (
                    <div 
                    key={tx.id}
                    onClick={() => {
                      if (editMode) {
                        setCategoryEditTx(tx);
                      } else {
                        setEditingTxId(tx.id);
                      }
                    }}
                    className={`
                        group relative p-4 rounded-[1.5rem] border shadow-[0_2px_8px_-2px_rgba(0,0,0,0.05)] flex items-center gap-4 hover:scale-[1.01] transition-all cursor-pointer active:scale-[0.99]
                        ${isPending 
                            ? 'bg-white/60 border-amber-200/50 hover:bg-white hover:border-amber-300 hover:shadow-amber-100' 
                            : 'bg-white border-stone-100 hover:shadow-lg hover:border-emerald-500/20'
                        }
                    `}
                    >
                        <div className={`relative flex-shrink-0 ${isPending ? 'opacity-80' : ''}`}>
                            <div 
                            className="w-12 h-12 rounded-[18px] flex items-center justify-center text-white shadow-sm transition-transform group-hover:rotate-3"
                            style={{ backgroundColor: isPending ? '#d6d3d1' : (tx.category_color || '#9CA3AF') }}
                            >
                                <IconComponent size={22} strokeWidth={2.5} />
                            </div>
                            
                            {tx.bank_logo && (
                                <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-white p-0.5 shadow-md border border-stone-100 z-10 flex items-center justify-center overflow-hidden">
                                    <img 
                                      src={tx.bank_logo} 
                                      alt="Bank" 
                                      className="w-full h-full rounded-full object-cover grayscale-[0.2]" 
                                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }} 
                                    />
                                </div>
                            )}
                        </div>

                        <div className="flex-1 min-w-0 pr-2">
                            <h3 className={`font-extrabold text-sm truncate leading-tight mb-1.5 ${isPending ? 'text-stone-500' : 'text-stone-900'}`}>{tx.description}</h3>
                            <div className="flex flex-wrap items-center gap-1.5 text-[10px] font-bold text-stone-500">
                                <span>{tx.category_name}</span>
                                {tx.tags && tx.tags.length > 0 ? (
                                    tx.tags.map(tag => (
                                    <span key={tag} className="bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-[6px] border border-emerald-100/50">#{tag}</span>
                                    ))
                                ) : (
                                    <span className="text-stone-300 border border-dashed border-stone-300 px-1.5 rounded-md opacity-0 group-hover:opacity-100 transition-opacity">+ tag</span>
                                )}
                            </div>
                        </div>

                        <div className="text-right flex flex-col justify-center items-end shrink-0 pl-2">
                            <div className="flex items-center justify-end gap-1 mb-1">
                                {/* Toggle Ignorar do Orçamento */}
                                <button
                                  onClick={(e) => toggleIgnoredInCharts(tx.id, e)}
                                  className={`p-1 rounded-md transition-all ${
                                    tx.ignored_in_charts
                                      ? 'bg-violet-100 text-violet-600 hover:bg-violet-200'
                                      : 'bg-stone-100 text-stone-400 hover:bg-stone-200 opacity-0 group-hover:opacity-100'
                                  }`}
                                  title={tx.ignored_in_charts ? 'Incluir no orçamento' : 'Ignorar do orçamento'}
                                >
                                  {tx.ignored_in_charts ? <EyeOff size={12} /> : <Eye size={12} />}
                                </button>
                                {isPending && <span className="bg-amber-100 text-amber-700 text-[8px] font-bold px-1.5 py-0.5 rounded flex items-center gap-1 whitespace-nowrap"><Clock size={8} /> A Pagar</span>}
                                <span className={`text-[9px] font-bold whitespace-nowrap px-1.5 py-0.5 rounded-md ${isPending ? 'bg-amber-50 text-amber-600' : 'bg-stone-100 text-stone-400'}`}>
                                  {formatDateDisplay(tx.date)}
                                </span>
                            </div>
                            <span className={`block font-black text-sm ${tx.ignored_in_charts ? 'text-violet-400 line-through' : isPending ? 'text-stone-400' : tx.type === 'income' ? 'text-emerald-600' : 'text-stone-900'}`}>
                                {tx.type === 'expense' ? '-' : '+'} {Math.abs(tx.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </span>
                            <span className="text-[9px] font-bold text-stone-400 truncate max-w-[80px] block mt-0.5">{tx.account_name}</span>
                        </div>
                    </div>
                );
             })
          )}
          
          <div className="h-20" />
        </div>

        {/* MODAL GLOBAL DE TAGS */}
        {showTagModal && (
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex flex-col justify-end animate-in fade-in duration-200">
            <div className="flex-1" onClick={() => setShowTagModal(false)} />
            <div className="bg-white rounded-t-[2.5rem] p-6 pb-24 animate-in slide-in-from-bottom duration-300 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                <div><h2 className="text-xl font-extrabold text-stone-900">Tags do Sistema</h2><p className="text-xs text-stone-500 font-medium">Crie tags para usar nos filtros</p></div>
                <button onClick={() => setShowTagModal(false)} className="p-2 bg-stone-100 rounded-full text-stone-500 hover:bg-stone-200"><X size={20} /></button>
              </div>
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 mb-6">
                <div className="flex items-center gap-2">
                   <div className="flex-1 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-bold">#</span>
                      <input value={globalTagInput} onChange={(e) => setGlobalTagInput(e.target.value.toLowerCase().trim())} onKeyDown={(e) => e.key === 'Enter' && addNewGlobalTag()} placeholder="criar nova tag..." autoFocus className="w-full bg-white border border-stone-200 rounded-xl py-3 pl-7 pr-4 text-sm font-bold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all lowercase placeholder:normal-case"/>
                   </div>
                   <button onClick={addNewGlobalTag} disabled={!globalTagInput || allKnownTags.includes(globalTagInput)} className="bg-emerald-500 text-white p-3 rounded-xl disabled:opacity-50 disabled:bg-stone-300 transition-colors"><Plus size={20} /></button>
                </div>
                {globalTagSuggestions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-stone-200/50 animate-in fade-in"><p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Sparkles size={10} /> Sugestões encontradas</p><div className="flex flex-wrap gap-2">{globalTagSuggestions.map(tag => (<div key={tag} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-stone-200 text-stone-500 rounded-lg text-xs font-bold shadow-sm"><span className="opacity-50">#</span>{tag}</div>))}</div></div>
                )}
              </div>
              <div className="mb-6 max-h-[300px] overflow-y-auto custom-scrollbar"><div className="flex flex-wrap gap-2">{allKnownTags.map(tag => (<div key={tag} className="flex items-center gap-1 px-3 py-2 bg-white border border-stone-200 rounded-xl text-xs font-bold text-stone-600 shadow-sm"><Tag size={12} className="text-stone-300" /><span>#{tag}</span></div>))}</div></div>
            </div>
          </div>
        )}

        {/* MODAL EDITAR TAGS DA TRANSAÇÃO */}
        {activeTx && (
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex flex-col justify-end animate-in fade-in duration-200">
            <div className="flex-1" onClick={() => setEditingTxId(null)} />
            <div className="bg-white rounded-t-[2.5rem] p-6 pb-24 animate-in slide-in-from-bottom duration-300 shadow-2xl">
              <div className="flex justify-between items-start mb-6 border-b border-stone-100 pb-4">
                <div><p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1">Tags</p><h2 className="text-xl font-extrabold text-stone-900">{activeTx.description}</h2></div>
                <button onClick={() => setEditingTxId(null)} className="p-2 bg-stone-100 rounded-full text-stone-500 hover:bg-stone-200 transition-colors"><X size={20} /></button>
              </div>
              <div className="bg-stone-50 p-4 rounded-2xl border border-stone-200 mb-6 transition-all">
                <div className="flex items-center gap-2 mb-2">
                   <div className="flex-1 relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-emerald-500 font-bold">#</span>
                      <input value={newTagInput} onChange={(e) => setNewTagInput(e.target.value.toLowerCase().trim())} onKeyDown={(e) => e.key === 'Enter' && handleInputConfirm()} placeholder="vincular tag..." autoFocus className="w-full bg-white border border-stone-200 rounded-xl py-3 pl-7 pr-4 text-sm font-bold outline-none focus:border-emerald-500 focus:ring-4 focus:ring-emerald-500/10 transition-all lowercase placeholder:normal-case"/>
                   </div>
                   <button onClick={handleInputConfirm} disabled={!newTagInput} className="bg-emerald-500 text-white p-3 rounded-xl disabled:opacity-50 disabled:bg-stone-300 transition-colors shadow-lg shadow-emerald-500/20"><Plus size={20} /></button>
                </div>
                {txTagSuggestions.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-stone-200/50"><p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2 flex items-center gap-1"><Sparkles size={10} /> Sugestões encontradas</p><div className="flex flex-wrap gap-2">{txTagSuggestions.map(tag => (<button key={tag} onClick={() => handleToggleTag(tag)} className="flex items-center gap-1 px-3 py-1.5 bg-white border border-emerald-100 text-emerald-700 rounded-lg text-xs font-bold shadow-sm hover:bg-emerald-50 transition-colors"><span>#{tag}</span><Plus size={10} /></button>))}</div></div>
                )}
              </div>
              {activeTx.tags && activeTx.tags.length > 0 && (
                <div className="mb-6"><p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Ativas</p><div className="flex flex-wrap gap-2">{activeTx.tags.map(tag => (<button key={tag} onClick={() => handleToggleTag(tag)} className="flex items-center gap-1 px-3 py-1.5 bg-stone-900 text-white rounded-xl text-xs font-bold shadow-md hover:bg-red-500 transition-colors group"><span>#{tag}</span><X size={12} className="text-stone-400 group-hover:text-white" /></button>))}</div></div>
              )}
              {!newTagInput && (
                <div><p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-2">Populares</p><div className="flex flex-wrap gap-2">{systemTags.filter(t => !activeTx.tags?.includes(t)).map(tag => (<button key={tag} onClick={() => handleToggleTag(tag)} className="px-3 py-2 bg-white border border-stone-200 text-stone-500 rounded-xl text-xs font-bold hover:border-emerald-200 hover:text-emerald-600 transition-colors">#{tag}</button>))}</div></div>
              )}

              {/* Similar Transactions Section */}
              {similarForTags && similarForTags.matches.length > 0 && (
                <div className="mt-4 pt-4 border-t border-stone-100">
                  <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-3 flex items-start gap-2.5">
                    <Sparkles size={16} className="text-amber-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-xs font-bold text-amber-800">
                        {similarForTags.matches.length} transação(ões) similar(es)
                      </p>
                      <p className="text-[10px] text-amber-700 mt-0.5">
                        {similarForTags.matchType === 'document' && 'Mesmo CPF/CNPJ do favorecido'}
                        {similarForTags.matchType === 'name_amount' && `Mesmo nome "${similarForTags.matchValue}"`}
                        {similarForTags.matchType === 'description' && `Descrição contém "${similarForTags.matchValue}"`}
                      </p>
                    </div>
                  </div>

                  <div className="space-y-1.5 max-h-28 overflow-y-auto mb-3">
                    {similarForTags.matches.slice(0, 5).map((tx: any) => (
                      <div key={tx.id} className="flex justify-between items-center p-2 bg-stone-50 rounded-lg">
                        <span className="text-xs font-bold text-stone-600 truncate max-w-[170px]">{tx.description}</span>
                        <span className="text-xs font-bold text-stone-400">R$ {Math.abs(tx.amount).toFixed(2)}</span>
                      </div>
                    ))}
                    {similarForTags.matches.length > 5 && (
                      <p className="text-[10px] text-stone-400 text-center">+{similarForTags.matches.length - 5} outras</p>
                    )}
                  </div>

                  <label className="flex items-center gap-2.5 cursor-pointer mb-2">
                    <input
                      type="checkbox"
                      checked={applyToSimilar}
                      onChange={(e) => setApplyToSimilar(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 text-emerald-500 focus:ring-emerald-500"
                    />
                    <span className="text-xs font-bold text-stone-700">
                      Aplicar tags nas similares
                    </span>
                  </label>

                  <label className="flex items-center gap-2.5 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={createTagRule}
                      onChange={(e) => setCreateTagRule(e.target.checked)}
                      className="w-4 h-4 rounded border-stone-300 text-violet-500 focus:ring-violet-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-stone-700 flex items-center gap-1">
                        <Sparkles size={10} className="text-violet-500" />
                        Auto-taguear no futuro
                      </span>
                    </div>
                  </label>
                </div>
              )}

              <div className="h-6"></div>
            </div>
          </div>
        )}

        {/* Modal de Edição de Categoria - DENTRO do container do celular */}
        {categoryEditTx && (
          <div className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm z-50 flex flex-col justify-end animate-in fade-in duration-200">
            <div className="flex-1" onClick={() => {
              setCategoryEditTx(null);
              setEditMode(false);
            }} />
            <CategoryEditModal
               isOpen={true}
               onClose={() => {
                 setCategoryEditTx(null);
                 setEditMode(false);
               }}
               transaction={{
                 id: categoryEditTx.id,
                 description: categoryEditTx.description,
                 amount: categoryEditTx.amount,
                 category_id: undefined,
                 category_name: categoryEditTx.category_name,
                 receiver_document: categoryEditTx.receiver_document,
                 receiver_name: categoryEditTx.receiver_name,
               }}
               onSuccess={() => {
                 fetchTransactions();
                 setCategoryEditTx(null);
                 setEditMode(false);
               }}
               inline={true} 
            />
          </div>
        )}
      </div>

      <style>{`.no-scrollbar::-webkit-scrollbar { display: none; } .custom-scrollbar::-webkit-scrollbar { width: 4px; } .custom-scrollbar::-webkit-scrollbar-thumb { background-color: #e7e5e4; border-radius: 20px; }`}</style>
    </div>
  );
};

export default TransactionScreen;