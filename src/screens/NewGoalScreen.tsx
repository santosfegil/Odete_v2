import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import {  MessageCircle } from 'lucide-react';


interface NewGoalScreenProps {
  onBack: () => void;
  onAskOdete: () => void;
}

export default function NewGoalScreen({ onBack, onAskOdete }: NewGoalScreenProps) {
  const [goalName, setGoalName] = useState('');
  const [knowsValue, setKnowsValue] = useState<'yes' | 'no'>('no');
  const [targetAmount, setTargetAmount] = useState('');

  const handleContinue = () => {
    if (!goalName.trim()) return;

    console.log('Nova meta criada:', {
      name: goalName,
      hasDefinedAmount: knowsValue === 'yes',
      targetAmount: knowsValue === 'yes' ? targetAmount : null,
    });

    onBack();
  };

  const formatCurrency = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    const amount = parseFloat(numbers) / 100;
    return amount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const formatted = formatCurrency(e.target.value);
    setTargetAmount(formatted);
  };

  return (
    <div className="flex flex-col h-screen bg-stone-50">
      <header className="flex items-center p-4 pb-2 justify-between">
        <button
          onClick={onBack}
          className="flex w-12 h-12 shrink-0 items-center justify-center text-stone-800"
        >
          <ArrowLeft size={24} />
        </button>
        <h2 className="text-stone-800 text-lg font-bold leading-tight tracking-tight flex-1 text-center">
          Nova Meta
        </h2>
        <div className="w-12 shrink-0"></div>
      </header>

      <main className="flex flex-col flex-1 px-4 pt-6 pb-4 overflow-y-auto">
        <h1 className="text-stone-800 tracking-tight text-[32px] font-bold leading-tight text-left pb-8">
          Qual é a sua meta?
        </h1>

        <div className="flex flex-col gap-4">
          <label className="flex flex-col w-full">
            <p className="text-stone-800 text-base font-medium leading-normal pb-2">
              Nome da meta
            </p>
            <input
              className="w-full rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-stone-400 bg-stone-50 h-14 placeholder:text-stone-400 p-4 text-base font-normal leading-normal"
              placeholder="Ex: Viagem para o Japão"
              value={goalName}
              onChange={(e) => setGoalName(e.target.value)}
            />
          </label>
        </div>

        <h3 className="text-stone-800 text-[22px] font-bold leading-tight tracking-tight text-left pb-3 pt-10">
          Você já sabe o valor?
        </h3>

        <div className="flex py-3">
          <div className="flex h-12 w-full flex-1 items-center justify-center rounded-full bg-stone-200 p-1">
            <button
              onClick={() => setKnowsValue('yes')}
              className={`flex h-full grow items-center justify-center rounded-full px-2 text-sm font-medium leading-normal transition-colors ${
                knowsValue === 'yes'
                  ? 'bg-emerald-500 shadow-md text-white'
                  : 'text-stone-800'
              }`}
            >
              Sim
            </button>
            <button
              onClick={() => setKnowsValue('no')}
              className={`flex h-full grow items-center justify-center rounded-full px-2 text-sm font-medium leading-normal transition-colors ${
                knowsValue === 'no'
                  ? 'bg-emerald-500 shadow-md text-white'
                  : 'text-stone-800'
              }`}
            >
              Não
            </button>
          </div>
        </div>

        {knowsValue === 'yes' && (
          <div className="flex flex-col gap-4 mt-4">
            <label className="flex flex-col w-full">
              <p className="text-stone-800 text-base font-medium leading-normal pb-2">
                Valor total
              </p>
              <div className="relative">
                <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-stone-400">
                  R$
                </span>
                <input
                  className="w-full rounded-xl text-stone-800 focus:outline-none focus:ring-2 focus:ring-emerald-500 border border-stone-400 bg-stone-50 h-14 placeholder:text-stone-400 pl-10 pr-4 text-base font-normal leading-normal"
                  inputMode="decimal"
                  placeholder="0,00"
                  type="text"
                  value={targetAmount}
                  onChange={handleAmountChange}
                />
              </div>
            </label>
          </div>
        )}

        {knowsValue === 'no' && (
          <div className="mt-8">
            <button
  onClick={onAskOdete}
  className="w-full flex items-center justify-center gap-3 rounded-xl bg-emerald-50 border border-emerald-200 h-14 text-emerald-600 font-bold text-base leading-normal shadow-sm hover:bg-emerald-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-emerald-500 transition-colors"
>
  <MessageCircle size={20} />
  Perguntar para a Odete
</button>
          </div>
        )}

        <div className="flex-grow"></div>
      </main>

      <footer className="p-4 pt-2 sticky bottom-0 bg-stone-50">
        <button
          onClick={handleContinue}
          disabled={!goalName.trim()}
          className="w-full flex items-center justify-center rounded-xl bg-stone-800 h-14 text-white font-bold text-base leading-normal shadow-md hover:bg-stone-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-stone-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-stone-800"
        >
          Continuar
        </button>
      </footer>
    </div>
  );
}
