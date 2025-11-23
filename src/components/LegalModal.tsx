// src/components/LegalModal.tsx
import React from 'react';
import { X } from 'lucide-react';

interface LegalModalProps {
  title: string;
  content: React.ReactNode;
  onClose: () => void;
}

export const LegalModal: React.FC<LegalModalProps> = ({ title, content, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-stone-800 w-full max-w-md h-[80vh] rounded-3xl p-6 shadow-xl flex flex-col animate-in slide-in-from-bottom-10 duration-200">
        <div className="flex justify-between items-center mb-4 flex-shrink-0">
          <h3 className="text-lg font-bold text-stone-900 dark:text-white">{title}</h3>
          <button onClick={onClose}><X className="text-stone-500 hover:text-stone-700" /></button>
        </div>
        <div className="overflow-y-auto flex-grow text-sm text-stone-600 dark:text-stone-300 space-y-4 pr-2 leading-relaxed">
          {content}
        </div>
      </div>
    </div>
  );
};