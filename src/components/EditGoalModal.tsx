import React, { useState } from 'react';
import { X, Trash2, AlertTriangle } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Goal {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  progress: number;
  is_automated: boolean;
  linked_account_name?: string;
}

interface EditGoalModalProps {
  goal: Goal;
  onClose: () => void;
  onSuccess: () => void;
}

export const EditGoalModal: React.FC<EditGoalModalProps> = ({ goal, onClose, onSuccess }) => {
  const [title, setTitle] = useState(goal.title);
  const [targetAmount, setTargetAmount] = useState(
    goal.target_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
  );
  const [currentAmount, setCurrentAmount] = useState(
    goal.current_amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
  );

  const [loading, setLoading] = useState(false);
  const [isConfirmingDelete, setIsConfirmingDelete] = useState(false); // Novo estado

  const formatCurrency = (value: string) => {
    let v = value.replace(/\D/g, '');
    v = (parseInt(v, 10) / 100).toFixed(2) + '';
    v = v.replace('.', ',');
    v = v.replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1.');
    return v;
  };

  const handleChangeTarget = (e: React.ChangeEvent<HTMLInputElement>) => {
    setTargetAmount(formatCurrency(e.target.value));
  };

  const handleChangeCurrent = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCurrentAmount(formatCurrency(e.target.value));
  };

  const parseCurrency = (value: string) => {
    return parseFloat(value.replace(/\./g, '').replace(',', '.')) || 0;
  };

  // --- LÓGICA DE EXCLUSÃO ATUALIZADA ---
  const handleConfirmDelete = async () => {
    setLoading(true);
    try {
     
      const { error } = await supabase
        .from('goals')
        .delete()
        .eq('id', goal.id);

      if (error) {
        console.error('Error from supabase during delete:', error);
        throw error;
      }

      
      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao excluir:', error);
      alert('Erro ao excluir meta. Tente novamente.');
    } finally {
      setLoading(false);
      setIsConfirmingDelete(false);
    }
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const updates = {
        title,
        target_amount: parseCurrency(targetAmount),
        current_amount: parseCurrency(currentAmount),
      };

      const { error } = await supabase
        .from('goals')
        .update(updates)
        .eq('id', goal.id);

      if (error) throw error;

      onSuccess();
      onClose();
    } catch (error) {
      console.error('Erro ao atualizar:', error);
      alert('Erro ao salvar alterações.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60] p-6 animate-in fade-in duration-200">
      <div className="bg-white dark:bg-stone-800 w-full max-w-sm rounded-3xl p-6 shadow-xl relative overflow-hidden">
        
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-stone-900 dark:text-white">Editar meta</h3>
          <button onClick={onClose} disabled={loading} className="p-1 hover:bg-stone-100 rounded-full dark:hover:bg-stone-700 disabled:opacity-50">
            <X className="text-stone-500 dark:text-stone-400" size={20} />
          </button>
        </div>

        <div className="space-y-4">
          {/* Inputs... */}
           <div>
            <label className="block text-xs font-bold text-stone-900 dark:text-stone-200  mb-1 ml-1">
              O que você quer conquistar?
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full p-3 rounded-xl border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-700 font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-stone-900 dark:text-stone-200  mb-1 ml-1">
              Qual o valor total?
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-xs">R$</span>
              <input
                type="text"
                value={targetAmount}
                onChange={handleChangeTarget}
                className="w-full p-3 pl-8 rounded-xl border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-700 font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
              />
            </div>
          </div>

          {!goal.is_automated && (
            <div>
              <label className="block text-xs font-bold text-stone-900 dark:text-stone-200  mb-1 ml-1">
                Quanto já guardou?
              </label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-xs">R$</span>
                <input
                  type="text"
                  value={currentAmount}
                  onChange={handleChangeCurrent}
                  className="w-full p-3 pl-8 rounded-xl border border-stone-200 dark:border-stone-600 bg-white dark:bg-stone-700 font-bold text-stone-900 dark:text-white focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>
            </div>
          )}
        </div>
        
        {/* NOVA ÁREA DE CONFIRMAÇÃO */}
        <div className={`mt-8 space-y-3 transition-all duration-300 ${isConfirmingDelete ? 'opacity-0 h-0' : 'opacity-100 h-auto'}`}>
           <button
            onClick={handleSave}
            disabled={loading}
            className="w-full bg-stone-900 dark:bg-emerald-600 text-white font-bold py-3.5 rounded-xl hover:bg-stone-800 dark:hover:bg-emerald-500 transition-colors disabled:opacity-50"
          >
            {loading ? 'Salvando...' : 'Salvar Alterações'}
          </button>

          <button
            onClick={() => setIsConfirmingDelete(true)}
            disabled={loading}
            className="w-full bg-white dark:bg-transparent border border-stone-300 dark:border-stone-600 text-stone-700 dark:text-stone-300 font-bold py-3.5 rounded-xl hover:bg-stone-50 dark:hover:bg-stone-700/50 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
          >
            <Trash2 size={18} />
            Excluir Meta
          </button>
        </div>

        {isConfirmingDelete && (
          <div className="mt-8 text-center animate-in fade-in duration-300">
             <AlertTriangle size={32} className="text-red-500 mx-auto mb-3" />
            <h4 className="font-bold text-stone-800 dark:text-white mb-1">Confirmar Exclusão</h4>
            <p className="text-sm text-stone-500 dark:text-stone-400 mb-6">Esta ação não pode ser desfeita.</p>
            <div className="space-y-3">
              <button
                onClick={handleConfirmDelete}
                disabled={loading}
                className="w-full bg-red-500 text-white font-bold py-3.5 rounded-xl hover:bg-red-600 transition-colors disabled:opacity-50"
              >
                {loading ? 'Excluindo...' : 'Sim, excluir meta'}
              </button>
              <button
                onClick={() => setIsConfirmingDelete(false)}
                disabled={loading}
                className="w-full bg-transparent text-stone-600 dark:text-stone-300 font-bold py-3.5 rounded-xl hover:bg-stone-100 dark:hover:bg-stone-700 transition-colors"
              >
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
