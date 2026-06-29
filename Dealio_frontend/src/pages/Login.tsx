import { useEffect, useState, useRef } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore, UserRole, roleLabels, roleColors, demoCredentials, AuthApiResponse } from '@/stores/useAuthStore';
import {
  Building2, Users, User, Landmark, Shield, Globe,
  Loader2, Phone as PhoneIcon, Sparkles, ArrowRight, Zap, CheckCircle2,
} from 'lucide-react';
import { DealioLogo } from '@/components/shared/DealioLogo';
import { toast } from '@/hooks/use-toast';
import { authApi } from '@/lib/api';
import { GoogleLogin, CredentialResponse as GoogleCredentialResponse } from '@react-oauth/google';

// ─── Constants ────────────────────────────────────────────────────────────────
const COUNTRY_CODES = [
  { code: '+91', flag: '🇮🇳' }, { code: '+1', flag: '🇺🇸' }, { code: '+44', flag: '🇬🇧' },
  { code: '+971', flag: '🇦🇪' }, { code: '+65', flag: '🇸🇬' }, { code: '+61', flag: '🇦🇺' },
];

const roleIcons: Record<UserRole, React.ElementType> = {
  builder: Building2, cp: Users, customer: User, bank: Landmark, admin: Shield, nri: Globe,
};

const roleHome: Record<UserRole, string> = {
  builder: '/builder', cp: '/cp', customer: '/customer', bank: '/bank', admin: '/admin', nri: '/nri',
};

const signinRoles: UserRole[] = ['customer', 'cp', 'builder', 'bank', 'nri', 'admin'];
const signupRoles: UserRole[] = ['customer', 'cp', 'builder', 'bank', 'nri'];

const RESEND_COOLDOWN = 30; // seconds before OTP can be requested again

type Mode   = 'signin' | 'signup';
type Method = 'phone' | 'google';

// ─── Helpers ──────────────────────────────────────────────────────────────────
const winOp = (b: number, c: number, r: number) => ((b * 13 + c * 7 + r * 3) % 5) !== 0 ? 0.7 : 0.08;

const STARS: Array<[number, number, number]> = [
  [25,22,0.7],[55,38,0.5],[95,14,0.85],[138,32,0.4],[185,18,0.7],
  [242,9,0.6],[305,28,0.8],[348,13,0.5],[392,38,0.75],[442,19,0.9],
  [466,32,0.4],[33,52,0.35],[78,68,0.55],[318,58,0.5],[458,52,0.65],
];

// ─── City SVG ─────────────────────────────────────────────────────────────────
const CityScene = () => (
  <svg viewBox="0 0 480 360" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
    {STARS.map(([cx, cy, op], i) => (
      <circle key={`s${i}`} cx={cx} cy={cy} r="1.3" fill="white" opacity={op} />
    ))}
    {/* Crescent moon */}
    <circle cx="415" cy="52" r="19" fill="rgba(255,235,180,0.11)" />
    <circle cx="423" cy="48" r="15.5" fill="#0A1628" />
    {/* Crown glow on center building */}
    <ellipse cx="200" cy="72" rx="65" ry="28" fill="rgba(10,126,140,0.18)" />
    {/* Building 1 — far left */}
    <rect x="0" y="240" width="52" height="120" fill="#0D2040" />
    <rect x="0" y="240" width="52" height="3" fill="rgba(255,255,255,0.05)" />
    {[0,1,2].flatMap(c => [0,1,2,3].map(r => (
      <rect key={`b1${c}${r}`} x={7+c*16} y={248+r*23} width="10" height="14" rx="1" fill="#FCD34D" opacity={winOp(1,c,r)} />
    )))}
    {/* Building 2 — left-center */}
    <rect x="62" y="190" width="68" height="170" fill="#0B1D38" />
    <rect x="62" y="190" width="68" height="3" fill="rgba(255,255,255,0.05)" />
    {[0,1,2,3].flatMap(c => [0,1,2,3,4,5].map(r => (
      <rect key={`b2${c}${r}`} x={69+c*15} y={198+r*25} width="9" height="16" rx="1" fill="#FCD34D" opacity={winOp(2,c,r)} />
    )))}
    {/* Building 3 — CENTER TALLEST */}
    <rect x="152" y="65" width="96" height="295" fill="#091830" />
    <rect x="152" y="62" width="96" height="5" fill="#0A7E8C" opacity="0.9" />
    <ellipse cx="200" cy="65" rx="50" ry="18" fill="rgba(10,126,140,0.3)" />
    <line x1="200" y1="61" x2="200" y2="31" stroke="#0DAABF" strokeWidth="1.8" strokeLinecap="round" opacity="0.85" />
    <circle cx="200" cy="29" r="3" fill="#1CD8EE" opacity="0.95" />
    <circle cx="200" cy="29" r="5.5" fill="rgba(28,216,238,0.2)" />
    {[0,1,2,3,4].flatMap(c => [0,1,2,3,4,5,6,7,8,9].map(r => (
      <rect key={`b3${c}${r}`} x={159+c*17} y={72+r*25} width="11" height="16" rx="1" fill="#FCD34D" opacity={winOp(3,c,r)} />
    )))}
    {/* Building 4 — right-center */}
    <rect x="264" y="155" width="72" height="205" fill="#0C1E3A" />
    <rect x="264" y="155" width="72" height="3" fill="rgba(255,255,255,0.05)" />
    {[0,1,2,3].flatMap(c => [0,1,2,3,4,5,6].map(r => (
      <rect key={`b4${c}${r}`} x={271+c*16} y={163+r*26} width="10" height="17" rx="1" fill="#FCD34D" opacity={winOp(4,c,r)} />
    )))}
    {/* Building 5 — right */}
    <rect x="352" y="210" width="58" height="150" fill="#0D2040" />
    <rect x="352" y="210" width="58" height="3" fill="rgba(255,255,255,0.05)" />
    {[0,1,2].flatMap(c => [0,1,2,3,4].map(r => (
      <rect key={`b5${c}${r}`} x={359+c*17} y={218+r*26} width="11" height="17" rx="1" fill="#FCD34D" opacity={winOp(5,c,r)} />
    )))}
    {/* Building 6 — far right */}
    <rect x="426" y="225" width="54" height="135" fill="#0B1B35" />
    <rect x="426" y="225" width="54" height="3" fill="rgba(255,255,255,0.05)" />
    {[0,1,2].flatMap(c => [0,1,2,3].map(r => (
      <rect key={`b6${c}${r}`} x={433+c*16} y={233+r*27} width="10" height="18" rx="1" fill="#FCD34D" opacity={winOp(6,c,r)} />
    )))}
    {/* Ground */}
    <line x1="0" y1="358" x2="480" y2="358" stroke="#0A7E8C" strokeWidth="2" opacity="0.65" />
    <ellipse cx="240" cy="358" rx="220" ry="10" fill="rgba(10,126,140,0.08)" />
  </svg>
);

// ─── Google icon ──────────────────────────────────────────────────────────────
const GIcon = () => (
  <svg width="14" height="14" viewBox="0 0 18 18">
    <path fill="#4285F4" d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844a4.14 4.14 0 0 1-1.796 2.716v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z"/>
    <path fill="#34A853" d="M9 18c2.43 0 4.467-.806 5.956-2.18L12.048 13.56c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z"/>
    <path fill="#FBBC05" d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z"/>
    <path fill="#EA4335" d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z"/>
  </svg>
);

// ─── Component ────────────────────────────────────────────────────────────────
const LoginPage = () => {
  const [params] = useSearchParams();
  const initialMode: Mode = params.get('tab') === 'signup' || params.get('ref') ? 'signup' : 'signin';
  const [mode, setMode]     = useState<Mode>(initialMode);
  const [method, setMethod] = useState<Method>('phone');
  const [signupRole, setSignupRole] = useState<UserRole>('customer');

  const referralCode = params.get('ref') ?? localStorage.getItem('dealio_referral_code') ?? '';

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
  const [otpDigits, setOtpDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [resendIn, setResendIn]   = useState(0);
  const otpRefs = useRef<(HTMLInputElement | null)[]>([]);

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { loginAsRole, setAuthFromResponse } = useAuthStore();
  const navigate   = useNavigate();
  const authedUser = useAuthStore((s) => s.user);
  const isAuthed   = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (isAuthed && authedUser && mode === 'signin') {
      navigate(roleHome[authedUser.role], { replace: true });
    }
  }, [isAuthed, authedUser, navigate, mode]);

  useEffect(() => {
    if (phoneOtpSent) {
      const t = setTimeout(() => otpRefs.current[0]?.focus(), 80);
      return () => clearTimeout(t);
    }
  }, [phoneOtpSent]);

  // Resend cooldown countdown
  useEffect(() => {
    if (resendIn <= 0) return;
    const t = setTimeout(() => setResendIn((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [resendIn]);

  // ── OTP box handlers ──
  const handleOtpDigitChange = (index: number, value: string) => {
    const digit = value.replace(/\D/g, '').slice(-1);
    const next = [...otpDigits];
    next[index] = digit;
    setOtpDigits(next);
    setPhoneOtp(next.join(''));
    if (digit && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      if (!otpDigits[index] && index > 0) {
        const next = [...otpDigits];
        next[index - 1] = '';
        setOtpDigits(next);
        setPhoneOtp(next.join(''));
        otpRefs.current[index - 1]?.focus();
      }
    }
    if (e.key === 'ArrowLeft'  && index > 0) otpRefs.current[index - 1]?.focus();
    if (e.key === 'ArrowRight' && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpPaste = (e: React.ClipboardEvent<HTMLInputElement>) => {
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasted) {
      const digits = [...pasted.split(''), ...Array(6).fill('')].slice(0, 6);
      setOtpDigits(digits);
      setPhoneOtp(digits.join(''));
      otpRefs.current[Math.min(pasted.length, 5)]?.focus();
    }
    e.preventDefault();
  };

  // ── Existing handlers (logic unchanged) ──
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
      setOtpDigits(['', '', '', '', '', '']);
      setPhoneOtpSent(true);
      setResendIn(RESEND_COOLDOWN);
      if (data?.demoCode) toast({ title: 'Demo OTP', description: `Your code: ${data.demoCode}` });
      else toast({ title: 'OTP sent', description: `Code sent to ${data?.maskedPhone ?? phone}` });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Could not send code';
      if (msg.toLowerCase().includes('no account found')) {
        toast({ title: 'No account found', description: 'This number is not registered. Please sign up first.', variant: 'destructive' });
      } else {
        toast({ title: 'Could not send code', description: msg, variant: 'destructive' });
      }
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
        toast({ title: 'Welcome to Dealio!' });
        navigate(roleHome[signupRole], { replace: true });
      } else {
        data = await authApi.loginVerifyOtp(phoneCC, phone.replace(/\D/g, ''), phoneOtp, signupRole.toUpperCase()) as AuthApiResponse;
        const role = (data.user.role || 'customer').toLowerCase() as UserRole;
        setAuthFromResponse(data, role);
        toast({ title: 'Welcome back!' });
        navigate(roleHome[role] ?? '/home', { replace: true });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Verification failed';
      if (msg.toLowerCase().includes('suspended')) {
        toast({ title: 'Account Suspended', description: 'Your account has been suspended. Please contact support.', variant: 'destructive' });
      } else if (msg.toLowerCase().includes('no account found')) {
        toast({ title: 'No account found', description: 'This number is not registered. Please sign up first.', variant: 'destructive' });
      } else {
        toast({ title: 'Verification failed', description: msg, variant: 'destructive' });
      }
    } finally { setBusy(false); }
  };

  const handleGoogleSuccess = async (credentialResponse: GoogleCredentialResponse) => {
    if (!credentialResponse.credential) return;
    setBusy(true);
    try {
      const data = await authApi.googleAuth(
        credentialResponse.credential,
        mode === 'signup' ? signupRole : undefined,
        mode === 'signup' ? (referralCode || undefined) : undefined,
      ) as AuthApiResponse;
      const resolvedRole = mode === 'signup' ? signupRole : ((data.user.role || 'customer').toLowerCase() as UserRole);
      setAuthFromResponse(data, resolvedRole);
      if (mode === 'signup' && referralCode) localStorage.removeItem('dealio_referral_code');
      toast({ title: mode === 'signup' ? 'Welcome to Dealio!' : 'Welcome back!' });
      navigate(roleHome[resolvedRole] ?? '/home', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Google authentication failed';
      if (msg.toLowerCase().includes('suspended')) {
        toast({ title: 'Account Suspended', description: 'Your account has been suspended. Please contact support.', variant: 'destructive' });
      } else {
        toast({ title: 'Google sign-in failed', description: msg, variant: 'destructive' });
      }
    } finally { setBusy(false); }
  };

  const switchMode = (next: Mode) => {
    setMode(next);
    setMethod('phone');
    setPhoneOtpSent(false);
    setPhoneOtp('');
    setOtpDigits(['', '', '', '', '', '']);
    setResendIn(0);
    if (next === 'signup' && signupRole === 'admin') setSignupRole('customer');
  };

  const handleDemoSkip = async () => {
    try {
      setBusy(true);
      const demoName = demoCredentials[signupRole]?.name || signupRole;
      await authApi.signupSendOtp('+91', '1234567890', demoName, signupRole.toUpperCase());
      const response = await authApi.signupVerifyOtp('+91', '1234567890', '123456', demoName, signupRole.toUpperCase()) as AuthApiResponse;
      setAuthFromResponse(response, signupRole);
      toast({ title: 'Welcome to Dealio (Demo)!' });
      navigate(roleHome[signupRole], { replace: true });
    } catch (e: unknown) {
      toast({ title: 'Demo login failed', description: e instanceof Error ? e.message : 'Demo login failed', variant: 'destructive' });
    } finally { setBusy(false); }
  };

  const activeRoles = mode === 'signin' ? signinRoles : signupRoles;

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">

      {/* ── Animation styles ── */}
      <style>{`
        @keyframes dlShimmer {
          0%   { left: -60%; }
          100% { left: 110%; }
        }
        .dl-shimmer { position: relative; overflow: hidden; }
        .dl-shimmer::after {
          content: '';
          position: absolute;
          top: 0; left: -60%;
          width: 50%; height: 100%;
          background: linear-gradient(90deg, transparent, rgba(255,255,255,0.22), transparent);
          pointer-events: none;
        }
        .dl-shimmer:hover:not(:disabled)::after {
          animation: dlShimmer 0.7s ease forwards;
        }
        .dl-pills::-webkit-scrollbar { display: none; }
        .dl-pills { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ════════════════════ LEFT PANEL ════════════════════ */}
      <div
        className="hidden lg:flex lg:w-[44%] xl:w-[42%] flex-col relative overflow-hidden"
        style={{ background: 'linear-gradient(155deg, #0A1628 0%, #0C2240 52%, #091830 100%)' }}
      >
        {/* Grid texture */}
        <div className="absolute inset-0 pointer-events-none" style={{
          backgroundImage: [
            'linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px)',
            'linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)',
          ].join(', '),
          backgroundSize: '48px 48px',
        }} />

        {/* Ambient glows */}
        <div className="absolute -top-40 -right-24 w-[420px] h-[420px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(10,126,140,0.2) 0%, transparent 60%)' }} />
        <div className="absolute top-1/3 -left-20 w-64 h-64 rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(232,119,34,0.1) 0%, transparent 65%)' }} />

        {/* City SVG — bottom 44% */}
        <div className="absolute bottom-0 left-0 right-0 pointer-events-none" style={{ height: '44%', opacity: 0.8 }}>
          <CityScene />
        </div>
        {/* Fade from content into city */}
        <div className="absolute left-0 right-0 pointer-events-none"
          style={{ bottom: '44%', height: '96px', background: 'linear-gradient(transparent, rgba(9,24,48,0.88))' }} />

        {/* Content */}
        <div className="relative z-10 flex flex-col h-full px-12 xl:px-16 py-10">
          <DealioLogo size="md" variant="light" to="/home" />

          <div className="flex-1 flex flex-col justify-center pb-52">
            {/* Badge */}
            <div
              className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full w-fit mb-7"
              style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
              <Sparkles size={10} style={{ color: '#F5A623' }} />
              <span className="text-white/55 text-[11px] font-semibold">
                {mode === 'signup' ? 'Free forever · All roles' : 'Trusted by 12,400+ stakeholders'}
              </span>
            </div>

            {/* Headline */}
            <h2
              className="font-black text-white leading-[0.96] tracking-tight mb-4"
              style={{ fontSize: 'clamp(34px, 3.8vw, 50px)' }}
            >
              {mode === 'signin' ? <>Welcome<br />back to</> : <>Join the<br />platform</>}
              <br />
              <span style={{
                background: 'linear-gradient(90deg, #FCD34D 0%, #F59E0B 50%, #E87722 100%)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>
                {mode === 'signin' ? 'Dealio.' : 'for free.'}
              </span>
            </h2>

            <p className="text-white/40 text-[13px] leading-relaxed mb-8 max-w-[268px]">
              {mode === 'signin'
                ? 'Your role-specific dashboard is ready — every stakeholder, every deal, one platform.'
                : 'For builders, partners, buyers and banks. All connected. All in sync.'}
            </p>

            {/* Signup: progress steps */}
            {mode === 'signup' && (
              <div className="space-y-3.5">
                <p className="text-white/25 text-[10px] font-black uppercase tracking-[0.16em] mb-1">Your progress</p>
                {[
                  { label: 'Choose your role', done: true },
                  { label: 'Enter your details', done: !phoneOtpSent },
                  { label: 'Verify & enter Dealio', done: phoneOtpSent },
                ].map((step, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div
                      className="w-5 h-5 rounded-full flex-shrink-0 flex items-center justify-center transition-all"
                      style={{
                        backgroundColor: step.done ? '#0A7E8C' : 'rgba(255,255,255,0.06)',
                        border: step.done ? 'none' : '1px solid rgba(255,255,255,0.12)',
                      }}
                    >
                      {step.done
                        ? <CheckCircle2 size={10} className="text-white" />
                        : <span className="text-[8px] text-white/28 font-bold">{i + 1}</span>}
                    </div>
                    <span
                      className="text-[12.5px] font-medium transition-colors"
                      style={{ color: step.done ? 'rgba(255,255,255,0.78)' : 'rgba(255,255,255,0.28)' }}
                    >
                      {step.label}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Signin: platform highlights */}
            {mode === 'signin' && (
              <div className="grid grid-cols-3 gap-3">
                {[
                  { icon: Shield, label: 'Secure', desc: 'OTP & Google auth', color: '#0A7E8C' },
                  { icon: Sparkles, label: 'AI-Ready', desc: 'Smart insights', color: '#F5A623' },
                  { icon: Users, label: 'All Roles', desc: '6 stakeholders', color: '#E87722' },
                ].map(({ icon: Icon, label, desc, color }) => (
                  <div
                    key={label}
                    className="rounded-xl p-3.5"
                    style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
                  >
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center mb-2"
                      style={{ backgroundColor: `${color}22` }}>
                      <Icon size={14} style={{ color }} />
                    </div>
                    <div className="text-[13px] font-black text-white leading-tight">{label}</div>
                    <div className="text-[10px] text-white/32 mt-0.5 font-medium leading-tight">{desc}</div>
                  </div>
                ))}
              </div>
            )}
          </div>

          <p className="text-white/18 text-xs relative z-10">© 2026 Dealio · Free forever for all roles</p>
        </div>
      </div>

      {/* ════════════════════ RIGHT PANEL ════════════════════ */}
      <div className="flex-1 flex flex-col min-h-screen lg:min-h-0 lg:overflow-y-auto bg-white">

        {/* Top accent stripe */}
        <div
          className="h-[3px] w-full flex-shrink-0"
          style={{ background: 'linear-gradient(90deg, #0A7E8C 0%, #0DAABF 50%, #E87722 100%)' }}
        />

        {/* Mobile header */}
        <div className="lg:hidden flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <DealioLogo size="sm" to="/home" />
          <button
            onClick={() => switchMode(mode === 'signin' ? 'signup' : 'signin')}
            className="text-sm font-bold"
            style={{ color: '#0A7E8C' }}
          >
            {mode === 'signin' ? 'Sign up' : 'Sign in'}
          </button>
        </div>

        <div className="flex-1 flex items-start lg:items-center justify-center px-6 sm:px-10 py-10 lg:py-12">
          <div className="w-full max-w-[420px]">

            {/* Mode tabs — desktop only */}
            <div
              className="hidden lg:flex mb-8 p-1 rounded-xl"
              style={{ backgroundColor: '#F1F5F9' }}
            >
              {(['signin', 'signup'] as Mode[]).map(m => (
                <button
                  key={m}
                  type="button"
                  onClick={() => switchMode(m)}
                  className={`flex-1 py-2.5 rounded-lg text-[13px] font-bold transition-all ${
                    mode === m ? 'bg-white shadow-sm text-[#0A1628]' : 'text-slate-400 hover:text-slate-600'
                  }`}
                >
                  {m === 'signin' ? 'Sign in' : 'Create account'}
                </button>
              ))}
            </div>

            {/* Heading */}
            <div className="mb-7">
              <h1
                className="font-black text-[#0A1628] tracking-tight leading-[1.1]"
                style={{ fontSize: 'clamp(22px, 2.8vw, 28px)' }}
              >
                {mode === 'signin' ? <>Sign in to<br />your dashboard</> : <>Create your<br />free account</>}
              </h1>
              <p className="text-slate-400 text-[13px] mt-2.5 lg:hidden">
                {mode === 'signin' ? (
                  <>New to Dealio?{' '}
                    <button onClick={() => switchMode('signup')} className="font-bold" style={{ color: '#0A7E8C' }}>
                      Create free account
                    </button>
                  </>
                ) : (
                  <>Already on Dealio?{' '}
                    <button onClick={() => switchMode('signin')} className="font-bold" style={{ color: '#0A7E8C' }}>
                      Sign in
                    </button>
                  </>
                )}
              </p>
            </div>

            {/* Role pills — horizontal scroll */}
            <div className="mb-6">
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.14em] mb-3 block">
                I am a
              </label>
              <div className="flex gap-2 dl-pills overflow-x-auto pb-1">
                {activeRoles.map(role => {
                  const Icon = roleIcons[role];
                  const active = signupRole === role;
                  return (
                    <button
                      key={role}
                      type="button"
                      onClick={() => setSignupRole(role)}
                      className="flex items-center gap-2 px-4 py-2.5 rounded-full text-[13px] font-semibold whitespace-nowrap flex-shrink-0 transition-all duration-150"
                      style={active
                        ? { backgroundColor: roleColors[role], color: 'white', boxShadow: `0 4px 14px ${roleColors[role]}45`, transform: 'scale(1.04)' }
                        : { backgroundColor: '#F1F5F9', color: '#64748B', border: '1.5px solid #E2E8F0' }}
                    >
                      <Icon size={13} />
                      {roleLabels[role].split(' ')[0]}
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

            {/* Method tabs */}
            <div className="flex mb-5 p-1 rounded-xl" style={{ backgroundColor: '#F1F5F9' }}>
              <button
                type="button"
                onClick={() => { setMethod('phone'); setPhoneOtpSent(false); }}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[13px] font-semibold transition-all ${
                  method === 'phone' ? 'bg-white text-[#0A1628] shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <PhoneIcon size={13} /> Phone OTP
              </button>
              <button
                type="button"
                onClick={() => setMethod('google')}
                disabled={busy}
                className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-[13px] font-semibold transition-all disabled:opacity-50 ${
                  method === 'google' ? 'bg-white text-[#0A1628] shadow-sm' : 'text-slate-400 hover:text-slate-600'
                }`}
              >
                <GIcon /> Google
              </button>
            </div>

            {/* Demo skip */}
            <button
              type="button"
              disabled={busy}
              onClick={handleDemoSkip}
              className="w-full mb-5 py-2.5 rounded-xl flex items-center justify-center gap-2 text-xs font-semibold text-slate-400 hover:text-[#0A1628] transition-all"
              style={{ border: '1.5px dashed #CBD5E1' }}
            >
              {busy ? <Loader2 size={12} className="animate-spin" /> : <Zap size={12} />}
              Skip → Demo as {roleLabels[signupRole]}
            </button>

            {/* ── Google auth ── */}
            {method === 'google' && (
              <div className="flex flex-col items-center gap-4 py-2">
                <p className="text-[13px] text-slate-400 text-center">
                  {mode === 'signup'
                    ? <>Continue as <span className="font-bold" style={{ color: roleColors[signupRole] }}>{roleLabels[signupRole]}</span></>
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

            {/* ── Phone: enter details ── */}
            {method === 'phone' && !phoneOtpSent && (
              <form onSubmit={handleSendPhoneOtp} className="space-y-4">
                {mode === 'signup' && (
                  <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.12em] mb-2 block">
                      Full name
                    </label>
                    <input
                      required
                      placeholder="Your full name"
                      value={name}
                      onChange={(e) => { setName(e.target.value); if (nameErr && e.target.value.trim()) setNameErr(''); }}
                      onBlur={() => setNameErr(name.trim() ? '' : 'Full name required')}
                      className={`w-full px-4 py-3 rounded-xl border text-sm outline-none transition-all focus:ring-2 ${
                        nameErr
                          ? 'border-red-400 bg-red-50/20 focus:border-red-400 focus:ring-red-400/10'
                          : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 focus:border-[#0A7E8C] focus:ring-[#0A7E8C]/10'
                      }`}
                    />
                    {nameErr && (
                      <p className="text-xs text-red-500 mt-1.5 flex items-center gap-1">⚠ {nameErr}</p>
                    )}
                  </div>
                )}

                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.12em] mb-2 block">
                    Phone number
                  </label>
                  <div className="flex gap-2">
                    <select
                      value={phoneCC}
                      onChange={(e) => setPhoneCC(e.target.value)}
                      className="flex-shrink-0 px-3 py-3 rounded-xl border border-slate-200 bg-white text-sm hover:border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#0A7E8C]/10 focus:border-[#0A7E8C] cursor-pointer transition-all"
                    >
                      {COUNTRY_CODES.map((c) => (
                        <option key={c.code} value={c.code}>{c.flag} {c.code}</option>
                      ))}
                    </select>
                    <input
                      type="tel"
                      inputMode="numeric"
                      required
                      placeholder="98765 43210"
                      value={phone}
                      maxLength={10}
                      onChange={(e) => { setPhone(e.target.value.replace(/\D/g, '').slice(0, 10)); if (phoneErr) setPhoneErr(''); }}
                      onBlur={() => setPhoneErr(phone.trim() ? '' : 'Phone required')}
                      className={`flex-1 min-w-0 px-4 py-3 rounded-xl border text-sm outline-none transition-all focus:ring-2 ${
                        phoneErr
                          ? 'border-red-400 bg-red-50/20 focus:border-red-400 focus:ring-red-400/10'
                          : 'border-slate-200 bg-slate-50/50 hover:border-slate-300 focus:border-[#0A7E8C] focus:ring-[#0A7E8C]/10'
                      }`}
                    />
                  </div>
                  {phoneErr && (
                    <p className="text-xs text-red-500 mt-1.5">⚠ {phoneErr}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={busy}
                  className="dl-shimmer w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-white transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0"
                  style={{
                    background: 'linear-gradient(135deg, #0C90A2 0%, #0A7E8C 55%, #087280 100%)',
                    boxShadow: '0 8px 24px rgba(10,126,140,0.28)',
                  }}
                >
                  {busy ? <Loader2 className="animate-spin" size={16} /> : <PhoneIcon size={15} />}
                  Send verification code
                </button>
              </form>
            )}

            {/* ── Phone: verify OTP ── */}
            {method === 'phone' && phoneOtpSent && (
              <form onSubmit={handleVerifyPhoneOtp} className="space-y-5">
                {/* Info box */}
                <div
                  className="rounded-2xl p-4"
                  style={{ background: 'rgba(10,126,140,0.05)', border: '1px solid rgba(10,126,140,0.15)' }}
                >
                  <p className="text-[10px] font-black text-[#0A7E8C] uppercase tracking-widest mb-0.5">Code sent</p>
                  <p className="text-sm text-[#0A1628] font-semibold">{phoneCC} {phone}</p>
                  <p className="text-xs text-slate-400 mt-0.5">Expires in 5 minutes</p>
                </div>

                {/* 6-box OTP */}
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-[0.12em] mb-3 block">
                    Enter 6-digit code
                  </label>
                  <div className="flex gap-2 justify-between">
                    {[0,1,2,3,4,5].map(i => (
                      <input
                        key={i}
                        ref={el => { otpRefs.current[i] = el; }}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={otpDigits[i]}
                        onChange={e => handleOtpDigitChange(i, e.target.value)}
                        onKeyDown={e => handleOtpKeyDown(i, e)}
                        onPaste={i === 0 ? handleOtpPaste : undefined}
                        className="w-12 h-14 text-center text-xl font-black rounded-xl border-2 outline-none transition-all"
                        style={{
                          borderColor: otpDigits[i] ? roleColors[signupRole] : '#E2E8F0',
                          backgroundColor: otpDigits[i] ? `${roleColors[signupRole]}0C` : '#FAFBFC',
                          color: otpDigits[i] ? roleColors[signupRole] : '#0A1628',
                          boxShadow: otpDigits[i] ? `0 0 0 3px ${roleColors[signupRole]}22` : undefined,
                        }}
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={busy || phoneOtp.length !== 6}
                  className="dl-shimmer w-full py-3.5 rounded-xl font-bold text-sm flex items-center justify-center gap-2 text-white transition-all hover:-translate-y-0.5 active:translate-y-0 disabled:opacity-50 disabled:hover:translate-y-0"
                  style={{
                    background: 'linear-gradient(135deg, #0C90A2 0%, #0A7E8C 55%, #087280 100%)',
                    boxShadow: '0 8px 24px rgba(10,126,140,0.28)',
                  }}
                >
                  {busy && <Loader2 className="animate-spin" size={16} />}
                  Verify & continue <ArrowRight size={15} />
                </button>

                <div className="flex items-center justify-between text-xs pt-1">
                  <button
                    type="button"
                    onClick={() => { setPhoneOtpSent(false); setPhoneOtp(''); setOtpDigits(['','','','','','']); setResendIn(0); }}
                    className="text-slate-400 hover:text-[#0A1628] transition-colors"
                  >
                    ← Change number
                  </button>
                  <button
                    type="button"
                    onClick={(e) => handleSendPhoneOtp(e as React.FormEvent)}
                    disabled={busy || resendIn > 0}
                    className="font-bold hover:underline disabled:opacity-50 disabled:no-underline disabled:cursor-not-allowed"
                    style={{ color: '#0A7E8C' }}
                  >
                    {resendIn > 0 ? `Resend in ${resendIn}s` : 'Resend code'}
                  </button>
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