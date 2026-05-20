import { useState, useMemo } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { nriProfiles } from '@/data/nriData';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

const cities = [
  { name: 'Hyderabad', avgSqft: 7200 },
  { name: 'Bengaluru', avgSqft: 9400 },
  { name: 'Mumbai', avgSqft: 18000 },
  { name: 'Pune', avgSqft: 6800 },
];

const NRICalculator = () => {
  const navigate = useNavigate();
  const profile = nriProfiles[0];

  const [monthlyIncome, setMonthlyIncome] = useState(profile.monthlyIncomeINR);
  const [monthlyExpenses, setMonthlyExpenses] = useState(350000);
  const [emiPayments, setEmiPayments] = useState(0);
  const [remittances, setRemittances] = useState(50000);
  const [goal, setGoal] = useState<'fund' | 'income' | 'both'>('fund');
  const [targetProperty, setTargetProperty] = useState(5000000);
  const [targetRent, setTargetRent] = useState(30000);
  const [alreadySaved, setAlreadySaved] = useState(0);

  const available = Math.max(0, monthlyIncome - monthlyExpenses - emiPayments - remittances);
  const availableColor = available > 50000 ? 'text-green-600' : available > 20000 ? 'text-amber-600' : 'text-red-600';

  const downPaymentNeeded = targetProperty * 0.2;
  const remaining = Math.max(0, downPaymentNeeded - alreadySaved);
  const monthsToTarget = available > 0 ? Math.ceil(remaining / available) : Infinity;

  const propertyForRent = Math.round(targetRent * 12 / 0.05);
  const monthsForRent = available > 0 ? Math.ceil(propertyForRent * 0.2 / available) : Infinity;

  const fdRate = 0.065;
  const accumulationData = useMemo(() => {
    return Array.from({ length: 13 }, (_, i) => {
      const cumulative = available * i;
      const fdInterest = i > 0 ? Math.round(cumulative * fdRate / 12 * i / 2) : 0;
      return { month: i === 0 ? 'Now' : `M${i}`, investment: available, cumulative, interest: fdInterest, total: cumulative + fdInterest };
    });
  }, [available]);

  // Also include the old ROI calculator inputs
  const [city, setCity] = useState('Hyderabad');
  const [sqft, setSqft] = useState(1800);
  const [downPct, setDownPct] = useState(25);
  const [loanRate, setLoanRate] = useState(8.65);
  const [tenure, setTenure] = useState(15);
  const [rentalYield, setRentalYield] = useState(4.8);
  const [appreciation, setAppreciation] = useState(8);
  const [holdYears, setHoldYears] = useState(5);
  const [tab, setTab] = useState<'monthly' | 'roi'>('monthly');

  const avgSqft = cities.find(c => c.name === city)?.avgSqft || 7200;
  const price = avgSqft * sqft;

  const roiResults = useMemo(() => {
    const down = price * downPct / 100;
    const loan = price - down;
    const mr = loanRate / 1200;
    const months = tenure * 12;
    const emi = loan > 0 ? loan * mr / (1 - Math.pow(1 + mr, -months)) : 0;
    const monthlyRent = price * rentalYield / 100 / 12;
    const totalRent = monthlyRent * 12 * holdYears;
    const futureValue = price * Math.pow(1 + appreciation / 100, holdYears);
    const capitalGain = futureValue - price;
    const totalReturn = totalRent + capitalGain;
    const cagr = (Math.pow((price + totalReturn) / price, 1 / holdYears) - 1) * 100;
    const emiPct = monthlyIncome > 0 ? (emi / monthlyIncome) * 100 : 0;
    const affordability = emiPct < 40 ? 'Comfortable' : emiPct < 55 ? 'Moderate' : 'High';
    const affordColor = emiPct < 40 ? 'text-green-600' : emiPct < 55 ? 'text-amber-600' : 'text-red-600';
    const chartData = Array.from({ length: holdYears + 1 }, (_, i) => ({
      year: `Yr ${i}`, property: Math.round(price * Math.pow(1 + appreciation / 100, i)),
      fd: Math.round(price * Math.pow(1.071, i)), savings: Math.round(price * Math.pow(1.032, i)),
    }));
    return { down, loan, emi, monthlyRent, totalRent, futureValue, capitalGain, totalReturn, cagr, emiPct, affordability, affordColor, chartData };
  }, [price, downPct, loanRate, tenure, rentalYield, appreciation, holdYears, monthlyIncome]);

  const fmt = (v: number) => v >= 10000000 ? `₹${(v / 10000000).toFixed(2)}Cr` : v >= 100000 ? `₹${(v / 100000).toFixed(1)}L` : `₹${v.toLocaleString('en-IN')}`;

  const Slider = ({ label, value, set, min, max, step, format }: any) => (
    <div>
      <div className="flex justify-between text-xs mb-1"><span className="text-muted-foreground">{label}</span><span className="font-medium">{format(value)}</span></div>
      <input type="range" min={min} max={max} step={step} value={value} onChange={e => set(Number(e.target.value))} className="w-full accent-[#F5A623]" />
    </div>
  );

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex gap-2">
          <button onClick={() => setTab('monthly')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'monthly' ? 'bg-[#0F2035] text-white' : 'bg-muted text-muted-foreground'}`}>Monthly Calculator</button>
          <button onClick={() => setTab('roi')} className={`px-4 py-2 rounded-lg text-sm font-medium ${tab === 'roi' ? 'bg-[#0F2035] text-white' : 'bg-muted text-muted-foreground'}`}>ROI Calculator</button>
        </div>

        {tab === 'monthly' && (
          <>
            <h2 className="text-xl font-bold">How much can you invest this month?</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card rounded-xl p-5 border space-y-4">
                <h3 className="font-semibold text-sm">Monthly Cash Flow</h3>
                <Slider label="Monthly Income (₹)" value={monthlyIncome} set={setMonthlyIncome} min={50000} max={1000000} step={10000} format={(v: number) => `₹${v.toLocaleString('en-IN')}`} />
                <Slider label="Monthly Expenses (₹)" value={monthlyExpenses} set={setMonthlyExpenses} min={20000} max={500000} step={10000} format={(v: number) => `₹${v.toLocaleString('en-IN')}`} />
                <Slider label="EMI / Loan Payments (₹)" value={emiPayments} set={setEmiPayments} min={0} max={200000} step={5000} format={(v: number) => `₹${v.toLocaleString('en-IN')}`} />
                <Slider label="Remittances to India (₹)" value={remittances} set={setRemittances} min={0} max={200000} step={5000} format={(v: number) => `₹${v.toLocaleString('en-IN')}`} />
                <div className={`p-3 rounded-lg border text-center ${available > 50000 ? 'bg-green-50 border-green-200' : available > 20000 ? 'bg-amber-50 border-amber-200' : 'bg-red-50 border-red-200'}`}>
                  <p className="text-xs text-muted-foreground">Available to invest</p>
                  <p className={`text-2xl font-bold ${availableColor}`}>₹{available.toLocaleString('en-IN')}</p>
                </div>

                <h3 className="font-semibold text-sm pt-2">What's your goal?</h3>
                <div className="grid grid-cols-3 gap-2">
                  {[{ k: 'fund' as const, l: '🏠 Property Fund' }, { k: 'income' as const, l: '💰 Passive Income' }, { k: 'both' as const, l: '⭐ Both' }].map(g => (
                    <button key={g.k} onClick={() => setGoal(g.k)} className={`p-2 rounded-lg text-xs font-medium border text-center ${goal === g.k ? 'bg-[#0F2035] text-white border-[#0F2035]' : 'text-muted-foreground'}`}>{g.l}</button>
                  ))}
                </div>

                {(goal === 'fund' || goal === 'both') && (
                  <>
                    <div><label className="text-xs text-muted-foreground">Target Property Value</label>
                      <select value={targetProperty} onChange={e => setTargetProperty(Number(e.target.value))} className="w-full mt-1 px-3 py-2 rounded-lg border text-sm bg-card">
                        {[3000000, 5000000, 7500000, 10000000, 15000000, 20000000].map(v => <option key={v} value={v}>{fmt(v)}</option>)}
                      </select>
                    </div>
                    <Slider label="Already Saved (₹)" value={alreadySaved} set={setAlreadySaved} min={0} max={5000000} step={50000} format={(v: number) => fmt(v)} />
                  </>
                )}
                {(goal === 'income' || goal === 'both') && (
                  <Slider label="Target Monthly Rental (₹)" value={targetRent} set={setTargetRent} min={5000} max={100000} step={5000} format={(v: number) => `₹${v.toLocaleString('en-IN')}`} />
                )}
              </div>

              <div className="space-y-4">
                {(goal === 'fund' || goal === 'both') && (
                  <div className="bg-card rounded-xl p-5 border">
                    <h3 className="font-semibold mb-2">Property Fund Progress</h3>
                    <p className="text-sm text-muted-foreground">Down payment needed: <strong>{fmt(downPaymentNeeded)}</strong> (20% of {fmt(targetProperty)})</p>
                    <p className="text-sm mt-1">At ₹{available.toLocaleString('en-IN')}/month → reach target in <strong className="text-[#F5A623]">{monthsToTarget === Infinity ? '∞' : `${monthsToTarget} months`}</strong></p>
                  </div>
                )}
                {(goal === 'income' || goal === 'both') && (
                  <div className="bg-card rounded-xl p-5 border">
                    <h3 className="font-semibold mb-2">Passive Income Goal</h3>
                    <p className="text-sm text-muted-foreground">To earn ₹{targetRent.toLocaleString('en-IN')}/month at 5% yield → need property worth <strong>{fmt(propertyForRent)}</strong></p>
                    <p className="text-sm mt-1">Achievable in <strong className="text-[#F5A623]">{monthsForRent === Infinity ? '∞' : `${monthsForRent} months`}</strong> at your savings rate</p>
                  </div>
                )}
                <div className="bg-card rounded-xl p-5 border h-64">
                  <h3 className="font-semibold mb-2 text-sm">12-Month Accumulation</h3>
                  <ResponsiveContainer width="100%" height="85%">
                    <AreaChart data={accumulationData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="month" fontSize={10} /><YAxis fontSize={10} tickFormatter={v => fmt(v)} />
                      <Tooltip formatter={(v: number) => `₹${v.toLocaleString('en-IN')}`} />
                      <Area type="monotone" dataKey="total" stroke="#F5A623" fill="#F5A62330" name="Total Corpus" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => navigate('/nri/invest')} className="flex-1 py-2 rounded-lg text-sm font-medium text-white bg-[#0F2035]">Park Idle Funds</button>
                  <button onClick={() => navigate('/nri/projects')} className="flex-1 py-2 rounded-lg text-sm font-medium text-white bg-teal-600">Browse Properties</button>
                  <button onClick={() => navigate('/nri/consultation')} className="flex-1 py-2 rounded-lg text-sm font-medium text-white" style={{ backgroundColor: '#F5A623' }}>Book Consultation</button>
                </div>
              </div>
            </div>
          </>
        )}

        {tab === 'roi' && (
          <>
            <h2 className="text-xl font-bold">Should you invest in Indian real estate? Find out.</h2>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
              <div className="lg:col-span-2 bg-card rounded-xl p-5 border space-y-4">
                <h3 className="font-semibold text-sm">Property</h3>
                <div><label className="text-xs text-muted-foreground">City</label>
                  <select value={city} onChange={e => setCity(e.target.value)} className="w-full px-3 py-2 rounded-lg border bg-card text-sm mt-1">
                    {cities.map(c => <option key={c.name}>{c.name} (₹{c.avgSqft.toLocaleString('en-IN')}/sqft)</option>)}
                  </select>
                </div>
                <Slider label="Size (sqft)" value={sqft} set={setSqft} min={800} max={4000} step={100} format={(v: number) => `${v} sqft`} />
                <div className="p-3 rounded-lg bg-muted/50 text-sm"><span className="text-muted-foreground">Est. Price: </span><span className="font-semibold">{fmt(price)}</span></div>
                <h3 className="font-semibold text-sm pt-2">Financing</h3>
                <Slider label="Down Payment %" value={downPct} set={setDownPct} min={20} max={50} step={5} format={(v: number) => `${v}%`} />
                <Slider label="Loan Rate %" value={loanRate} set={setLoanRate} min={8} max={10} step={0.1} format={(v: number) => `${v}%`} />
                <Slider label="Tenure (yrs)" value={tenure} set={setTenure} min={5} max={20} step={1} format={(v: number) => `${v}`} />
                <h3 className="font-semibold text-sm pt-2">Returns</h3>
                <Slider label="Rental Yield %" value={rentalYield} set={setRentalYield} min={3} max={8} step={0.2} format={(v: number) => `${v}%`} />
                <Slider label="Appreciation %/yr" value={appreciation} set={setAppreciation} min={5} max={15} step={1} format={(v: number) => `${v}%`} />
                <Slider label="Hold Period (yrs)" value={holdYears} set={setHoldYears} min={3} max={15} step={1} format={(v: number) => `${v}`} />
              </div>
              <div className="lg:col-span-3 space-y-4">
                <div className="bg-card rounded-xl p-5 border">
                  <h3 className="font-semibold mb-3">Affordability Check</h3>
                  <div className="grid grid-cols-3 gap-3 text-sm">
                    <div><p className="text-xs text-muted-foreground">Monthly EMI</p><p className="font-medium">{fmt(Math.round(roiResults.emi))}</p></div>
                    <div><p className="text-xs text-muted-foreground">Down Payment</p><p className="font-medium">{fmt(Math.round(roiResults.down))}</p></div>
                    <div><p className="text-xs text-muted-foreground">EMI/Income</p><p className={`font-bold ${roiResults.affordColor}`}>{roiResults.emiPct.toFixed(1)}% — {roiResults.affordability}</p></div>
                  </div>
                </div>
                <div className="bg-card rounded-xl p-5 border">
                  <h3 className="font-semibold mb-3">Returns Summary ({holdYears} years)</h3>
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Monthly Rent</p><p className="font-medium">{fmt(Math.round(roiResults.monthlyRent))}</p></div>
                    <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Total Rental</p><p className="font-medium">{fmt(Math.round(roiResults.totalRent))}</p></div>
                    <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Property Value</p><p className="font-medium">{fmt(Math.round(roiResults.futureValue))}</p></div>
                    <div className="p-3 rounded-lg bg-muted/50"><p className="text-xs text-muted-foreground">Capital Gain</p><p className="font-medium text-green-600">{fmt(Math.round(roiResults.capitalGain))}</p></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3 mt-3">
                    <div className="p-3 rounded-lg" style={{ backgroundColor: '#F5A62315' }}><p className="text-xs text-muted-foreground">Total Return</p><p className="text-lg font-bold" style={{ color: '#F5A623' }}>{fmt(Math.round(roiResults.totalReturn))}</p></div>
                    <div className="p-3 rounded-lg" style={{ backgroundColor: '#F5A62315' }}><p className="text-xs text-muted-foreground">CAGR</p><p className="text-lg font-bold" style={{ color: '#F5A623' }}>{roiResults.cagr.toFixed(1)}%</p></div>
                  </div>
                </div>
                <div className="bg-card rounded-xl p-5 border h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={roiResults.chartData}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="year" fontSize={12} /><YAxis fontSize={10} tickFormatter={v => fmt(v)} />
                      <Tooltip formatter={(v: number) => `₹${v.toLocaleString('en-IN')}`} />
                      <Area type="monotone" dataKey="property" stroke="#F5A623" fill="#F5A62330" name="Real Estate" />
                      <Area type="monotone" dataKey="fd" stroke="#0D9488" fill="#0D948830" name="Fixed Deposit" />
                      <Area type="monotone" dataKey="savings" stroke="#94a3b8" fill="#94a3b820" name="Savings" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default NRICalculator;
