import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { Progress } from '@/components/ui/progress';
import { formatCurrency, formatDate } from '@/lib/format';
import { Building2, Download, Calendar, MapPin, Compass, Maximize, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { customerApi } from '@/lib/api';

const constructionStages = ['Foundation', 'Structure', 'Brickwork', 'Plumbing & Electrical', 'Finishing', 'Ready'];
const currentStageIndex = 3;
const amenities = ['Swimming Pool', 'Gymnasium', 'Clubhouse', "Children's Play Area", 'Jogging Track', 'Indoor Games', 'Party Hall', 'Landscaped Gardens', '24/7 Security', 'Power Backup'];
const payments = [
  { stage: 'Booking Amount (10%)', amount: 2200000, status: 'Paid', date: '2024-12-28' },
  { stage: 'Foundation (20%)', amount: 4400000, status: 'Paid', date: '2025-02-15' },
  { stage: 'Structure (25%)', amount: 5500000, status: 'Due', date: '2025-04-30' },
  { stage: 'Pre-handover (25%)', amount: 5500000, status: 'Upcoming', date: '2025-07-15' },
  { stage: 'On Possession (20%)', amount: 4400000, status: 'Upcoming', date: '2025-09-30' },
];
const totalCost = 22000000;
const paid = payments.filter(p => p.status === 'Paid').reduce((s, p) => s + p.amount, 0);

const statusBadge = (s: string) => {
  if (s === 'Paid') return 'bg-emerald-100 text-emerald-700';
  if (s === 'Due') return 'bg-amber-100 text-amber-700';
  return 'bg-gray-100 text-gray-500';
};

const CustomerProperty = () => {
  const navigate = useNavigate();
  const [projectDetail, setProjectDetail] = useState<{ id: number; builderId: number; builderName: string; name: string; city: string } | null>(null);

  useEffect(() => {
    customerApi.getProject('P003')
      .then(data => {
        const d = data as any;
        setProjectDetail({ id: d.id, builderId: d.builderId, builderName: d.builderName, name: d.name, city: d.city });
      })
      .catch(() => {});
  }, []);

  const handleScheduleVisit = () => {
    if (projectDetail) {
      navigate('/customer/meeting', { state: { projectId: projectDetail.id, builderId: projectDetail.builderId, builderName: projectDetail.builderName, projectName: projectDetail.name, city: projectDetail.city } });
    } else {
      navigate('/customer/meeting');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-5 pb-8">

        {/* Property Header */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-start justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-xl font-bold text-gray-900">My Home Avatar — 4BHK</h1>
              <div className="flex items-center gap-1 text-sm text-gray-500 mt-1">
                <MapPin size={13} className="text-secondary shrink-0" />
                Tower C, Unit 1204 · Floor 12 · Tellapur, Hyderabad
              </div>
              <div className="flex flex-wrap gap-4 mt-3 text-sm text-gray-500">
                <span className="flex items-center gap-1.5"><Maximize size={13} className="text-gray-400" /> 2,400 sqft</span>
                <span className="flex items-center gap-1.5"><Compass size={13} className="text-gray-400" /> East Facing</span>
                <span className="flex items-center gap-1.5"><Building2 size={13} className="text-gray-400" /> My Home Group</span>
              </div>
            </div>
            <span className="bg-emerald-100 text-emerald-700 rounded-full px-3 py-1 text-xs font-semibold">Booked</span>
          </div>
        </div>

        {/* Key Dates */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: 'Booking Date', value: '28 Dec 2024', icon: Calendar },
            { label: 'Expected Possession', value: 'Sep 2025', icon: Building2 },
            { label: 'Registration Date', value: 'Pending', icon: CheckCircle2 },
          ].map(d => (
            <div key={d.label} className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: '#16A34A18' }}>
                <d.icon size={18} style={{ color: '#16A34A' }} />
              </div>
              <div>
                <p className="text-xs text-gray-400">{d.label}</p>
                <p className="text-sm font-semibold text-gray-900">{d.value}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Payment Summary */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-4">Payment Summary</h3>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-4">
            <div><p className="text-xs text-gray-400">Total Cost</p><p className="text-lg font-bold text-gray-900">{formatCurrency(totalCost)}</p></div>
            <div><p className="text-xs text-gray-400">Amount Paid</p><p className="text-lg font-bold text-emerald-600">{formatCurrency(paid)}</p></div>
            <div><p className="text-xs text-gray-400">Balance Due</p><p className="text-lg font-bold text-red-500">{formatCurrency(totalCost - paid)}</p></div>
            <div><p className="text-xs text-gray-400">Next Due</p><p className="text-sm font-semibold text-gray-900">{formatCurrency(5500000)} by 30 Apr</p></div>
          </div>
          <div className="flex items-center gap-3 mb-5">
            <Progress value={(paid / totalCost) * 100} className="h-2 flex-1" />
            <span className="text-sm font-semibold text-gray-900">{Math.round((paid / totalCost) * 100)}%</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b border-gray-100 text-xs text-gray-400">
                <th className="p-2 text-left font-medium">Stage</th>
                <th className="p-2 text-left font-medium">Amount</th>
                <th className="p-2 text-left font-medium">Status</th>
                <th className="p-2 text-left font-medium">Date</th>
              </tr></thead>
              <tbody>
                {payments.map((p, i) => (
                  <tr key={i} className="border-b border-gray-50 last:border-0">
                    <td className="p-2 font-medium text-gray-900">{p.stage}</td>
                    <td className="p-2 text-gray-700">{formatCurrency(p.amount)}</td>
                    <td className="p-2"><span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${statusBadge(p.status)}`}>{p.status}</span></td>
                    <td className="p-2 text-gray-400">{formatDate(p.date)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Construction Progress */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-1">Construction Progress</h3>
          <p className="text-xs text-gray-400 mb-4">Current Stage: {constructionStages[currentStageIndex]} — {Math.round(((currentStageIndex + 0.6) / constructionStages.length) * 100)}% Complete</p>
          <Progress value={((currentStageIndex + 0.6) / constructionStages.length) * 100} className="h-2 mb-5" />
          <div className="flex justify-between">
            {constructionStages.map((stage, i) => (
              <div key={stage} className="flex flex-col items-center flex-1">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${i <= currentStageIndex ? 'text-white' : 'bg-gray-100 text-gray-400'}`}
                  style={i <= currentStageIndex ? { backgroundColor: '#16A34A' } : {}}>
                  {i < currentStageIndex ? '✓' : i + 1}
                </div>
                <span className="text-[10px] text-gray-400 mt-1 text-center leading-tight">{stage}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Amenities */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
          <h3 className="text-base font-semibold text-gray-900 mb-3">Amenities</h3>
          <div className="flex flex-wrap gap-2">
            {amenities.map(a => (
              <span key={a} className="px-3 py-1.5 rounded-full text-xs font-medium bg-gray-50 border border-gray-100 text-gray-700 flex items-center gap-1">
                <CheckCircle2 size={11} style={{ color: '#16A34A' }} /> {a}
              </span>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-wrap gap-3">
          <button onClick={() => toast.success('Allotment letter downloaded')} className="px-5 py-2.5 rounded-xl text-sm font-semibold text-white flex items-center gap-2 hover:opacity-90" style={{ background: 'linear-gradient(135deg, #16A34A, #14B040)' }}>
            <Download size={15} /> Download Allotment Letter
          </button>
          <button onClick={handleScheduleVisit} className="px-5 py-2.5 rounded-xl text-sm font-semibold border border-gray-200 text-gray-700 flex items-center gap-2 hover:bg-gray-50 transition-colors">
            <Calendar size={15} /> Schedule a Visit
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CustomerProperty;