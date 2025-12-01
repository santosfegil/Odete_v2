import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase'; //  cliente Supabase
import { PluggyConnect } from 'react-pluggy-connect';


// Código do hook para obter o publicToken de forma segura
import { usePluggyToken } from '../hooks/usePluggyToken';

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

  const handleSuccess = async(payload: any) => {
    alert('Conexão Pluggy BEM SUCEDIDA. Verificando Token...');


    // 2. EXTRAÇÃO DO ITEM ID E TOKEN DE USUÁRIO
    const itemId = payload.item?.id;

    // Verifique o valor do token que será enviado
    if (!userToken) {
        alert('ERRO CRÍTICO: userToken não encontrado. A sincronização FALHOU.');
        setIsWidgetOpen(false);
        return; 
    }

    if (!itemId) {
        alert('ERRO CRÍTICO: Item ID da Pluggy não encontrado no payload.');
        setIsWidgetOpen(false);
        return; 
    }

    alert(`Token Ok: ${userToken.slice(0, 10)}... | Item ID: ${itemId}`); // Mostra os primeiros 10 caracteres do token
    
    setIsWidgetOpen(false);
    console.log('Conexão com o banco realizada com sucesso!', payload);
    setIsWidgetOpen(false);
    try {
      // Invoca a Edge Function 'sync-bank-data' para salvar Contas e Transações
      const { data, error } = await supabase.functions.invoke('sync-bank-data', {
        body: { 
          itemId: payload.item.id 
        },
        // Garante que o token do usuário seja passado para manter o contexto de quem está chamando
        headers: {
            Authorization: `Bearer ${userToken}` 
        }
      });

      if (error) throw error;

      console.log('Sincronização iniciada com sucesso:', data);
      alert('Conexão realizada! Seus dados estão sendo importados.');

    } catch (err) {
      console.error('Erro ao invocar sync-bank-data:', err);
      alert('Conexão feita, mas houve um erro ao iniciar a importação dos dados.');
    }
    

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
