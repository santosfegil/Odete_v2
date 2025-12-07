import React from 'react';
import { DollarSign, Wallet, Home, Settings } from 'lucide-react';
import { PatrimonyTotals } from '../hooks/usePatrimony'; // Importe a interface do hook

interface InvestmentCardProps {
  data: PatrimonyTotals; // Usa a tipagem do hook
  onEdit?: () => void;
}

export const InvestmentCard: React.FC<InvestmentCardProps> = ({ data, onEdit }) => {
  
  // Função auxiliar para formatar moeda
  const formatCurrency = (value: number) => 
    value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

  // Tratamento visual do valor principal
  const totalString = formatCurrency(data.totalEquity);
  const [totalMain, totalCents] = totalString.split(',');

  return (
    <div className="space-y-4">
      <div className="rounded-3xl bg-emerald-500 p-6 text-white shadow-lg dark:bg-emerald-600">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-emerald-100 dark:text-emerald-200">Patrimônio Total</p>
            <p className="mt-1 text-4xl font-extrabold tracking-tight">
              <span className="align-top text-2xl font-semibold">R$</span>
              {totalMain}
              <span className="align-top text-2xl font-semibold">,{totalCents}</span>
            </p>
          </div>

          <div className="flex gap-1">
            <button 
              onClick={onEdit}
              className="p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors text-emerald-50"
              aria-label="Editar patrimônio"
            >
             <Settings size={20} />
            </button>
          </div>
        </div>

        <div className="mt-2 space-y-4 border-t border-white/20 pt-4">
          {/* Investimentos */}
          <div className="flex items-center justify-between text-sm gap-4">
            <div className="flex items-center">
              <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 flex-shrink-0">
                <DollarSign className="h-5 w-5 text-white" />
              </div>
              <p className="font-medium text-emerald-50">Valor em investimentos</p>
            </div>
            <p className="font-semibold text-white whitespace-nowrap">
              R$ {formatCurrency(data.investments)}
            </p>
          </div>

          {/* Conta Corrente */}
          <div className="flex items-center justify-between text-sm gap-4">
            <div className="flex items-center">
              <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 flex-shrink-0">
                <Wallet className="h-5 w-5 text-white" />
              </div>
              <p className="font-medium text-emerald-50">Valor em conta corrente</p>
            </div>
            <p className="font-semibold text-white whitespace-nowrap">
              R$ {formatCurrency(data.checkingAccount)}
            </p>
          </div>

          {/* Bens */}
          <div className="flex items-center justify-between text-sm gap-4">
            <div className="flex items-center">
              <div className="mr-3 flex h-8 w-8 items-center justify-center rounded-full bg-white/20 flex-shrink-0">
                <Home className="h-5 w-5 text-white" />
              </div>
              <p className="font-medium text-emerald-50">Valor em bens</p>
            </div>
            <p className="font-semibold text-white whitespace-nowrap">
              R$ {formatCurrency(data.realEstate)}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};