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

export interface Achievement {
  id: string;
  title: string;
  description: string;
  category: 'saver' | 'investor' | 'goals';
  icon_slug: string;
}

export interface Medal extends Achievement {
  earned: boolean;
  earned_at?: string;
}

// Loan types are now exported from src/lib/useFinancialFreedom.ts
// Re-export for backwards compatibility
export type { LoanDetail, DebtAccount, FinancialFreedomData } from './lib/useFinancialFreedom';

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
  description?: string;
  categoryName?: string;
  currentAmount: number;
  targetAmount: number;
  averageSpent: number;
  savingTarget: number;
  weekProgress: {
    day: string;
    date?: string;
    status: 'success' | 'failed' | 'pending' | 'today';
  }[];
}

export interface Message {
  id: string;
  session_id?: string; // Agora vinculado a uma sessão
  role: 'user' | 'model' | 'system';
  content: string;
  type?: 'text' | 'audio' | 'image';
  timestamp: Date;
  metadata?: any; 
}

export enum OdeteMode {
  MIMAR = 'mimar',
  JULGAR = 'julgar'
}

export interface ChatSession {
  id: string;
  user_id: string;
  title: string;
  mode: OdeteMode;
  preview: string;
  created_at: string;
  updated_at: string;
}

export interface SystemPrompts {
  mimar: string;
  julgar: string;
}

export interface ToolDefinition {
  name: string;
  description: string;
  parameters: any;
}

// Function calling interface mock
export interface DatabaseTool {
  name: string;
  execute: (args: any) => Promise<string>;
}