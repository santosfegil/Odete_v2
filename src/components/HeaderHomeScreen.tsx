import React, { useState, useRef, useEffect } from 'react';
import { User, LogOut } from 'lucide-react';

interface HeaderProps {
  activeTab: 'gastos' | 'investimentos';
  onTabChange: (tab: 'gastos' | 'investimentos') => void;
  onShowProfile: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onTabChange, onShowProfile }) => {
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleProfileClick = () => {
    onShowProfile();
    setShowMenu(false);
  };

  const handleLogout = () => {
    console.log('Sair da aplicação');
    setShowMenu(false);
  };

  return (
    <header className="flex items-center justify-between p-6">
      <div className="relative flex w-full max-w-xs items-center justify-center rounded-full bg-stone-200 dark:bg-stone-800 p-1">
        {/* Sliding background pill */}
        <div
          className={`absolute top-1 h-[calc(100%-0.5rem)] w-[calc(50%-0.25rem)] rounded-full bg-white dark:bg-stone-900 shadow-md transition-all duration-300 ease-in-out ${
            activeTab === 'gastos' ? 'left-1' : 'left-[50%]'
          }`}
        ></div>

        <button
          onClick={() => onTabChange('gastos')}
          className={`relative z-10 flex-1 rounded-full py-2 text-center text-sm transition-colors ${
            activeTab === 'gastos'
              ? 'font-bold text-stone-900 dark:text-stone-100'
              : 'font-medium text-stone-500 dark:text-stone-400'
          }`}
        >
          Gastos
        </button>
        <button
          onClick={() => onTabChange('investimentos')}
          className={`relative z-10 flex-1 rounded-full py-2 text-center text-sm transition-colors ${
            activeTab === 'investimentos'
              ? 'font-bold text-stone-900 dark:text-stone-100'
              : 'font-medium text-stone-500 dark:text-stone-400'
          }`}
        >
          Investimentos
        </button>
      </div>
      <div className="flex items-center space-x-4 text-stone-700 dark:text-stone-300 relative" ref={menuRef}>
        <button
          onClick={() => setShowMenu(!showMenu)}
          className="p-2 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
        >
          <User className="w-6 h-6" />
        </button>

        {showMenu && (
          <div className="absolute top-full right-0 mt-2 w-48 bg-white dark:bg-stone-900 rounded-xl shadow-lg border border-stone-200 dark:border-stone-800 overflow-hidden z-50">
            <button
              onClick={handleProfileClick}
              className="w-full px-4 py-3 text-left text-sm text-stone-900 dark:text-stone-100 hover:bg-stone-100 dark:hover:bg-stone-800 transition-colors flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              Meu perfil
            </button>
            <button
              onClick={handleLogout}
              className="w-full px-4 py-3 text-left text-sm text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors flex items-center gap-2"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        )}
      </div>
    </header>
  );
};