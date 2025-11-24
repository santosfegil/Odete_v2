import React, { useState } from 'react';
import { Header } from '../components/HeaderHomeScreen';
import { FinanceCard } from '../components/FinanceCard';
import { InvestmentCard } from '../components/InvestmentCard';
import { NextSteps } from '../components/NextSteps';
import { InvestmentData, NextStepTask } from '../types';



const INITIAL_TASKS: NextStepTask[] = [
  { id: '1', label: 'Conectar dados de bancos', completed: true },
  { id: '2', label: 'Definir orçamento', completed: false },
  { id: '3', label: 'Definir metas', completed: false },
  { id: '4', label: 'Adicionar patrimônio', completed: false },
];

const MOCK_INVESTMENT_DATA: InvestmentData = {
  totalEquity: 12540.50,
  equityGrowthPercent: 12.5,
  investments: 8320.00,
  emergencyReserve: 3000.00,
  checkingAccount: 1220.50,
  realEstate: 0.00,
  projectedEquity: 15890.00,
  projectionProgress: 65,
  currentMonth: 'Agosto',
};

interface HomeScreenProps {
  onShowProfile: () => void;
  onShowBudget: () => void;
}

export default function App({ onShowProfile, onShowBudget }: HomeScreenProps) {
  const [activeTab, setActiveTab] = useState<'gastos' | 'investimentos'>('gastos');
  const [tasks, setTasks] = useState<NextStepTask[]>(INITIAL_TASKS);

  const handleToggleTask = (id: string) => {
    setTasks((prev) =>
      prev.map((task) =>
        task.id === id ? { ...task, completed: !task.completed } : task
      )
    );
  };

  return (
    <div className="mx-auto mb-24 max-w-md min-h-screen flex flex-col bg-background-light dark:bg-background-dark transition-colors duration-500">
      <Header activeTab={activeTab} onTabChange={setActiveTab} onShowProfile={onShowProfile} />

      <main className="flex-grow px-4 pb-4 animate-in fade-in duration-500">
        {activeTab === 'gastos' ? (
          <>
            <FinanceCard onShowBudget={onShowBudget} />
          </>
        ) : (
          <InvestmentCard data={MOCK_INVESTMENT_DATA} />
        )}
      </main>

      {activeTab === 'gastos' && <NextSteps tasks={tasks} onToggleTask={handleToggleTask} />}
    </div>
  );
}