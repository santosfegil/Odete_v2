import React, { useEffect, useState } from 'react';
import { Mic, MicOff, PhoneOff, X, Volume2 } from 'lucide-react';
import { OdeteMode } from '../types';
import { OdeteAvatar } from './OdeteLogos';

interface VoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  status: 'connecting' | 'active' | 'error';
  mode: OdeteMode;
  isMuted: boolean;
  toggleMute: () => void;
  isAiSpeaking: boolean;
}

const VoiceModal: React.FC<VoiceModalProps> = ({ 
  isOpen, 
  onClose, 
  status, 
  mode,
  isMuted,
  toggleMute,
  isAiSpeaking
}) => {
  const [duration, setDuration] = useState(0);

  useEffect(() => {
    let interval: any;
    if (isOpen && status === 'active') {
      interval = setInterval(() => {
        setDuration(prev => prev + 1);
      }, 1000);
    } else {
      setDuration(0);
    }
    return () => clearInterval(interval);
  }, [isOpen, status]);

  if (!isOpen) return null;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const bgColor = mode === OdeteMode.MIMAR ? 'bg-emerald-600' : 'bg-red-600';
  const pulseColor = mode === OdeteMode.MIMAR ? 'bg-emerald-400' : 'bg-red-400';

  return (
    <div className={`fixed inset-0 z-50 flex flex-col items-center justify-between p-8 text-white transition-all duration-500 ${bgColor}`}>
      {/* Header */}
      <div className="w-full flex justify-between items-start">
        <button onClick={onClose} className="p-2 rounded-full bg-white/20 hover:bg-white/30 backdrop-blur-sm">
            <X size={24} />
        </button>
        <div className="flex flex-col items-center">
            <h2 className="text-xl font-semibold tracking-wide flex items-center gap-2">
                ODETE {mode === OdeteMode.JULGAR && '🔥'}
            </h2>
            <p className="text-sm opacity-80 font-light flex items-center gap-2">
                {status === 'connecting' ? 'Conectando...' : 
                 status === 'error' ? 'Erro de conexão' : 
                 isAiSpeaking ? <span className="flex items-center gap-1"><Volume2 size={14} className="animate-pulse"/> Falando...</span> : 
                 'Ouvindo...'}
            </p>
            {status === 'active' && (
                <span className="mt-1 text-2xl font-mono opacity-90">{formatTime(duration)}</span>
            )}
        </div>
        <div className="w-10"></div> {/* Spacer for center alignment */}
      </div>

      {/* Avatar / Visualizer */}
      <div className="relative">
        {status === 'active' && (
            <>
                {/* Visual waves for AI speaking */}
                {isAiSpeaking ? (
                    <>
                        <div className={`absolute inset-0 rounded-full animate-ping opacity-40 ${pulseColor}`} style={{ animationDuration: '1s' }}></div>
                        <div className={`absolute inset-0 rounded-full animate-ping opacity-20 delay-75 ${pulseColor}`} style={{ animationDuration: '1.5s' }}></div>
                    </>
                ) : (
                    /* Gentle pulse for listening */
                    <div className={`absolute inset-0 rounded-full animate-pulse opacity-20 ${pulseColor}`} style={{ animationDuration: '3s' }}></div>
                )}
            </>
        )}
        <div className={`w-48 h-48 rounded-full border-4 ${isAiSpeaking ? 'border-white' : 'border-white/30'} shadow-2xl overflow-hidden relative z-10 transition-all duration-300 transform ${isAiSpeaking ? 'scale-105' : 'scale-100'}`}>
             <OdeteAvatar size={192} />
        </div>
      </div>

      {/* Controls */}
      <div className="w-full max-w-xs flex items-center justify-around pb-8">
         <button 
            onClick={toggleMute}
            className={`p-4 rounded-full transition-all ${isMuted ? 'bg-white text-gray-900' : 'bg-white/20 hover:bg-white/30 text-white'}`}
         >
            {isMuted ? <MicOff size={32} /> : <Mic size={32} />}
         </button>

         <button 
            onClick={onClose}
            className="p-6 rounded-full bg-red-500 hover:bg-red-600 text-white shadow-lg transition-transform hover:scale-105 active:scale-95"
         >
            <PhoneOff size={40} fill="currentColor" />
         </button>
         
         <div className="w-16"></div> 
      </div>
    </div>
  );
};

export default VoiceModal;