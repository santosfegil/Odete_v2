import { Home, MessageCircle, Wallet } from 'lucide-react';
import type { Screen } from '../types';

interface TabBarProps {
  activeTab: Screen;
  onTabChange: (tab: Screen) => void;
}

export default function TabBar({ activeTab, onTabChange }: TabBarProps) {
  const tabs: { id: Screen; icon: typeof Home; label: string }[] = [
    { id: 'home', icon: Home, label: 'Início' },
    { id: 'chat', icon: MessageCircle, label: 'Odete' },
    { id: 'wallet', icon: Wallet, label: 'Carteira' },
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 flex justify-center pb-2 px-4">
      <div className="bg-white/95 backdrop-blur-md border border-stone-200 shadow-lg rounded-full px-6 py-3 flex gap-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-full transition-all ${
                isActive
                  ? 'bg-stone-900 text-white'
                  : 'text-stone-400 hover:text-stone-600'
              }`}
            >
              <Icon size={20} />
              {isActive && (
                <span className="text-sm font-medium">{tab.label}</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
