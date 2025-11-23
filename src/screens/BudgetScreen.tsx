import React, { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { BudgetCategoryCard } from '../components/BudgetCategoryCard';
import { BudgetCategory } from '../types';

interface BudgetScreenProps {
  onBack: () => void;
}

const INITIAL_CATEGORIES: BudgetCategory[] = [
  {
    id: '1',
    name: 'Alimentação',
    icon: 'restaurant',
    budget: 800,
    spent: 450,
    remaining: 350,
  },
  {
    id: '2',
    name: 'Transporte',
    icon: 'directions_bus',
    budget: 200,
    spent: 150,
    remaining: 50,
  },
  {
    id: '3',
    name: 'Lazer',
    icon: 'local_movies',
    budget: 300,
    spent: 0,
    remaining: 300,
  },
  {
    id: '4',
    name: 'Moradia',
    icon: 'home',
    budget: 1500,
    spent: 1500,
    remaining: 0,
  },
  {
    id: '5',
    name: 'Compras',
    icon: 'shopping_bag',
    budget: 200,
    spent: 250,
    remaining: -50,
  },
];

export const BudgetScreen: React.FC<BudgetScreenProps> = ({ onBack }) => {
  const [categories, setCategories] = useState<BudgetCategory[]>(INITIAL_CATEGORIES);

  const handleBudgetChange = (id: string, newBudget: number) => {
    setCategories((prev) =>
      prev.map((cat) =>
        cat.id === id
          ? { ...cat, budget: newBudget, remaining: newBudget - cat.spent }
          : cat
      )
    );
  };

  const handleSave = () => {
    console.log('Orçamento salvo:', categories);
    onBack();
  };

  return (
    <div className="mx-auto flex h-screen max-w-md flex-col bg-background-light dark:bg-background-dark">
      <header className="flex items-center justify-between p-6">
        <button
          onClick={onBack}
          className="flex h-10 w-10 items-center justify-center rounded-full text-stone-600 hover:bg-stone-200/60 dark:text-stone-300 dark:hover:bg-stone-800/60 transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Definir Orçamento</h1>
        <div className="w-10"></div>
      </header>

      <main className="flex-grow overflow-y-auto px-6">
        <div className="space-y-4">
          {categories.map((category) => (
            <BudgetCategoryCard
              key={category.id}
              category={category}
              onBudgetChange={handleBudgetChange}
            />
          ))}
        </div>
      </main>

      <footer className="p-6">
        <button
          onClick={handleSave}
          className="w-full rounded-3xl bg-stone-900 py-4 text-center font-bold text-white transition-colors hover:bg-stone-800 dark:bg-emerald-600 dark:hover:bg-emerald-500"
        >
          Salvar Orçamento
        </button>
      </footer>
    </div>
  );
};

export default BudgetScreen;
