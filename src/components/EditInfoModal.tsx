// src/components/EditInfoModal.tsx
import React, { useEffect, useState } from 'react';
import { X, Save } from 'lucide-react';

const formatPhone = (raw: string): string => {
  const digits = raw.replace(/\D/g, '').slice(0, 11);
  if (digits.length <= 2) return digits.length ? `(${digits}` : '';
  if (digits.length <= 7) return `(${digits.slice(0, 2)}) ${digits.slice(2)}`;
  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7)}`;
};

interface EditInfoModalProps {
  title: string;
  initialValue: string;
  type?: 'text' | 'email' | 'tel' | 'password';
  onSave: (value: string) => Promise<void>;
  onClose: () => void;
}

export const EditInfoModal: React.FC<EditInfoModalProps> = ({ 
  title, 
  initialValue, 
  type = 'text', 
  onSave, 
  onClose 
}) => {
  const [value, setValue] = useState(type === 'tel' ? formatPhone(initialValue || '') : initialValue);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    await onSave(value);
    setLoading(false);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
      <div className="bg-white dark:bg-stone-800 w-full max-w-sm rounded-3xl p-6 shadow-xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold text-stone-900 dark:text-white">{title}</h3>
          <button onClick={onClose}><X className="text-stone-500 hover:text-stone-700" /></button>
        </div>
        
        <input
          type={type}
          value={value}
          onChange={(e) => setValue(type === 'tel' ? formatPhone(e.target.value) : e.target.value)}
          className="w-full p-3 rounded-xl bg-stone-100 dark:bg-stone-700 border-none mb-6 focus:ring-2 focus:ring-emerald-500 outline-none text-stone-900 dark:text-white"
          autoFocus
          placeholder={type === 'tel' ? '(11) 99999-9999' : 'Digite aqui...'}
        />
        
        <button
          onClick={handleSave}
          disabled={loading}
          className="w-full bg-emerald-500 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 hover:bg-emerald-600 transition-colors disabled:opacity-50"
        >
          {loading ? 'Salvando...' : <><Save size={20} /> Salvar Alterações</>}
        </button>
      </div>
    </div>
  );
};