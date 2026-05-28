import { useState, useEffect, useCallback } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/stores/useAuthStore';
import { cpApi, builderApi } from '@/lib/api';
import { MessageSquare, Users, Building2, Send, Loader2, CheckSquare, Square, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

interface Contact { id: number; name: string; phone: string; bhkPreference?: string | null; }
interface Project {
  id: number; name: string; city: string;
  priceMin: number | null; priceMax: number | null;
  configurations: string[] | null; builderName: string | null;
}

const fmt = (n: number | null) => {
  if (!n) return '?';
  if (n >= 10_000_000) return `${(n / 10_000_000).toFixed(1)}Cr`;
  if (n >= 100_000)    return `${(n / 100_000).toFixed(0)}L`;
  return n.toLocaleString('en-IN');
};

function buildMessage(contact: Contact, project: Project): string {
  const price = project.priceMin ? `₹${fmt(project.priceMin)}${project.priceMax ? ` – ₹${fmt(project.priceMax)}` : '+'}` : 'Price on request';
  const configs = project.configurations?.join(' / ') ?? '';
  return `Hi ${contact.name}! 👋\n\nI wanted to share an exciting property with you:\n\n🏠 *${project.name}*\n📍 ${project.city}\n💰 Starting ${price}\n🏗️ ${configs ? configs + ' options available' : 'Multiple options'}\n\nI'd love to arrange a site visit at your convenience. Reply to this message or call me anytime!\n\nBest regards,\n${'' /* filled by sender */}`;
}

export default function CPWhatsAppBroadcast() {
  const { user } = useAuthStore();
  const cpUserId = user?.id ?? '';

  const [contacts, setContacts]         = useState<Contact[]>([]);
  const [projects, setProjects]         = useState<Project[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(true);
  const [loadingProjects, setLoadingProjects] = useState(true);
  const [selectedContacts, setSelectedContacts] = useState<Set<number>>(new Set());
  const [selectedProjectId, setSelectedProjectId] = useState<number | null>(null);
  const [customMsg, setCustomMsg]       = useState('');
  const [step, setStep]                 = useState<1|2|3>(1);
  const [showContacts, setShowContacts] = useState(true);
  const [showProjects, setShowProjects] = useState(true);

  const fetchData = useCallback(async () => {
    if (!cpUserId) { setLoadingContacts(false); setLoadingProjects(false); return; }
    setLoadingContacts(true);
    setLoadingProjects(true);
    cpApi.getContacts(cpUserId)
      .then(d => setContacts((d as Contact[]) || []))
      .catch(() => {})
      .finally(() => setLoadingContacts(false));
    builderApi.getPublicProjects()
      .then(d => setProjects((d as Project[]) || []))
      .catch(() => {})
      .finally(() => setLoadingProjects(false));
  }, [cpUserId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const selectedProject = projects.find(p => p.id === selectedProjectId) ?? null;

  const toggleContact = (id: number) => {
    setSelectedContacts(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedContacts(new Set(contacts.map(c => c.id)));
  const clearAll  = () => setSelectedContacts(new Set());

  const handleSend = () => {
    if (selectedContacts.size === 0 || !selectedProject) {
      toast.error('Select at least one contact and a project');
      return;
    }
    const chosen = contacts.filter(c => selectedContacts.has(c.id));
    let sent = 0;
    for (const contact of chosen) {
      const msg = customMsg || buildMessage(contact, selectedProject);
      const phone = contact.phone.replace(/\D/g, '');
      if (phone) {
        window.open(`https://wa.me/91${phone}?text=${encodeURIComponent(msg)}`, '_blank');
        sent++;
        if (sent >= 3) break; // browsers block too many tabs
      }
    }
    if (chosen.length > 3) {
      toast.info(`Opened WhatsApp for first 3 contacts. Browsers limit simultaneous tabs.`);
    } else {
      toast.success(`WhatsApp opened for ${sent} contact${sent !== 1 ? 's' : ''}`);
    }
  };

  const STEPS = ['Select Contacts', 'Select Project', 'Compose & Send'];

  return (
    <DashboardLayout>
      <div className="space-y-5 pb-8">

        <div>
          <h1 className="text-[17px] font-bold text-foreground">WhatsApp Broadcast</h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">Send personalised project updates to your contacts</p>
        </div>

        {/* Step indicator */}
        <div className="flex items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className={`w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center shrink-0 ${
                step > i + 1 ? 'bg-teal-600 text-white' : step === i + 1 ? 'bg-teal-600 text-white' : 'bg-muted text-muted-foreground'
              }`}>{i + 1}</div>
              <span className={`text-[11px] truncate ${step === i + 1 ? 'text-teal-700 font-semibold' : 'text-muted-foreground'}`}>{label}</span>
              {i < STEPS.length - 1 && <div className="h-px flex-1 bg-border" />}
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          {/* Contacts panel */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <button className="w-full flex items-center justify-between px-5 py-4 border-b border-border hover:bg-muted/20 transition-colors"
              onClick={() => setShowContacts(v => !v)}>
              <div className="flex items-center gap-2.5">
                <Users size={15} className="text-teal-600" />
                <span className="text-[13px] font-bold text-foreground">Contacts</span>
                {selectedContacts.size > 0 && (
                  <span className="w-5 h-5 rounded-full bg-teal-600 text-white text-[10px] font-bold flex items-center justify-center">
                    {selectedContacts.size}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <button onClick={e => { e.stopPropagation(); selectedContacts.size === contacts.length ? clearAll() : selectAll(); }}
                  className="text-[11px] text-teal-600 hover:text-teal-700 font-medium">
                  {selectedContacts.size === contacts.length ? 'Clear all' : 'Select all'}
                </button>
                {showContacts ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
              </div>
            </button>

            {showContacts && (
              <div className="max-h-72 overflow-y-auto">
                {loadingContacts ? (
                  <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
                ) : contacts.length === 0 ? (
                  <div className="text-center py-8">
                    <Users size={20} className="text-muted-foreground mx-auto mb-2" />
                    <p className="text-[12px] text-muted-foreground">No contacts yet. Add contacts in My Contacts.</p>
                  </div>
                ) : (
                  contacts.map(c => (
                    <button key={c.id} onClick={() => { toggleContact(c.id); setStep(2); }}
                      className={`w-full flex items-center gap-3 px-5 py-3 border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${selectedContacts.has(c.id) ? 'bg-teal-50/50' : ''}`}>
                      {selectedContacts.has(c.id)
                        ? <CheckSquare size={16} className="text-teal-600 shrink-0" />
                        : <Square size={16} className="text-muted-foreground shrink-0" />}
                      <div className="flex-1 text-left min-w-0">
                        <p className="text-[12px] font-medium text-foreground truncate">{c.name}</p>
                        <p className="text-[11px] text-muted-foreground">{c.phone}{c.bhkPreference ? ` · ${c.bhkPreference}` : ''}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>

          {/* Projects panel */}
          <div className="rounded-2xl border border-border bg-card overflow-hidden">
            <button className="w-full flex items-center justify-between px-5 py-4 border-b border-border hover:bg-muted/20 transition-colors"
              onClick={() => setShowProjects(v => !v)}>
              <div className="flex items-center gap-2.5">
                <Building2 size={15} className="text-teal-600" />
                <span className="text-[13px] font-bold text-foreground">Project</span>
                {selectedProject && (
                  <span className="text-[11px] text-teal-600 font-medium truncate max-w-[120px]">{selectedProject.name}</span>
                )}
              </div>
              {showProjects ? <ChevronUp size={14} className="text-muted-foreground" /> : <ChevronDown size={14} className="text-muted-foreground" />}
            </button>

            {showProjects && (
              <div className="max-h-72 overflow-y-auto">
                {loadingProjects ? (
                  <div className="flex justify-center py-8"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
                ) : projects.length === 0 ? (
                  <div className="text-center py-8">
                    <Building2 size={20} className="text-muted-foreground mx-auto mb-2" />
                    <p className="text-[12px] text-muted-foreground">No projects available.</p>
                  </div>
                ) : (
                  projects.map(p => (
                    <button key={p.id} onClick={() => { setSelectedProjectId(p.id); setCustomMsg(''); setStep(3); }}
                      className={`w-full text-left px-5 py-3 border-b border-border last:border-0 hover:bg-muted/20 transition-colors ${selectedProjectId === p.id ? 'bg-teal-50/50' : ''}`}>
                      <div className="flex items-center gap-2">
                        {selectedProjectId === p.id
                          ? <CheckSquare size={14} className="text-teal-600 shrink-0" />
                          : <Square size={14} className="text-muted-foreground shrink-0" />}
                        <div className="flex-1 min-w-0">
                          <p className="text-[12px] font-medium text-foreground truncate">{p.name}</p>
                          <p className="text-[11px] text-muted-foreground">{p.city} · {p.priceMin ? `from ₹${fmt(p.priceMin)}` : 'Price on request'}</p>
                        </div>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Message composer */}
        {selectedProject && (
          <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[13px] font-bold text-foreground">Message Preview</p>
              <p className="text-[11px] text-muted-foreground">{selectedContacts.size} recipient{selectedContacts.size !== 1 ? 's' : ''} selected</p>
            </div>
            <textarea
              value={customMsg || (contacts[0] ? buildMessage(contacts[0], selectedProject) : buildMessage({ id: 0, name: '[Name]', phone: '' }, selectedProject))}
              onChange={e => setCustomMsg(e.target.value)}
              rows={8}
              placeholder="Customise your message…"
              className="w-full px-3.5 py-3 rounded-xl border border-border bg-muted/30 text-[13px] text-foreground focus:outline-none focus:ring-2 focus:ring-teal-400/20 focus:border-teal-400 resize-none transition-all"
            />
            <p className="text-[11px] text-muted-foreground">Each contact will be greeted by their own name automatically.</p>
            <button onClick={handleSend}
              disabled={selectedContacts.size === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-[13px] font-semibold text-white disabled:opacity-50 hover:opacity-90 transition-all"
              style={{ background: '#25D366' }}>
              <Send size={14} /> Send via WhatsApp ({selectedContacts.size})
            </button>
          </div>
        )}

        {!selectedProject && selectedContacts.size === 0 && (
          <div className="rounded-2xl border border-dashed border-border bg-muted/20 p-10 text-center">
            <MessageSquare size={28} className="text-muted-foreground mx-auto mb-3" />
            <p className="text-[13px] font-semibold text-foreground">Select contacts and a project to get started</p>
            <p className="text-[12px] text-muted-foreground mt-1">A personalised WhatsApp message will be composed for each contact.</p>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
