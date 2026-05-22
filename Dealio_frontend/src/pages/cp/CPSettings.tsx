import { useState, useEffect, useRef } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { cpApi } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  Settings, User, Phone, FileText, Save, CheckCircle2, Loader2,
  Upload, Shield, AlertCircle, Eye, X,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const inp = 'w-full px-3.5 py-2.5 rounded-xl border border-orange-200/70 bg-orange-50/50 text-sm text-gray-800 placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400/20 focus:border-amber-400 focus:bg-white transition-all';

const card = 'bg-white rounded-3xl border border-orange-100 shadow-md shadow-orange-100/40 p-6';

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

function VerifiedBadge({ status }: { status: DocStatus }) {
  if (status === 'verified') return <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full"><CheckCircle2 size={11} /> Verified</span>;
  if (status === 'uploaded') return <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full"><AlertCircle size={11} /> Under Review</span>;
  return <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-400 bg-gray-50 border border-gray-200 px-2 py-0.5 rounded-full"><X size={11} /> Not Uploaded</span>;
}

function DocUploadCard({
  label, docType, status, url, onUpload, uploading,
}: {
  label: string; docType: 'aadhaar' | 'pan' | 'rera';
  status: DocStatus; url: string | null;
  onUpload: (file: File, docType: 'aadhaar' | 'pan' | 'rera') => Promise<void>;
  uploading: boolean;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = (file: File) => onUpload(file, docType);

  return (
    <div className="bg-white rounded-3xl border border-orange-100 shadow-md shadow-orange-100/40 p-6 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <FileText size={15} className="text-amber-500" />
          <span className="text-sm font-semibold text-gray-900">{label}</span>
        </div>
        <VerifiedBadge status={status} />
      </div>

      {url && (
        <div className="flex items-center gap-2 text-xs text-gray-500 bg-orange-50/60 rounded-xl px-3 py-2 border border-orange-100">
          <Eye size={12} className="shrink-0" />
          <span className="truncate">{url.split('/').pop()}</span>
          <a href={url} target="_blank" rel="noreferrer" className="ml-auto text-amber-600 font-medium hover:underline shrink-0">View</a>
        </div>
      )}

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
        onClick={() => fileRef.current?.click()}
        className={`flex flex-col items-center justify-center gap-2 rounded-2xl border border-dashed py-6 cursor-pointer transition-all ${dragOver ? 'border-amber-400 bg-amber-50/60' : 'border-orange-200 hover:border-amber-300 hover:bg-orange-50/40'}`}
      >
        {uploading
          ? <Loader2 size={18} className="animate-spin text-amber-500" />
          : <Upload size={18} className="text-orange-300" />}
        <p className="text-xs text-gray-400">{uploading ? 'Uploading…' : 'Click or drag & drop (PDF, JPG, PNG)'}</p>
        <input ref={fileRef} type="file" accept=".pdf,.jpg,.jpeg,.png,.webp" className="hidden"
          onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }} />
      </div>
    </div>
  );
}

const CPSettings = () => {
  const authUser = useAuthStore((s) => s.user);
  const { toast } = useToast();

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

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-48"><Loader2 size={24} className="animate-spin text-amber-500" /></div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="min-h-screen -m-4 p-4 sm:-m-6 sm:p-6 bg-gradient-to-br from-orange-50 via-amber-50/40 to-yellow-50">
        <div className="max-w-2xl mx-auto space-y-5 pb-12">

          {/* Header */}
          <div className="pt-1 flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl flex items-center justify-center shrink-0 bg-gradient-to-br from-amber-400 to-orange-500 shadow-lg shadow-orange-200/60">
              <Settings size={18} className="text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-gray-900">Account Settings</h1>
                {phoneVerified && (profile?.cp?.aadhaarVerified ?? false)
                  ? <span className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full"><CheckCircle2 size={12} /> Verified</span>
                  : <span className="inline-flex items-center gap-1 text-xs font-semibold text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full"><AlertCircle size={12} /> Verification Pending</span>}
              </div>
              <p className="text-sm text-gray-500">Manage your profile, verification, and documents</p>
            </div>
          </div>

          {/* Profile */}
          <div className={`${card} space-y-5`}>
            <div className="flex items-center gap-2">
              <User size={15} className="text-amber-500" />
              <h3 className="text-base font-semibold text-gray-900">Profile Information</h3>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500">Preferred Name <span className="text-gray-400 font-normal">(visible to users)</span></label>
                <input value={fullName} maxLength={50}
                  onChange={(e) => { const v = e.target.value.replace(/[^a-zA-Z\s]/g, ''); setFullName(v); setProfileSaved(false); }}
                  placeholder="Name shown to builders and clients" className={inp} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500">Email</label>
                <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setProfileSaved(false); }} placeholder="you@example.com" className={inp} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500">City</label>
                <input value={city} onChange={(e) => { setCity(e.target.value); setProfileSaved(false); }} placeholder="e.g. Hyderabad" className={inp} />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-500">Full Name as per Aadhaar</label>
                <input value={aadhaarName} maxLength={50}
                  onChange={(e) => { const v = e.target.value.replace(/[^a-zA-Z\s]/g, ''); setAadhaarName(v); setProfileSaved(false); }}
                  placeholder="Name exactly as on Aadhaar card" className={inp} />
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-500">Bio</label>
              <textarea value={bio} rows={4}
                onChange={(e) => {
                  const lines = e.target.value.split('\n');
                  if (lines.length > 4) return;
                  setBio(e.target.value); setProfileSaved(false);
                }}
                placeholder="A short intro about yourself — shown to builders and clients"
                className={`${inp} resize-none`} />
            </div>

            <div className="flex justify-end">
              <button onClick={handleProfileSave} disabled={profileSaving}
                className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-60 bg-gradient-to-r from-amber-500 to-orange-500 shadow-md shadow-orange-200/50">
                {profileSaving ? <><Loader2 size={14} className="animate-spin" /> Saving…</> : profileSaved ? <><CheckCircle2 size={14} /> Saved!</> : <><Save size={14} /> Save Profile</>}
              </button>
            </div>
          </div>

          {/* Phone Verification */}
          <div className={`${card} space-y-5`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Phone size={15} className="text-amber-500" />
                <h3 className="text-base font-semibold text-gray-900">Phone Verification</h3>
              </div>
              {phoneVerified
                ? <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full"><CheckCircle2 size={12} /> Verified</span>
                : <span className="inline-flex items-center gap-1 text-xs font-medium text-orange-700 bg-orange-50 border border-orange-200 px-2.5 py-1 rounded-full"><AlertCircle size={12} /> Not Verified</span>}
            </div>

            {phoneVerified ? (
              <div className="flex items-center gap-2 text-sm text-emerald-700 bg-emerald-50 rounded-2xl px-4 py-3 border border-emerald-100">
                <Shield size={14} className="shrink-0" />
                <span>Your phone number <strong>{phone}</strong> is verified.</span>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-gray-500">Verify your phone number to build trust with builders and clients.</p>
                <div className="flex gap-2">
                  <input type="tel" value={phone} maxLength={15}
                    onChange={(e) => { const v = e.target.value.replace(/[^0-9+\s-]/g, ''); setPhone(v); setOtpSent(false); }}
                    placeholder="+91 98765 43210" className={`${inp} flex-1`} />
                  <button onClick={handleSendOtp} disabled={otpSending || !phone.trim()}
                    className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 shrink-0 bg-gradient-to-r from-amber-500 to-orange-500 shadow-md shadow-orange-200/50">
                    {otpSending ? <Loader2 size={14} className="animate-spin" /> : 'Send OTP'}
                  </button>
                </div>
                {otpSent && (
                  <div className="space-y-2">
                    <div className="flex gap-2">
                      <input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="6-digit OTP"
                        maxLength={6} className={`${inp} flex-1 tracking-widest font-mono`} />
                      <button onClick={handleVerifyOtp} disabled={otpVerifying || otp.length < 6}
                        className="px-4 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2 hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 shrink-0 bg-gradient-to-r from-amber-500 to-orange-500 shadow-md shadow-orange-200/50">
                        {otpVerifying ? <Loader2 size={14} className="animate-spin" /> : 'Verify'}
                      </button>
                    </div>
                    <p className="text-xs text-gray-400">OTP is printed to the backend console in dev mode.</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* KYC Documents */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 px-1">
              <Shield size={15} className="text-amber-500" />
              <h3 className="text-base font-semibold text-gray-900">KYC Documents</h3>
              <span className="text-xs text-gray-400 ml-1">Reviewed by admin</span>
            </div>

            <DocUploadCard label="Aadhaar Card" docType="aadhaar"
              status={docStatus(profile?.cp?.aadhaarUrl, profile?.cp?.aadhaarVerified ?? false)}
              url={profile?.cp?.aadhaarUrl ?? null}
              onUpload={handleDocUpload} uploading={uploadingDoc === 'aadhaar'} />
          </div>

          {/* Verification summary / tier */}
          <div className={card}>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm font-semibold text-gray-900">Verification Status</p>
                <p className="text-xs text-gray-500 mt-0.5">Complete all verifications to unlock higher tiers</p>
              </div>
              {profile?.cp?.tier && (
                <span className={`text-sm font-bold px-3 py-1.5 rounded-full ${profile.cp.tier === 'Platinum' ? 'bg-purple-100 text-purple-700' : profile.cp.tier === 'Gold' ? 'bg-yellow-100 text-yellow-700' : 'bg-orange-50 text-orange-600 border border-orange-200'}`}>
                  {profile.cp.tier}
                </span>
              )}
            </div>
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                { label: 'Phone', done: phoneVerified },
                { label: 'Aadhaar', done: profile?.cp?.aadhaarVerified ?? false },
              ].map(({ label, done }) => (
                <div key={label} className={`flex items-center gap-1 px-2.5 py-1 rounded-full border ${done ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-orange-50 border-orange-200 text-orange-400'}`}>
                  {done ? <CheckCircle2 size={11} /> : <AlertCircle size={11} />} {label}
                </div>
              ))}
            </div>
          </div>

        </div>
      </div>
    </DashboardLayout>
  );
};

export default CPSettings;
