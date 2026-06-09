import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/stores/useAuthStore';
import { cpApi, builderApi } from '@/lib/api';
import { toast } from 'sonner';
import {
  Users, Plus, Phone, Mail, MessageSquare, Share2, Search,
  Trash2, X, Edit2, Building2, Upload, Home, ChevronDown,
} from 'lucide-react';

interface Contact {
  id: number;
  name: string;
  phone: string;
  email?: string | null;
  notes?: string | null;
  tags?: string | null;
  bhkPreference?: string | null;
  createdAt: string;
}

const BHK_OPTIONS = ['1 BHK', '2 BHK', '3 BHK', '4 BHK', 'Villa', 'Plot', 'Any'];

interface Project {
  id: number;
  name: string;
  city?: string;
  priceFrom?: number;
  priceTo?: number;
  commissionValue?: number;
}

const TAG_OPTIONS = ['Hot Lead', 'Warm Lead', 'Family', 'Friend', 'Colleague', 'Client'];

interface CustomerStage {
  status: string;
  projectName: string;
}

const STAGE_BADGE: Record<string, string> = {
  'New Lead':           'bg-slate-500/20 text-slate-300 border border-slate-500/20',
  'Profile Created':    'bg-teal-500/20 text-teal-300 border border-teal-500/20',
  'Meeting Requested':  'bg-indigo-500/20 text-indigo-300 border border-indigo-500/20',
  'Meeting Confirmed':  'bg-violet-500/20 text-violet-300 border border-violet-500/20',
  'Meeting Done':       'bg-pink-500/20 text-pink-300 border border-pink-500/20',
  'Negotiation':        'bg-amber-500/20 text-amber-300 border border-amber-500/20',
  'Agreement':          'bg-blue-500/20 text-blue-300 border border-blue-500/20',
  'Pending Booking':    'bg-cyan-500/20 text-cyan-300 border border-cyan-500/20',
  'Booked':             'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20',
  'Closed':             'bg-green-500/20 text-green-300 border border-green-500/20',
};

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, '');
  return digits.slice(-10);
}

const glassInp = 'w-full mt-1 px-3 py-2.5 rounded-xl border border-white/10 bg-white/5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/50 focus:bg-white/8 transition-all';

function ContactAvatar({ name }: { name: string }) {
  return (
    <div
      className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0 ring-2 ring-orange-500/30"
      style={{ background: 'linear-gradient(135deg, #F97316, #D97706)' }}
    >
      {name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
    </div>
  );
}

function TagChip({ tag }: { tag: string }) {
  const colors: Record<string, string> = {
    'Hot Lead':  'bg-red-500/20 text-red-300 border border-red-500/20',
    'Warm Lead': 'bg-orange-500/20 text-orange-300 border border-orange-500/20',
    'Family':    'bg-violet-500/20 text-violet-300 border border-violet-500/20',
    'Friend':    'bg-blue-500/20 text-blue-300 border border-blue-500/20',
    'Colleague': 'bg-teal-500/20 text-teal-300 border border-teal-500/20',
    'Client':    'bg-emerald-500/20 text-emerald-300 border border-emerald-500/20',
    'Imported':  'bg-slate-500/20 text-slate-300 border border-slate-500/20',
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${colors[tag] ?? 'bg-white/10 text-slate-300 border border-white/10'}`}>
      {tag}
    </span>
  );
}

const CPContacts = () => {
  const { user } = useAuthStore();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [stageByPhone, setStageByPhone] = useState<Record<string, CustomerStage>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const [editingContact, setEditingContact] = useState<Contact | null>(null);
  const [shareContact, setShareContact] = useState<Contact | null>(null);
  const [csvUploading, setCsvUploading] = useState(false);
  const csvRef = useRef<HTMLInputElement>(null);

  // form state
  const [form, setForm] = useState({ name: '', phone: '', email: '', notes: '', tags: '' as string, bhkPreference: '' });
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user?.id) return;
    Promise.all([
      cpApi.getContacts(user.id) as Promise<Contact[]>,
      builderApi.getPublicProjects() as Promise<Project[]>,
      cpApi.getLeads(user.id) as Promise<Array<{ customerPhone: string; status: string; projectName: string }>>,
    ]).then(([c, p, leads]) => {
      setContacts(c ?? []);
      setProjects((p ?? []).slice(0, 20));
      const stages: Record<string, CustomerStage> = {};
      (leads ?? []).forEach(l => {
        if (l.customerPhone) stages[normalizePhone(l.customerPhone)] = { status: l.status, projectName: l.projectName };
      });
      setStageByPhone(stages);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [user?.id]);

  const resetForm = () => {
    setForm({ name: '', phone: '', email: '', notes: '', tags: '', bhkPreference: '' });
    setSelectedTags([]);
    setEditingContact(null);
  };

  const openEdit = (c: Contact) => {
    setEditingContact(c);
    setForm({ name: c.name, phone: c.phone, email: c.email ?? '', notes: c.notes ?? '', tags: c.tags ?? '', bhkPreference: c.bhkPreference ?? '' });
    setSelectedTags(c.tags ? c.tags.split(',').map(t => t.trim()).filter(Boolean) : []);
    setShowAdd(true);
  };

  const handleCsvUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user?.id) return;
    setCsvUploading(true);
    try {
      const text = await file.text();
      const lines = text.split('\n').map(l => l.trim()).filter(Boolean);
      if (lines.length < 2) { toast.error('CSV must have a header row and at least one data row'); return; }
      const header = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
      const nameIdx  = header.findIndex(h => h.includes('name'));
      const phoneIdx = header.findIndex(h => h.includes('phone') || h.includes('mobile'));
      const emailIdx = header.findIndex(h => h.includes('email'));
      const bhkIdx   = header.findIndex(h => h.includes('bhk') || h.includes('preference') || h.includes('config'));
      if (nameIdx === -1 || phoneIdx === -1) {
        toast.error('CSV must have "name" and "phone" columns'); return;
      }
      let imported = 0;
      const newContacts: Contact[] = [];
      for (let i = 1; i < lines.length; i++) {
        const cols = lines[i].split(',').map(c => c.trim().replace(/^"|"$/g, ''));
        const name  = cols[nameIdx]?.trim();
        const phone = cols[phoneIdx]?.trim().replace(/\D/g, '');
        if (!name || !phone) continue;
        try {
          const created = await cpApi.addContact(user.id, {
            name,
            phone,
            email: emailIdx >= 0 ? cols[emailIdx]?.trim() || undefined : undefined,
            bhkPreference: bhkIdx >= 0 ? cols[bhkIdx]?.trim() || undefined : undefined,
            tags: 'Imported',
          }) as Contact;
          newContacts.push(created);
          imported++;
        } catch { /* skip duplicates / errors */ }
      }
      setContacts(prev => [...newContacts, ...prev]);
      toast.success(`Imported ${imported} contact${imported !== 1 ? 's' : ''} from CSV`);
    } catch {
      toast.error('Failed to parse CSV file');
    } finally {
      setCsvUploading(false);
      if (csvRef.current) csvRef.current.value = '';
    }
  };

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]);
  };

  const handleSave = async () => {
    if (!form.name.trim() || !form.phone.trim()) {
      toast.error('Name and phone are required');
      return;
    }
    setSaving(true);
    try {
      const payload = { ...form, tags: selectedTags.join(', '), bhkPreference: form.bhkPreference || undefined };
      if (editingContact) {
        const updated = await cpApi.updateContact(user!.id, editingContact.id, payload) as Contact;
        setContacts(prev => prev.map(c => c.id === updated.id ? updated : c));
        toast.success('Contact updated');
      } else {
        const created = await cpApi.addContact(user!.id, payload) as Contact;
        setContacts(prev => [created, ...prev]);
        toast.success('Contact added');
      }
      setShowAdd(false);
      resetForm();
    } catch (e: unknown) {
      toast.error(e instanceof Error ? e.message : 'Failed to save contact');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await cpApi.deleteContact(user!.id, id);
      setContacts(prev => prev.filter(c => c.id !== id));
      toast.success('Contact removed');
    } catch {
      toast.error('Failed to delete contact');
    }
  };

  const shareViaWhatsApp = (contact: Contact, project: Project) => {
    const priceStr = project.priceFrom
      ? `₹${(project.priceFrom / 100000).toFixed(0)}L${project.priceTo ? `–₹${(project.priceTo / 100000).toFixed(0)}L` : '+'}`
      : '';
    const msg = `Hi ${contact.name.split(' ')[0]}! 👋\n\nI wanted to share an exciting property opportunity with you:\n\n🏗️ *${project.name}*${project.city ? ` — ${project.city}` : ''}${priceStr ? `\n💰 Price: ${priceStr}` : ''}${project.commissionValue ? `\n📊 Commission: ${project.commissionValue}%` : ''}\n\nInterested? Let me know and I'll arrange a site visit for you.\n\nReach me anytime! 🙏`;
    window.open(`https://wa.me/91${contact.phone.replace(/\D/g, '')}?text=${encodeURIComponent(msg)}`, '_blank');
    setShareContact(null);
  };

  const filtered = contacts.filter(c =>
    !search || c.name.toLowerCase().includes(search.toLowerCase()) || c.phone.includes(search)
  );

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-gradient-to-br from-[#0A0F1A] to-[#111827] -m-4 sm:-m-6 p-4 sm:p-6 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-white tracking-tight">My Contacts</h1>
            <p className="text-sm text-slate-400 mt-0.5">People you know — share projects instantly via WhatsApp</p>
          </div>
          <div className="flex items-center gap-2">
            {/* CSV upload */}
            <input ref={csvRef} type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
            <button
              onClick={() => csvRef.current?.click()}
              disabled={csvUploading}
              title="Upload CSV (columns: name, phone, email, bhk_preference)"
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold border border-white/10 text-slate-300 hover:bg-white/10 bg-white/5 backdrop-blur-sm disabled:opacity-50 transition-all">
              <Upload size={14} /> {csvUploading ? 'Importing…' : 'Import CSV'}
            </button>
            <button
              onClick={() => { resetForm(); setShowAdd(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-lg shadow-orange-500/20 transition-all hover:shadow-orange-500/30 hover:scale-[1.02]"
              style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
              <Plus size={15} /> Add Contact
            </button>
          </div>
        </div>

        {/* CSV hint */}
        <p className="text-xs text-slate-500 -mt-2">
          CSV format: <code className="bg-white/5 border border-white/10 px-1.5 py-0.5 rounded text-[11px] text-slate-400">name, phone, email, bhk_preference</code> (headers required)
        </p>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Contacts', value: contacts.length, color: '#F97316', glow: 'rgba(249,115,22,0.15)', ring: 'from-orange-500/20 to-amber-600/5' },
            { label: 'Hot / Warm Leads', value: contacts.filter(c => c.tags?.includes('Lead')).length, color: '#EF4444', glow: 'rgba(239,68,68,0.15)', ring: 'from-red-500/20 to-rose-600/5' },
            { label: 'Shared Projects', value: 0, color: '#22C55E', glow: 'rgba(34,197,94,0.15)', ring: 'from-green-500/20 to-emerald-600/5' },
          ].map(s => (
            <div key={s.label} className="relative bg-white/5 backdrop-blur-sm rounded-2xl border border-white/10 p-4 text-center overflow-hidden">
              {/* Glow orb */}
              <div
                className="absolute inset-0 rounded-2xl opacity-60"
                style={{ background: `radial-gradient(ellipse at 50% 0%, ${s.glow} 0%, transparent 70%)` }}
              />
              <div className="relative z-10">
                <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
                <div className="text-xs text-slate-400 mt-0.5">{s.label}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-white/10 bg-white/5 backdrop-blur-sm text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-orange-500/30 focus:border-orange-500/40 transition-all"
          />
        </div>

        {/* Contact list */}
        {loading ? (
          <div className="text-center py-12 text-slate-500 text-sm">Loading contacts…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500">
            <Users size={40} className="mx-auto mb-3 opacity-20" />
            <p className="font-medium text-slate-300">{search ? 'No contacts match your search' : 'No contacts yet'}</p>
            <p className="text-xs mt-1 text-slate-500">Add people you know and share project details with one tap</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map(contact => {
              const stage = stageByPhone[normalizePhone(contact.phone)];
              return (
              <div
                key={contact.id}
                className="bg-white/[0.06] backdrop-blur-sm rounded-2xl border border-white/10 p-4 hover:border-orange-500/30 hover:bg-white/10 transition-all duration-200"
              >
                <div className="flex items-start gap-3">
                  <ContactAvatar name={contact.name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-white">{contact.name}</span>
                      {contact.tags && contact.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                        <TagChip key={tag} tag={tag} />
                      ))}
                      {stage && (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${STAGE_BADGE[stage.status] ?? 'bg-white/10 text-slate-300 border border-white/10'}`}>
                          {stage.status}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-slate-400 flex-wrap">
                      <span className="flex items-center gap-1"><Phone size={11} /> {contact.phone}</span>
                      {contact.email && <span className="flex items-center gap-1"><Mail size={11} /> {contact.email}</span>}
                      {contact.bhkPreference && (
                        <span className="flex items-center gap-1 text-sky-400 font-medium"><Home size={11} /> {contact.bhkPreference}</span>
                      )}
                    </div>
                    {stage && (
                      <p className="flex items-center gap-1 text-xs text-orange-300/80 mt-1">
                        <Building2 size={11} /> Currently in <span className="font-semibold">{stage.status}</span> for {stage.projectName}
                      </p>
                    )}
                    {contact.notes && (
                      <p className="text-xs text-slate-500 mt-1 italic truncate">{contact.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    <button
                      onClick={() => setShareContact(contact)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:scale-[1.03]"
                      style={{ background: 'linear-gradient(135deg, #16A34A, #15803D)' }}>
                      <Share2 size={12} /> Share
                    </button>
                    <a
                      href={`tel:${contact.phone}`}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all">
                      <Phone size={14} />
                    </a>
                    <a
                      href={`https://wa.me/91${contact.phone.replace(/\D/g, '')}`}
                      target="_blank"
                      rel="noreferrer"
                      className="p-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/20 text-emerald-400 transition-all">
                      <MessageSquare size={14} />
                    </a>
                    <button
                      onClick={() => openEdit(contact)}
                      className="p-1.5 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-slate-400 hover:text-white transition-all">
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(contact.id)}
                      className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 text-red-400 transition-all">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {showAdd && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => { setShowAdd(false); resetForm(); }} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-[#111827]/95 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl shadow-black/50 w-full max-w-md">
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <h3 className="font-bold text-white">{editingContact ? 'Edit Contact' : 'Add New Contact'}</h3>
                <button
                  onClick={() => { setShowAdd(false); resetForm(); }}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all">
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Full Name *</label>
                  <input
                    value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Rahul Sharma"
                    className={glassInp}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Phone Number *</label>
                  <input
                    value={form.phone}
                    onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="e.g. 9876543210"
                    type="tel"
                    className={glassInp}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Email (optional)</label>
                  <input
                    value={form.email}
                    onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="e.g. rahul@email.com"
                    type="email"
                    className={glassInp}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">BHK Preference</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {BHK_OPTIONS.map(opt => (
                      <button
                        key={opt}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, bhkPreference: f.bhkPreference === opt ? '' : opt }))}
                        className={`text-xs px-3 py-1 rounded-full border font-medium transition-all flex items-center gap-1 ${
                          form.bhkPreference === opt
                            ? 'bg-sky-500/20 text-sky-300 border-sky-500/40'
                            : 'bg-white/5 text-slate-400 border-white/10 hover:border-sky-500/30 hover:text-slate-300'
                        }`}>
                        <Home size={10} /> {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Tags</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {TAG_OPTIONS.map(tag => (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => toggleTag(tag)}
                        className={`text-xs px-3 py-1 rounded-full border font-medium transition-all ${
                          selectedTags.includes(tag)
                            ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                            : 'bg-white/5 text-slate-400 border-white/10 hover:border-orange-500/30 hover:text-slate-300'
                        }`}>
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-400 uppercase tracking-wide">Notes (optional)</label>
                  <textarea
                    value={form.notes}
                    onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="e.g. Looking for 3BHK in Gachibowli, budget ~₹80L"
                    rows={2}
                    className={glassInp + ' resize-none'}
                  />
                </div>
              </div>
              <div className="flex gap-3 p-5 border-t border-white/10">
                <button
                  onClick={() => { setShowAdd(false); resetForm(); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-white/10 text-slate-300 hover:bg-white/10 bg-white/5 transition-all">
                  Cancel
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50 shadow-lg shadow-orange-500/20 transition-all hover:shadow-orange-500/30"
                  style={{ background: 'linear-gradient(135deg, #F97316, #EA580C)' }}>
                  {saving ? 'Saving…' : editingContact ? 'Update Contact' : 'Add Contact'}
                </button>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Share project modal */}
      {shareContact && (
        <>
          <div className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm" onClick={() => setShareContact(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-[#111827]/95 backdrop-blur-2xl rounded-2xl border border-white/10 shadow-2xl shadow-black/50 w-full max-w-md">
              <div className="flex items-center justify-between p-5 border-b border-white/10">
                <div>
                  <h3 className="font-bold text-white">Share Project</h3>
                  <p className="text-sm text-slate-400 mt-0.5">
                    Sharing with <span className="font-semibold text-slate-200">{shareContact.name}</span>
                  </p>
                </div>
                <button
                  onClick={() => setShareContact(null)}
                  className="p-1.5 hover:bg-white/10 rounded-lg text-slate-400 hover:text-white transition-all">
                  <X size={18} />
                </button>
              </div>
              <div className="p-5">
                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Pick a project to share</p>
                {projects.length === 0 ? (
                  <p className="text-sm text-slate-500 text-center py-6">No projects available</p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-white/10">
                    {projects.map(p => (
                      <button
                        key={p.id}
                        onClick={() => shareViaWhatsApp(shareContact, p)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border border-white/10 hover:border-emerald-500/30 hover:bg-emerald-500/5 bg-white/[0.03] transition-all text-left group">
                        <div className="w-9 h-9 rounded-lg bg-teal-500/10 border border-teal-500/20 flex items-center justify-center flex-shrink-0">
                          <Building2 size={16} className="text-teal-400" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-white truncate">{p.name}</p>
                          <p className="text-xs text-slate-500">
                            {p.city || 'Location TBD'}
                            {p.priceFrom ? ` · ₹${(p.priceFrom / 100000).toFixed(0)}L+` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-semibold text-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MessageSquare size={12} /> WhatsApp
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </DashboardLayout>
  );
};

export default CPContacts;
