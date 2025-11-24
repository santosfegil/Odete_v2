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

export interface Medal {
  id: string;
  icon: string;
  name: string;
  description: string;
  earned?: boolean;
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
