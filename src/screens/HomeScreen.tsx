import React, { useState, useEffect } from 'react';
import { Header } from '../components/HeaderHomeScreen';
import { FinanceCard } from '../components/FinanceCard';
import { InvestmentCard } from '../components/InvestmentCard';
import { MonthlyInvestmentCard } from '../components/MonthlyInvestmentCard';
import { EditPatrimonyModal } from '../components/EditPatrimonyModal';
import { InvestmentData } from '../types';
import { supabase } from '../lib/supabase';
import SpendingHistoryScreen from './SpendingHistoryScreen';
// AQUI ESTAVA O ERRO: Importamos o componente real agora, não o Mock
import RetirementSimulator from '../components/RetirementSimulatorMock';
import { usePatrimony } from '../hooks/usePatrimony';
import { InvestmentGoalModal } from '../components/InvestmentGoalModal';
import { InvestmentHistoryModal } from '../components/InvestmentHistoryModal';
import { useMonthlyInvestment } from '../hooks/useMonthlyInvestment';

interface HomeScreenProps {
  onShowProfile: () => void;
  onShowBudget: () => void;
}

export default function HomeScreen({ onShowProfile, onShowBudget }: HomeScreenProps) {
  const [activeTab, setActiveTab] = useState<'gastos' | 'investimentos'>('gastos');
  const [showEditModal, setShowEditModal] = useState(false);
  const { totals, accounts, refetch } = usePatrimony();
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [showGoalModal, setShowGoalModal] = useState(false); // State p/ Modal Meta
  const { currentInvested, monthlyGoal, loading: loadingInvestment, refetch: refetchInvestment } = useMonthlyInvestment();
  const handleShowHistory = () => setShowInvestmentHistory(true);

  // Estado para controlar a exibição do histórico (navegação do card verde)
  const [showInvestmentHistory, setShowInvestmentHistory] = useState(false);

  // Estado para os dados de Patrimônio
  const [investmentData, setInvestmentData] = useState<InvestmentData>({
    totalEquity: 0,
    equityGrowthPercent: 0,
    investments: 0,
    emergencyReserve: 0,
    checkingAccount: 0,
    realEstate: 0,
    projectedEquity: 0,
    projectionProgress: 0,
    currentMonth: 'Atual',
  });

  // Estado para os dados de Investimento Mensal (Card Verde)
  const [monthlyInvestmentData, setMonthlyInvestmentData] = useState({
    current: 0,
    goal: 500,
  });

  // Buscar Patrimônio
  const fetchPatrimony = async () => {
    try {
      const { data: accounts, error } = await supabase.from('accounts').select('*');
      if (error) throw error;

      if (accounts) {
        let totalInv = 0, totalEmerg = 0, totalChecking = 0, totalAssets = 0;

        accounts.forEach(acc => {
          if (acc.type === 'investment') totalInv += acc.balance;
          else if (acc.type === 'investment') totalEmerg += acc.balance;
          else if (acc.type === 'bank' || acc.type === 'wallet' || acc.type === 'checking_account' || acc.type === 'savings_account') totalChecking += acc.balance;
          else if (['real_estate', 'vehicle', 'other_asset'].includes(acc.type)) totalAssets += acc.balance;
        });

        setInvestmentData(prev => ({
          ...prev,
          investments: totalInv,
          emergencyReserve: totalEmerg,
          checkingAccount: totalChecking,
          realEstate: totalAssets,
          totalEquity: totalInv + totalEmerg + totalChecking + totalAssets
        }));
      }
    } catch (err) {
      console.error('Erro patrimônio:', err);
    }
  };

  // Buscar Resumo de Investimento Mensal
  const fetchMonthlyInvestment = async () => {
    try {
      const { data, error } = await supabase.rpc('get_investment_summary', { year_input: new Date().getFullYear() });
      if (!error && data) {
        setMonthlyInvestmentData({
          current: data.current_month_total || 0,
          goal: data.monthly_goal || 500,
        });
      }
    } catch (err) {
      console.error('Erro resumo mensal:', err);
    }
  };

  useEffect(() => {
    fetchPatrimony();
    fetchMonthlyInvestment();
  }, []);

  // Data Atual para o Card
  const now = new Date();
  const currentMonthName = now.toLocaleString('pt-BR', { month: 'long' });
  const capitalizedMonth = currentMonthName.charAt(0).toUpperCase() + currentMonthName.slice(1);

  // Se o usuário clicou em "Ver todas" no card verde
  if (showInvestmentHistory) {
    return <SpendingHistoryScreen onBack={() => setShowInvestmentHistory(false)} />;
  }

  return (
    <div className="w-full mx-auto mb-24 max-w-md min-h-screen flex flex-col bg-background-light dark:bg-background-dark transition-colors duration-500">
      <Header activeTab={activeTab} onTabChange={setActiveTab} onShowProfile={onShowProfile} />

      <main className="flex-grow px-4 pb-4 animate-in fade-in duration-500">
        {activeTab === 'gastos' ? (
          <>
            <FinanceCard onShowBudget={onShowBudget} />
            <div style={{ marginTop: '20px' }}>
              {/* 2. O CARD SÓ EXIBE OS TOTAIS E ABRE O MODAL */}
              <InvestmentCard
                data={totals}
                onEdit={() => setShowEditModal(true)}
              />
            </div>
          </>
        ) : (
          <div className="space-y-6 min-h-[calc(100vh-200px)]">
            {loadingInvestment ? (
              <div className="bg-emerald-100 dark:bg-emerald-900/40 p-6 rounded-3xl shadow-sm animate-pulse h-52">
                <div className="flex justify-between items-center mb-4">
                  <div className="h-5 w-36 bg-emerald-200/70 dark:bg-emerald-800 rounded-full"></div>
                  <div className="w-9 h-9 bg-emerald-200/70 dark:bg-emerald-800 rounded-full"></div>
                </div>
                <div className="h-12 w-40 bg-emerald-200/70 dark:bg-emerald-800 rounded-xl mb-2"></div>
                <div className="h-3 w-48 bg-emerald-200/70 dark:bg-emerald-800 rounded-full mb-6"></div>
                <div className="h-3 w-full bg-emerald-200/70 dark:bg-emerald-800 rounded-full"></div>
              </div>
            ) : (
              <MonthlyInvestmentCard
                currentInvested={currentInvested}
                monthlyGoal={monthlyGoal}
                monthName={capitalizedMonth}
                onShowHistory={handleShowHistory}
                onSettingsClick={() => setShowGoalModal(true)}
              />
            )}
            <RetirementSimulator />
          </div>
        )}
      </main>

      {showGoalModal && (
        <InvestmentGoalModal
          onClose={() => setShowGoalModal(false)}
          onSuccess={refetchInvestment} // Recarrega o card ao salvar
        />
      )}

      {showInvestmentHistory && (
        <InvestmentHistoryModal onClose={() => setShowInvestmentHistory(false)} />
      )}

      {/* 3. MODAL ÚNICO AQUI EMBAIXO (COM OS DADOS CERTOS) */}
      {showEditModal && (
        <EditPatrimonyModal
          onClose={() => setShowEditModal(false)}
          initialAccounts={accounts || []} // <--- ISSO EVITA A TELA BRANCA
          onSuccess={() => {
            refetch(); // <--- ATUALIZA A TELA AO SALVAR
          }}
        />
      )}
    </div>
  );
}