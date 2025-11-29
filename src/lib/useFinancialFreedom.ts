import { useState, useEffect } from 'react';
import { supabase } from './supabase';
import { DebtAccount, FinancialFreedomData } from '../types';

export function useFinancialFreedom() {
  const [data, setData] = useState<FinancialFreedomData | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchDebts = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // 1. Busca Contas com JOIN na tabela de detalhes (loan_details)
      const { data: accounts, error: accError } = await supabase
        .from('accounts')
        .select(`
          id, 
          name, 
          balance, 
          type, 
          loan_details (
            monthly_payment,
            interest_rate,
            amortization_system
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

      // 2. Busca Transações do Mês Atual (Para o status de pagamento)
      const startOfMonth = new Date();
      startOfMonth.setDate(1);
      startOfMonth.setHours(0,0,0,0);
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

      // 3. Mapeamento e Cálculos
      const debts = accounts.map(acc => {
        // Supabase retorna arrays em joins 1:N, mas tratamos como objeto seguro
        const details = Array.isArray(acc.loan_details) ? acc.loan_details[0] : acc.loan_details;
        
        const balance = Number(acc.balance);
        // Se não tiver detalhe, assume o saldo total como parcela (fallback)
        const monthlyPayment = Number(details?.monthly_payment) || Math.abs(balance);
        const interestRate = Number(details?.interest_rate) || 0;
        
        const totalPaidThisMonth = paymentsMap[acc.id] || 0;
        // Consideramos pago se o valor atingiu a parcela prevista (-R$0.10 de tolerância)
        const isPaid = totalPaidThisMonth >= (monthlyPayment - 0.1);

        return {
          id: acc.id,
          name: acc.name,
          type: acc.type,
          balance: balance,
          loan_details: {
            monthly_payment: monthlyPayment,
            interest_rate: interestRate,
            amortization_system: details?.amortization_system
          },
          paid_this_month: isPaid
        };
      }) as DebtAccount[];

      // 4. Totais e Projeções
      const totalDebt = debts.reduce((acc, curr) => acc + Math.abs(curr.balance), 0);

      // Juros Evitados (Histórico)
      const { data: allHistory } = await supabase
        .from('transactions')
        .select('amount, account_id')
        .in('account_id', debtAccountIds)
        .eq('type', 'expense')
        .eq('status', 'paid');

      let savedInterest = 0;
      if (allHistory) {
        allHistory.forEach(t => {
          const account = debts.find(d => d.id === t.account_id);
          const rate = account?.loan_details?.interest_rate || 0;
          if (rate > 0) {
            savedInterest += t.amount * (rate / 100) * 6;
          }
        });
      }

      // Projeção de Data (Amortização Simplificada)
      const monthlyPaymentCapacity = totalDebt * 0.03; 
      let remainingDebt = totalDebt;
      let months = 0;

      while (remainingDebt > 0 && months < 360) { 
        const maxRate = Math.max(...debts.map(d => d.loan_details?.interest_rate || 0)); 
        const monthlyInterest = remainingDebt * (maxRate / 100);
        if (monthlyPaymentCapacity > monthlyInterest) {
             remainingDebt = remainingDebt + monthlyInterest - monthlyPaymentCapacity;
        } else {
             remainingDebt -= (totalDebt * 0.01); 
        }
        months++;
      }

      const freedomDateObj = new Date();
      freedomDateObj.setMonth(freedomDateObj.getMonth() + months);
      
      const monthNames = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
      const freedomDate = `${monthNames[freedomDateObj.getMonth()]} ${freedomDateObj.getFullYear()}`;

      setData({
        totalDebt,
        monthsToPay: months,
        freedomDate,
        savedInterest,
        debts
      });

    } catch (err) {
      console.error("Erro ao buscar pendências:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDebts();
  }, []);

  return { data, loading, refetch: fetchDebts };
}