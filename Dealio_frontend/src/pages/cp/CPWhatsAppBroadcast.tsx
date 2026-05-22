import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { cpApi, builderApi } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { broadcastSequences } from '@/data/socialMedia';
import {
  MessageSquare, Play, Pause, CheckCircle, Plus, Send,
  Users, Building2, Phone, ChevronDown, ChevronUp,
  X, Home, Search, Loader2, Check,
} from 'lucide-react';
import { toast } from 'sonner';

interface Contact {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  bhkPreference?: string | null;
  tags?: string | null;
}

interface Project {
  id: number;
  name: string;
  city?: string | null;
  priceMin?: number | null;
  priceMax?: number | null;
  commissionValue?: number | null;
  configurations?: string[];
  possessionDate?: string | null;
  reraNumber?: string | null;
  address?: string | null;
  builderName?: string | null;
}

const fmt = (n: number) => {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(0)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
};
const fmtPrice = (min?: number | null, max?: number | null) =>
  min && max ? `${fmt(min)}–${fmt(max)}` : min ? `${fmt(min)}+` : max ? `up to ${fmt(max)}` : '';

/* Message templates for Day 1, 3, 7 */
function buildMsg(day: 1 | 3 | 7, contact: Contact, project: Project, shareLink: string): string {
  const firstName = contact.name.split(' ')[0];
  const priceStr  = fmtPrice(project.priceMin, project.priceMax);
  const city      = project.city ?? '';

  switch (day) {
    case 1:
      return (
        `Hi ${firstName}! 👋\n\n` +
        `I wanted to share an exciting property with you:\n\n` +
        `🏗️ *${project.name}*${city ? ` — ${city}` : ''}\n` +
        (priceStr ? `💰 ${priceStr}\n` : '') +
        (project.configurations?.length ? `🏠 ${project.configurations.slice(0,3).join(' / ')}\n` : '') +
        (project.possessionDate ? `📅 Possession: ${project.possessionDate.slice(0,7)}\n` : '') +
        (project.reraNumber ? `✅ RERA: ${project.reraNumber}\n` : '') +
        `\n🔗 Full details: ${shareLink}\n\n` +
        `Interested? I can arrange a FREE site visit! 🙏`
      );
    case 3:
      return (
        `Hi ${firstName}! 😊\n\n` +
        `Just checking in — did you get a chance to look at *${project.name}*?\n\n` +
        `This project is moving quickly${project.possessionDate ? ` with possession in ${project.possessionDate.slice(0,7)}` : ''}. ` +
        `I'd love to answer any questions or arrange a visit at your convenience.\n\n` +
        `🔗 ${shareLink}\n\nLet me know! 🙏`
      );
    case 7:
      return (
        `Hi ${firstName}! 🏡\n\n` +
        `Last follow-up from my side regarding *${project.name}*.\n\n` +
        `Whether you're ready to move forward or need more time — I'm here to help. ` +
        `No pressure at all!\n\n` +
        `📞 Feel free to call/WhatsApp me anytime.\n` +
        `🔗 ${shareLink}\n\nWishing you all the best! 🙏`
      );
  }
}

/* ── Broadcast schedule stored in localStorage ── */
const SCHED_KEY = 'dealio_cp_broadcasts';
interface ScheduledBroadcast {
  id: string;
  projectName: string;
  contacts: { name: string; phone: string }[];
  day1SentAt: string;
  day3DueAt: string;
  day7DueAt: string;
  day3Sent: boolean;
  day7Sent: boolean;
}
function loadScheduled(): ScheduledBroadcast[] {
  try { return JSON.parse(localStorage.getItem(SCHED_KEY) ?? '[]'); } catch { return []; }
}
function saveScheduled(s: ScheduledBroadcast[]) {
  localStorage.setItem(SCHED_KEY, JSON.stringify(s));
}
function daysUntil(iso: string): number {
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86_400_000);
}

const statusColor: Record<string, string> = { Active: 'text-green-600', Paused: 'text-amber-600', Completed: 'text-muted-foreground' };
const statusIcon: Record<string, React.ElementType> = { Active: Play, Paused: Pause, Completed: CheckCircle };

const CPWhatsAppBroadcast = () => {
  const { user } = useAuthStore();

  const [contacts, setContacts]         = useState<Contact[]>([]);
  const [projects, setProjects]         = useState<Project[]>([]);
  const [loadingData, setLoadingData]   = useState(true);
  const [showCreate, setShowCreate]     = useState(false);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [selectedContactIds, setSelectedContactIds] = useState<Set<number>>(new Set());
  const [bhkFilter, setBhkFilter]       = useState('');
  const [contactSearch, setContactSearch] = useState('');
  const [currentDay, setCurrentDay]     = useState<1 | 3 | 7>(1);
  const [launching, setLaunching]       = useState(false);
  const [scheduled, setScheduled]       = useState<ScheduledBroadcast[]>(loadScheduled);
  const [expandedSeq, setExpandedSeq]   = useState<string | null>(null);
  const [projectOpen, setProjectOpen]   = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      cpApi.getContacts(user.id) as Promise<Contact[]>,
      builderApi.getPublicProjects() as Promise<Project[]>,
    ]).then(([c, p]) => {
      setContacts(c ?? []);
      setProjects((p ?? []).slice(0, 30));
    }).catch(() => {}).finally(() => setLoadingData(false));
  }, [user?.id]);

  const shareLink = selectedProject
    ? `${window.location.origin}/p/${btoa(`${selectedProject.id}:${user?.id ?? 'guest'}`)}`
    : '';

  const filteredContacts = contacts.filter(c => {
    const matchSearch = !contactSearch || c.name.toLowerCase().includes(contactSearch.toLowerCase()) || c.phone.includes(contactSearch);
    const matchBhk = !bhkFilter || (c.bhkPreference ?? '').toLowerCase().includes(bhkFilter.toLowerCase());
    return matchSearch && matchBhk;
  });

  const allSelected = filteredContacts.length > 0 && filteredContacts.every(c => selectedContactIds.has(c.id));

  const toggleContact = (id: number) => {
    setSelectedContactIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (allSelected) {
      setSelectedContactIds(prev => {
        const next = new Set(prev);
        filteredContacts.forEach(c => next.delete(c.id));
        return next;
      });
    } else {
      setSelectedContactIds(prev => {
        const next = new Set(prev);
        filteredContacts.forEach(c => next.add(c.id));
        return next;
      });
    }
  };

  const launchBroadcast = () => {
    if (!selectedProject || selectedContactIds.size === 0) return;
    setLaunching(true);

    const selectedList = contacts.filter(c => selectedContactIds.has(c.id));
    let opened = 0;

    // Open WhatsApp for each selected contact (Day 1)
    selectedList.forEach((contact, i) => {
      setTimeout(() => {
        const msg = buildMsg(1, contact, selectedProject, shareLink);
        window.open(`https://wa.me/91${contact.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
        opened++;
        if (opened === selectedList.length) {
          // Save broadcast to localStorage schedule
          const now = new Date();
          const day3 = new Date(now.getTime() + 3 * 86400000).toISOString();
          const day7 = new Date(now.getTime() + 7 * 86400000).toISOString();
          const entry: ScheduledBroadcast = {
            id: `${Date.now()}`,
            projectName: selectedProject.name,
            contacts: selectedList.map(c => ({ name: c.name, phone: c.phone })),
            day1SentAt: now.toISOString(),
            day3DueAt: day3,
            day7DueAt: day7,
            day3Sent: false,
            day7Sent: false,
          };
          const updated = [entry, ...loadScheduled()];
          saveScheduled(updated);
          setScheduled(updated);
          toast.success(`Day-1 broadcast sent to ${selectedList.length} contact${selectedList.length !== 1 ? 's' : ''}!`);
          setLaunching(false);
          setShowCreate(false);
          setSelectedProject(null);
          setSelectedContactIds(new Set());
          setProjectOpen(false);
        }
      }, i * 600);
    });
  };

  const markSent = (id: string, day: 3 | 7) => {
    const seq = scheduled.find(s => s.id === id);
    if (!seq) return;
    // Re-open WhatsApp for each contact
    seq.contacts.forEach((c, i) => {
      const dummy = { name: c.name, phone: c.phone, id: 0 } as Contact;
      const proj = projects.find(p => p.name === seq.projectName) ?? ({ name: seq.projectName } as Project);
      const lnk = shareLink || `${window.location.origin}`;
      setTimeout(() => {
        const msg = buildMsg(day, dummy, proj, lnk);
        window.open(`https://wa.me/91${c.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
      }, i * 600);
    });
    const updated = scheduled.map(s => s.id === id ? { ...s, [`day${day}Sent`]: true } : s);
    saveScheduled(updated);
    setScheduled(updated);
    toast.success(`Day-${day} messages opened for ${seq.contacts.length} contacts`);
  };

  const dismissScheduled = (id: string) => {
    const updated = scheduled.filter(s => s.id !== id);
    saveScheduled(updated);
    setScheduled(updated);
  };

  const uniqueBhks = [...new Set(contacts.map(c => c.bhkPreference).filter(Boolean))];

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-lg font-bold text-card-foreground">WhatsApp Broadcast</h2>
            <p className="text-sm text-muted-foreground">Day-1/3/7 sequences to your contacts. Each reply stops the sequence.</p>
          </div>
          <button onClick={() => setShowCreate(!showCreate)}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-semibold flex items-center gap-2 hover:bg-primary/90">
            <Plus size={16} /> New Broadcast
          </button>
        </div>

        {/* ── Create Panel ── */}
        {showCreate && (
          <div className="bg-card rounded-xl p-5 border border-border space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-card-foreground">Launch Broadcast Sequence</h3>
              <button onClick={() => setShowCreate(false)} className="p-1 hover:bg-muted rounded-lg">
                <X size={16} className="text-muted-foreground" />
              </button>
            </div>

            {/* Step 1: Select project */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Building2 size={11} /> Step 1 — Select Project
              </p>
              <div className="relative">
                <button
                  onClick={() => setProjectOpen(o => !o)}
                  className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-input bg-background text-sm text-foreground hover:border-primary/50 transition-colors">
                  <span className={selectedProject ? 'font-semibold' : 'text-muted-foreground'}>
                    {selectedProject ? `${selectedProject.name}${selectedProject.city ? ` — ${selectedProject.city}` : ''}` : 'Choose a project…'}
                  </span>
                  {projectOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                </button>
                {projectOpen && (
                  <div className="absolute z-20 mt-1 w-full bg-card border border-border rounded-xl shadow-lg max-h-52 overflow-y-auto">
                    {projects.map(p => (
                      <button key={p.id} onClick={() => { setSelectedProject(p); setProjectOpen(false); }}
                        className={`w-full text-left px-4 py-3 text-sm hover:bg-muted transition-colors flex items-center justify-between ${selectedProject?.id === p.id ? 'bg-orange-50 text-[#E87722] font-semibold' : 'text-card-foreground'}`}>
                        <span>{p.name}{p.city ? ` — ${p.city}` : ''}</span>
                        {selectedProject?.id === p.id && <Check size={14} />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Step 2: Filter + select contacts */}
            <div>
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                <Users size={11} /> Step 2 — Select Contacts ({selectedContactIds.size} selected)
              </p>

              <div className="flex gap-2 mb-3 flex-wrap">
                <div className="relative flex-1 min-w-40">
                  <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <input value={contactSearch} onChange={e => setContactSearch(e.target.value)}
                    placeholder="Search contacts…"
                    className="w-full pl-8 pr-3 py-2 rounded-lg border border-input bg-background text-sm" />
                </div>
                {uniqueBhks.length > 0 && (
                  <select value={bhkFilter} onChange={e => setBhkFilter(e.target.value)}
                    className="px-3 py-2 rounded-lg border border-input bg-background text-sm text-foreground">
                    <option value="">All BHK</option>
                    {uniqueBhks.map(b => <option key={b as string} value={b as string}>{b}</option>)}
                  </select>
                )}
              </div>

              {loadingData ? (
                <div className="flex justify-center py-6"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
              ) : contacts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm border border-dashed border-border rounded-xl">
                  <Users size={28} className="mx-auto mb-2 opacity-30" />
                  <p>No contacts yet. Add contacts in My Contacts first.</p>
                </div>
              ) : (
                <div className="border border-border rounded-xl overflow-hidden">
                  {/* Select all */}
                  <label className="flex items-center gap-3 px-4 py-2.5 bg-muted/40 border-b border-border cursor-pointer hover:bg-muted/60">
                    <input type="checkbox" checked={allSelected} onChange={toggleAll}
                      className="w-4 h-4 rounded accent-[#E87722]" />
                    <span className="text-xs font-semibold text-muted-foreground">
                      {allSelected ? 'Deselect all' : `Select all (${filteredContacts.length})`}
                    </span>
                  </label>
                  <div className="max-h-48 overflow-y-auto divide-y divide-border">
                    {filteredContacts.map(c => (
                      <label key={c.id} className="flex items-center gap-3 px-4 py-2.5 cursor-pointer hover:bg-muted/30">
                        <input type="checkbox" checked={selectedContactIds.has(c.id)} onChange={() => toggleContact(c.id)}
                          className="w-4 h-4 rounded accent-[#E87722]" />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-card-foreground">{c.name}</span>
                            {c.bhkPreference && (
                              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-600 font-medium flex items-center gap-0.5">
                                <Home size={9} /> {c.bhkPreference}
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone size={10} /> {c.phone}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Step 3: Preview message */}
            {selectedProject && selectedContactIds.size > 0 && (
              <div>
                <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1.5">
                  <MessageSquare size={11} /> Step 3 — Preview Messages
                </p>
                <div className="flex gap-1 mb-3">
                  {([1, 3, 7] as const).map(d => (
                    <button key={d} onClick={() => setCurrentDay(d)}
                      className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                        currentDay === d ? 'bg-green-600 text-white' : 'bg-muted text-muted-foreground hover:bg-muted/80'
                      }`}>
                      Day {d}
                    </button>
                  ))}
                </div>
                <div className="bg-green-50 border border-green-100 rounded-xl p-3.5">
                  <p className="text-[10px] font-semibold text-green-600 mb-1.5 uppercase tracking-wide">
                    Message sent to each contact (sample: first contact)
                  </p>
                  <pre className="text-xs text-slate-700 whitespace-pre-wrap font-sans leading-relaxed">
                    {buildMsg(
                      currentDay,
                      contacts.find(c => selectedContactIds.has(c.id))!,
                      selectedProject,
                      shareLink,
                    )}
                  </pre>
                </div>
              </div>
            )}

            {/* Launch button */}
            <button
              onClick={launchBroadcast}
              disabled={!selectedProject || selectedContactIds.size === 0 || launching}
              className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl text-white font-bold text-sm disabled:opacity-40 disabled:cursor-not-allowed transition-opacity hover:opacity-90"
              style={{ backgroundColor: '#25D366' }}>
              {launching
                ? <><Loader2 size={15} className="animate-spin" /> Opening WhatsApp…</>
                : <><Send size={15} /> Launch Day-1 Broadcast ({selectedContactIds.size} contact{selectedContactIds.size !== 1 ? 's' : ''})</>
              }
            </button>
            <p className="text-xs text-center text-muted-foreground">
              WhatsApp will open for each contact. Day-3 & Day-7 reminders are saved automatically.
            </p>
          </div>
        )}

        {/* ── Scheduled follow-ups ── */}
        {scheduled.length > 0 && (
          <div className="space-y-3">
            <h3 className="font-semibold text-card-foreground flex items-center gap-2">
              <MessageSquare size={16} className="text-green-600" /> Scheduled Follow-ups
            </h3>
            {scheduled.map(seq => {
              const d3 = daysUntil(seq.day3DueAt);
              const d7 = daysUntil(seq.day7DueAt);
              return (
                <div key={seq.id} className="bg-card rounded-xl border border-border p-4">
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div>
                      <p className="font-semibold text-card-foreground">{seq.projectName}</p>
                      <p className="text-xs text-muted-foreground">
                        {seq.contacts.length} contact{seq.contacts.length !== 1 ? 's' : ''} · Day-1 sent {new Date(seq.day1SentAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      </p>
                    </div>
                    <button onClick={() => dismissScheduled(seq.id)} className="p-1 hover:bg-muted rounded-lg shrink-0">
                      <X size={14} className="text-muted-foreground" />
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    {/* Day 3 */}
                    <div className={`rounded-lg p-3 border ${seq.day3Sent ? 'bg-muted/30 border-border' : d3 <= 0 ? 'bg-green-50 border-green-200' : 'bg-amber-50 border-amber-100'}`}>
                      <p className="text-xs font-bold mb-1 flex items-center gap-1">
                        {seq.day3Sent ? <CheckCircle size={11} className="text-green-500" /> : null}
                        Day 3 {seq.day3Sent ? '(sent)' : d3 <= 0 ? '— DUE NOW' : `— in ${d3}d`}
                      </p>
                      {!seq.day3Sent && (
                        <button onClick={() => markSent(seq.id, 3)}
                          className={`w-full text-xs font-bold py-1.5 rounded-lg text-white ${d3 <= 0 ? 'bg-green-600 hover:bg-green-700' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
                          disabled={d3 > 0}>
                          {d3 <= 0 ? 'Send Now' : 'Not yet'}
                        </button>
                      )}
                    </div>

                    {/* Day 7 */}
                    <div className={`rounded-lg p-3 border ${seq.day7Sent ? 'bg-muted/30 border-border' : d7 <= 0 ? 'bg-green-50 border-green-200' : 'bg-slate-50 border-slate-100'}`}>
                      <p className="text-xs font-bold mb-1 flex items-center gap-1">
                        {seq.day7Sent ? <CheckCircle size={11} className="text-green-500" /> : null}
                        Day 7 {seq.day7Sent ? '(sent)' : d7 <= 0 ? '— DUE NOW' : `— in ${d7}d`}
                      </p>
                      {!seq.day7Sent && (
                        <button onClick={() => markSent(seq.id, 7)}
                          className={`w-full text-xs font-bold py-1.5 rounded-lg text-white ${d7 <= 0 ? 'bg-green-600 hover:bg-green-700' : 'bg-muted text-muted-foreground cursor-not-allowed'}`}
                          disabled={d7 > 0}>
                          {d7 <= 0 ? 'Send Now' : 'Not yet'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* ── Historic sequences from mock data ── */}
        <div className="space-y-4">
          <h3 className="font-semibold text-card-foreground">Past Campaigns</h3>
          {broadcastSequences.map(seq => {
            const SIcon = statusIcon[seq.status];
            const isOpen = expandedSeq === seq.id;
            return (
              <div key={seq.id} className="bg-card rounded-lg border border-border">
                <button
                  onClick={() => setExpandedSeq(isOpen ? null : seq.id)}
                  className="w-full flex items-center justify-between p-5 text-left">
                  <div>
                    <h4 className="font-semibold text-card-foreground">{seq.name}</h4>
                    <p className="text-xs text-muted-foreground">
                      {seq.segment} · {seq.totalRecipients.toLocaleString('en-IN')} recipients · {seq.startedAt}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`flex items-center gap-1 text-xs font-medium ${statusColor[seq.status]}`}>
                      <SIcon size={12} /> {seq.status}
                    </span>
                    {isOpen ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
                  </div>
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 space-y-2 border-t border-border pt-4">
                    {seq.messages.map((msg, i) => {
                      const replyRate = msg.sent > 0 ? ((msg.replied / msg.sent) * 100).toFixed(1) : '0';
                      return (
                        <div key={i} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                          <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                            <MessageSquare size={14} className="text-green-600" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-medium text-card-foreground">Day {msg.day}</p>
                            <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{msg.template}</p>
                          </div>
                          <div className="text-right flex-shrink-0">
                            <p className="text-xs text-card-foreground">Sent: {msg.sent.toLocaleString('en-IN')}</p>
                            <p className="text-xs text-green-600">Replied: {msg.replied} ({replyRate}%)</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CPWhatsAppBroadcast;
