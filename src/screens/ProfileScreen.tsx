import React from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useState, useEffect } from 'react'; // Adicione ao import do React
import { supabase } from '../lib/supabase';
import { EditInfoModal } from '../components/EditInfoModal';
import { LegalModal } from '../components/LegalModal';

interface ProfileScreenProps {
  onBack: () => void;
  onLogout: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBack }) => {
  const { signOut, user } = useAuth();
  const [notification, setNotification] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  useEffect(() => {
    if (notification) {
      const timer = setTimeout(() => setNotification(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [notification]);
  const [editingField, setEditingField] = useState<'name' | 'email' | 'phone' | 'password' | null>(null);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

 const handleSave = async (value: string) => {
    try {
      const updates: any = {};
      
      if (editingField === 'name') updates.data = { name: value };
      else if (editingField === 'password') updates.password = value;
      else updates[editingField!] = value;

      const { error } = await supabase.auth.updateUser(updates);
      if (error) throw error;
      
      // 4. ALTERADO: Em vez de alert(), usamos o setNotification
      setNotification({ text: 'Dados atualizados com sucesso!', type: 'success' });
    } catch (error: any) {
      // 4. ALTERADO: Mensagem de erro visual
      setNotification({ text: 'Erro ao atualizar: ' + error.message, type: 'error' });
    }
  };
  // Conteúdo dos termos
  const termsText = <><p>1. Termos de uso...</p><p>2. Aceitação...</p></>;
  const privacyText = <><p>1. Coleta de dados...</p><p>2. Segurança...</p></>;

  const handleLogout = async () => {
    await signOut();
  };
  return (
    <div className="min-h-screen flex flex-col p-4 max-w-md mx-auto relative">
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
          <h2 className="text-sm font-semibold text-emerald-500 mb-4">INFORMAÇÃO PESSOAL</h2>
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
          <h2 className="text-sm font-semibold text-emerald-500 mb-4">DETALHES DA CONTA</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-stone-600 dark:text-stone-300 cursor-pointer" onClick={() => setEditingField('email')}>E-mail</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">fernando.gil@gympass.com</span>
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
                <span className="font-medium text-stone-400 dark:text-stone-500">Não informado</span>
                <ChevronRight className="w-5 h-5 text-stone-400 dark:text-stone-500" />
              </div>
            </div>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-stone-800 rounded-3xl shadow-sm">
          <h2 className="text-sm font-semibold text-emerald-500 mb-4">ASSINATURA</h2>
          <div className="flex items-center justify-between">
            <span className="font-medium">Gerenciar assinatura</span>
            <ChevronRight className="w-5 h-5 text-stone-400 dark:text-stone-500" />
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-stone-800 rounded-3xl shadow-sm">
          <h2 className="text-sm font-semibold text-emerald-500 mb-4">PAGAMENTOS</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Método de pagamento</span>
              <ChevronRight className="w-5 h-5 text-stone-400 dark:text-stone-500" />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Dados de faturamento</span>
              <ChevronRight className="w-5 h-5 text-stone-400 dark:text-stone-500" />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Histórico de pagamento</span>
              <ChevronRight className="w-5 h-5 text-stone-400 dark:text-stone-500" />
            </div>
          </div>
          <p className="text-xs text-stone-500 dark:text-stone-400 mt-4 text-center">
            Renova em 28 de novembro de 2025
          </p>
        </div>

        <div className="p-6 bg-white dark:bg-stone-800 rounded-3xl shadow-sm">
          <h2 className="text-sm font-semibold text-emerald-500 mb-4">AJUDA</h2>
          <div className="flex items-center justify-between">
            <span className="font-medium">Central de ajuda</span>
            <ChevronRight className="w-5 h-5 text-stone-400 dark:text-stone-500" />
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-stone-800 rounded-3xl shadow-sm">
          <h2 className="text-sm font-semibold text-emerald-500 mb-4">LEGAL</h2>
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
          <h2 className="text-sm font-semibold text-emerald-500 mb-4">IDIOMA</h2>
          <div className="flex items-center justify-between">
            <span className="text-stone-600 dark:text-stone-300">Idioma</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">Português (Brasil)</span>
              <ChevronRight className="w-5 h-5 text-stone-400 dark:text-stone-500" />
            </div>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-stone-800 rounded-3xl shadow-sm">
          <h2 className="text-sm font-semibold text-emerald-500 mb-4">PRIVACIDADE DE DADOS</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Baixar dados</span>
              <ChevronRight className="w-5 h-5 text-stone-400 dark:text-stone-500" />
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium text-red-500">Excluir conta</span>
              <ChevronRight className="w-5 h-5 text-stone-400 dark:text-stone-500" />
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
      {editingField && (
        <EditInfoModal
          title={
            editingField === 'name' ? 'Alterar Nome' :
            editingField === 'email' ? 'Alterar E-mail' :
            editingField === 'phone' ? 'Alterar Celular' : 'Alterar Senha'
          }
          initialValue={
             editingField === 'name' ? user?.user_metadata?.name : 
             editingField === 'email' ? user?.email : 
             editingField === 'phone' ? user?.phone : ''
          }
          type={editingField === 'password' ? 'password' : 'text'}
          onSave={handleSave}
          onClose={() => setEditingField(null)}
        />
      )}

      {showTerms && <LegalModal title="Termos de Serviço" content={termsText} onClose={() => setShowTerms(false)} />}
      {showPrivacy && <LegalModal title="Política de Privacidade" content={privacyText} onClose={() => setShowPrivacy(false)} />}


    
    </div>
  );
};
