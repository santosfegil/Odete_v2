import React from 'react';
import { BudgetCategory } from '../types';

interface BudgetCategoryCardProps {
  category: BudgetCategory;
  onBudgetChange: (id: string, value: number) => void;
}

export const BudgetCategoryCard: React.FC<BudgetCategoryCardProps> = ({ category, onBudgetChange }) => {
  const percentage = category.budget > 0 ? (category.spent / category.budget) * 100 : 0;
  const isOverBudget = percentage > 100;
  const isNearLimit = percentage >= 100 && !isOverBudget;
  const isOnTrack = percentage < 100;

  let progressColor = 'bg-emerald-500';
  let statusText = `Restante: R$ ${category.remaining.toFixed(2)}`;
  let statusColor = 'text-stone-500 dark:text-stone-400';

  if (isOverBudget) {
    progressColor = 'bg-red-500';
    statusText = `Acima R$ ${Math.abs(category.remaining).toFixed(2)}`;
    statusColor = 'text-red-500 dark:text-red-400';
  } else if (isNearLimit) {
    progressColor = 'bg-yellow-500';
  }

  return (
    <div className="rounded-3xl bg-stone-100 p-4 dark:bg-stone-800/50">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-emerald-100 dark:bg-emerald-900/50">
            <span className="material-icons-outlined text-emerald-600 dark:text-emerald-400">
              {category.icon}
            </span>
          </div>
          <div>
            <p className="font-semibold">{category.name}</p>
            <p className={`text-sm ${statusColor}`}>{statusText}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="font-semibold text-stone-500 dark:text-stone-400">R$</span>
          <input
            className="w-24 rounded-lg border-stone-300 bg-white p-2 text-right font-semibold text-stone-900 dark:border-stone-600 dark:bg-stone-700 dark:text-stone-100 dark:placeholder-stone-400 focus:border-emerald-500 focus:ring-emerald-500"
            type="number"
            value={category.budget}
            onChange={(e) => onBudgetChange(category.id, parseFloat(e.target.value) || 0)}
          />
        </div>
      </div>
      <div className="mt-3 h-2 w-full rounded-full bg-stone-200 dark:bg-stone-700">
        <div
          className={`h-2 rounded-full ${progressColor}`}
          style={{ width: `${Math.min(percentage, 100)}%` }}
        ></div>
      </div>
    </div>
  );
};
