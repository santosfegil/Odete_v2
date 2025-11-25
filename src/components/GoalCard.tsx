import React from 'react';
import { Umbrella, Link } from 'lucide-react';

interface GoalCardProps {
  title: string;
  targetAmount: number;
  currentAmount: number;
  progress: number;
  isAutomated: boolean;
  linkedAccountName?: string;
  onClick?: () => void;
}

export const GoalCard: React.FC<GoalCardProps> = ({
  title,
  targetAmount,
  currentAmount,
  progress,
  isAutomated,
  linkedAccountName,
  onClick
}) => {
  return (
    <button 
      onClick={onClick}
      className="w-full bg-white dark:bg-stone-800 rounded-2xl p-4 shadow-sm border border-stone-100 dark:border-stone-700 transition-transform active:scale-[0.99] flex items-center gap-4"
    >
      {/* Ícone Circular à Esquerda (Fixo) */}
      <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900/30 rounded-full flex items-center justify-center flex-shrink-0 text-emerald-600 dark:text-emerald-400">
        <Umbrella size={20} />
      </div>

      {/* Conteúdo à Direita (Flexível) */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        
        {/* Linha 1: Título e Porcentagem */}
        <div className="flex justify-between items-center mb-1.5">
          <div className="flex items-center gap-2 min-w-0">
            <h3 className="font-bold text-stone-900 dark:text-white text-sm truncate leading-tight">
              {title}
            </h3>
            {isAutomated && (
              <span className="flex-shrink-0 text-[9px] bg-emerald-50 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 px-1.5 py-0.5 rounded font-bold flex items-center gap-0.5">
                <Link size={8} />
                AUTO
              </span>
            )}
          </div>
          <span className="text-xs font-semibold text-stone-500 dark:text-stone-400 whitespace-nowrap ml-2">
            {Math.round(progress)}%
          </span>
        </div>

        {/* Linha 2: Barra de Progresso */}
        <div className="h-2 w-full bg-stone-100 dark:bg-stone-700 rounded-full overflow-hidden mb-1">
          <div 
            className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>

        {/* Linha 3: Valores Financeiros (Alinhado à direita como no print) */}
        <div className="flex justify-end">
          <p className="text-[10px] font-medium text-stone-500 dark:text-stone-400">
            R${currentAmount.toLocaleString('pt-BR', { maximumFractionDigits: 0 })} / 
            <span className="text-stone-400 dark:text-stone-600 ml-0.5">
               R${targetAmount.toLocaleString('pt-BR', { maximumFractionDigits: 0 })}
            </span>
          </p>
        </div>

      </div>
    </button>
  );
};