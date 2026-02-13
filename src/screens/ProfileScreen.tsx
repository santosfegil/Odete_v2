import React from 'react';
import { ArrowLeft, ChevronRight, AlertTriangle, Loader2 } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { EditInfoModal } from '../components/EditInfoModal';
import { LegalModal } from '../components/LegalModal';
import { ChangePasswordModal } from '../components/ChangePasswordModal';
import { TERMS_CONTENT, PRIVACY_CONTENT } from '../constants/LegalTexts';
import BankConnectButton from '../components/Pluggy/BankConnectButton';

interface ProfileScreenProps {
  onBack: () => void;
  onLogout: () => void;
  onShowPlans: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBack, onShowPlans }) => {
  const { signOut, user, session } = useAuth();
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [loadingPortal, setLoadingPortal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [hasActiveSubscription, setHasActiveSubscription] = useState(false);

  const [notification, setNotification] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);

  useEffect(() => {
    const checkSubscription = async () => {
      if (!user?.id) return;
      const { data } = await supabase
        .from('user_subscriptions')
        .select('gateway_id')
        .eq('user_id', user.id)
        .eq('status', 'active')
        .not('gateway_id', 'is', null)
        .limit(1)
        .single();
      setHasActiveSubscription(!!data?.gateway_id);
    };
    checkSubscription();
  }, [user?.id]);

  const [editingField, setEditingField] = useState<'name' | 'email' | 'phone' | 'password' | null>(null);


 const handleSave = async (value: string) => {
    try {
      const updates: any = {};
      
      if (editingField === 'name') updates.data = { name: value };
      else if (editingField === 'phone') updates.data = { phone: value };
      else if (editingField === 'password') updates.password = value;
      else updates[editingField!] = value;

      const { error } = await supabase.auth.updateUser(updates);
      if (error) throw error;
      
      setNotification({ text: 'Dados atualizados com sucesso!', type: 'success' });
    } catch (error: any) {
      setNotification({ text: 'Erro ao atualizar: ' + error.message, type: 'error' });
    }
  };

  const handleManageSubscription = async () => {
    setLoadingPortal(true);
    try {
      const { data, error } = await supabase.functions.invoke('create-stripe-portal');
      if (error) throw error;
      if (data?.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('URL do portal não retornada.');
      }
    } catch (error: any) {
      setNotification({ text: error.message || 'Erro ao abrir portal de assinatura.', type: 'error' });
    } finally {
      setLoadingPortal(false);
    }
  };

  const handleDownloadData = async () => {
    let supportEmail = 'suporte@odete.com';
    try {
      const { data } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', 'support_email')
        .single();
      if (data?.value) supportEmail = data.value;
    } catch {
      // Usa fallback
    }
    const subject = encodeURIComponent('Solicitação de dados - LGPD');
    const body = encodeURIComponent(
      `Olá,\n\nGostaria de solicitar uma cópia dos meus dados pessoais conforme previsto na LGPD.\n\nE-mail da conta: ${user?.email || ''}\n\nObrigado(a).`
    );
    window.location.href = `mailto:${supportEmail}?subject=${subject}&body=${body}`;
  };

  const handleHelp = async () => {
    let supportEmail = 'suporte@odete.com';
    try {
      const { data } = await supabase
        .from('app_config')
        .select('value')
        .eq('key', 'support_email')
        .single();
      if (data?.value) supportEmail = data.value;
    } catch {
      // Usa fallback
    }
    const subject = encodeURIComponent('Preciso de ajuda - Odete');
    const body = encodeURIComponent(
      `Olá,\n\nPreciso de ajuda com o seguinte:\n\n[Descreva aqui sua dúvida ou problema]\n\nE-mail da conta: ${user?.email || ''}\n\nObrigado(a).`
    );
    window.location.href = `mailto:${supportEmail}?subject=${subject}&body=${body}`;
  };

  const handleDeleteAccount = async () => {
    setDeletingAccount(true);
    try {
      const { error } = await supabase
        .from('users')
        .update({ deleted_at: new Date().toISOString() })
        .eq('id', user?.id);
      if (error) throw error;
      await signOut();
    } catch (error: any) {
      setNotification({ text: error.message || 'Erro ao excluir conta.', type: 'error' });
      setDeletingAccount(false);
    }
  };

  const handleLogout = async () => {
    await signOut();
  };
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
        <h1 className="text-xl font-bold">Perfil</h1>
      </header>

      <main className="flex-grow space-y-6 pb-6">
        <div className="p-6 bg-white dark:bg-stone-800 rounded-3xl shadow-sm">
          <h2 className="text-sm font-semibold text-emerald-500 mb-4">Informação pessoal</h2>
          <div className="flex items-center justify-between cursor-pointer" onClick={() => setEditingField('name')}>
            <span className="text-stone-600 dark:text-stone-300">Nome</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">
              {user?.user_metadata?.name || 'Usuário'}
              </span>
              <ChevronRight className="w-5 h-5 text-stone-400 dark:text-stone-500" />
            </div>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-stone-800 rounded-3xl shadow-sm">
          <h2 className="text-sm font-semibold text-emerald-500 mb-4">Detalhes da conta</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setEditingField('email')}>
              <span className="text-stone-600 dark:text-stone-300 " >E-mail</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">
                {user?.user_metadata?.email || 'Usuário'}
                </span>
                <ChevronRight className="w-5 h-5 text-stone-400 dark:text-stone-500" />
              </div>
            </div>
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setEditingField('password')}>
              <span className="text-stone-600 dark:text-stone-300">Senha</span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-emerald-500">Trocar senha</span>
                <ChevronRight className="w-5 h-5 text-stone-400 dark:text-stone-500" />
              </div>
            </div>
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setEditingField('phone')}>
              <span className="text-stone-600 dark:text-stone-300" >Número de celular</span>
              <div className="flex items-center gap-2">
                <span className={`font-medium ${user?.user_metadata?.phone ? '' : 'text-stone-400 dark:text-stone-500'}`}>
                  {user?.user_metadata?.phone || 'Não informado'}
                </span>
                <ChevronRight className="w-5 h-5 text-stone-400 dark:text-stone-500" />
              </div>
            </div>
          </div>
        </div>
        <div className="p-6 bg-white dark:bg-stone-800 rounded-3xl shadow-sm">
          <h2 className="text-sm font-semibold text-emerald-500 mb-4">Contas conectadas</h2>
          <div className="flex items-center justify-between">
            {/* MODIFICADO: Passando o token de acesso do usuário */}
            <BankConnectButton userToken={session?.access_token} />
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-stone-800 rounded-3xl shadow-sm">
          <h2 className="text-sm font-semibold text-emerald-500 mb-4">Assinatura</h2>
          <div
            className="flex items-center justify-between cursor-pointer"
            onClick={hasActiveSubscription ? handleManageSubscription : onShowPlans}
          >
            <span className="font-medium">
              {loadingPortal
                ? 'Abrindo portal...'
                : hasActiveSubscription
                  ? 'Gerenciar assinatura'
                  : 'Ver planos'}
            </span>
            {loadingPortal ? (
              <Loader2 className="w-5 h-5 text-emerald-500 animate-spin" />
            ) : (
              <ChevronRight className="w-5 h-5 text-stone-400 dark:text-stone-500" />
            )}
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-stone-800 rounded-3xl shadow-sm">
          <h2 className="text-sm font-semibold text-emerald-500 mb-4">Ajuda</h2>
          <div className="flex items-center justify-between cursor-pointer" onClick={handleHelp}>
            <span className="font-medium">Central de ajuda</span>
            <ChevronRight className="w-5 h-5 text-stone-400 dark:text-stone-500" />
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-stone-800 rounded-3xl shadow-sm">
          <h2 className="text-sm font-semibold text-emerald-500 mb-4">Legal</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between cursor-pointer"onClick={() => setShowTerms(true)}>
              <span className="font-medium">Termos</span>
              <ChevronRight className="w-5 h-5 text-stone-400 dark:text-stone-500" />
            </div>
            <div className="flex items-center justify-between cursor-pointer"onClick={() => setShowPrivacy(true)}>
              <span className="font-medium">Política de Privacidade</span>
              <ChevronRight className="w-5 h-5 text-stone-400 dark:text-stone-500" />
            </div>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-stone-800 rounded-3xl shadow-sm">
          <h2 className="text-sm font-semibold text-emerald-500 mb-4">Idioma</h2>
          <div className="flex items-center justify-between">
            <span className="text-stone-600 dark:text-stone-300">Idioma</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">Português (Brasil)</span>
              <ChevronRight className="w-5 h-5 text-stone-400 dark:text-stone-500" />
            </div>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-stone-800 rounded-3xl shadow-sm">
          <h2 className="text-sm font-semibold text-emerald-500 mb-4">Privacidade de dados</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between cursor-pointer" onClick={handleDownloadData}>
              <span className="font-medium">Baixar dados</span>
              <ChevronRight className="w-5 h-5 text-stone-400 dark:text-stone-500" />
            </div>
            <div className="flex items-center justify-between cursor-pointer" onClick={() => setShowDeleteConfirm(true)}>
              <span className="font-medium text-red-500">Excluir conta</span>
              <ChevronRight className="w-5 h-5 text-red-400" />
            </div>
          </div>
        </div>

        <div className="py-4">
          <button
            onClick={handleLogout}
            className="w-full text-center font-semibold text-emerald-500 hover:text-emerald-600 transition-colors"
          >
            Sair
          </button>
        </div>
      </main>

{/* Modais flutuantes */}

      {editingField === 'password' ? (
        <ChangePasswordModal
          userEmail={user?.email}
          onClose={() => setEditingField(null)}
          onSuccess={() => setNotification({ text: 'Senha alterada com sucesso!', type: 'success' })}
        />
      ) : (
      editingField && (
        <EditInfoModal
          title={
            editingField === 'name' ? 'Alterar Nome' :
            editingField === 'email' ? 'Alterar E-mail' :
            editingField === 'phone' ? 'Alterar Celular' : 'Alterar Senha'
          }
          initialValue={
             editingField === 'name' ? user?.user_metadata?.name :
             editingField === 'email' ? user?.email :
             editingField === 'phone' ? (user?.user_metadata?.phone || '') : ''
          }
          type={editingField === 'phone' ? 'tel' : 'text'}
          onSave={handleSave}
          onClose={() => setEditingField(null)}
        />
  )
      )}

{showTerms && (
        <LegalModal 
          title="Termos de Serviço" 
          content={TERMS_CONTENT}
          onClose={() => setShowTerms(false)} 
        />
      )}

      {showPrivacy && (
        <LegalModal
          title="Política de Privacidade"
          content={PRIVACY_CONTENT}
          onClose={() => setShowPrivacy(false)}
        />
      )}

      {showDeleteConfirm && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-stone-800 rounded-3xl p-6 shadow-xl max-w-sm w-full animate-in fade-in zoom-in">
            <div className="flex flex-col items-center text-center">
              <div className="w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center mb-4">
                <AlertTriangle className="w-6 h-6 text-red-500" />
              </div>
              <h3 className="text-lg font-bold mb-2">Excluir conta</h3>
              <p className="text-stone-600 dark:text-stone-400 text-sm mb-6">
                Tem certeza? Seus dados serão excluídos em até 30 dias. Esta ação não pode ser desfeita.
              </p>
              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deletingAccount}
                  className="flex-1 py-3 rounded-xl font-semibold text-stone-600 dark:text-stone-300 bg-stone-100 dark:bg-stone-700 hover:bg-stone-200 dark:hover:bg-stone-600 transition-colors"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount}
                  className="flex-1 py-3 rounded-xl font-semibold text-white bg-red-500 hover:bg-red-600 transition-colors flex items-center justify-center gap-2"
                >
                  {deletingAccount ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    'Confirmar'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
