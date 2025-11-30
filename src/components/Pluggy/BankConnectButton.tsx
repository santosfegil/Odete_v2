import React, { useState, useEffect } from 'react';
import { PluggyConnect } from 'react-pluggy-connect';

interface BankConnectButtonProps {
  userToken?: string;
}

const BankConnectButton: React.FC<BankConnectButtonProps> = ({ userToken }) => {
  const [connectToken, setConnectToken] = useState<string>('');
  const [isWidgetOpen, setIsWidgetOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true); // Estado para controlar o carregamento

  useEffect(() => {
    async function fetchToken() {
      // Não busca o token se o userToken não estiver disponível
      if (!userToken) {
        console.warn("BankConnectButton: userToken não foi fornecido. O botão ficará desabilitado.");
        setIsLoading(false);
        return;
      }
      
      setIsLoading(true);
      try {
        const response = await fetch(
          'https://gsrdfecpzukuaeehqaha.supabase.co/functions/v1/create-pluggy-token',
          {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              // As funções do Supabase esperam o token JWT do usuário para autenticação
              'Authorization': `Bearer ${userToken}`,
            },
            body: JSON.stringify({}), // Enviar um corpo vazio é uma boa prática para POST
          }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Falha ao obter o connect token.');
        }

        const data = await response.json();
        setConnectToken(data.accessToken);
      } catch (error) {
        console.error("Erro ao buscar connect token da Pluggy:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchToken();
  }, [userToken]); // A dependência do useEffect é o userToken

  const handleSuccess = (payload: any) => {
    console.log('Conexão com o banco realizada com sucesso!', payload);
    setIsWidgetOpen(false);
    // Aqui você pode chamar uma função para salvar o `itemId` (payload.item.id) no seu banco de dados,
    // associando-o ao usuário logado.
  };

  const handleError = (error: any) => {
    console.error('Erro no widget da Pluggy:', error);
    setIsWidgetOpen(false);
  };

  const handleClose = () => {
    console.log('Widget da Pluggy fechado pelo usuário.');
    setIsWidgetOpen(false);
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
          includeSandbox={true} // Mantenha como true para testes
          onSuccess={handleSuccess}
          onError={handleError}
          onClose={handleClose}
        />
      )}
    </>
  );
};

export default BankConnectButton;
