import { useState, useMemo } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { useNRIStore } from '@/stores/useNRIStore';
import { projects } from '@/data/projects';
import { formatDualPrice } from '@/lib/nriUtils';
import { Heart, Calendar, Shield, PlayCircle, MapPin, MessageCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { toast } from 'sonner';

const NRIProjectDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { currency, shortlisted, toggleShortlist } = useNRIStore();
  const project = projects.find(p => p.id === id);
  const [tab, setTab] = useState('overview');

  // ROI Calculator state
  const [price, setPrice] = useState(project?.priceRange[0] || 10000000);
  const [downPct, setDownPct] = useState(25);
  const [rate, setRate] = useState(8.65);
  const [tenure, setTenure] = useState(15);
  const [rent, setRent] = useState(Math.round((project?.priceRange[0] || 10000000) * 0.0033));
  const [appreciation, setAppreciation] = useState(8);
  const [holdYears, setHoldYears] = useState(5);

  const roi = useMemo(() => {
    const down = price * downPct / 100;
    const loan = price - down;
    const monthlyRate = rate / 1200;
    const months = tenure * 12;
    const emi = loan * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months));
    const totalInterest = emi * months - loan;
    const annualRent = rent * 12;
    const totalRent = annualRent * holdYears;
    const futureValue = price * Math.pow(1 + appreciation / 100, holdYears);
    const capitalGain = futureValue - price;
    const totalReturn = totalRent + capitalGain;
    const cagr = (Math.pow((price + totalReturn) / price, 1 / holdYears) - 1) * 100;
    const returnVsDown = totalReturn / down;

    const chartData = Array.from({ length: holdYears }, (_, i) => ({
      year: `Yr ${i + 1}`,
      rent: annualRent,
      appreciation: Math.round(price * Math.pow(1 + appreciation / 100, i + 1) - price * Math.pow(1 + appreciation / 100, i)),
    }));

    return { down, loan, emi, totalInterest, annualRent, totalRent, futureValue, capitalGain, totalReturn, cagr, returnVsDown, chartData };
  }, [price, downPct, rate, tenure, rent, appreciation, holdYears]);

  if (!project) return <DashboardLayout><p>Project not found</p></DashboardLayout>;

  const isShortlisted = shortlisted.includes(project.id);
  const tabs = ['overview', 'roi', 'legal', 'tour'];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Hero */}
        <div className="relative rounded-xl overflow-hidden h-56 md:h-72">
          <img src={project.image} alt={project.name} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
          <div className="absolute bottom-4 left-4 right-4 flex items-end justify-between">
            <div className="text-white">
              <h1 className="text-2xl font-bold">{project.name}</h1>
              <p className="text-sm opacity-80">{project.builder} · <MapPin size={12} className="inline" /> {project.location}, {project.city}</p>
              <p className="text-xs opacity-60 mt-1">RERA: {project.rera}</p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { toggleShortlist(project.id); toast(isShortlisted ? 'Removed' : 'Shortlisted!'); }}
                className="p-2 rounded-full bg-white/20 backdrop-blur">
                <Heart size={18} fill={isShortlisted ? '#F5A623' : 'none'} color="white" />
              </button>
              <a href="https://wa.me/919876543210" target="_blank" className="p-2 rounded-full bg-green-500/80 backdrop-blur">
                <MessageCircle size={18} color="white" />
              </a>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-lg p-1">
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)}
              className={`flex-1 py-2 text-sm font-medium rounded-md capitalize transition-colors ${tab === t ? 'bg-card text-card-foreground shadow-sm' : 'text-muted-foreground'}`}>
              {t === 'roi' ? 'ROI Calculator' : t === 'tour' ? 'Virtual Tour' : t}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="bg-card rounded-xl p-5 border">
              <h3 className="font-semibold mb-3">Unit Configurations</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead><tr className="border-b text-muted-foreground"><th className="p-2 text-left">Type</th><th className="p-2 text-left">Price</th><th className="p-2 text-left">Available</th></tr></thead>
                  <tbody>
                    {project.bhkTypes.map((t, i) => (
                      <tr key={t} className="border-b"><td className="p-2 font-medium">{t}</td>
                        <td className="p-2">{formatDualPrice(project.priceRange[0] + i * 2000000, currency)}</td>
                        <td className="p-2">{Math.round(project.available / project.bhkTypes.length)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
            <div className="bg-card rounded-xl p-5 border">
              <h3 className="font-semibold mb-3">Amenities</h3>
              <div className="flex flex-wrap gap-2">
                {project.amenities.map(a => <Badge key={a} variant="secondary" className="text-xs">{a}</Badge>)}
              </div>
              <div className="mt-4 pt-4 border-t text-sm space-y-2">
                <div className="flex justify-between"><span className="text-muted-foreground">Status</span><Badge style={{ backgroundColor: '#0D9488', color: 'white' }}>{project.status}</Badge></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Possession</span><span>{project.possessionDate}</span></div>
                <div className="flex justify-between"><span className="text-muted-foreground">Total Units</span><span>{project.totalUnits}</span></div>
              </div>
            </div>
          </div>
        )}

        {tab === 'roi' && (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <div className="lg:col-span-2 bg-card rounded-xl p-5 border space-y-4">
              <h3 className="font-semibold">Investment Inputs</h3>
              {[
                { label: 'Purchase Price', value: price, set: setPrice, min: 5000000, max: 30000000, step: 500000, fmt: (v: number) => formatDualPrice(v, currency) },
                { label: 'Down Payment %', value: downPct, set: setDownPct, min: 20, max: 50, step: 5, fmt: (v: number) => `${v}%` },
                { label: 'Loan Rate %', value: rate, set: setRate, min: 8, max: 10, step: 0.1, fmt: (v: number) => `${v}%` },
                { label: 'Tenure (years)', value: tenure, set: setTenure, min: 5, max: 20, step: 1, fmt: (v: number) => `${v} yrs` },
                { label: 'Monthly Rent', value: rent, set: setRent, min: 10000, max: 200000, step: 5000, fmt: (v: number) => formatDualPrice(v, currency) },
                { label: 'Appreciation %/yr', value: appreciation, set: setAppreciation, min: 5, max: 15, step: 1, fmt: (v: number) => `${v}%` },
                { label: 'Hold (years)', value: holdYears, set: setHoldYears, min: 3, max: 15, step: 1, fmt: (v: number) => `${v} yrs` },
              ].map(s => (
                <div key={s.label}>
                  <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">{s.label}</span><span className="font-medium">{s.fmt(s.value)}</span></div>
                  <input type="range" min={s.min} max={s.max} step={s.step} value={s.value}
                    onChange={e => s.set(Number(e.target.value))} className="w-full accent-[#F5A623]" />
                </div>
              ))}
            </div>

            <div className="lg:col-span-3 space-y-4">
              <div className="bg-card rounded-xl p-5 border">
                <h3 className="font-semibold mb-4">Returns Estimate</h3>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Down Payment</p><p className="font-semibold">{formatDualPrice(roi.down, currency)}</p></div>
                  <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Monthly EMI</p><p className="font-semibold">{formatDualPrice(Math.round(roi.emi), currency)}</p></div>
                  <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Total Rental ({holdYears}yr)</p><p className="font-semibold">{formatDualPrice(roi.totalRent, currency)}</p></div>
                  <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Capital Gain</p><p className="font-semibold text-green-600">{formatDualPrice(Math.round(roi.capitalGain), currency)}</p></div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: '#F5A62315' }}><p className="text-xs text-muted-foreground">Total Return</p><p className="font-bold text-lg" style={{ color: '#F5A623' }}>{formatDualPrice(Math.round(roi.totalReturn), currency)}</p></div>
                  <div className="p-3 rounded-lg" style={{ backgroundColor: '#F5A62315' }}><p className="text-xs text-muted-foreground">CAGR</p><p className="font-bold text-lg" style={{ color: '#F5A623' }}>{roi.cagr.toFixed(1)}%</p></div>
                </div>
                <p className="text-xs text-green-600 mt-3 font-medium">✅ Beats UAE savings rate (3.2%) by {(roi.cagr - 3.2).toFixed(1)}%</p>
              </div>
              <div className="bg-card rounded-xl p-5 border h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={roi.chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="year" fontSize={12} /><YAxis fontSize={12} tickFormatter={v => `₹${(v / 100000).toFixed(0)}L`} />
                    <Tooltip formatter={(v: number) => `₹${v.toLocaleString('en-IN')}`} /><Bar dataKey="rent" stackId="a" fill="#0D9488" name="Rental" /><Bar dataKey="appreciation" stackId="a" fill="#F5A623" name="Appreciation" /></BarChart>
                </ResponsiveContainer>
              </div>
              <button onClick={() => navigate('/nri/consultation')} className="w-full py-3 rounded-lg text-white font-semibold text-sm" style={{ backgroundColor: '#F5A623' }}>
                Schedule Consultation to Discuss This Investment
              </button>
            </div>
          </div>
        )}

        {tab === 'legal' && (
          <div className="bg-card rounded-xl p-6 border space-y-4">
            <h3 className="font-semibold">Legal & RERA Compliance</h3>
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: 'RERA Registered', ok: true },
                { label: 'Title Clear', ok: true },
                { label: 'Encumbrance Clear', ok: true },
                { label: 'OC Received', ok: false, note: 'Under Construction' },
              ].map(item => (
                <div key={item.label} className="flex items-center gap-2 p-3 rounded-lg bg-muted/50">
                  <span className={item.ok ? 'text-green-500' : 'text-amber-500'}>{item.ok ? '✅' : '⏳'}</span>
                  <span className="text-sm">{item.label}</span>
                  {item.note && <span className="text-xs text-muted-foreground ml-auto">{item.note}</span>}
                </div>
              ))}
            </div>
            <h4 className="font-medium mt-4">NRI Safe Checklist</h4>
            <div className="grid grid-cols-2 gap-4">
              {['Can NRIs buy?', 'NRE payment accepted', 'POA allowed', 'Loan available'].map(c => (
                <div key={c} className="flex items-center gap-2 p-3 rounded-lg bg-green-50 dark:bg-green-950/20">
                  <span className="text-green-500">✅</span><span className="text-sm">{c}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {tab === 'tour' && (
          <div className="bg-card rounded-xl p-6 border space-y-4">
            <div className="aspect-video bg-muted rounded-lg flex items-center justify-center">
              <div className="text-center">
                <PlayCircle size={48} className="mx-auto text-muted-foreground" />
                <p className="text-sm text-muted-foreground mt-2">Virtual Tour Video</p>
              </div>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <p className="text-sm text-muted-foreground">Can't watch now? Book a live guided virtual tour with Ravi Kumar</p>
              <button onClick={() => navigate('/nri/consultation')} className="px-4 py-2 rounded-lg text-white text-sm font-medium" style={{ backgroundColor: '#0D9488' }}>Book Call</button>
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default NRIProjectDetail;
