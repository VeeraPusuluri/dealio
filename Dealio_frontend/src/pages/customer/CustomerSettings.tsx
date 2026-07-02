import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { customerApi } from '@/lib/api';
import { useAuthStore, roleLabels, roleColors } from '@/stores/useAuthStore';
import { MapPin, Bell, Save, Mail, CheckCircle2, Loader2, X, Moon, Sun, Monitor } from 'lucide-react';
import { useThemeStore } from '@/stores/useThemeStore';
import ProfilePicUploader from '@/components/shared/ProfilePicUploader';
import SignOutCard from '@/components/shared/SignOutCard';
import AccountDeletionCard from '@/components/shared/AccountDeletionCard';
import LoggedInDevices from '@/components/shared/LoggedInDevices';

const PREF_KEY = 'dealio_customer_prefs';
const USER_KEY = 'dealio_user';
const FALLBACK_CITIES = ['Hyderabad', 'Bengaluru', 'Mumbai', 'Pune', 'Delhi NCR', 'Chennai'];

function getPrefs(): { preferredCity?: string } {
  try { return JSON.parse(localStorage.getItem(PREF_KEY) || '{}'); } catch { return {}; }
}

const TABS = [
  { id: 'preferences', label: 'Preferences', icon: MapPin },
  { id: 'account',     label: 'Account',     icon: Mail },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'devices',       label: 'Devices',       icon: Monitor },
];

const CustomerSettings = () => {
  const user = useAuthStore((s) => s.user);
  const { isDark, toggle: toggleTheme } = useThemeStore();

  const color = user ? roleColors[user.role] || '#0A7E8C' : '#0A7E8C';
  const initials = (user?.name || 'U').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  const [activeTab, setActiveTab] = useState('preferences');
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
                {preferredCity && (
                  <span className="text-[11px] text-muted-foreground flex items-center gap-1">
                    <MapPin size={10} />{preferredCity}
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs + Content — vertical rail on desktop, horizontal scroll strip on mobile */}
        <div className="flex flex-col md:flex-row gap-4">

          {/* Left nav */}
          <div className="flex md:flex-col gap-1 md:gap-0.5 md:w-40 md:flex-shrink-0 overflow-x-auto pb-1 md:pb-0 -mx-1 px-1 md:mx-0 md:px-0 scrollbar-hide">
            {TABS.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex-shrink-0 md:w-full flex items-center gap-2 md:gap-2.5 px-3 py-2 md:py-2.5 rounded-xl text-[13px] whitespace-nowrap transition-all text-left ${
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

            {/* ── Preferences ── */}
            {activeTab === 'preferences' && (
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
                  <MapPin size={14} style={{ color }} />
                  <h3 className="text-[13px] font-semibold text-card-foreground">Preferred City</h3>
                </div>

                <p className="text-[13px] text-muted-foreground">
                  Choose your preferred city and you'll be notified the moment a builder lists a new project there.
                </p>

                {loadingCities ? (
                  <div className="flex items-center gap-2 text-[13px] text-muted-foreground py-2">
                    <Loader2 size={13} className="animate-spin" />Loading cities…
                  </div>
                ) : (
                  <>
                    <div className="flex gap-2">
                      <select
                        value={preferredCity}
                        onChange={(e) => { setPreferredCity(e.target.value); setSaved(false); }}
                        className={`${inp} flex-1`}
                      >
                        <option value="">— No preference —</option>
                        {cities.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                      <button
                        onClick={handleSave}
                        disabled={saving || !preferredCity}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 shrink-0"
                        style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)` }}
                      >
                        {saving ? <><Loader2 size={13} className="animate-spin" />Saving…</>
                          : saved ? <><CheckCircle2 size={13} />Saved!</>
                          : <><Save size={13} />Save</>}
                      </button>
                    </div>

                    <div className="space-y-2">
                      <p className="text-[11px] text-muted-foreground">Quick pick:</p>
                      <div className="flex flex-wrap gap-2">
                        {cities.map((c) => (
                          <button
                            key={c}
                            onClick={() => { setPreferredCity(c); setSaved(false); }}
                            className={`text-[12px] px-3 py-1.5 rounded-full border font-medium transition-all ${
                              preferredCity === c
                                ? 'text-white border-transparent'
                                : 'border-border text-muted-foreground hover:text-card-foreground hover:border-ring bg-card'
                            }`}
                            style={preferredCity === c ? { backgroundColor: color, borderColor: color } : undefined}
                          >
                            {c}
                          </button>
                        ))}
                      </div>
                    </div>

                    {preferredCity && (
                      <button onClick={handleClear} className="flex items-center gap-1 text-[12px] text-muted-foreground hover:text-card-foreground transition-colors">
                        <X size={11} />Clear preference
                      </button>
                    )}
                  </>
                )}
              </div>
            )}

            {/* ── Account ── */}
            {activeTab === 'account' && (
              <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-border">
                  <Mail size={14} style={{ color }} />
                  <h3 className="text-[13px] font-semibold text-card-foreground">Email Address</h3>
                </div>

                <p className="text-[13px] text-muted-foreground">Your email is used for important updates and project notifications.</p>

                <div className="flex gap-2">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); setEmailSaved(false); setEmailError(''); }}
                    placeholder="you@example.com"
                    className={`${inp} flex-1`}
                  />
                  <button
                    onClick={handleEmailSave}
                    disabled={emailSaving}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-[13px] font-semibold text-white hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 shrink-0"
                    style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)` }}
                  >
                    {emailSaving ? <><Loader2 size={13} className="animate-spin" />Saving…</>
                      : emailSaved ? <><CheckCircle2 size={13} />Saved!</>
                      : <><Save size={13} />Save</>}
                  </button>
                </div>

                {emailError && <p className="text-[12px] text-destructive">{emailError}</p>}
              </div>
            )}

            {/* ── Notifications ── */}
            {activeTab === 'notifications' && (
              <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-border">
                  <Bell size={14} style={{ color }} />
                  <h3 className="text-[13px] font-semibold text-card-foreground">Project Notifications</h3>
                </div>

                <div className={`flex items-start gap-3 p-4 rounded-xl border ${
                  preferredCity
                    ? 'border-border/50 bg-muted/30'
                    : 'border-border bg-muted/20'
                }`}>
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5 ${
                    preferredCity ? 'bg-card border border-border' : 'bg-muted'
                  }`}>
                    <Bell size={14} style={preferredCity ? { color } : undefined} className={preferredCity ? '' : 'text-muted-foreground'} />
                  </div>
                  <div>
                    <p className="text-[13px] font-medium text-card-foreground">New Project Alerts</p>
                    <p className="text-[12px] text-muted-foreground mt-0.5">
                      {preferredCity
                        ? <>You'll be notified when a builder lists a new project in <strong className="text-card-foreground">{preferredCity}</strong>.</>
                        : 'Set a preferred city in Preferences to receive instant new-project alerts.'}
                    </p>
                    {!preferredCity && (
                      <button
                        onClick={() => setActiveTab('preferences')}
                        className="mt-2 text-[12px] font-medium hover:underline"
                        style={{ color }}
                      >
                        Set preferred city →
                      </button>
                    )}
                  </div>
                </div>

                {preferredCity && (
                  <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-muted/30 border border-border">
                    <div className="flex items-center gap-2">
                      <MapPin size={13} className="text-muted-foreground" />
                      <span className="text-[13px] text-card-foreground">Preferred city</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[12px] font-semibold" style={{ color }}>{preferredCity}</span>
                      <button onClick={handleClear} className="text-muted-foreground hover:text-destructive transition-colors">
                        <X size={13} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Devices ── */}
            {activeTab === 'devices' && <LoggedInDevices color={color} />}

          </div>
        </div>

        <AccountDeletionCard />
        <SignOutCard />
      </div>
    </DashboardLayout>
  );
};

export default CustomerSettings;