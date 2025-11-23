import React, { useState } from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
// 1. Importar os seus novos componentes
import { EditInfoModal } from '../components/EditInfoModal';
import { LegalModal } from '../components/LegalModal';

interface ProfileScreenProps {
  onBack: () => void;
  onLogout: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBack }) => {
  const { signOut, user } = useAuth();
  
  // 2. Estados para controlar qual modal está aberto
  const [editingField, setEditingField] = useState<'name' | 'email' | 'phone' | 'password' | null>(null);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  const handleLogout = async () => {
    await signOut();
  };

  // 3. Função única para salvar no Supabase
  const handleSave = async (value: string) => {
    try {
      if (editingField === 'name') await supabase.auth.updateUser({ data: { name: value } });
      if (editingField === 'email') await supabase.auth.updateUser({ email: value });
      if (editingField === 'phone') await supabase.auth.updateUser({ phone: value });
      if (editingField === 'password') await supabase.auth.updateUser({ password: value });
      
      alert('Atualizado com sucesso!'); // Feedback simples
    } catch (error) {
      alert('Erro ao atualizar');
    }
  };

  // Textos legais (pode manter aqui ou num arquivo separado)
  const termsText = <><p>1. Termos de uso...</p><p>2. Aceitação...</p></>;
  const privacyText = <><p>1. Coleta de dados...</p><p>2. Uso...</p></>;

  return (
    <div className="min-h-screen flex flex-col p-4 max-w-md mx-auto">
      {/* ... SEU HEADER E ESTRUTURA ORIGINAL ... */}
      <header className="relative flex items-center justify-center py-4 mb-4">
        <button onClick={onBack} className="absolute left-0 p-2 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold">Perfil</h1>
      </header>

      <main className="flex-grow space-y-6 pb-6">
        
        {/* EXEMPLO: Bloco de Informação Pessoal - SÓ ALTERE O onClick */}
        <div className="p-6 bg-white dark:bg-stone-800 rounded-3xl shadow-sm">
          <h2 className="text-sm font-semibold text-emerald-500 mb-4">INFORMAÇÃO PESSOAL</h2>
          {/* Adicione onClick na div ou envolva num botão, mantendo as classes */}
          <div 
            className="flex items-center justify-between cursor-pointer hover:opacity-70 transition-opacity"
            onClick={() => setEditingField('name')} 
          >
            <span className="text-stone-600 dark:text-stone-300">Nome</span>
            <div className="flex items-center gap-2">
              {/* Mostra o nome atualizado ou o do user */}
              <span className="font-medium">{user?.user_metadata?.name || 'Sem nome'}</span>
              <ChevronRight className="w-5 h-5 text-stone-400 dark:text-stone-500" />
            </div>
          </div>
        </div>

        {/* Repita o onClick para os outros campos no bloco DETALHES DA CONTA */}
        <div className="p-6 bg-white dark:bg-stone-800 rounded-3xl shadow-sm">
            <h2 className="text-sm font-semibold text-emerald-500 mb-4">DETALHES DA CONTA</h2>
            <div className="space-y-4">
                
                {/* E-mail */}
                <div 
                    className="flex items-center justify-between cursor-pointer hover:opacity-70"
                    onClick={() => setEditingField('email')}
                >
                    <span className="text-stone-600 dark:text-stone-300">E-mail</span>
                    <div className="flex items-center gap-2">
                        <span className="font-medium truncate max-w-[150px]">{user?.email}</span>
                        <ChevronRight className="w-5 h-5 text-stone-400 dark:text-stone-500" />
                    </div>
                </div>

                {/* Senha */}
                <div 
                    className="flex items-center justify-between cursor-pointer hover:opacity-70"
                    onClick={() => setEditingField('password')}
                >
                    <span className="text-stone-600 dark:text-stone-300">Senha</span>
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-emerald-500">Trocar senha</span>
                        <ChevronRight className="w-5 h-5 text-stone-400 dark:text-stone-500" />
                    </div>
                </div>

                {/* Celular */}
                <div 
                    className="flex items-center justify-between cursor-pointer hover:opacity-70"
                    onClick={() => setEditingField('phone')}
                >
                    <span className="text-stone-600 dark:text-stone-300">Número de celular</span>
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-stone-400 dark:text-stone-500">{user?.phone || 'Não informado'}</span>
                        <ChevronRight className="w-5 h-5 text-stone-400 dark:text-stone-500" />
                    </div>
                </div>
            </div>
        </div>

        {/* ... MANTENHA O RESTO DO SEU LAYOUT (Assinatura, Pagamentos, etc) ... */}

        {/* Bloco LEGAL: Adicione os onClick para os termos */}
        <div className="p-6 bg-white dark:bg-stone-800 rounded-3xl shadow-sm">
          <h2 className="text-sm font-semibold text-emerald-500 mb-4">LEGAL</h2>
          <div className="space-y-4">
            <div 
                className="flex items-center justify-between cursor-pointer hover:opacity-70"
                onClick={() => setShowTerms(true)}
            >
              <span className="font-medium">Termos</span>
              <ChevronRight className="w-5 h-5 text-stone-400 dark:text-stone-500" />
            </div>
            <div 
                className="flex items-center justify-between cursor-pointer hover:opacity-70"
                onClick={() => setShowPrivacy(true)}
            >
              <span className="font-medium">Política de Privacidade</span>
              <ChevronRight className="w-5 h-5 text-stone-400 dark:text-stone-500" />
            </div>
          </div>
        </div>
        
        {/* Botão Sair original */}
        <div className="py-4">
          <button onClick={handleLogout} className="w-full text-center font-semibold text-emerald-500 hover:text-emerald-600 transition-colors">
            Sair
          </button>
        </div>
      </main>

      {/* 4. CHAME OS MODAIS AQUI NO FINAL (Eles não ocupam espaço visual até abrirem) */}
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

      {showTerms && (
        <LegalModal title="Termos de Serviço" content={termsText} onClose={() => setShowTerms(false)} />
      )}

      {showPrivacy && (
        <LegalModal title="Política de Privacidade" content={privacyText} onClose={() => setShowPrivacy(false)} />
      )}

    </div>
  );
};