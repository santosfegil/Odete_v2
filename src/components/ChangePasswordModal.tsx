import React, { useState } from 'react';
import { X, Save, Lock } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface ChangePasswordModalProps {
  onClose: () => void;
  userEmail: string | undefined;
  onSuccess: () => void;
}

export const ChangePasswordModal: React.FC<ChangePasswordModalProps> = ({ onClose, userEmail, onSuccess }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setError('');
    
    // 1. Validações básicas
    if (!newPassword || !confirmPassword) {
      setError('Preencha todos os campos.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('As novas senhas não coincidem.');
      return;
    }

    if (newPassword.length < 6) {
      setError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    setLoading(true);

    try {
      // 2. Opcional: Tentar logar com a senha antiga para garantir que é o dono da conta
      // Nota: O Supabase update não exige a senha antiga se já estiver logado, 
      // mas é boa prática de segurança verificar.
      if (currentPassword) {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: userEmail || '',
          password: currentPassword,
        });
        if (signInError) throw new Error('Senha atual incorreta.');
      }

      // 3. Atualizar a senha
      const { error: updateError } = await supabase.auth.updateUser({ 
        password: newPassword 
      });

      if (updateError) throw updateError;

      onSuccess(); // Chama a notificação de sucesso da tela pai
      onClose();   // Fecha o modal

    } catch (err: any) {
      setError(err.message || 'Erro ao alterar senha.');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!userEmail) return;
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(userEmail, {
      redirectTo: window.location.origin + '/reset-password', // Ajuste conforme sua URL
    });
    setLoading(false);
    if (error) setError('Erro ao enviar e-mail.');
    else {
      alert(`E-mail de redefinição enviado para ${userEmail}`);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
      <div className="bg-white dark:bg-stone-800 w-full max-w-sm rounded-3xl p-6 shadow-xl animate-in fade-in zoom-in duration-200">
        
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg font-bold text-stone-900 dark:text-white">Alterar Senha</h3>
          <button onClick={onClose}><X className="text-stone-500 hover:text-stone-700" /></button>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 text-red-600 text-sm rounded-xl border border-red-100">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1 ml-1">Senha Atual</label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className="w-full p-3 rounded-xl bg-stone-100 dark:bg-stone-700 border-none focus:ring-2 focus:ring-emerald-500 outline-none text-stone-900 dark:text-white"
              placeholder="Digite sua senha atual..."
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1 ml-1">Nova Senha</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full p-3 rounded-xl bg-stone-100 dark:bg-stone-700 border-none focus:ring-2 focus:ring-emerald-500 outline-none text-stone-900 dark:text-white"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-500 mb-1 ml-1">Confirmar Nova Senha</label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full p-3 rounded-xl bg-stone-100 dark:bg-stone-700 border-none focus:ring-2 focus:ring-emerald-500 outline-none text-stone-900 dark:text-white"
              placeholder="Repita a nova senha"
            />
          </div>
        </div>

        <div className="mt-2 mb-6 text-right">
          <button 
            onClick={handleForgotPassword}
            className="text-xs font-medium text-emerald-600 hover:text-emerald-700 hover:underline"
          >
            Esqueci minha senha
          </button>
        </div>
        
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-emerald-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors disabled:opacity-50 shadow-md shadow-emerald-500/20"
        >
          {loading ? 'Salvando...' : <><Save size={20} /> Salvar Alterações</>}
        </button>
      </div>
    </div>
  );
};