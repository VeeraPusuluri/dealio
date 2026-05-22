import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore, UserRole, roleLabels, roleColors, AuthApiResponse } from '@/stores/useAuthStore';
import {
  Building2, Users, User, Landmark, Shield, Globe,
  Loader2, Phone as PhoneIcon, ArrowRight, CheckCircle2, Sparkles, ChevronDown,
} from 'lucide-react';
import { DealioLogo } from '@/components/shared/DealioLogo';
import { toast } from '@/hooks/use-toast';
import { authApi } from '@/lib/api';
import { GoogleLogin, CredentialResponse as GoogleCredentialResponse } from '@react-oauth/google';

const COUNTRY_CODES = [
  { code: '+91', flag: '🇮🇳' },
  { code: '+1',  flag: '🇺🇸' },
  { code: '+44', flag: '🇬🇧' },
  { code: '+971',flag: '🇦🇪' },
  { code: '+65', flag: '🇸🇬' },
  { code: '+61', flag: '🇦🇺' },
];

const roleHome: Record<UserRole, string> = {
  builder: '/builder', cp: '/cp', customer: '/customer', bank: '/bank',
  admin: '/admin', nri: '/nri',
};

const roleIcons: Record<UserRole, React.ElementType> = {
  builder: Building2, cp: Users, customer: User, bank: Landmark,
  admin: Shield, nri: Globe,
};

const roleDescriptions: Record<UserRole, string> = {
  builder: 'Manage inventory, RERA & leads',
  cp: 'Track pipeline & commissions',
  customer: 'Monitor your property journey',
  bank: 'Process loan cases faster',
  admin: 'Platform administration',
  nri: 'Invest & manage remotely',
};

const signupRoles: UserRole[] = ['customer', 'cp', 'builder', 'bank', 'nri', 'admin'];

type Method = 'phone' | 'google';

const benefits = [
  { text: 'Free to join — no credit card needed',              color: '#0A7E8C' },
  { text: 'Role-based dashboard built for your workflow',       color: '#E87722' },
  { text: 'Connect with builders, CPs, banks & more',          color: '#16A34A' },
  { text: 'AI insights, analytics & real-time updates',         color: '#6B3FA0' },
];

const DOT_GRID = {
  backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)',
  backgroundSize: '28px 28px',
};

const inputBase = 'w-full px-4 py-3 rounded-xl border bg-white text-sm text-foreground placeholder:text-slate-400 outline-none transition-all';
const inputNormal = `${inputBase} border-slate-200 hover:border-slate-300 focus:border-[#0A7E8C] focus:ring-2 focus:ring-[#0A7E8C]/12`;
const inputError  = `${inputBase} border-red-400 bg-red-50/20 focus:border-red-400 focus:ring-2 focus:ring-red-400/12`;

const SignupPage = () => {
  const [method, setMethod] = useState<Method>('phone');
  const [signupRole, setSignupRole] = useState<UserRole>('customer');
  const [name, setName] = useState('');
  const [nameErr, setNameErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [phoneCC, setPhoneCC] = useState('+91');
  const [phone, setPhone] = useState('');
  const [phoneErr, setPhoneErr] = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtp, setPhoneOtp] = useState('');

  const navigate = useNavigate();
  const authedUser = useAuthStore((s) => s.user);
  const isAuthed = useAuthStore((s) => s.isAuthenticated);
  const setAuthFromResponse = useAuthStore((s) => s.setAuthFromResponse);

  useEffect(() => {
    if (isAuthed && authedUser) navigate(roleHome[authedUser.role], { replace: true });
  }, [isAuthed, authedUser, navigate]);

  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const nErr = !name.trim() ? 'Full name required' : '';
    const phErr = !phone.trim() ? 'Phone number required' : phone.replace(/\D/g, '').length < 7 ? 'Enter a valid number' : '';
    setNameErr(nErr); setPhoneErr(phErr);
    if (nErr || phErr) return;
    setBusy(true);
    try {
      const data = await authApi.signupSendOtp(phoneCC, phone.replace(/\D/g, ''), name.trim(), signupRole.toUpperCase()) as { demoCode?: string; maskedPhone?: string } | null;
      setPhoneOtpSent(true);
      if (data?.demoCode) toast({ title: 'Demo OTP', description: `Your code: ${data.demoCode}` });
      else toast({ title: 'OTP sent', description: `Code sent to ${data?.maskedPhone ?? `${phoneCC} ${phone}`}` });
    } catch (e: unknown) {
      toast({ title: 'Error', description: e instanceof Error ? e.message : 'Could not send code', variant: 'destructive' });
    } finally { setBusy(false); }
  };

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(phoneOtp)) return toast({ title: 'Enter 6-digit code', variant: 'destructive' });
    setBusy(true);
    try {
      const data = await authApi.signupVerifyOtp(phoneCC, phone.replace(/\D/g, ''), phoneOtp, name.trim(), signupRole.toUpperCase()) as AuthApiResponse;
      setAuthFromResponse(data, signupRole);
      toast({ title: 'Welcome to Dealio!' });
    } catch (e: unknown) {
      toast({ title: 'Verification failed', description: e instanceof Error ? e.message : 'Verification failed', variant: 'destructive' });
    } finally { setBusy(false); }
  };

  const handleGoogleSuccess = async (credentialResponse: GoogleCredentialResponse) => {
    if (!credentialResponse.credential) return;
    setBusy(true);
    try {
      const data = await authApi.googleAuth(credentialResponse.credential, signupRole) as AuthApiResponse;
      setAuthFromResponse(data, signupRole);
      toast({ title: 'Welcome to Dealio!' });
    } catch (e: unknown) {
      toast({ title: 'Google sign-up failed', description: e instanceof Error ? e.message : 'Google authentication failed', variant: 'destructive' });
    } finally { setBusy(false); }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── Left branding panel ── */}
      <div className="hidden lg:flex lg:w-[42%] xl:w-[40%] flex-col relative overflow-hidden"
        style={{ background: 'linear-gradient(150deg, #0C1F35 0%, #0F2A45 30%, #1B3A5C 62%, #0A7E8C 100%)' }}>

        <div className="absolute inset-0 pointer-events-none" style={DOT_GRID} />
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-[500px] h-[500px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(10,126,140,0.22) 0%, transparent 65%)' }} />
          <div className="absolute -bottom-20 -left-20 w-80 h-80 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(232,119,34,0.18) 0%, transparent 65%)' }} />
        </div>

        <div className="relative z-10 flex flex-col h-full p-10 xl:p-14">
          <DealioLogo size="md" variant="light" to="/home" />

          <div className="flex-1 flex flex-col justify-center mt-10">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/8 border border-white/15 text-white/75 text-xs font-semibold w-fit mb-6">
              <Sparkles size={11} style={{ color: '#F5A623' }} />
              Join 12,400+ stakeholders
            </div>

            <h2 className="text-3xl xl:text-[38px] font-black text-white leading-tight tracking-tight mb-3">
              Start your journey<br />
              <span style={{ background: 'linear-gradient(90deg,#FCD34D,#F59E0B,#E87722)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                on Dealio
              </span>
            </h2>
            <p className="text-white/60 text-sm xl:text-[15px] mb-10 leading-relaxed max-w-sm">
              Create your free account and get instant access to your role-specific dashboard.
            </p>

            <div className="space-y-3 mb-10">
              {benefits.map((b) => (
                <div key={b.text} className="flex items-start gap-3">
                  <div className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                    style={{ backgroundColor: b.color + '28' }}>
                    <CheckCircle2 size={11} style={{ color: b.color }} />
                  </div>
                  <span className="text-white/75 text-sm">{b.text}</span>
                </div>
              ))}
            </div>

            {/* Role preview */}
            <div>
              <p className="text-white/40 text-[11px] font-bold uppercase tracking-widest mb-3">Available roles</p>
              <div className="grid grid-cols-2 gap-2">
                {signupRoles.slice(0, 4).map((role) => {
                  const Icon = roleIcons[role];
                  return (
                    <div key={role} className="flex items-center gap-2.5 bg-white/7 border border-white/10 rounded-xl px-3 py-2.5 hover:bg-white/10 transition-colors">
                      <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ backgroundColor: roleColors[role] + '30' }}>
                        <Icon size={12} style={{ color: roleColors[role] }} />
                      </div>
                      <span className="text-white/65 text-xs font-medium">{roleLabels[role]}</span>
                    </div>
                  );
                })}
              </div>
              <p className="text-white/35 text-xs text-center pt-2.5">+ {signupRoles.length - 4} more roles</p>
            </div>
          </div>

          <p className="text-white/25 text-xs mt-8">© 2026 Dealio · Free forever for all roles</p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0 lg:overflow-y-auto bg-white">

        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <DealioLogo size="sm" to="/home" />
          <Link to="/login" className="text-sm font-semibold text-[#0A7E8C]">Sign in</Link>
        </div>

        <div className="flex-1 flex items-start lg:items-center justify-center px-5 sm:px-8 py-8 lg:py-12">
          <div className="w-full max-w-md">

            {/* Header */}
            <div className="mb-6">
              <h1 className="text-2xl sm:text-[28px] font-black text-[#0F2035] tracking-tight">Create your account</h1>
              <p className="text-slate-500 text-sm mt-1.5">
                Already have an account?{' '}
                <Link to="/login" className="font-semibold text-[#0A7E8C] hover:underline">Sign in</Link>
              </p>
            </div>

            {/* Role selector */}
            <div className="mb-6">
              <label className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3 block">I am a</label>
              <div className="grid grid-cols-4 gap-2">
                {signupRoles.map((role) => {
                  const Icon = roleIcons[role];
                  const active = signupRole === role;
                  return (
                    <button key={role} type="button" onClick={() => setSignupRole(role)}
                      className="relative flex flex-col items-center justify-center gap-1.5 py-3 px-1 rounded-xl text-[10px] font-bold border-2 transition-all"
                      style={active
                        ? { color: roleColors[role], backgroundColor: roleColors[role] + '10', borderColor: roleColors[role] }
                        : { borderColor: '#E2E8F0', backgroundColor: '#F8FAFC', color: '#64748B' }
                      }>
                      {active && (
                        <span className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: roleColors[role] }}>
                          <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
                            <path d="M1.5 4L3 5.5L6.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </span>
                      )}
                      <Icon size={18} />
                      <span className="truncate w-full text-center leading-tight">{roleLabels[role].split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
              <p className="text-xs mt-2 pl-0.5 font-medium transition-colors" style={{ color: roleColors[signupRole] }}>
                {roleDescriptions[signupRole]}
              </p>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-xs text-slate-400 font-medium">Continue with</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            {/* Auth method tabs */}
            <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-xl">
              <button type="button" onClick={() => { setMethod('phone'); setPhoneOtpSent(false); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  method === 'phone' ? 'bg-white text-[#0F2035] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                }`}>
                <PhoneIcon size={14} /> Phone OTP
              </button>
              <button type="button" onClick={() => setMethod('google')} disabled={busy}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-semibold transition-all ${
                  method === 'google' ? 'bg-white text-[#0F2035] shadow-sm' : 'text-slate-500 hover:text-slate-700'
                } disabled:opacity-50`}>
                <svg width="14" height="14" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18L12.048 13.56c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                  <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
                </svg>
                Google
              </button>
            </div>

            {/* Google sign-up */}
            {method === 'google' && (
              <div className="flex flex-col items-center gap-4 py-2">
                <p className="text-sm text-slate-500 text-center">
                  Continue with Google as <span className="font-semibold" style={{ color: roleColors[signupRole] }}>{roleLabels[signupRole]}</span>
                </p>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => toast({ title: 'Google sign-up failed', variant: 'destructive' })}
                  width={400}
                  theme="outline"
                  size="large"
                  shape="rectangular"
                  text="signup_with"
                />
              </div>
            )}

            {/* Phone — enter details */}
            {method === 'phone' && !phoneOtpSent && (
              <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Full name</label>
                  <input required placeholder="Your full name" value={name} autoComplete="name"
                    onChange={(e) => { setName(e.target.value); if (nameErr && e.target.value.trim()) setNameErr(''); }}
                    onBlur={() => setNameErr(name.trim() ? '' : 'Full name required')}
                    className={nameErr ? inputError : inputNormal} />
                  {nameErr && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><span>⚠</span>{nameErr}</p>}
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Phone number</label>
                  <div className="flex gap-2">
                    <div className="relative flex-shrink-0">
                      <select value={phoneCC} onChange={(e) => setPhoneCC(e.target.value)}
                        className="appearance-none h-full pl-3 pr-7 py-3 rounded-xl border border-slate-200 bg-white text-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0A7E8C]/12 focus:border-[#0A7E8C] transition-all cursor-pointer">
                        {COUNTRY_CODES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                      </select>
                      <ChevronDown size={11} className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                    <input type="tel" inputMode="numeric" required placeholder="98765 43210" value={phone}
                      onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); if (phoneErr) setPhoneErr(''); }}
                      onBlur={() => setPhoneErr(phone.trim() ? '' : 'Phone required')}
                      className={`flex-1 ${phoneErr ? inputError : inputNormal}`} />
                  </div>
                  {phoneErr && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><span>⚠</span>{phoneErr}</p>}
                </div>

                <button type="submit" disabled={busy}
                  className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-white transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 shadow-md shadow-[#0A7E8C]/25"
                  style={{ background: 'linear-gradient(135deg, #0C90A2 0%, #0A7E8C 55%, #087280 100%)' }}>
                  {busy ? <Loader2 className="animate-spin" size={16} /> : <PhoneIcon size={15} />}
                  Send verification code
                </button>

                <p className="text-[11px] text-slate-400 text-center leading-relaxed">
                  By signing up you agree to our{' '}
                  <a href="#" className="underline hover:text-slate-600">Terms</a> and{' '}
                  <a href="#" className="underline hover:text-slate-600">Privacy Policy</a>.
                </p>
              </form>
            )}

            {/* Phone — verify OTP */}
            {method === 'phone' && phoneOtpSent && (
              <form onSubmit={handleVerifyPhoneOtp} className="space-y-4">
                {/* Info box */}
                <div className="bg-[#0A7E8C]/6 border border-[#0A7E8C]/20 rounded-xl p-4">
                  <p className="text-xs font-semibold text-[#0A7E8C] mb-0.5">Code sent</p>
                  <p className="text-sm text-[#0F2035] font-medium">{phoneCC} {phone}</p>
                  <p className="text-xs text-slate-400 mt-1">Expires in 5 minutes · Signing up as <span className="font-semibold" style={{ color: roleColors[signupRole] }}>{roleLabels[signupRole]}</span></p>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-1.5 block">Enter 6-digit code</label>
                  <input inputMode="numeric" maxLength={6} required autoFocus placeholder="• • • • • •"
                    className="w-full px-4 py-4 rounded-xl border-2 border-slate-200 bg-white text-center text-3xl tracking-[0.6em] font-black text-[#0F2035] focus:border-[#0A7E8C] focus:ring-2 focus:ring-[#0A7E8C]/12 outline-none transition-all placeholder:text-slate-200 placeholder:tracking-[0.4em] placeholder:text-xl"
                    value={phoneOtp} onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} />

                  {/* Progress dots */}
                  <div className="flex justify-center gap-2 mt-3">
                    {[0,1,2,3,4,5].map((i) => (
                      <div key={i} className="w-2 h-2 rounded-full transition-all"
                        style={{ backgroundColor: i < phoneOtp.length ? roleColors[signupRole] : '#E2E8F0' }} />
                    ))}
                  </div>
                </div>

                <button type="submit" disabled={busy || phoneOtp.length !== 6}
                  className="w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-white transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 shadow-md shadow-[#0A7E8C]/25"
                  style={{ background: 'linear-gradient(135deg, #0C90A2 0%, #0A7E8C 55%, #087280 100%)' }}>
                  {busy ? <Loader2 className="animate-spin" size={16} /> : null}
                  Verify & enter Dealio <ArrowRight size={15} />
                </button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button type="button" onClick={() => { setPhoneOtpSent(false); setPhoneOtp(''); }}
                    className="text-slate-400 hover:text-[#0F2035] transition-colors">← Change number</button>
                  <button type="button" onClick={(e) => handleSendPhoneOtp(e as React.FormEvent)} disabled={busy}
                    className="font-semibold text-[#0A7E8C] hover:underline disabled:opacity-50">Resend code</button>
                </div>
              </form>
            )}
          </div>
        </div>

        <div className="lg:hidden text-center pb-6 text-xs text-slate-400">
          © 2026 Dealio ·{' '}
          <Link to="/home" className="hover:text-slate-600">Back to home</Link>
        </div>
      </div>
    </div>
  );
};

export default SignupPage;