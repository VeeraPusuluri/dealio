import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/stores/useAuthStore';
import { builderApi } from '@/lib/api';
import {
  Settings, User, Building2, Mail, Phone, Globe, MapPin,
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

const ic = 'w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300 transition-all placeholder:text-slate-400 shadow-sm';

const SectionCard = ({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) => (
  <div className="la-card p-6 space-y-4">
    <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
      <span className="text-teal-500">{icon}</span>
      <h3 className="font-bold text-slate-800">{title}</h3>
    </div>
    {children}
  </div>
);

const BuilderSettings = () => {
  const { user } = useAuthStore();

  // ── Profile fields ──────────────────────────────────────────────────────────
  const [name,  setName]  = useState(user?.name  || '');
  const [email, setEmail] = useState(user?.email || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileSaved,  setProfileSaved]  = useState(false);

  // ── Company fields ──────────────────────────────────────────────────────────
  const [profile, setProfile] = useState<BuilderProfile>(emptyProfile());
  const [savingCompany, setSavingCompany] = useState(false);
  const [companySaved,  setCompanySaved]  = useState(false);

  useEffect(() => {
    setProfile(loadProfile());
  }, []);

  const setField = (key: keyof BuilderProfile) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setProfile(prev => ({ ...prev, [key]: e.target.value }));

  const handleSaveProfile = async () => {
    if (!user?.id) return;
    setSavingProfile(true);
    try {
      const resolvedEmail = email || `uid${user.id}@dealio.builder`;
      await builderApi.ensureBuilder(name.trim() || user.name, resolvedEmail, phone || user.phone, user.id);

      // Update localStorage user record
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

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">

        {/* Header */}
        <div className="la-banner px-5 py-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center bg-teal-100">
            <Settings size={20} className="text-teal-600" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">Account Settings</h2>
            <p className="text-sm text-slate-400">Manage your profile and company information</p>
          </div>
        </div>

        {/* ── Profile ──────────────────────────────────────────────────────────── */}
        <SectionCard title="Profile" icon={<User size={17} />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-600 mb-1 block">Full Name</label>
              <div className="relative">
                <User size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={name} onChange={e => setName(e.target.value)}
                  className={`${ic} pl-9`} placeholder="Your full name" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1 block">Email Address</label>
              <div className="relative">
                <Mail size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  className={`${ic} pl-9`} placeholder="you@example.com" />
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-slate-600 mb-1 block">Phone Number</label>
              <div className="relative">
                <Phone size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="tel" value={phone} onChange={e => setPhone(e.target.value)}
                  className={`${ic} pl-9`} placeholder="+91 98765 43210" />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button onClick={handleSaveProfile} disabled={savingProfile}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 hover:opacity-90 transition-opacity shadow-sm"
              style={{ background: 'linear-gradient(135deg, #0A7E8C, #086E7A)' }}>
              {savingProfile
                ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                : profileSaved
                  ? <><CheckCircle2 size={14} /> Saved!</>
                  : <><Save size={14} /> Save Profile</>}
            </button>
          </div>
        </SectionCard>

        {/* ── Company Info ──────────────────────────────────────────────────────── */}
        <SectionCard title="Company Information" icon={<Building2 size={17} />}>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-600 mb-1 block">Company / Developer Name</label>
              <div className="relative">
                <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={profile.companyName} onChange={setField('companyName')}
                  className={`${ic} pl-9`} placeholder="e.g. Prestige Estates Ltd." />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-600 mb-1 block">About the Company</label>
              <textarea value={profile.description} onChange={setField('description')} rows={3}
                className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300 transition-all placeholder:text-slate-400 shadow-sm"
                placeholder="Brief description of the company, vision, and track record…" />
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600 mb-1 block">Website</label>
              <div className="relative">
                <Globe size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="url" value={profile.website} onChange={setField('website')}
                  className={`${ic} pl-9`} placeholder="https://yourcompany.com" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600 mb-1 block">Year Established</label>
              <div className="relative">
                <Calendar size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="number" value={profile.established} onChange={setField('established')}
                  className={`${ic} pl-9`} placeholder="e.g. 1996" min={1900} max={new Date().getFullYear()} />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600 mb-1 block">Projects Delivered</label>
              <div className="relative">
                <Building2 size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input type="number" value={profile.totalProjectsDelivered} onChange={setField('totalProjectsDelivered')}
                  className={`${ic} pl-9`} placeholder="e.g. 42" min={0} />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600 mb-1 block">RERA License / Registration</label>
              <div className="relative">
                <FileText size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={profile.reraLicense} onChange={setField('reraLicense')}
                  className={`${ic} pl-9`} placeholder="e.g. A51800001234" />
              </div>
            </div>

            <div className="sm:col-span-2">
              <label className="text-sm font-medium text-slate-600 mb-1 block">Office Address</label>
              <div className="relative">
                <MapPin size={15} className="absolute left-3 top-3 text-muted-foreground" />
                <textarea value={profile.officeAddress} onChange={setField('officeAddress')} rows={2}
                  className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 resize-none focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300 transition-all placeholder:text-slate-400 shadow-sm"
                  placeholder="Full office address" />
              </div>
            </div>

            <div>
              <label className="text-sm font-medium text-slate-600 mb-1 block">City</label>
              <div className="relative">
                <MapPin size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input value={profile.city} onChange={setField('city')}
                  className={`${ic} pl-9`} placeholder="e.g. Hyderabad" />
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2">
            <button onClick={handleSaveCompany} disabled={savingCompany}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-60 hover:opacity-90 transition-opacity shadow-sm"
              style={{ background: 'linear-gradient(135deg, #0A7E8C, #086E7A)' }}>
              {savingCompany
                ? <><Loader2 size={14} className="animate-spin" /> Saving…</>
                : companySaved
                  ? <><CheckCircle2 size={14} /> Saved!</>
                  : <><Save size={14} /> Save Company Info</>}
            </button>
          </div>
        </SectionCard>

      </div>
    </DashboardLayout>
  );
};

export default BuilderSettings;