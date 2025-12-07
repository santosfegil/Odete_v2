import { useState, useCallback, useEffect } from 'react';
import { supabase } from '../lib/supabase';

// 1. Definição da Interface (Agora inclui os campos do Open Finance)
export interface AccountItem {
  id: string;
  name: string;
  amount: number;
  type: string;
  external_id?: string;             // Necessário para não sobrescrever
  account_creation_type?: string;   // Necessário para o Read Only
}

export interface PatrimonyTotals {
  investments: number;
  checkingAccount: number;
  realEstate: number;
  totalEquity: number;
}

export const usePatrimony = () => {
  // Estado de carregamento e dados
  const [loading, setLoading] = useState(true);
  const [accounts, setAccounts] = useState<AccountItem[]>([]);
  const [totals, setTotals] = useState<PatrimonyTotals>({
    investments: 0,
    checkingAccount: 0,
    realEstate: 0,
    totalEquity: 0,
  });

  const fetchPatrimony = useCallback(async () => {
    try {
      setLoading(true);
      
      // Busca TODAS as colunas do banco
      const { data, error } = await supabase.from('accounts').select('*');
      
      if (error) throw error;

      if (data) {
        // 2. MAPEAMENTO CORRETO DOS DADOS
        // Aqui estava o erro: antes não repassávamos account_creation_type nem external_id
        const formattedList: AccountItem[] = data.map((acc: any) => ({
          id: acc.id,
          name: acc.name,
          amount: Number(acc.balance),
          type: acc.type,
          external_id: acc.external_id,                       // <--- RECUPERA O ID ORIGINAL
          account_creation_type: acc.account_creation_type    // <--- RECUPERA O TIPO (AUTOMATIC/MANUAL)
        }));

        setAccounts(formattedList);

        // 3. Cálculo dos Totais
        let totalInv = 0;
        let totalChecking = 0;
        let totalAssets = 0;

        formattedList.forEach(acc => {
          const val = acc.amount || 0;
          
          if (acc.type === 'investment') {
            totalInv += val;
          } else if (['bank', 'wallet', 'checking_account', 'savings_account'].includes(acc.type)) {
            totalChecking += val;
          } else if (['real_estate', 'vehicle', 'other_asset'].includes(acc.type)) {
            totalAssets += val;
          }
        });

        setTotals({
          investments: totalInv,
          checkingAccount: totalChecking,
          realEstate: totalAssets,
          totalEquity: totalInv + totalChecking + totalAssets
        });
      }
    } catch (err) {
      console.error('Erro ao buscar patrimônio:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchPatrimony();
  }, [fetchPatrimony]);

  return { accounts, totals, loading, refetch: fetchPatrimony };
};