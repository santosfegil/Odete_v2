import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase'; // Seu cliente Supabase
import { PluggyConnect } from 'react-pluggy-connect';

interface BankConnectButtonProps {
  userToken?: string;
}

const BankConnectButton: React.FC<BankConnectButtonProps> = ({ userToken }) => {
  const [connectToken, setConnectToken] = useState<string>('');
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true; // Evita atualizar estado se o componente desmontar

    async function fetchToken() {
      if (!userToken) {
        console.warn("BankConnectButton: userToken ausente.");
        if (isMounted) setIsLoading(false);
        return;
      }

      setIsLoading(true);

      try {
        // MUDANÇA PRINCIPAL: Usamos apenas o invoke do Supabase.
        // Ele é mais limpo e seguro.
        const { data, error } = await supabase.functions.invoke('create-pluggy-token', {
          // Passamos o token explicitamente no header para garantir que a Edge Function
          // saiba quem é o usuário, mesmo se o cliente supabase local tiver perdido a sessão.
          headers: {
             Authorization: `Bearer ${userToken}`
          },
          body: {}, // Corpo vazio, pois a Edge Function pega o ID pelo token acima
        });

        if (error) throw error;

        if (isMounted && data?.accessToken) {
          setConnectToken(data.accessToken);
        }

      } catch (error) {
        console.error("Erro ao obter Connect Token:", error);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    fetchToken();

    return () => { isMounted = false; };
  }, [userToken]);

  const handleSuccess = async (payload: any) => {
  
   
    const itemId = payload.item?.id;
    if (!itemId || !userToken) return;

    setIsWidgetOpen(false);
    
    // Chama a sincronização
    try {
        const { error } = await supabase.functions.invoke('sync-bank-data', {
            body: { itemId },
            headers: { Authorization: `Bearer ${userToken}` }
        });
        if (error) throw error;
        alert('Conexão realizada! Sincronização iniciada.');
    } catch (err) {
        console.error('Erro sync:', err);
        alert('Erro ao sincronizar dados.');
    }
  };

  const handleError = (error: any) => {
    console.error('Erro Pluggy Widget:', error);
  };

  const isDisabled = isLoading || !connectToken;

  return (
    <>
      <button
        onClick={() => setIsWidgetOpen(true)}
        disabled={isDisabled}
        style={{
          backgroundColor: isDisabled ? '#cccccc' : '#050405',
          color: 'white',
          padding: '10px 20px',
          border: 'none',
          borderRadius: '9999px',
          cursor: isDisabled ? 'not-allowed' : 'pointer',
          fontWeight: 'bold',
        }}
      >
        {isLoading ? 'Carregando...' : '+ Conectar Nova Conta'}
      </button>

      {isWidgetOpen && connectToken && (
        <PluggyConnect
          connectToken={connectToken}
          includeSandbox={true}
          onSuccess={handleSuccess}
          onError={handleError}
          onClose={() => setIsWidgetOpen(false)}
        />
      )}
    </>
  );
};

export default BankConnectButton;