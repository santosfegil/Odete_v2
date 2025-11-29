import React from 'react';
import { Settings, TrendingDown, Target, PiggyBank } from 'lucide-react';
import { WeeklyChallenge } from '../types';

interface ChallengeCardProps {
  data: WeeklyChallenge;
  onEdit: () => void;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({ data, onEdit }) => {
  const percentage = Math.min((data.currentAmount / data.targetAmount) * 100, 100);
  
  // Cores da barra
  const isNearLimit = percentage > 80;
  const progressColor = isNearLimit ? 'bg-yellow-500' : 'bg-emerald-500';

  // Helper para formatar moeda (com 2 casas decimais fixas)
  const formatValue = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Só mostra o card de insight se tivermos os dados necessários preenchidos
  const hasInsightData = data.averageSpent > 0 && data.targetAmount > 0 && data.savingTarget > 0;

  return (
    <div className="bg-white dark:bg-stone-900 p-6 rounded-3xl shadow-sm border border-stone-100 dark:border-stone-800">
      
      {/* Header */}
      <div className="flex justify-between items-start mb-4">
        <div>
          <p className="text-xs text-stone-500 dark:text-stone-400 font-medium mb-1">Desafio da Semana</p>
          <h3 className="text-lg font-bold text-stone-900 dark:text-white leading-tight max-w-[200px]">
            {data.title}
          </h3>
        </div>
        
        <button 
          onClick={onEdit}
          className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 dark:text-stone-500 dark:hover:text-stone-300 dark:hover:bg-stone-800 rounded-full transition-colors"
        >
          <Settings size={20} />
        </button>
      </div>

      {/* Valores Principais (Card Grande) */}
      <div className="text-center mb-3">
        <div className="flex items-center justify-center gap-1">
          <span className="text-sm font-semibold text-stone-500 mt-1">R$</span>
          <span className="text-4xl font-bold text-stone-900 dark:text-white">
            {formatValue(data.currentAmount)}
          </span>
        </div>
        <p className="text-xs text-stone-500 dark:text-stone-400 font-medium mt-1">
          de R$ {formatValue(data.targetAmount)} permitidos
        </p>
      </div>

      {/* Barra */}
      <div className="w-full bg-stone-200 dark:bg-stone-700 h-3 rounded-full mb-6 overflow-hidden">
        <div 
          className={`h-full ${progressColor} rounded-full transition-all duration-1000`} 
          style={{ width: `${percentage}%` }}
        />
      </div>

      {/* Insight (Stats com Centavos) */}
      {hasInsightData && (
        <div className="grid grid-cols-3 gap-2 mb-6">
          {/* Média */}
          <div className="flex flex-col items-center justify-center p-2 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700">
            <div className="text-stone-400 mb-1"><TrendingDown size={14} /></div>
            <p className="text-[10px]  font-bold text-stone-400 tracking-wide">Média</p>
            <p className="text-sm font-bold text-stone-600 dark:text-stone-300 line-through decoration-red-400 decoration-2">
              <span className="text-xs mr-0.5">R$</span>{formatValue(data.averageSpent)}
            </p>
          </div>

          {/* Meta */}
          <div className="flex flex-col items-center justify-center p-2 rounded-2xl bg-stone-50 dark:bg-stone-800 border border-stone-100 dark:border-stone-700">
            <div className="text-stone-400 mb-1"><Target size={14} /></div>
            <p className="text-[10px]  font-bold text-stone-400 tracking-wide">Meta</p>
            <p className="text-sm font-bold text-stone-900 dark:text-white">
              <span className="text-xs mr-0.5">R$</span>{formatValue(data.targetAmount)}
            </p>
          </div>

          {/* Economia */}
          <div className="flex flex-col items-center justify-center p-2 rounded-2xl bg-emerald-50 dark:bg-emerald-900/30 border border-emerald-100 dark:border-emerald-800">
            <div className="text-emerald-500 mb-1"><PiggyBank size={14} /></div>
            <p className="text-[10px]  font-bold text-emerald-600/70 dark:text-emerald-400 tracking-wide">Economia</p>
            <p className="text-sm font-extrabold text-emerald-600 dark:text-emerald-400">
              <span className="text-xs mr-0.5">+R$</span>{formatValue(data.savingTarget)}
            </p>
          </div>
        </div>
      )}

      {/* Progresso Semanal */}
      <div>
        <p className="text-sm text-stone-600 dark:text-stone-400 mb-3 font-medium">Progresso Diário</p>
        <div className="flex justify-between items-center pt-4"> 
          {data.weekProgress.map((day, index) => {
            const isToday = day.status === 'today';
            let circleClass = "bg-stone-100 dark:bg-stone-800 text-stone-400"; 
            
            if (day.status === 'success') {
              circleClass = "bg-emerald-100 dark:bg-emerald-900/50 text-emerald-600 dark:text-emerald-400";
            } else if (day.status === 'failed') {
              circleClass = "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400";
            } else if (isToday) {
              circleClass = "bg-stone-900 dark:bg-white text-white dark:text-stone-900 shadow-md transform -translate-y-1";
            }

            return (
              <div key={index} className="relative flex flex-col items-center group">
                {isToday && (
                  <span className="absolute -top-6 text-[9px] font-bold text-stone-900 dark:text-white  tracking-wider animate-bounce">
                    Hoje
                  </span>
                )}
                <div 
                  className={`w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${circleClass}`}
                >
                  {day.day}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};