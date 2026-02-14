import { useState, useEffect, useCallback } from 'react';
import { supabase } from './supabase';

export interface LoanDetail {
  monthly_payment: number;
  interest_rate: number;
  amortization_system?: string;
  paid_installments?: number;
  total_installments?: number;
  due_day?: number;
  installment_value?: number; // Override manual do usuário
}

export interface DebtAccount {
  id: string;
  name: string;
  balance: number;
  type: string;
  loan_details: LoanDetail | null;
  paid_this_month: boolean;
}

export interface FinancialFreedomData {
  totalDebt: number;
  payThisMonth: number;
  monthsToPay: number;
  freedomDate: string;
  debts: DebtAccount[];
}

// Calcula parcela mensal baseada no sistema de amortização
function calculateInstallment(
  outstandingBalance: number,
  monthlyRate: number,
  totalInstallments: number,
  paidInstallments: number,
  system: string
): number {
  const remaining = totalInstallments - paidInstallments;
  if (remaining <= 0 || outstandingBalance === 0) return 0;
  const balance = Math.abs(outstandingBalance);
  const rate = monthlyRate / 100;

  if (system === 'SAC') {
    // SAC: amortização constante, juros sobre saldo devedor
    const originalPrincipal = (balance * totalInstallments) / remaining;
    const amortization = originalPrincipal / totalInstallments;
    return amortization + balance * rate;
  }

  // PRICE (padrão): parcelas iguais
  if (rate === 0) return balance / remaining;
  const factor = Math.pow(1 + rate, remaining);
  return balance * (rate * factor) / (factor - 1);
}

// Inferir sistema de amortização quando null
function inferAmortizationSystem(accountName: string): string {
  const name = (accountName || '').toLowerCase();
  if (
    name.includes('imóvel') || name.includes('imovel') ||
    name.includes('habitacional') || name.includes('casa') ||
    name.includes('apartamento') || name.includes('hipoteca') ||
    name.includes('mortgage')
  ) {
    return 'SAC';
  }
  return 'PRICE';
}

export function useFinancialFreedom() {
  const [data, setData] = useState<FinancialFreedomData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDebts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Busca Contas com JOIN expandido na tabela de detalhes
      const { data: accounts, error: accError } = await supabase
        .from('accounts')
        .select(`
          id, name, balance, type,
          loan_details (
            installment_value,
            interest_rate,
            amortization_system,
            paid_installments,
            total_installments,
            due_day
          )
        `)
        .eq('user_id', user.id)
        .neq('type', 'credit_card')
        .lt('balance', 0);

      if (accError) throw accError;
      if (!accounts || accounts.length === 0) {
        setData(null);
        return;
      }

      // 2. Busca pagamentos do mês atual
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0, 0, 0, 0);
      const nextMonth = new Date(startOfMonth);
      nextMonth.setMonth(nextMonth.getMonth() + 1);

      const debtAccountIds = accounts.map(a => a.id);

      const { data: currentMonthPayments } = await supabase
        .from('transactions')
        .select('account_id, amount')
        .in('account_id', debtAccountIds)
        .eq('type', 'expense')
        .gte('date', startOfMonth.toISOString())
        .lt('date', nextMonth.toISOString());

      const paymentsMap: Record<string, number> = {};
      if (currentMonthPayments) {
        currentMonthPayments.forEach(t => {
          const val = Number(t.amount);
          if (!paymentsMap[t.account_id]) paymentsMap[t.account_id] = 0;
          paymentsMap[t.account_id] += val;
        });
      }

      // 3. Mapeamento e cálculos
      const debts = accounts.map(acc => {
        const details = Array.isArray(acc.loan_details) ? acc.loan_details[0] : acc.loan_details;
        const balance = Number(acc.balance);
        const interestRate = Number(details?.interest_rate) || 0;
        const totalInst = Number(details?.total_installments) || 0;
        const paidInst = Number(details?.paid_installments) || 0;
        const system = details?.amortization_system || inferAmortizationSystem(acc.name);

        // Cascata de parcela: override manual → cálculo → fallback
        let monthlyPayment: number;
        const manualOverride = Number(details?.installment_value);

        if (manualOverride > 0) {
          monthlyPayment = manualOverride;
        } else if (totalInst > 0 && interestRate >= 0) {
          monthlyPayment = calculateInstallment(balance, interestRate, totalInst, paidInst, system);
        } else {
          monthlyPayment = 0;
        }

        const totalPaidThisMonth = paymentsMap[acc.id] || 0;
        const isPaid = monthlyPayment > 0 && totalPaidThisMonth >= (monthlyPayment - 0.1);

        return {
          id: acc.id,
          name: acc.name,
          type: acc.type,
          balance,
          loan_details: {
            monthly_payment: monthlyPayment,
            interest_rate: interestRate,
            amortization_system: system,
            paid_installments: paidInst,
            total_installments: totalInst,
            due_day: Number(details?.due_day) || undefined,
            installment_value: manualOverride > 0 ? manualOverride : undefined,
          },
          paid_this_month: isPaid,
        };
      }) as DebtAccount[];

      // 4. Totais
      const totalDebt = debts.reduce((acc, curr) => acc + Math.abs(curr.balance), 0);
      const payThisMonth = debts
        .filter(d => !d.paid_this_month)
        .reduce((acc, d) => acc + (d.loan_details?.monthly_payment || 0), 0);

      // 5. Projeção de data de liberdade
      const totalMonthlyPayment = debts.reduce((acc, d) => acc + (d.loan_details?.monthly_payment || 0), 0);
      let remainingDebt = totalDebt;
      let months = 0;

      if (totalMonthlyPayment > 0) {
        while (remainingDebt > 0 && months < 360) {
          const avgRate = debts.reduce((sum, d) => {
            const weight = Math.abs(d.balance) / totalDebt;
            return sum + (d.loan_details?.interest_rate || 0) * weight;
          }, 0);
          const monthlyInterest = remainingDebt * (avgRate / 100);
          const amortization = totalMonthlyPayment - monthlyInterest;
          if (amortization > 0) {
            remainingDebt -= amortization;
          } else {
            remainingDebt -= totalDebt * 0.01;
          }
          months++;
        }
      }

      const freedomDateObj = new Date();
      freedomDateObj.setMonth(freedomDateObj.getMonth() + months);
      const monthNames = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];
      const freedomDate = `${monthNames[freedomDateObj.getMonth()]} ${freedomDateObj.getFullYear()}`;

      setData({
        totalDebt,
        payThisMonth,
        monthsToPay: months,
        freedomDate,
        debts,
      });
    } catch (err) {
      console.error('Erro ao buscar pendências:', err);
    } finally {
      setLoading(false);
    }
  };

  // Override manual: salvar parcela e/ou sistema de amortização
  const updateLoanOverride = useCallback(async (
    accountId: string,
    updates: { installment_value?: number; amortization_system?: string }
  ) => {
    const { error } = await supabase
      .from('loan_details')
      .update(updates)
      .eq('account_id', accountId);

    if (error) {
      console.error('Erro ao atualizar empréstimo:', error);
      return false;
    }
    await fetchDebts();
    return true;
  }, []);

  useEffect(() => {
    fetchDebts();
  }, []);

  return { data, loading, refetch: fetchDebts, updateLoanOverride };
}
