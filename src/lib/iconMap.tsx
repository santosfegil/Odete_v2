import React from 'react';
import { 
  Target, ThumbsUp, Link, Medal, Wallet, MessageCircle, Swords, 
  Shield, PiggyBank, Sprout, Sun, Umbrella, Zap, TrendingUp, 
  PieChart, Trophy, Bird, Gem, BarChart3, Award, Scissors, 
  CalendarCheck, PlusCircle, CheckCircle2, Crown, 
  Lock, ShieldCheck, Star, Glasses, HelpCircle, Rocket, CheckCircle, Diamond, Flag, GraduationCap, MapPin, 
  Dumbbell // Usaremos Dumbbell no lugar do BicepsFlexed
} from 'lucide-react';

export const getIconComponent = (slug: string, className?: string, size: number = 24) => {
  const props = { className, size };

  const iconMap: Record<string, React.ElementType> = {
    'target': Target,
    'thumbs-up': ThumbsUp,
    'link': Link,
    'medal': Medal,
    'wallet': Wallet,
    'message-circle': MessageCircle,
    'swords': Swords,
    'shield': Shield,
    'piggy-bank': PiggyBank,
    'sprout': Sprout,
    'sun': Sun,
    'umbrella': Umbrella,
    'zap': Zap,
    'trending-up': TrendingUp,
    'pie-chart': PieChart,
    'trophy': Trophy,
    'bird': Bird,
    'gem': Gem,
    'bar-chart-3': BarChart3,
    'award': Award,
    'scissors': Scissors,
    'calendar-check': CalendarCheck,
    'biceps-flexed': Dumbbell, // Mapeado para Dumbbell para evitar o crash
    'plus-circle': PlusCircle,
    'check-circle-2': CheckCircle2,
    'crown': Crown,
    'lock': Lock,
    'shield-check': ShieldCheck,
    'star': Star,
    'glasses': Glasses,
    'rocket': Rocket,
    'check-circle': CheckCircle,
    'diamond': Diamond,
    'flag': Flag,
    'graduation-cap': GraduationCap,
    'map-pin': MapPin
  };

  const IconComponent = iconMap[slug] || HelpCircle; // Fallback se não encontrar
  return <IconComponent {...props} />;
};