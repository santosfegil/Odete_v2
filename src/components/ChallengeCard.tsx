import React from 'react';
import { ArrowRight } from 'lucide-react';
import { WeeklyChallenge } from '../types';

interface ChallengeCardProps {
  data: WeeklyChallenge;
  onViewAll: () => void;
  onEdit: () => void;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({ data, onViewAll, onEdit }) => {
  const percentage = Math.min((data.currentAmount / data.targetAmount) * 100, 100);
  
  // Lógica de cores da barra de progresso (verde se ok, amarelo/vermelho se perto do limite)
  const isNearLimit = percentage > 80;
  const progressColor = isNearLimit ? 'bg-yellow-500' : 'bg-emerald-500';

  return (
    <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800">
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-medium mb-1">Desafio da Semana</p>
          <h3 className="text-lg font-bold text-stone-900 dark:text-white leading-tight max-w-[180px]">
            {data.title}
          </h3>
        </div>
        <button 
          onClick={onViewAll}
          className="bg-stone-900 dark:bg-stone-700 text-white text-xs font-semibold py-1.5 px-3 rounded-full flex items-center gap-1 hover:bg-stone-800 transition-colors"
        >
          Ver todas
          <ArrowRight size={12} />
        </button>
      </div>

      {/* Valores Principais */}
      <div className="text-center mb-3">
        <div className="flex items-center justify-center gap-1">
          <span className="text-sm font-semibold text-stone-500 mt-1">R$</span>
          <span className="text-4xl font-bold text-stone-900 dark:text-white">
            {data.currentAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </span>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 font-medium mt-1">
          valor meta R$ {data.targetAmount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
        </p>
      </div>

      {/* Barra de Progresso */}
      <div className="w-full bg-stone-200 dark:bg-stone-700 h-3 rounded-full mb-4 overflow-hidden">
        <div 
          className={`h-full ${progressColor} rounded-full transition-all duration-1000`} 
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Card de Insight */}
      <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl mb-6">
        <p className="text-sm text-emerald-800 dark:text-emerald-200 text-center leading-relaxed">
          Você costuma gastar <span className="font-bold">{data.averageSpent}</span> por semana, sua meta é economizar <span className="font-bold">{data.savingTarget}</span> reais essa semana.
        </p>
      </div>

      {/* Progresso Semanal (Bolinhas) */}
      <div className="mb-6">
        <p className="text-sm text-stone-600 dark:text-stone-400 mb-3">Progresso da Semana</p>
        <div className="flex justify-between items-center">
          {data.weekProgress.map((day, index) => {
            let circleClass = "bg-stone-200 dark:bg-stone-800 text-stone-400"; // Default/Pending
            
            if (day.status === 'success') {
              circleClass = "bg-emerald-200 dark:bg-emerald-900 text-emerald-700 dark:text-emerald-300";
            } else if (day.status === 'today') {
              circleClass = "bg-emerald-500 text-white ring-2 ring-emerald-200 dark:ring-emerald-900";
            }

            return (
              <div 
                key={index} 
                className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${circleClass}`}
              >
                {day.day}
              </div>
            );
          })}
        </div>
      </div>

      {/* Botão de Ação */}
      <button 
        onClick={onEdit}
        className="w-full bg-stone-900 dark:bg-stone-100 text-white dark:text-stone-900 font-bold py-3.5 rounded-2xl hover:bg-stone-800 dark:hover:bg-stone-200 transition-colors"
      >
        Editar desafio
      </button>
    </div>
  );
};