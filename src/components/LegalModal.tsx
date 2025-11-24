import React from 'react';

interface LegalModalProps {
  title: string;
  content: React.ReactNode;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ title, content, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-stone-800 w-full max-w-md h-[80vh] rounded-3xl p-6 shadow-xl flex flex-col">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h3 className="text-lg font-bold text-stone-900 dark:text-white">{title}</h3>
          {/* Botão simples de texto para evitar erros de ícone */}
          <button 
            onClick={onClose}
            className="text-stone-500 font-bold px-2 py-1 hover:bg-stone-100 rounded"
          >
            FECHAR
          </button>
        </div>
        <div className="overflow-y-auto flex-grow text-sm text-stone-600 dark:text-stone-300 space-y-4 pr-2">
          {content}
        </div>
      </div>
    </div>
  );
};