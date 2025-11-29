import React from 'react';
import { DollarSign, PiggyBank, Wallet, Home, Settings, MessageCircle } from 'lucide-react';
import { InvestmentData } from '../types';

interface InvestmentCardProps {
  data: InvestmentData;
  onEdit?: () => void;
}

export const InvestmentCard: React.FC<InvestmentCardProps> = ({ data, onEdit }) => {
  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-emerald-500 p-6 text-white shadow-lg dark:bg-emerald-600">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-100 dark:text-emerald-200">Patrimônio</p>
            <p className="mt-1 text-4xl font-extrabold tracking-tight">
              <span className="align-top text-2xl font-semibold">R$</span>
              {data.totalEquity.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).replace('R$', '').trim().split(',')[0]}
              <span className="align-top text-2xl font-semibold">,{data.totalEquity.toFixed(2).split('.')[1]}</span>
            </p>
          </div>

          <div className="flex gap-1">
            <button 
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-emerald-50"
            >
              <MessageCircle size={20} />
            </button>
          
          <button 
            onClick={onEdit}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-emerald-50"
            aria-label="Editar patrimônio"
          >
           <Settings size={20} />
          </button>
        </div>
        </div>

        {/* Margem reduzida para mt-2 para aproximar a linha do valor */}
        <div className="mt-2 space-y-4 border-t border-white/20 pt-4">
          
          {/* Adicionado gap-4 em todos os itens para separar texto do valor */}
          <div className="flex items-center justify-between text-sm gap-4">
            <div className="flex items-center">
              <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 flex-shrink-0">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <p className="font-medium text-emerald-50">Valor em investimentos</p>
            </div>
            <p className="font-semibold text-white whitespace-nowrap">
              R$ {data.investments.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="flex items-center justify-between text-sm gap-4">
            <div className="flex items-center">
              <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 flex-shrink-0">
                <PiggyBank className="h-5 w-5 text-white" />
              </div>
              <p className="font-medium text-emerald-50">Reserva de emergência</p>
            </div>
            <p className="font-semibold text-white whitespace-nowrap">
              R$ {data.emergencyReserve.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="flex items-center justify-between text-sm gap-4">
            <div className="flex items-center">
              <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 flex-shrink-0">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <p className="font-medium text-emerald-50">Valor em conta corrente</p>
            </div>
            <p className="font-semibold text-white whitespace-nowrap">
              R$ {data.checkingAccount.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>

          <div className="flex items-center justify-between text-sm gap-4">
            <div className="flex items-center">
              <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 flex-shrink-0">
                <Home className="h-5 w-5 text-white" />
              </div>
              <p className="font-medium text-emerald-50">Valor em bens</p>
            </div>
            <p className="font-semibold text-white whitespace-nowrap">
              R$ {data.realEstate.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};