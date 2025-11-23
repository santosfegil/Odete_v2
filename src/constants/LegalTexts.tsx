import React from 'react';

export const TERMS_CONTENT = (
  <div className="space-y-4 text-justify">
    <p>
      <strong>1. Aceitação dos Termos</strong><br />
      Ao criar uma conta e utilizar o aplicativo <strong>Odete</strong>, você concorda em cumprir estes Termos de Serviço. Se você não concordar com algum destes termos, não deverá utilizar o aplicativo.
    </p>

    <p>
      <strong>2. Natureza do Serviço e Isenção de Responsabilidade</strong><br />
      A Odete é uma assistente de gestão financeira pessoal baseada em Inteligência Artificial. 
      <br /><br />
      <strong>Importante:</strong> As sugestões, comentários e interações da IA (seja no modo "Mimar" ou "Julgar") têm caráter lúdico, educativo e organizacional. A Odete <strong>não é uma consultora financeira certificada</strong> e as suas respostas não constituem recomendações formais de investimento, compra ou venda de ativos. Você é o único responsável pelas suas decisões financeiras.
    </p>

    <p>
      <strong>3. Responsabilidades do Usuário</strong><br />
      Você concorda em fornecer informações verdadeiras e precisas sobre suas finanças para o bom funcionamento do sistema. Você é responsável por manter a confidencialidade da sua senha e por todas as atividades que ocorram na sua conta.
    </p>

    <p>
      <strong>4. Privacidade de Dados</strong><br />
      Respeitamos a sua privacidade. Seus dados financeiros são utilizados apenas para gerar as análises e interações dentro do aplicativo. Para mais detalhes, consulte nossa Política de Privacidade.
    </p>

    <p>
      <strong>5. Propriedade Intelectual</strong><br />
      Todo o design, textos, gráficos, o personagem "Odete" e o código-fonte são propriedade exclusiva dos desenvolvedores do aplicativo e estão protegidos pelas leis de direitos autorais.
    </p>

    <p>
      <strong>6. Alterações nos Termos</strong><br />
      Reservamo-nos o direito de modificar estes termos a qualquer momento. Notificaremos sobre mudanças significativas através do aplicativo ou por e-mail.
    </p>
  </div>
);

export const PRIVACY_CONTENT = (
  <div className="space-y-4 text-justify">
    <p>
      <strong>1. Informações que Coletamos</strong><br />
      Coletamos as informações que você nos fornece diretamente: dados de cadastro (nome, e-mail, telefone) e dados financeiros (receitas, despesas, metas e orçamentos) que você insere manualmente ou via chat.
    </p>

    <p>
      <strong>2. Como Usamos Suas Informações</strong><br />
      Utilizamos seus dados para:
      <ul className="list-disc pl-5 mt-1">
        <li>Personalizar as respostas da assistente Odete;</li>
        <li>Gerar gráficos e relatórios do seu progresso financeiro;</li>
        <li>Autenticar seu acesso e garantir a segurança da conta.</li>
      </ul>
    </p>

    <p>
      <strong>3. Compartilhamento</strong><br />
      Não vendemos nem alugamos seus dados pessoais a terceiros. Seus dados podem ser processados por serviços de nuvem (como o Supabase) apenas para fins de hospedagem e funcionamento do aplicativo.
    </p>

    <p>
      <strong>4. Segurança</strong><br />
      Adotamos práticas de segurança do setor para proteger seus dados, mas lembre-se que nenhum método de transmissão pela internet é 100% seguro.
    </p>

    <p>
      <strong>5. Exclusão de Dados</strong><br />
      Você pode solicitar a exclusão completa da sua conta e de todos os dados associados a qualquer momento através das configurações do perfil.
    </p>
  </div>
);