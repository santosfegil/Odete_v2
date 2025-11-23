import React, { useState } from 'react';
import { ArrowLeft, Trophy, Rocket, CheckCircle, Award, PiggyBank, TrendingUp, Wallet, Diamond, Share2, Flag, GraduationCap, MapPin } from 'lucide-react';
import MedalDetailModal from '../components/MedalDetailModal';

interface MedalItem {
  id: string;
  name: string;
  icon: string;
  earned: boolean;
  description: string;
}

interface MedalCategory {
  title: string;
  medals: MedalItem[];
}

interface AllMedalsScreenProps {
  onBack: () => void;
}

const MEDAL_CATEGORIES: MedalCategory[] = [
  {
    title: 'Medalhas de poupador',
    medals: [
      { id: '1', name: 'Mestre da Poupança', icon: 'trophy', earned: true, description: 'Parabéns! Você demonstrou disciplina exemplar ao manter uma poupança consistente e construir sua reserva financeira.' },
      { id: '2', name: 'Economia Expert', icon: 'piggy-bank', earned: false, description: 'Você alcançou um nível excepcional de economia e gestão de recursos financeiros.' },
      { id: '3', name: 'Rei do Orçamento', icon: 'trending-up', earned: false, description: 'Você dominou a arte de planejar e controlar seu orçamento com maestria.' },
      { id: '4', name: 'Cofre Cheio', icon: 'wallet', earned: false, description: 'Sua dedicação em poupar resultou em uma reserva financeira sólida e consistente.' },
    ],
  },
  {
    title: 'Medalhas de investidor',
    medals: [
      { id: '5', name: 'Investidor Pioneiro', icon: 'rocket', earned: true, description: 'Parabéns! Você realizou seu primeiro investimento e deu o primeiro passo na sua jornada para a independência financeira.' },
      { id: '6', name: 'Mão de Diamante', icon: 'diamond', earned: true, description: 'Você demonstrou resiliência e visão de longo prazo ao manter seus investimentos mesmo em momentos de volatilidade.' },
      { id: '7', name: 'Estrategista de Portfólio', icon: 'trending-up', earned: false, description: 'Você construiu um portfólio diversificado e bem balanceado, demonstrando conhecimento em gestão de investimentos.' },
      { id: '8', name: 'Visionário Financeiro', icon: 'award', earned: false, description: 'Sua visão estratégica e planejamento de longo prazo resultaram em crescimento consistente do seu patrimônio.' },
    ],
  },
  {
    title: 'Medalhas de metas bem sucedidas',
    medals: [
      { id: '9', name: 'Meta Concluída', icon: 'check-circle', earned: true, description: 'Parabéns! Você alcançou sua primeira meta financeira, demonstrando foco e determinação.' },
      { id: '10', name: 'Planejador de Viagens', icon: 'map-pin', earned: false, description: 'Você realizou o sonho de viajar através de planejamento financeiro disciplinado.' },
      { id: '11', name: 'Fundo para Educação', icon: 'graduation-cap', earned: false, description: 'Você investiu no futuro ao criar um fundo dedicado para educação.' },
      { id: '12', name: 'Mestre das Metas', icon: 'flag', earned: false, description: 'Você alcançou múltiplas metas financeiras, demonstrando consistência e dedicação excepcional.' },
    ],
  },
];

const getIconComponent = (iconName: string, earned: boolean) => {
  const iconProps = {
    size: 32,
    className: earned ? 'text-yellow-400' : 'text-stone-400 dark:text-stone-600',
  };

  switch (iconName) {
    case 'trophy':
      return <Trophy {...iconProps} />;
    case 'rocket':
      return <Rocket {...iconProps} />;
    case 'check-circle':
      return <CheckCircle {...iconProps} />;
    case 'piggy-bank':
      return <PiggyBank {...iconProps} />;
    case 'trending-up':
      return <TrendingUp {...iconProps} />;
    case 'wallet':
      return <Wallet {...iconProps} />;
    case 'diamond':
      return <Diamond {...iconProps} />;
    case 'award':
      return <Award {...iconProps} />;
    case 'flag':
      return <Flag {...iconProps} />;
    case 'graduation-cap':
      return <GraduationCap {...iconProps} />;
    case 'map-pin':
      return <MapPin {...iconProps} />;
    default:
      return <Award {...iconProps} />;
  }
};

export default function AllMedalsScreen({ onBack }: AllMedalsScreenProps) {
  const [selectedMedal, setSelectedMedal] = useState<MedalItem | null>(null);

  return (
    <div className="flex-1 overflow-y-auto bg-stone-50 dark:bg-stone-900 min-h-screen">
      <header className="flex items-center justify-between p-6 pb-8">
        <button onClick={onBack} className="text-stone-900 dark:text-stone-100">
          <ArrowLeft size={28} />
        </button>
        <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100 absolute left-1/2 -translate-x-1/2">
          Minhas Medalhas
        </h1>
        <div className="w-8"></div>
      </header>

      <main className="space-y-10 pb-24">
        {MEDAL_CATEGORIES.map((category, index) => (
          <section key={index}>
            <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-4 px-6">
              {category.title}
            </h2>
            <div className="flex overflow-x-auto space-x-4 pl-6 pr-6 pb-4 no-scrollbar">
              {category.medals.map((medal) => (
                <button
                  key={medal.id}
                  onClick={() => setSelectedMedal(medal)}
                  className={`w-28 flex-shrink-0 rounded-3xl p-4 flex flex-col items-center justify-center text-center aspect-square relative ${
                    medal.earned
                      ? 'bg-white dark:bg-stone-800 shadow-sm'
                      : 'bg-stone-100 dark:bg-stone-800/50'
                  }`}
                >
                  <button
                    className={`absolute top-3 right-3 ${
                      medal.earned
                        ? 'text-stone-500 dark:text-stone-400'
                        : 'text-stone-400 dark:text-stone-600'
                    }`}
                  >
                    <Share2 size={16} />
                  </button>
                  <div className="mb-2">{getIconComponent(medal.icon, medal.earned)}</div>
                  <p
                    className={`text-sm font-medium leading-tight ${
                      medal.earned
                        ? 'text-stone-700 dark:text-stone-300'
                        : 'text-stone-400 dark:text-stone-500'
                    }`}
                  >
                    {medal.name}
                  </p>
                </button>
              ))}
            </div>
          </section>
        ))}
      </main>

      {selectedMedal && (
        <MedalDetailModal medal={selectedMedal} onClose={() => setSelectedMedal(null)} />
      )}
    </div>
  );
}
