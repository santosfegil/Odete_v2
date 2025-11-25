import React, { useState, useEffect } from 'react';
import { ArrowLeft, MessageCircle, Wallet, Link as LinkIcon } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface NewGoalScreenProps {
  onBack: () => void;
  onAskOdete: () => void;
}

interface AccountOption {
  id: string;
  name: string;
  balance: number;
  type: string;
}

export default function NewGoalScreen({ onBack, onAskOdete }: NewGoalScreenProps) {
  const [goalName, setGoalName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [trackingType, setTrackingType] = useState<'manual' | 'auto'>('manual');
  const [selectedAccount, setSelectedAccount] = useState<string | null>(null);
  const [accounts, setAccounts] = useState<AccountOption[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAccounts = async () => {
      const { data } = await supabase
        .from('accounts')
        .select('id, name, balance, type')
        .in('type', ['investment', 'bank']); 
      
      if (data) setAccounts(data);
    };
    fetchAccounts();
  }, []);

  const handleSave = async () => {
    if (!goalName.trim()) return;
    setLoading(true);
    
    const cleanTarget = parseFloat(targetAmount.replace(/\./g, '').replace(',', '.')) || 0;

    const { error } = await supabase.from('goals').insert({
      user_id: (await supabase.auth.getUser()).data.user?.id,
      title: goalName,
      target_amount: cleanTarget,
      current_amount: trackingType === 'manual' ? 0 : undefined, 
      linked_account_id: trackingType === 'auto' ? selectedAccount : null,
      is_completed: false
    });

    setLoading(false);
    if (!error) onBack();
  };

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const amount = parseFloat(numbers) / 100;
    return amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  return (
    <div className="flex flex-col h-screen bg-stone-50 text-stone-900">
      <header className="flex items-center p-4 pb-2 justify-between">
        <button onClick={onBack} className="p-2 hover:bg-stone-200 rounded-full transition-colors">
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-lg font-bold">Nova Meta</h2>
        <div className="w-10"></div>
      </header>

      <main className="flex flex-col flex-1 px-6 pt-6 overflow-y-auto overflow-x-hidden space-y-5 [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]">
        
        <div className="space-y-1">
          <label className="text-xs font-extrabold text-stone-900 uppercase tracking-wider ml-2">
            O que você quer conquistar?
          </label>
          <input
            className="w-full h-10 px-3 text-sm bg-white border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition-all placeholder:text-stone-400 font-bold text-stone-800"
            placeholder="Ex: Viagem pra Disney"
            value={goalName}
            onChange={(e) => setGoalName(e.target.value)}
          />
        </div>

        <div className="space-y-1">
          <label className="text-xs font-extrabold text-stone-900 uppercase tracking-wider ml-2">
            Qual o valor total?
          </label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 font-bold text-xs">
              R$
            </span>
            <input
              className="w-full h-10 pl-8 pr-3 text-sm bg-white border border-stone-200 rounded-2xl focus:ring-2 focus:ring-emerald-500 outline-none placeholder:text-stone-400 font-bold text-stone-800"
              placeholder="0,00"
              value={targetAmount}
              onChange={(e) => setTargetAmount(formatCurrency(e.target.value))}
              inputMode="numeric"
            />
          </div>
        </div>

        <button
          onClick={onAskOdete}
          className="w-full py-1 flex items-center justify-start gap-2 text-stone-600 hover:text-stone-900 text-xs font-bold transition-colors -mt-1 ml-1"
        >
          <MessageCircle size={16} className="text-emerald-500" />
          Não sei quanto preciso
        </button>

        <div className="space-y-2 pt-2">
          <label className="text-xs font-extrabold text-stone-900 uppercase tracking-wider ml-2">
            Como vamos rastrear?
          </label>
          
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => setTrackingType('manual')}
              className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between h-20 ${
                trackingType === 'manual'
                  ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500'
                  : 'border-stone-200 bg-white hover:bg-stone-50'
              }`}
            >
              <div className={`mb-1 ${trackingType === 'manual' ? 'text-emerald-600' : 'text-stone-400'}`}>
                <Wallet size={20} />
              </div>
              <div>
                <p className={`font-bold text-sm ${trackingType === 'manual' ? 'text-emerald-900' : 'text-stone-600'}`}>Manual</p>
                <p className="text-[10px] font-medium text-stone-400 leading-tight">Eu atualizo o saldo</p>
              </div>
            </button>

            <button
              onClick={() => setTrackingType('auto')}
              className={`p-3 rounded-2xl border text-left transition-all flex flex-col justify-between h-20 ${
                trackingType === 'auto'
                  ? 'border-emerald-500 bg-emerald-50/50 ring-1 ring-emerald-500'
                  : 'border-stone-200 bg-white hover:bg-stone-50'
              }`}
            >
              <div className={`mb-1 ${trackingType === 'auto' ? 'text-emerald-600' : 'text-stone-400'}`}>
                <LinkIcon size={20} />
              </div>
              <div>
                <p className={`font-bold text-sm ${trackingType === 'auto' ? 'text-emerald-900' : 'text-stone-600'}`}>Automático</p>
                <p className="text-[10px] font-medium text-stone-400 leading-tight">Vincular conta</p>
              </div>
            </button>
          </div>
        </div>

        {trackingType === 'auto' && (
          <div className="space-y-1.5 animate-in fade-in slide-in-from-top-2">
            <label className="text-xs font-extrabold text-stone-400 uppercase tracking-wider ml-2">
              Vincular à conta:
            </label>
            <div className="space-y-2 max-h-40 overflow-y-auto pr-1 custom-scrollbar">
              {accounts.map((acc) => (
                <button
                  key={acc.id}
                  onClick={() => setSelectedAccount(acc.id)}
                  className={`w-full flex justify-between items-center p-3 rounded-2xl border transition-all ${
                    selectedAccount === acc.id
                      ? 'border-emerald-500 bg-emerald-50 text-emerald-900 ring-1 ring-emerald-500'
                      : 'border-stone-200 bg-white text-stone-600 hover:border-stone-300'
                  }`}
                >
                  <span className="font-bold text-sm truncate mr-2">{acc.name}</span>
                  <span className="text-xs font-bold text-stone-500 bg-stone-100 px-2 py-1 rounded-lg whitespace-nowrap">
                    R$ {acc.balance.toLocaleString('pt-BR', {minimumFractionDigits: 2})}
                  </span>
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="flex-1"></div>
      </main>

      <footer className="p-6 bg-white border-t border-stone-100">
        <button
          onClick={handleSave}
          disabled={loading || !goalName || !targetAmount || (trackingType === 'auto' && !selectedAccount)}
          className="w-full bg-stone-900 text-white py-4 rounded-2xl font-bold text-lg hover:bg-stone-800 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg"
        >
          {loading ? 'Criando...' : 'Criar Meta'}
        </button>
      </footer>
    </div>
  );
}