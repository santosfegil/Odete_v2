import React, { useState, useRef, useEffect } from 'react';
import { User, PiggyBank, TrendingUp, Check, X, Clock, ArrowRight, Award, Rocket, CheckCircle, Umbrella, Plus, Share2, LogOut, Link } from 'lucide-react';
import { WalletData } from '../types';
import MedalDetailModal from '../components/MedalDetailModal';
import { EditGoalModal } from '../components/EditGoalModal';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { ChallengeCard } from '../components/ChallengeCard';

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

const MOCK_CHALLENGE_DATA = {
  id: '1',
  category: 'delivery',
  title: 'Desafio de Gastos: Delivery',
  currentAmount: 27.50,
  targetAmount: 50.00,
  averageSpent: 85,
  savingTarget: 35,
  weekProgress: [
    { day: 'S', status: 'success' },
    { day: 'T', status: 'success' },
    { day: 'Q', status: 'today' }, // Hoje
    { day: 'Q', status: 'pending' },
    { day: 'S', status: 'pending' },
    { day: 'S', status: 'pending' },
    { day: 'D', status: 'pending' },
  ] as any // Cast rápido para evitar conflito com tipos estritos se não tiver atualizado tudo
};

const MOCK_MEDALS = [
  { id: '1', icon: 'award', name: 'Mestre da Poupança', description: 'Parabéns! Você demonstrou disciplina exemplar ao manter uma poupança consistente.' },
  { id: '2', icon: 'rocket', name: 'Investidor Pioneiro', description: 'Parabéns! Você realizou seu primeiro investimento.' },
  { id: '3', icon: 'check-circle', name: 'Meta Concluída', description: 'Parabéns! Você alcançou sua primeira meta financeira.' },
];

interface RealGoal {
  id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  progress: number;
  is_automated: boolean;
  linked_account_name?: string; 
}

interface InvestmentSummary {
  current_month_total: number;
  year_total: number;
  monthly_goal: number;
}

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
  const [selectedGoal, setSelectedGoal] = useState<RealGoal | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [goals, setGoals] = useState<RealGoal[]>([]);
  const [loadingGoals, setLoadingGoals] = useState(false);
  
  // State for real investment summary
  const [investmentSummary, setInvestmentSummary] = useState<InvestmentSummary | null>(null);

  const menuRef = useRef<HTMLDivElement>(null);
  const { signOut } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchGoals = async () => {
    if (goals.length === 0) setLoadingGoals(true);
    try {
      const { data, error } = await supabase.rpc('get_goals_with_progress');
      if (error) throw error;
      setGoals(data || []);
    } catch (err) {
      console.error('Erro ao buscar metas:', err);
    } finally {
      setLoadingGoals(false);
    }
  };

  const fetchInvestmentSummary = async () => {
    try {
      const { data, error } = await supabase.rpc('get_investment_summary', { year_input: new Date().getFullYear() });
      if (!error && data) {
        setInvestmentSummary(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (activeTab === 'conquistas') {
      fetchGoals();
    } else if (activeTab === 'controle') {
      fetchInvestmentSummary();
    }
  }, [activeTab]);

  const handleProfileClick = () => {
    onShowProfile();
    setShowMenu(false);
  };

  const handleLogout = async () => {
    setShowMenu(false);
    await signOut();
  };

  // Definindo variáveis de data e valores
  const now = new Date();
  const currentMonthName = now.toLocaleString('pt-BR', { month: 'long' });
  const capitalizedMonth = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);

  const currentInvested = investmentSummary?.current_month_total || 0;
  const monthlyGoal = investmentSummary?.monthly_goal || 500;
  const progressPercent = Math.min((currentInvested / monthlyGoal) * 100, 100);

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
            {/* CARDS SUPERIORES (ECONOMIA E INVESTIMENTOS) - RESTAURADOS */}
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-emerald-50 dark:bg-emerald-950 p-4 rounded-3xl shadow-sm">
                <div className="flex items-center text-stone-500 dark:text-stone-400 mb-1">
                  <div className="bg-primary/10 text-primary p-1 rounded-lg mr-2">
                    <PiggyBank size={16} />
                  </div>
                  <span className="text-xs font-medium">Economia</span>
                </div>
                <p className="text-sm text-stone-700 dark:text-stone-200 leading-tight mb-2">
                 <b> Poupei com a Odete </b> 
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
                 <b> Ganhei com a Odete </b> 
                </p>
                <p className="text-primary font-bold text-lg">
                  R$ {MOCK_WALLET_DATA.investmentHelp.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>

            {/* CARD MEUS GASTOS - RESTAURADO */}
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
            <ChallengeCard 
              data={MOCK_CHALLENGE_DATA}
              onViewAll={() => console.log('Ver todos desafios')}
              onEdit={() => console.log('Editar desafio')}
            />

          
            
          </main>
        ) : (
          <main className="space-y-8 relative pb-20">
            {/* Aba Conquistas (sem alterações) */}
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
                {MOCK_MEDALS.map((medal) => (
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
                {loadingGoals ? (
                  <div className="text-center py-8 text-stone-500">Carregando...</div>
                ) : goals.length === 0 ? (
                  <div className="p-4 bg-white dark:bg-stone-800 rounded-2xl text-center text-stone-500 text-sm">
                    Nenhuma meta criada ainda.
                  </div>
                ) : (
                  goals.slice(0, 2).map((goal) => (
                    <button 
                      key={goal.id} 
                      onClick={() => setSelectedGoal(goal)}
                      className="w-full text-left bg-white dark:bg-stone-800 rounded-2xl p-4 shadow-sm border border-stone-100 dark:border-stone-700 transition-transform active:scale-[0.98] hover:border-emerald-500/30"
                    >
                      <div className="flex items-center">
                        <div className="bg-emerald-100 dark:bg-emerald-900/30 p-3 rounded-full mr-4 text-emerald-600 dark:text-emerald-400">
                          <Umbrella size={24} />
                        </div>
                        <div className="w-full">
                          <div className="flex justify-between items-start">
                            <p className="font-bold text-stone-900 dark:text-white text-sm">{goal.title}</p>
                            {goal.is_automated && (
                              <span className="text-[9px] bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                                <Link size={8} />
                                AUTO
                              </span>
                            )}
                          </div>
                          <div className="w-full bg-stone-100 dark:bg-stone-700 rounded-full h-2 mt-2 overflow-hidden">
                            <div
                              className="bg-emerald-400 h-2 rounded-full transition-all duration-1000 ease-out"
                              style={{ width: `${Math.min(goal.progress, 100)}%` }}
                            ></div>
                          </div>
                          <p className="text-xs text-stone-500 dark:text-stone-400 mt-1 text-right font-medium">
                            R${goal.current_amount.toLocaleString('pt-BR', {maximumFractionDigits: 0})}/
                            R${goal.target_amount.toLocaleString('pt-BR', {maximumFractionDigits: 0})}
                          </p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            </section>

            {onCreateGoal && (
              <div className="absolute bottom-0 right-0 flex flex-col items-center gap-2 z-50"> 
                <span className="text-sm font-medium text-stone-700 dark:text-stone-300 bg-white/80 dark:bg-black/50 px-2 py-1 rounded-lg backdrop-blur-sm">
                  Nova Meta
                </span>
                <button
                  onClick={onCreateGoal}
                  className="w-16 h-16 bg-stone-800 dark:bg-stone-700 text-white rounded-full flex items-center justify-center shadow-lg hover:bg-stone-700 dark:hover:bg-stone-600 transition-colors hover:scale-105 transform duration-200"
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

      {selectedGoal && (
        <EditGoalModal 
          goal={selectedGoal} 
          onClose={() => setSelectedGoal(null)} 
          onSuccess={() => {
            fetchGoals(); 
          }}
        />
      )}
    </div>
  );
}