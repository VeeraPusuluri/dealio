import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore, roleLabels, roleColors } from '@/stores/useAuthStore';
import ProfilePicUploader from '@/components/shared/ProfilePicUploader';
import SignOutCard from '@/components/shared/SignOutCard';
import { builderApi } from '@/lib/api';
import {
  User, Building2, Mail, Phone, Globe, MapPin,
  Save, CheckCircle2, Loader2, Calendar, FileText, Moon, Sun,
} from 'lucide-react';
import { toast } from 'sonner';
import { useThemeStore } from '@/stores/useThemeStore';
import { getAvailability, saveAvailability, ALL_SLOTS, DAY_NAMES, BuilderAvailability } from '@/lib/builderAvailability';

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
  { id: 'profile',       label: 'Profile',       icon: User      },
  { id: 'company',       label: 'Company',        icon: Building2 },
  { id: 'availability',  label: 'Availability',   icon: Calendar  },
];

const BuilderSettings = () => {
  const { user } = useAuthStore();
  const { isDark, toggle: toggleTheme } = useThemeStore();
  const [activeTab, setActiveTab] = useState('profile');

  // Availability
  const builderId = builderApi.getCachedBuilderId() ?? String(user?.id ?? '');
  const [avail, setAvail] = useState<BuilderAvailability>(() => getAvailability(builderId));
  const toggleDay = (dow: string) => {
    setAvail(prev => {
      const next = { ...prev, weeklySlots: { ...prev.weeklySlots } };
      if (next.weeklySlots[dow]) { delete next.weeklySlots[dow]; }
      else { next.weeklySlots[dow] = ALL_SLOTS; }
      return next;
    });
  };
  const toggleSlot = (dow: string, slot: string) => {
    setAvail(prev => {
      const current = prev.weeklySlots[dow] ?? [];
      const next = current.includes(slot) ? current.filter(s => s !== slot) : [...current, slot];
      return { ...prev, weeklySlots: { ...prev.weeklySlots, [dow]: next } };
    });
  };
  const saveAvail = () => {
    saveAvailability({ ...avail, builderId });
    toast.success('Availability saved — customers will see your available slots.');
  };

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
            <div className="border-4 border-card rounded-2xl flex-shrink-0" style={{ boxShadow: `0 4px 14px ${color}40` }}>
              <ProfilePicUploader size={56} showLabel={false} />
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
                {/* Profile picture */}
                <div className="flex items-center gap-5 p-3.5 rounded-xl border border-border bg-muted/20">
                  <ProfilePicUploader size={64} showLabel />
                  <div>
                    <p className="text-[13px] font-semibold text-card-foreground">Profile Picture</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Take a selfie or upload from your device</p>
                  </div>
                </div>

                {/* Dark mode toggle */}
                <div className="flex items-center justify-between p-3.5 rounded-xl border border-border bg-muted/20">
                  <div className="flex items-center gap-3">
                    {isDark ? <Moon size={15} style={{ color }} /> : <Sun size={15} style={{ color }} />}
                    <div>
                      <p className="text-[13px] font-semibold text-card-foreground">Dark Mode</p>
                      <p className="text-[11px] text-muted-foreground">{isDark ? 'Dark theme is on' : 'Light theme is on'}</p>
                    </div>
                  </div>
                  <button onClick={toggleTheme}
                    className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${isDark ? 'bg-teal-600' : 'bg-muted border border-border'}`}>
                    <span className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform duration-200 ${isDark ? 'translate-x-5' : 'translate-x-0'}`} />
                  </button>
                </div>

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

            {/* ── Availability ── */}
            {activeTab === 'availability' && (
              <div className="bg-card rounded-2xl border border-border p-5 space-y-5">
                <div className="flex items-center gap-2 pb-3 border-b border-border">
                  <Calendar size={14} style={{ color }} />
                  <h3 className="text-[13px] font-semibold text-card-foreground">Meeting Availability</h3>
                </div>
                <p className="text-[12px] text-muted-foreground">Set the days and time slots when customers and CPs can book a meeting with you.</p>

                <div className="space-y-4">
                  {[0,1,2,3,4,5,6].map(dow => {
                    const key = String(dow);
                    const active = !!avail.weeklySlots[key];
                    const slots  = avail.weeklySlots[key] ?? [];
                    return (
                      <div key={dow} className={`rounded-xl border p-3.5 space-y-3 transition-colors ${active ? 'border-teal-200 bg-teal-50/30' : 'border-border bg-muted/10'}`}>
                        <label className="flex items-center gap-2.5 cursor-pointer select-none">
                          <input type="checkbox" checked={active} onChange={() => toggleDay(key)}
                            className="w-4 h-4 rounded accent-teal-600" />
                          <span className={`text-[13px] font-semibold ${active ? 'text-teal-800' : 'text-muted-foreground'}`}>{DAY_NAMES[dow]}</span>
                        </label>
                        {active && (
                          <div className="flex flex-wrap gap-1.5">
                            {ALL_SLOTS.map(s => (
                              <button key={s} onClick={() => toggleSlot(key, s)}
                                className={`text-[11px] px-2.5 py-1 rounded-lg border font-medium transition-colors ${
                                  slots.includes(s)
                                    ? 'border-teal-500 bg-teal-600 text-white'
                                    : 'border-border text-muted-foreground hover:border-teal-300'
                                }`}>{s}</button>
                            ))}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="flex justify-end pt-1">
                  <button onClick={saveAvail}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-semibold text-white hover:opacity-90 transition-all"
                    style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)` }}>
                    <Save size={13} /> Save Availability
                  </button>
                </div>
              </div>
            )}

          </div>
        </div>

        <SignOutCard />
      </div>
    </DashboardLayout>
  );
};

export default BuilderSettings;