import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { customerApi } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { MapPin, Bell, Save, Settings, X, CheckCircle2, Loader2, Mail } from 'lucide-react';

const PREF_KEY = 'dealio_customer_prefs';
const USER_KEY = 'dealio_user';
const FALLBACK_CITIES = ['Hyderabad', 'Bengaluru', 'Mumbai', 'Pune', 'Delhi NCR', 'Chennai'];

function getPrefs(): { preferredCity?: string } {
  try { return JSON.parse(localStorage.getItem(PREF_KEY) || '{}'); } catch { return {}; }
}

const inp = 'flex-1 px-3 py-2.5 rounded-xl border border-gray-200 bg-gray-50 text-sm text-gray-900 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-secondary/20 focus:border-secondary focus:bg-white transition-all';

const CustomerSettings = () => {
  const user = useAuthStore((s) => s.user);
  const [cities, setCities] = useState<string[]>([]);
  const [loadingCities, setLoadingCities] = useState(true);
  const [preferredCity, setPreferredCity] = useState('');
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [email, setEmail] = useState(user?.email ?? '');
  const [emailSaving, setEmailSaving] = useState(false);
  const [emailSaved, setEmailSaved] = useState(false);
  const [emailError, setEmailError] = useState('');

  useEffect(() => {
    const prefs = getPrefs();
    if (prefs.preferredCity) setPreferredCity(prefs.preferredCity);
    customerApi.getCities()
      .then((data) => { const list = (data as string[]) || []; setCities(list.length > 0 ? list : FALLBACK_CITIES); })
      .catch(() => setCities(FALLBACK_CITIES))
      .finally(() => setLoadingCities(false));
  }, []);

  const handleSave = async () => {
    if (!preferredCity) return;
    setSaving(true);
    try {
      await customerApi.setPreferredCity(preferredCity);
      const prefs = getPrefs();
      localStorage.setItem(PREF_KEY, JSON.stringify({ ...prefs, preferredCity }));
      window.dispatchEvent(new CustomEvent('dealio:city-changed'));
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch { /* ignore */ }
    finally { setSaving(false); }
  };

  const handleEmailSave = async () => {
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { setEmailError('Enter a valid email address'); return; }
    setEmailError('');
    setEmailSaving(true);
    try {
      await customerApi.updateProfile({ email: email || null });
      if (user) {
        const updated = { ...user, email: email || undefined };
        useAuthStore.setState({ user: updated });
        localStorage.setItem(USER_KEY, JSON.stringify(updated));
      }
      setEmailSaved(true);
      setTimeout(() => setEmailSaved(false), 2500);
    } catch (err: any) {
      setEmailError(err?.message || 'Failed to save email');
    } finally {
      setEmailSaving(false);
    }
  };

  const handleClear = () => {
    setPreferredCity('');
    customerApi.setPreferredCity(null)
      .then(() => window.dispatchEvent(new CustomEvent('dealio:city-changed')))
      .catch(() => {});
    try { const prefs = getPrefs(); delete prefs.preferredCity; localStorage.setItem(PREF_KEY, JSON.stringify(prefs)); } catch { /* ignore */ }
  };

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6 pb-8">
        <div className="pt-1 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: 'linear-gradient(135deg, #0A7E8C, #086E7A)' }}>
            <Settings size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Settings</h1>
            <p className="text-sm text-gray-500">Manage your preferences and notifications</p>
          </div>
        </div>

        {/* Preferred City */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2">
            <MapPin size={15} className="text-secondary" />
            <h3 className="text-base font-semibold text-gray-900">Preferred City</h3>
          </div>
          <p className="text-sm text-gray-500">Choose your preferred city and you'll be notified the moment a builder lists a new project there.</p>
          {loadingCities ? (
            <div className="flex items-center gap-2 text-sm text-gray-400 py-2"><Loader2 size={14} className="animate-spin" /> Loading cities…</div>
          ) : (
            <>
              <div className="flex gap-3">
                <select value={preferredCity} onChange={(e) => { setPreferredCity(e.target.value); setSaved(false); }} className={inp}>
                  <option value="">— No preference —</option>
                  {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <button onClick={handleSave} disabled={saving || !preferredCity} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #0A7E8C, #086E7A)' }}>
                  {saving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : saved ? <><CheckCircle2 size={14} /> Saved!</> : <><Save size={14} /> Save</>}
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                <span className="text-xs text-gray-400 self-center">Quick pick:</span>
                {cities.map((c) => (
                  <button key={c} onClick={() => { setPreferredCity(c); setSaved(false); }}
                    className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-all ${preferredCity === c ? 'bg-secondary text-white border-secondary' : 'border-gray-200 text-gray-500 hover:border-secondary hover:text-secondary bg-white'}`}>
                    {c}
                  </button>
                ))}
              </div>
              {preferredCity && (
                <button onClick={handleClear} className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition-colors">
                  <X size={12} /> Clear preference
                </button>
              )}
            </>
          )}
        </div>

        {/* Email */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Mail size={15} className="text-secondary" />
            <h3 className="text-base font-semibold text-gray-900">Email Address</h3>
          </div>
          <p className="text-sm text-gray-500">Your email is used for important updates and project notifications.</p>
          <div className="flex gap-3">
            <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setEmailSaved(false); setEmailError(''); }} placeholder="you@example.com" className={inp} />
            <button onClick={handleEmailSave} disabled={emailSaving} className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #0A7E8C, #086E7A)' }}>
              {emailSaving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : emailSaved ? <><CheckCircle2 size={14} /> Saved!</> : <><Save size={14} /> Save</>}
            </button>
          </div>
          {emailError && <p className="text-xs text-red-500">{emailError}</p>}
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Bell size={15} className="text-secondary" />
            <h3 className="text-base font-semibold text-gray-900">Project Notifications</h3>
          </div>
          <div className={`flex items-start gap-3 p-4 rounded-xl border ${preferredCity ? 'bg-secondary/5 border-secondary/20' : 'bg-gray-50 border-gray-100'}`}>
            <Bell size={14} className={`mt-0.5 shrink-0 ${preferredCity ? 'text-secondary' : 'text-gray-400'}`} />
            <p className="text-sm text-gray-500">
              {preferredCity ? <>You'll receive a notification whenever a builder lists a new project in <strong className="text-gray-900">{preferredCity}</strong>.</> : 'Set a preferred city above to get instant notifications when new projects are listed there.'}
            </p>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CustomerSettings;