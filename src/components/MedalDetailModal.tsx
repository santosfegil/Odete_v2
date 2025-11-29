import React from 'react';
import { X, Share2, Lock } from 'lucide-react';
import { getIconComponent } from '../lib/iconMap';

interface MedalDetailModalProps {
  medal: {
    id: string;
    name: string;
    icon: string;
    description: string;
    earned?: boolean; // Esta propriedade determina o estilo
  };
  onClose: () => void;
}

export default function MedalDetailModal({ medal, onClose }: MedalDetailModalProps) {
  // Verificação de segurança: se earned vier undefined, assumimos false
  const isEarned = !!medal.earned;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6 animate-in fade-in duration-200">
      <div className="relative flex w-full max-w-sm flex-col items-center gap-4 rounded-3xl bg-white p-6 pt-10 shadow-lg dark:bg-stone-800 transition-all">
        
        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-700 transition-colors"
        >
          <X size={24} />
        </button>

        <div className="flex w-full flex-col items-center gap-4">
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 text-center leading-tight">
            {medal.name}
          </h1>

          {/* Círculo do Ícone: Condicional (Amarelo se ganhou, Cinza se não) */}
          <div className={`relative flex h-32 w-32 items-center justify-center rounded-full transition-colors duration-300 ${
            isEarned 
              ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-500 dark:text-yellow-400' 
              : 'bg-stone-100 dark:bg-stone-800 text-stone-300 dark:text-stone-600 grayscale'
          }`}>
            {getIconComponent(medal.icon, '', 64)}
          </div>

          <p className="text-base font-normal leading-relaxed text-stone-600 dark:text-stone-300 text-center">
            {medal.description}
          </p>
        </div>

        {/* Rodapé: Botão Compartilhar OU Indicador de Bloqueado */}
        {isEarned ? (
          <button 
            onClick={() => console.log("Compartilhar", medal.name)}
            className="flex h-12 w-full min-w-[84px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full bg-stone-900 px-5 text-base font-bold leading-normal text-white hover:bg-stone-800 transition-colors dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200"
          >
            <Share2 size={20} />
            <span className="truncate">Compartilhar Medalha</span>
          </button>
        ) : (
          <div className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-stone-100 text-stone-400 dark:bg-stone-800 dark:text-stone-500">
            <Lock size={18} />
            <span className="text-sm font-bold">Bloqueado</span>
          </div>
        )}
      </div>
    </div>
  );
}