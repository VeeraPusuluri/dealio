import { useEffect, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore, UserRole, roleLabels, roleColors, demoCredentials, AuthApiResponse } from '@/stores/useAuthStore';
import {
  Building2, Users, User, Landmark, Shield, Globe,
  Loader2, Phone as PhoneIcon, Sparkles, ArrowRight,
} from 'lucide-react';
import { DealioLogo } from '@/components/shared/DealioLogo';
import { toast } from '@/hooks/use-toast';
import { authApi } from '@/lib/api';
import { GoogleLogin, CredentialResponse as GoogleCredentialResponse } from '@react-oauth/google';

const COUNTRY_CODES = [
  { code: '+91', flag: '🇮🇳' }, { code: '+1', flag: '🇺🇸' }, { code: '+44', flag: '🇬🇧' },
  { code: '+971', flag: '🇦🇪' }, { code: '+65', flag: '🇸🇬' }, { code: '+61', flag: '🇦🇺' },
];

const roleIcons: Record<UserRole, React.ElementType> = {
  builder: Building2, cp: Users, customer: User, bank: Landmark,
  admin: Shield, nri: Globe,
};

const roleHome: Record<UserRole, string> = {
  builder: '/builder', cp: '/cp', customer: '/customer', bank: '/bank',
  admin: '/admin', nri: '/nri',
};

type Mode   = 'signin' | 'signup';
type Method = 'phone' | 'google';

const signupRoles: UserRole[] = ['customer', 'cp', 'builder', 'bank', 'nri', 'admin'];

const LoginPage = () => {
  const [params] = useSearchParams();
  const initialMode: Mode = params.get('tab') === 'signup' || params.get('ref') ? 'signup' : 'signin';
  const [mode, setMode]     = useState<Mode>(initialMode);
  const [method, setMethod] = useState<Method>('phone');
  const [signupRole, setSignupRole] = useState<UserRole>('customer');

  const referralCode = params.get('ref') ?? localStorage.getItem('dealio_referral_code') ?? '';

  // Persist referral code so it survives navigation (e.g. email → app)
  useEffect(() => {
    const ref = params.get('ref');
    if (ref) localStorage.setItem('dealio_referral_code', ref);
  }, [params]);

  const [name, setName]           = useState('');
  const [busy, setBusy]           = useState(false);
  const [nameErr, setNameErr]     = useState('');
  const [phoneCC, setPhoneCC]     = useState('+91');
  const [phone, setPhone]         = useState('');
  const [phoneErr, setPhoneErr]   = useState('');
  const [phoneOtpSent, setPhoneOtpSent] = useState(false);
  const [phoneOtp, setPhoneOtp]   = useState('');

  const { loginAsRole, setAuthFromResponse } = useAuthStore();
  const navigate    = useNavigate();
  const authedUser  = useAuthStore((s) => s.user);
  const isAuthed    = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthed && authedUser) {
      navigate(roleHome[authedUser.role], { replace: true });
    }
  }, [isAuthed, authedUser, navigate]);

  const handleSendPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    const nErr  = mode === 'signup' && !name.trim() ? 'Full name required' : '';
    const phErr = !phone.trim() ? 'Phone number required' : phone.replace(/\D/g, '').length < 10 ? 'Enter a valid 10-digit phone' : '';
    setNameErr(nErr); setPhoneErr(phErr);
    if (nErr || phErr) return;
    setBusy(true);
    try {
      let data: { demoCode?: string; maskedPhone?: string } | null;
      if (mode === 'signup') {
        data = await authApi.signupSendOtp(phoneCC, phone.replace(/\D/g, ''), name.trim(), signupRole) as typeof data;
      } else {
        data = await authApi.loginSendOtp(phoneCC, phone.replace(/\D/g, '')) as typeof data;
      }
      setPhoneOtpSent(true);
      if (data?.demoCode) toast({ title: 'Demo OTP', description: `Your code: ${data.demoCode}` });
      else toast({ title: 'OTP sent', description: `Code sent to ${data?.maskedPhone ?? phone}` });
    } catch (err: unknown) {
      toast({ title: 'Could not send code', description: err instanceof Error ? err.message : 'Could not send code', variant: 'destructive' });
    } finally { setBusy(false); }
  };

  const handleVerifyPhoneOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!/^\d{6}$/.test(phoneOtp)) return toast({ title: 'Enter 6-digit code', variant: 'destructive' });
    setBusy(true);
    try {
      let data: AuthApiResponse;
      if (mode === 'signup') {
        data = await authApi.signupVerifyOtp(phoneCC, phone.replace(/\D/g, ''), phoneOtp, name.trim(), signupRole.toUpperCase(), referralCode || undefined) as AuthApiResponse;
        setAuthFromResponse(data, signupRole);
        if (referralCode) localStorage.removeItem('dealio_referral_code');
      } else {
        data = await authApi.loginVerifyOtp(phoneCC, phone.replace(/\D/g, ''), phoneOtp) as AuthApiResponse;
        setAuthFromResponse(data);
      }
      toast({ title: mode === 'signup' ? 'Welcome to Dealio!' : 'Welcome back!' });
    } catch (err: unknown) {
      toast({ title: 'Verification failed', description: err instanceof Error ? err.message : 'Verification failed', variant: 'destructive' });
    } finally { setBusy(false); }
  };

  const handleGoogleSuccess = async (credentialResponse: GoogleCredentialResponse) => {
    if (!credentialResponse.credential) return;
    setBusy(true);
    try {
      const data = await authApi.googleAuth(credentialResponse.credential, mode === 'signup' ? signupRole : undefined, mode === 'signup' ? (referralCode || undefined) : undefined) as AuthApiResponse;
      setAuthFromResponse(data, mode === 'signup' ? signupRole : undefined);
      if (mode === 'signup' && referralCode) localStorage.removeItem('dealio_referral_code');
      toast({ title: mode === 'signup' ? 'Welcome to Dealio!' : 'Welcome back!' });
    } catch (err: unknown) {
      toast({ title: 'Google sign-in failed', description: err instanceof Error ? err.message : 'Google authentication failed', variant: 'destructive' });
    } finally { setBusy(false); }
  };

  const inputCls = (err: string) =>
    `w-full px-4 py-3 rounded-xl border bg-white text-sm text-foreground placeholder:text-slate-400 outline-none transition-all focus:ring-2 ${
      err
        ? 'border-red-400 bg-red-50/20 focus:border-red-400 focus:ring-red-400/12'
        : 'border-slate-200 hover:border-slate-300 focus:border-[#0A7E8C] focus:ring-[#0A7E8C]/12'
    }`;
  const submitBtnCls   = 'w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-white transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0 shadow-lg shadow-[#0A7E8C]/20';
  const submitBtnStyle = { background: 'linear-gradient(135deg, #0C90A2 0%, #0A7E8C 55%, #087280 100%)' };

  const switchMode = (next: Mode) => {
    setMode(next);
    setMethod('phone');
    setPhoneOtpSent(false);
    setPhoneOtp('');
  };

  const handleDemoSkip = async () => {
    try {
      setBusy(true);
      const demoName = demoCredentials[signupRole]?.name || signupRole;
      await authApi.signupSendOtp('+91', '1234567890', demoName, signupRole.toUpperCase());
      const response = await authApi.signupVerifyOtp('+91', '1234567890', '123456', demoName, signupRole.toUpperCase()) as AuthApiResponse;
      setAuthFromResponse(response, signupRole);
      toast({ title: 'Welcome to Dealio (Demo)!' });
    } catch (e: unknown) {
      toast({ title: 'Demo login failed', description: e instanceof Error ? e.message : 'Demo login failed', variant: 'destructive' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── Left branding panel — dark architectural ── */}
      <div className="hidden lg:flex lg:w-[44%] xl:w-[42%] flex-col relative overflow-hidden"
        style={{ background: 'linear-gradient(145deg, #020810 0%, #061528 45%, #0C1F3C 75%, #0A2440 100%)' }}>

        {/* Architectural crosshatch grid */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: [
            'linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '44px 44px',
        }} />

        {/* Ambient glows */}
        <div className="absolute -top-48 -right-24 w-[480px] h-[480px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(10,126,140,0.22) 0%, transparent 60%)' }} />
        <div className="absolute bottom-0 -left-16 w-[320px] h-[320px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(232,119,34,0.16) 0%, transparent 65%)' }} />

        {/* Building silhouette — low opacity architectural art */}
        <div className="absolute bottom-0 right-0 w-[78%] max-w-[300px] pointer-events-none" style={{ opacity: 0.055 }}>
          <svg viewBox="0 0 300 320" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Center tower */}
            <rect x="105" y="25" width="90" height="295" stroke="white" strokeWidth="1"/>
            {[45,65,85,105,125,145,165,185,205,225,245,270,290].map(y => (
              <line key={y} x1="105" y1={y} x2="195" y2={y} stroke="white" strokeWidth="0.55"/>
            ))}
            {[127,150,173].map(x => (
              <line key={x} x1={x} y1="25" x2={x} y2="320" stroke="white" strokeWidth="0.55"/>
            ))}
            {/* Left tower */}
            <rect x="20" y="95" width="68" height="225" stroke="white" strokeWidth="1"/>
            {[115,135,155,175,195,215,235,255,275,295].map(y => (
              <line key={`l${y}`} x1="20" y1={y} x2="88" y2={y} stroke="white" strokeWidth="0.55"/>
            ))}
            <line x1="54" y1="95" x2="54" y2="320" stroke="white" strokeWidth="0.55"/>
            {/* Right tower */}
            <rect x="210" y="115" width="62" height="205" stroke="white" strokeWidth="1"/>
            {[135,155,175,195,215,235,255,275,295].map(y => (
              <line key={`r${y}`} x1="210" y1={y} x2="272" y2={y} stroke="white" strokeWidth="0.55"/>
            ))}
            <line x1="241" y1="115" x2="241" y2="320" stroke="white" strokeWidth="0.55"/>
            {/* Crane on center tower */}
            <line x1="150" y1="25" x2="150" y2="0" stroke="white" strokeWidth="0.9"/>
            <line x1="105" y1="7" x2="210" y2="7" stroke="white" strokeWidth="0.9"/>
            <line x1="210" y1="7" x2="210" y2="25" stroke="white" strokeWidth="0.5" strokeDasharray="3,3"/>
            {/* Ground teal accent */}
            <line x1="0" y1="319" x2="300" y2="319" stroke="rgba(10,126,140,0.9)" strokeWidth="1.5"/>
          </svg>
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full p-12 xl:p-16">
          <DealioLogo size="md" variant="light" to="/home" />

          <div className="flex-1 flex flex-col justify-center mt-10">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/6 border border-white/10 text-white/55 text-xs font-semibold w-fit mb-8">
              <Sparkles size={10} style={{ color: '#F5A623' }} />
              {mode === 'signup' ? 'Free forever · All roles' : 'Trusted by 12,400+ stakeholders'}
            </div>

            {/* Headline */}
            <h2 className="font-black text-white leading-[0.98] tracking-tight mb-5"
              style={{ fontSize: 'clamp(38px, 4.5vw, 56px)' }}>
              {mode === 'signin' ? (
                <>Welcome<br/>back to</>
              ) : (
                <>Join the<br/>platform</>
              )}
              <br/>
              <span style={{
                background: 'linear-gradient(90deg, #FCD34D 0%, #F59E0B 45%, #E87722 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                {mode === 'signin' ? 'Dealio.' : 'for free.'}
              </span>
            </h2>

            <p className="text-white/42 text-[14px] leading-relaxed mb-10 max-w-[280px]">
              {mode === 'signin'
                ? 'Your role-specific dashboard is ready — every stakeholder, every deal, one platform.'
                : 'For builders, partners, buyers and banks. All connected. All in sync. No credit card needed.'}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-3 mb-10">
              {[
                { v: '12,400+', l: 'Active Units' },
                { v: '₹2,800Cr', l: 'GMV Tracked' },
                { v: '850+', l: 'Partners' },
              ].map(s => (
                <div key={s.l} className="border border-white/8 rounded-2xl p-3.5 hover:border-white/14 hover:bg-white/3 transition-colors">
                  <div className="text-lg xl:text-xl font-black text-white">{s.v}</div>
                  <div className="text-[10px] text-white/35 mt-0.5 font-medium leading-tight">{s.l}</div>
                </div>
              ))}
            </div>

            {/* Role pills */}
            <div>
              <p className="text-white/22 text-[10px] font-black uppercase tracking-[0.14em] mb-3">Available roles</p>
              <div className="flex flex-wrap gap-2">
                {signupRoles.map(role => {
                  const Icon = roleIcons[role];
                  return (
                    <div key={role} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/4 border border-white/8 hover:bg-white/7 transition-colors">
                      <Icon size={10} style={{ color: roleColors[role] }} />
                      <span className="text-white/45 text-[11px] font-medium">{roleLabels[role].split(' ')[0]}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <p className="text-white/18 text-xs">© 2026 Dealio · Free forever for all roles</p>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0 lg:overflow-y-auto bg-white">

        {/* Accent stripe */}
        <div className="h-[3px] w-full flex-shrink-0"
          style={{ background: 'linear-gradient(90deg, #0A7E8C 0%, #0DAABF 45%, #E87722 100%)' }} />

        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <DealioLogo size="sm" to="/home" />
          {mode === 'signin'
            ? <button onClick={() => switchMode('signup')} className="text-sm font-bold text-[#0A7E8C]">Sign up</button>
            : <button onClick={() => switchMode('signin')} className="text-sm font-bold text-[#0A7E8C]">Sign in</button>
          }
        </div>

        <div className="flex-1 flex items-start lg:items-center justify-center px-6 sm:px-10 py-10 lg:py-14">
          <div className="w-full max-w-[420px]">

            {/* Header */}
            <div className="mb-8">
              <h1 className="font-black text-[#060E1A] tracking-tight leading-[1.1]"
                style={{ fontSize: 'clamp(26px, 3.5vw, 32px)' }}>
                {mode === 'signin' ? (
                  <>Sign in to<br/>your dashboard</>
                ) : (
                  <>Create your<br/>free account</>
                )}
              </h1>
              <p className="text-slate-400 text-[13px] mt-2.5">
                {mode === 'signin' ? (
                  <>New to Dealio?{' '}
                    <button onClick={() => switchMode('signup')} className="font-bold text-[#0A7E8C] hover:underline">Create free account</button>
                  </>
                ) : (
                  <>Already on Dealio?{' '}
                    <button onClick={() => switchMode('signin')} className="font-bold text-[#0A7E8C] hover:underline">Sign in</button>
                  </>
                )}
              </p>
            </div>

            {/* Role selector — 3-col grid */}
            <div className="mb-7">
              <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.14em] mb-3 block">I am a</label>
              <div className="grid grid-cols-3 gap-2.5">
                {signupRoles.map(role => {
                  const Icon = roleIcons[role];
                  const active = signupRole === role;
                  return (
                    <button type="button" key={role} onClick={() => setSignupRole(role)}
                      className="relative flex flex-col items-center gap-2 py-4 px-2 rounded-2xl border-2 transition-all duration-150 hover:-translate-y-0.5"
                      style={active
                        ? { borderColor: roleColors[role], backgroundColor: roleColors[role] + '0E', color: roleColors[role] }
                        : { borderColor: '#EFF2F6', backgroundColor: '#FAFBFC', color: '#94A3B8' }}>
                      {active && (
                        <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 rounded-full flex items-center justify-center"
                          style={{ backgroundColor: roleColors[role] }}>
                          <svg width="7" height="7" viewBox="0 0 8 8" fill="none">
                            <path d="M1.5 4L3 5.5L6.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                          </svg>
                        </span>
                      )}
                      <div className="w-9 h-9 rounded-xl flex items-center justify-center transition-colors"
                        style={{ backgroundColor: active ? roleColors[role] + '1C' : '#F1F5F9' }}>
                        <Icon size={18} />
                      </div>
                      <span className="text-[10px] font-bold leading-tight text-center w-full px-0.5">{roleLabels[role].split(' ')[0]}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Divider */}
            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-slate-100" />
              <span className="text-[10px] text-slate-300 font-bold uppercase tracking-[0.12em]">Continue with</span>
              <div className="flex-1 h-px bg-slate-100" />
            </div>

            {/* Method tabs — underline style */}
            <div className="flex mb-6 border-b border-slate-100">
              <button type="button" onClick={() => setMethod('google')} disabled={busy}
                className={`flex-1 flex items-center justify-center gap-2 pb-3 text-[13px] font-bold border-b-2 -mb-px transition-all disabled:opacity-50 ${
                  method === 'google'
                    ? 'border-[#0A7E8C] text-[#0A7E8C]'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}>
                <svg width="14" height="14" viewBox="0 0 18 18">
                  <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
                  <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18L12.048 13.56c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
                  <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
                  <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
                </svg>
                Google
              </button>
              <button type="button" onClick={() => { setMethod('phone'); setPhoneOtpSent(false); }}
                className={`flex-1 flex items-center justify-center gap-2 pb-3 text-[13px] font-bold border-b-2 -mb-px transition-all ${
                  method === 'phone'
                    ? 'border-[#0A7E8C] text-[#0A7E8C]'
                    : 'border-transparent text-slate-400 hover:text-slate-600'
                }`}>
                <PhoneIcon size={13} /> Phone OTP
              </button>
            </div>

            {/* Demo skip */}
            <button type="button" disabled={busy} onClick={handleDemoSkip}
              className="w-full mb-6 py-2.5 rounded-xl text-xs font-semibold text-slate-400 hover:text-[#0F2035] border border-dashed border-slate-150 hover:border-slate-200 hover:bg-slate-50/60 transition-all">
              ⚡ Skip → Continue as demo {roleLabels[signupRole]}
            </button>

            {/* Google sign-in/up */}
            {method === 'google' && (
              <div className="flex flex-col items-center gap-4 py-2">
                <p className="text-[13px] text-slate-400 text-center">
                  {mode === 'signup'
                    ? <>Continue with Google as <span className="font-bold" style={{ color: roleColors[signupRole] }}>{roleLabels[signupRole]}</span></>
                    : 'Sign in with your Google account'}
                </p>
                <GoogleLogin
                  onSuccess={handleGoogleSuccess}
                  onError={() => toast({ title: 'Google sign-in failed', variant: 'destructive' })}
                  width={400} theme="outline" size="large" shape="rectangular"
                  text={mode === 'signup' ? 'signup_with' : 'signin_with'}
                />
              </div>
            )}

            {/* PHONE — enter details */}
            {method === 'phone' && !phoneOtpSent && (
              <form onSubmit={handleSendPhoneOtp} className="space-y-5">
                {mode === 'signup' && (
                  <div>
                    <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.12em] mb-2 block">Full name</label>
                    <input required value={name}
                      onChange={(e) => { setName(e.target.value); if (nameErr && e.target.value.trim()) setNameErr(''); }}
                      onBlur={() => setNameErr(name.trim() ? '' : 'Full name required')}
                      className={inputCls(nameErr)} />
                    {nameErr && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><span>⚠</span>{nameErr}</p>}
                  </div>
                )}
                <div>
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.12em] mb-2 block">Phone number</label>
                  <div className="flex gap-2">
                    <select value={phoneCC} onChange={(e) => setPhoneCC(e.target.value)}
                      className="px-3 py-3 rounded-xl border border-slate-200 bg-white text-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0A7E8C]/12 focus:border-[#0A7E8C] transition-all cursor-pointer">
                      {COUNTRY_CODES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.code}</option>)}
                    </select>
                    <input type="tel" inputMode="numeric" required placeholder="98765 43210" value={phone} maxLength={10}
                      onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); if (phoneErr) setPhoneErr(''); }}
                      onBlur={() => setPhoneErr(phone.trim() ? '' : 'Phone required')}
                      className={`flex-1 min-w-0 ${inputCls(phoneErr)}`} />
                  </div>
                  {phoneErr && <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1"><span>⚠</span>{phoneErr}</p>}
                </div>
                <button type="submit" disabled={busy} className={submitBtnCls} style={submitBtnStyle}>
                  {busy ? <Loader2 className="animate-spin" size={16} /> : <PhoneIcon size={15} />}
                  Send verification code
                </button>
              </form>
            )}

            {/* PHONE — verify OTP */}
            {method === 'phone' && phoneOtpSent && (
              <form onSubmit={handleVerifyPhoneOtp} className="space-y-5">
                <div className="bg-[#0A7E8C]/5 border border-[#0A7E8C]/18 rounded-2xl p-4">
                  <p className="text-[10px] font-black text-[#0A7E8C] mb-0.5 uppercase tracking-widest">Code sent</p>
                  <p className="text-sm text-[#060E1A] font-semibold">{phoneCC} {phone}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Expires in 5 minutes</p>
                </div>
                <div>
                  <label className="text-[10px] font-black text-slate-300 uppercase tracking-[0.12em] mb-2 block">Enter 6-digit code</label>
                  <input inputMode="numeric" maxLength={6} required autoFocus placeholder="• • • • • •"
                    className="w-full px-4 py-4 rounded-xl border-2 border-slate-200 bg-white text-center text-3xl tracking-[0.6em] font-black text-[#060E1A] focus:border-[#0A7E8C] focus:ring-2 focus:ring-[#0A7E8C]/12 outline-none transition-all placeholder:text-slate-200 placeholder:tracking-[0.4em] placeholder:text-xl"
                    value={phoneOtp} onChange={(e) => setPhoneOtp(e.target.value.replace(/\D/g, '').slice(0, 6))} />
                  <div className="flex justify-center gap-2 mt-3">
                    {[0,1,2,3,4,5].map((i) => (
                      <div key={i} className="w-2 h-2 rounded-full transition-all"
                        style={{ backgroundColor: i < phoneOtp.length ? roleColors[signupRole] : '#E2E8F0' }} />
                    ))}
                  </div>
                </div>
                <button type="submit" disabled={busy || phoneOtp.length !== 6} className={submitBtnCls} style={submitBtnStyle}>
                  {busy && <Loader2 className="animate-spin" size={16} />}
                  Verify & continue <ArrowRight size={15} />
                </button>
                <div className="flex items-center justify-between text-xs pt-1">
                  <button type="button" onClick={() => { setPhoneOtpSent(false); setPhoneOtp(''); }}
                    className="text-slate-400 hover:text-[#060E1A] transition-colors">← Change number</button>
                  <button type="button" onClick={(e) => handleSendPhoneOtp(e as React.FormEvent)} disabled={busy}
                    className="font-bold text-[#0A7E8C] hover:underline disabled:opacity-50">Resend code</button>
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

export default LoginPage;