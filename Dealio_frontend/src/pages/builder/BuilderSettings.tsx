import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore, roleLabels, roleColors } from '@/stores/useAuthStore';
import { builderApi } from '@/lib/api';
import {
  User, Building2, Mail, Phone, Globe, MapPin,
  Save, CheckCircle2, Loader2, Calendar, FileText,
} from 'lucide-react';
import { toast } from 'sonner';

const PROFILE_KEY = 'dealio_builder_profile';
const USER_KEY    = 'dealio_user';

interface BuilderProfile {
  companyName: string;
  description: string;
  website: string;
  established: string;
  officeAddress: string;
  city: string;
  reraLicense: string;
  totalProjectsDelivered: string;
}

function loadProfile(): BuilderProfile {
  try { return { ...emptyProfile(), ...JSON.parse(localStorage.getItem(PROFILE_KEY) || '{}') }; }
  catch { return emptyProfile(); }
}

function emptyProfile(): BuilderProfile {
  return { companyName: '', description: '', website: '', established: '', officeAddress: '', city: '', reraLicense: '', totalProjectsDelivered: '' };
}

const TABS = [
  { id: 'profile', label: 'Profile', icon: User },
  { id: 'company', label: 'Company', icon: Building2 },
];

const BuilderSettings = () => {
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('profile');

  const color = user ? roleColors[user.role] || '#0A7E8C' : '#0A7E8C';
  const initials = (user?.name || 'U').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  const [name,  setName]  = useState(user?.name  || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved,  setProfileSaved]  = useState(false);

  const [profile, setProfile] = useState<BuilderProfile>(emptyProfile());
  const [savingCompany, setSavingCompany] = useState(false);
  const [companySaved,  setCompanySaved]  = useState(false);

  useEffect(() => { setProfile(loadProfile()); }, []);

  const setField = (key: keyof BuilderProfile) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setProfile(prev => ({ ...prev, [key]: e.target.value }));

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setSavingProfile(true);
    try {
      const resolvedEmail = email || `uid${user.id}@dealio.builder`;
      await builderApi.ensureBuilder(name.trim() || user.name, resolvedEmail, phone || user.phone, user.id);
      const stored = JSON.parse(localStorage.getItem(USER_KEY) || '{}');
      const updated = { ...stored, name: name.trim() || stored.name, email: email || stored.email, phone: phone || stored.phone };
      localStorage.setItem(USER_KEY, JSON.stringify(updated));
      useAuthStore.setState(s => ({ user: s.user ? { ...s.user, name: updated.name, email: updated.email, phone: updated.phone } : s.user }));
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
      toast.success('Profile updated');
    } catch {
      toast.error('Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSaveCompany = async () => {
    setSavingCompany(true);
    try {
      localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
      setCompanySaved(true);
      setTimeout(() => setCompanySaved(false), 2500);
      toast.success('Company info saved');
    } catch {
      toast.error('Failed to save company info');
    } finally {
      setSavingCompany(false);
    }
  };

  if (!user) return null;

  const inp = 'w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:border-ring transition-all';

  return (
    <DashboardLayout>
      <div className="max-w-3xl mx-auto space-y-5 pb-8">

        {/* Profile header */}
        <div className="rounded-2xl border border-border overflow-hidden bg-card">
          <div className="h-16" style={{ background: `linear-gradient(135deg, ${color}22, ${color}08)` }} />
          <div className="px-5 pb-5 -mt-7 flex items-end gap-4">
            <div
              className="w-14 h-14 rounded-xl border-4 border-card flex items-center justify-center text-white text-lg font-bold flex-shrink-0"
              style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)`, boxShadow: `0 4px 14px ${color}40` }}
            >
              {initials}
            </div>
            <div className="pb-0.5 flex-1 min-w-0">
              <h2 className="text-[15px] font-bold text-card-foreground truncate">{user.name}</h2>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: color }}>
                  {roleLabels[user.role]}
                </span>
                {user.email && <span className="text-[11px] text-muted-foreground truncate">{user.email}</span>}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs + Content */}
        <div className="flex gap-4">

          {/* Left nav */}
          <div className="w-40 flex-shrink-0 space-y-0.5">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-[13px] transition-all text-left ${
                  activeTab === tab.id
                    ? 'font-medium text-card-foreground bg-muted'
                    : 'text-muted-foreground hover:text-card-foreground hover:bg-muted/50'
                }`}
              >
                <tab.icon size={14} style={activeTab === tab.id ? { color } : undefined} className={activeTab === tab.id ? '' : 'opacity-60'} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Content panel */}
          <div className="flex-1 min-w-0">

            {/* ── Profile ── */}
            {activeTab === 'profile' && (
              <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-border">
                  <User size={14} style={{ color }} />
                  <h3 className="text-[13px] font-semibold text-card-foreground">Personal Information</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-[11px] font-medium text-muted-foreground">Full Name</label>
                    <div className="relative">
                      <User size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <input value={name} onChange={e => setName(e.target.value)} className={`${inp} pl-9`} placeholder="Your full name" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-muted-foreground">Email Address</label>
                    <div className="relative">
                      <Mail size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} className={`${inp} pl-9`} placeholder="you@example.com" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-muted-foreground">Phone Number</label>
                    <div className="relative">
                      <Phone size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <input type="tel" value={phone} onChange={e => setPhone(e.target.value)} className={`${inp} pl-9`} placeholder="+91 98765 43210" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleSaveProfile}
                    disabled={savingProfile}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-semibold text-white hover:opacity-90 transition-all disabled:opacity-60"
                    style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)` }}
                  >
                    {savingProfile ? <><Loader2 size={13} className="animate-spin" />Saving…</>
                      : profileSaved ? <><CheckCircle2 size={13} />Saved!</>
                      : <><Save size={13} />Save Profile</>}
                  </button>
                </div>
              </div>
            )}

            {/* ── Company ── */}
            {activeTab === 'company' && (
              <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-border">
                  <Building2 size={14} style={{ color }} />
                  <h3 className="text-[13px] font-semibold text-card-foreground">Company Information</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-[11px] font-medium text-muted-foreground">Company / Developer Name</label>
                    <div className="relative">
                      <Building2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <input value={profile.companyName} onChange={setField('companyName')} className={`${inp} pl-9`} placeholder="e.g. Prestige Estates Ltd." />
                    </div>
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-[11px] font-medium text-muted-foreground">About the Company</label>
                    <textarea value={profile.description} onChange={setField('description')} rows={3}
                      className={`${inp} resize-none`} placeholder="Brief description of the company, vision, and track record…" />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-muted-foreground">Website</label>
                    <div className="relative">
                      <Globe size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <input type="url" value={profile.website} onChange={setField('website')} className={`${inp} pl-9`} placeholder="https://yourcompany.com" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-muted-foreground">Year Established</label>
                    <div className="relative">
                      <Calendar size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <input type="number" value={profile.established} onChange={setField('established')} className={`${inp} pl-9`} placeholder="e.g. 1996" min={1900} max={new Date().getFullYear()} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-muted-foreground">Projects Delivered</label>
                    <div className="relative">
                      <Building2 size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <input type="number" value={profile.totalProjectsDelivered} onChange={setField('totalProjectsDelivered')} className={`${inp} pl-9`} placeholder="e.g. 42" min={0} />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-muted-foreground">RERA License / Registration</label>
                    <div className="relative">
                      <FileText size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <input value={profile.reraLicense} onChange={setField('reraLicense')} className={`${inp} pl-9`} placeholder="e.g. A51800001234" />
                    </div>
                  </div>

                  <div className="sm:col-span-2 space-y-1.5">
                    <label className="text-[11px] font-medium text-muted-foreground">Office Address</label>
                    <div className="relative">
                      <MapPin size={13} className="absolute left-3 top-3 text-muted-foreground pointer-events-none" />
                      <textarea value={profile.officeAddress} onChange={setField('officeAddress')} rows={2}
                        className={`${inp} pl-9 resize-none`} placeholder="Full office address" />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-muted-foreground">City</label>
                    <div className="relative">
                      <MapPin size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
                      <input value={profile.city} onChange={setField('city')} className={`${inp} pl-9`} placeholder="e.g. Hyderabad" />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleSaveCompany}
                    disabled={savingCompany}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-semibold text-white hover:opacity-90 transition-all disabled:opacity-60"
                    style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)` }}
                  >
                    {savingCompany ? <><Loader2 size={13} className="animate-spin" />Saving…</>
                      : companySaved ? <><CheckCircle2 size={13} />Saved!</>
                      : <><Save size={13} />Save Company Info</>}
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BuilderSettings;