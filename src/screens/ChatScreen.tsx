import React, { useState, useRef, useEffect } from 'react';
import { 
  Phone, Plus, Paperclip, Camera, Mic, Send, Settings, AudioLines,
  X, ArrowLeft, MessageSquarePlus, Trash2, CheckCheck, SendHorizontal
} from 'lucide-react';
import { LiveServerMessage, Modality } from '@google/genai';
import { GeminiService } from '../services/geminiService';
import { createPcmBlob, decodeAudioData, base64ToUint8Array } from '../services/audioUtils';
import SettingsModal from '../components/SettingsModal';
import VoiceModal from '../components/VoiceModal';
import { Message, OdeteMode, SystemPrompts, ChatSession } from '../types';
import { supabase } from '../lib/supabase'; // 🟢 Import Supabase
import { useAuth } from '../contexts/AuthContext'; // 🟢 Import Auth

// --- Constants ---
// REMOVIDO: const STORAGE_KEY = 'odete_chat_sessions_v1';

const DEFAULT_PROMPTS: SystemPrompts = {
  mimar: `Você é a Odete, uma assistente financeira pessoal carinhosa...`, // (Mantenha seus prompts aqui)
  julgar: `Você é a Odete, uma assistente financeira pessoal EXTREMAMENTE rígida...` // (Mantenha seus prompts aqui)
};

const SAMPLE_QUESTIONS = ["Posso gastar?", "Quanto gastei no iFood?", "Resumo do mês"];

interface ChatScreenProps {
  onShowProfile?: () => void; // Mantendo compatibilidade se for passado via props
}

const ChatScreen: React.FC<ChatScreenProps> = () => {
  // --- Global State ---
  // Placeholder para passar na validação local, já que usamos backend
  const [apiKey, setApiKey] = useState('proxy-mode'); 
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [prompts, setPrompts] = useState<SystemPrompts>(DEFAULT_PROMPTS);

  // --- Auth & Data State ---
  const { user } = useAuth(); // 🟢 Pegando usuário logado
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);

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

  // --- Initialization Effects ---

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

  // 3. 🟢 CARREGAR SESSÕES DO SUPABASE (Substitui LocalStorage)
  useEffect(() => {
    if (!user) return;

    const fetchSessions = async () => {
      const { data, error } = await supabase
        .from('ai_chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) {
        console.error('Erro ao carregar sessões:', error);
      } else if (data) {
        setSessions(data as ChatSession[]);
      }
    };

    fetchSessions();
  }, [user]);

  // --- Session Management Functions ---

  // 🟢 CRIAR NOVA CONVERSA NO BANCO
  const createNewChat = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('ai_chat_sessions')
        .insert({
          user_id: user.id,
          mode: OdeteMode.MIMAR,
          title: 'Nova Conversa',
          preview: 'Iniciando...'
        })
        .select()
        .single();

      if (error) throw error;
      if (data) {
        setSessions(prev => [data, ...prev]);
        openChat(data);
      }
    } catch (err) {
      console.error('Erro ao criar chat:', err);
      alert('Não foi possível criar uma nova conversa.');
    }
  };

  // 🟢 CARREGAR MENSAGENS DO BANCO
  const openChat = async (session: ChatSession) => {
    setActiveChatId(session.id);
    setMode(session.mode); // Define o modo salvo na sessão
    setInput('');
    setIsLoading(true);
    
    // Reset visual
    if (isRecordingAudio) cancelAudioRecording();
    if (isLiveActive) stopLive();

    try {
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

  // 🟢 DELETAR SESSÃO NO BANCO
  const deleteSession = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!confirm('Tem certeza que deseja apagar esta conversa?')) return;

    try {
      const { error } = await supabase.from('ai_chat_sessions').delete().eq('id', id);
      if (error) throw error;

      setSessions(prev => prev.filter(s => s.id !== id));
      if (activeChatId === id) setActiveChatId(null);
    } catch (err) {
      console.error('Erro ao deletar:', err);
    }
  };

  const handleBackToList = () => {
    setActiveChatId(null);
    if (isLiveActive) stopLive();
    // Recarrega a lista para atualizar previews
    if (user) {
        supabase.from('ai_chat_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false })
        .then(({ data }) => { if(data) setSessions(data as ChatSession[]) });
    }
  };

  // 🟢 HELPER: SALVAR MENSAGEM
  const saveMessageToDb = async (sessionId: string, role: 'user' | 'model', content: string, type: string = 'text') => {
    console.log(`[SaveMessage] Iniciando salvamento... Sessão: ${sessionId}, Role: ${role}`);

    const { data, error } = await supabase.from('ai_chat_messages').insert({
        session_id: sessionId,
        role,
        content,
        metadata: { type }
    }).select();

    if (error) {
        console.error('❌ ERRO CRÍTICO AO SALVAR NO SUPABASE:', error);
        // Opcional: Alertar na tela para você saber na hora
        
    } else {
        console.log('✅ Mensagem salva com sucesso no banco:', data);

        // Atualiza o preview e timestamp da sessão
        const { error: sessionError } = await supabase.from('ai_chat_sessions')
            .update({ 
                preview: type === 'audio' ? '🎵 Áudio' : content.slice(0, 50),
                updated_at: new Date().toISOString()
            })
            .eq('id', sessionId);
        
        if (sessionError) console.error('⚠️ Erro ao atualizar timestamp da sessão:', sessionError);
    }
  };

  // --- Chat Functions ---

  const handleSendMessage = async (text: string = input, audioData?: { data: string, mimeType: string }) => {
    if ((!text.trim() && !audioData) || !geminiServiceRef.current || !activeChatId) return;

    // 1. Mensagem do Usuário (Otimista)
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

    // 🟢 Salvar User no Banco
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

      // 2. Mensagem da IA
      const modelMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'model',
        content: responseText,
        timestamp: new Date()
      };

      setMessages(prev => [...prev, modelMsg]);
      
      // 🟢 Salvar IA no Banco
      saveMessageToDb(activeChatId, 'model', responseText, 'text');

    } catch (error) {
      console.error(error);
      setMessages(prev => [...prev, {
        id: Date.now().toString(),
        role: 'model',
        content: "Erro ao processar mensagem.",
        timestamp: new Date()
      }]);
    } finally {
      setIsLoading(false);
    }
  };

  // ... (MANTENHA TODAS AS FUNÇÕES DE ÁUDIO E LIVE API IGUAIS AO ARQUIVO ORIGINAL) ...
  // startAudioRecording, stopAudioRecording, cancelAudioRecording, startLive, stopLive, etc.
  // ... Copie do seu arquivo original as funções que não mudaram ...

  const startAudioRecording = async () => {
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

  const stopAudioRecording = () => {
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

  const cancelAudioRecording = () => {
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

  const startLive = async () => {
    if (!geminiServiceRef.current) return alert("API Key missing");
    if (isLiveActive) { stopLive(); return; }

    setIsConnecting(true);
    setIsMuted(false);
    setIsAiSpeaking(false);

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setAudioStream(stream);

      const inputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      inputAudioContextRef.current = inputCtx;
      
      const outputCtx = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      audioContextRef.current = outputCtx;
      
      await inputCtx.resume();
      await outputCtx.resume();
      nextStartTimeRef.current = outputCtx.currentTime;

      const ai = geminiServiceRef.current.getAIInstance();
      const sessionPromise = ai.live.connect({
        model: 'gemini-2.5-flash-native-audio-preview-09-2025',
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: 'Kore' } } },
          systemInstruction: prompts[mode],
          tools: geminiServiceRef.current.getToolsDef(),
        },
        callbacks: {
          onopen: () => {
            setIsConnecting(false);
            setIsLiveActive(true);
            
            const source = inputCtx.createMediaStreamSource(stream);
            const processor = inputCtx.createScriptProcessor(4096, 1, 1);
            
            processor.onaudioprocess = (e) => {
              if (inputAudioContextRef.current?.state === 'suspended') return;
              const inputData = e.inputBuffer.getChannelData(0);
              sessionPromise.then(session => session.sendRealtimeInput({ media: createPcmBlob(inputData) }));
            };
            
            const silenceNode = inputCtx.createGain();
            silenceNode.gain.value = 0;
            
            source.connect(processor);
            processor.connect(silenceNode);
            silenceNode.connect(inputCtx.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            const parts = msg.serverContent?.modelTurn?.parts || [];
            
            for (const part of parts) {
                if (part.inlineData?.data && audioContextRef.current) {
                    const audioData = part.inlineData.data;
                    const ctx = audioContextRef.current;
                    
                    if (ctx.state === 'suspended') await ctx.resume();

                    try {
                      const buffer = await decodeAudioData(base64ToUint8Array(audioData), ctx, 24000);
                      
                      const source = ctx.createBufferSource();
                      source.buffer = buffer;
                      source.connect(ctx.destination);
                      
                      const startTime = Math.max(nextStartTimeRef.current, ctx.currentTime);
                      source.start(startTime);
                      nextStartTimeRef.current = startTime + buffer.duration;
                      
                      setIsAiSpeaking(true);
                      sourceNodesRef.current.add(source);
                      
                      source.onended = () => {
                        sourceNodesRef.current.delete(source);
                        if (sourceNodesRef.current.size === 0) {
                          setIsAiSpeaking(false);
                        }
                      };
                    } catch (e) {
                      console.error("Audio Decode Error:", e);
                    }
                }
            }

            if (msg.toolCall) {
                for (const fc of msg.toolCall?.functionCalls ?? []) {
                  if (!fc.name) continue;
                    const dbTools = geminiServiceRef.current?.getDbTools();
                    if (dbTools && dbTools[fc.name]) {
                        console.log("Executing tool:", fc.name);
                        const resultJson = await dbTools[fc.name].execute(fc.args);
                         sessionPromise.then(session => {
                            session.sendToolResponse({
                                functionResponses: {
                                    id: fc.id,
                                    name: fc.name,
                                    response: { result: JSON.parse(resultJson) } 
                                }
                            });
                        });
                    }
                }
            }
            
            if (msg.serverContent?.interrupted) {
                console.log("Interrupted");
                sourceNodesRef.current.forEach(n => { try { n.stop() } catch(e){} });
                sourceNodesRef.current.clear();
                setIsAiSpeaking(false);
                if(audioContextRef.current) nextStartTimeRef.current = audioContextRef.current.currentTime;
            }
          },
          onclose: () => stopLive(),
          onerror: (e) => { console.error("Live Error", e); stopLive(); }
        }
      });
    } catch (e) {
      console.error("Connection Error", e);
      stopLive();
      alert("Não foi possível conectar ao microfone ou API.");
    }
  };

  const stopLive = async () => {
    setIsLiveActive(false);
    setIsConnecting(false);
    setIsAiSpeaking(false);
    
    if (audioStream) {
      audioStream.getTracks().forEach(t => t.stop());
      setAudioStream(null);
    }
    
    sourceNodesRef.current.forEach(source => {
      try { source.stop(); } catch (e) {}
    });
    sourceNodesRef.current.clear();

    if (inputAudioContextRef.current) {
        if (inputAudioContextRef.current.state !== 'closed') {
            try { await inputAudioContextRef.current.close(); } catch(e) {} 
        }
        inputAudioContextRef.current = null;
    }

    if (audioContextRef.current) {
        if (audioContextRef.current.state !== 'closed') {
            try { await audioContextRef.current.close(); } catch(e) {}
        }
        audioContextRef.current = null;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (audioStream) audioStream.getAudioTracks().forEach(t => t.enabled = isMuted); 
    if (inputAudioContextRef.current) isMuted ? inputAudioContextRef.current.resume() : inputAudioContextRef.current.suspend();
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && geminiServiceRef.current) {
        const reader = new FileReader();
        reader.onloadend = async () => {
            const base64String = (reader.result as string).split(',')[1];
            const userMsg: Message = { id: Date.now().toString(), role: 'user', content: '📷 Imagem enviada', type: 'image', timestamp: new Date() };
            setMessages(p => [...p, userMsg]);
            
            // 🟢 Salvar no Banco (Imagem)
            if (activeChatId) saveMessageToDb(activeChatId, 'user', 'Imagem enviada', 'image');

            setIsLoading(true);
            try {
                const response = await geminiServiceRef.current!.analyzeImage(base64String, "O que é isso?", prompts[mode]);
                
                const modelMsg: Message = { id: (Date.now() + 1).toString(), role: 'model', content: response, timestamp: new Date() };
                setMessages(p => [...p, modelMsg]);

                // 🟢 Salvar no Banco (Resposta da Imagem)
                if (activeChatId) saveMessageToDb(activeChatId, 'model', response, 'text');

            } catch(e) { console.error(e); } finally { setIsLoading(false); }
        };
        reader.readAsDataURL(file);
    }
  };

  // --- View: Chat List ---
  if (!activeChatId) {
    return (
       <div className="flex flex-col h-screen w-full bg-white shadow-2xl border-x border-gray-200">
          <div className="bg-[#E0F2E9] p-4 flex items-center justify-between shadow-sm z-10">
            <h1 className="font-bold text-gray-900 text-lg">Conversas</h1>
            <div className="flex gap-2">
                 <button onClick={() => setIsSettingsOpen(true)} className="p-2 text-emerald-700 rounded-full hover:bg-emerald-100"><Settings size={22}/></button>
                 <button onClick={createNewChat} className="p-2 text-emerald-700 rounded-full hover:bg-emerald-100"><MessageSquarePlus size={22}/></button>
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
                        <button 
                            onClick={(e) => deleteSession(e, session.id)}
                            className="p-2 text-gray-300 hover:text-red-500 transition-colors"
                        >
                            <Trash2 size={16} />
                        </button>
                    </div>
                ))
            )}
          </div>
          
          <SettingsModal 
            isOpen={isSettingsOpen} 
            onClose={() => setIsSettingsOpen(false)}
            prompts={prompts}
            onSave={(newPrompts) => { setPrompts(newPrompts); setIsSettingsOpen(false); }}
          />
       </div>
    );
  }

  // --- View: Active Chat ---
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
          <button onClick={() => setIsSettingsOpen(true)} className="hover:bg-emerald-100 p-2 rounded-full transition-colors">
             <Settings size={24} />
          </button>
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