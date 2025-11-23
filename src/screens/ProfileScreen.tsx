import React, { useState, useEffect } from 'react';
import { ArrowLeft, ChevronRight, X, Save, Lock, Mail, Phone, User as UserIcon, FileText, Shield } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

interface ProfileScreenProps {
  onBack: () => void;
  onLogout: () => void;
}

// Componente simples de Modal para edição
const EditModal = ({ title, value, onChange, onSave, onClose, type = "text" }: any) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
    <div className="bg-white dark:bg-stone-800 w-full max-w-sm rounded-3xl p-6 shadow-xl">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-bold text-stone-900 dark:text-white">{title}</h3>
        <button onClick={onClose}><X className="text-stone-500" /></button>
      </div>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full p-3 rounded-xl bg-stone-100 dark:bg-stone-700 border-none mb-4 focus:ring-2 focus:ring-emerald-500 outline-none text-stone-900 dark:text-white"
        autoFocus
      />
      <button
        onClick={onSave}
        className="w-full bg-emerald-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors"
      >
        <Save size={20} /> Salvar Alterações
      </button>
    </div>
  </div>
);

// Componente Modal para Textos Longos (Termos/Privacidade)
const TextModal = ({ title, content, onClose }: any) => (
  <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
    <div className="bg-white dark:bg-stone-800 w-full max-w-md h-[80vh] rounded-3xl p-6 shadow-xl flex flex-col">
      <div className="flex justify-between items-center mb-4 flex-shrink-0">
        <h3 className="text-lg font-bold text-stone-900 dark:text-white">{title}</h3>
        <button onClick={onClose}><X className="text-stone-500" /></button>
      </div>
      <div className="overflow-y-auto flex-grow text-sm text-stone-600 dark:text-stone-300 space-y-4 pr-2">
        {content}
      </div>
    </div>
  </div>
);

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBack }) => {
  const { signOut, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ text: string, type: 'success' | 'error' } | null>(null);

  // Estados dos campos
  const [name, setName] = useState(user?.user_metadata?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  
  // Estados de controle dos modais
  const [editingField, setEditingField] = useState<'name' | 'email' | 'phone' | 'password' | null>(null);
  const [tempValue, setTempValue] = useState('');
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);

  // Resetar mensagem após 3 segundos
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleLogout = async () => {
    await signOut();
  };

  const startEditing = (field: 'name' | 'email' | 'phone' | 'password') => {
    setEditingField(field);
    if (field === 'name') setTempValue(name);
    if (field === 'email') setTempValue(email);
    if (field === 'phone') setTempValue(phone);
    if (field === 'password') setTempValue('');
  };

  const saveChanges = async () => {
    setLoading(true);
    setMessage(null);
    try {
      let updateData: any = {};
      let successMsg = '';

      if (editingField === 'name') {
        updateData = { data: { name: tempValue } };
        successMsg = 'Nome atualizado com sucesso!';
      } else if (editingField === 'email') {
        updateData = { email: tempValue };
        successMsg = 'Verifique seu novo e-mail para confirmar a alteração.';
      } else if (editingField === 'phone') {
        updateData = { phone: tempValue };
        successMsg = 'Telefone atualizado com sucesso!';
      } else if (editingField === 'password') {
        updateData = { password: tempValue };
        successMsg = 'Senha alterada com sucesso!';
      }

      const { error } = await supabase.auth.updateUser(updateData);

      if (error) throw error;

      // Atualizar estado local se necessário
      if (editingField === 'name') setName(tempValue);
      if (editingField === 'phone') setPhone(tempValue);
      // Email requer confirmação, então não atualizamos o estado local imediatamente
      
      setMessage({ text: successMsg, type: 'success' });
      setEditingField(null);
    } catch (error: any) {
      setMessage({ text: error.message || 'Erro ao atualizar.', type: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const TERMS_CONTENT = (
    <>
      <p><strong>1. Aceitação dos Termos</strong><br/>Ao acessar e usar o aplicativo Odete, você concorda em cumprir estes termos de serviço e todas as leis aplicáveis.</p>
      <p><strong>2. Uso do Serviço</strong><br/>A Odete é uma assistente financeira pessoal. Você concorda em usar o serviço apenas para fins legais e pessoais de gestão financeira.</p>
      <p><strong>3. Contas de Usuário</strong><br/>Você é responsável por manter a confidencialidade de sua conta e senha. A Odete não se responsabiliza por perdas decorrentes do uso não autorizado de sua conta.</p>
      <p><strong>4. Precisão das Informações</strong><br/>Embora nos esforcemos para fornecer informações precisas, não garantimos que todos os cálculos financeiros ou sugestões da IA sejam 100% livres de erros. O uso das informações é por sua conta e risco.</p>
      <p><strong>5. Modificações</strong><br/>Reservamo-nos o direito de modificar estes termos a qualquer momento. O uso contínuo do aplicativo após alterações constitui aceitação dos novos termos.</p>
    </>
  );

  const PRIVACY_CONTENT = (
    <>
      <p><strong>1. Coleta de Informações</strong><br/>Coletamos informações que você nos fornece diretamente, como nome, e-mail, e dados financeiros inseridos no aplicativo para o funcionamento das metas e orçamentos.</p>
      <p><strong>2. Uso das Informações</strong><br/>Usamos suas informações para operar, manter e melhorar nossos serviços, além de fornecer a funcionalidade de chat com a IA Odete.</p>
      <p><strong>3. Compartilhamento de Dados</strong><br/>Não vendemos seus dados pessoais a terceiros. Podemos compartilhar dados anonimizados para fins de análise e melhoria do serviço.</p>
      <p><strong>4. Segurança</strong><br/>Implementamos medidas de segurança projetadas para proteger suas informações, utilizando criptografia e práticas seguras de banco de dados.</p>
      <p><strong>5. Seus Direitos</strong><br/>Você tem o direito de acessar, corrigir ou excluir suas informações pessoais a qualquer momento através das configurações do aplicativo.</p>
    </>
  );

  return (
    <div className="min-h-screen flex flex-col p-4 max-w-md mx-auto relative">
      {/* Toast de Mensagem */}
      {message && (
        <div className={`fixed top-4 left-1/2 transform -translate-x-1/2 px-4 py-2 rounded-xl shadow-lg z-50 text-sm font-bold ${
          message.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
        }`}>
          {message.text}
        </div>
      )}

      {/* Header */}
      <header className="relative flex items-center justify-center py-4 mb-4">
        <button
          onClick={onBack}
          className="absolute left-0 p-2 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors text-stone-900 dark:text-stone-100"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100">Perfil</h1>
      </header>

      <main className="flex-grow space-y-6 pb-6 overflow-y-auto">
        
        {/* Informação Pessoal */}
        <div className="p-6 bg-white dark:bg-stone-800 rounded-3xl shadow-sm">
          <h2 className="text-sm font-semibold text-emerald-500 mb-4 flex items-center gap-2">
            <UserIcon size={16} /> INFORMAÇÃO PESSOAL
          </h2>
          <button 
            onClick={() => startEditing('name')}
            className="w-full flex items-center justify-between group"
          >
            <span className="text-stone-600 dark:text-stone-300">Nome</span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-stone-900 dark:text-stone-100">{name}</span>
              <ChevronRight className="w-5 h-5 text-stone-400 dark:text-stone-500 group-hover:text-emerald-500 transition-colors" />
            </div>
          </button>
        </div>

        {/* Detalhes da Conta */}
        <div className="p-6 bg-white dark:bg-stone-800 rounded-3xl shadow-sm space-y-4">
          <h2 className="text-sm font-semibold text-emerald-500 mb-4 flex items-center gap-2">
            <Lock size={16} /> DETALHES DA CONTA
          </h2>
          
          <button 
            onClick={() => startEditing('email')}
            className="w-full flex items-center justify-between group"
          >
            <span className="text-stone-600 dark:text-stone-300">E-mail</span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-stone-900 dark:text-stone-100 truncate max-w-[150px]">{email}</span>
              <ChevronRight className="w-5 h-5 text-stone-400 dark:text-stone-500 group-hover:text-emerald-500 transition-colors" />
            </div>
          </button>

          <button 
            onClick={() => startEditing('password')}
            className="w-full flex items-center justify-between group"
          >
            <span className="text-stone-600 dark:text-stone-300">Senha</span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-emerald-500">Trocar senha</span>
              <ChevronRight className="w-5 h-5 text-stone-400 dark:text-stone-500 group-hover:text-emerald-500 transition-colors" />
            </div>
          </button>

          <button 
            onClick={() => startEditing('phone')}
            className="w-full flex items-center justify-between group"
          >
            <span className="text-stone-600 dark:text-stone-300">Celular</span>
            <div className="flex items-center gap-2">
              <span className="font-medium text-stone-900 dark:text-stone-100">
                {phone || 'Adicionar'}
              </span>
              <ChevronRight className="w-5 h-5 text-stone-400 dark:text-stone-500 group-hover:text-emerald-500 transition-colors" />
            </div>
          </button>
        </div>

        {/* Legal */}
        <div className="p-6 bg-white dark:bg-stone-800 rounded-3xl shadow-sm">
          <h2 className="text-sm font-semibold text-emerald-500 mb-4 flex items-center gap-2">
            <Shield size={16} /> LEGAL
          </h2>
          <div className="space-y-4">
            <button 
              onClick={() => setShowTerms(true)}
              className="w-full flex items-center justify-between group"
            >
              <span className="font-medium text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <FileText size={16} className="text-stone-400" /> Termos de Serviço
              </span>
              <ChevronRight className="w-5 h-5 text-stone-400 dark:text-stone-500 group-hover:text-emerald-500 transition-colors" />
            </button>
            <button 
              onClick={() => setShowPrivacy(true)}
              className="w-full flex items-center justify-between group"
            >
              <span className="font-medium text-stone-900 dark:text-stone-100 flex items-center gap-2">
                <Shield size={16} className="text-stone-400" /> Política de Privacidade
              </span>
              <ChevronRight className="w-5 h-5 text-stone-400 dark:text-stone-500 group-hover:text-emerald-500 transition-colors" />
            </button>
          </div>
        </div>

        {/* Botão Sair */}
        <div className="py-4">
          <button
            onClick={handleLogout}
            className="w-full py-4 rounded-2xl bg-stone-200 dark:bg-stone-800 text-stone-600 dark:text-stone-400 font-bold hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20 dark:hover:text-red-400 transition-colors"
          >
            Sair da conta
          </button>
        </div>
      </main>

      {/* Modais */}
      {editingField && (
        <EditModal
          title={
            editingField === 'name' ? 'Editar Nome' :
            editingField === 'email' ? 'Alterar E-mail' :
            editingField === 'phone' ? 'Alterar Celular' : 'Nova Senha'
          }
          value={tempValue}
          onChange={setTempValue}
          onSave={saveChanges}
          onClose={() => setEditingField(null)}
          type={editingField === 'password' ? 'password' : 'text'}
        />
      )}

      {showTerms && (
        <TextModal 
          title="Termos de Serviço" 
          content={TERMS_CONTENT} 
          onClose={() => setShowTerms(false)} 
        />
      )}

      {showPrivacy && (
        <TextModal 
          title="Política de Privacidade" 
          content={PRIVACY_CONTENT} 
          onClose={() => setShowPrivacy(false)} 
        />
      )}
    </div>
  );
};