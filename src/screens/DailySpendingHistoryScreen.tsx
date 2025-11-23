import { ChevronLeft, ArrowLeft, ChevronRight } from 'lucide-react';
import { useState } from 'react';

interface WeekStatus {
  week: string;
  dateRange: string;
  status: 'success' | 'warning' | 'empty' | 'current';
}

interface MonthStatus {
  month: string;
  status: 'success' | 'warning' | 'empty' | 'current';
}

interface SpendingData {
  title: string;
  year: number;
  message: string;
  messageColor: string;
  items: WeekStatus[] | MonthStatus[];
  isMonthView: boolean;
}

const MOCK_SPENDING_HISTORY: SpendingData[] = [
  {
    title: 'Novembro',
    year: 2023,
    message: 'Sucesso! Você poupou R$ 20,00 reais acima do esperado.',
    messageColor: 'text-emerald-500',
    isMonthView: false,
    items: [
      { week: 'S1', dateRange: '01-05', status: 'success' },
      { week: 'S2', dateRange: '06-12', status: 'warning' },
      { week: 'S3', dateRange: '13-19', status: 'success' },
      { week: 'S4', dateRange: '20-26', status: 'current' },
      { week: 'S5', dateRange: '27-30', status: 'empty' },
    ] as WeekStatus[],
  },
  {
    title: '2023',
    year: 2023,
    message: 'Parabéns! Você está dentro do orçamento anual.',
    messageColor: 'text-emerald-500',
    isMonthView: true,
    items: [
      { month: 'Jan', status: 'success' },
      { month: 'Fev', status: 'success' },
      { month: 'Mar', status: 'warning' },
      { month: 'Abr', status: 'success' },
      { month: 'Mai', status: 'success' },
      { month: 'Jun', status: 'warning' },
      { month: 'Jul', status: 'success' },
      { month: 'Ago', status: 'success' },
      { month: 'Set', status: 'warning' },
      { month: 'Out', status: 'success' },
      { month: 'Nov', status: 'current' },
      { month: 'Dez', status: 'empty' },
    ] as MonthStatus[],
  },
];

interface DailySpendingHistoryScreenProps {
  onBack: () => void;
}

export default function DailySpendingHistoryScreen({ onBack }: DailySpendingHistoryScreenProps) {
  const [currentIndex, setCurrentIndex] = useState(0);

  const handlePrevious = () => {
    setCurrentIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNext = () => {
    setCurrentIndex((prev) => Math.min(MOCK_SPENDING_HISTORY.length - 1, prev + 1));
  };

  const getStatusColor = (status: 'success' | 'warning' | 'empty' | 'current') => {
    switch (status) {
      case 'success':
        return 'bg-emerald-500 hover:bg-emerald-600 text-white';
      case 'warning':
        return 'bg-yellow-400 hover:bg-yellow-500 text-white';
      case 'empty':
        return 'bg-stone-200 hover:bg-stone-300 dark:bg-stone-700 dark:hover:bg-stone-600 text-stone-500 dark:text-stone-400';
      case 'current':
        return 'bg-white dark:bg-stone-800 border-2 border-emerald-500 text-emerald-500 hover:bg-stone-50 dark:hover:bg-stone-700';
    }
  };

  const currentData = MOCK_SPENDING_HISTORY[currentIndex];

  return (
    <div className="min-h-screen bg-stone-50 dark:bg-stone-950 text-stone-900 dark:text-white pb-8">
      <header className="bg-white dark:bg-stone-900 p-4 flex items-center shadow-sm sticky top-0 z-10">
        <button
          onClick={onBack}
          className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-full transition-colors"
        >
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-lg font-bold ml-2">Histórico de Gastos</h1>
      </header>

      <div className="p-6 space-y-6">
        {MOCK_SPENDING_HISTORY.map((data, index) => (
          <div key={index} className="bg-white dark:bg-stone-900 rounded-3xl p-6 shadow-sm">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold">{data.title}</h2>
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
                  disabled={currentIndex === MOCK_SPENDING_HISTORY.length - 1}
                  className="p-2 bg-stone-100 dark:bg-stone-800 rounded-full hover:bg-stone-200 dark:hover:bg-stone-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <ChevronRight size={20} />
                </button>
              </div>
            </div>

            <p className={`${data.messageColor} text-sm mb-6 font-medium`}>
              {data.message}
            </p>

            {!data.isMonthView ? (
              <div className="flex justify-between gap-3">
                {(data.items as WeekStatus[]).map((week, weekIndex) => (
                  <div key={weekIndex} className="flex flex-col items-center flex-1">
                    <button
                      className={`w-full aspect-square rounded-full font-semibold text-sm transition-colors flex items-center justify-center mb-2 ${getStatusColor(
                        week.status
                      )}`}
                    >
                      {week.week}
                    </button>
                    <span className="text-xs text-stone-500 dark:text-stone-400">{week.dateRange}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-4 gap-3">
                {(data.items as MonthStatus[]).map((month, monthIndex) => (
                  <button
                    key={monthIndex}
                    className={`py-3 px-4 rounded-2xl font-semibold text-sm transition-colors ${getStatusColor(
                      month.status
                    )}`}
                  >
                    {month.month}
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
