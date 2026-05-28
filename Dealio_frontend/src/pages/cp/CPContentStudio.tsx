import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/stores/useAuthStore';
import { builderApi } from '@/lib/api';
import { Sparkles, Copy, Loader2, Building2, Instagram, Linkedin, Facebook, MessageSquare } from 'lucide-react';
import { toast } from 'sonner';

interface Project {
  id: number;
  name: string;
  city: string;
  builderName: string | null;
  priceMin: number | null;
  priceMax: number | null;
  configurations: string[] | null;
  status: string;
  locality?: string | null;
}

const PLATFORMS = [
  { id: 'whatsapp',  label: 'WhatsApp',  Icon: MessageSquare, color: '#25D366' },
  { id: 'instagram', label: 'Instagram', Icon: Instagram,     color: '#E4405F' },
  { id: 'facebook',  label: 'Facebook',  Icon: Facebook,      color: '#1877F2' },
  { id: 'linkedin',  label: 'LinkedIn',  Icon: Linkedin,      color: '#0A66C2' },
];

const fmt = (n: number | null) => {
  if (!n) return '?';
  if (n >= 10_000_000) return `${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000)    return `${(n / 100_000).toFixed(0)}L`;
  return n.toLocaleString('en-IN');
};

function generateCaption(project: Project, platform: string): string {
  const price = project.priceMin
    ? `₹${fmt(project.priceMin)}${project.priceMax ? ` – ₹${fmt(project.priceMax)}` : '+'}`
    : 'Price on request';
  const configs = project.configurations?.join(' / ') ?? 'BHK configurations';

  if (platform === 'whatsapp') {
    return `🏠 *${project.name}* by ${project.builderName ?? 'a trusted builder'}\n📍 ${project.locality ?? project.city}, ${project.city}\n💰 Starting ${price}\n🏗️ ${configs}\n\nInterested? Reply to this message or call me for more details!\n\n#RealEstate #${project.city.replace(/\s/g,'')}`;
  }
  if (platform === 'instagram') {
    return `✨ Your dream home awaits! 🏡\n\n${project.name} — ${configs}\n📍 ${project.city}\n💰 Starting ${price}\n\nDM me for details, virtual tours, and exclusive offers! 🔑\n\n#${project.city.replace(/\s/g,'')}RealEstate #NewLaunch #DreamHome #PropertyInvestment #${project.name.replace(/\s/g,'')}`;
  }
  if (platform === 'linkedin') {
    return `Exciting real estate opportunity: ${project.name} by ${project.builderName ?? 'a reputed developer'} in ${project.city}.\n\n• ${configs} configurations\n• Starting ${price}\n• Status: ${project.status}\n\nIdeal for end-users and investors. Reach out for a detailed presentation.\n\n#RealEstate #Investment #${project.city.replace(/\s/g,'')}`;
  }
  // facebook
  return `🏠 Introducing ${project.name}!\n\n📍 ${project.city} | 💰 ${price} | 🏗️ ${configs}\n\nDeveloped by ${project.builderName ?? 'a trusted builder'}. Limited units available. Comment "INTERESTED" or DM for details!\n\n#${project.city.replace(/\s/g,'')}Homes #RealEstate #NewProject`;
}

export default function CPContentStudio() {
  const { user } = useAuthStore();
  const [projects, setProjects]           = useState<Project[]>([]);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [selectedPlatform, setSelectedPlatform]   = useState('whatsapp');
  const [caption, setCaption]             = useState('');
  const [generating, setGenerating]       = useState(false);

  const fetchProjects = useCallback(async () => {
    setLoadingProjects(true);
    try {
      const data = await builderApi.getPublicProjects();
      setProjects((data as Project[]) || []);
    } catch { /* ignore */ }
    finally { setLoadingProjects(false); }
  }, []);

  useEffect(() => { fetchProjects(); }, [fetchProjects]);

  const selectedProject = projects.find(p => p.id === selectedProjectId) ?? null;

  const handleGenerate = () => {
    if (!selectedProject) { toast.error('Select a project first'); return; }
    setGenerating(true);
    setTimeout(() => {
      setCaption(generateCaption(selectedProject, selectedPlatform));
      setGenerating(false);
    }, 600);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(caption);
    toast.success('Caption copied!');
  };

  const handleShare = () => {
    if (!caption) return;
    if (selectedPlatform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(caption)}`, '_blank');
    } else {
      navigator.clipboard.writeText(caption);
      toast.success('Caption copied — paste it into your social app');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5 pb-8 max-w-3xl">

        <div>
          <h1 className="text-[17px] font-bold text-foreground">Content Studio</h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">Generate social media captions for your projects</p>
        </div>

        {/* Project selector */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
          <p className="text-[12px] font-bold uppercase tracking-wide text-muted-foreground">1. Pick a Project</p>
          {loadingProjects ? (
            <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
          ) : projects.length === 0 ? (
            <div className="text-center py-6">
              <Building2 size={24} className="text-muted-foreground mx-auto mb-2" />
              <p className="text-[12px] text-muted-foreground">No projects found. Projects will appear here once builders publish them.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-60 overflow-y-auto pr-1">
              {projects.map(p => (
                <button key={p.id} onClick={() => setSelectedProjectId(p.id)}
                  className={`text-left p-3 rounded-xl border transition-all ${
                    selectedProjectId === p.id
                      ? 'border-teal-500 bg-teal-50'
                      : 'border-border hover:border-teal-200 hover:bg-muted/40'
                  }`}>
                  <p className="text-[12px] font-semibold text-foreground truncate">{p.name}</p>
                  <p className="text-[11px] text-muted-foreground">{p.builderName ?? '—'} · {p.city}</p>
                  {p.priceMin && (
                    <p className="text-[11px] text-teal-700 font-medium mt-0.5">from ₹{fmt(p.priceMin)}</p>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Platform selector */}
        <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
          <p className="text-[12px] font-bold uppercase tracking-wide text-muted-foreground">2. Choose Platform</p>
          <div className="flex gap-2 flex-wrap">
            {PLATFORMS.map(pl => {
              const Icon = pl.Icon;
              return (
                <button key={pl.id} onClick={() => setSelectedPlatform(pl.id)}
                  className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-[12px] font-semibold transition-all ${
                    selectedPlatform === pl.id ? 'text-white border-transparent' : 'border-border text-muted-foreground hover:border-gray-300'
                  }`}
                  style={selectedPlatform === pl.id ? { backgroundColor: pl.color, borderColor: pl.color } : {}}>
                  <Icon size={14} /> {pl.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Generate */}
        <button onClick={handleGenerate} disabled={!selectedProject || generating}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-all"
          style={{ background: 'linear-gradient(135deg,#0A7E8C,#0d9488)' }}>
          {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {generating ? 'Generating…' : 'Generate Caption'}
        </button>

        {/* Caption output */}
        {caption && (
          <div className="rounded-2xl border border-border bg-card p-5 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-[12px] font-bold uppercase tracking-wide text-muted-foreground">Generated Caption</p>
              <button onClick={handleCopy}
                className="flex items-center gap-1.5 text-[11px] text-teal-600 hover:text-teal-700 font-medium">
                <Copy size={12} /> Copy
              </button>
            </div>
            <textarea
              value={caption}
              onChange={e => setCaption(e.target.value)}
              rows={8}
              className="w-full px-3.5 py-3 rounded-xl border border-border bg-muted/30 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 resize-none transition-all"
            />
            <div className="flex gap-2">
              <button onClick={handleShare}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl text-[12px] font-semibold text-white hover:opacity-90 transition-all"
                style={{ background: selectedPlatform === 'whatsapp' ? '#25D366' : '#0A7E8C' }}>
                {PLATFORMS.find(p => p.id === selectedPlatform)?.label === 'WhatsApp' ? (
                  <><MessageSquare size={13} /> Share on WhatsApp</>
                ) : (
                  <><Copy size={13} /> Copy & Share</>
                )}
              </button>
              <button onClick={() => setCaption('')}
                className="px-4 py-2 rounded-xl text-[12px] font-semibold border border-border text-muted-foreground hover:bg-muted transition-colors">
                Clear
              </button>
            </div>
          </div>
        )}

        {/* Tips */}
        <div className="rounded-2xl border border-border bg-muted/30 p-5">
          <p className="text-[12px] font-bold text-foreground mb-3">Tips for better engagement</p>
          <ul className="space-y-1.5">
            {[
              'Post during peak hours: 7–9 AM or 7–9 PM IST',
              'Add project photos when sharing on Instagram and Facebook',
              'Always include a clear call-to-action (DM, call, WhatsApp)',
              'Use local hashtags like #BangaloreHomes or #PuneFlats',
            ].map((tip, i) => (
              <li key={i} className="flex items-start gap-2 text-[12px] text-muted-foreground">
                <span className="text-teal-500 font-bold shrink-0">•</span> {tip}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </DashboardLayout>
  );
}
