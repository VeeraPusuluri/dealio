import { useState, useEffect, useRef } from 'react';
import { X, Download, Share2, Copy, Building2, MapPin, Calendar, CheckCircle2, Home, Users, Sparkles, Link2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuthStore } from '@/stores/useAuthStore';
import { cpApi } from '@/lib/api';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';

interface ProjectSummary {
  id: number;
  name: string;
  city?: string;
  locality?: string;
  address?: string | null;
  builderName?: string | null;
  configurations?: string[];
  priceMin?: number | null;
  priceMax?: number | null;
  possessionDate?: string | null;
  reraNumber?: string | null;
  totalUnits?: number | null;
  availableUnits?: number | null;
  description?: string | null;
  imageUrl?: string | null;
  status?: string;
}

interface FlyerModalProps {
  project: ProjectSummary;
  onClose: () => void;
  cpId?: string | number | null;
}

const fmt = (n: number) => {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(0)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
};
const fmtPrice = (min?: number | null, max?: number | null) => {
  if (!min && !max) return 'Price on request';
  if (min && max) return `${fmt(min)} – ${fmt(max)}`;
  return fmt(min || max || 0);
};

type Theme = 'dark' | 'light' | 'warm';

const THEMES: { id: Theme; label: string; preview: string }[] = [
  { id: 'dark',  label: 'Premium',  preview: 'bg-slate-900' },
  { id: 'light', label: 'Fresh',    preview: 'bg-white border border-slate-200' },
  { id: 'warm',  label: 'Vibrant',  preview: 'bg-orange-500' },
];

function FlyerPreview({
  project, theme, cpName, cpPhone, shareLink,
}: {
  project: ProjectSummary;
  theme: Theme;
  cpName: string;
  cpPhone: string;
  shareLink?: string;
}) {
  const location = [project.locality, project.city].filter(Boolean).join(', ');
  const configs  = project.configurations?.join('  /  ') || '';
  const price    = fmtPrice(project.priceMin, project.priceMax);
  const avail    = project.availableUnits;
  const descSnippet = project.description
    ? project.description.slice(0, 120) + (project.description.length > 120 ? '…' : '')
    : null;

  /* ── theme tokens ── */
  const t = {
    dark: {
      wrapper: 'text-white',
      bg:      'linear-gradient(160deg, #0F2035 0%, #1B3A5C 55%, #0A7E8C 100%)',
      imgOverlay: 'bg-gradient-to-t from-[#0F2035] via-[#0F2035]/60 to-transparent',
      nameTxt:  'text-white',
      sub:      'text-white/60',
      priceTxt: '#F59E0B',
      chipBg:   'bg-white/10 text-white/90',
      divider:  'border-white/15',
      statBg:   'bg-white/8',
      statTxt:  'text-white',
      statSub:  'text-white/50',
      rera:     'bg-emerald-900/40 text-emerald-300 border border-emerald-700/30',
      footerBg: 'bg-white/8 border-t border-white/10',
      footerTxt:'text-white',
      footerSub:'text-white/50',
      badge:    'bg-[#E87722] text-white',
      desc:     'text-white/65',
    },
    light: {
      wrapper: 'text-slate-800',
      bg:      'linear-gradient(160deg, #f8fafc 0%, #f1f5f9 100%)',
      imgOverlay: 'bg-gradient-to-t from-slate-100 via-slate-100/40 to-transparent',
      nameTxt:  'text-slate-900',
      sub:      'text-slate-400',
      priceTxt: '#E87722',
      chipBg:   'bg-slate-200/70 text-slate-700',
      divider:  'border-slate-200',
      statBg:   'bg-white shadow-sm',
      statTxt:  'text-slate-800',
      statSub:  'text-slate-400',
      rera:     'bg-emerald-50 text-emerald-700 border border-emerald-200',
      footerBg: 'bg-white border-t border-slate-100',
      footerTxt:'text-slate-800',
      footerSub:'text-slate-400',
      badge:    'bg-orange-100 text-orange-700',
      desc:     'text-slate-500',
    },
    warm: {
      wrapper: 'text-white',
      bg:      'linear-gradient(160deg, #E87722 0%, #D4691C 40%, #0F2035 100%)',
      imgOverlay: 'bg-gradient-to-t from-[#0F2035] via-[#D4691C]/40 to-transparent',
      nameTxt:  'text-white',
      sub:      'text-white/60',
      priceTxt: '#FCD34D',
      chipBg:   'bg-white/15 text-white',
      divider:  'border-white/20',
      statBg:   'bg-white/12',
      statTxt:  'text-white',
      statSub:  'text-white/55',
      rera:     'bg-white/15 text-white border border-white/20',
      footerBg: 'bg-white/10 border-t border-white/15',
      footerTxt:'text-white',
      footerSub:'text-white/55',
      badge:    'bg-white/20 text-white',
      desc:     'text-white/65',
    },
  }[theme];

  return (
    <div className={`rounded-2xl overflow-hidden aspect-[3/4] flex flex-col ${t.wrapper} relative`}
      style={{ background: t.bg }}>

      {/* Project image */}
      <div className="relative h-[42%] shrink-0 overflow-hidden">
        {project.imageUrl
          ? <img src={project.imageUrl} alt={project.name} className="w-full h-full object-cover" />
          : (
            <div className="w-full h-full flex items-center justify-center"
              style={{ backgroundColor: theme === 'dark' ? '#1B3A5C' : theme === 'warm' ? '#D4691C' : '#e2e8f0' }}>
              <Building2 size={52} className="opacity-20" />
            </div>
          )
        }
        <div className={`absolute inset-0 ${t.imgOverlay}`} />

        {/* Availability badge */}
        {avail != null && avail > 0 && (
          <div className={`absolute top-3 left-3 text-[10px] font-bold px-2.5 py-1 rounded-full ${t.badge}`}>
            {avail} Units Available
          </div>
        )}
        {project.status === 'CLOSING_SOON' && (
          <div className="absolute top-3 right-3 text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-500 text-white">
            Closing Soon
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col px-4 pt-3 pb-0">

        {/* Name + location */}
        <h3 className={`text-base font-black leading-tight ${t.nameTxt}`}>{project.name}</h3>
        {project.builderName && (
          <p className={`text-[10px] font-semibold mt-0.5 uppercase tracking-wide ${t.sub}`}>
            by {project.builderName}
          </p>
        )}
        {location && (
          <p className={`text-[11px] mt-1 flex items-center gap-1 ${t.sub}`}>
            <MapPin size={9} /> {location}
          </p>
        )}

        {/* Price */}
        <p className="text-lg font-black mt-2" style={{ color: t.priceTxt }}>{price}</p>

        {/* Configs */}
        {configs && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {(project.configurations ?? []).map(c => (
              <span key={c} className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${t.chipBg}`}>{c}</span>
            ))}
          </div>
        )}

        {/* Stats row */}
        <div className={`grid grid-cols-3 gap-1.5 mt-3 border-t pt-3 ${t.divider}`}>
          {[
            { icon: Calendar, label: 'Possession', value: project.possessionDate?.slice(0,7) ?? '—' },
            { icon: Home,     label: 'Total Units', value: project.totalUnits ? String(project.totalUnits) : '—' },
            { icon: Users,    label: 'Available', value: avail != null ? String(avail) : '—' },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} className={`rounded-lg px-2 py-1.5 text-center ${t.statBg}`}>
              <Icon size={10} className="mx-auto mb-0.5 opacity-60" />
              <p className={`text-[11px] font-black ${t.statTxt}`}>{value}</p>
              <p className={`text-[9px] leading-none mt-0.5 ${t.statSub}`}>{label}</p>
            </div>
          ))}
        </div>

        {/* Description snippet */}
        {descSnippet && (
          <p className={`text-[10px] leading-relaxed mt-2.5 ${t.desc} line-clamp-2`}>{descSnippet}</p>
        )}

        {/* RERA */}
        {project.reraNumber && (
          <div className={`flex items-center gap-1.5 mt-2.5 text-[10px] font-semibold px-2.5 py-1.5 rounded-lg ${t.rera}`}>
            <CheckCircle2 size={10} /> RERA: {project.reraNumber}
          </div>
        )}

        <div className="flex-1" />

        {/* Share link */}
        {shareLink && (
          <div className={`-mx-4 mt-2 px-4 py-2 flex items-center gap-2 border-t ${t.divider}`} style={{ opacity: 0.85 }}>
            <Link2 size={9} className={t.footerSub} />
            <span className={`text-[9px] font-mono truncate ${t.footerSub}`}>{shareLink}</span>
          </div>
        )}

        {/* CP footer */}
        <div className={`-mx-4 mt-1 px-4 py-3 flex items-center justify-between ${t.footerBg}`}>
          <div>
            <p className={`text-[11px] font-bold ${t.footerTxt}`}>{cpName}</p>
            <p className={`text-[9px] ${t.footerSub}`}>{cpPhone} · Dealio Certified CP</p>
          </div>
          <div className="flex items-center gap-1">
            <Sparkles size={9} style={{ color: '#E87722' }} />
            <span className={`text-[9px] font-bold ${t.footerSub}`}>dealio.in</span>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ─── Main modal ─────────────────────────────────────────────────── */
const FlyerModal = ({ project, onClose, cpId }: FlyerModalProps) => {
  const { user } = useAuthStore();
  const [theme, setTheme] = useState<Theme>('dark');
  const [shareLink, setShareLink] = useState('');
  const [linkLoading, setLinkLoading] = useState(false);
  const [capturing, setCapturing] = useState(false);
  const flyerRef = useRef<HTMLDivElement>(null);

  const captureAsPdf = async (): Promise<{ blob: Blob; dataUrl: string } | null> => {
    if (!flyerRef.current) return null;
    setCapturing(true);
    try {
      const canvas = await html2canvas(flyerRef.current, {
        scale: 3,
        useCORS: true,
        backgroundColor: null,
        logging: false,
      });
      const imgData  = canvas.toDataURL('image/png', 1.0);
      const pxW      = canvas.width;
      const pxH      = canvas.height;
      // A4 portrait in mm; fit the flyer proportionally
      const pdfW     = 210;
      const pdfH     = Math.round((pxH / pxW) * pdfW);
      const pdf      = new jsPDF({ orientation: 'portrait', unit: 'mm', format: [pdfW, pdfH] });
      pdf.addImage(imgData, 'PNG', 0, 0, pdfW, pdfH, undefined, 'FAST');
      const blob = pdf.output('blob');
      const dataUrl = URL.createObjectURL(blob);
      return { blob, dataUrl };
    } catch {
      return null;
    } finally {
      setCapturing(false);
    }
  };

  const handleDownload = async () => {
    const result = await captureAsPdf();
    if (!result) { toast.error('Could not generate PDF flyer'); return; }
    const a = document.createElement('a');
    a.href = result.dataUrl;
    a.download = `${project.name.replace(/\s+/g, '_')}_Flyer.pdf`;
    a.click();
    toast.success('Flyer PDF downloaded!');
  };

  const handleShareImage = async () => {
    const result = await captureAsPdf();
    if (!result) { toast.error('Could not generate PDF flyer'); return; }
    const file = new File([result.blob], `${project.name}_Flyer.pdf`, { type: 'application/pdf' });
    if (navigator.canShare?.({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: project.name, text: shareLink ? `View project: ${shareLink}` : project.name });
        return;
      } catch { /* user cancelled or not supported */ }
    }
    // Fallback: WhatsApp text share when native share unavailable
    window.open(`https://wa.me/?text=${encodeURIComponent(shareText)}`, '_blank');
  };

  const resolvedCpId = cpId ?? user?.id;

  useEffect(() => {
    if (!resolvedCpId) return;
    setLinkLoading(true);
    cpApi.getOrCreateShareLink(resolvedCpId, project.id)
      .then((r: unknown) => {
        const { token } = r as { token: string };
        setShareLink(`${window.location.origin}/p/${token}`);
      })
      .catch(() => {})
      .finally(() => setLinkLoading(false));
  }, [resolvedCpId, project.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const cpName  = user?.name  || 'Your Name';
  const cpPhone = user?.phone ? `+91 ${user.phone}` : '+91 98765 43210';

  const location  = [project.locality, project.city].filter(Boolean).join(', ');
  const configs   = project.configurations?.join(' / ') || '';
  const priceText = fmtPrice(project.priceMin, project.priceMax);

  const shareText =
    `🏠 *${project.name}*\n` +
    (project.builderName ? `🏢 Builder: ${project.builderName}\n` : '') +
    `📍 ${location}\n` +
    `💰 Starting from ${priceText}\n` +
    (configs ? `🛏️ ${configs}\n` : '') +
    (project.possessionDate ? `📅 Possession: ${project.possessionDate}\n` : '') +
    (project.availableUnits != null ? `🏗️ ${project.availableUnits} units still available!\n` : '') +
    (project.reraNumber ? `✅ RERA: ${project.reraNumber}\n` : '') +
    (project.description ? `\n📋 ${project.description.slice(0, 120)}…\n` : '') +
    (shareLink ? `\n🔗 View project: ${shareLink}\n` : '') +
    `\n📞 Contact me for a free site visit:\n${cpName} — ${cpPhone}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-[2px]" onClick={onClose} />
      <div className="relative bg-white rounded-t-3xl sm:rounded-2xl w-full sm:max-w-md max-h-[92vh] overflow-y-auto shadow-2xl flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-4 border-b border-slate-100 shrink-0">
          <div>
            <h3 className="text-base font-bold text-slate-800">Generate Flyer</h3>
            <p className="text-xs text-slate-400 mt-0.5">Customer-ready — no internal pricing details</p>
          </div>
          <button onClick={onClose} className="p-1.5 rounded-full hover:bg-slate-100 transition-colors">
            <X size={18} className="text-slate-500" />
          </button>
        </div>

        <div className="p-5 space-y-5">

          {/* Theme picker */}
          <div>
            <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2.5">Style</p>
            <div className="flex gap-2.5">
              {THEMES.map(t => (
                <button key={t.id} onClick={() => setTheme(t.id)}
                  className={`flex-1 flex flex-col items-center gap-2 py-3 rounded-xl border-2 transition-all ${
                    theme === t.id ? 'border-orange-400 shadow-sm' : 'border-slate-100 hover:border-slate-200'
                  }`}>
                  <div className={`w-8 h-8 rounded-lg ${t.preview}`} />
                  <span className="text-[11px] font-bold text-slate-600">{t.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Flyer preview */}
          <div ref={flyerRef}>
            <FlyerPreview project={project} theme={theme} cpName={cpName} cpPhone={cpPhone} shareLink={shareLink} />
          </div>

          {/* What's included note */}
          <div className="bg-slate-50 rounded-xl p-3.5">
            <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-2">Included in flyer</p>
            <div className="grid grid-cols-2 gap-x-4 gap-y-1">
              {[
                'Project name & image',
                'Builder name',
                'Location',
                'Price range',
                'BHK configurations',
                'Possession date',
                'Unit availability',
                'RERA number',
                'Project description',
                'Your contact info',
              ].map(item => (
                <div key={item} className="flex items-center gap-1.5 text-[11px] text-slate-600">
                  <CheckCircle2 size={10} className="text-emerald-500 shrink-0" /> {item}
                </div>
              ))}
            </div>
          </div>

          {/* Share link strip */}
          {(shareLink || linkLoading) && (
            <div className="flex items-center gap-2 bg-[#EEF3EF] rounded-xl px-3 py-2.5 border border-[#D8E5DA]">
              <Link2 size={13} className="text-[#3C5A45] shrink-0" />
              <span className="flex-1 text-[11px] font-mono text-[#3C5A45] truncate">
                {linkLoading ? 'Generating unique link…' : shareLink}
              </span>
              {linkLoading
                ? <Loader2 size={13} className="animate-spin text-[#3C5A45] shrink-0" />
                : (
                  <button
                    onClick={() => { navigator.clipboard.writeText(shareLink); toast.success('Link copied!'); }}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white border border-[#D8E5DA] text-xs font-bold text-[#3C5A45] hover:bg-[#D8E5DA] transition-colors shrink-0">
                    <Copy size={10} /> Copy
                  </button>
                )
              }
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-2.5">
            <button
              onClick={handleDownload}
              disabled={capturing}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg,#E87722,#D4691C)' }}>
              {capturing ? <Loader2 size={14} className="animate-spin" /> : <Download size={14} />}
              {capturing ? 'Capturing…' : 'Download'}
            </button>
            <button
              onClick={handleShareImage}
              disabled={capturing}
              className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-bold text-white hover:opacity-90 transition-opacity disabled:opacity-60 bg-[#25D366]">
              {capturing ? <Loader2 size={14} className="animate-spin" /> : <Share2 size={14} />}
              Share
            </button>
            <button
              onClick={() => { navigator.clipboard.writeText(shareText); toast.success('Copied to clipboard'); }}
              className="w-12 flex items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition-colors">
              <Copy size={16} />
            </button>
          </div>
          <p className="text-center text-[11px] text-slate-400">
            Download saves a PDF · Share opens native share sheet on mobile
          </p>
        </div>
      </div>
    </div>
  );
};

export default FlyerModal;