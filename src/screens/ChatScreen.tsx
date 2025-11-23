import { useState, useEffect, useRef } from 'react';
import { Send, Mic, Phone, User, LogOut, Smile, Paperclip, Camera } from 'lucide-react';
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

  const bgGradient =
    mode === 'mimar'
      ? 'from-stone-50 via-stone-100 to-emerald-50/50'
      : 'from-stone-50 via-stone-100 to-rose-50/50';

  const getLastSeen = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, '0');
    const minutes = now.getMinutes().toString().padStart(2, '0');
    return `visto `;
  };

  return (
    <div className={`flex-1 flex flex-col h-full bg-gradient-to-b ${bgGradient} transition-all duration-500 relative`}>

      {/* Header */}
      <div className="bg-emerald-700 px-3 pt-3 pb-2 shadow-md z-20">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 bg-emerald-200 rounded-full flex items-center justify-center text-base flex-shrink-0">
            🤖
          </div>
          <div className="flex-1 min-w-0">
            <h2 className="text-white font-medium text-sm leading-tight">Odete</h2>
            <p className="text-emerald-100 text-[11px] leading-tight">{getLastSeen()}</p>
          </div>
          <button className="p-1.5 hover:bg-emerald-600 rounded-full transition-colors">
            <Phone size={20} className="text-white" />
          </button>
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowMenu(!showMenu)}
              className="p-1.5 hover:bg-emerald-600 rounded-full transition-colors"
            >
              <User size={20} className="text-white" />
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

      {/* Mode Toggles */}
      <div className="px-3 pt-3 pb-2 z-10">
        <div className="bg-white/80 backdrop-blur-sm border border-stone-200 shadow-sm rounded-full p-1 flex items-center">
          <button
            onClick={() => setMode('mimar')}
            className={`flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-all ${
              mode === 'mimar'
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            😇 Mimar
          </button>
          <button
            onClick={() => setMode('julgar')}
            className={`flex-1 py-2.5 px-4 rounded-full text-sm font-medium transition-all ${
              mode === 'julgar'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-stone-500 hover:text-stone-700'
            }`}
          >
            🔥 Julgar
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-3 space-y-3 pb-4">
        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[80%] px-5 py-3 rounded-3xl ${
                message.sender === 'user'
                  ? 'bg-stone-900 text-white rounded-tr-none shadow-sm'
                  : 'bg-white text-stone-900 border border-stone-200 rounded-tl-none shadow-sm'
              }`}
            >
              <p className="text-sm leading-relaxed">{message.text}</p>
            </div>
          </div>
        ))}
        <div ref={messagesEndRef} />

        {/* Espaço reservado para os controles fixos */}
        <div className="h-[140px]"></div>
      </div>

<div className="absolute bottom-24 left-0 right-0 z-50 flex flex-col gap-2 px-2 pb-2 pt-3 bg-gradient-to-t from-stone-100 via-stone-50/95 to-transparent">

        {/* Suggestions */}
        <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => handleSuggestionClick(suggestion)}
              className="flex-shrink-0 px-3 py-1.5 bg-white/90 backdrop-blur border border-stone-200 text-stone-700 text-xs font-medium rounded-full hover:bg-stone-50 transition-colors shadow-sm whitespace-nowrap"
            >
              {suggestion}
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="flex items-end gap-1.5">
          <div className="flex-1 bg-stone-800 rounded-3xl shadow-xl overflow-hidden">
            <div className="flex items-center px-2 py-1.5">

              <button
                className="p-1.5 text-white/70 hover:text-white transition-colors flex-shrink-0"
                onClick={() => console.log('Emoji picker')}
              >
                <Smile size={20} />
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
                className="flex-1 bg-transparent text-white placeholder-stone-400 text-[15px] focus:outline-none resize-none max-h-[100px] overflow-y-auto leading-5 px-2 py-2"
              />

              <button
                className="p-1.5 text-white/70 hover:text-white transition-colors flex-shrink-0"
                onClick={() => console.log('Attach file')}
              >
                <Paperclip size={20} />
              </button>

              <button
                className="p-1.5 text-white/70 hover:text-white transition-colors flex-shrink-0"
                onClick={() => console.log('Camera')}
              >
                <Camera size={20} />
              </button>

            </div>
          </div>

          <button
            onClick={input.trim() ? handleSend : () => console.log('Voice message')}
            className="w-10 h-10 bg-emerald-500 hover:bg-emerald-600 rounded-full flex items-center justify-center transition-colors shadow-lg flex-shrink-0 mb-0.5"
          >
            {input.trim() ? (
              <Send size={18} className="text-white" />
            ) : (
              <Mic size={18} className="text-white" />
            )}
          </button>
        </div>
      </div>
      

    </div>
  );
}