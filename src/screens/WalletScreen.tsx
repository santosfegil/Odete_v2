import React, { useState, useRef, useEffect } from 'react';
import { User, PiggyBank, TrendingUp, Check, X, Clock, ArrowRight, Award, Rocket, CheckCircle, Umbrella, Plus, Share2, LogOut } from 'lucide-react';
import { WalletData, AchievementsData } from '../types';
import MedalDetailModal from '../components/MedalDetailModal';

const MOCK_WALLET_DATA: WalletData = {
  savingsHelp: 542.30,
  investmentHelp: 1289.00,
  dailyBudgetLeft: 30.00,
  dailySpending: [
    { day: 'S', status: 'success' },
    { day: 'T', status: 'failed' },
    { day: 'Q', status: 'failed' },
    { day: 'Q', status: 'success' },
    { day: 'S', status: 'success' },
    { day: 'S', status: 'today' },
    { day: 'D', status: 'pending' },
  ],
  monthlyInvestmentGoal: 500.00,
  monthlyInvestmentCurrent: 465.00,
  monthlyInvestmentProgress: 93,
  currentMonth: 'Janeiro',
};

const MOCK_ACHIEVEMENTS_DATA: AchievementsData = {
  medals: [
    { id: '1', icon: 'award', name: 'Mestre da Poupança', description: 'Parabéns! Você demonstrou disciplina exemplar ao manter uma poupança consistente e construir sua reserva financeira.' },
    { id: '2', icon: 'rocket', name: 'Investidor Pioneiro', description: 'Parabéns! Você realizou seu primeiro investimento e deu o primeiro passo na sua jornada para a independência financeira.' },
    { id: '3', icon: 'check-circle', name: 'Meta Concluída', description: 'Parabéns! Você alcançou sua primeira meta financeira, demonstrando foco e determinação.' },
  ],
  goals: [
    {
      id: '1',
      name: 'Viagem para a Praia',
      icon: 'umbrella',
      iconColor: 'text-teal-500',
      iconBgColor: 'bg-teal-100 dark:bg-teal-900',
      progress: 75,
      current: 750,
      target: 1000,
    },
    {
      id: '2',
      name: 'Reserva de Emergência',
      icon: 'umbrella',
      iconColor: 'text-emerald-500',
      iconBgColor: 'bg-emerald-100 dark:bg-emerald-900',
      progress: 50,
      current: 2500,
      target: 5000,
    },
  ],
};

const getIconComponent = (iconName: string, className?: string) => {
  const iconProps = { className: className || '', size: 24 };
  switch (iconName) {
    case 'award':
      return <Award {...iconProps} fill="currentColor" />;
    case 'rocket':
      return <Rocket {...iconProps} fill="currentColor" />;
    case 'check-circle':
      return <CheckCircle {...iconProps} fill="currentColor" />;
    case 'umbrella':
      return <Umbrella {...iconProps} />;
    default:
      return <Award {...iconProps} />;
  }
};

interface WalletScreenProps {
  activeTab: 'controle' | 'conquistas';
  onTabChange: (tab: 'controle' | 'conquistas') => void;
  onShowAllGoals: () => void;
  onShowAllMedals: () => void;
  onShowSpendingHistory: () => void;
  onShowInvestmentHistory: () => void;
  onShowDailySpendingHistory: () => void;
  onShowProfile: () => void;
  onCreateGoal?: () => void;
}

export default function WalletScreen({ activeTab, onTabChange, onShowAllGoals, onShowAllMedals, onShowSpendingHistory, onShowInvestmentHistory, onShowDailySpendingHistory, onShowProfile, onCreateGoal }: WalletScreenProps) {
  const [selectedMedal, setSelectedMedal] = useState<{ id: string; icon: string; name: string; description: string; earned?: boolean } | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProfileClick = () => {
    onShowProfile();
    setShowMenu(false);
  };

  const handleLogout = () => {
    console.log('Sair da aplicação');
    setShowMenu(false);
  };

  return (
    <div className="flex-1 overflow-y-auto pb-32">
      <div className="p-6 max-w-md mx-auto">
        <header className="flex justify-between items-center mb-6">
          <div className="bg-stone-200 dark:bg-stone-800 p-1 rounded-full flex-grow flex items-center">
            <button
              onClick={() => onTabChange('controle')}
              className={`py-2 px-6 rounded-full text-sm font-semibold w-1/2 transition-all ${
                activeTab === 'controle'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-sm'
                  : 'text-stone-500 dark:text-stone-400'
              }`}
            >
              Controle
            </button>
            <button
              onClick={() => onTabChange('conquistas')}
              className={`py-2 px-6 rounded-full text-sm font-medium w-1/2 transition-all ${
                activeTab === 'conquistas'
                  ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-sm'
                  : 'text-stone-500 dark:text-stone-400'
              }`}
            >
              Conquistas
            </button>
          </div>
          <div className="flex items-center space-x-4 text-stone-700 dark:text-stone-300 relative ml-4" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-2 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
            >
              <User className="w-6 h-6" />
            </button>

            {showMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-stone-900 rounded-xl shadow-lg border border-stone-200 dark:border-stone-800 overflow-hidden z-50">
                <button
                  onClick={handleProfileClick}
                  className="w-full px-4 py-3 text-left text-sm text-stone-900 dark:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex items-center gap-2"
                >
                  <User className="w-4 h-4" />
                  Meu perfil
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full px-4 py-3 text-left text-sm text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sair
                </button>
              </div>
            )}
          </div>
        </header>

        {activeTab === 'controle' ? (
          <main className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 dark:bg-emerald-950 p-4 rounded-3xl shadow-sm">
                <div className="flex items-center text-stone-500 dark:text-stone-400 mb-1">
                  <div className="bg-primary/10 text-primary p-1 rounded-lg mr-2">
                    <PiggyBank size={16} />
                  </div>
                  <span className="text-xs font-medium">Economia</span>
                </div>
                <p className="text-sm text-stone-700 dark:text-stone-200 leading-tight mb-2">
                 <b> Poupei com a  Odete </b> 
                </p>
                <p className="text-primary font-bold text-lg">
                  R$ {MOCK_WALLET_DATA.savingsHelp.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>

              <div className="bg-stone-100 dark:bg-stone-900 p-4 rounded-3xl shadow-sm">
                <div className="flex items-center text-stone-500 dark:text-stone-400 mb-1">
                  <div className="text-primary mr-2">
                    <TrendingUp size={16} />
                  </div>
                  <span className="text-xs font-medium">Investimentos</span>
                </div>
                <p className="text-sm text-stone-700 dark:text-stone-200 leading-tight mb-2">
                 <b>  Ganhei com a  Odete </b> 
                </p>
                <p className="text-primary font-bold text-lg">
                  R$ {MOCK_WALLET_DATA.investmentHelp.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-sm">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-stone-800 dark:text-white">
                  Meus Gastos
                </h2>
                <button
                  onClick={onShowDailySpendingHistory}
                  className="bg-stone-800 dark:bg-stone-700 text-white text-xs font-semibold py-2 px-4 rounded-full flex items-center hover:bg-stone-700 dark:hover:bg-stone-600 transition-colors"
                >
                  Ver todas
                  <ArrowRight size={14} className="ml-1" />
                </button>
              </div>
              <p className="text-stone-500 dark:text-stone-400 mb-6 text-sm">
                Você ainda pode gastar R${MOCK_WALLET_DATA.dailyBudgetLeft.toFixed(2)} hoje.
              </p>

              <div className="flex justify-between text-center text-stone-400 dark:text-stone-500 text-xs font-bold">
                {MOCK_WALLET_DATA.dailySpending.map((day, index) => (
                  <div key={index} className="flex flex-col items-center space-y-2">
                    <span>{day.day}</span>
                    {day.status === 'success' && (
                      <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center">
                        <Check size={16} className="text-white" />
                      </div>
                    )}
                    {day.status === 'failed' && (
                      <div className="w-8 h-8 rounded-full bg-yellow-400 flex items-center justify-center">
                        <X size={16} className="text-white" />
                      </div>
                    )}
                    {day.status === 'today' && (
                      <div className="flex flex-col items-center">
                        <div className="w-10 h-10 rounded-full bg-emerald-300 flex items-center justify-center ring-2 ring-emerald-400 dark:ring-emerald-500 ring-offset-2 ring-offset-white dark:ring-offset-stone-900"></div>
                        <span className="text-stone-800 dark:text-stone-200 text-[10px] font-semibold mt-1">
                          Hoje
                        </span>
                      </div>
                    )}
                    {day.status === 'pending' && (
                      <div className="w-8 h-8 rounded-full bg-stone-100 dark:bg-stone-800 flex items-center justify-center">
                        <Clock size={16} className="text-stone-400 dark:text-stone-500" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-stone-100 dark:bg-stone-900 p-6 rounded-3xl shadow-sm">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <h2 className="text-xl font-bold text-stone-800 dark:text-white">Investimento Mensal</h2>
                  <p className="text-stone-500 dark:text-stone-400 text-sm">
                    Invista R$ {MOCK_WALLET_DATA.monthlyInvestmentGoal.toFixed(2)}/ mês.
                  </p>
                </div>
                <button
                  onClick={onShowInvestmentHistory}
                  className="bg-stone-800 dark:bg-stone-700 text-white text-xs font-semibold py-2 px-4 rounded-full flex items-center -mt-1 ml-4 hover:bg-stone-700 dark:hover:bg-stone-600 transition-colors"
                >
                  Ver todas
                  <ArrowRight size={14} className="ml-1" />
                </button>
              </div>

              <div className="w-full bg-stone-200 dark:bg-stone-800 rounded-full h-2 mb-4">
                <div
                  className="bg-primary h-2 rounded-full transition-all"
                  style={{ width: `${MOCK_WALLET_DATA.monthlyInvestmentProgress}%` }}
                ></div>
              </div>

              <div className="flex justify-between items-center">
                <p className="text-stone-800 dark:text-stone-100 font-semibold text-sm">
                  {MOCK_WALLET_DATA.currentMonth}
                </p>
                <p className="text-primary font-semibold text-sm">
                  R$ {MOCK_WALLET_DATA.monthlyInvestmentCurrent.toFixed(2)} / R${' '}
                  {MOCK_WALLET_DATA.monthlyInvestmentGoal.toFixed(2)}
                </p>
              </div>
            </div>
          </main>
        ) : (
          <main className="space-y-8 relative pb-20">
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-stone-900 dark:text-white">Suas Medalhas</h2>
                <button
                  onClick={onShowAllMedals}
                  className="flex items-center gap-1 text-sm font-semibold bg-stone-800 dark:bg-stone-700 text-white py-2 px-4 rounded-full hover:bg-stone-700 dark:hover:bg-stone-600 transition-colors"
                >
                  Ver todas
                  <ArrowRight size={14} />
                </button>
              </div>
              <div className="flex overflow-x-auto space-x-4 pb-4 no-scrollbar">
                {MOCK_ACHIEVEMENTS_DATA.medals.map((medal) => (
                  <button
                    key={medal.id}
                    onClick={() => setSelectedMedal({ ...medal, earned: true })}
                    className="w-28 flex-shrink-0 bg-white dark:bg-stone-800 rounded-3xl p-4 flex flex-col items-center justify-center aspect-square shadow-sm relative"
                  >
                    <button className="absolute top-3 right-3 text-stone-500 dark:text-stone-400">
                      <Share2 size={14} />
                    </button>
                    <div className="text-yellow-400 mt-2">
                      {getIconComponent(medal.icon, 'w-8 h-8')}
                    </div>
                    <p className="text-xs mt-2 font-medium text-stone-700 dark:text-stone-300 leading-tight">
                      {medal.name}
                    </p>
                  </button>
                ))}
              </div>
            </section>

            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-stone-900 dark:text-white">Minhas Metas</h2>
                <button
                  onClick={onShowAllGoals}
                  className="flex items-center gap-1 text-sm font-semibold bg-stone-800 dark:bg-stone-700 text-white py-2 px-4 rounded-full hover:bg-stone-700 dark:hover:bg-stone-600 transition-colors"
                >
                  Ver todas
                  <ArrowRight size={14} />
                </button>
              </div>
              <div className="space-y-3">
                {MOCK_ACHIEVEMENTS_DATA.goals.map((goal) => (
                  <div key={goal.id} className="bg-white dark:bg-stone-800 rounded-2xl p-4 shadow-sm">
                    <div className="flex items-center">
                      <div className={`${goal.iconBgColor} p-3 rounded-full mr-4`}>
                        <div className={goal.iconColor}>
                          {getIconComponent(goal.icon)}
                        </div>
                      </div>
                      <div className="w-full">
                        <p className="font-semibold text-stone-900 dark:text-white">{goal.name}</p>
                        <div className="w-full bg-stone-200 dark:bg-stone-700 rounded-full h-2 mt-2">
                          <div
                            className="bg-teal-400 h-2 rounded-full transition-all"
                            style={{ width: `${goal.progress}%` }}
                          ></div>
                        </div>
                        <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 text-right">
                          R${goal.current.toFixed(2)}/R${goal.target.toFixed(2)}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {onCreateGoal && (
  <div className="absolute bottom-0 right-0 flex flex-col items-center gap-2 z-50"> 
  
    <span className="text-sm font-medium text-stone-700 dark:text-stone-300">Nova Meta</span>
    <button
      onClick={onCreateGoal}
      className="w-16 h-16 bg-stone-800 dark:bg-stone-700 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-stone-700 dark:hover:bg-stone-600 transition-colors"
    >
      <Plus size={32} strokeWidth={1.5} />
    </button>
  </div>
)}
          </main>
        )}
      </div>

      {selectedMedal && (
        <MedalDetailModal medal={selectedMedal} onClose={() => setSelectedMedal(null)} />
      )}
    </div>
  );
}
