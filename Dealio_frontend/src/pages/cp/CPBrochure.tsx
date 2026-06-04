import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { builderApi, cpApi } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { Download, Share2, Loader2, Building2, MapPin, IndianRupee, User, Phone } from 'lucide-react';
import { toast } from 'sonner';

interface Project {
  id: number;
  name: string;
  city?: string;
  locality?: string;
  configurations?: string[];
  priceMin?: number;
  priceMax?: number;
  imageUrl?: string | null;
  builderName?: string;
  commissionValue?: number;
  status?: string;
}

interface CPProfile {
  fullName: string;
  phone?: string;
  city?: string;
  reraNumber?: string;
}

const fmtPrice = (n?: number) => {
  if (!n) return null;
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(1)} Cr`;
  if (n >= 100_000)    return `₹${(n / 100_000).toFixed(0)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
};

const CPBrochure = () => {
  const { user }      = useAuthStore();
  const brochureRef   = useRef<HTMLDivElement>(null);

  const [projects, setProjects]   = useState<Project[]>([]);
  const [loading, setLoading]     = useState(true);
  const [selected, setSelected]   = useState<Project | null>(null);
  const [profile, setProfile]     = useState<CPProfile | null>(null);
  const [sharing, setSharing]     = useState(false);

  useEffect(() => {
    builderApi.getPublicProjects()
      .then(d => {
        const list = (d as Project[]) || [];
        setProjects(list);
        if (list.length > 0) setSelected(list[0]);
      })
      .catch(() => toast.error('Failed to load projects'))
      .finally(() => setLoading(false));

    if (user?.id) {
      cpApi.getProfile(user.id)
        .then((d: any) => setProfile({ fullName: d.fullName ?? user.name, phone: d.phone ?? user.phone, city: d.cp?.city, reraNumber: d.cp?.reraNumber }))
        .catch(() => setProfile({ fullName: user.name, phone: user.phone }));
    }
  }, [user?.id]);

  const handleDownload = () => {
    if (!brochureRef.current) return;
    const content = brochureRef.current.innerHTML;
    const win = window.open('', '_blank');
    if (!win) { toast.error('Allow popups to download'); return; }
    win.document.write(`
      <html><head><title>${selected?.name ?? 'Brochure'}</title>
      <style>body{font-family:sans-serif;margin:0;padding:24px;}img{max-width:100%;border-radius:12px;}
      h2{margin:0 0 4px}p{margin:4px 0;color:#555;font-size:14px}.tag{display:inline-block;background:#f1f5f9;border-radius:20px;padding:3px 12px;font-size:12px;margin:2px}
      .footer{margin-top:16px;padding:12px;background:#f8fafc;border-radius:8px;font-size:13px}</style></head>
      <body>${content}</body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); }, 400);
    toast.success('Print dialog opened — save as PDF');
  };

  const handleWhatsApp = () => {
    if (!selected) return;
    setSharing(true);
    const name    = profile?.fullName ?? user?.name ?? 'Your Agent';
    const phone   = profile?.phone ?? user?.phone ?? '';
    const configs = selected.configurations?.join(' / ') ?? '';
    const price   = fmtPrice(selected.priceMin) ?? 'Price on request';
    const loc     = [selected.locality, selected.city].filter(Boolean).join(', ');
    const text = [
      `🏠 *${selected.name}*`,
      loc && `📍 ${loc}`,
      configs && `🛏 ${configs}`,
      price  && `💰 Starting ${price}`,
      selected.commissionValue && `💼 Commission: ${selected.commissionValue}%`,
      ``,
      `📞 Contact: *${name}*${phone ? ` — ${phone}` : ''}`,
      profile?.reraNumber ? `✅ RERA: ${profile.reraNumber}` : '',
    ].filter(Boolean).join('\n');

    const waPhone = phone.replace(/\D/g, '');
    window.open(`https://wa.me/${waPhone ? `91${waPhone}` : ''}?text=${encodeURIComponent(text)}`, '_blank');
    setTimeout(() => setSharing(false), 1000);
  };

  return (
    <DashboardLayout>
      <div className="space-y-5">
        <div>
          <h2 className="text-[17px] font-bold text-foreground">Brochure Generator</h2>
          <p className="text-[12px] text-muted-foreground mt-0.5">Generate and share personalised project brochures</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Controls */}
          <div className="space-y-4">
            <div>
              <label className="text-[12px] font-semibold text-foreground block mb-1.5">Select Project</label>
              {loading ? (
                <div className="flex items-center gap-2 text-[12px] text-muted-foreground py-2">
                  <Loader2 size={13} className="animate-spin" /> Loading projects…
                </div>
              ) : (
                <select
                  value={selected?.id ?? ''}
                  onChange={e => setSelected(projects.find(p => p.id === Number(e.target.value)) ?? null)}
                  className="w-full px-3 py-2.5 rounded-xl border border-border bg-card text-[13px] text-foreground outline-none focus:ring-2 focus:ring-ring/20">
                  {projects.map(p => <option key={p.id} value={p.id}>{p.name}{p.city ? ` · ${p.city}` : ''}</option>)}
                </select>
              )}
            </div>

            {/* CP info preview */}
            {profile && (
              <div className="rounded-xl border border-border bg-muted/30 p-3.5 space-y-1.5">
                <p className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground">Your Details on Brochure</p>
                <div className="flex items-center gap-2 text-[12px]">
                  <User size={12} className="text-muted-foreground" />
                  <span className="font-medium text-foreground">{profile.fullName}</span>
                </div>
                {profile.phone && (
                  <div className="flex items-center gap-2 text-[12px]">
                    <Phone size={12} className="text-muted-foreground" />
                    <span className="text-foreground">{profile.phone}</span>
                  </div>
                )}
                {profile.reraNumber && (
                  <p className="text-[11px] text-muted-foreground">RERA: {profile.reraNumber}</p>
                )}
                <p className="text-[10px] text-muted-foreground">Update in Settings → Profile</p>
              </div>
            )}

            <div className="flex gap-3">
              <button onClick={handleDownload} disabled={!selected}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                style={{ background: 'linear-gradient(135deg, #0A7E8C, #0d9488)' }}>
                <Download size={14} /> Download PDF
              </button>
              <button onClick={handleWhatsApp} disabled={!selected || sharing}
                className="flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-[13px] font-semibold text-white hover:opacity-90 disabled:opacity-50 transition-opacity"
                style={{ background: '#25D366' }}>
                {sharing ? <Loader2 size={13} className="animate-spin" /> : <Share2 size={14} />}
                WhatsApp
              </button>
            </div>
          </div>

          {/* Brochure preview */}
          <div ref={brochureRef} className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
            {selected ? (
              <>
                {selected.imageUrl ? (
                  <img src={selected.imageUrl} alt={selected.name} className="w-full h-44 object-cover" />
                ) : (
                  <div className="w-full h-44 bg-gradient-to-br from-teal-50 to-teal-100 flex items-center justify-center">
                    <Building2 size={36} className="text-teal-400" />
                  </div>
                )}
                <div className="p-5 space-y-3">
                  <div>
                    <h3 className="text-[18px] font-bold text-foreground">{selected.name}</h3>
                    {(selected.locality || selected.city) && (
                      <p className="text-[12px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <MapPin size={11} /> {[selected.locality, selected.city].filter(Boolean).join(', ')}
                      </p>
                    )}
                  </div>

                  {selected.configurations && selected.configurations.length > 0 && (
                    <div className="flex gap-1.5 flex-wrap">
                      {selected.configurations.map(c => (
                        <span key={c} className="text-[11px] px-2.5 py-1 rounded-full bg-muted border border-border text-muted-foreground font-medium">{c}</span>
                      ))}
                    </div>
                  )}

                  {(selected.priceMin || selected.priceMax) && (
                    <p className="text-[13px] font-semibold text-foreground flex items-center gap-1">
                      <IndianRupee size={12} className="text-teal-600" />
                      Starting {fmtPrice(selected.priceMin ?? selected.priceMax)}
                    </p>
                  )}

                  {selected.commissionValue && (
                    <div className="flex items-center justify-end">
                      <span className="text-[12px] font-bold px-3 py-1 rounded-full bg-teal-50 text-teal-700 border border-teal-100">
                        {selected.commissionValue}% Commission
                      </span>
                    </div>
                  )}

                  <div className="bg-muted/40 rounded-xl p-3 flex items-center gap-3 border border-border">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[13px] font-bold shrink-0"
                      style={{ background: 'linear-gradient(135deg, #E87722, #F97316)' }}>
                      {(profile?.fullName ?? user?.name ?? 'C')[0]?.toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[13px] font-semibold text-foreground">{profile?.fullName ?? user?.name}</p>
                      {(profile?.phone ?? user?.phone) && (
                        <p className="text-[11px] text-muted-foreground">{profile?.phone ?? user?.phone}</p>
                      )}
                      {profile?.reraNumber && <p className="text-[10px] text-muted-foreground">RERA: {profile.reraNumber}</p>}
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
                <Building2 size={28} className="mb-2 opacity-30" />
                <p className="text-[13px]">Select a project to preview</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CPBrochure;
