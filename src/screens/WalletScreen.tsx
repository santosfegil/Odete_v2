import React, { useState, useRef, useEffect } from 'react';
import { User, Award, ArrowRight, Share2, LogOut, Link, Umbrella, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';


// Componentes
import MedalDetailModal from '../components/MedalDetailModal';
import { EditGoalModal } from '../components/EditGoalModal';
import { ChallengeCard } from '../components/ChallengeCard';
import FinancialFreedomSection from '../components/FinancialFreedomSection';

// Hooks & Libs
import { useAchievements } from '../lib/useAchievements';
import { useWeeklyChallenge } from '../lib/useWeeklyChallenge'; // <--- Hook do Desafio
import { getIconComponent } from '../lib/iconMap';

// Interfaces locais...
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

export default function WalletScreen({ activeTab, onTabChange, onShowAllGoals, onShowAllMedals, onShowProfile, onCreateGoal }: WalletScreenProps) {
  const [selectedMedal, setSelectedMedal] = useState<any>(null);
  const [selectedGoal, setSelectedGoal] = useState<RealGoal | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [goals, setGoals] = useState<RealGoal[]>([]);
  const [loadingGoals, setLoadingGoals] = useState(false);
  const [investmentSummary, setInvestmentSummary] = useState<InvestmentSummary | null>(null);

  // Hooks
  const { earnedMedals, loading: loadingMedals } = useAchievements();
  const { challenge, loading: loadingChallenge } = useWeeklyChallenge(); // <--- Hook conectado

  const menuRef = useRef<HTMLDivElement>(null);
  const { signOut } = useAuth();

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setShowMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch functions...
  const fetchGoals = async () => {
    if (goals.length === 0) setLoadingGoals(true);
    try {
      const { data, error } = await supabase.rpc('get_goals_with_progress');
      if (error) throw error;
      setGoals(data || []);
    } catch (err) { console.error(err); } 
    finally { setLoadingGoals(false); }
  };

  const fetchInvestmentSummary = async () => {
    const { data } = await supabase.rpc('get_investment_summary', { year_input: new Date().getFullYear() });
    if (data) setInvestmentSummary(data);
  };

  useEffect(() => {
    if (activeTab === 'conquistas') fetchGoals();
    else if (activeTab === 'controle') fetchInvestmentSummary();
  }, [activeTab]);

  const handleLogout = async () => { setShowMenu(false); await signOut(); };

  return (
    <div className="flex-1 overflow-y-auto pb-32">
      <div className="p-6 max-w-md mx-auto">
        <header className="flex justify-between items-center mb-6">
          <div className="bg-stone-200 dark:bg-stone-800 p-1 rounded-full flex-grow flex items-center">
            <button onClick={() => onTabChange('controle')} className={`py-2 px-6 rounded-full text-sm font-semibold w-1/2 transition-all ${activeTab === 'controle' ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-sm' : 'text-stone-500 dark:text-stone-400'}`}>Controle</button>
            <button onClick={() => onTabChange('conquistas')} className={`py-2 px-6 rounded-full text-sm font-medium w-1/2 transition-all ${activeTab === 'conquistas' ? 'bg-white dark:bg-stone-900 text-stone-900 dark:text-white shadow-sm' : 'text-stone-500 dark:text-stone-400'}`}>Conquistas</button>
          </div>
          <div className="flex items-center space-x-4 text-stone-700 dark:text-stone-300 relative ml-4" ref={menuRef}>
            <button onClick={() => setShowMenu(!showMenu)} className="p-2 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"><User className="w-6 h-6" /></button>
            {showMenu && (
              <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-stone-900 rounded-xl shadow-lg border border-stone-200 dark:border-stone-800 overflow-hidden z-50">
                <button onClick={onShowProfile} className="w-full px-4 py-3 text-left text-sm hover:bg-stone-100 flex items-center gap-2"><User className="w-4 h-4" /> Meu perfil</button>
                <button onClick={handleLogout} className="w-full px-4 py-3 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"><LogOut className="w-4 h-4" /> Sair</button>
              </div>
            )}
          </div>
        </header>

        {activeTab === 'controle' ? (
          <main className="space-y-6">
            {/* CARD DE DESAFIO (Real) */}
            {loadingChallenge ? (
              <div className="h-64 bg-stone-100 dark:bg-stone-800 rounded-3xl animate-pulse flex items-center justify-center text-stone-400 text-sm">Carregando desafio...</div>
            ) : challenge ? (
              <ChallengeCard 
                data={challenge}
                onEdit={() => console.log('Configurações do desafio')}
              />
            ) : (
              <div className="p-6 bg-white dark:bg-stone-900 rounded-3xl text-center border border-stone-100 border-dashed">
                <p className="text-stone-500 text-sm">Nenhum desafio ativo.</p>
                <button className="mt-2 text-emerald-600 font-bold text-sm">Criar desafio</button>
              </div>
            )}

            <FinancialFreedomSection />
          </main>
        ) : (
          <main className="space-y-8 relative pb-20">
            {/* Seção Medalhas */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-stone-900 dark:text-white">Minhas medalhas</h2>
                <button onClick={onShowAllMedals} className="flex items-center gap-1 text-sm font-semibold bg-stone-800 dark:bg-stone-700 text-white py-2 px-4 rounded-full">Ver todas <ArrowRight size={14} /></button>
              </div>
              <div className="flex overflow-x-auto space-x-4 pb-4 no-scrollbar">
                {loadingMedals ? <div className="pl-2 text-stone-500 text-sm py-4">Carregando...</div> : earnedMedals.length === 0 ? <div className="p-4 bg-white dark:bg-stone-800 rounded-2xl w-full text-center"><Award size={32} className="mx-auto mb-2 text-stone-300"/><p className="text-stone-500 text-sm">Nenhuma medalha ainda.</p></div> : earnedMedals.map((medal) => (
                  <button key={medal.id} onClick={() => setSelectedMedal(medal)} className="w-28 flex-shrink-0 bg-white dark:bg-stone-800 rounded-3xl p-4 flex flex-col items-center justify-center aspect-square shadow-sm relative active:scale-95 transition-transform">
                    <button className="absolute top-3 right-3 text-stone-500 dark:text-stone-400"><Share2 size={14} /></button>
                    <div className="text-yellow-400 mt-2">{getIconComponent(medal.icon_slug, 'w-8 h-8')}</div>
                    <p className="text-xs mt-2 font-medium text-stone-700 dark:text-stone-300 leading-tight text-center line-clamp-2">{medal.title}</p>
                  </button>
                ))}
              </div>
            </section>

            {/* Seção Metas */}
            <section>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-stone-900 dark:text-white">Minhas metas</h2>
                <button onClick={onShowAllGoals} className="flex items-center gap-1 text-sm font-semibold bg-stone-800 text-white py-2 px-4 rounded-full">Ver todas <ArrowRight size={14} /></button>
              </div>
              <div className="space-y-3">
              {goals.slice(0, 2).map((goal) => (
                  <button key={goal.id} onClick={() => setSelectedGoal(goal)} className="w-full text-left bg-[#F2F7FF] dark:bg-stone-800 rounded-2xl p-4 shadow-sm border border-stone-100 dark:border-stone-700 transition-transform active:scale-[0.98]">
                    <div className="flex flex-col gap-2">
                      <div className="flex justify-between items-start">
                        <p className="font-bold text-stone-900 dark:text-white text-sm">{goal.title}</p>
                        {goal.is_automated && <span className="text-[9px] bg-white/50 dark:bg-black/20 text-emerald-600 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5"><Link size={8}/> AUTO</span>}
                      </div>
                      
                      <div className="w-full bg-white dark:bg-stone-700 rounded-full h-2 overflow-hidden">
                        <div className="bg-emerald-400 h-2 rounded-full" style={{ width: `${Math.min(goal.progress, 100)}%` }}></div>
                      </div>
                      
                      <p className="text-xs text-right mt-0.5">
                        <span className="text-stone-500 dark:text-stone-400">
                          R${goal.current_amount.toLocaleString('pt-BR',{maximumFractionDigits:0})} / <span className="text-stone-900 dark:text-white font-bold">R${goal.target_amount.toLocaleString('pt-BR',{maximumFractionDigits:0})}</span>
                        </span>
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </section>
            
            {onCreateGoal && ( 
            <div className="absolute bottom-4 right-4 z-50 flex flex-col items-center">
            <span className="text-[10px] font-bold text-stone-500 mb-1 bg-white/80 dark:bg-stone-800/80 px-2 py-0.5 rounded shadow-sm backdrop-blur-sm">
              Nova Meta
            </span>
            <button onClick={onCreateGoal} className="w-12 h-12 bg-stone-900 dark:bg-emerald-600 text-white rounded-full flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
              <Plus size={24} />
            </button>
          </div>
          )}
             </main>
        )}
      </div>
      {selectedMedal && <MedalDetailModal medal={selectedMedal} onClose={() => setSelectedMedal(null)} />}
      {selectedGoal && <EditGoalModal goal={selectedGoal} onClose={() => setSelectedGoal(null)} onSuccess={fetchGoals} />}
    </div>
  );
}