import React from 'react';
import { X } from 'lucide-react';

interface LegalModalProps {
  title: string;
  content: React.ReactNode;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ title, content, onClose }) => {
  return (
    // 1. Fundo Escuro: Mude 'bg-black/50' para ficar mais claro ou mais escuro
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      
      {/* 2. Tamanho e Cor da Janela: 
          - 'max-w-md' define a largura. Use 'max-w-lg' ou 'max-w-xl' para ficar maior.
          - 'h-[80vh]' define a altura (80% da tela). Mude para 'h-auto' se quiser que ajuste ao texto.
          - 'rounded-3xl' é o arredondamento das bordas.
      */}
      <div className="bg-white dark:bg-stone-800 w-full max-w-md h-[80vh] rounded-3xl p-6 shadow-xl flex flex-col">
        
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          {/* 3. Título: Mude o tamanho da fonte em 'text-lg' */}
          <h3 className="text-lg font-bold text-stone-900 dark:text-white">{title}</h3>
          
          {/* Botão Fechar (X) */}
          <button onClick={onClose}><X className="text-stone-500 hover:text-stone-700" /></button>
        </div>

        {/* 4. Área do Texto: 
            - 'text-sm' é o tamanho da letra. Mude para 'text-base' se achar pequeno.
            - 'space-y-4' é o espaçamento entre parágrafos.
        */}
        <div className="overflow-y-auto flex-grow text-sm text-stone-600 dark:text-stone-300 space-y-4 pr-2">
          {content}
        </div>
      </div>
    </div>
  );
};