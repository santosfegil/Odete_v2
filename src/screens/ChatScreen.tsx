import React, { useState, useRef, useEffect } from 'react';
import { 
  Phone, Plus, Paperclip, Camera, Mic, Send, AudioLines, ArrowLeft, MessageSquarePlus, Trash2, CheckCheck, SendHorizontal, User, LogOut
} from 'lucide-react';
import { LiveServerMessage, Modality } from '@google/genai';
import { GeminiService } from '../services/geminiService';
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from '../services/audioUtils';
import SettingsModal from '../components/SettingsModal';
import VoiceModal from '../components/VoiceModal';
import { Message, OdeteMode, SystemPrompts, ChatSession } from '../types';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

// --- Constantes ---
// Chave para salvar no localStorage (ou AsyncStorage no futuro)
const SESSION_STORAGE_KEY = '@odete_active_session_v1';
const SESSION_TTL_MS = 1000 * 60 * 60; // 1 Hora de validade

const DEFAULT_PROMPTS: SystemPrompts = {
  mimar: `Você é a Odete, uma assistente financeira pessoal carinhosa...`, 
  julgar: `Você é a Odete, uma assistente financeira pessoal EXTREMAMENTE rígida...`
};

const SAMPLE_QUESTIONS = ["Posso gastar?", "Quanto gastei no iFood?", "Resumo do mês"];

interface ChatScreenProps {
  onShowProfile?: () => void;
}

const ChatScreen: React.FC<ChatScreenProps> = ({ onShowProfile }) => {
  // --- Global State ---
  const [apiKey, setApiKey] = useState('proxy-mode'); 
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [prompts, setPrompts] = useState<SystemPrompts>(DEFAULT_PROMPTS);
  const [showMenu, setShowMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // 1. ADICIONE ESSES DOIS REFS (TRAVAS DE SEGURANÇA)
  const initRef = useRef(false); // Impede que o useEffect rode 2x
  const creatingChatRef = useRef(false); // Impede duplo clique ou dupla criação
  
  // --- Auth & Data State ---
  const { user, signOut } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true); // Controla o loading inicial da tela

  // --- Active Chat State ---
  const [input, setInput] = useState('');
  const [mode, setMode] = useState<OdeteMode>(OdeteMode.MIMAR);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // --- Audio / Voice Note State ---
  const [isRecordingAudio, setIsRecordingAudio] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<any>(null);

  // --- Live API State ---
  const [isLiveActive, setIsLiveActive] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [audioStream, setAudioStream] = useState<MediaStream | null>(null);
  
  // Refs
  const scrollRef = useRef<HTMLDivElement>(null);
  const geminiServiceRef = useRef<GeminiService | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourceNodesRef = useRef<Set<AudioBufferSourceNode>>(new Set());

  // --- Delete Confirmation State ---
  const [deleteConfirmationId, setDeleteConfirmationId] = useState<string | null>(null);

  // 1. Initialize Gemini Service
  useEffect(() => {
    if (apiKey) {
      geminiServiceRef.current = new GeminiService(apiKey);
    }
  }, [apiKey]);

  // 2. Scroll to bottom
  useEffect(() => {
    if (activeChatId && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, activeChatId]);

  // 3. Click Outside Menu
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // ----------------------------------------------------------------------
  // 🔥 LÓGICA PRINCIPAL: AUTO-RESTORE SESSION
  // ----------------------------------------------------------------------
  useEffect(() => {
    const initSession = async () => {
      if (!user || initRef.current) return;
      initRef.current = true; // Trava imediatamente
      setIsInitializing(true);

      // 1. Carregar lista de sessões do Supabase (para termos o histórico)
      let currentSessions: ChatSession[] = [];
      const { data, error } = await supabase
        .from('ai_chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .neq('is_archived', 'TRUE')
        .order('updated_at', { ascending: false });

      if (data) {
        currentSessions = data as ChatSession[];
        setSessions(currentSessions);
      }

      // 2. Verificar Cache Local (LocalStorage)
      const storedSession = localStorage.getItem(SESSION_STORAGE_KEY);
      let sessionToRestoreId: string | null = null;

      if (storedSession) {
        try {
          const { sessionId, timestamp } = JSON.parse(storedSession);
          const now = Date.now();
          // Verifica se expirou (TTL)
          if (now - timestamp < SESSION_TTL_MS) {
            sessionToRestoreId = sessionId;
          } else {
            localStorage.removeItem(SESSION_STORAGE_KEY); // Remove se expirou
          }
        } catch (e) {
          localStorage.removeItem(SESSION_STORAGE_KEY);
        }
      }

      // 3. Tomada de Decisão: Restaurar ou Criar Nova?
      if (sessionToRestoreId) {
        // Verifica se a sessão do cache ainda existe na lista do banco
        const sessionExists = currentSessions.find(s => s.id === sessionToRestoreId);
        if (sessionExists) {
          await openChat(sessionExists); // Abre a conversa antiga
        } else {
          await createNewChat(); // Cache apontava para algo que sumiu, cria nova
        }
      } else {
        // Sem cache válido -> Começa uma conversa nova imediatamente
        await createNewChat();
      }

      setIsInitializing(false);
    };

    initSession();
  }, [user]); // Roda apenas na montagem/login

  // Helper para atualizar o cache sempre que fizermos algo na conversa
  const updateSessionCache = (sessionId: string) => {
    localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify({
      sessionId,
      timestamp: Date.now()
    }));
  };

  // --- Handlers de Menu ---
  const handleProfileClick = () => {
    if (onShowProfile) onShowProfile();
    setShowMenu(false);
  };

  const handleLogoutAction = async () => {
    setShowMenu(false);
    localStorage.removeItem(SESSION_STORAGE_KEY); // Limpa cache ao sair
    await signOut();
  };

  // --- Session Management ---

  const createNewChat = async () => {
    if (!user || creatingChatRef.current) return;
    const initialGreeting = "Olá, sou a Odete, sua assistente financeira, como posso te ajudar hoje?";
    
    // Evita criar duplicado se já estiver carregando
    if (isLoading) return; 
    setIsLoading(true);

    try {
      const { data: sessionData, error: sessionError} = await supabase
        .from('ai_chat_sessions')
        .insert({
          user_id: user.id,
          mode: OdeteMode.MIMAR,
          title: 'Nova Conversa',
          preview: initialGreeting,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();

        if (sessionError) throw sessionError;

        if (sessionData) {
          // Insere mensagem inicial
          await supabase
              .from('ai_chat_messages')
              .insert({
                  session_id: sessionData.id,
                  role: 'model',
                  content: initialGreeting
              });
    
          setSessions(prev => [sessionData, ...prev]);
          
          // Abre o chat e salva no cache
          await openChat(sessionData); 
        }
    } catch (err) {
      console.error('Erro ao criar chat:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const openChat = async (session: ChatSession) => {
    setActiveChatId(session.id);
    setMode(session.mode);
    setInput('');
    setIsLoading(true);
    
    // 🔥 Salva no cache: "Esta é a conversa ativa agora"
    updateSessionCache(session.id);

    // Reset visual
    if (isRecordingAudio) cancelAudioRecording();
    if (isLiveActive) stopLive();

    try {
      // 🔥 AQUI ESTÁ O FETCH REAL DO SUPABASE (SEM MOCK)
      const { data, error } = await supabase
        .from('ai_chat_messages')
        .select('*')
        .eq('session_id', session.id)
        .order('created_at', { ascending: true });

      if (error) throw error;

      if (data) {
        const formattedMessages: Message[] = data.map(m => ({
          id: m.id,
          role: m.role as any,
          content: m.content,
          timestamp: new Date(m.created_at),
          type: m.metadata?.type || 'text'
        }));
        setMessages(formattedMessages);
      }
    } catch (err) {
      console.error('Erro ao carregar mensagens:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const requestDeleteSession = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setDeleteConfirmationId(id);
  };

  const confirmDeleteSession = async () => {
    if (!deleteConfirmationId) return;
    const id = deleteConfirmationId;

    try {
      const { error } = await supabase
        .from('ai_chat_sessions')
        .update({ is_archived: true }) 
        .eq('id', id);

      if (error) throw error;

      setSessions(prev => prev.filter(s => s.id !== id));
      
      // Se apagou a conversa que estava ativa no cache, limpa o cache
      const stored = localStorage.getItem(SESSION_STORAGE_KEY);
      if (stored) {
         const parsed = JSON.parse(stored);
         if (parsed.sessionId === id) {
             localStorage.removeItem(SESSION_STORAGE_KEY);
         }
      }

      if (activeChatId === id) setActiveChatId(null);
      
    } catch (err) {
      console.error('Erro ao deletar:', err);
    } finally {
      setDeleteConfirmationId(null); 
    }
  };

  const handleBackToList = () => {
    // Quando o usuário VOLTA explicitamente, removemos o cache.
    // Assim, se ele der refresh, ele volta pra lista, pois ele escolheu sair do chat.
    localStorage.removeItem(SESSION_STORAGE_KEY);

    setActiveChatId(null);
    if (isLiveActive) stopLive();
    
    // Atualiza a lista para garantir previews atualizados
    if (user) {
        supabase.from('ai_chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .neq('is_archived', 'TRUE')
        .order('updated_at', { ascending: false })
        .then(({ data }) => { if(data) setSessions(data as ChatSession[]) });
    }
  };

  // 🟢 Helper para salvar mensagens (igual ao seu original)
  const saveMessageToDb = async (sessionId: string, role: 'user' | 'model', content: string, type: string = 'text') => {
    const { error } = await supabase.from('ai_chat_messages').insert({
        session_id: sessionId,
        role,
        content,
        metadata: { type }
    });

    if (!error) {
        // Atualiza preview da sessão e Cache
        const previewText = type === 'audio' ? '🎵 Áudio' : (type === 'image' ? '📷 Imagem' : content.slice(0, 50));
        
        await supabase.from('ai_chat_sessions')
            .update({ 
                preview: previewText,
                updated_at: new Date().toISOString()
            })
            .eq('id', sessionId);
            
        // 🔥 Mantém o cache vivo e atualizado
        updateSessionCache(sessionId);
    } else {
        console.error('Erro ao salvar mensagem:', error);
    }
  };

  const handleSendMessage = async (text: string = input, audioData?: { data: string, mimeType: string }) => {
    if ((!text.trim() && !audioData) || !geminiServiceRef.current || !activeChatId) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: audioData ? (text || "Mensagem de voz") : text,
      type: audioData ? 'audio' : 'text',
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsLoading(true);

    saveMessageToDb(activeChatId, 'user', userMsg.content, userMsg.type);

    try {
      const apiHistory = messages
        .filter(m => m.role === 'user' || m.role === 'model')
        .map(m => ({
          role: m.role,
          parts: [{ text: m.content || " " }] 
        }));

      const responseText = await geminiServiceRef.current.sendMessage(
        audioData ? "Analise este áudio." : text, 
        apiHistory,
        prompts[mode],
        (toolName) => console.log(`Calling tool: ${toolName}`),
        audioData,
        mode
      );

      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: responseText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, modelMsg]);
      saveMessageToDb(activeChatId, 'model', responseText, 'text');

    } catch (error) {
      console.error(error);
      const errorMsg = "Erro ao processar mensagem.";
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        content: errorMsg,
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // ... (Mantenha as funções de Áudio e Live API exatamente como estavam no seu arquivo original)
  // Vou omitir aqui apenas para não deixar a resposta gigante, mas você deve MANTER
  // startAudioRecording, stopAudioRecording, cancelAudioRecording, startLive, stopLive, toggleMute, handleFileUpload...
  // Se quiser, posso repostar elas também, mas elas não mudam.
  
  // Funções de Audio (Simplificadas aqui para conectar, use as suas originais)
  const startAudioRecording = async () => { /* Use sua função original */
      try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.start();
      setIsRecordingAudio(true);
      setRecordingDuration(0);
      
      recordingTimerRef.current = setInterval(() => {
        setRecordingDuration(prev => prev + 1);
      }, 1000);

    } catch (err) {
      console.error("Error accessing mic:", err);
      alert("Erro ao acessar microfone.");
    }
  };
  const stopAudioRecording = () => { /* Use sua função original */
    if (mediaRecorderRef.current && isRecordingAudio) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' }); 
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = () => {
          const base64String = (reader.result as string).split(',')[1];
          handleSendMessage("", { data: base64String, mimeType: 'audio/webm' });
        };
        
        if (mediaRecorderRef.current?.stream) {
            mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
        }
        setIsRecordingAudio(false);
        clearInterval(recordingTimerRef.current);
      };
    }
  };
  const cancelAudioRecording = () => { /* Use sua função original */
     if (mediaRecorderRef.current) {
         mediaRecorderRef.current.stop();
         if (mediaRecorderRef.current.stream) {
             mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop());
         }
     }
     setIsRecordingAudio(false);
     clearInterval(recordingTimerRef.current);
     audioChunksRef.current = [];
  };
  const formatDuration = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  // Funções de Live (Simplificadas aqui, use as originais)
  const startLive = async () => { 
      /* Copie sua lógica de startLive aqui, não houve alteração */
       // ... (Seu código original de startLive)
       // Apenas como placeholder para compilar:
       alert("Certifique-se de copiar a função startLive do seu código original");
  };
  const stopLive = async () => {
      /* Copie sua lógica de stopLive aqui */
      setIsLiveActive(false);
      setIsConnecting(false);
      setIsAiSpeaking(false);
      // ... cleanup
  };
  const toggleMute = () => {
      setIsMuted(!isMuted);
      // ... logic
  };
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
     /* Copie sua lógica original */
      const file = e.target.files?.[0];
        if (file && geminiServiceRef.current) {
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64String = (reader.result as string).split(',')[1];
                const userMsg: Message = { id: Date.now().toString(), role: 'user', content: '📷 Imagem enviada', type: 'image', timestamp: new Date() };
                setMessages(p => [...p, userMsg]);
                
                if (activeChatId) saveMessageToDb(activeChatId, 'user', 'Imagem enviada', 'image');

                setIsLoading(true);
                try {
                    const response = await geminiServiceRef.current!.analyzeImage(base64String, "O que é isso?", prompts[mode]);
                    const modelMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', content: response, timestamp: new Date() };
                    setMessages(p => [...p, modelMsg]);
                    if (activeChatId) saveMessageToDb(activeChatId, 'model', response, 'text');
                } catch(e) { console.error(e); } finally { setIsLoading(false); }
            };
            reader.readAsDataURL(file);
        }
  };


  // --- Renderização ---

  // 1. Loading Inicial (Enquanto decide se abre chat ou lista)
  if (isInitializing) {
    return (
      <div className="flex flex-col h-screen w-full items-center justify-center bg-white">
        <div className="w-10 h-10 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
        <p className="mt-4 text-gray-400 text-sm animate-pulse">Iniciando a Odete...</p>
      </div>
    );
  }

  // 2. View: Lista de Conversas (Só aparece se o usuário voltar explicitamente ou não tiver sessão)
  if (!activeChatId) {
    return (
       <div className="flex flex-col h-screen w-full bg-white shadow-2xl border-x border-gray-200">
          <div className="bg-[#E0F2E9] p-4 flex items-center justify-between shadow-sm z-10">
            <h1 className="font-bold text-gray-900 text-lg">Conversas</h1>
            <div className="flex gap-2">
            <button onClick={createNewChat} className="p-2 text-emerald-700 rounded-full hover:bg-emerald-100"><MessageSquarePlus size={22}/></button>
       
            <div className="flex items-center space-x-4 text-stone-700 dark:text-stone-300 relative" ref={menuRef}>
                    <button
                      onClick={() => setShowMenu(!showMenu)}
                      className="p-2 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
                    >
                      <User className="w-6 h-6" />
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
                          onClick={handleLogoutAction}
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
          
          <div className="flex-1 overflow-y-auto bg-white pb-32">
            {sessions.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-gray-400 p-8 text-center">
                    <MessageSquarePlus size={48} className="mb-4 opacity-50"/>
                    <p>Nenhuma conversa ainda.</p>
                    <button onClick={createNewChat} className="mt-4 px-4 py-2 bg-emerald-500 text-white rounded-full font-medium">Iniciar Nova Conversa</button>
                </div>
            ) : (
                sessions.map(session => (
                    <div 
                        key={session.id}
                        onClick={() => openChat(session)}
                        className="flex items-center gap-3 p-4 border-b border-gray-100 hover:bg-gray-50 cursor-pointer transition-colors"
                    >
                         <div className="relative flex-shrink-0">
                            <div className="w-12 h-12 rounded-full bg-gray-200 overflow-hidden">
                                <img src={`https://picsum.photos/seed/${session.id}/200`} alt="Avatar" className="w-full h-full object-cover"/>
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-baseline mb-1">
                                <h3 className="font-semibold text-gray-800 truncate">{session.mode === OdeteMode.JULGAR ? 'Odete 🔥' : 'Odete 😇'}</h3>
                                <span className="text-xs text-gray-400">{new Date(session.updated_at).toLocaleDateString()}</span>
                            </div>
                            <p className="text-sm text-gray-500 truncate">{session.preview}</p>
                        </div>
                        <div className="flex items-center">
                            <button 
                                onClick={(e) => requestDeleteSession(e, session.id)}
                                className="p-3 text-gray-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors z-20"
                                title="Excluir conversa"
                            >
                                <Trash2 size={18} />
                            </button>
                        </div>
                    </div>
                ))
            )}
          </div>
          

          {deleteConfirmationId && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in duration-200">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir conversa?</h3>
                <p className="text-gray-600 mb-6 text-sm">
                  Essa ação removerá a conversa da sua lista. Você não poderá desfazer isso.
                </p>
                <div className="flex gap-3 justify-end">
                  <button 
                    onClick={() => setDeleteConfirmationId(null)}
                    className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={confirmDeleteSession}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={16} /> Excluir
                  </button>
                </div>
              </div>
              </div>
          )}

          <SettingsModal 
            isOpen={isSettingsOpen} 
            onClose={() => setIsSettingsOpen(false)}
            prompts={prompts}
            onSave={(newPrompts) => { setPrompts(newPrompts); setIsSettingsOpen(false); }}
          />
       </div>
    );
  }

  // 3. View: Chat Ativo
  return (
    <div className="flex flex-col h-screen w-full bg-white shadow-2xl overflow-hidden relative border-x border-gray-200">
      
      <VoiceModal 
        isOpen={isLiveActive || isConnecting}
        onClose={stopLive}
        status={isConnecting ? 'connecting' : 'active'}
        mode={mode}
        isMuted={isMuted}
        toggleMute={toggleMute}
        isAiSpeaking={isAiSpeaking}
      />

      {/* Header */}
      <header className="bg-[#E0F2E9] p-3 flex items-center justify-between shadow-sm z-10">
        <div className="flex items-center gap-2">
           <button onClick={handleBackToList} className="p-1 rounded-full hover:bg-emerald-100 text-emerald-800 -ml-1">
                <ArrowLeft size={24} />
           </button>
          <div className="relative">
            <div className="w-10 h-10 rounded-full bg-gray-800 flex items-center justify-center text-white overflow-hidden">
                <img src={`https://picsum.photos/seed/odete/200`} alt="Avatar" className="w-full h-full object-cover"/>
            </div>
            <div className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-[#E0F2E9] ${isLiveActive ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></div>
          </div>
          <div className="flex flex-col">
            <h1 className="font-bold text-gray-900 leading-none">Odete</h1>
            <span className="text-[10px] text-emerald-700">{mode === OdeteMode.MIMAR ? 'Modo: Mimar' : 'Modo: Julgar'}</span>
          </div>
        </div>
        <div className="flex gap-2 text-emerald-700 items-center">
          <button 
             onClick={startLive} 
             title="Conversar com Odete (Live API)"
             className={`p-2 rounded-full hover:bg-emerald-100 transition-colors ${isLiveActive ? 'bg-red-100 text-red-500' : ''}`}
          >
             {isLiveActive ? <AudioLines size={24} className="animate-pulse" /> : <Phone size={24} />}
          </button>
          
          <div className="flex items-center space-x-4 text-stone-700 dark:text-stone-300 relative" ref={menuRef}>
                  <button
                    onClick={() => setShowMenu(!showMenu)}
                    className="p-2 rounded-full hover:bg-stone-200 dark:hover:bg-stone-800 transition-colors"
                  >
                    <User className="w-6 h-6" />
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
                        onClick={handleLogoutAction}
                        className="w-full px-4 py-3 text-left text-sm text-red-600 dark:text-red-500 hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors flex items-center gap-2"
                      >
                        <LogOut className="w-4 h-4" />
                        Sair
                      </button>
                    </div>
                  )}
                </div>
        </div>
      </header>

      {/* Mode Switcher */}
      <div className="flex justify-center py-2 bg-[#E0F2E9]/50">
        <div className="bg-white p-1 rounded-full shadow-sm flex gap-1">
          <button onClick={() => setMode(OdeteMode.MIMAR)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${mode === OdeteMode.MIMAR ? 'bg-emerald-100 text-emerald-800' : 'text-gray-400'}`}>😇 Mimar</button>
          <button onClick={() => setMode(OdeteMode.JULGAR)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${mode === OdeteMode.JULGAR ? 'bg-red-100 text-red-800' : 'text-gray-400'}`}>🔥 Julgar</button>
        </div>
      </div>

      {/* Chat Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-2 bg-[#F0F2F5]" style={{ backgroundImage: 'radial-gradient(#cbd5e1 1px, transparent 1px)', backgroundSize: '20px 20px' }}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex w-full mb-1 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div 
              className={`
                relative px-2 py-1 max-w-[85%] rounded-lg shadow-sm text-[15px] leading-snug
                ${msg.role === 'user' 
                  ? 'bg-[#d9fdd3] text-gray-900 rounded-tr-none' 
                  : 'bg-white text-gray-900 rounded-tl-none'
                }
              `}
            >
              {msg.type === 'image' && <span className="block text-xs italic text-gray-500 mb-1 flex items-center gap-1"><Camera size={12}/> Imagem</span>}
              {msg.type === 'audio' && <span className="block text-xs italic text-gray-500 mb-1 flex items-center gap-1"><AudioLines size={12}/> Áudio</span>}
              
              <div className="break-words whitespace-pre-wrap">
                 {msg.content}
                 <span className="inline-block w-14 h-0"></span> 
              </div>

              <div className="flex items-center justify-end gap-1 -mt-3 float-right relative top-1 ml-2">
                 <span className="text-[11px] text-gray-500/80">
                   {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                 </span>
                 {msg.role === 'user' && (
                    <CheckCheck size={15} className="text-[#53bdeb]" /> 
                 )}
              </div>
            </div>
          </div>
        ))}
        {isLoading && <div className="flex justify-start"><div className="bg-white p-3 rounded-2xl rounded-tl-none shadow-sm flex gap-1"><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div><div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div></div></div>}
      </div>

      {/* Quick Actions */}
      <div className="bg-[#F0F2F5] px-4 pb-2 flex gap-2 overflow-x-auto no-scrollbar mask-gradient">
        {SAMPLE_QUESTIONS.map((q) => <button key={q} onClick={() => setInput(q)} className="whitespace-nowrap bg-white border border-gray-200 text-gray-600 px-4 py-2 rounded-full text-xs font-medium shadow-sm hover:bg-gray-50">{q}</button>)}
      </div>

      {/* Input Area */}
      <div className="bg-[#F0F2F5] p-3 pb-24 flex items-end gap-2">
        {isRecordingAudio ? (
            <div className="flex-1 bg-white rounded-3xl flex items-center justify-between shadow-sm border border-gray-200 px-4 py-3">
                <div className="flex items-center gap-2 text-red-500 animate-pulse">
                    <Mic size={20} fill="currentColor"/>
                    <span className="font-mono">{formatDuration(recordingDuration)}</span>
                </div>
                <div className="flex items-center gap-3">
                     <button onClick={cancelAudioRecording} className="text-gray-400 hover:text-gray-600 font-medium text-sm">Cancelar</button>
                     <button onClick={stopAudioRecording} className="bg-[#00A884] p-2 rounded-full text-white"><Send size={16} /></button>
                </div>
            </div>
        ) : (
            <div className="flex-1 bg-white rounded-3xl flex items-center shadow-sm border border-gray-200 px-2 py-1">
                <button className="p-2 text-gray-400 hover:text-gray-600"><Plus size={22} /></button>
                <input 
                    type="text" value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder="Mensagem" className="flex-1 py-3 px-2 text-gray-700 outline-none bg-transparent" 
                />
                <button className="p-2 text-gray-400 hover:text-gray-600"><Paperclip size={20} className="rotate-45" /></button>
                <label className="p-2 text-gray-400 hover:text-gray-600 cursor-pointer"><Camera size={20} /><input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} /></label>
            </div>
        )}

        {!isRecordingAudio && (
             <button 
                onClick={() => input.trim() ? handleSendMessage() : startAudioRecording()}
                className="w-12 h-12 rounded-full flex items-center justify-center text-white shadow-md transition-all bg-[#00A884] hover:bg-[#008f6f]"
             >
                {input.trim() ? (
                  <SendHorizontal size={22} className="ml-0.5"/> 
                ) : (
                  <Mic size={22} />
                )}
            </button>
        )}
      </div>

      {/* Delete Confirmation Modal for List View */}
      {deleteConfirmationId && (
            <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm">
              <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-in fade-in zoom-in duration-200">
                <h3 className="text-lg font-bold text-gray-900 mb-2">Excluir conversa?</h3>
                <p className="text-gray-600 mb-6 text-sm">
                  Essa ação removerá a conversa da sua lista. Você não poderá desfazer isso.
                </p>
                <div className="flex gap-3 justify-end">
                  <button 
                    onClick={() => setDeleteConfirmationId(null)}
                    className="px-4 py-2 text-gray-600 font-medium hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    Cancelar
                  </button>
                  <button 
                    onClick={confirmDeleteSession}
                    className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white font-medium rounded-lg transition-colors flex items-center gap-2"
                  >
                    <Trash2 size={16} /> Excluir
                  </button>
                </div>
              </div>
              </div>
          )}

      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        prompts={prompts} 
        onSave={(p) => { setPrompts(p); setIsSettingsOpen(false); }} 
      />
    </div>
  );
};

export default ChatScreen;