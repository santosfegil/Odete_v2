import { useState, useEffect } from 'react';
import {
  X, Check, AlertCircle, Loader2, FolderEdit, Sparkles,
  Home, ShoppingCart, ShoppingBag, Car, Heart, Music, GraduationCap,
  Plane, Dumbbell, Zap, Dog, Briefcase, TrendingUp, Gift, MoreHorizontal
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useCategoryRules } from '../lib/useCategoryRules';

// --- MAPEAMENTO DE ÍCONES (copiado de BudgetModal) ---
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

// --- HELPER DE ÍCONES ---
const getIcon = (iconKey: string | null | undefined, categoryName: string, size = 24) => {
  if (iconKey && ICON_MAP[iconKey]) {
    const Icon = ICON_MAP[iconKey];
    return <Icon size={size} />;
  }
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
  if (n.includes('compra')) return <ShoppingBag size={size} />;
  return <MoreHorizontal size={size} />;
};

interface Category {
  id: string;
  name: string;
  icon_key: string;
  color_hex: string;
}

interface TransactionForEdit {
  id: string;
  description: string;
  amount: number;
  receiver_document?: string | null;
  receiver_name?: string | null;
  category_id?: string;
  category_name?: string;
}

interface CategoryEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  transaction: TransactionForEdit;
  onSuccess: () => void;
  inline?: boolean;
}

export default function CategoryEditModal({
  isOpen,
  onClose,
  transaction,
  onSuccess,
  inline = false
}: CategoryEditModalProps) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [step, setStep] = useState<'select' | 'similar' | 'confirm'>('select');
  const [similarTxs, setSimilarTxs] = useState<TransactionForEdit[]>([]);
  const [matchType, setMatchType] = useState<string>('');
  const [matchValue, setMatchValue] = useState<string>('');
  const [updateAll, setUpdateAll] = useState(false);
  const [createRule, setCreateRule] = useState(false);
  const [saving, setSaving] = useState(false);

  const { findSimilarTransactions, bulkUpdateCategory, createRule: createRuleInDb, loading } = useCategoryRules();

  // Fetch categories
  useEffect(() => {
    if (!isOpen) return;

    // Reset state on open
    setStep('select');
    setSelectedCategoryId(null);
    setSimilarTxs([]);
    setUpdateAll(false);
    setCreateRule(false);

    const fetchData = async () => {
      const { data: catData } = await supabase
        .from('categories')
        .select('id, name, icon_key, color_hex')
        .is('user_id', null)
        .eq('scope', 'expense')
        .order('name');

      if (catData) setCategories(catData);
    };

    fetchData();
  }, [isOpen]);

  const handleCategorySelect = async (categoryId: string) => {
    setSelectedCategoryId(categoryId);

    // Buscar transações similares
    const result = await findSimilarTransactions(transaction);

    if (result && result.matches.length > 0) {
      setSimilarTxs(result.matches);
      setMatchType(result.matchType);
      setMatchValue(result.matchValue);
      setStep('similar');
    } else {
      setStep('confirm');
    }
  };

  const handleConfirm = async () => {
    if (!selectedCategoryId) return;
    setSaving(true);

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const txIdsToUpdate = [transaction.id];

      if (updateAll && similarTxs.length > 0) {
        txIdsToUpdate.push(...similarTxs.map(t => t.id));
      }

      // Update categories
      const success = await bulkUpdateCategory(txIdsToUpdate, selectedCategoryId);
      if (!success) throw new Error('Falha ao atualizar categorias');

      // Create rule if requested
      if (createRule) {
        const ruleData: any = {
          user_id: user.id,
          target_category_id: selectedCategoryId,
          priority: 10,
          is_active: true,
        };

        // Define match criteria
        if (matchType === 'document' && transaction.receiver_document) {
          ruleData.match_receiver_document = transaction.receiver_document;
          ruleData.rule_name = `Regra: Doc ${transaction.receiver_document.slice(-4)}`;
        } else if (matchType === 'name_amount' && transaction.receiver_name) {
          ruleData.match_receiver_name = transaction.receiver_name;
          ruleData.match_amount_min = transaction.amount * 0.9;
          ruleData.match_amount_max = transaction.amount * 1.1;
          ruleData.rule_name = `Regra: ${transaction.receiver_name}`;
        } else {
          const keywords = transaction.description.split(' ').slice(0, 3).join(' ');
          ruleData.match_description_contains = keywords;
          ruleData.rule_name = `Regra: ${keywords}`;
        }

        await createRuleInDb(ruleData);
      }

      onSuccess();
      onClose();
    } catch (err) {
      console.error('Erro ao salvar:', err);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const modalContent = (
    <div className={`bg-white w-full rounded-t-[2.5rem] p-6 pb-8 shadow-2xl relative z-10 animate-in slide-in-from-bottom duration-300 ${inline ? 'max-h-[70vh] overflow-y-auto' : 'max-h-[85%] overflow-hidden flex flex-col'}`}>
        {/* Header */}
        <div className="flex justify-between items-start mb-4 border-b border-stone-100 pb-4">
          <div>
            <p className="text-[10px] font-bold text-stone-400 uppercase tracking-widest mb-1 flex items-center gap-1">
              <FolderEdit size={10} />
              {step === 'select' ? 'Editar Categoria' : step === 'similar' ? 'Transações Similares' : 'Confirmar'}
            </p>
            <h2 className="text-lg font-extrabold text-stone-900 truncate max-w-[220px]">
              {transaction.description}
            </h2>
            <div className="flex items-center gap-2 mt-1.5">
              <p className="text-sm text-stone-500 font-bold">
                R$ {Math.abs(transaction.amount).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              {transaction.category_name && (
                <span className="text-[10px] font-bold bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                  Atual: {transaction.category_name}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 bg-stone-100 rounded-full text-stone-500 hover:bg-stone-200 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        {/* Step 1: Select Category */}
        {step === 'select' && (
          <div className={`space-y-4 ${inline ? '' : 'overflow-y-auto flex-1'}`}>
            <p className="text-xs text-stone-500 font-medium">
              Selecione a nova categoria:
            </p>

            {loading ? (
              <div className="flex justify-center py-8">
                <Loader2 className="animate-spin text-emerald-500" size={32} />
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3">
                {categories.map(cat => {
                  const isSelected = selectedCategoryId === cat.id;
                  return (
                    <button
                      key={cat.id}
                      onClick={() => handleCategorySelect(cat.id)}
                      className={`
                        flex flex-col items-center justify-center p-4 rounded-2xl aspect-square transition-all duration-200 border
                        ${isSelected
                          ? 'bg-stone-900 text-white transform scale-95 shadow-lg border-transparent'
                          : 'bg-white text-stone-500 hover:bg-stone-50 shadow-sm border-stone-100'
                        }
                      `}
                    >
                      <div className={`mb-2 p-3 rounded-full ${isSelected ? 'bg-white/20' : 'bg-emerald-50 text-emerald-600'}`}>
                        {getIcon(cat.icon_key, cat.name, 22)}
                      </div>
                      <span className="text-[10px] font-bold text-center truncate w-full">
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Step 2: Similar Transactions Found */}
        {step === 'similar' && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
              <AlertCircle size={20} className="text-amber-600 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-amber-800">
                  Encontramos {similarTxs.length} transação(ões) similar(es)!
                </p>
                <p className="text-xs text-amber-700 mt-1">
                  {matchType === 'document' && 'Mesmo CPF/CNPJ do favorecido'}
                  {matchType === 'name_amount' && `Mesmo nome "${matchValue}" com valor próximo`}
                  {matchType === 'description' && `Descrição contém "${matchValue}"`}
                </p>
              </div>
            </div>

            <div className="space-y-2 max-h-40 overflow-y-auto">
              {similarTxs.slice(0, 5).map(tx => (
                <div key={tx.id} className="flex justify-between items-center p-3 bg-stone-50 rounded-xl">
                  <span className="text-sm font-bold text-stone-700 truncate max-w-[180px]">
                    {tx.description}
                  </span>
                  <span className="text-sm font-bold text-stone-500">
                    R$ {Math.abs(tx.amount).toFixed(2)}
                  </span>
                </div>
              ))}
              {similarTxs.length > 5 && (
                <p className="text-xs text-stone-400 text-center">
                  +{similarTxs.length - 5} outras transações
                </p>
              )}
            </div>

            <div className="space-y-3 pt-4 border-t border-stone-100">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={updateAll}
                  onChange={(e) => setUpdateAll(e.target.checked)}
                  className="w-5 h-5 rounded border-stone-300 text-emerald-500 focus:ring-emerald-500"
                />
                <span className="text-sm font-bold text-stone-700">
                  Alterar todas para a mesma categoria
                </span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={createRule}
                  onChange={(e) => setCreateRule(e.target.checked)}
                  className="w-5 h-5 rounded border-stone-300 text-violet-500 focus:ring-violet-500"
                />
                <div>
                  <span className="text-sm font-bold text-stone-700 flex items-center gap-1">
                    <Sparkles size={12} className="text-violet-500" />
                    Classificar automaticamente no futuro
                  </span>
                  <p className="text-[10px] text-stone-500">
                    Cria regra para próximas transações deste favorecido
                  </p>
                </div>
              </label>
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setStep('select')}
                className="flex-1 py-3 px-4 bg-stone-100 text-stone-700 rounded-xl font-bold hover:bg-stone-200 transition-colors"
              >
                Voltar
              </button>
              <button
                onClick={() => setStep('confirm')}
                className="flex-1 py-3 px-4 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20"
              >
                Continuar
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Confirm */}
        {step === 'confirm' && (
          <div className="space-y-4">
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <p className="text-sm font-bold text-emerald-800">
                {updateAll && similarTxs.length > 0
                  ? `Alterar categoria de ${1 + similarTxs.length} transações`
                  : 'Alterar categoria de 1 transação'
                }
              </p>
              <p className="text-xs text-emerald-700 mt-1">
                Nova categoria: {categories.find(c => c.id === selectedCategoryId)?.name}
              </p>
              {createRule && (
                <p className="text-xs text-violet-600 mt-2 flex items-center gap-1">
                  <Sparkles size={10} />
                  Regra automática será criada
                </p>
              )}
            </div>

            <div className="flex gap-3 pt-4">
              <button
                onClick={() => setStep(similarTxs.length > 0 ? 'similar' : 'select')}
                disabled={saving}
                className="flex-1 py-3 px-4 bg-stone-100 text-stone-700 rounded-xl font-bold hover:bg-stone-200 transition-colors disabled:opacity-50"
              >
                Voltar
              </button>
              <button
                onClick={handleConfirm}
                disabled={saving}
                className="flex-1 py-3 px-4 bg-emerald-500 text-white rounded-xl font-bold hover:bg-emerald-600 transition-colors shadow-lg shadow-emerald-500/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="animate-spin" size={18} /> : <Check size={18} />}
                Confirmar
              </button>
            </div>
          </div>
        )}
    </div>
  );

  if (inline) {
    return modalContent;
  }

  return (
    <div className="absolute top-0 left-0 w-full h-full z-50 flex flex-col justify-end pointer-events-auto">
      {/* Overlay Escuro (clicável para fechar) */}
      <div
        className="absolute inset-0 bg-stone-900/60 backdrop-blur-sm rounded-[2.5rem] animate-in fade-in duration-200"
        onClick={onClose}
      />
      {modalContent}
    </div>
  );
}
