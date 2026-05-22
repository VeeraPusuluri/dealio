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

const inp = 'w-full mt-1 px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-[#E87722]/20 focus:border-[#E87722] focus:bg-white transition-all';

function ContactAvatar({ name }: { name: string }) {
  return (
    <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
      style={{ background: 'linear-gradient(135deg,#E87722,#D4691C)' }}>
      {name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase()}
    </div>
  );
}

function TagChip({ tag }: { tag: string }) {
  const colors: Record<string, string> = {
    'Hot Lead': 'bg-red-100 text-red-700',
    'Warm Lead': 'bg-orange-100 text-orange-700',
    'Family': 'bg-purple-100 text-purple-700',
    'Friend': 'bg-blue-100 text-blue-700',
    'Colleague': 'bg-teal-100 text-teal-700',
    'Client': 'bg-green-100 text-green-700',
  };
  return (
    <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${colors[tag] ?? 'bg-gray-100 text-gray-600'}`}>
      {tag}
    </span>
  );
}

const CPContacts = () => {
  const { user } = useAuthStore();
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
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
    ]).then(([c, p]) => {
      setContacts(c ?? []);
      setProjects((p ?? []).slice(0, 20));
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
      <div className="space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-xl font-bold text-foreground">My Contacts</h1>
            <p className="text-sm text-muted-foreground mt-0.5">People you know — share projects instantly via WhatsApp</p>
          </div>
          <div className="flex items-center gap-2">
            {/* CSV upload */}
            <input ref={csvRef} type="file" accept=".csv" className="hidden" onChange={handleCsvUpload} />
            <button
              onClick={() => csvRef.current?.click()}
              disabled={csvUploading}
              title="Upload CSV (columns: name, phone, email, bhk_preference)"
              className="flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-semibold border border-border text-muted-foreground hover:bg-muted disabled:opacity-50">
              <Upload size={14} /> {csvUploading ? 'Importing…' : 'Import CSV'}
            </button>
            <button onClick={() => { resetForm(); setShowAdd(true); }}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white shadow-md"
              style={{ background: 'linear-gradient(135deg,#E87722,#D4691C)' }}>
              <Plus size={15} /> Add Contact
            </button>
          </div>
        </div>
        {/* CSV hint */}
        <p className="text-xs text-muted-foreground -mt-2">
          CSV format: <code className="bg-muted px-1 rounded text-[11px]">name, phone, email, bhk_preference</code> (headers required)
        </p>

        {/* Stats bar */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: 'Total Contacts', value: contacts.length, color: '#E87722' },
            { label: 'Hot / Warm Leads', value: contacts.filter(c => c.tags?.includes('Lead')).length, color: '#DC2626' },
            { label: 'Shared Projects', value: 0, color: '#16A34A' },
          ].map(s => (
            <div key={s.label} className="bg-card rounded-xl border border-border p-4 text-center">
              <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search by name or phone..."
            className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-input bg-card text-sm" />
        </div>

        {/* Contact list */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground text-sm">Loading contacts…</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <Users size={40} className="mx-auto mb-3 opacity-30" />
            <p className="font-medium">{search ? 'No contacts match your search' : 'No contacts yet'}</p>
            <p className="text-xs mt-1">Add people you know and share project details with one tap</p>
          </div>
        ) : (
          <div className="grid gap-3">
            {filtered.map(contact => (
              <div key={contact.id} className="bg-card rounded-xl border border-border p-4 hover:border-[#E87722]/40 transition-colors">
                <div className="flex items-start gap-3">
                  <ContactAvatar name={contact.name} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="font-semibold text-card-foreground">{contact.name}</span>
                      {contact.tags && contact.tags.split(',').map(t => t.trim()).filter(Boolean).map(tag => (
                        <TagChip key={tag} tag={tag} />
                      ))}
                    </div>
                    <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground flex-wrap">
                      <span className="flex items-center gap-1"><Phone size={11} /> {contact.phone}</span>
                      {contact.email && <span className="flex items-center gap-1"><Mail size={11} /> {contact.email}</span>}
                      {contact.bhkPreference && (
                        <span className="flex items-center gap-1 text-blue-600 font-medium"><Home size={11} /> {contact.bhkPreference}</span>
                      )}
                    </div>
                    {contact.notes && (
                      <p className="text-xs text-muted-foreground mt-1 italic truncate">{contact.notes}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => setShareContact(contact)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
                      style={{ backgroundColor: '#25D366' }}>
                      <Share2 size={12} /> Share
                    </button>
                    <a href={`tel:${contact.phone}`}
                      className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground">
                      <Phone size={14} />
                    </a>
                    <a href={`https://wa.me/91${contact.phone.replace(/\D/g, '')}`} target="_blank" rel="noreferrer"
                      className="p-1.5 rounded-lg bg-green-50 hover:bg-green-100 text-green-700">
                      <MessageSquare size={14} />
                    </a>
                    <button onClick={() => openEdit(contact)}
                      className="p-1.5 rounded-lg bg-muted hover:bg-muted/80 text-muted-foreground">
                      <Edit2 size={14} />
                    </button>
                    <button onClick={() => handleDelete(contact.id)}
                      className="p-1.5 rounded-lg bg-red-50 hover:bg-red-100 text-red-500">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Add / Edit modal */}
      {showAdd && (
        <>
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => { setShowAdd(false); resetForm(); }} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between p-5 border-b">
                <h3 className="font-bold text-gray-900">{editingContact ? 'Edit Contact' : 'Add New Contact'}</h3>
                <button onClick={() => { setShowAdd(false); resetForm(); }} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X size={18} />
                </button>
              </div>
              <div className="p-5 space-y-4">
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Full Name *</label>
                  <input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="e.g. Rahul Sharma" className={inp} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Phone Number *</label>
                  <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                    placeholder="e.g. 9876543210" type="tel" className={inp} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Email (optional)</label>
                  <input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                    placeholder="e.g. rahul@email.com" type="email" className={inp} />
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">BHK Preference</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {BHK_OPTIONS.map(opt => (
                      <button key={opt} type="button" onClick={() => setForm(f => ({ ...f, bhkPreference: f.bhkPreference === opt ? '' : opt }))}
                        className={`text-xs px-3 py-1 rounded-full border font-medium transition-all flex items-center gap-1 ${
                          form.bhkPreference === opt
                            ? 'bg-blue-600 text-white border-blue-600'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-blue-400'
                        }`}>
                        <Home size={10} /> {opt}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Tags</label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {TAG_OPTIONS.map(tag => (
                      <button key={tag} type="button" onClick={() => toggleTag(tag)}
                        className={`text-xs px-3 py-1 rounded-full border font-medium transition-all ${
                          selectedTags.includes(tag)
                            ? 'bg-[#E87722] text-white border-[#E87722]'
                            : 'bg-white text-gray-600 border-gray-200 hover:border-[#E87722]'
                        }`}>
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-xs font-semibold text-gray-500 uppercase tracking-wide">Notes (optional)</label>
                  <textarea value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))}
                    placeholder="e.g. Looking for 3BHK in Gachibowli, budget ~₹80L"
                    rows={2} className={inp + ' resize-none'} />
                </div>
              </div>
              <div className="flex gap-3 p-5 border-t">
                <button onClick={() => { setShowAdd(false); resetForm(); }}
                  className="flex-1 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-600 hover:bg-gray-50">
                  Cancel
                </button>
                <button onClick={handleSave} disabled={saving}
                  className="flex-1 py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg,#E87722,#D4691C)' }}>
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
          <div className="fixed inset-0 z-40 bg-black/40" onClick={() => setShareContact(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
              <div className="flex items-center justify-between p-5 border-b">
                <div>
                  <h3 className="font-bold text-gray-900">Share Project</h3>
                  <p className="text-sm text-gray-500 mt-0.5">
                    Sharing with <span className="font-semibold text-gray-800">{shareContact.name}</span>
                  </p>
                </div>
                <button onClick={() => setShareContact(null)} className="p-1 hover:bg-gray-100 rounded-lg">
                  <X size={18} />
                </button>
              </div>
              <div className="p-5">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">Pick a project to share</p>
                {projects.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-6">No projects available</p>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {projects.map(p => (
                      <button key={p.id} onClick={() => shareViaWhatsApp(shareContact, p)}
                        className="w-full flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-[#25D366] hover:bg-green-50 transition-all text-left group">
                        <div className="w-9 h-9 rounded-lg bg-teal-50 flex items-center justify-center flex-shrink-0">
                          <Building2 size={16} className="text-teal-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-gray-900 truncate">{p.name}</p>
                          <p className="text-xs text-gray-500">
                            {p.city || 'Location TBD'}
                            {p.priceFrom ? ` · ₹${(p.priceFrom / 100000).toFixed(0)}L+` : ''}
                          </p>
                        </div>
                        <div className="flex items-center gap-1 text-xs font-semibold text-[#25D366] opacity-0 group-hover:opacity-100 transition-opacity">
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