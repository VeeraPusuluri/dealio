import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { cpApi } from '@/lib/api';
import { useAuthStore, roleLabels, roleColors } from '@/stores/useAuthStore';
import {
  User, Phone, FileText, Save, CheckCircle2, Loader2,
  Upload, Shield, AlertCircle, Eye, X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

type DocStatus = 'none' | 'uploaded' | 'verified';

interface CPProfile {
  id: number;
  fullName: string | null;
  email: string | null;
  phone: string;
  cp: {
    city: string | null;
    bio: string | null;
    reraNumber: string | null;
    aadhaarName: string | null;
    phoneVerified: boolean;
    aadhaarVerified: boolean;
    panVerified: boolean;
    reraVerified: boolean;
    aadhaarUrl: string | null;
    panUrl: string | null;
    reraUrl: string | null;
    tier: string;
  } | null;
}

const TABS = [
  { id: 'profile',      label: 'Profile',       icon: User },
  { id: 'verification', label: 'Verification',   icon: Phone },
  { id: 'status',       label: 'KYC Status',     icon: Shield },
];

function StatusBadge({ status }: { status: DocStatus }) {
  if (status === 'verified')
    return <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full"><CheckCircle2 size={10} />Verified</span>;
  if (status === 'uploaded')
    return <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full"><AlertCircle size={10} />Under Review</span>;
  return <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-muted-foreground bg-muted border border-border px-2 py-0.5 rounded-full"><X size={10} />Not Uploaded</span>;
}

function DocUploadCard({
  label, docType, status, url, onUpload, uploading,
}: {
  label: string;
  docType: 'aadhaar' | 'pan' | 'rera';
  status: DocStatus;
  url: string | null;
  onUpload: (file: File, docType: 'aadhaar' | 'pan' | 'rera') => Promise<void>;
  uploading: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const handleFile = (file: File) => onUpload(file, docType);

  return (
    <div className="bg-card rounded-xl border border-border p-4 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={13} className="text-muted-foreground" />
          <span className="text-[13px] font-semibold text-card-foreground">{label}</span>
        </div>
        <StatusBadge status={status} />
      </div>

      {url && (
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground bg-muted rounded-lg px-3 py-2 border border-border">
          <Eye size={11} className="shrink-0" />
          <span className="truncate">{url.split('/').pop()}</span>
          <a href={url} target="_blank" rel="noreferrer" className="ml-auto text-primary font-medium hover:underline shrink-0">View</a>
        </div>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onClick={() => fileRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed py-5 cursor-pointer transition-all ${
          dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-muted/50'
        }`}
      >
        {uploading ? <Loader2 size={16} className="animate-spin text-muted-foreground" /> : <Upload size={16} className="text-muted-foreground" />}
        <p className="text-[11px] text-muted-foreground">{uploading ? 'Uploading…' : 'Click or drag & drop · PDF, JPG, PNG'}</p>
        <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
      </div>
    </div>
  );
}

const CPSettings = () => {
  const authUser = useAuthStore((s) => s.user);
  const { toast } = useToast();

  const color = authUser ? roleColors[authUser.role] || '#F59E0B' : '#F59E0B';
  const initials = (authUser?.name || 'U').split(' ').map((w: string) => w[0]).slice(0, 2).join('').toUpperCase();

  const [activeTab, setActiveTab] = useState('profile');
  const [profile, setProfile] = useState<CPProfile | null>(null);
  const [loading, setLoading] = useState(true);

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [bio, setBio] = useState('');
  const [aadhaarName, setAadhaarName] = useState('');
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSaved, setProfileSaved] = useState(false);

  const [phone, setPhone] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otp, setOtp] = useState('');
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [phoneVerified, setPhoneVerified] = useState(false);

  const [uploadingDoc, setUploadingDoc] = useState<'aadhaar' | 'pan' | 'rera' | null>(null);

  useEffect(() => {
    if (!authUser?.id) return;
    cpApi.getProfile(authUser.id)
      .then((data) => {
        const p = data as CPProfile;
        setProfile(p);
        setFullName(p.fullName ?? '');
        setEmail(p.email ?? '');
        setCity(p.cp?.city ?? '');
        setBio(p.cp?.bio ?? '');
        setAadhaarName(p.cp?.aadhaarName ?? '');
        setPhone(p.phone?.startsWith('google-') ? '' : p.phone ?? '');
        setPhoneVerified(p.cp?.phoneVerified ?? false);
      })
      .catch(() => {
        setFullName(authUser.name ?? '');
        setEmail(authUser.email ?? '');
        setPhone(authUser.phone?.startsWith('google-') ? '' : authUser.phone ?? '');
      })
      .finally(() => setLoading(false));
  }, [authUser?.id]);

  const handleProfileSave = async () => {
    if (!authUser?.id) return;
    setProfileSaving(true);
    try {
      const data = await cpApi.updateProfile(authUser.id, { fullName, email, city, bio, aadhaarName }) as CPProfile;
      setProfile(data);
      useAuthStore.setState((s) => ({ user: s.user ? { ...s.user, name: fullName, email } : s.user }));
      setProfileSaved(true);
      setTimeout(() => setProfileSaved(false), 2500);
      toast({ title: 'Profile updated' });
    } catch (err: any) {
      toast({ title: 'Save failed', description: err?.message, variant: 'destructive' });
    } finally {
      setProfileSaving(false);
    }
  };

  const handleSendOtp = async () => {
    if (!phone.trim()) { toast({ title: 'Enter your phone number', variant: 'destructive' }); return; }
    setOtpSending(true);
    try {
      await cpApi.sendPhoneOtp(phone.trim());
      setOtpSent(true);
      toast({ title: 'OTP sent', description: 'Check backend console for the OTP (dev mode)' });
    } catch (err: any) {
      toast({ title: 'Failed to send OTP', description: err?.message, variant: 'destructive' });
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!authUser?.id || !otp.trim()) return;
    setOtpVerifying(true);
    try {
      await cpApi.verifyPhone(authUser.id, phone.trim(), otp.trim());
      setPhoneVerified(true);
      setOtpSent(false);
      setOtp('');
      toast({ title: 'Phone verified!' });
    } catch (err: any) {
      toast({ title: 'Verification failed', description: err?.message, variant: 'destructive' });
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleDocUpload = async (file: File, docType: 'aadhaar' | 'pan' | 'rera') => {
    if (!authUser?.id) return;
    setUploadingDoc(docType);
    try {
      const result = await cpApi.uploadDocument(authUser.id, file, docType) as any;
      setProfile((prev) => prev ? { ...prev, cp: { ...prev.cp!, ...result.cp } } : prev);
      toast({ title: 'Document uploaded', description: `${docType.toUpperCase()} submitted for review` });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err?.message, variant: 'destructive' });
    } finally {
      setUploadingDoc(null);
    }
  };

  const docStatus = (uploaded: string | null | undefined, verified: boolean): DocStatus => {
    if (verified) return 'verified';
    if (uploaded) return 'uploaded';
    return 'none';
  };

  const inp = 'w-full px-3.5 py-2.5 rounded-xl border border-border bg-background text-[13px] text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:border-ring transition-all';

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-48"><Loader2 size={20} className="animate-spin text-muted-foreground" /></div>
      </DashboardLayout>
    );
  }

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
              <div className="flex items-center gap-2">
                <h2 className="text-[15px] font-bold text-card-foreground truncate">{fullName || authUser?.name}</h2>
                {phoneVerified && (profile?.cp?.aadhaarVerified ?? false)
                  ? <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex-shrink-0"><CheckCircle2 size={10} />Verified</span>
                  : <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full flex-shrink-0"><AlertCircle size={10} />Pending</span>}
              </div>
              <div className="flex items-center gap-2 mt-1">
                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full text-white" style={{ backgroundColor: color }}>
                  {authUser ? roleLabels[authUser.role] : 'Channel Partner'}
                </span>
                {profile?.cp?.tier && (
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                    profile.cp.tier === 'Platinum' ? 'bg-purple-100 text-purple-700' :
                    profile.cp.tier === 'Gold'     ? 'bg-yellow-100 text-yellow-700' :
                                                     'bg-muted text-muted-foreground'
                  }`}>{profile.cp.tier}</span>
                )}
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
          <div className="flex-1 min-w-0 space-y-4">

            {/* ── Profile ── */}
            {activeTab === 'profile' && (
              <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-border">
                  <User size={14} style={{ color }} />
                  <h3 className="text-[13px] font-semibold text-card-foreground">Profile Information</h3>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-muted-foreground">Preferred Name <span className="text-muted-foreground/60">(visible to users)</span></label>
                    <input value={fullName} maxLength={50}
                      onChange={(e) => { const v = e.target.value.replace(/[^a-zA-Z\s]/g, ''); setFullName(v); setProfileSaved(false); }}
                      placeholder="Name shown to builders and clients" className={inp} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-muted-foreground">Email</label>
                    <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setProfileSaved(false); }} placeholder="you@example.com" className={inp} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-muted-foreground">City</label>
                    <input value={city} onChange={(e) => { setCity(e.target.value); setProfileSaved(false); }} placeholder="e.g. Hyderabad" className={inp} />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[11px] font-medium text-muted-foreground">Full Name as per Aadhaar</label>
                    <input value={aadhaarName} maxLength={50}
                      onChange={(e) => { const v = e.target.value.replace(/[^a-zA-Z\s]/g, ''); setAadhaarName(v); setProfileSaved(false); }}
                      placeholder="Name exactly as on Aadhaar card" className={inp} />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[11px] font-medium text-muted-foreground">Bio</label>
                  <textarea value={bio} rows={4}
                    onChange={(e) => {
                      const lines = e.target.value.split('\n');
                      if (lines.length > 4) return;
                      setBio(e.target.value); setProfileSaved(false);
                    }}
                    placeholder="A short intro about yourself — shown to builders and clients"
                    className={`${inp} resize-none`} />
                </div>

                <div className="flex justify-end pt-1">
                  <button
                    onClick={handleProfileSave}
                    disabled={profileSaving}
                    className="flex items-center gap-2 px-5 py-2 rounded-xl text-[13px] font-semibold text-white hover:opacity-90 active:scale-95 transition-all disabled:opacity-60"
                    style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)` }}
                  >
                    {profileSaving ? <><Loader2 size={13} className="animate-spin" />Saving…</>
                      : profileSaved ? <><CheckCircle2 size={13} />Saved!</>
                      : <><Save size={13} />Save Profile</>}
                  </button>
                </div>
              </div>
            )}

            {/* ── Verification ── */}
            {activeTab === 'verification' && (
              <>
                {/* Phone */}
                <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
                  <div className="flex items-center justify-between pb-3 border-b border-border">
                    <div className="flex items-center gap-2">
                      <Phone size={14} style={{ color }} />
                      <h3 className="text-[13px] font-semibold text-card-foreground">Phone Verification</h3>
                    </div>
                    {phoneVerified
                      ? <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full"><CheckCircle2 size={10} />Verified</span>
                      : <span className="inline-flex items-center gap-1 text-[10px] font-semibold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full"><AlertCircle size={10} />Not Verified</span>}
                  </div>

                  {phoneVerified ? (
                    <div className="flex items-center gap-2.5 text-[13px] text-emerald-700 bg-emerald-50 rounded-xl px-4 py-3 border border-emerald-100">
                      <Shield size={14} className="shrink-0" />
                      <span>Phone number <strong>{phone}</strong> is verified.</span>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      <p className="text-[13px] text-muted-foreground">Verify your phone to build trust with builders and clients.</p>
                      <div className="flex gap-2">
                        <input type="tel" value={phone} maxLength={15}
                          onChange={(e) => { const v = e.target.value.replace(/[^0-9+\s-]/g, ''); setPhone(v); setOtpSent(false); }}
                          placeholder="+91 98765 43210" className={`${inp} flex-1`} />
                        <button
                          onClick={handleSendOtp}
                          disabled={otpSending || !phone.trim()}
                          className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 shrink-0"
                          style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)` }}
                        >
                          {otpSending ? <Loader2 size={13} className="animate-spin" /> : 'Send OTP'}
                        </button>
                      </div>
                      {otpSent && (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit OTP"
                              maxLength={6} className={`${inp} flex-1 tracking-widest font-mono`} />
                            <button
                              onClick={handleVerifyOtp}
                              disabled={otpVerifying || otp.length < 6}
                              className="px-4 py-2 rounded-xl text-[13px] font-semibold text-white flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 shrink-0"
                              style={{ background: `linear-gradient(135deg, ${color}, ${color}bb)` }}
                            >
                              {otpVerifying ? <Loader2 size={13} className="animate-spin" /> : 'Verify'}
                            </button>
                          </div>
                          <p className="text-[11px] text-muted-foreground">OTP is printed to the backend console in dev mode.</p>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* KYC Documents */}
                <div className="space-y-3">
                  <div className="flex items-center gap-2 px-1">
                    <FileText size={13} className="text-muted-foreground" />
                    <h3 className="text-[13px] font-semibold text-card-foreground">KYC Documents</h3>
                    <span className="text-[11px] text-muted-foreground">· Reviewed by admin</span>
                  </div>
                  <DocUploadCard
                    label="Aadhaar Card" docType="aadhaar"
                    status={docStatus(profile?.cp?.aadhaarUrl, profile?.cp?.aadhaarVerified ?? false)}
                    url={profile?.cp?.aadhaarUrl ?? null}
                    onUpload={handleDocUpload}
                    uploading={uploadingDoc === 'aadhaar'}
                  />
                </div>
              </>
            )}

            {/* ── KYC Status ── */}
            {activeTab === 'status' && (
              <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
                <div className="flex items-center gap-2 pb-3 border-b border-border">
                  <Shield size={14} style={{ color }} />
                  <h3 className="text-[13px] font-semibold text-card-foreground">Verification Status</h3>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[13px] font-medium text-card-foreground">Account Tier</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5">Complete all verifications to unlock higher tiers</p>
                  </div>
                  {profile?.cp?.tier && (
                    <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${
                      profile.cp.tier === 'Platinum' ? 'bg-purple-100 text-purple-700' :
                      profile.cp.tier === 'Gold'     ? 'bg-yellow-100 text-yellow-700' :
                                                       'bg-muted text-muted-foreground'
                    }`}>
                      {profile.cp.tier}
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  {[
                    { label: 'Phone Number', done: phoneVerified, detail: phoneVerified ? phone : 'Not verified' },
                    { label: 'Aadhaar Card', done: profile?.cp?.aadhaarVerified ?? false, detail: profile?.cp?.aadhaarVerified ? 'Verified' : profile?.cp?.aadhaarUrl ? 'Under review' : 'Not uploaded' },
                  ].map(({ label, done, detail }) => (
                    <div key={label} className={`flex items-center justify-between px-4 py-3 rounded-xl border ${
                      done ? 'bg-emerald-50/50 border-emerald-100' : 'bg-muted/30 border-border'
                    }`}>
                      <div className="flex items-center gap-2.5">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${done ? 'bg-emerald-100' : 'bg-muted'}`}>
                          {done ? <CheckCircle2 size={13} className="text-emerald-600" /> : <AlertCircle size={13} className="text-muted-foreground" />}
                        </div>
                        <span className="text-[13px] font-medium text-card-foreground">{label}</span>
                      </div>
                      <span className={`text-[11px] font-medium ${done ? 'text-emerald-600' : 'text-muted-foreground'}`}>{detail}</span>
                    </div>
                  ))}
                </div>

                {!phoneVerified && (
                  <p className="text-[12px] text-muted-foreground pt-1">
                    Go to <button onClick={() => setActiveTab('verification')} className="text-primary font-medium hover:underline">Verification</button> to complete your KYC.
                  </p>
                )}
              </div>
            )}

          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CPSettings;