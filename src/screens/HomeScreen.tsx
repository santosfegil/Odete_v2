import React, { useState, useEffect } from 'react';
import { Header } from '../components/HeaderHomeScreen';
import { FinanceCard } from '../components/FinanceCard';
import { InvestmentCard } from '../components/InvestmentCard';
import { MonthlyInvestmentCard } from '../components/MonthlyInvestmentCard'; // Importando o novo componente
import { EditPatrimonyModal } from '../components/EditPatrimonyModal';
import { InvestmentData } from '../types';
import { supabase } from '../lib/supabase';
import SpendingHistoryScreen from './SpendingHistoryScreen'; // Importando para navegação

interface HomeScreenProps {
  onShowProfile: () => void;
  onShowBudget: () => void;
}

export default function HomeScreen({ onShowProfile, onShowBudget }: HomeScreenProps) {
  const [activeTab, setActiveTab] = useState<'gastos' | 'investimentos'>('gastos');
  const [showEditModal, setShowEditModal] = useState(false);
  
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
          if (acc.name === 'Meus Investimentos' && acc.type === 'investment') totalInv += acc.balance;
          else if (acc.name === 'Reserva de Emergência' && acc.type === 'investment') totalEmerg += acc.balance;
          else if (acc.type === 'bank' || acc.type === 'wallet') totalChecking += acc.balance;
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
    <div className="mx-auto mb-24 max-w-md min-h-screen flex flex-col bg-background-light dark:bg-background-dark transition-colors duration-500">
      <Header activeTab={activeTab} onTabChange={setActiveTab} onShowProfile={onShowProfile} />

      <main className="flex-grow px-4 pb-4 animate-in fade-in duration-500">
        {activeTab === 'gastos' ? (
          <>
          
          <FinanceCard onShowBudget={onShowBudget} />
    {/* Aplica uma margem superior (marginTop) ao InvestmentCard */}
    <div style={{ marginTop: '20px' }}> 
      <InvestmentCard
        data={investmentData}
        onEdit={() => setShowEditModal(true)}
      />
    </div>
  </>
        ) : (
          <div className="space-y-6">
            {/* 1. Card de Patrimônio (Verde Escuro) */}
            

            {/* 2. Card de Investimento Mensal (Verde Claro) - Novo Componente */}
            <MonthlyInvestmentCard 
              currentInvested={monthlyInvestmentData.current}
              monthlyGoal={monthlyInvestmentData.goal}
              monthName={capitalizedMonth}
              onShowHistory={() => setShowInvestmentHistory(true)}
            />
          </div>
        )}
      </main>

      {showEditModal && (
        <EditPatrimonyModal 
          onClose={() => setShowEditModal(false)} 
          onSuccess={() => {
            fetchPatrimony();
          }}
        />
      )}
    </div>
  );
}