import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { projects } from '@/data/projects';
import { Send } from 'lucide-react';

const broadcasts = [
  { date: '2025-01-18', message: 'Prestige Skyline: Only 68 units left! 2.5% commission. Rush!', audience: 'All CPs', delivered: 2340, opened: 1820 },
  { date: '2025-01-15', message: 'Mahindra Happinest NEW LAUNCH! ₹38L onwards. 2% commission.', audience: 'Hyderabad CPs', delivered: 890, opened: 645 },
  { date: '2025-01-10', message: 'Sobha Meridian — Closing Soon! Last 22 units.', audience: 'Gold+ Tier', delivered: 420, opened: 380 },
];

const BuilderBroadcast = () => {
  const [message, setMessage] = useState('');

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="la-banner px-5 py-4">
          <h2 className="text-lg font-bold text-slate-800">Broadcast Messages</h2>
          <p className="text-xs text-slate-400 mt-0.5">Send targeted updates to channel partners</p>
        </div>

        <div className="la-card p-6 space-y-4">
          <h3 className="font-semibold text-slate-700 mb-1">Compose Broadcast</h3>
          <select className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300">
            <option>Select Project</option>
            {projects.map(p => <option key={p.id}>{p.name}</option>)}
          </select>
          <select className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm text-slate-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300">
            <option>All CPs</option><option>By City</option><option>By Tier</option><option>By Project</option>
          </select>
          <textarea
            value={message}
            onChange={e => setMessage(e.target.value)}
            rows={4}
            placeholder="Type your broadcast message..."
            className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-white text-sm resize-none text-slate-700 placeholder:text-slate-400 shadow-sm focus:outline-none focus:ring-2 focus:ring-teal-100 focus:border-teal-300"
          />
          <button className="px-6 py-2.5 rounded-xl text-sm font-semibold text-white inline-flex items-center gap-2 hover:opacity-90 transition-opacity shadow-sm" style={{ background: 'linear-gradient(135deg, #E87722, #d06010)' }}>
            <Send size={14} /> Send via WhatsApp + App
          </button>
        </div>

        <div className="la-card overflow-hidden">
          <div className="px-5 py-4 border-b border-slate-100">
            <h3 className="font-semibold text-slate-700">Broadcast History</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-slate-400 border-b border-slate-100 bg-slate-50/60">
                  <th className="px-5 py-3 font-medium">Date</th>
                  <th className="px-5 py-3 font-medium">Message</th>
                  <th className="px-5 py-3 font-medium">Audience</th>
                  <th className="px-5 py-3 font-medium text-right">Delivered</th>
                  <th className="px-5 py-3 font-medium text-right">Opened</th>
                </tr>
              </thead>
              <tbody>
                {broadcasts.map((b, i) => (
                  <tr key={i} className="border-b border-slate-100 last:border-0 hover:bg-slate-50/60 transition-colors">
                    <td className="px-5 py-3 text-slate-400 whitespace-nowrap">{b.date}</td>
                    <td className="px-5 py-3 text-slate-700 max-w-xs truncate">{b.message}</td>
                    <td className="px-5 py-3 text-slate-500">{b.audience}</td>
                    <td className="px-5 py-3 text-right text-slate-700">{b.delivered.toLocaleString()}</td>
                    <td className="px-5 py-3 text-right text-teal-600 font-medium">{b.opened.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default BuilderBroadcast;