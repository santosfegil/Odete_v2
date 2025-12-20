import React, { useState, useEffect } from 'react';
import { 
  Settings, MessageCircle, CalendarDays, CircleDollarSign, PiggyBank, 
  Save, ArrowUpCircle, CheckCircle2, AlertCircle, Loader2, Lock 
} from 'lucide-react';
import { supabase } from '../lib/supabase';
// IMPORTANTE: Certifique-se que o arquivo RetirementSettingsModal.tsx existe na pasta components
import { RetirementSettingsModal } from './RetirementSettingsModal';

export default function RetirementSimulator() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // --- NOVOS ESTADOS PARA CONFIGURAÇÃO ---
  const [showAccountSettings, setShowAccountSettings] = useState(false);
  const [allAccounts, setAllAccounts] = useState<any[]>([]); 
  const [selectedAccountIds, setSelectedAccountIds] = useState<string[]>([]);

  // Controle de visibilidade do simulador
  const [showSimulator, setShowSimulator] = useState(false);

  // --- DADOS REAIS DO USUÁRIO ---
  const [initialCapital, setInitialCapital] = useState(0); 
  const [investedThisMonth, setInvestedThisMonth] = useState(0); 
  
  // --- ESTADOS DE EXIBIÇÃO ---
  const [displayValues, setDisplayValues] = useState({
    income: 5000,
    age: 65,
    investment: 1000
  });

  // --- PARÂMETROS DO SIMULADOR ---
  const [currentAge, setCurrentAge] = useState(30);
  const [retirementAge, setRetirementAge] = useState(65);
  const [desiredIncome, setDesiredIncome] = useState(5000);
  const [monthlyInvestment, setMonthlyInvestment] = useState(1000);

  const [monthlyTransactions, setMonthlyTransactions] = useState<any[]>([]); 
  
  // --- ECONOMIA ---
  const [selic, setSelic] = useState(10.0);
  const [ipca, setIpca] = useState(6.0);
  const [planId, setPlanId] = useState<string | null>(null);

  // Helper: Calcular Idade
  const calculateAge = (birthDateString: string) => {
    const birthDate = new Date(birthDateString);
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  // Helper: Taxas
  const getRealMonthlyRate = () => {
    const realRateYear = (1 + selic / 100) / (1 + ipca / 100) - 1;
    return Math.pow(1 + realRateYear, 1 / 12) - 1;
  };

  // Helper: Recalcula Patrimonio (Centralizado e Seguro)
  const recalculatePatrimony = (accountsList: any[], selectedIds: string[]) => {
    if (!accountsList || !Array.isArray(accountsList)) return;
    
    // 1. Filtra
    const validAccounts = accountsList.filter(acc => selectedIds.includes(acc.id));
    // 2. Soma
    const total = validAccounts.reduce((sum, acc) => sum + (Number(acc.balance) || 0), 0);
    // 3. Atualiza
    setInitialCapital(total);
  };


  // Atualiza o "Investido no Mês" sempre que a seleção de contas mudar
  useEffect(() => {
    if (monthlyTransactions.length > 0) {
      const relevantInvestments = monthlyTransactions.filter(t => 
        selectedAccountIds.includes(t.account_id)
      );
      const total = relevantInvestments.reduce((sum, t) => sum + (Number(t.amount) || 0), 0);
      setInvestedThisMonth(total);
    } else {
      setInvestedThisMonth(0);
    }
  }, [selectedAccountIds, monthlyTransactions]);

  useEffect(() => {
    loadData();
  }, []);
  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Carrega Dados do Usuário (Idade)
      const { data: userData } = await supabase.from('users').select('birth_date').eq('id', user.id).single();
      if (userData?.birth_date) setCurrentAge(calculateAge(userData.birth_date));

      // 2. Carrega Plano Salvo
      const { data: plan } = await supabase.from('retirement_plans').select('*').eq('user_id', user.id).maybeSingle();
      if (plan) {
        setPlanId(plan.id);
        setRetirementAge(plan.target_retirement_age);
        setDesiredIncome(plan.desired_monthly_income);
        setMonthlyInvestment(plan.monthly_contribution);
        setSelic(plan.assumptions_selic || 10);
        setIpca(plan.assumptions_inflation || 6);

        setDisplayValues({
          income: plan.desired_monthly_income,
          age: plan.target_retirement_age,
          investment: plan.monthly_contribution
        });
      }

      // 3. Carrega Contas e define Seleção Inicial
      const { data: accounts } = await supabase.from('accounts').select('id, name, balance, type').eq('user_id', user.id);
      
      let idsToUse: string[] = []; // Variável local para definir o que selecionar
      
      if (accounts) {
        setAllAccounts(accounts);
        
        // Recupera configuração do LocalStorage ou define padrão
        const savedConfig = localStorage.getItem('@odete:retirement_accounts');
        try {
          if (savedConfig) {
            idsToUse = JSON.parse(savedConfig);
          } else {
            idsToUse = accounts
              .filter(a => ['wallet', 'bank', 'investment', 'checking_account', 'savings_account'].includes(a.type))
              .map(a => a.id);
          }
        } catch (e) {
          idsToUse = accounts.map(a => a.id); 
        }
        
        // Atualiza o estado da seleção (Isso vai disparar o useEffect para calcular o Patrimônio Inicial)
        setSelectedAccountIds(idsToUse);
      }

      // 4. Carrega Transações do Mês (DADOS BRUTOS)
      // Buscamos todas as transações de investimento do usuário.
      // O filtro de "quais contas somar" será feito pelo useEffect automaticamente.
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0,0,0,0);

      const { data: catData } = await supabase.from('categories').select('id').ilike('name', '%Investimento%');
      const investCatIds = catData?.map(c => c.id) || [];

      if (investCatIds.length > 0) {
        const { data: investments } = await supabase
          .from('transactions')
          .select('amount, account_id')
          .eq('user_id', user.id)
          .in('category_id', investCatIds)
          .gte('date', startOfMonth.toISOString());

        // AQUI ESTÁ O SEGREDO: Apenas salvamos os dados. 
        // O useEffect([selectedAccountIds, monthlyTransactions]) vai rodar agora e fazer a soma correta.
        setMonthlyTransactions(investments || []); 
      } else {
        setMonthlyTransactions([]);
      }

    } catch (error) {
      console.error('Erro ao carregar dados:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        alert("Erro: Usuário não autenticado");
        return;
      }

      // 1. Calculamos a Meta de Patrimônio (Obrigatória pelo banco)
      // Fórmula: Renda Desejada / Taxa Real Mensal
      const r = getRealMonthlyRate();
      // Proteção contra divisão por zero
      const calculatedGoal = r > 0 ? Math.round(desiredIncome / r) : 0;

      // 2. Montamos o pacote de dados (Payload)
      // Removemos current_age e adicionamos calculated_patrimony_goal
      const payload = {
        user_id: user.id,
        target_retirement_age: retirementAge,
        desired_monthly_income: desiredIncome,
        monthly_contribution: monthlyInvestment,
        assumptions_selic: selic,
        assumptions_inflation: ipca,
        calculated_patrimony_goal: calculatedGoal
      };

      // 3. Enviamos para o Supabase (Upsert)
      const { error } = await supabase
        .from('retirement_plans')
        .upsert(payload, { onConflict: 'user_id' });

      if (error) throw error;
      
      // 4. Atualizamos o visual do card
      setDisplayValues({
        income: desiredIncome,
        age: retirementAge,
        investment: monthlyInvestment
      });

      alert('Plano salvo com sucesso!');
      
      // 5. Recarregamos os dados
      await loadData(); 

    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      alert(`Erro ao salvar: ${error.message || 'Verifique o console'}`);
    } finally {
      setSaving(false);
    }
  };
  // --- LÓGICA DO SIMULADOR ---
  const recalculateInvestment = (newAge: number, newIncome: number) => {
    const r = getRealMonthlyRate();
    const months = Math.max(1, (newAge - currentAge) * 12);
    const requiredCapital = newIncome / r;
    const fvInitial = initialCapital * Math.pow(1 + r, months);
    const gap = requiredCapital - fvInitial;
    if (gap <= 0) return 0;
    const pmt = gap * (r / (Math.pow(1 + r, months) - 1));
    return Math.round(pmt);
  };

  const recalculateIncome = (newInvestment: number, newAge: number) => {
    const r = getRealMonthlyRate();
    const months = Math.max(1, (newAge - currentAge) * 12);
    const fvInitial = initialCapital * Math.pow(1 + r, months);
    const fvSeries = newInvestment * ((Math.pow(1 + r, months) - 1) / r);
    const totalCapital = fvInitial + fvSeries;
    const possibleIncome = totalCapital * r;
    return Math.round(possibleIncome);
  };

  const handleAgeChange = (val: number) => {
    setRetirementAge(val);
    setMonthlyInvestment(recalculateInvestment(val, desiredIncome));
  };

  const handleIncomeChange = (val: number) => {
    setDesiredIncome(val);
    setMonthlyInvestment(recalculateInvestment(retirementAge, val));
  };

  const handleInvestmentChange = (val: number) => {
    setMonthlyInvestment(val);
    setDesiredIncome(recalculateIncome(val, retirementAge));
  };

  // Função chamada pelo Modal para salvar a seleção
  const handleSettingsSave = (newSelectedIds: string[]) => {
    setSelectedAccountIds(newSelectedIds);
    localStorage.setItem('@odete:retirement_accounts', JSON.stringify(newSelectedIds));
    recalculatePatrimony(allAccounts, newSelectedIds);
  };

  // --- RENDER ---
  const formatMoney = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const diff = investedThisMonth - displayValues.investment;

  if (loading) return <div className="p-8 text-center text-stone-500">Carregando simulador...</div>;

  return (
    <div className="bg-[#F2F7FF] dark:bg-stone-900 rounded-[2.5rem] p-6 shadow-sm border border-stone-100 dark:border-stone-800 relative overflow-hidden transition-all">
      
      {/* HEADER */}
      <div className="flex justify-between items-center mb-1 relative z-10">
        <h2 className="text-lg font-bold text-stone-900 dark:text-white">Aposentadoria</h2>
        
        <button 
          onClick={() => setShowAccountSettings(true)}
          className="p-2 rounded-full hover:bg-emerald-200/50 dark:hover:bg-stone-800 text-stone-400 hover:text-stone-900 dark:hover:text-white transition-colors"
        >
          <Settings size={20} />
        </button>
      </div>

      {/* --- ÁREA DE DESTAQUE --- */}
      <div className="text-center mt-4 mb-8">
        <div className="flex items-baseline justify-center gap-1 relative mb-1 text-stone-900 dark:text-white">
           <span className="text-3xl font-bold tracking-tighter text-stone-900 dark:text-white">R$</span>
           <span className="text-6xl font-extrabold tracking-tighter text-stone-900 dark:text-white">
             {displayValues.income.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
           </span>
        </div>
        <p className="text-xs text-stone-500 font-medium tracking-wide">Renda mensal desejada</p>

        <p className="text-sm text-stone-600 dark:text-stone-300 mt-4 font-medium">
          Renda aos <span className="font-bold text-stone-900 dark:text-white">{displayValues.age} anos</span> investindo <span className="font-bold text-stone-900 dark:text-white">R$ {formatMoney(displayValues.investment)}</span> por mês
        </p>
      </div>

      {/* --- CARD STATUS --- */}
      <div className="bg-white dark:bg-stone-800 p-5 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-700 flex items-center justify-between mb-8">
        <div>
          <p className="text-[10px] text-stone-500 font-bold tracking-wider mb-1">Esse mês você já investiu</p>
          <div className="flex items-baseline text-stone-900 dark:text-white">
            <span className="text-sm font-bold mr-1">R$</span>
            <span className="text-3xl font-extrabold tracking-tighter">
              {investedThisMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 }).split(',')[0]}
            </span>
            <span className="text-sm font-bold ml-0.5">
              ,{investedThisMonth.toLocaleString('pt-BR', { minimumFractionDigits: 2 }).split(',')[1]}
            </span>
          </div>
        </div>
        
        {diff >= 0 ? (
          <div className="bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-400 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 whitespace-nowrap shadow-sm">
            {diff > 0 ? <ArrowUpCircle size={14} strokeWidth={2.5} /> : <CheckCircle2 size={14} strokeWidth={2.5} />}
            {diff > 0 ? `R$ ${formatMoney(diff)} acima` : 'Meta batida'}
          </div>
        ) : (
          <div className="bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400 px-3 py-1.5 rounded-full text-xs font-bold flex items-center gap-1.5 whitespace-nowrap border border-amber-100 dark:border-amber-800/50">
            <AlertCircle size={14} strokeWidth={2.5} />
            Faltam R$ {formatMoney(Math.abs(diff))}
          </div>
        )}
      </div>

      {/* --- TOGGLE SIMULADOR --- */}
      <div className="flex justify-between items-center mb-6 px-1">
        <h3 className="text-lg font-bold text-stone-900 dark:text-white tracking-tight">Simular novo cenário</h3>
        <label className="relative inline-flex items-center cursor-pointer">
          <input 
            type="checkbox" 
            checked={showSimulator} 
            onChange={() => setShowSimulator(!showSimulator)} 
            className="sr-only peer" 
          />
          <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-stone-900"></div>
        </label>
      </div>

      {/* --- PAINEL SIMULADOR --- */}
      {showSimulator && (
        <div className="bg-white dark:bg-stone-800 rounded-3xl p-6 pt-14 shadow-sm border border-stone-100 dark:border-stone-700 relative animate-in slide-in-from-top-4 fade-in duration-300">
          
          <button 
            onClick={handleSave}
            disabled={saving}
            className="absolute top-5 right-5 bg-stone-900 dark:bg-emerald-600 text-white text-[10px] font-bold px-4 py-2 rounded-full flex items-center gap-1.5 hover:bg-stone-800 transition-colors z-10 shadow-md active:scale-95"
          >
            {saving ? <Loader2 size={12} className="animate-spin"/> : <Save size={12} />}
            Salvar
          </button>

          {/* Slider Idade */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-stone-50 dark:bg-stone-700 rounded-xl text-stone-500 dark:text-stone-400 border border-stone-100 dark:border-stone-600">
                  <CalendarDays size={18} />
                </div>
                <span className="text-xs font-bold text-stone-500 dark:text-stone-400 tracking-wide">Aposentadoria</span>
              </div>
              <div className="flex items-center bg-stone-50 px-3 py-1 rounded-lg border border-stone-100 transition-colors hover:border-stone-300 focus-within:border-stone-900">
                  <input
                    type="number"
                    value={retirementAge}
                    onChange={(e) => handleAgeChange(Number(e.target.value))}
                    className="w-10 text-right font-extrabold text-stone-900 dark:text-white bg-transparent outline-none p-0 text-lg"
                  />
                  <span className="text-sm font-bold text-stone-500 ml-1">anos</span>
              </div>
            </div>
            <input type="range" min={currentAge + 1} max={90} value={retirementAge} onChange={(e) => handleAgeChange(Number(e.target.value))} className="w-full h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-stone-900 dark:accent-emerald-500" />
          </div>

          {/* Slider Renda */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-stone-50 dark:bg-stone-700 rounded-xl text-stone-500 dark:text-stone-400 border border-stone-100 dark:border-stone-600">
                  <CircleDollarSign size={18} />
                </div>
                <span className="text-xs font-bold text-stone-500 dark:text-stone-400 tracking-wide">Renda mensal</span>
              </div>
              <div className="flex items-center bg-stone-50 px-3 py-1 rounded-lg border border-stone-100 transition-colors hover:border-stone-300 focus-within:border-stone-900">
                  <span className="text-xs font-bold text-stone-500 mr-1">R$</span>
                  <input
                    type="text"
                    value={desiredIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    onChange={(e) => {
                        const value = Number(e.target.value.replace(/\D/g, '')) / 100;
                        handleIncomeChange(value);
                    }}
                    className="w-24 text-right font-extrabold text-stone-900 dark:text-white bg-transparent outline-none p-0 text-lg"
                  />
              </div>
            </div>
            <input type="range" min={1000} max={50000} step={500} value={desiredIncome} onChange={(e) => handleIncomeChange(Number(e.target.value))} className="w-full h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-stone-900 dark:accent-emerald-500" />
          </div>

          {/* Slider Aporte */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-stone-50 dark:bg-stone-700 rounded-xl text-stone-500 dark:text-stone-400 border border-stone-100 dark:border-stone-600">
                  <PiggyBank size={18} />
                </div>
                <span className="text-xs font-bold text-stone-500 dark:text-stone-400 tracking-wide">Aporte necessário</span>
              </div>
              <div className="flex items-center bg-stone-50 px-3 py-1 rounded-lg border border-stone-100 transition-colors hover:border-stone-300 focus-within:border-stone-900">
                  <span className="text-xs font-bold text-stone-500 mr-1">R$</span>
                  <input
                    type="text"
                    value={monthlyInvestment.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    onChange={(e) => {
                        const value = Number(e.target.value.replace(/\D/g, '')) / 100;
                        handleInvestmentChange(value);
                    }}
                    className="w-24 text-right font-extrabold text-stone-900 dark:text-white bg-transparent outline-none p-0 text-lg"
                  />
              </div>
            </div>
            <input type="range" min={0} max={20000} step={50} value={monthlyInvestment} onChange={(e) => handleInvestmentChange(Number(e.target.value))} className="w-full h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-stone-900 dark:accent-emerald-500" />
          </div>

          {/* Configs Avançadas */}
          <div className="mt-8 pt-6 border-t border-stone-100 dark:border-stone-700">
            <h4 className="text-[10px] font-bold text-stone-400 tracking-wider mb-4">Premissas econômicas</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-stone-600 block mb-1.5">Idade atual</label>
                <div className="relative">
                  <input type="number" value={currentAge} disabled className="w-full bg-stone-50 text-stone-400 rounded-xl p-2.5 pl-9 text-sm font-bold border border-stone-200 cursor-not-allowed" />
                  <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-stone-600 block mb-1.5">Patrimônio inicial</label>
                <div className="relative">
                   <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-400">R$</span>
                   <input type="number" value={initialCapital} disabled className="w-full bg-stone-50 text-stone-400 rounded-xl p-2.5 pl-8 text-sm font-bold border border-stone-200 cursor-not-allowed" />
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-stone-600 block mb-1.5">Selic (%)</label>
                <input type="number" step="0.1" value={selic} onChange={(e) => setSelic(Number(e.target.value))} className="w-full bg-white rounded-xl p-2.5 text-sm font-bold border border-stone-200 focus:ring-2 focus:ring-stone-900 outline-none" />
              </div>
              <div>
                <label className="text-xs font-bold text-stone-600 block mb-1.5">IPCA (%)</label>
                <input type="number" step="0.1" value={ipca} onChange={(e) => setIpca(Number(e.target.value))} className="w-full bg-white rounded-xl p-2.5 text-sm font-bold border border-stone-200 focus:ring-2 focus:ring-stone-900 outline-none" />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- MODAL --- */}
      {showAccountSettings && (
        <RetirementSettingsModal
          onClose={() => setShowAccountSettings(false)}
          initialSelection={selectedAccountIds}
          onSave={handleSettingsSave}
        />
      )}
    </div>
  );
}