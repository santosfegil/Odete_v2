import React, { useState } from 'react';
import { Settings, TrendingDown, Target, PiggyBank, Check, X, Calendar, DollarSign } from 'lucide-react';
import { WeeklyChallenge } from '../types';

interface ChallengeCardProps {
  data: WeeklyChallenge;
  onEdit: () => void;
}

export const ChallengeCard: React.FC<ChallengeCardProps> = ({ data, onEdit }) => {
  const [showSettings, setShowSettings] = useState(false);
  
  const percentage = Math.min((data.currentAmount / data.targetAmount) * 100, 100);
  
  // Cores baseadas no progresso
  const isNearLimit = percentage > 80;
  const isOverLimit = percentage >= 100;

  // Helper para formatar moeda
  const formatValue = (val: number) => val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Calcula dia atual
  const todayIndex = data.weekProgress.findIndex(d => d.status === 'today');
  const daysCompleted = todayIndex >= 0 ? todayIndex : data.weekProgress.length;

  // Só mostra o card de insight se tivermos os dados necessários preenchidos
  const hasInsightData = data.averageSpent > 0 && data.targetAmount > 0 && data.savingTarget > 0;

  return (
    <>
      <div className="bg-gradient-to-br from-sky-50 to-slate-100 dark:from-slate-800 dark:to-slate-900 p-4 rounded-2xl shadow-sm border border-slate-200/50 dark:border-slate-700">
        
        {/* Header */}
        <div className="flex justify-between items-start mb-3">
          <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight max-w-[200px]">
            {data.title}
          </h3>
          <button 
            onClick={() => setShowSettings(true)}
            className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 dark:text-slate-500 dark:hover:bg-slate-700/50 rounded-full transition-colors"
          >
            <Settings size={16} />
          </button>
        </div>

        {/* Valores Principais - Alinhados à esquerda */}
        <div className="mb-3">
          <div className="flex items-baseline gap-0.5">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400">R$</span>
            <span className="text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              {formatValue(data.currentAmount)}
            </span>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mt-0.5">
            Gasto de R$ {formatValue(data.targetAmount)} desejado
          </p>
        </div>

        {/* Barra de Progresso */}
        <div className="w-full bg-slate-200 dark:bg-slate-700 h-2 rounded-full mb-4 overflow-hidden">
          <div 
            className={`h-full rounded-full transition-all duration-1000 ${
              isOverLimit ? 'bg-red-500' : isNearLimit ? 'bg-orange-500' : 'bg-emerald-500'
            }`} 
            style={{ width: `${percentage}%` }}
          />
        </div>

        {/* Card de Progresso Semanal */}
        <div className="bg-white dark:bg-slate-800 rounded-xl p-3 shadow-sm border border-slate-100 dark:border-slate-700">
          <div className="flex justify-between items-center mb-2">
            <p className="text-xs text-slate-700 dark:text-slate-300 font-bold">Progresso em 7 dias</p>
            <span className="text-[10px] text-orange-600 dark:text-orange-400 font-semibold bg-orange-100 dark:bg-orange-900/30 px-2 py-0.5 rounded-full">
              Dia {daysCompleted + 1} de 7
            </span>
          </div>
          
          <div className="flex justify-between items-end gap-1">
            {data.weekProgress.map((day, index) => {
              const isToday = day.status === 'today';
              
              let circleClass = "bg-slate-100 dark:bg-slate-700 text-slate-400 border-2 border-transparent";
              let showCheck = false;
              
              if (day.status === 'success') {
                circleClass = "bg-amber-100 dark:bg-amber-900/50 text-amber-600 dark:text-amber-400 border-2 border-amber-200 dark:border-amber-700";
                showCheck = true;
              } else if (day.status === 'failed') {
                circleClass = "bg-red-100 dark:bg-red-900/30 text-red-500 border-2 border-red-200";
              } else if (isToday) {
                circleClass = "bg-slate-900 dark:bg-white text-white dark:text-slate-900 border-2 border-slate-900 dark:border-white shadow-lg";
              }

              return (
                <div key={index} className="flex flex-col items-center">
                  {isToday && (
                    <span className="text-[8px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                      Hoje
                    </span>
                  )}
                  {!isToday && <div className="h-3 mb-1" />}
                  <div 
                    className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold transition-all duration-300 ${circleClass}`}
                  >
                    {showCheck ? <Check size={14} strokeWidth={3} /> : day.day}
                  </div>
                  {/* Data do dia (discreta) */}
                  <span className="text-[8px] text-slate-400 dark:text-slate-500 mt-0.5 font-medium">
                    {day.date}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Insight Stats - Opcional */}
        {hasInsightData && (
          <div className="grid grid-cols-3 gap-1.5 mt-3">
            {/* Média */}
            <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/70 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
              <TrendingDown size={12} className="text-slate-400 mb-0.5" />
              <p className="text-[9px] font-bold text-slate-400">Média</p>
              <p className="text-xs font-bold text-slate-500 line-through decoration-red-400">
                R${formatValue(data.averageSpent)}
              </p>
            </div>

            {/* Meta */}
            <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-white/70 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-700">
              <Target size={12} className="text-slate-400 mb-0.5" />
              <p className="text-[9px] font-bold text-slate-400">Meta</p>
              <p className="text-xs font-bold text-slate-900 dark:text-white">
                R${formatValue(data.targetAmount)}
              </p>
            </div>

            {/* Economia */}
            <div className="flex flex-col items-center justify-center p-2 rounded-lg bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-100 dark:border-emerald-800">
              <PiggyBank size={12} className="text-emerald-500 mb-0.5" />
              <p className="text-[9px] font-bold text-emerald-600/70">Economia</p>
              <p className="text-xs font-extrabold text-emerald-600">
                +R${formatValue(data.savingTarget)}
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Modal de Configurações */}
      {showSettings && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white dark:bg-slate-900 rounded-3xl w-full max-w-sm shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">Configurações do Desafio</h3>
              <button 
                onClick={() => setShowSettings(false)}
                className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors"
              >
                <X size={20} className="text-slate-500" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              {/* Título */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Nome do desafio</p>
                <p className="text-lg font-bold text-slate-900 dark:text-white">{data.title}</p>
              </div>

              {/* Descrição (se existir) */}
              {data.description && (
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Descrição</p>
                  <p className="text-sm text-slate-700 dark:text-slate-300">{data.description}</p>
                </div>
              )}
              {/* Valores em Grid */}
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <DollarSign size={14} className="text-slate-400" />
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Gasto atual</p>
                  </div>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">R$ {formatValue(data.currentAmount)}</p>
                </div>
                
                <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                  <div className="flex items-center gap-2 mb-1">
                    <Target size={14} className="text-slate-400" />
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Limite</p>
                  </div>
                  <p className="text-xl font-bold text-slate-900 dark:text-white">R$ {formatValue(data.targetAmount)}</p>
                </div>
              </div>

              {/* Progresso */}
              <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Calendar size={14} className="text-slate-400" />
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">Progresso</p>
                </div>
                <div className="flex justify-between items-center">
                  <p className="text-lg font-bold text-slate-900 dark:text-white">Dia {daysCompleted + 1} de 7</p>
                  <span className={`text-sm font-bold px-3 py-1 rounded-full ${
                    percentage < 50 ? 'bg-emerald-100 text-emerald-600' : 
                    percentage < 80 ? 'bg-amber-100 text-amber-600' : 
                    'bg-red-100 text-red-600'
                  }`}>
                    {percentage.toFixed(0)}% da meta gasto
                  </span>
                </div>
              </div>

              {/* Estatísticas */}
              {hasInsightData && (
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-slate-50 dark:bg-slate-800 rounded-xl p-4">
                    <p className="text-xs text-slate-500 dark:text-slate-400 font-medium mb-1">Média anterior</p>
                    <p className="text-lg font-bold text-slate-500 line-through">R$ {formatValue(data.averageSpent)}</p>
                  </div>
                  
                  <div className="bg-emerald-50 dark:bg-emerald-900/30 rounded-xl p-4">
                    <p className="text-xs text-emerald-600 font-medium mb-1">Economia estimada</p>
                    <p className="text-lg font-bold text-emerald-600">+R$ {formatValue(data.savingTarget)}</p>
                  </div>
                </div>
              )}
            </div>

            <div className="p-6 pt-0">
              <button 
                onClick={() => setShowSettings(false)}
                className="w-full py-3 bg-slate-900 dark:bg-slate-700 hover:bg-slate-800 text-white rounded-xl font-bold transition-colors"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};