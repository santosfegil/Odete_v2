import React from 'react';
import { Check } from 'lucide-react';
import { NextStepTask } from '../types';

interface NextStepsProps {
  tasks: NextStepTask[];
  onToggleTask: (id: string) => void;
}

export const NextSteps: React.FC<NextStepsProps> = ({ tasks, onToggleTask }) => {
  const completedCount = tasks.filter((t) => t.completed).length;
  const totalCount = tasks.length;

  return (
    <div className="p-6 pt-0 mt-8">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-xl font-bold text-stone-900 dark:text-stone-100">
          Próximos passos
        </h3>
        <span className="rounded-md bg-stone-200 px-2 py-1 text-xs font-bold text-stone-500 dark:bg-stone-800 dark:text-stone-400">
          {completedCount}/{totalCount} completo
        </span>
      </div>

      <div className="space-y-3">
        {tasks.map((task) => (
          <button
            key={task.id}
            onClick={() => onToggleTask(task.id)}
            className={`group flex w-full items-center rounded-2xl p-4 text-left transition-all duration-200 ${
                task.completed 
                ? 'bg-stone-100 dark:bg-stone-800/50' 
                : 'bg-stone-100 dark:bg-stone-800/50 hover:bg-stone-200 dark:hover:bg-stone-800'
            }`}
          >
            <div
              className={`mr-4 flex h-8 w-8 items-center justify-center rounded-full transition-colors duration-300 ${
                task.completed
                  ? 'bg-emerald-100 dark:bg-emerald-900'
                  : 'bg-stone-200 dark:bg-stone-700 group-hover:bg-stone-300 dark:group-hover:bg-stone-600'
              }`}
            >
              {task.completed && (
                <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              )}
            </div>
            <span
              className={`font-semibold transition-colors ${
                task.completed
                  ? 'text-stone-800 dark:text-stone-200'
                  : 'text-stone-500 dark:text-stone-400'
              }`}
            >
              {task.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
};