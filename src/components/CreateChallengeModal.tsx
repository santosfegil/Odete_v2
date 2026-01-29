import React, { useState, useEffect } from 'react';
import { X, Target, Sparkles, Calendar, DollarSign, Tag, Loader2, TrendingDown, Hash } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface CreateChallengeModalProps {
  onClose: () => void;
  onSuccess: () => void;
}

interface Category {
  id: string;
  name: string;
  icon_key: string;
}

interface TagItem {
  id: string;
  name: string;
  color_hex: string;
}

interface SpendingSuggestion {
  id: string;
  title: string;
  description: string;
  targetAmount: number;
  averageSpent: number;
  savingTarget: number;
  categoryId: string | null;
  tagId: string | null;
  categoryName: string;
}

type TabType = 'create' | 'suggestions';
type FilterType = 'category' | 'tag';

export const CreateChallengeModal: React.FC<CreateChallengeModalProps> = ({ onClose, onSuccess }) => {
  const [activeTab, setActiveTab] = useState<TabType>('create');
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tags, setTags] = useState<TagItem[]>([]);
  const [loadingCategories, setLoadingCategories] = useState(true);
  const [loadingTags, setLoadingTags] = useState(true);
  const [suggestions, setSuggestions] = useState<SpendingSuggestion[]>([]);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);

  // Form State
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [filterType, setFilterType] = useState<FilterType>('category');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(null);
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);

  // Carrega categorias de despesa
  useEffect(() => {
    const fetchCategories = async () => {
      setLoadingCategories(true);
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('id, name, icon_key')
          .eq('scope', 'expense')
          .order('name');
        
        if (error) throw error;
        if (data) setCategories(data);
      } catch (err) {
        console.error('Erro ao carregar categorias:', err);
      } finally {
        setLoadingCategories(false);
      }
    };
    fetchCategories();
  }, []);

  // Carrega tags do usuário
  useEffect(() => {
    const fetchTags = async () => {
      setLoadingTags(true);
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data, error } = await supabase
          .from('tags')
          .select('id, name, color_hex')
          .eq('user_id', user.id)
          .order('name');
        
        if (error) throw error;
        if (data) setTags(data);
      } catch (err) {
        console.error('Erro ao carregar tags:', err);
      } finally {
        setLoadingTags(false);
      }
    };
    fetchTags();
  }, []);

  // Limpa seleção ao trocar tipo de filtro
  useEffect(() => {
    setSelectedCategoryId(null);
    setSelectedTagId(null);
  }, [filterType]);

  // Carrega sugestões baseadas nos gastos reais quando muda para aba de sugestões
  useEffect(() => {
    if (activeTab === 'suggestions' && suggestions.length === 0) {
      fetchSuggestions();
    }
  }, [activeTab]);

  const fetchSuggestions = async () => {
    setLoadingSuggestions(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      thirtyDaysAgo.setHours(0, 0, 0, 0);

      const allSuggestions: SpendingSuggestion[] = [];
      const REDUCTION_PERCENT = 0.25;

      // ========== SUGESTÕES POR CATEGORIA ==========
      const { data: catSpending, error: catError } = await supabase
        .from('transactions')
        .select(`amount, category_id, categories!inner(id, name)`)
        .eq('user_id', user.id)
        .eq('type', 'expense')
        .gte('date', thirtyDaysAgo.toISOString())
        .lte('date', today.toISOString())
        .not('category_id', 'is', null);

      if (!catError && catSpending && catSpending.length > 0) {
        const categoryTotals: Record<string, { total: number; name: string; id: string }> = {};
        
        catSpending.forEach((tx: any) => {
          const catId = tx.category_id;
          const catName = tx.categories?.name || 'Outros';
          const amount = Math.abs(Number(tx.amount));
          
          if (!categoryTotals[catId]) {
            categoryTotals[catId] = { total: 0, name: catName, id: catId };
          }
          categoryTotals[catId].total += amount;
        });

        const topCategories = Object.values(categoryTotals)
          .sort((a, b) => b.total - a.total)
          .slice(0, 2); // Top 2 categorias

        topCategories.forEach((cat, index) => {
          const weeklyAverage = cat.total / 4;
          const targetWeekly = weeklyAverage * (1 - REDUCTION_PERCENT);
          const savings = weeklyAverage - targetWeekly;

          allSuggestions.push({
            id: `cat-${index}`,
            title: `Reduzir ${cat.name}`,
            description: `Você gastou R$ ${cat.total.toFixed(0)} na categoria ${cat.name} no último mês. Tente gastar apenas R$ ${targetWeekly.toFixed(0)} esta semana.`,
            targetAmount: Math.round(targetWeekly),
            averageSpent: Math.round(weeklyAverage),
            savingTarget: Math.round(savings),
            categoryId: cat.id,
            tagId: null,
            categoryName: cat.name
          });
        });
      }

      // ========== SUGESTÕES POR TAG ==========
      // Buscar todas as transações com tags do usuário
      const { data: taggedTxs, error: tagError } = await supabase
        .from('transaction_tags')
        .select(`
          tag_id,
          tags!inner(id, name, color_hex),
          transactions!inner(id, amount, date, user_id, type)
        `)
        .eq('transactions.user_id', user.id)
        .eq('transactions.type', 'expense')
        .gte('transactions.date', thirtyDaysAgo.toISOString())
        .lte('transactions.date', today.toISOString());

      if (!tagError && taggedTxs && taggedTxs.length > 0) {
        const tagTotals: Record<string, { total: number; name: string; id: string; color: string }> = {};
        
        taggedTxs.forEach((tt: any) => {
          const tagId = tt.tag_id;
          const tagName = tt.tags?.name || 'Tag';
          const tagColor = tt.tags?.color_hex || '#888';
          const amount = Math.abs(Number(tt.transactions?.amount || 0));
          
          if (!tagTotals[tagId]) {
            tagTotals[tagId] = { total: 0, name: tagName, id: tagId, color: tagColor };
          }
          tagTotals[tagId].total += amount;
        });

        const topTags = Object.values(tagTotals)
          .sort((a, b) => b.total - a.total)
          .slice(0, 2); // Top 2 tags

        topTags.forEach((tag, index) => {
          const weeklyAverage = tag.total / 4;
          const targetWeekly = weeklyAverage * (1 - REDUCTION_PERCENT);
          const savings = weeklyAverage - targetWeekly;

          allSuggestions.push({
            id: `tag-${index}`,
            title: `Reduzir #${tag.name}`,
            description: `Você gastou R$ ${tag.total.toFixed(0)} com #${tag.name} no último mês. Reduza para R$ ${targetWeekly.toFixed(0)} esta semana.`,
            targetAmount: Math.round(targetWeekly),
            averageSpent: Math.round(weeklyAverage),
            savingTarget: Math.round(savings),
            categoryId: null,
            tagId: tag.id,
            categoryName: `#${tag.name}`
          });
        });
      }

      // Ordenar por maior economia potencial e limitar a 4 sugestões
      allSuggestions.sort((a, b) => b.savingTarget - a.savingTarget);
      setSuggestions(allSuggestions.slice(0, 4));
    } catch (err) {
      console.error('Erro ao gerar sugestões:', err);
    } finally {
      setLoadingSuggestions(false);
    }
  };

  const handleCreate = async () => {
    const hasSelection = filterType === 'category' ? selectedCategoryId : selectedTagId;
    
    if (!title.trim() || !targetAmount || !hasSelection) {
      alert('Preencha todos os campos obrigatórios');
      return;
    }

    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não logado');

      const start = new Date(startDate);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);

      const { error } = await supabase.from('weekly_challenges').insert({
        user_id: user.id,
        title: title.trim(),
        description: description.trim() || null,
        category_id: filterType === 'category' ? selectedCategoryId : null,
        tag_id: filterType === 'tag' ? selectedTagId : null,
        target_amount: parseFloat(targetAmount),
        average_spent: 0,
        saving_target: 0,
        start_date: start.toISOString(),
        end_date: end.toISOString()
      });

      if (error) throw error;

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Erro ao criar desafio:', err);
      alert(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectSuggestion = async (suggestion: SpendingSuggestion) => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Usuário não logado');

      const start = new Date();
      const end = new Date(start);
      end.setDate(end.getDate() + 6);

      const { error } = await supabase.from('weekly_challenges').insert({
        user_id: user.id,
        title: suggestion.title,
        description: suggestion.description,
        category_id: suggestion.categoryId,
        tag_id: suggestion.tagId,
        target_amount: suggestion.targetAmount,
        average_spent: suggestion.averageSpent,
        saving_target: suggestion.savingTarget,
        start_date: start.toISOString(),
        end_date: end.toISOString()
      });

      if (error) throw error;

      onSuccess();
      onClose();
    } catch (err: any) {
      console.error('Erro ao criar desafio:', err);
      alert(`Erro: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid = title.trim() && targetAmount && (
    (filterType === 'category' && selectedCategoryId) ||
    (filterType === 'tag' && selectedTagId)
  );

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-900 w-full max-w-md rounded-[2rem] flex flex-col max-h-[85vh] shadow-2xl border border-stone-200 dark:border-stone-800">
        
        {/* Header */}
        <div className="p-6 pb-2 flex justify-between items-center">
          <h3 className="text-xl font-extrabold text-stone-900 dark:text-white flex items-center gap-2">
            <Target className="text-emerald-500" size={24} />
            Novo Desafio
          </h3>
          <button onClick={onClose} className="p-2 bg-stone-100 dark:bg-stone-800 rounded-full hover:bg-stone-200 transition-colors">
            <X size={20} className="text-stone-900 dark:text-white" />
          </button>
        </div>

        {/* Tabs */}
        <div className="px-6 py-4">
          <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-full">
            {(['create', 'suggestions'] as TabType[]).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`flex-1 py-2 rounded-full text-sm font-bold transition-all duration-200 ${
                  activeTab === tab 
                    ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-sm' 
                    : 'text-stone-500 hover:text-stone-700 dark:text-stone-400'
                }`}
              >
                {tab === 'create' ? '✏️ Criar' : '✨ Sugestões'}
              </button>
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-4">
          
          {activeTab === 'create' ? (
            <div className="space-y-4">
              {/* Título */}
              <div>
                <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-2">
                  Nome do desafio *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Semana sem Uber"
                  className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Descrição */}
              <div>
                <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-2">
                  Descrição (opcional)
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Conte mais sobre seu desafio..."
                  rows={2}
                  className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none"
                />
              </div>

              {/* Gasto Máximo */}
              <div>
                <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-2">
                  <DollarSign size={14} className="inline mr-1" />
                  Gasto máximo permitido *
                </label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-stone-400 font-bold">R$</span>
                  <input
                    type="number"
                    value={targetAmount}
                    onChange={(e) => setTargetAmount(e.target.value)}
                    placeholder="0,00"
                    className="w-full pl-12 pr-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              {/* Toggle Categoria / Tag */}
              <div>
                <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-2">
                  Filtrar gastos por *
                </label>
                <div className="flex bg-stone-100 dark:bg-stone-800 p-1 rounded-xl mb-3">
                  <button
                    onClick={() => setFilterType('category')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                      filterType === 'category'
                        ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-sm'
                        : 'text-stone-500 dark:text-stone-400'
                    }`}
                  >
                    <Tag size={14} />
                    Categoria
                  </button>
                  <button
                    onClick={() => setFilterType('tag')}
                    className={`flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-all flex items-center justify-center gap-1.5 ${
                      filterType === 'tag'
                        ? 'bg-white dark:bg-stone-700 text-stone-900 dark:text-white shadow-sm'
                        : 'text-stone-500 dark:text-stone-400'
                    }`}
                  >
                    <Hash size={14} />
                    Tag
                  </button>
                </div>

                {/* Lista de Categorias */}
                {filterType === 'category' && (
                  loadingCategories ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="animate-spin text-emerald-500" size={24} />
                    </div>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {categories.map((cat) => (
                        <button
                          key={cat.id}
                          onClick={() => setSelectedCategoryId(cat.id)}
                          className={`px-3 py-2 rounded-full text-sm font-medium transition-all ${
                            selectedCategoryId === cat.id
                              ? 'bg-emerald-500 text-white'
                              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                          }`}
                        >
                          {cat.name}
                        </button>
                      ))}
                    </div>
                  )
                )}

                {/* Lista de Tags */}
                {filterType === 'tag' && (
                  loadingTags ? (
                    <div className="flex items-center justify-center py-4">
                      <Loader2 className="animate-spin text-emerald-500" size={24} />
                    </div>
                  ) : tags.length === 0 ? (
                    <p className="text-sm text-stone-400 text-center py-4">
                      Você ainda não tem tags criadas.
                    </p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {tags.map((tag) => (
                        <button
                          key={tag.id}
                          onClick={() => setSelectedTagId(tag.id)}
                          className={`px-3 py-2 rounded-full text-sm font-medium transition-all flex items-center gap-1.5 ${
                            selectedTagId === tag.id
                              ? 'bg-emerald-500 text-white'
                              : 'bg-stone-100 dark:bg-stone-800 text-stone-600 dark:text-stone-400 hover:bg-stone-200'
                          }`}
                        >
                          <span 
                            className="w-2.5 h-2.5 rounded-full" 
                            style={{ backgroundColor: tag.color_hex || '#888' }}
                          />
                          {tag.name}
                        </button>
                      ))}
                    </div>
                  )
                )}
              </div>

              {/* Data de Início */}
              <div>
                <label className="block text-sm font-bold text-stone-700 dark:text-stone-300 mb-2">
                  <Calendar size={14} className="inline mr-1" />
                  Data de início
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full px-4 py-3 bg-stone-50 dark:bg-stone-800 border border-stone-200 dark:border-stone-700 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
                <p className="text-xs text-stone-400 mt-1">Duração: 7 dias (1 semana)</p>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-sm text-stone-500 dark:text-stone-400 mb-4">
                <Sparkles className="inline mr-1 text-yellow-500" size={14} />
                Sugestões baseadas nos seus gastos dos últimos 30 dias:
              </p>
              
              {loadingSuggestions ? (
                <div className="flex flex-col items-center justify-center py-8">
                  <Loader2 className="animate-spin text-emerald-500 mb-2" size={32} />
                  <p className="text-sm text-stone-400">Analisando seus gastos...</p>
                </div>
              ) : suggestions.length === 0 ? (
                <div className="text-center py-8">
                  <TrendingDown className="mx-auto mb-3 text-stone-300" size={40} />
                  <p className="text-stone-500 dark:text-stone-400">
                    Não encontramos transações suficientes para gerar sugestões.
                  </p>
                  <p className="text-xs text-stone-400 mt-2">
                    Continue usando o app e volte em breve!
                  </p>
                </div>
              ) : (
                suggestions.map((suggestion) => (
                  <button
                    key={suggestion.id}
                    onClick={() => handleSelectSuggestion(suggestion)}
                    disabled={loading}
                    className="w-full p-4 bg-stone-50 dark:bg-stone-800 rounded-2xl border border-stone-200 dark:border-stone-700 hover:border-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-all text-left"
                  >
                    <h4 className="font-bold text-stone-900 dark:text-white">{suggestion.title}</h4>
                    <p className="text-sm text-stone-500 dark:text-stone-400 mt-1">{suggestion.description}</p>
                    <div className="flex justify-between items-center mt-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs bg-stone-200 dark:bg-stone-700 px-2 py-1 rounded-full text-stone-600 dark:text-stone-300">
                          {suggestion.categoryName}
                        </span>
                        <span className="text-xs text-emerald-600 font-semibold bg-emerald-100 dark:bg-emerald-900/30 px-2 py-1 rounded-full">
                          Economia: R$ {suggestion.savingTarget}
                        </span>
                      </div>
                    </div>
                    <div className="mt-2 pt-2 border-t border-stone-200 dark:border-stone-700 flex justify-between text-xs">
                      <span className="text-stone-400">Média semanal: <span className="line-through">R$ {suggestion.averageSpent}</span></span>
                      <span className="text-emerald-600 font-bold">Meta: R$ {suggestion.targetAmount}</span>
                    </div>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        {activeTab === 'create' && (
          <div className="p-6 bg-stone-50 dark:bg-stone-900 border-t border-stone-100 dark:border-stone-800 rounded-b-[2rem]">
            <button
              onClick={handleCreate}
              disabled={loading || !isFormValid}
              className="w-full bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white py-4 rounded-full font-bold text-lg transition-all shadow-xl flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="animate-spin" size={20} />
              ) : (
                <>
                  <Target size={20} />
                  Criar Desafio
                </>
              )}
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateChallengeModal;
