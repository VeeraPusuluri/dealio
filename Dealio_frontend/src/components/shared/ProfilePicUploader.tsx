import { useRef, useState, useCallback } from 'react';
import { Camera, Upload, X, Check, RotateCcw, User } from 'lucide-react';
import { useAuthStore } from '@/stores/useAuthStore';
import { toast } from 'sonner';

const STORAGE_KEY = (userId: string) => `dealio_avatar_${userId}`;

interface ProfilePicUploaderProps {
  size?: number;       // avatar circle diameter in px
  showLabel?: boolean;
}

export function getStoredAvatar(userId: string): string | null {
  try { return localStorage.getItem(STORAGE_KEY(userId)); } catch { return null; }
}

export default function ProfilePicUploader({ size = 80, showLabel = true }: ProfilePicUploaderProps) {
  const { user, setUser } = useAuthStore();
  const fileRef    = useRef<HTMLInputElement>(null);
  const videoRef   = useRef<HTMLVideoElement>(null);
  const canvasRef  = useRef<HTMLCanvasElement>(null);
  const streamRef  = useRef<MediaStream | null>(null);

  const [mode, setMode]       = useState<'idle' | 'camera' | 'preview'>('idle');
  const [preview, setPreview] = useState<string | null>(user?.avatar ?? null);
  const [cameraErr, setCameraErr] = useState('');

  const currentAvatar = preview ?? user?.avatar ?? null;

  // ── Open camera ──────────────────────────────────────────────────────────
  const openCamera = async () => {
    setCameraErr('');
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } });
      streamRef.current = stream;
      setMode('camera');
      // Attach stream after DOM update
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          videoRef.current.play();
        }
      }, 50);
    } catch {
      setCameraErr('Camera access denied. Please allow camera permission and try again.');
      toast.error('Camera access denied');
    }
  };

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach(t => t.stop());
    streamRef.current = null;
  }, []);

  // ── Capture selfie ───────────────────────────────────────────────────────
  const capturePhoto = () => {
    const video  = videoRef.current;
    const canvas = canvasRef.current;
    if (!video || !canvas) return;
    canvas.width  = video.videoWidth  || 320;
    canvas.height = video.videoHeight || 320;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    // Mirror the selfie horizontally
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
    stopCamera();
    setPreview(dataUrl);
    setMode('preview');
  };

  // ── File upload ──────────────────────────────────────────────────────────
  const handleFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }
    if (file.size > 5 * 1024 * 1024) { toast.error('Image must be under 5 MB'); return; }
    const reader = new FileReader();
    reader.onload = ev => {
      const result = ev.target?.result as string;
      // Resize to max 400px to keep localStorage lean
      const img = new Image();
      img.onload = () => {
        const canvas = canvasRef.current!;
        const max = 400;
        const ratio = Math.min(max / img.width, max / img.height, 1);
        canvas.width  = img.width  * ratio;
        canvas.height = img.height * ratio;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', 0.85);
        setPreview(compressed);
        setMode('preview');
      };
      img.src = result;
    };
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  // ── Save avatar ──────────────────────────────────────────────────────────
  const saveAvatar = () => {
    if (!preview || !user?.id) return;
    try {
      localStorage.setItem(STORAGE_KEY(user.id), preview);
      setUser({ ...user, avatar: preview });
      toast.success('Profile picture updated');
      setMode('idle');
    } catch {
      toast.error('Could not save — image may be too large');
    }
  };

  // ── Remove avatar ────────────────────────────────────────────────────────
  const removeAvatar = () => {
    if (!user?.id) return;
    try { localStorage.removeItem(STORAGE_KEY(user.id)); } catch { /* ignore */ }
    setUser({ ...user, avatar: undefined });
    setPreview(null);
    setMode('idle');
    toast.success('Profile picture removed');
  };

  const initials = (user?.name || '?').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();
  const color    = user ? (['builder','cp','customer','bank','admin','nri'] as const)
    .includes(user.role as never) ? '#0A7E8C' : '#0A7E8C' : '#0A7E8C';

  return (
    <div className="flex flex-col items-center gap-3">
      {/* Avatar circle */}
      <div className="relative" style={{ width: size, height: size }}>
        <div className="rounded-full overflow-hidden flex items-center justify-center flex-shrink-0 text-white font-bold"
          style={{ width: size, height: size, background: currentAvatar ? 'transparent' : `linear-gradient(135deg, ${color}, ${color}bb)`, fontSize: size * 0.28 }}>
          {currentAvatar ? (
            <img src={currentAvatar} alt="avatar"
              className="w-full h-full object-cover" />
          ) : (
            initials || <User size={size * 0.4} />
          )}
        </div>
        {/* Online dot */}
        <span className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white" />
      </div>

      {/* Camera mode */}
      {mode === 'camera' && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center gap-4 p-6">
          <p className="text-white font-semibold text-[15px]">Take a selfie</p>
          <div className="relative rounded-2xl overflow-hidden" style={{ width: 320, height: 320 }}>
            {/* Mirror video for selfie */}
            <video ref={videoRef} className="w-full h-full object-cover" style={{ transform: 'scaleX(-1)' }} playsInline muted />
          </div>
          <div className="flex gap-3">
            <button onClick={() => { stopCamera(); setMode('idle'); }}
              className="w-12 h-12 rounded-full bg-white/10 border border-white/20 text-white flex items-center justify-center hover:bg-white/20 transition-colors">
              <X size={18} />
            </button>
            <button onClick={capturePhoto}
              className="w-14 h-14 rounded-full bg-white flex items-center justify-center shadow-lg hover:scale-105 transition-transform">
              <Camera size={22} className="text-slate-800" />
            </button>
          </div>
        </div>
      )}

      {/* Preview mode */}
      {mode === 'preview' && preview && (
        <div className="fixed inset-0 z-50 bg-black/80 flex flex-col items-center justify-center gap-4 p-6">
          <p className="text-white font-semibold text-[15px]">Use this photo?</p>
          <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-white shadow-2xl">
            <img src={preview} alt="preview" className="w-full h-full object-cover" />
          </div>
          <div className="flex gap-3">
            <button onClick={() => { setPreview(currentAvatar); setMode('idle'); }}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/10 border border-white/20 text-white text-[13px] font-medium hover:bg-white/20 transition-colors">
              <RotateCcw size={14} /> Retake
            </button>
            <button onClick={saveAvatar}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white text-slate-800 text-[13px] font-bold hover:bg-white/90 transition-colors shadow-lg">
              <Check size={14} /> Save Photo
            </button>
          </div>
        </div>
      )}

      {/* Hidden canvas for processing */}
      <canvas ref={canvasRef} className="hidden" />

      {/* Action buttons */}
      {showLabel && mode === 'idle' && (
        <div className="flex gap-2">
          <button onClick={openCamera}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold border border-border text-foreground hover:bg-muted/50 transition-colors">
            <Camera size={13} style={{ color }} /> Selfie
          </button>
          <button onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[12px] font-semibold border border-border text-foreground hover:bg-muted/50 transition-colors">
            <Upload size={13} style={{ color }} /> Upload
          </button>
          {currentAvatar && (
            <button onClick={removeAvatar}
              className="px-3 py-1.5 rounded-xl text-[12px] font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors border border-border">
              <X size={13} />
            </button>
          )}
        </div>
      )}

      {cameraErr && (
        <p className="text-[11px] text-destructive text-center max-w-xs">{cameraErr}</p>
      )}

      <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </div>
  );
}
