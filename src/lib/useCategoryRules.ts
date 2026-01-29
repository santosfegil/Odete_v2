import { useState, useCallback } from 'react';
import { supabase } from './supabase';

interface TransactionForRule {
  id: string;
  description: string;
  amount: number;
  receiver_document?: string | null;
  receiver_name?: string | null;
  category_id?: string;
  category_name?: string;
}

interface SimilarTransactionsResult {
  matches: TransactionForRule[];
  matchType: 'document' | 'name_amount' | 'description';
  matchValue: string;
}

interface CategoryRule {
  id?: string;
  user_id: string;
  match_receiver_document?: string | null;
  match_receiver_name?: string | null;
  match_amount_min?: number | null;
  match_amount_max?: number | null;
  match_description_contains?: string | null;
  target_category_id?: string | null;
  target_tag_id?: string | null;
  rule_name?: string;
  priority?: number;
  is_active?: boolean;
}

export function useCategoryRules() {
  const [loading, setLoading] = useState(false);

  /**
   * Busca transações similares baseado em receiver_document, nome+valor, ou descrição
   */
  const findSimilarTransactions = useCallback(async (
    tx: TransactionForRule
  ): Promise<SimilarTransactionsResult | null> => {
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return null;

      // 1. Tenta por CPF/CNPJ (mais confiável)
      if (tx.receiver_document) {
        const { data: byDocument } = await supabase
          .from('transactions')
          .select('id, description, amount, receiver_document, receiver_name, category_id')
          .eq('user_id', user.id)
          .eq('receiver_document', tx.receiver_document)
          .neq('id', tx.id);

        if (byDocument && byDocument.length > 0) {
          return {
            matches: byDocument,
            matchType: 'document',
            matchValue: tx.receiver_document
          };
        }
      }

      // 2. Tenta por nome + valor próximo (±10%)
      if (tx.receiver_name) {
        const minAmount = tx.amount * 0.9;
        const maxAmount = tx.amount * 1.1;

        const { data: byName } = await supabase
          .from('transactions')
          .select('id, description, amount, receiver_document, receiver_name, category_id')
          .eq('user_id', user.id)
          .eq('receiver_name', tx.receiver_name)
          .gte('amount', minAmount)
          .lte('amount', maxAmount)
          .neq('id', tx.id);

        if (byName && byName.length > 0) {
          return {
            matches: byName,
            matchType: 'name_amount',
            matchValue: tx.receiver_name
          };
        }
      }

      // 3. Fallback: busca por descrição parcial (primeiras 3 palavras)
      if (tx.description) {
        const keywords = tx.description.split(' ').slice(0, 3).join(' ');
        
        const { data: byDesc } = await supabase
          .from('transactions')
          .select('id, description, amount, receiver_document, receiver_name, category_id')
          .eq('user_id', user.id)
          .ilike('description', `%${keywords}%`)
          .neq('id', tx.id);

        if (byDesc && byDesc.length > 0) {
          return {
            matches: byDesc,
            matchType: 'description',
            matchValue: keywords
          };
        }
      }

      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Atualiza categoria de múltiplas transações
   */
  const bulkUpdateCategory = useCallback(async (
    transactionIds: string[],
    categoryId: string
  ): Promise<boolean> => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from('transactions')
        .update({ category_id: categoryId })
        .in('id', transactionIds);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Erro ao atualizar categorias em lote:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Cria uma regra de categorização automática
   */
  const createRule = useCallback(async (
    rule: Omit<CategoryRule, 'id'>
  ): Promise<string | null> => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('category_rules')
        .insert(rule)
        .select('id')
        .single();

      if (error) throw error;
      return data?.id || null;
    } catch (err) {
      console.error('Erro ao criar regra:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  /**
   * Lista regras do usuário
   */
  const listRules = useCallback(async (): Promise<CategoryRule[]> => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return [];

      const { data, error } = await supabase
        .from('category_rules')
        .select('*')
        .eq('user_id', user.id)
        .order('priority', { ascending: false });

      if (error) throw error;
      return data || [];
    } catch (err) {
      console.error('Erro ao listar regras:', err);
      return [];
    }
  }, []);

  /**
   * Deleta uma regra
   */
  const deleteRule = useCallback(async (ruleId: string): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('category_rules')
        .delete()
        .eq('id', ruleId);

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Erro ao deletar regra:', err);
      return false;
    }
  }, []);

  return {
    loading,
    findSimilarTransactions,
    bulkUpdateCategory,
    createRule,
    listRules,
    deleteRule
  };
}
