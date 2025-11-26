import { useState, useEffect, useRef } from 'react';
import { Send, Mic, Phone, User, LogOut, Paperclip, Camera, Plus } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type ChatMode = 'mimar' | 'julgar';
type ChatMessage = {
  id: string;
  text: string;
  sender: 'user' | 'ai';
  timestamp: Date;
};

interface ChatScreenProps {
  onShowProfile: () => void;
}

const SUGGESTIONS = ['Posso gastar?', 'Quanto gastei no iFood?', 'Resumo do mês'];

const MOCK_MESSAGES: ChatMessage[] = [
  {
    id: '1',
    text: 'Oi! Sou a Odete, sua assistente financeira. Como posso te ajudar hoje?',
    sender: 'ai',
    timestamp: new Date(),
  },
];

export default function ChatScreen({ onShowProfile }: ChatScreenProps) {
  const [mode, setMode] = useState<ChatMode>('mimar');
  const [messages, setMessages] = useState<ChatMessage[]>(MOCK_MESSAGES);
  const [input, setInput] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const { signOut } = useAuth();

  // Close menu when clicking outside
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

  const handleLogout = async () => {
    setShowMenu(false);
    await signOut();
  };

  // Auto-scroll para a última mensagem
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      const newHeight = Math.min(textarea.scrollHeight, 120);
      textarea.style.height = `${newHeight}px`;
    }
  }, [input]);

  const handleSend = () => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      text: input,
      sender: 'user',
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');

    // Reset textarea height
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
    }

    setTimeout(() => {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text:
          mode === 'mimar'
            ? 'Claro! Você tem R$ 1.247 disponível. Vai fundo! 😊'
            : 'Olha, você já gastou R$ 2.253 esse mês. Tem certeza que precisa disso? 🔥',
        sender: 'ai',
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, aiResponse]);
    }, 1000);
  };

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion);
  };

  // Fundo limpo ou gradiente suave conforme o print
  const bgClass = 'bg-stone-50'; 

  return (
    <div className={`flex-1 flex flex-col h-full ${bgClass} relative`}>

      {/* Header - Estilo WhatsApp/Print (Verde Claro) */}
      <div className="bg-emerald-100 px-4 py-3 shadow-sm z-20 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Avatar da Odete */}
          <div className="relative">
            <div className="w-10 h-10 bg-stone-900 rounded-full overflow-hidden border-2 border-white">
               {/* Substitua pelo <img /> se tiver a foto da Odete, aqui uso um placeholder */}
               <div className="w-full h-full flex items-center justify-center bg-stone-800 text-white text-xs">
                 👩🏻
               </div>
            </div>
            <div className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-emerald-100 rounded-full"></div>
          </div>
          
          <div className="flex flex-col">
            <h2 className="text-emerald-950 font-bold text-base leading-tight">Odete</h2>
            <p className="text-emerald-700/80 text-xs font-medium">visto</p>
          </div>
        </div>

        <div className="flex items-center gap-4 text-emerald-800" ref={menuRef}>
          <button className="hover:bg-emerald-200/50 p-2 rounded-full transition-colors">
            <Phone size={22} />
          </button>
          <div className="relative">
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="hover:bg-emerald-200/50 p-2 rounded-full transition-colors"
            >
              <User size={22} />
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
        </div>
      </div>

      {/* Mode Toggles - Flutuante logo abaixo do header */}
      <div className="flex justify-center mt-4 mb-2 z-10">
        <div className="bg-white shadow-sm border border-stone-100 rounded-full p-1 flex items-center gap-1">
          <button
            onClick={() => setMode('mimar')}
            className={`flex items-center gap-1.5 py-1.5 px-4 rounded-full text-sm font-bold transition-all ${
              mode === 'mimar'
                ? 'bg-emerald-100 text-emerald-700'
                : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            😇 Mimar
          </button>
          <button
            onClick={() => setMode('julgar')}
            className={`flex items-center gap-1.5 py-1.5 px-4 rounded-full text-sm font-bold transition-all ${
              mode === 'julgar'
                ? 'bg-orange-100 text-orange-600'
                : 'text-stone-400 hover:text-stone-600'
            }`}
          >
            🔥 Julgar
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 space-y-4 pb-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-5 py-3.5 rounded-2xl shadow-sm text-[15px] leading-relaxed ${
                message.sender === 'user'
                  ? 'bg-emerald-100 text-emerald-900 rounded-tr-none'
                  : 'bg-white text-stone-800 border border-stone-100 rounded-tl-none'
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />
        
        {/* Espaço para não cobrir a última mensagem com o input */}
        <div className="h-[140px]"></div>
      </div>

      {/* Input Area - Footer */}
      <div className="absolute bottom-20 left-0 right-0 z-50 flex flex-col gap-3 px-4 pb-4 pt-2 bg-gradient-to-t from-stone-50 via-stone-50 to-transparent">

        {/* Suggestions Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
              className="flex-shrink-0 px-4 py-2 bg-white border border-stone-200 text-stone-600 text-xs font-semibold rounded-full hover:bg-stone-100 active:scale-95 transition-all shadow-sm whitespace-nowrap"
            >
              {suggestion}
            </button>
          ))}
        </div>

        {/* Input Bar estilizado conforme pedido */}
        <div className="flex items-end gap-2">
          <div className="flex-1 bg-white rounded-3xl shadow-md border border-stone-200 flex items-center px-2 py-1.5 min-h-[54px]">
            
            {/* Botão + na esquerda */}
            <button
              className="w-10 h-10 flex items-center justify-center text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors flex-shrink-0"
              onClick={() => console.log('More actions')}
            >
              <Plus size={24} />
            </button>

            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder="Mensagem"
              rows={1}
              className="flex-1 bg-transparent text-stone-800 placeholder-stone-400 text-[15px] focus:outline-none resize-none max-h-[100px] overflow-y-auto leading-5 py-3 px-2"
            />

            <div className="flex items-center gap-1 mr-1">
              <button
                className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors"
                onClick={() => console.log('Attach file')}
              >
                <Paperclip size={20} />
              </button>

              <button
                className="p-2 text-stone-400 hover:text-stone-600 hover:bg-stone-100 rounded-full transition-colors"
                onClick={() => console.log('Camera')}
              >
                <Camera size={20} />
              </button>
            </div>
          </div>

          {/* Botão Mic/Send separado */}
          <button
            onClick={input.trim() ? handleSend : () => console.log('Voice message')}
            className="w-[54px] h-[54px] bg-emerald-400 hover:bg-emerald-500 active:scale-95 rounded-full flex items-center justify-center transition-all shadow-lg flex-shrink-0 text-emerald-950"
          >
            {input.trim() ? (
              <Send size={22} className="ml-0.5" />
            ) : (
              <Mic size={22} />
            )}
          </button>
        </div>
      </div>

    </div>
  );
}