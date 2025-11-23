import React from 'react';
import { ArrowLeft, ChevronRight } from 'lucide-react';

interface ProfileScreenProps {
  onBack: () => void;
  onLogout: () => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({ onBack, onLogout }) => {
  return (
    <div className="min-h-screen flex flex-col p-4 max-w-md mx-auto">
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
          <div className="flex items-center justify-between">
            <span className="text-stone-600 dark:text-stone-300">Nome</span>
            <div className="flex items-center gap-2">
              <span className="font-medium">Fernando Gil</span>
              <ChevronRight className="w-5 h-5 text-stone-400 dark:text-stone-500" />
            </div>
          </div>
        </div>

        <div className="p-6 bg-white dark:bg-stone-800 rounded-3xl shadow-sm">
          <h2 className="text-sm font-semibold text-emerald-500 mb-4">DETALHES DA CONTA</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-stone-600 dark:text-stone-300">E-mail</span>
              <div className="flex items-center gap-2">
                <span className="font-medium">fernando.gil@gympass.com</span>
                <ChevronRight className="w-5 h-5 text-stone-400 dark:text-stone-500" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-600 dark:text-stone-300">Senha</span>
              <div className="flex items-center gap-2">
                <span className="font-medium text-emerald-500">Trocar senha</span>
                <ChevronRight className="w-5 h-5 text-stone-400 dark:text-stone-500" />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-stone-600 dark:text-stone-300">Número de celular</span>
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
            <div className="flex items-center justify-between">
              <span className="font-medium">Termos</span>
              <ChevronRight className="w-5 h-5 text-stone-400 dark:text-stone-500" />
            </div>
            <div className="flex items-center justify-between">
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
            onClick={onLogout}
            className="w-full text-center font-semibold text-emerald-500 hover:text-emerald-600 transition-colors"
          >
            Sair
          </button>
        </div>
      </main>
    </div>
  );
};
