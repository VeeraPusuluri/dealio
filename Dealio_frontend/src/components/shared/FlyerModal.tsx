import { useState } from 'react';
import { X, Download, Share2, Copy, Building2 } from 'lucide-react';
import { toast } from 'sonner';

interface ProjectSummary {
  id: number;
  name: string;
  city: string;
  locality?: string;
  configurations?: string[];
  priceMin?: number;
  priceMax?: number;
  reraNumber?: string;
}

interface FlyerModalProps {
  project: ProjectSummary;
  onClose: () => void;
  cpName?: string;
  cpPhone?: string;
}

const fmtPrice = (min?: number, max?: number) => {
  if (!min && !max) return 'Price on request';
  const fmt = (n: number) => {
    if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)} Cr`;
    if (n >= 100_000) return `₹${(n / 100_000).toFixed(0)} L`;
    return `₹${n.toLocaleString('en-IN')}`;
  };
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt(min || max || 0);
};

const FlyerModal = ({ project, onClose, cpName = 'Ravi Kumar', cpPhone = '+91 98765 43210' }: FlyerModalProps) => {
  const [style, setStyle] = useState<'portrait' | 'landscape'>('portrait');

  const location = [project.locality, project.city].filter(Boolean).join(', ');
  const configs = project.configurations?.join(' / ') || '';
  const priceText = fmtPrice(project.priceMin, project.priceMax);
  const shareText = `🏠 ${project.name}\n📍 ${location}\n💰 ${priceText}${configs ? `\n🛏️ ${configs}` : ''}\n\n📞 Contact: ${cpName} — ${cpPhone}`;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <div className="relative bg-card rounded-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-xl animate-slide-up space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-bold text-card-foreground">Generate Flyer</h3>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-muted"><X size={18} className="text-muted-foreground" /></button>
        </div>

        <div className="flex gap-3">
          {(['portrait', 'landscape'] as const).map(s => (
            <button key={s} onClick={() => setStyle(s)}
              className={`flex-1 py-2.5 rounded-lg text-sm font-medium border-2 capitalize ${style === s ? 'border-accent text-accent' : 'border-border text-muted-foreground'}`}>
              {s}
            </button>
          ))}
        </div>

        <div className={`rounded-xl overflow-hidden border border-border ${style === 'landscape' ? 'aspect-video' : 'aspect-[3/4]'}`}
          style={{ background: 'linear-gradient(135deg, #1B3A5C 0%, #0F2035 100%)' }}>
          <div className="h-full flex flex-col text-white p-5 justify-between">
            <div className="flex items-center justify-center flex-1">
              <Building2 size={64} className="text-white/20" />
            </div>
            <div>
              <h4 className="text-lg font-bold">{project.name}</h4>
              <p className="text-xs opacity-70">{location}</p>
              <p className="text-sm font-semibold mt-2" style={{ color: '#E87722' }}>{priceText}</p>
              {configs && <p className="text-xs opacity-80 mt-1">{configs}</p>}
              <div className="border-t border-white/20 pt-2 mt-3">
                <p className="text-xs font-semibold">{cpName}</p>
                <p className="text-[10px] opacity-70">{cpPhone} · Dealio Certified CP</p>
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <button onClick={() => toast.success('Flyer image downloading...')}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2"
            style={{ backgroundColor: '#E87722' }}>
            <Download size={14} /> Download
          </button>
          <button onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank')}
            className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-white flex items-center justify-center gap-2 bg-[#25D366]">
            <Share2 size={14} /> WhatsApp
          </button>
          <button onClick={() => { navigator.clipboard.writeText(shareText); toast.success('Flyer text copied to clipboard'); }}
            className="py-2.5 px-4 rounded-lg text-sm font-medium border border-border text-card-foreground flex items-center gap-2 hover:bg-muted">
            <Copy size={14} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default FlyerModal;