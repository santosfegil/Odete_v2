import React from 'react';
import { ArrowLeft, Plus, Umbrella, Check } from 'lucide-react';
import { Goal } from '../types';

interface AllGoalsScreenProps {
  onBack: () => void;
  onCreateGoal: () => void;
}

const MOCK_ALL_GOALS: Goal[] = [
  {
    id: '1',
    name: 'Viagem para a Praia',
    icon: 'umbrella',
    iconColor: 'text-emerald-500',
    iconBgColor: 'bg-emerald-100 dark:bg-emerald-900',
    progress: 75,
    current: 750,
    target: 1000,
    completed: false,
  },
  {
    id: '2',
    name: 'Reserva de Emergência',
    icon: 'umbrella',
    iconColor: 'text-emerald-500',
    iconBgColor: 'bg-emerald-100 dark:bg-emerald-900',
    progress: 50,
    current: 5000,
    target: 10000,
    completed: false,
  },
  {
    id: '3',
    name: 'Comprar Notebook Novo',
    icon: 'check',
    iconColor: 'text-white',
    iconBgColor: 'bg-emerald-400',
    progress: 100,
    current: 4500,
    target: 4500,
    completed: true,
  },
  {
    id: '4',
    name: 'Curso de Design',
    icon: 'check',
    iconColor: 'text-white',
    iconBgColor: 'bg-emerald-400',
    progress: 100,
    current: 1200,
    target: 1200,
    completed: true,
  },
];

const getIconComponent = (iconName: string) => {
  switch (iconName) {
    case 'umbrella':
      return <Umbrella size={24} />;
    case 'check':
      return <Check size={24} />;
    default:
      return <Umbrella size={24} />;
  }
};

export default function AllGoalsScreen({ onBack, onCreateGoal }: AllGoalsScreenProps) {
  return (
  <div className="relative flex-1 flex flex-col w-full h-full bg-stone-50 dark:bg-stone-900">
  
  
  <div className="flex-1 overflow-y-auto">
      <div className="sticky top-0 z-10 p-4 bg-stone-50 dark:bg-stone-900">
        <div className="flex items-center justify-between">
          <button onClick={onBack} className="text-stone-800 dark:text-stone-200">
            <ArrowLeft size={24} />
          </button>
          <h1 className="text-xl font-bold text-stone-900 dark:text-stone-50 text-center flex-grow">
            Minhas Metas
          </h1>
          <div className="w-6"></div>
        </div>
      </div>

      <main className="p-4 space-y-4 pb-32">
        {MOCK_ALL_GOALS.map((goal) => (
          <div
            key={goal.id}
            className={`p-4 rounded-3xl shadow-sm ${
              goal.completed
                ? 'bg-emerald-50 dark:bg-emerald-900/50 opacity-80'
                : 'bg-white dark:bg-stone-700'
            }`}
          >
            <div className="flex items-center gap-4">
              <div
                className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center ${goal.iconBgColor}`}
              >
                <div className={goal.iconColor}>{getIconComponent(goal.icon)}</div>
              </div>
              <div className="flex-grow">
                <h2 className="font-semibold text-stone-800 dark:text-stone-100">{goal.name}</h2>
                <div className="mt-2">
                  <div
                    className={`w-full rounded-full h-2.5 ${
                      goal.completed
                        ? 'bg-emerald-200 dark:bg-emerald-700'
                        : 'bg-stone-200 dark:bg-stone-600'
                    }`}
                  >
                    <div
                      className="bg-emerald-400 h-2.5 rounded-full transition-all"
                      style={{ width: `${goal.progress}%` }}
                    ></div>
                  </div>
                  <p className="text-right text-sm text-stone-500 dark:text-stone-400 mt-1">
                    R${goal.current.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} / R$
                    {goal.target.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </p>
                </div>
              </div>
            </div>
          </div>
        ))}
      </main>
  </div>

     <div className="absolute bottom-8 right-8 flex flex-col items-center gap-2">
        <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Nova</span>
        <button
          onClick={onCreateGoal}
          className="w-16 h-16 bg-stone-800 dark:bg-stone-700 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-stone-700 dark:hover:bg-stone-600 transition-colors"
        >
          <Plus size={32} strokeWidth={1.5} />
        </button>
      </div>
    </div>
  );
}
