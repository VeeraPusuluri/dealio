import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { IndianRupee, Shield, QrCode, FileSignature, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';
import DatePickerField from '@/components/shared/DatePickerField';

const reraPortals: Record<string, string> = {
  'Maharashtra': 'https://maharera.mahaonline.gov.in',
  'Karnataka': 'https://rera.karnataka.gov.in',
  'Telangana': 'https://rera.telangana.gov.in',
  'Tamil Nadu': 'https://www.tnrera.in',
  'Delhi': 'https://rera.delhi.gov.in',
  'Uttar Pradesh': 'https://up-rera.in',
  'Gujarat': 'https://gujrera.gujarat.gov.in',
  'Rajasthan': 'https://rera.rajasthan.gov.in',
  'Punjab': 'https://rera.punjab.gov.in',
  'Haryana': 'https://haryanarera.gov.in',
  'West Bengal': 'https://wbhira.gov.in',
  'Kerala': 'https://rera.kerala.gov.in',
  'Madhya Pradesh': 'https://rera.mp.gov.in',
  'Andhra Pradesh': 'https://rera.ap.gov.in',
  'Odisha': 'https://rera.odisha.gov.in',
};

const stampDutyRates: Record<string, { male: number; female: number; reg: number; extra?: number; extraLabel?: string }> = {
  'Maharashtra': { male: 5, female: 4, reg: 1, extra: 1, extraLabel: 'Metro Cess' },
  'Karnataka': { male: 5, female: 5, reg: 1 },
  'Telangana': { male: 4, female: 4, reg: 0.5 },
  'Tamil Nadu': { male: 7, female: 7, reg: 4 },
  'Delhi': { male: 6, female: 4, reg: 1 },
  'Uttar Pradesh': { male: 7, female: 7, reg: 1 },
  'Gujarat': { male: 4.9, female: 4.9, reg: 1 },
  'Rajasthan': { male: 5, female: 5, reg: 1 },
  'Punjab': { male: 7, female: 7, reg: 1 },
  'Haryana': { male: 7, female: 5, reg: 1 },
};

const BuilderRERA = () => {
  const [reraNumber, setReraNumber] = useState('P02400003456');
  const [reraState, setReraState] = useState('Telangana');
  const [reraExpiry, setReraExpiry] = useState('2026-12-31');

  // Stamp duty
  const [sdState, setSdState] = useState('Maharashtra');
  const [sdValue, setSdValue] = useState(10000000);
  const [sdGender, setSdGender] = useState<'male' | 'female'>('male');

  // E-Sign
  const [showEsign, setShowEsign] = useState(false);

  const portalUrl = reraPortals[reraState] || '';
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(portalUrl + '?rera=' + reraNumber)}`;

  const daysToExpiry = Math.floor((new Date(reraExpiry).getTime() - Date.now()) / 86400000);
  const isExpiringSoon = daysToExpiry > 0 && daysToExpiry <= 30;
  const isExpired = daysToExpiry <= 0;

  const rates = stampDutyRates[sdState];
  const stampDuty = rates ? sdValue * (sdGender === 'female' ? rates.female : rates.male) / 100 : 0;
  const regFee = rates ? sdValue * rates.reg / 100 : 0;
  const extraCharge = rates?.extra ? sdValue * rates.extra / 100 : 0;
  const totalGovt = stampDuty + regFee + extraCharge;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="la-banner px-5 py-4 flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-100 flex items-center justify-center">
            <Shield size={18} className="text-teal-600" />
          </div>
          <h2 className="text-lg font-bold text-slate-800">RERA & Legal Compliance</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* RERA Fields */}
          <div className="la-card p-5 space-y-4">
            <h3 className="font-semibold text-slate-700">RERA Registration</h3>
            {isExpired && <div className="p-2.5 rounded-xl bg-red-50 border border-red-100 text-red-600 text-xs font-medium flex items-center gap-1.5"><AlertCircle size={12} /> RERA expired — cannot publish</div>}
            {isExpiringSoon && <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-100 text-amber-700 text-xs font-medium">⚠️ RERA expiring in {daysToExpiry} days</div>}
            <div>
              <label className="text-xs text-slate-500 font-medium">State</label>
              <select value={reraState} onChange={e => setReraState(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 shadow-sm">
                {Object.keys(reraPortals).map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium">RERA Number</label>
              <input value={reraNumber} onChange={e => setReraNumber(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300 transition-all" />
              <p className="text-[10px] text-slate-400 mt-1">Format: MahaRERA: P51900XXXXXX | KarnatakaRERA: PRM/KA/RERA/XXXX</p>
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium">Expiry Date</label>
              <div className="mt-1"><DatePickerField value={reraExpiry} onChange={setReraExpiry} /></div>
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium">Portal URL</label>
              <input value={portalUrl} readOnly className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 text-sm text-slate-400" />
            </div>
          </div>

          {/* QR Code */}
          <div className="la-card p-5 space-y-4">
            <h3 className="font-semibold text-slate-700 flex items-center gap-2"><QrCode size={16} className="text-teal-500" /> RERA QR Code</h3>
            <div className="flex justify-center">
              <img src={qrUrl} alt="RERA QR Code" className="w-48 h-48 rounded-2xl shadow-sm" />
            </div>
            <p className="text-xs text-slate-400 text-center">Scan to verify on {reraState} RERA portal</p>
            <a href={qrUrl} download="rera-qr.png" className="block w-full text-center py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity shadow-sm" style={{ background: 'linear-gradient(135deg, #0A7E8C, #086E7A)' }}>Download QR Code</a>
          </div>
        </div>

        {/* Stamp Duty Calculator */}
        <div className="la-card p-5 space-y-4">
          <h3 className="font-semibold text-slate-700 flex items-center gap-2"><IndianRupee size={16} className="text-teal-500" /> Stamp Duty & Registration Calculator</h3>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="text-xs text-slate-500 font-medium">State</label>
              <select value={sdState} onChange={e => setSdState(e.target.value)} className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 shadow-sm">
                {Object.keys(stampDutyRates).map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium">Property Value (₹)</label>
              <input type="number" value={sdValue} onChange={e => setSdValue(Number(e.target.value))} className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300 transition-all" />
            </div>
            <div>
              <label className="text-xs text-slate-500 font-medium">Buyer Gender</label>
              <select value={sdGender} onChange={e => setSdGender(e.target.value as 'male' | 'female')} className="w-full mt-1 px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 shadow-sm">
                <option value="male">Male</option><option value="female">Female / Joint</option>
              </select>
            </div>
          </div>
          {rates && (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-2">
              <div className="p-3 rounded-xl bg-slate-50"><p className="text-xs text-slate-400">Stamp Duty ({sdGender === 'female' ? rates.female : rates.male}%)</p><p className="text-lg font-bold text-slate-800">₹{stampDuty.toLocaleString('en-IN')}</p></div>
              <div className="p-3 rounded-xl bg-slate-50"><p className="text-xs text-slate-400">Registration ({rates.reg}%)</p><p className="text-lg font-bold text-slate-800">₹{regFee.toLocaleString('en-IN')}</p></div>
              {rates.extra && <div className="p-3 rounded-xl bg-slate-50"><p className="text-xs text-slate-400">{rates.extraLabel} ({rates.extra}%)</p><p className="text-lg font-bold text-slate-800">₹{extraCharge.toLocaleString('en-IN')}</p></div>}
              <div className="p-3 rounded-xl bg-teal-50"><p className="text-xs text-teal-600 font-medium">Total Govt Charges</p><p className="text-lg font-bold text-teal-700">₹{totalGovt.toLocaleString('en-IN')}</p></div>
            </div>
          )}
          <p className="text-[10px] text-slate-400">These are approximate figures. Consult a legal expert for final amounts.</p>
        </div>

        {/* E-Sign Stub */}
        <div className="la-card p-5 space-y-3">
          <h3 className="font-semibold text-slate-700 flex items-center gap-2"><FileSignature size={16} className="text-teal-500" /> E-Sign Agreement</h3>
          <div className="bg-amber-50 border border-amber-100 rounded-xl p-3">
            <p className="text-xs text-amber-700">Demo mode — In production this integrates with Digio (digio.in) or LeegAlity for Aadhaar OTP e-sign</p>
          </div>
          <button onClick={() => { setShowEsign(true); toast.success('Agreement sent for e-signature!'); }} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white hover:opacity-90 transition-opacity shadow-sm" style={{ background: 'linear-gradient(135deg, #0A7E8C, #086E7A)' }}>
            Send Agreement for Digital Signature
          </button>
          {showEsign && <p className="text-xs text-emerald-600 font-medium">✅ Agreement sent — Awaiting Aadhaar OTP signature</p>}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BuilderRERA;
