import React, { useState, useEffect, useRef } from 'react';
import { 
  Settings, 
  CalendarDays, 
  CircleDollarSign, 
  PiggyBank, 
  CheckCircle2,
  AlertCircle,
  X,
  Save,
  ArrowUpCircle
} from 'lucide-react';

// Alterado o nome para RetirementSimulatorMock para coincidir com seu arquivo
export const RetirementSimulatorMock = () => {
  const [isSimulating, setIsSimulating] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  // --- MOCKS E DADOS DO USUÁRIO ---
  // Valor que o usuário de fato investiu este mês (Mockado conforme pedido)
  // Mudei para 1200 para testar lógica de "acima" vs "abaixo" vs "igual" dependendo da simulação
  const CURRENT_MONTH_INVESTED = 1500; 

  // --- Parâmetros Globais (Editáveis na Engrenagem) ---
  const [currentAge, setCurrentAge] = useState(30);
  const [selic, setSelic] = useState(10.0); // % ao ano
  const [ipca, setIpca] = useState(6.0);    // % ao ano
  const [initialCapital, setInitialCapital] = useState(100000); // Mock de 100k inicial

  // --- Estados da Simulação (Sliders) ---
  const [simAge, setSimAge] = useState(65);
  const [simIncome, setSimIncome] = useState(5000);
  const [simInvestment, setSimInvestment] = useState(0); 

  // --- Estados Salvos (Cabeçalho) ---
  const [savedValues, setSavedValues] = useState({
    age: 65,
    income: 5000,
    investment: 1000 
  });

  const [lastChanged, setLastChanged] = useState(null);

  // --- Funções Auxiliares de Cálculo ---
  const getRealMonthlyRate = () => {
    const realAnnualRate = ((1 + selic / 100) / (1 + ipca / 100)) - 1;
    return Math.pow(1 + realAnnualRate, 1 / 12) - 1;
  };

  // --- Motor de Cálculo ---
  useEffect(() => {
    const r = getRealMonthlyRate();
    const yearsToInvest = Math.max(1, simAge - currentAge);
    const months = yearsToInvest * 12;

    const totalCapitalRequired = simIncome / r;
    const initialCapitalFutureValue = initialCapital * Math.pow(1 + r, months);
    const gapToCover = totalCapitalRequired - initialCapitalFutureValue;

    if (gapToCover <= 0) {
        if (lastChanged !== 'monthlyInvestment') {
            setSimInvestment(0);
        }
        return;
    }

    const annuityFactor = (Math.pow(1 + r, months) - 1) / r;

    if (lastChanged === 'retirementAge' || lastChanged === 'desiredIncome' || lastChanged === null) {
      const requiredInvestment = gapToCover / annuityFactor;
      setSimInvestment(Math.max(0, Math.round(requiredInvestment)));
    
    } else if (lastChanged === 'monthlyInvestment') {
      const futureGapCovered = simInvestment * annuityFactor;
      const totalFutureCapital = initialCapitalFutureValue + futureGapCovered;
      const possibleIncome = totalFutureCapital * r;
      setSimIncome(Math.round(possibleIncome));
    }
    
    setLastChanged(null);

  }, [simAge, simIncome, simInvestment, currentAge, selic, ipca, initialCapital, lastChanged]);

  useEffect(() => {
    if (savedValues.investment === 1000 && simInvestment !== 0) {
       handleSave();
    }
  }, [simInvestment]);

  // Handlers
  const handleAgeChange = (val) => { setSimAge(val); setLastChanged('retirementAge'); };
  const handleIncomeChange = (val) => { setSimIncome(val); setLastChanged('desiredIncome'); };
  const handleInvestmentChange = (val) => { setSimInvestment(val); setLastChanged('monthlyInvestment'); };

  const handleSave = () => {
    setSavedValues({
      age: simAge,
      income: simIncome,
      investment: simInvestment
    });
  };

  const formatCurrency = (val) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  // --- Lógica do Badge (Status Card) ---
  const investmentDiff = CURRENT_MONTH_INVESTED - savedValues.investment;

  const Badge = () => {
    if (investmentDiff > 0) {
      return (
        <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border border-emerald-200 shadow-sm animate-in fade-in zoom-in whitespace-nowrap">
          <ArrowUpCircle size={14} strokeWidth={2.5} />
          {formatCurrency(investmentDiff)} acima
        </span>
      );
    }
    if (investmentDiff === 0) {
        return (
          <span className="bg-emerald-100 text-emerald-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border border-emerald-200 shadow-sm animate-in fade-in zoom-in whitespace-nowrap">
            <CheckCircle2 size={14} strokeWidth={2.5} />
            Valor atingido
          </span>
        );
    }
    return (
      <span className="bg-amber-50 text-amber-700 px-3 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 border border-amber-200 shadow-sm animate-in fade-in zoom-in whitespace-nowrap">
        <AlertCircle size={14} strokeWidth={2.5} />
        Faltam {formatCurrency(Math.abs(investmentDiff))}
      </span>
    );
  };

  // --- Componentes UI ---

  const SettingsModal = () => (
    <div className="absolute inset-0 bg-white/90 backdrop-blur-sm z-50 rounded-[2rem] flex items-center justify-center p-6 animate-in fade-in zoom-in duration-200">
      <div className="bg-white w-full shadow-2xl rounded-2xl border border-slate-100 p-6 relative">
        <button 
          onClick={() => setShowSettings(false)}
          className="absolute right-4 top-4 text-slate-400 hover:text-slate-600"
        >
          <X size={20} />
        </button>
        
        <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center gap-2">
          <Settings size={18} className="text-blue-600" />
          Premissas
        </h3>

        <div className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
              Patrimônio Atual
            </label>
            <div className="flex items-center gap-2 bg-slate-50 p-3 rounded-lg border border-slate-200">
              <span className="text-slate-400 font-medium">R$</span>
              <input 
                type="number" 
                value={initialCapital}
                onChange={(e) => setInitialCapital(Number(e.target.value))}
                className="bg-transparent font-bold text-slate-900 w-full outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">
                Idade Atual
              </label>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <input 
                  type="number" 
                  value={currentAge}
                  onChange={(e) => setCurrentAge(Number(e.target.value))}
                  className="bg-transparent font-bold text-slate-900 w-full outline-none"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">Selic (%)</label>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <input type="number" value={selic} step="0.1" onChange={(e) => setSelic(Number(e.target.value))} className="bg-transparent font-bold text-slate-900 w-full outline-none"/>
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wider mb-1">IPCA (%)</label>
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <input type="number" value={ipca} step="0.1" onChange={(e) => setIpca(Number(e.target.value))} className="bg-transparent font-bold text-slate-900 w-full outline-none"/>
              </div>
            </div>
          </div>
          
          <button 
            onClick={() => setShowSettings(false)}
            className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl transition-colors mt-2 shadow-lg shadow-blue-200"
          >
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );

  const EditableValue = ({ value, type, min, max, onChange, suffix = '' }) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempValue, setTempValue] = useState(value);
    const inputRef = useRef(null);

    useEffect(() => { if (!isEditing) setTempValue(value); }, [value, isEditing]);
    useEffect(() => { if (isEditing && inputRef.current) { inputRef.current.focus(); inputRef.current.select(); } }, [isEditing]);

    const handleBlur = () => {
      setIsEditing(false);
      let newValue = Number(tempValue);
      if (isNaN(newValue)) newValue = value;
      if (newValue < min) newValue = min;
      if (newValue > max) newValue = max;
      onChange(newValue);
    };

    if (isEditing) {
      return (
        <input
          ref={inputRef}
          type="number"
          value={tempValue}
          onChange={(e) => setTempValue(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={(e) => e.key === 'Enter' && handleBlur()}
          className="text-base font-bold text-slate-900 w-24 text-right bg-white border border-blue-300 rounded px-1 outline-none ring-2 ring-blue-100"
        />
      );
    }
    let displayValue = type === 'currency' ? formatCurrency(value) : `${value} ${suffix}`;
    return (
      <span onClick={() => setIsEditing(true)} className="text-base font-bold text-slate-900 cursor-text hover:bg-slate-100 px-1 rounded transition-colors truncate max-w-[120px] text-right">
        {displayValue}
      </span>
    );
  };

  const SimulationRow = ({ Icon, label, value, min, max, step, onChange, type, suffix }) => {
    const percentage = Math.min(100, Math.max(0, ((value - min) / (max - min)) * 100));
    return (
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-end text-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-1.5 rounded-lg bg-white border border-slate-100 shadow-sm">
              <Icon size={20} className="text-slate-500" strokeWidth={1.5} />
            </div>
            <span className="text-sm sm:text-base font-medium text-slate-600">{label}</span>
          </div>
          <EditableValue value={value} min={min} max={max} onChange={onChange} type={type} suffix={suffix} />
        </div>
        <div className="relative h-6 flex items-center group touch-none"> 
          <div className="absolute w-full h-2 bg-slate-200 rounded-full overflow-hidden pointer-events-none">
            <div className="h-full bg-blue-600 rounded-full transition-none" style={{ width: `${percentage}%` }}></div>
          </div>
          <div className="absolute h-5 w-5 bg-white rounded-full border-[3px] border-blue-600 shadow-md pointer-events-none transition-transform duration-100 ease-out group-hover:scale-110" style={{ left: `${percentage}%`, transform: 'translateX(-50%)' }}></div>
          <input type="range" min={min} max={max} step={step} value={value} onChange={(e) => onChange(Number(e.target.value))} className="absolute w-full h-full opacity-0 cursor-pointer z-10 m-0 p-0"/>
        </div>
      </div>
    );
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 rounded-[2.5rem] bg-[#F0F5FF] shadow-xl font-sans transition-all duration-300 border border-white/50 relative overflow-hidden">
      
      {showSettings && <SettingsModal />}

      {/* --- CABEÇALHO --- */}
      <div className="relative flex flex-col items-center mb-8 pt-2">
        <button onClick={() => setShowSettings(true)} className="absolute right-0 top-0 text-slate-400 hover:text-blue-600 transition-colors p-2 hover:bg-blue-50 rounded-full">
          <Settings size={22} />
        </button>

        <h1 className="text-[2.5rem] font-extrabold text-slate-900 leading-tight mt-4 tracking-tight text-center">
          {formatCurrency(savedValues.income)}
        </h1>
        
        {/* Subtítulos */}
        <div className="flex flex-col items-center gap-0.5 mt-1">
          <p className="text-slate-500 font-medium text-sm">
            Renda mensal aos <strong>{savedValues.age} anos</strong>
          </p>
          <p className="text-slate-500 font-medium text-sm">
            investindo <strong className="text-slate-700">{formatCurrency(savedValues.investment)}</strong> por mês
          </p>
        </div>

        {/* Status Investimento Card */}
        <div className="mt-6 w-full bg-white/60 p-3 rounded-xl border border-white shadow-sm">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-2">
            <span className="text-sm text-slate-600 font-medium text-center sm:text-left">
              Esse mês você já investiu <strong>{formatCurrency(CURRENT_MONTH_INVESTED)}</strong>
            </span>
            <Badge />
          </div>
        </div>
      </div>

      <div className="w-full h-px bg-slate-200 mb-6"></div>

      {/* --- Toggle Simulação --- */}
      <div className="flex justify-between items-center mb-2 px-1">
        <span className="text-lg text-slate-700 font-semibold tracking-tight">Simular novo cenário</span>
        <button 
          onClick={() => setIsSimulating(!isSimulating)}
          className={`w-12 h-7 flex items-center rounded-full p-1 cursor-pointer transition-colors duration-300 focus:outline-none ${isSimulating ? 'bg-blue-600' : 'bg-slate-300'}`}
        >
          <div className={`bg-white w-5 h-5 rounded-full shadow-sm transform duration-300 ease-out ${isSimulating ? 'translate-x-5' : 'translate-x-0'}`}></div>
        </button>
      </div>

      {/* --- ÁREA DE SIMULAÇÃO --- */}
      {isSimulating && (
        <div className="animate-in fade-in slide-in-from-top-4 duration-300 bg-white/50 rounded-2xl p-4 mt-4 border border-white relative">
          
          {/* Botão Salvar Compacto (Topo) */}
          <div className="flex justify-end mb-4">
            <button 
              onClick={handleSave}
              className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white text-sm font-bold rounded-full transition-all shadow-md shadow-slate-200 flex items-center gap-1.5 active:scale-95"
            >
              <Save size={14} />
              Salvar
            </button>
          </div>

          <div className="space-y-8 pb-2">
            <SimulationRow 
              Icon={CalendarDays} 
              label="Idade de aposentadoria" 
              value={simAge} min={currentAge + 1} max={90} step={1} onChange={handleAgeChange} type="number" suffix="anos"
            />
            <SimulationRow 
              Icon={CircleDollarSign} 
              label="Renda mensal desejada" 
              value={simIncome} min={1000} max={50000} step={100} onChange={handleIncomeChange} type="currency"
            />
            <SimulationRow 
              Icon={PiggyBank} 
              label="Investimento mensal necessário" 
              value={simInvestment} min={0} max={30000} step={50} onChange={handleInvestmentChange} type="currency"
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default RetirementSimulatorMock;