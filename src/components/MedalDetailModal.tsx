import React from 'react';
import { X, Share2, Trophy, Rocket, CheckCircle, Award, PiggyBank, TrendingUp, Wallet, Diamond, Flag, GraduationCap, MapPin } from 'lucide-react';

interface MedalDetailModalProps {
  medal: {
    id: string;
    name: string;
    icon: string;
    description: string;
    earned?: boolean;
  };
  onClose: () => void;
}

const getIconComponent = (iconName: string) => {
  const iconProps = {
    size: 56,
    className: 'text-yellow-500 dark:text-yellow-400',
    strokeWidth: 1.5,
  };

  switch (iconName) {
    case 'trophy':
      return <Trophy {...iconProps} />;
    case 'rocket':
      return <Rocket {...iconProps} />;
    case 'check-circle':
      return <CheckCircle {...iconProps} />;
    case 'piggy-bank':
      return <PiggyBank {...iconProps} />;
    case 'trending-up':
      return <TrendingUp {...iconProps} />;
    case 'wallet':
      return <Wallet {...iconProps} />;
    case 'diamond':
      return <Diamond {...iconProps} />;
    case 'award':
      return <Award {...iconProps} />;
    case 'flag':
      return <Flag {...iconProps} />;
    case 'graduation-cap':
      return <GraduationCap {...iconProps} />;
    case 'map-pin':
      return <MapPin {...iconProps} />;
    default:
      return <Award {...iconProps} />;
  }
};

export default function MedalDetailModal({ medal, onClose }: MedalDetailModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6">
      <div className="relative flex w-full max-w-sm flex-col items-center gap-4 rounded-3xl bg-white p-6 pt-10 shadow-lg dark:bg-stone-800">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-700"
        >
          <X size={24} />
        </button>

        <div className="flex w-full flex-col items-center gap-4">
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100">{medal.name}</h1>

          <div className="relative flex h-32 w-32 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/50">
            {getIconComponent(medal.icon)}
          </div>

          <p className="text-base font-normal leading-normal text-stone-600 dark:text-stone-300">
            {medal.description}
          </p>
        </div>

        <button className="flex h-12 w-full min-w-[84px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full bg-stone-950 px-5 text-base font-bold leading-normal text-white hover:bg-stone-800 transition-colors">
          <Share2 size={20} />
          <span className="truncate">Compartilhar Medalha</span>
        </button>
      </div>
    </div>
  );
}
