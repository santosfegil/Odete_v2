import { useRef, useState } from 'react';
import { X, Share2, Lock, Loader2, Download, Copy, Check } from 'lucide-react';
import { getIconComponent } from '../lib/iconMap';
import html2canvas from 'html2canvas';
import ShareableMedalCard from './ShareableMedalCard';

interface MedalDetailModalProps {
  medal: {
    id: string;
    name: string;
    icon: string;
    description: string;
    earned?: boolean;
    earned_at?: string;
  };
  onClose: () => void;
}

// Inline SVG icons for social platforms
const WhatsAppIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
  </svg>
);

const TwitterXIcon = () => (
  <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
  </svg>
);

const FacebookIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
  </svg>
);

const InstagramIcon = () => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
  </svg>
);

export default function MedalDetailModal({ medal, onClose }: MedalDetailModalProps) {
  const isEarned = !!medal.earned;
  const shareCardRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);
  const [shareBlob, setShareBlob] = useState<Blob | null>(null);
  const [showShareModal, setShowShareModal] = useState(false);
  const [copied, setCopied] = useState(false);

  const shareText = `Conquistei a medalha "${medal.name}" no Odete!`;

  const generateImage = async (): Promise<Blob | null> => {
    if (!shareCardRef.current) return null;

    const canvas = await html2canvas(shareCardRef.current, {
      backgroundColor: null,
      scale: 2,
      useCORS: true,
    });

    return new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, 'image/png')
    );
  };

  const handleShare = async () => {
    setSharing(true);

    try {
      const blob = await generateImage();
      if (!blob) throw new Error('Falha ao gerar imagem');

      const file = new File([blob], `odete-medalha-${medal.id}.png`, {
        type: 'image/png',
      });

      // Try native share on mobile (works well with social apps)
      if (navigator.share && navigator.canShare({ files: [file] })) {
        try {
          await navigator.share({
            files: [file],
            title: `Medalha: ${medal.name}`,
            text: shareText,
          });
          return; // Success - don't show custom modal
        } catch (err: any) {
          if (err.name === 'AbortError') return; // User cancelled
          // Fall through to custom modal
        }
      }

      // Fallback: show custom share modal
      setShareBlob(blob);
      setShowShareModal(true);
    } catch (err: any) {
      console.error('Erro ao gerar imagem:', err);
    } finally {
      setSharing(false);
    }
  };

  const handleDownload = () => {
    if (!shareBlob) return;
    const url = URL.createObjectURL(shareBlob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `odete-medalha-${medal.id}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleCopyImage = async () => {
    if (!shareBlob) return;
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ 'image/png': shareBlob })
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: download instead
      handleDownload();
    }
  };

  const handleWhatsApp = () => {
    handleCopyImage(); // Copy image to clipboard for easy pasting
    const encoded = encodeURIComponent(shareText);
    window.open(`https://api.whatsapp.com/send?text=${encoded}`, '_blank');
  };

  const handleTwitter = () => {
    const encoded = encodeURIComponent(shareText);
    window.open(`https://twitter.com/intent/tweet?text=${encoded}`, '_blank');
  };

  const handleFacebook = () => {
    const encoded = encodeURIComponent(shareText);
    window.open(`https://www.facebook.com/sharer.php?quote=${encoded}`, '_blank');
  };

  const handleInstagram = () => {
    // Instagram doesn't support web sharing - download image and show instruction
    handleDownload();
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-6 animate-in fade-in duration-200">
      <div className="relative flex w-full max-w-sm flex-col items-center gap-4 rounded-3xl bg-white p-6 pt-10 shadow-lg dark:bg-stone-800 transition-all">

        {/* Botão Fechar */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 flex h-8 w-8 cursor-pointer items-center justify-center overflow-hidden rounded-full text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-700 transition-colors"
        >
          <X size={24} />
        </button>

        <div className="flex w-full flex-col items-center gap-4">
          <h1 className="text-2xl font-bold text-stone-900 dark:text-stone-100 text-center leading-tight">
            {medal.name}
          </h1>

          {/* Círculo do Ícone */}
          <div className={`relative flex h-32 w-32 items-center justify-center rounded-full transition-colors duration-300 ${
            isEarned
              ? 'bg-yellow-100 dark:bg-yellow-900/50 text-yellow-500 dark:text-yellow-400'
              : 'bg-stone-100 dark:bg-stone-800 text-stone-300 dark:text-stone-600 grayscale'
          }`}>
            {getIconComponent(medal.icon, '', 64)}
          </div>

          <p className="text-base font-normal leading-relaxed text-stone-600 dark:text-stone-300 text-center">
            {medal.description}
          </p>
        </div>

        {/* Rodapé: Compartilhar ou Bloqueado */}
        {isEarned ? (
          <button
            onClick={handleShare}
            disabled={sharing}
            className="flex h-12 w-full min-w-[84px] cursor-pointer items-center justify-center gap-2 overflow-hidden rounded-full bg-stone-900 px-5 text-base font-bold leading-normal text-white hover:bg-stone-800 transition-colors dark:bg-stone-100 dark:text-stone-900 dark:hover:bg-stone-200 disabled:opacity-70"
          >
            {sharing ? (
              <Loader2 size={20} className="animate-spin" />
            ) : (
              <Share2 size={20} />
            )}
            <span className="truncate">
              {sharing ? 'Gerando...' : 'Compartilhar Medalha'}
            </span>
          </button>
        ) : (
          <div className="flex h-12 w-full items-center justify-center gap-2 rounded-full bg-stone-100 text-stone-400 dark:bg-stone-800 dark:text-stone-500">
            <Lock size={18} />
            <span className="text-sm font-bold">Bloqueado</span>
          </div>
        )}

        {/* Custom Share Modal */}
        {showShareModal && shareBlob && (
          <div className="absolute inset-0 bg-white dark:bg-stone-800 rounded-3xl flex flex-col items-center p-6 pt-10 z-10 animate-in fade-in duration-200">
            <button
              onClick={() => setShowShareModal(false)}
              className="absolute top-4 right-4 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full text-stone-500 hover:bg-stone-100 dark:text-stone-400 dark:hover:bg-stone-700 transition-colors"
            >
              <X size={24} />
            </button>

            <h2 className="text-lg font-bold text-stone-900 dark:text-stone-100 mb-6">
              Compartilhar
            </h2>

            <div className="grid grid-cols-3 gap-4 w-full">
              {/* WhatsApp */}
              <button
                onClick={handleWhatsApp}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-[#25D366] flex items-center justify-center text-white">
                  <WhatsAppIcon />
                </div>
                <span className="text-[10px] font-bold text-stone-600 dark:text-stone-300">WhatsApp</span>
              </button>

              {/* Instagram */}
              <button
                onClick={handleInstagram}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
              >
                <div className="w-12 h-12 rounded-full flex items-center justify-center text-white" style={{ background: 'linear-gradient(45deg, #f09433 0%, #e6683c 25%, #dc2743 50%, #cc2366 75%, #bc1888 100%)' }}>
                  <InstagramIcon />
                </div>
                <span className="text-[10px] font-bold text-stone-600 dark:text-stone-300">Instagram</span>
              </button>

              {/* Twitter/X */}
              <button
                onClick={handleTwitter}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-black flex items-center justify-center text-white">
                  <TwitterXIcon />
                </div>
                <span className="text-[10px] font-bold text-stone-600 dark:text-stone-300">X</span>
              </button>

              {/* Facebook */}
              <button
                onClick={handleFacebook}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-[#1877F2] flex items-center justify-center text-white">
                  <FacebookIcon />
                </div>
                <span className="text-[10px] font-bold text-stone-600 dark:text-stone-300">Facebook</span>
              </button>

              {/* Copy Image */}
              <button
                onClick={handleCopyImage}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-stone-200 dark:bg-stone-600 flex items-center justify-center text-stone-700 dark:text-stone-200">
                  {copied ? <Check size={22} /> : <Copy size={22} />}
                </div>
                <span className="text-[10px] font-bold text-stone-600 dark:text-stone-300">
                  {copied ? 'Copiado!' : 'Copiar'}
                </span>
              </button>

              {/* Download */}
              <button
                onClick={handleDownload}
                className="flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-stone-50 dark:hover:bg-stone-700 transition-colors"
              >
                <div className="w-12 h-12 rounded-full bg-emerald-500 flex items-center justify-center text-white">
                  <Download size={22} />
                </div>
                <span className="text-[10px] font-bold text-stone-600 dark:text-stone-300">Download</span>
              </button>
            </div>

            <p className="text-[10px] text-stone-400 mt-4 text-center">
              Para Instagram e TikTok, baixe a imagem e compartilhe pelo app
            </p>
          </div>
        )}
      </div>

      {/* Card offscreen para captura */}
      {isEarned && (
        <div style={{ position: 'absolute', left: -9999, top: -9999 }}>
          <ShareableMedalCard ref={shareCardRef} medal={medal} />
        </div>
      )}
    </div>
  );
}
