import React, { useState, useEffect } from 'react';
import { ArrowLeft, Check, Loader2, Crown } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface Plan {
  id: string;
  name: string;
  price: number;
  features_json: string[] | null;
  store_product_id: string | null;
}

interface PlansScreenProps {
  onBack: () => void;
}

const PlansScreen: React.FC<PlansScreenProps> = ({ onBack }) => {
  const { user } = useAuth();
  const [plans, setPlans] = useState<Plan[]>([]);
  const [currentPlanId, setCurrentPlanId] = useState<string | null>(null);
  const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    const fetchData = async () => {
      const [plansRes, userRes] = await Promise.all([
        supabase.from('subscription_plans').select('*').order('price', { ascending: true }),
        supabase.from('users').select('current_plan_id').eq('id', user?.id).single(),
      ]);

      if (plansRes.data) setPlans(plansRes.data);
      if (userRes.data?.current_plan_id) setCurrentPlanId(userRes.data.current_plan_id);
      setLoading(false);
    };

    fetchData();
  }, [user?.id]);

  // Verificar checkout success/cancel na URL
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (params.get('checkout') === 'success') {
      setNotification({ text: 'Assinatura realizada com sucesso!', type: 'success' });
      window.history.replaceState({}, '', window.location.pathname);
      // Recarregar dados do plano
      supabase.from('users').select('current_plan_id').eq('id', user?.id).single()
        .then(({ data }) => {
          if (data?.current_plan_id) setCurrentPlanId(data.current_plan_id);
        });
    } else if (params.get('checkout') === 'cancel') {
      setNotification({ text: 'Assinatura cancelada.', type: 'error' });
      window.history.replaceState({}, '', window.location.pathname);
    }
  }, [user?.id]);

  const handleSubscribe = async (plan: Plan) => {
    if (!plan.store_product_id) {
      setNotification({ text: 'Plano sem Price ID configurado.', type: 'error' });
      return;
    }

    setLoadingPlanId(plan.id);
    try {
      const { data, error } = await supabase.functions.invoke('create-checkout-session', {
        body: { price_id: plan.store_product_id, plan_id: plan.id },
      });

      if (error) throw error;
      if (data?.url) {
        window.location.href = data.url;
      } else {
        throw new Error('URL de checkout nao retornada.');
      }
    } catch (error: any) {
      setNotification({ text: error.message || 'Erro ao iniciar checkout.', type: 'error' });
      setLoadingPlanId(null);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(price);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-emerald-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col px-4 py-4 max-w-lg mx-auto relative w-full">
      {notification && (
        <div className={`fixed top-6 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-full shadow-xl z-[60] text-sm font-bold text-white animate-in slide-in-from-top-2 ${
          notification.type === 'success' ? 'bg-emerald-500' : 'bg-red-500'
        }`}>
          {notification.text}
        </div>
      )}

      <header className="relative flex items-center justify-center py-4 mb-4">
        <button
          onClick={onBack}
          className="absolute left-0 p-2 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">Planos</h1>
      </header>

      <main className="flex-grow space-y-4 pb-6">
        <p className="text-center text-stone-600 dark:text-stone-400 text-sm mb-2">
          Escolha o plano ideal para você
        </p>

        {plans.map((plan) => {
          const isCurrentPlan = plan.id === currentPlanId;
          const isLoading = loadingPlanId === plan.id;
          const features = Array.isArray(plan.features_json) ? plan.features_json : [];

          return (
            <div
              key={plan.id}
              className={`p-6 rounded-3xl shadow-sm ${
                isCurrentPlan
                  ? 'bg-emerald-50 dark:bg-emerald-900/20 border-2 border-emerald-500'
                  : 'bg-white dark:bg-stone-800'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Crown className={`w-5 h-5 ${isCurrentPlan ? 'text-emerald-500' : 'text-stone-400'}`} />
                  <h3 className="text-lg font-bold">{plan.name}</h3>
                </div>
                {isCurrentPlan && (
                  <span className="text-xs font-semibold text-emerald-500 bg-emerald-100 dark:bg-emerald-900/40 px-3 py-1 rounded-full">
                    Plano atual
                  </span>
                )}
              </div>

              <p className="text-2xl font-bold mb-4">
                {formatPrice(plan.price)}
                <span className="text-sm font-normal text-stone-500">/mês</span>
              </p>

              {features.length > 0 && (
                <ul className="space-y-2 mb-5">
                  {features.map((feature, i) => (
                    <li key={i} className="flex items-center gap-2 text-sm text-stone-600 dark:text-stone-300">
                      <Check className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>
              )}

              <button
                onClick={() => handleSubscribe(plan)}
                disabled={isCurrentPlan || isLoading}
                className={`w-full py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${
                  isCurrentPlan
                    ? 'bg-stone-200 dark:bg-stone-700 text-stone-400 cursor-not-allowed'
                    : 'bg-emerald-500 hover:bg-emerald-600 text-white'
                }`}
              >
                {isLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : isCurrentPlan ? (
                  'Plano atual'
                ) : (
                  'Assinar'
                )}
              </button>
            </div>
          );
        })}
      </main>
    </div>
  );
};

export default PlansScreen;
