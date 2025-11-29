export interface Bill {
  id: string;
  name: string;
  dueDate: string;
  amount: number;
}

export interface ChatMessage {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
}

export interface Transaction {
  id: string;
  type: 'expense' | 'income' | 'investment';
  amount: number;
  label: string;
}

export interface FinanceData {
  month: string;
  year: number;
  savedAmount: number;
  totalSpent: number;
  totalBudget: number;
  daysLeft: number;
  received: number;
  invested: number;
}

export interface NextStepTask {
  id: string;
  label: string;
  completed: boolean;
}

export interface InvestmentData {
  totalEquity: number;
  equityGrowthPercent: number;
  investments: number;
  emergencyReserve: number;
  checkingAccount: number;
  realEstate: number;
  projectedEquity: number;
  projectionProgress: number;
  currentMonth: string;
}

export interface DailySpending {
  day: string;
  status: 'success' | 'failed' | 'pending' | 'today';
}

export interface WalletData {
  savingsHelp: number;
  investmentHelp: number;
  dailyBudgetLeft: number;
  dailySpending: DailySpending[];
  monthlyInvestmentGoal: number;
  monthlyInvestmentCurrent: number;
  monthlyInvestmentProgress: number;
  currentMonth: string;
}

// Adicione ou substitua estas definições
export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'saver' | 'investor' | 'goals';
  icon_slug: string;
}

// Interface combinada para o Frontend (Dados + Estado de Conquista)
export interface Medal extends Achievement {
  earned: boolean;
  earned_at?: string;
}

export interface Medal {

  id: string;

  icon: string;

  name: string;

  description: string;

  earned?: boolean;

}

// src/types.ts

// Interface para a tabela satélite
export interface LoanDetail {
  monthly_payment: number;
  interest_rate: number;
  amortization_system?: string;
}

// A DebtAccount agora compõe Account + LoanDetail
export interface DebtAccount {
  id: string;
  name: string;
  balance: number;
  type: string;
  // Dados do contrato (1:1)
  loan_details: LoanDetail | null; 
  // Estado calculado em tempo de execução
  paid_this_month: boolean;
}

export interface FinancialFreedomData {
  totalDebt: number;
  monthsToPay: number;
  freedomDate: string;
  savedInterest: number;
  debts: DebtAccount[];
}

// ... mantenha o restante do arquivo

export interface DebtAccount {
  id: string;
  name: string;
  balance: number;
  type: string;
  interest_rate: number;
  paid_this_month: boolean; // Novo campo
}

export interface FinancialFreedomData {
  totalDebt: number;
  monthsToPay: number;
  freedomDate: string;
  savedInterest: number;
  debts: DebtAccount[];
}

export interface Goal {
  id: string;
  name: string;
  icon: string;
  iconColor: string;
  iconBgColor: string;
  progress: number;
  current: number;
  target: number;
  completed?: boolean;
}

export interface AchievementsData {
  medals: Medal[];
  goals: Goal[];
}

export type ChatMode = 'mimar' | 'julgar';

export type Screen = 'home' | 'chat' | 'wallet';

export interface BudgetCategory {
  id: string;
  name: string;
  icon: string;
  budget: number;
  spent: number;
  remaining: number;
}


//Home dashboardBudget
export interface DashboardData {
  budget: number;
  spent: number;
  owed: number;
  invested: number;
  income: number;
  saved: number;
}
export interface WeeklyChallenge {
  id: string;
  category: string;
  title: string;
  currentAmount: number;
  targetAmount: number;
  averageSpent: number;
  savingTarget: number;
  weekProgress: {
    day: string;
    status: 'success' | 'failed' | 'pending' | 'today';
  }[];
}