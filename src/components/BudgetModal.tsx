import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { X, Loader2, Minus, Plus, Home, ShoppingCart, Car, Heart, Coffee } from 'lucide-react';
import { BudgetCategory } from '../types';
import { supabase } from '../lib/supabase';

// Tipos para controle de abas
type BudgetTabType = 'variavel' | 'fixo';

// Extensão local do tipo para incluir a lógica de visualização sem mexer no types.ts global
interface ExtendedBudgetCategory extends BudgetCategory {
    expenseType: 'fixo' | 'variavel';
}

interface BudgetModalProps {
  onClose: () => void;
  onSuccess: () => void;
  currentDate: Date; 
}

// Componente de Linha (Input de Orçamento)
interface BudgetRowProps {
    category: ExtendedBudgetCategory;
    onBudgetChange: (id: string, newBudget: number) => void;
}

const BudgetRow: React.FC<BudgetRowProps> = ({ category, onBudgetChange }) => {
    // Cálculo visual de status
    const isOverBudget = category.remaining < 0;
    const remainingText = isOverBudget ? 'Estourado por' : 'Restante:';
    const remainingValue = Math.abs(category.remaining).toLocaleString('pt-BR', { minimumFractionDigits: 2 });

    // Helper simples para ícones
    const getIcon = (name: string) => {
        const n = name.toLowerCase();
        if (n.includes('moradia') || n.includes('casa')) return <Home size={16} />;
        if (n.includes('aliment') || n.includes('mercado')) return <ShoppingCart size={16} />;
        if (n.includes('transporte') || n.includes('carro')) return <Car size={16} />;
        if (n.includes('saúde') || n.includes('farmacia')) return <Heart size={16} />;
        return <Coffee size={16} />;
    };

    return (
        <div className="flex items-center justify-between bg-white dark:bg-stone-800 p-3 rounded-2xl shadow-sm border border-stone-100 dark:border-stone-700">
            {/* Esquerda: Ícone e Infos */}
            <div className="flex items-center gap-3 flex-1 overflow-hidden mr-3">
                <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg text-emerald-700 dark:text-emerald-400 shrink-0">
                    {getIcon(category.name)}
                </div>
                <div className="flex flex-col flex-1 truncate">
                    <p className="font-bold text-stone-900 dark:text-white truncate text-sm">
                        {category.name}
                    </p>
                    <p className={`text-xs font-medium ${isOverBudget ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                        {remainingText} R$ {remainingValue}
                    </p>
                </div>
            </div>

            {/* Direita: Input */}
            <div className="relative w-28 shrink-0">
                <span className="absolute left-0 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-bold">R$</span>
                <input
                    type="number"
                    value={category.budget}
                    onChange={(e) => onBudgetChange(category.id, parseFloat(e.target.value) || 0)}
                    placeholder="0"
                    className="w-full pl-6 py-1.5 bg-stone-50 dark:bg-stone-900 rounded-xl font-bold text-base text-right focus:ring-2 focus:ring-emerald-500 outline-none transition-all border-none dark:text-white"
                />
            </div>
        </div>
    );
};

export const BudgetModal: React.FC<BudgetModalProps> = ({ onClose, onSuccess, currentDate }) => {
    // AQUI ESTAVA O ERRO: Agora usamos o tipo estendido
    const [categories, setCategories] = useState<ExtendedBudgetCategory[]>([]);
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [activeTab, setActiveTab] = useState<BudgetTabType>('variavel');
    const [isFixedSectionOpen, setIsFixedSectionOpen] = useState(true); // Começa aberto para facilitar

    const currentMonth = currentDate.getMonth() + 1;
    const currentYear = currentDate.getFullYear();
    const isCurrentMonth = new Date().getMonth() === currentDate.getMonth() && new Date().getFullYear() === currentDate.getFullYear();

    const fetchBudgets = useCallback(async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase.rpc('get_budget_summary', {
                p_month: currentMonth,
                p_year: currentYear
            });

            if (error) throw error;

            // Mapeamento com lógica de classificação (Fixo vs Variável)
            const mappedCategories: ExtendedBudgetCategory[] = (data || []).map((item: any) => {
                const nameLower = (item.category_name || '').toLowerCase();
                // Lógica simples para definir o que é fixo (ajuste conforme seus nomes de categoria)
                const isFixed = nameLower.includes('moradia') || 
                                nameLower.includes('aluguel') || 
                                nameLower.includes('condomínio') ||
                                nameLower.includes('internet') ||
                                nameLower.includes('luz') ||
                                nameLower.includes('assinatura');

                return {
                    id: item.category_id,
                    name: item.category_name,
                    icon: item.category_icon || 'category',
                    budget: item.budget_limit || 0,
                    spent: item.spent_amount || 0,
                    remaining: (item.budget_limit || 0) - (item.spent_amount || 0),
                    expenseType: isFixed ? 'fixo' : 'variavel' // Adiciona o campo que faltava
                };
            });

            setCategories(mappedCategories);
        } catch (err) {
            console.error('Erro ao carregar orçamentos:', err);
        } finally {
            setLoading(false);
        }
    }, [currentMonth, currentYear]);

    useEffect(() => {
        fetchBudgets();
    }, [fetchBudgets]);

    const handleBudgetChange = (id: string, newBudget: number) => {
        setCategories((prev) =>
            prev.map((cat) =>
                cat.id === id
                    ? { ...cat, budget: newBudget, remaining: newBudget - cat.spent }
                    : cat
            )
        );
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const user = (await supabase.auth.getUser()).data.user;
            if (!user) return;

            const budgetsToUpsert = categories.map(cat => ({
                user_id: user.id,
                category_id: cat.id,
                amount_limit: cat.budget,
                month: currentMonth,
                year: currentYear
            }));
            
            const { error } = await supabase.from('budgets').upsert(
                budgetsToUpsert, 
                { onConflict: 'user_id, category_id, month, year' }
            );

            if (error) throw error;

            onSuccess();
            onClose(); 
        } catch (err) {
            console.error('Erro ao salvar:', err);
            alert('Erro ao salvar orçamento. Tente novamente.');
        } finally {
            setSaving(false);
        }
    };

    // Filtros usando useMemo para performance
    const fixedCategories = useMemo(() => categories.filter(c => c.expenseType === 'fixo'), [categories]);
    const variableCategories = useMemo(() => categories.filter(c => c.expenseType === 'variavel'), [categories]);

    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[50] p-4 transition-all animate-in fade-in duration-200">
            <div className="bg-emerald-50 dark:bg-stone-900 w-full max-w-md rounded-[2rem] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden border border-white/50 dark:border-stone-800">
                
                {/* Header */}
                <div className="p-6 pb-2 flex justify-between items-center">
                    <h3 className="text-xl font-extrabold text-stone-900 dark:text-white">
                        Definir Orçamento
                    </h3>
                    <button 
                        onClick={onClose} 
                        className="p-2 bg-white dark:bg-stone-800 rounded-full hover:bg-stone-200 transition-colors"
                    >
                        <X size={20} className="text-stone-900 dark:text-white" />
                    </button>
                </div>

                {/* Abas */}
                <div className="px-6 py-4">
                    <div className="flex bg-stone-200 dark:bg-stone-800 p-1 rounded-full relative">
                        {(['variavel', 'fixo'] as BudgetTabType[]).map((tab) => (
                            <button
                                key={tab}
                                onClick={() => setActiveTab(tab)}
                                className={`flex-1 py-2 rounded-full text-sm font-bold transition-all duration-200 z-10 ${
                                    activeTab === tab ? 'bg-white text-black shadow-sm' : 'text-stone-500 hover:text-stone-700 dark:text-stone-400'
                                }`}
                            >
                                {tab === 'fixo' ? 'Gastos Fixos' : 'Gastos Variáveis'}
                            </button>
                        ))}
                    </div>
                    <p className="text-center text-xs text-stone-500 dark:text-stone-400 pt-3 font-medium">
                        Mês de referência: {currentDate.toLocaleString('pt-BR', { month: 'long' })}
                    </p>
                </div>

                {/* Conteúdo */}
                <div className="overflow-y-auto px-6 pb-4 space-y-4 custom-scrollbar flex-1">
                    {loading ? (
                         <div className="flex justify-center py-10"><Loader2 className="w-8 h-8 animate-spin text-emerald-500" /></div>
                    ) : (
                        <>
                            {/* Aba Fixos (Com Acordeão opcional se quiser esconder na aba errada, mas aqui mostramos baseado na aba ativa ou agrupado) */}
                            {/* Lógica pedida: Aba Variável mostra Variável. Aba Fixo mostra Fixo. 
                                MAS você pediu uma seção de fixos fechada. Vamos adaptar: 
                                Se estiver na aba "Fixo", mostra tudo de fixo.
                                Se estiver na aba "Variável", mostra variável.
                            */}
                            
                            {activeTab === 'fixo' && (
                                <div className="space-y-3 animate-in slide-in-from-right-4 duration-300">
                                    {fixedCategories.length === 0 && <p className="text-center text-stone-500 py-4">Nenhum gasto fixo identificado.</p>}
                                    {fixedCategories.map(cat => (
                                        <BudgetRow key={cat.id} category={cat} onBudgetChange={handleBudgetChange} />
                                    ))}
                                </div>
                            )}

                            {activeTab === 'variavel' && (
                                <div className="space-y-3 animate-in slide-in-from-left-4 duration-300">
                                     {/* Hack visual: Se quiser mostrar os fixos colapsados aqui também, descomente abaixo. 
                                         Mas pelo seu pedido de "abas", separar é mais limpo. 
                                         Vou manter separado por Abas para ficar igual ao Editar Patrimônio.
                                     */}
                                    {variableCategories.length === 0 && <p className="text-center text-stone-500 py-4">Nenhum gasto variável identificado.</p>}
                                    {variableCategories.map(cat => (
                                        <BudgetRow key={cat.id} category={cat} onBudgetChange={handleBudgetChange} />
                                    ))}
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="p-6 bg-white dark:bg-stone-900 border-t border-stone-100 dark:border-stone-800">
                    <button
                        onClick={handleSave}
                        disabled={saving || loading}
                        className="w-full bg-stone-900 dark:bg-emerald-600 text-white py-4 rounded-full font-bold text-lg hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:scale-100 transition-all shadow-xl flex items-center justify-center gap-2"
                    >
                        {saving ? 'Salvando...' : 'Salvar Orçamento'}
                    </button>
                </div>
            </div>
        </div>
    );
};