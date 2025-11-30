import React, { useState, useEffect } from 'react';
import { X, Save, Database } from 'lucide-react';
import { SystemPrompts } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  prompts: SystemPrompts;
  onSave: (newPrompts: SystemPrompts) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, prompts, onSave }) => {
  const [localPrompts, setLocalPrompts] = useState<SystemPrompts>(prompts);
  const [activeTab, setActiveTab] = useState<'mimar' | 'julgar'>('mimar');

  useEffect(() => {
    setLocalPrompts(prompts);
  }, [prompts, isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden">
        <div className="bg-emerald-600 p-4 flex justify-between items-center text-white">
          <div className="flex items-center gap-2">
            <Database size={20} />
            <h2 className="font-semibold text-lg">Configurar Prompts (Tabela de Dados)</h2>
          </div>
          <button onClick={onClose} className="hover:bg-emerald-700 p-1 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-4">
          <p className="text-xs text-gray-500 mb-4">
            Edite as instruções do sistema para cada personalidade da Odete. 
            Esses dados seriam carregados da sua tabela de banco de dados.
          </p>

          <div className="flex gap-2 mb-4 bg-gray-100 p-1 rounded-lg">
            <button
              onClick={() => setActiveTab('mimar')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'mimar' 
                  ? 'bg-white text-emerald-600 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              😇 Mimar Mode
            </button>
            <button
              onClick={() => setActiveTab('julgar')}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                activeTab === 'julgar' 
                  ? 'bg-white text-red-500 shadow-sm' 
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              🔥 Julgar Mode
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">
              Prompt do Sistema
            </label>
            <textarea
              className="w-full h-48 p-3 border border-gray-300 rounded-xl text-sm focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none resize-none"
              value={activeTab === 'mimar' ? localPrompts.mimar : localPrompts.julgar}
              onChange={(e) => setLocalPrompts(prev => ({
                ...prev,
                [activeTab]: e.target.value
              }))}
            />
          </div>
        </div>

        <div className="p-4 bg-gray-50 flex justify-end">
          <button
            onClick={() => onSave(localPrompts)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-4 py-2 rounded-xl text-sm font-medium transition-colors"
          >
            <Save size={16} />
            Salvar Alterações
          </button>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
