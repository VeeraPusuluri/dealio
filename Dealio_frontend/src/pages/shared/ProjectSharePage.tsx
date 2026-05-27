import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { authApi, builderApi } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  Building2, MapPin, Calendar, Shield, MessageSquare,
  Loader2, Home, CheckCircle2, Star, Clock, Phone, ArrowRight,
  ChevronLeft,
} from 'lucide-react';

interface ProjectDetail {
  id: number;
  name: string;
  city: string;
  locality?: string;
  address?: string | null;
  status: string;
  configurations?: string[];
  priceMin?: number | null;
  priceMax?: number | null;
  possessionDate?: string | null;
  reraNumber?: string | null;
  description?: string | null;
  imageUrl?: string | null;
  builderName?: string | null;
  totalUnits?: number | null;
  availableUnits?: number | null;
  featured?: boolean;
  closingSoon?: boolean;
}

interface AuthApiResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: number;
    fullName: string | null;
    phone: string;
    email: string | null;
    role: string;
    countryCode?: string;
    avatarUrl?: string;
  };
}

const fmt = (n: number) => {
  if (n >= 10_000_000) return `₹${(n / 10_000_000).toFixed(2)} Cr`;
  if (n >= 100_000) return `₹${(n / 100_000).toFixed(0)} L`;
  return `₹${n.toLocaleString('en-IN')}`;
};

const STATUS_LABEL: Record<string, string> = {
  PRE_LAUNCH: 'Pre-Launch', LAUNCHED: 'Launched',
  UNDER_CONSTRUCTION: 'Under Construction', READY_TO_MOVE: 'Ready to Move',
  NEW_LAUNCH: 'New Launch', ACTIVE: 'Active', CLOSING_SOON: 'Closing Soon',
};

type Step = 'view' | 'phone' | 'otp' | 'done';

const ProjectSharePage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const setAuthFromResponse = useAuthStore(s => s.setAuthFromResponse);

  const [project, setProject]   = useState<ProjectDetail | null>(null);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');

  // Share metadata
  const projectId = useRef<string | null>(null);
  const cpUserId  = useRef<string | null>(null);

  // OTP flow state
  const [step, setStep]         = useState<Step>('view');
  const [name, setName]         = useState('');
  const [phone, setPhone]       = useState('');
  const [otp, setOtp]           = useState('');
  const [otpBusy, setOtpBusy]   = useState(false);
  const [otpError, setOtpError] = useState('');
  const [isLogin, setIsLogin]   = useState(false); // whether we fell back to login flow

  // Resolve token via API on mount
  useEffect(() => {
    if (!token) {
      setError('Invalid share link');
      setLoading(false);
      return;
    }

    builderApi.resolveShareToken(token)
      .then((res: unknown) => {
        const { projectId: pid, cpUserId: cid, project } = (res as { projectId: number; cpUserId: number | null; project: ProjectDetail });
        projectId.current = String(pid);
        cpUserId.current  = cid != null ? String(cid) : null;
        setProject(project);
      })
      .catch(() => setError('Share link is invalid or has expired'))
      .finally(() => setLoading(false));
  }, [token]);

  /* ── Step 1: send OTP ── */
  const handleSendOtp = async () => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (!cleanPhone || cleanPhone.length < 10) { setOtpError('Enter a valid 10-digit mobile number'); return; }
    if (!name.trim()) { setOtpError('Please enter your name'); return; }
    setOtpBusy(true);
    setOtpError('');
    try {
      await authApi.signupSendOtp('+91', cleanPhone, name.trim(), 'CUSTOMER');
      setIsLogin(false);
    } catch (err: unknown) {
      // User likely already exists — fall back to login OTP
      try {
        await authApi.loginSendOtp('+91', cleanPhone);
        setIsLogin(true);
      } catch (err2: unknown) {
        setOtpError((err2 as Error).message || 'Could not send OTP. Try again.');
        setOtpBusy(false);
        return;
      }
    }
    setStep('otp');
    setOtpBusy(false);
  };

  /* ── Step 2: verify OTP ── */
  const handleVerifyOtp = async () => {
    const cleanPhone = phone.replace(/\D/g, '');
    if (otp.length < 4) { setOtpError('Enter the OTP you received'); return; }
    setOtpBusy(true);
    setOtpError('');
    try {
      let data: AuthApiResponse;
      if (isLogin) {
        data = await authApi.loginVerifyOtp('+91', cleanPhone, otp) as AuthApiResponse;
      } else {
        data = await authApi.signupVerifyOtp('+91', cleanPhone, otp, name.trim(), 'CUSTOMER') as AuthApiResponse;
      }
      setAuthFromResponse(data, 'customer');

      // Create the lead on the backend
      if (projectId.current) {
        builderApi.createLeadFromShare(projectId.current, {
          cpUserId: cpUserId.current,
          customerName: data.user.fullName ?? name.trim(),
          customerPhone: data.user.phone,
        }).catch(() => { /* best-effort */ });
      }

      setStep('done');
      // Short pause so user sees success state, then redirect
      setTimeout(() => {
        navigate(`/customer/projects/${projectId.current}`, { replace: true });
      }, 1400);
    } catch (err: unknown) {
      setOtpError((err as Error).message || 'Incorrect OTP. Please try again.');
    } finally {
      setOtpBusy(false);
    }
  };

  /* ── Loading / error states ── */
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center bg-[#EEF3EF]">
      <div className="text-center">
        <Loader2 className="animate-spin text-[#3C5A45] mx-auto mb-3" size={36} />
        <p className="text-sm text-slate-500">Loading project details…</p>
      </div>
    </div>
  );

  if (error || !project) return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 text-center p-8">
      <div>
        <Building2 size={52} className="mx-auto mb-4 text-slate-300" />
        <h2 className="text-xl font-bold text-slate-700 mb-2">Link Unavailable</h2>
        <p className="text-sm text-slate-500">{error || 'This share link is invalid or has expired.'}</p>
      </div>
    </div>
  );

  const priceStr = project.priceMin && project.priceMax
    ? `${fmt(project.priceMin)} – ${fmt(project.priceMax)}`
    : project.priceMin ? `Starting ${fmt(project.priceMin)}`
    : project.priceMax ? `Up to ${fmt(project.priceMax)}`
    : 'Price on request';

  const fullAddress = [project.address, project.locality, project.city].filter(Boolean).join(', ');

  return (
    <div className="min-h-screen bg-[#EEF3EF]">
      {/* Brand bar */}
      <div className="text-center py-3 text-xs font-semibold tracking-wide" style={{ backgroundColor: '#3C5A45', color: '#D8E5DA' }}>
        Shared by your trusted Channel Partner · <span className="font-black text-white">Dealio</span>
      </div>

      <div className="max-w-lg mx-auto pb-12">

        {/* Hero image */}
        <div className="relative h-64 bg-gradient-to-br from-[#D8E5DA] to-[#EEF3EF]">
          {project.imageUrl
            ? <img src={project.imageUrl} alt={project.name} className="w-full h-full object-cover" />
            : <div className="w-full h-full flex items-center justify-center"><Building2 size={72} className="text-slate-200" /></div>
          }
          <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
          <div className="absolute top-3 left-3 flex gap-1.5 flex-wrap">
            <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-white/90 text-slate-700">
              {STATUS_LABEL[project.status] ?? project.status}
            </span>
            {project.featured && (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 flex items-center gap-1">
                <Star size={8} fill="currentColor" /> Featured
              </span>
            )}
            {project.closingSoon && (
              <span className="text-[10px] font-bold px-2.5 py-1 rounded-full bg-red-100 text-red-700 flex items-center gap-1">
                <Clock size={8} /> Closing Soon
              </span>
            )}
          </div>
          <div className="absolute bottom-4 left-5 right-5">
            <h1 className="text-2xl font-black text-white leading-tight"
              style={{ fontFamily: 'Georgia, "Times New Roman", serif', fontStyle: 'italic' }}>
              {project.name}
            </h1>
            {project.builderName && (
              <p className="text-white/75 text-sm mt-0.5 flex items-center gap-1">
                <Building2 size={11} /> {project.builderName}
              </p>
            )}
          </div>
        </div>

        <div className="px-4 pt-5 space-y-4">

          {/* Price card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-[#D8E5DA]">
            <p className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: '#3C5A45' }}>Price Range</p>
            <div className="text-3xl font-black mb-2" style={{ color: '#2B4232' }}>{priceStr}</div>
            {fullAddress && (
              <div className="flex items-start gap-1.5 text-sm text-slate-500">
                <MapPin size={13} className="mt-0.5 shrink-0" /> {fullAddress}
              </div>
            )}
          </div>

          {/* Configurations */}
          {project.configurations && project.configurations.length > 0 && (
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide mb-2 flex items-center gap-1.5 text-slate-400">
                <Home size={11} /> Available Configurations
              </p>
              <div className="flex flex-wrap gap-2">
                {project.configurations.map(c => (
                  <span key={c} className="px-4 py-2 rounded-xl font-bold text-sm border"
                    style={{ backgroundColor: '#EEF3EF', color: '#2B4232', borderColor: '#D8E5DA' }}>
                    {c}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Key details */}
          <div className="grid grid-cols-2 gap-3">
            {project.possessionDate && (
              <div className="bg-white rounded-xl p-3.5 border border-[#D8E5DA] shadow-sm">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1.5"><Calendar size={12} /> Possession</div>
                <div className="font-black text-slate-800">{project.possessionDate.slice(0, 7)}</div>
              </div>
            )}
            {project.availableUnits != null && (
              <div className="bg-white rounded-xl p-3.5 border border-[#D8E5DA] shadow-sm">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1.5"><Home size={12} /> Available Units</div>
                <div className="font-black" style={{ color: '#3C5A45' }}>{project.availableUnits}</div>
              </div>
            )}
            {project.reraNumber && (
              <div className="bg-white rounded-xl p-3.5 border border-[#D8E5DA] shadow-sm col-span-2">
                <div className="flex items-center gap-1.5 text-slate-400 text-xs mb-1.5"><Shield size={12} /> RERA Registration</div>
                <div className="font-bold flex items-center gap-1.5" style={{ color: '#3C5A45' }}>
                  <CheckCircle2 size={13} /> {project.reraNumber}
                </div>
              </div>
            )}
          </div>

          {project.description && (
            <div className="bg-white rounded-xl p-4 border border-[#D8E5DA] shadow-sm">
              <p className="text-sm text-slate-600 leading-relaxed">{project.description}</p>
            </div>
          )}

          {/* ── OTP / CTA section ── */}
          <div className="pt-2">

            {step === 'view' && (
              <div className="space-y-3">
                <button
                  onClick={() => setStep('phone')}
                  className="w-full flex items-center justify-center gap-3 py-4 rounded-2xl text-white font-black text-base shadow-lg transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#3C5A45' }}>
                  <Phone size={18} /> Register Interest
                </button>
                <p className="text-center text-xs text-slate-400">
                  Verify your number to access the full project portal
                </p>
              </div>
            )}

            {step === 'phone' && (
              <div className="bg-white rounded-2xl p-5 border border-[#D8E5DA] shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <button onClick={() => setStep('view')} className="text-slate-400 hover:text-slate-600">
                    <ChevronLeft size={18} />
                  </button>
                  <h3 className="font-bold text-slate-800 text-base">Your details</h3>
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Full name</label>
                  <input
                    type="text"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    placeholder="Your name"
                    className="w-full px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:border-transparent"
                    style={{ focusRingColor: '#3C5A45' } as React.CSSProperties}
                    onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                  />
                </div>
                <div>
                  <label className="text-xs font-semibold text-slate-500 uppercase tracking-wide block mb-1.5">Mobile number</label>
                  <div className="flex gap-2">
                    <div className="px-3 py-3 rounded-xl border border-slate-200 text-sm font-semibold text-slate-600 bg-slate-50 shrink-0">
                      +91
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={e => setPhone(e.target.value.replace(/\D/g, '').slice(0, 10))}
                      placeholder="10-digit mobile"
                      className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:border-transparent"
                      onKeyDown={e => e.key === 'Enter' && handleSendOtp()}
                    />
                  </div>
                </div>
                {otpError && <p className="text-xs text-red-500 font-medium">{otpError}</p>}
                <button
                  onClick={handleSendOtp}
                  disabled={otpBusy}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white font-bold text-sm disabled:opacity-50 transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#3C5A45' }}>
                  {otpBusy ? <Loader2 size={16} className="animate-spin" /> : <ArrowRight size={16} />}
                  {otpBusy ? 'Sending OTP…' : 'Get OTP'}
                </button>
              </div>
            )}

            {step === 'otp' && (
              <div className="bg-white rounded-2xl p-5 border border-[#D8E5DA] shadow-sm space-y-4">
                <div className="flex items-center gap-2 mb-1">
                  <button onClick={() => { setStep('phone'); setOtp(''); setOtpError(''); }} className="text-slate-400 hover:text-slate-600">
                    <ChevronLeft size={18} />
                  </button>
                  <h3 className="font-bold text-slate-800 text-base">Enter OTP</h3>
                </div>
                <p className="text-sm text-slate-500">
                  OTP sent to <span className="font-semibold text-slate-700">+91 {phone}</span>
                  {isLogin ? '' : ' (new account)'}
                </p>
                <input
                  type="number"
                  value={otp}
                  onChange={e => setOtp(e.target.value.slice(0, 6))}
                  placeholder="6-digit OTP"
                  className="w-full px-4 py-3 rounded-xl border border-slate-200 text-lg font-black text-slate-800 tracking-[0.3em] text-center focus:outline-none focus:ring-2 focus:border-transparent"
                  onKeyDown={e => e.key === 'Enter' && handleVerifyOtp()}
                  autoFocus
                />
                {otpError && <p className="text-xs text-red-500 font-medium">{otpError}</p>}
                <button
                  onClick={handleVerifyOtp}
                  disabled={otpBusy}
                  className="w-full flex items-center justify-center gap-2 py-3.5 rounded-2xl text-white font-bold text-sm disabled:opacity-50 transition-opacity hover:opacity-90"
                  style={{ backgroundColor: '#3C5A45' }}>
                  {otpBusy ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                  {otpBusy ? 'Verifying…' : 'Verify & Open Project'}
                </button>
                <button
                  onClick={() => { setStep('phone'); setOtp(''); setOtpError(''); }}
                  className="w-full text-center text-xs text-slate-400 hover:text-slate-600 py-1">
                  Resend OTP
                </button>
              </div>
            )}

            {step === 'done' && (
              <div className="bg-white rounded-2xl p-5 border border-[#D8E5DA] shadow-sm text-center space-y-3">
                <div className="w-14 h-14 rounded-full mx-auto flex items-center justify-center" style={{ backgroundColor: '#EEF3EF' }}>
                  <CheckCircle2 size={28} style={{ color: '#3C5A45' }} />
                </div>
                <h3 className="font-bold text-slate-800 text-base">Verified!</h3>
                <p className="text-sm text-slate-500">Opening your project view…</p>
                <Loader2 size={18} className="animate-spin mx-auto" style={{ color: '#3C5A45' }} />
              </div>
            )}

            <p className="text-center text-xs text-slate-400 pt-4 pb-2">
              Powered by <span className="font-bold" style={{ color: '#3C5A45' }}>Dealio</span> · India's Real Estate Platform
            </p>
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProjectSharePage;