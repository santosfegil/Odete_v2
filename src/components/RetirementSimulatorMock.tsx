import React, { useState, useEffect } from 'react';
import { 
  Settings,MessageCircle, CalendarDays, CircleDollarSign, PiggyBank, 
  Save, ArrowUpCircle, CheckCircle2, AlertCircle, Loader2, Lock 
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function RetirementSimulator() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Controle de visibilidade do simulador (Vem fechado por padrão)
  const [showSimulator, setShowSimulator] = useState(false);

  // --- DADOS REAIS DO USUÁRIO ---
  const [initialCapital, setInitialCapital] = useState(0); 
  const [investedThisMonth, setInvestedThisMonth] = useState(0); 
  
  // --- ESTADOS DE EXIBIÇÃO (SÓ MUDAM AO SALVAR) ---
  const [displayValues, setDisplayValues] = useState({
    income: 5000,
    age: 65,
    investment: 1000
  });

  // --- PARÂMETROS DO SIMULADOR (MUDAM EM TEMPO REAL) ---
  const [currentAge, setCurrentAge] = useState(30);
  const [retirementAge, setRetirementAge] = useState(65);
  const [desiredIncome, setDesiredIncome] = useState(5000);
  const [monthlyInvestment, setMonthlyInvestment] = useState(1000);
  
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

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: userData } = await supabase
        .from('users')
        .select('birth_date')
        .eq('id', user.id)
        .single();

      if (userData?.birth_date) {
        const realAge = calculateAge(userData.birth_date);
        setCurrentAge(realAge);
      }

      const { data: plan } = await supabase
        .from('retirement_plans')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (plan) {
        setPlanId(plan.id);
        
        // Seta valores do simulador
        setRetirementAge(plan.target_retirement_age);
        setDesiredIncome(plan.desired_monthly_income);
        setMonthlyInvestment(plan.monthly_contribution_goal);
        setSelic(plan.assumptions_selic || 10);
        setIpca(plan.assumptions_ipca || 6);

        // Seta valores de exibição (Resumo)
        setDisplayValues({
          income: plan.desired_monthly_income,
          age: plan.target_retirement_age,
          investment: plan.monthly_contribution_goal
        });
      }

      const { data: accounts } = await supabase
        .from('accounts')
        .select('balance')
        .eq('user_id', user.id);
      
      const totalPatrimony = accounts?.reduce((sum, acc) => sum + acc.balance, 0) || 0;
      setInitialCapital(totalPatrimony);

      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0,0,0,0);

      const { data: investments } = await supabase
        .from('transactions')
        .select(`amount, categories!inner(scope)`)
        .eq('user_id', user.id)
        .eq('categories.scope', 'investment')
        .gte('date', startOfMonth.toISOString());

      const totalInvested = investments?.reduce((sum, t) => sum + t.amount, 0) || 0;
      setInvestedThisMonth(totalInvested);

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
      if (!user) return;

      const payload = {
        user_id: user.id,
        target_retirement_age: retirementAge,
        desired_monthly_income: desiredIncome,
        monthly_contribution_goal: monthlyInvestment,
        current_age: currentAge,
        assumptions_selic: selic,
        assumptions_ipca: ipca
      };

      if (planId) {
        await supabase.from('retirement_plans').update(payload).eq('id', planId);
      } else {
        await supabase.from('retirement_plans').insert(payload);
      }
      
      // Atualiza o resumo superior apenas ao salvar
      setDisplayValues({
        income: desiredIncome,
        age: retirementAge,
        investment: monthlyInvestment
      });

      alert('Plano salvo com sucesso!');
    } catch (error) {
      console.error('Erro ao salvar:', error);
    } finally {
      setSaving(false);
    }
  };

  // Lógica 1: Mudou Idade ou Renda -> Calcula Investimento Necessário
  const recalculateInvestment = (newAge: number, newIncome: number) => {
    const r = getRealMonthlyRate();
    const months = Math.max(1, (newAge - currentAge) * 12);
    
    // Capital Necessário = Renda / Taxa
    const requiredCapital = newIncome / r;
    // Valor Futuro do Capital Inicial
    const fvInitial = initialCapital * Math.pow(1 + r, months);
    
    const gap = requiredCapital - fvInitial;
    if (gap <= 0) return 0;

    // PMT = Gap * ( r / ((1+r)^n - 1) )
    const pmt = gap * (r / (Math.pow(1 + r, months) - 1));
    return Math.round(pmt);
  };

  // Lógica 2: Mudou Investimento -> Calcula Renda Possível
  const recalculateIncome = (newInvestment: number, newAge: number) => {
    const r = getRealMonthlyRate();
    const months = Math.max(1, (newAge - currentAge) * 12);

    // FV do Capital Inicial
    const fvInitial = initialCapital * Math.pow(1 + r, months);
    
    // FV dos Aportes Mensais: PMT * ( ((1+r)^n - 1) / r )
    const fvSeries = newInvestment * ((Math.pow(1 + r, months) - 1) / r);

    const totalCapital = fvInitial + fvSeries;
    
    // Renda Perpétua = Capital * Taxa
    const possibleIncome = totalCapital * r;
    return Math.round(possibleIncome);
  };

  // Handlers de Mudança (Garante atualização bidirecional)
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

  // Formatador
  const formatMoney = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const diff = investedThisMonth - displayValues.investment; // Usa o valor salvo para o badge

  if (loading) return <div className="p-8 text-center text-stone-500">Carregando simulador...</div>;

  return (
    <div className="bg-[#F2F7FF] dark:bg-stone-900 rounded-[2.5rem] p-6 shadow-sm border border-stone-100 dark:border-stone-800 relative overflow-hidden transition-all">
      
      <h2 className="text-lg font-bold text-stone-900 dark:text-white mb-1">Aposentadoria</h2>

      <div className="flex gap-1">

        
          <button className="absolute top-6 right-6 rounded-full hover:bg-emerald-200/50 text-stone-600 dark:text-stone-300  transition-colors">
            <Settings size={20} />
          </button>
        </div>
      {/* Botão Chat escondido por enquanto 
      <div className="absolute top-6 right-6 text-stone-300">
        <MessageCircle size={20} />
      </div>*/}

      {/* --- ÁREA DE DESTAQUE (Dados Salvos/Display) --- */}
      <div className="text-center mt-4 mb-8">
        
        {/* Input Gigante (Apenas Leitura aqui, reflete displayValues) */}
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
          <p className="text-[10px] text-stone-500 font-bold  tracking-wider mb-1">Esse mês você já investiu</p>
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

      {/* --- ÁREA DE CONTROLES (TOGGLE) --- */}
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

      {/* --- SIMULADOR EXPANSÍVEL --- */}
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

          {/* SLIDER 1: IDADE APOSENTADORIA */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-stone-50 dark:bg-stone-700 rounded-xl text-stone-500 dark:text-stone-400 border border-stone-100 dark:border-stone-600">
                  <CalendarDays size={18} />
                </div>
                <span className="text-xs font-bold text-stone-500 dark:text-stone-400  tracking-wide">Aposentadoria</span>


                
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
            <input 
              type="range" 
              min={currentAge + 1} 
              max={90} 
              value={retirementAge}
              onChange={(e) => handleAgeChange(Number(e.target.value))}
              className="w-full h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-stone-900 dark:accent-emerald-500"
            />
          </div>

          {/* SLIDER 2: RENDA DESEJADA */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="p-2.5 bg-stone-50 dark:bg-stone-700 rounded-xl text-stone-500 dark:text-stone-400 border border-stone-100 dark:border-stone-600">
                  <CircleDollarSign size={18} />
                </div>
                <span className="text-xs font-bold text-stone-500 dark:text-stone-400  tracking-wide">Renda mensal</span>
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
            <input 
              type="range" 
              min={1000} 
              max={50000} 
              step={500}
              value={desiredIncome}
              onChange={(e) => handleIncomeChange(Number(e.target.value))}
              className="w-full h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-stone-900 dark:accent-emerald-500"
            />
          </div>

          {/* SLIDER 3: APORTE NECESSÁRIO (Agora editável com Slider) */}
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
            <input 
              type="range" 
              min={0} 
              max={20000} 
              step={50}
              value={monthlyInvestment}
              onChange={(e) => handleInvestmentChange(Number(e.target.value))}
              className="w-full h-1.5 bg-stone-100 rounded-lg appearance-none cursor-pointer accent-stone-900 dark:accent-emerald-500"
            />
          </div>

          {/* CONFIGURAÇÕES AVANÇADAS */}
          <div className="mt-8 pt-6 border-t border-stone-100 dark:border-stone-700">
            <h4 className="text-[10px] font-bold text-stone-400  tracking-wider mb-4">Premissas econômicas</h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-bold text-stone-600 block mb-1.5">Idade atual</label>
                <div className="relative">
                  <input 
                    type="number" 
                    value={currentAge} 
                    disabled 
                    className="w-full bg-stone-50 text-stone-400 rounded-xl p-2.5 pl-9 text-sm font-bold border border-stone-200 cursor-not-allowed" 
                  />
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
    </div>
  );
}