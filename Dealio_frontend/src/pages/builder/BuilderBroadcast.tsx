import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { builderApi } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { Send, Loader2, Megaphone, Users, ChevronDown } from 'lucide-react';
import { toast } from 'sonner';

// ── Types ─────────────────────────────────────────────────────────────────────
interface Broadcast {
  id:             number;
  projectName:    string | null;
  message:        string;
  audience:       string;
  audienceFilter: string | null;
  delivered:      number;
  createdAt:      string;
}

interface ApiProject {
  id:   number;
  name: string;
}

type AudienceType = 'All CPs' | 'By City' | 'By Tier';

const CITIES = ['Hyderabad', 'Bengaluru', 'Mumbai', 'Pune', 'Chennai', 'Delhi', 'Noida', 'Gurgaon'];
const TIERS  = ['Silver', 'Gold', 'Platinum'];

// ── Component ─────────────────────────────────────────────────────────────────
const BuilderBroadcast = () => {
  const { user } = useAuthStore();
  const builderId = useRef('');

  const [projects,    setProjects]    = useState<ApiProject[]>([]);
  const [broadcasts,  setBroadcasts]  = useState<Broadcast[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [sending,     setSending]     = useState(false);

  // Compose form state
  const [selectedProjectId,   setSelectedProjectId]   = useState<number | ''>('');
  const [audience,            setAudience]             = useState<AudienceType>('All CPs');
  const [audienceFilter,      setAudienceFilter]       = useState('');
  const [message,             setMessage]              = useState('');

  // ── Load data ──────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!user?.id) return;
    (async () => {
      try {
        let bid = builderApi.getCachedBuilderId();
        if (!bid) {
          const email = user.email || `uid${user.id}@dealio.builder`;
          const bd = await builderApi.ensureBuilder(user.name, email, user.phone, user.id) as { builderId: number };
          bid = String(bd.builderId);
          builderApi.setCachedBuilderId(bid);
        }
        builderId.current = bid;

        const [projectsData, broadcastsData] = await Promise.all([
          builderApi.getProjects(bid) as Promise<ApiProject[]>,
          builderApi.getBroadcasts(bid) as Promise<Broadcast[]>,
        ]);

        setProjects(Array.isArray(projectsData)   ? projectsData   : []);
        setBroadcasts(Array.isArray(broadcastsData) ? broadcastsData : []);
      } catch {
        toast.error('Failed to load broadcast data');
      } finally {
        setLoadingData(false);
      }
    })();
  }, [user?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  // Reset audienceFilter when audience type changes
  const handleAudienceChange = (val: AudienceType) => {
    setAudience(val);
    setAudienceFilter('');
  };

  // ── Send broadcast ─────────────────────────────────────────────────────────
  const handleSend = async () => {
    if (!message.trim()) { toast.error('Message cannot be empty'); return; }
    if ((audience === 'By City' || audience === 'By Tier') && !audienceFilter) {
      toast.error(`Select a ${audience === 'By City' ? 'city' : 'tier'}`); return;
    }

    setSending(true);
    try {
      const project = projects.find(p => p.id === selectedProjectId);
      const result  = await builderApi.sendBroadcast(builderId.current, {
        message:        message.trim(),
        audience,
        audienceFilter: audienceFilter || undefined,
        projectId:      project?.id   ?? null,
        projectName:    project?.name ?? null,
      }) as Broadcast;

      setBroadcasts(prev => [result, ...prev]);
      setMessage('');
      setSelectedProjectId('');
      setAudience('All CPs');
      setAudienceFilter('');
      toast.success(`Broadcast sent · ${result.delivered} CP${result.delivered !== 1 ? 's' : ''} notified`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to send broadcast');
    } finally {
      setSending(false);
    }
  };

  const audienceLabel = (b: Broadcast) => {
    if (b.audienceFilter) return `${b.audience}: ${b.audienceFilter}`;
    return b.audience;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* ── Header ── */}
        <div className="la-banner px-5 py-4 flex items-center gap-3">
          <Megaphone size={16} className="text-orange-500" />
          <div>
            <h2 className="text-[15px] font-bold text-slate-800">Broadcast Messages</h2>
            <p className="text-xs text-slate-400 mt-0.5">Send targeted updates to channel partners</p>
          </div>
        </div>

        {/* ── Compose ── */}
        <div className="la-card p-6 space-y-4">
          <h3 className="font-semibold text-slate-700">Compose Broadcast</h3>

          {/* Project selector */}
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Project (optional)</label>
            <select
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value ? Number(e.target.value) : '')}
              disabled={loadingData}
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300 disabled:opacity-50">
              <option value="">All Projects (general update)</option>
              {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
            </select>
          </div>

          {/* Audience selector */}
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Audience</label>
            <div className="flex gap-2 flex-wrap">
              {(['All CPs', 'By City', 'By Tier'] as AudienceType[]).map(opt => (
                <button
                  key={opt}
                  onClick={() => handleAudienceChange(opt)}
                  className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-[12px] font-semibold border transition-all ${
                    audience === opt
                      ? 'text-white border-transparent shadow-sm'
                      : 'bg-white border-slate-200 text-slate-600 hover:border-orange-300'
                  }`}
                  style={audience === opt ? { background: 'linear-gradient(135deg, #E87722, #d06010)' } : undefined}>
                  <Users size={12} /> {opt}
                </button>
              ))}
            </div>

            {/* Sub-filter */}
            {audience === 'By City' && (
              <div className="relative mt-2">
                <select
                  value={audienceFilter}
                  onChange={e => setAudienceFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-300 appearance-none">
                  <option value="">Select city…</option>
                  {CITIES.map(c => <option key={c}>{c}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            )}
            {audience === 'By Tier' && (
              <div className="relative mt-2">
                <select
                  value={audienceFilter}
                  onChange={e => setAudienceFilter(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-orange-100 focus:border-orange-300 appearance-none">
                  <option value="">Select tier…</option>
                  {TIERS.map(t => <option key={t}>{t}</option>)}
                </select>
                <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
              </div>
            )}
          </div>

          {/* Message */}
          <div>
            <label className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide mb-1.5 block">Message</label>
            <textarea
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={4}
              maxLength={500}
              placeholder="Type your broadcast message…"
              className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm resize-none text-slate-700 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300"
            />
            <p className="text-[10px] text-slate-400 text-right mt-0.5">{message.length}/500</p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSend}
              disabled={sending || !message.trim()}
              className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white inline-flex items-center gap-2 hover:opacity-90 transition-opacity shadow-sm disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #E87722, #d06010)' }}>
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              {sending ? 'Sending…' : 'Send to CPs'}
            </button>
            {message.trim() && (
              <p className="text-[11px] text-slate-400">
                Will notify{' '}
                <strong className="text-slate-600">
                  {audience === 'All CPs' ? 'all CPs' : `${audience.toLowerCase()} ${audienceFilter || '…'}`}
                </strong>
                {selectedProjectId
                  ? ` · re: ${projects.find(p => p.id === selectedProjectId)?.name ?? 'project'}`
                  : ''}
              </p>
            )}
          </div>
        </div>

        {/* ── History ── */}
        <div className="la-card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="font-semibold text-slate-700">Broadcast History</h3>
            {broadcasts.length > 0 && (
              <span className="text-[11px] text-slate-400">{broadcasts.length} sent</span>
            )}
          </div>

          {loadingData ? (
            <div className="flex justify-center py-10">
              <Loader2 size={22} className="animate-spin text-slate-300" />
            </div>
          ) : broadcasts.length === 0 ? (
            <div className="px-5 py-10 text-center">
              <Megaphone size={28} className="mx-auto mb-2 text-slate-200" />
              <p className="text-[12px] text-slate-400">No broadcasts sent yet. Compose your first one above.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="text-left text-slate-400 border-b border-slate-100 bg-slate-50/60">
                    <th className="px-5 py-3 font-medium">Date</th>
                    <th className="px-5 py-3 font-medium">Project</th>
                    <th className="px-5 py-3 font-medium">Message</th>
                    <th className="px-5 py-3 font-medium">Audience</th>
                    <th className="px-5 py-3 font-medium text-right">Delivered</th>
                  </tr>
                </thead>
                <tbody>
                  {broadcasts.map(b => (
                    <tr key={b.id} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
                      <td className="px-5 py-3 text-slate-400 whitespace-nowrap text-[12px]">
                        {new Date(b.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </td>
                      <td className="px-5 py-3 text-slate-500 text-[12px] whitespace-nowrap">
                        {b.projectName ?? <span className="text-slate-300 italic">All projects</span>}
                      </td>
                      <td className="px-5 py-3 text-slate-700 max-w-xs">
                        <p className="truncate text-[12px]">{b.message}</p>
                      </td>
                      <td className="px-5 py-3 text-[12px]">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-orange-50 text-orange-600 border border-orange-100 whitespace-nowrap">
                          {audienceLabel(b)}
                        </span>
                      </td>
                      <td className="px-5 py-3 text-right">
                        <span className="text-[12px] font-semibold text-teal-600">{b.delivered}</span>
                        <span className="text-[10px] text-slate-400 ml-1">CPs</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BuilderBroadcast;
