import { ChevronLeft, ChevronLeft as ArrowLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface MonthData {
  month: string;
  year: number;
  invested: number;
  goal: number;
  progress: number;
  message: string;
  monthlyStatus: {
    name: string;
    status: 'success' | 'warning' | 'partial';
  }[];
}

const MOCK_HISTORY: MonthData[] = [
  {
    month: 'Novembro',
    year: 2023,
    invested: 200,
    goal: 500,
    progress: 40,
    message: 'Quase lá! Você já investiu R$200,00 da sua meta de R$500,00.',
    monthlyStatus: [
      { name: 'Jan', status: 'success' },
      { name: 'Fev', status: 'success' },
      { name: 'Mar', status: 'warning' },
      { name: 'Abr', status: 'success' },
      { name: 'Mai', status: 'success' },
      { name: 'Jun', status: 'warning' },
      { name: 'Jul', status: 'success' },
      { name: 'Ago', status: 'success' },
      { name: 'Set', status: 'warning' },
      { name: 'Out', status: 'success' },
      { name: 'Nov', status: 'partial' },
      { name: 'Dez', status: 'partial' },
    ],
  },
  {
    month: '2023',
    year: 2023,
    invested: 0,
    goal: 0,
    progress: 0,
    message: 'Excelente! Você está no caminho certo com seus investimentos anuais.',
    monthlyStatus: [
      { name: 'Jan', status: 'success' },
      { name: 'Fev', status: 'success' },
      { name: 'Mar', status: 'warning' },
      { name: 'Abr', status: 'success' },
      { name: 'Mai', status: 'success' },
      { name: 'Jun', status: 'warning' },
      { name: 'Jul', status: 'success' },
      { name: 'Ago', status: 'success' },
      { name: 'Set', status: 'warning' },
      { name: 'Out', status: 'success' },
      { name: 'Nov', status: 'partial' },
      { name: 'Dez', status: 'partial' },
    ],
  },
];

interface SpendingHistoryScreenProps {
  onBack: () => void;
}

export default function SpendingHistoryScreen({ onBack }: SpendingHistoryScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(MOCK_HISTORY.length - 1, prev + 1));
  };

  const getStatusColor = (status: 'success' | 'warning' | 'partial') => {
    switch (status) {
      case 'success':
        return 'bg-emerald-400 hover:bg-emerald-500';
      case 'warning':
        return 'bg-yellow-400 hover:bg-yellow-500';
      case 'partial':
        return 'bg-stone-200 hover:bg-stone-300 dark:bg-stone-700 dark:hover:bg-stone-600';
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-white pb-8">
      <header className="bg-white dark:bg-stone-900 p-4 flex items-center shadow-sm sticky top-0 z-10">
        <button
          onClick={onBack}
          className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold ml-2">Histórico de Investimentos</h1>
      </header>

      <div className="p-6 space-y-6">
        {MOCK_HISTORY.map((data, index) => (
          <div
            key={index}
            className="bg-white dark:bg-stone-900 rounded-3xl p-6 shadow-sm"
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">{data.month}</h2>
              <div className="flex gap-2">
                <button
                  onClick={handlePrevious}
                  disabled={currentIndex === 0}
                  className="p-2 bg-stone-100 dark:bg-stone-800 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ArrowLeft size={20} />
                </button>
                <button
                  onClick={handleNext}
                  disabled={currentIndex === MOCK_HISTORY.length - 1}
                  className="p-2 bg-stone-100 dark:bg-stone-800 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            <p className="text-stone-600 dark:text-stone-400 text-sm mb-4">
              {data.message}
            </p>

            {data.invested > 0 && (
              <>
                <div className="flex justify-between items-center text-sm font-semibold mb-2">
                  <span>R${data.invested.toFixed(2)}</span>
                  <span>R${data.goal.toFixed(2)}</span>
                </div>

                <div className="w-full bg-stone-200 dark:bg-stone-800 rounded-full h-2 mb-6">
                  <div
                    className="bg-emerald-400 h-2 rounded-full transition-all"
                    style={{ width: `${data.progress}%` }}
                  ></div>
                </div>
              </>
            )}

            {index === 1 && (
              <div className="grid grid-cols-4 gap-3">
                {data.monthlyStatus.map((month, monthIndex) => (
                  <button
                    key={monthIndex}
                    className={`py-3 px-4 rounded-2xl font-semibold text-sm text-white transition-colors ${getStatusColor(
                      month.status
                    )}`}
                  >
                    {month.name}
                  </button>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
