import React, { useState } from 'react';
import { ArrowLeft, Share2 } from 'lucide-react';
import MedalDetailModal from '../components/MedalDetailModal';
import { useAchievements } from '../lib/useAchievements';
import { getIconComponent } from '../lib/iconMap';

interface AllMedalsScreenProps {
  onBack: () => void;
}

// Mapa para traduzir as categorias do banco (inglês) para exibição (português)
const CATEGORY_LABELS: Record<string, string> = {
  saver: 'Medalhas de poupador',
  investor: 'Medalhas de investidor',
  goals: 'Medalhas de metas'
};

export default function AllMedalsScreen({ onBack }: AllMedalsScreenProps) {
  const [selectedMedal, setSelectedMedal] = useState<any | null>(null);
  const { medals, loading } = useAchievements();

  // Agrupa as medalhas por categoria dinamicamente
  // Mapeamos as chaves fixas para garantir a ordem de exibição
  const categories = ['saver', 'investor', 'goals'].map(catKey => ({
    key: catKey,
    title: CATEGORY_LABELS[catKey],
    items: medals.filter(m => m.category === catKey)
  }));

  return (
    <div className="flex-1 overflow-y-auto bg-stone-50 dark:bg-stone-900 min-h-screen">
      <header className="flex items-center justify-between p-6 pb-8 sticky top-0 bg-stone-50 dark:bg-stone-900 z-10">
        <button onClick={onBack} className="text-stone-900 dark:text-stone-100 p-2 -ml-2 hover:bg-stone-200 dark:hover:bg-stone-800 rounded-full transition-colors">
          <ArrowLeft size={28} />
        </button>
        <h1 className="text-xl font-bold text-stone-900 dark:text-stone-100 absolute left-1/2 -translate-x-1/2">
          Minhas medalhas
        </h1>
        <div className="w-8"></div>
      </header>

      <main className="space-y-10 pb-24">
        {loading ? (
             <div className="text-center mt-20">
                <p className="text-stone-500 animate-pulse">Carregando catálogo de medalhas...</p>
             </div>
        ) : (
            categories.map((category) => (
            <section key={category.key}>
                <h2 className="text-lg font-semibold text-stone-900 dark:text-stone-100 mb-4 px-6">
                {category.title}
                </h2>
                {category.items.length === 0 && (
                    <p className="px-6 text-sm text-stone-400">Nenhuma medalha nesta categoria ainda.</p>
                )}
                <div className="flex overflow-x-auto space-x-4 pl-6 pr-6 pb-4 no-scrollbar">
                {category.items.map((medal) => (
                    <button
                    key={medal.id}
                    onClick={() => setSelectedMedal({
                        id: medal.id,
                        name: medal.title,
                        description: medal.description,
                        icon: medal.icon_slug,
                        earned: medal.earned
                    })}
                    className={`w-28 flex-shrink-0 rounded-3xl p-4 flex flex-col items-center justify-center text-center aspect-square relative transition-all active:scale-95 ${
                        medal.earned
                        ? 'bg-white dark:bg-stone-800 shadow-sm border border-transparent'
                        : 'bg-stone-100 dark:bg-stone-800/50 grayscale opacity-70 border border-stone-200 dark:border-stone-700'
                    }`}
                    >
                    <button
                        className={`absolute top-3 right-3 ${
                        medal.earned
                            ? 'text-stone-500 dark:text-stone-400'
                            : 'text-stone-400 dark:text-stone-600'
                        }`}
                    >
                        <Share2 size={16} />
                    </button>
                    
                    <div className={`mb-2 ${medal.earned ? 'text-yellow-400' : 'text-stone-400'}`}>
                        {/* Renderiza o ícone dinamicamente baseado no slug */}
                        {getIconComponent(medal.icon_slug, '', 32)}
                    </div>
                    
                    <p
                        className={`text-xs font-medium leading-tight line-clamp-2 ${
                        medal.earned
                            ? 'text-stone-700 dark:text-stone-300'
                            : 'text-stone-400 dark:text-stone-500'
                        }`}
                    >
                        {medal.title}
                    </p>
                    </button>
                ))}
                </div>
            </section>
            ))
        )}
      </main>

      {selectedMedal && (
        <MedalDetailModal 
            medal={selectedMedal} 
            onClose={() => setSelectedMedal(null)} 
        />
      )}
    </div>
  );
}