import { useState, useEffect } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { nriCountries } from '@/data/nriData';
import { Globe, Video, FileText, CheckCircle2, Circle, TrendingUp, Home, Wallet, DollarSign } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';

const NRIDashboard = () => {
  const navigate   = useNavigate();
  const { user }   = useAuthStore();
  // Fall back to first country for local time display (can be personalised later)
  const country    = nriCountries[0];
  const [localTime, setLocalTime] = useState('');

  useEffect(() => {
    const update = () => {
      const now = new Date();
      const utc = now.getTime() + now.getTimezoneOffset() * 60000;
      const local = new Date(utc + country.offset * 3600000);
      setLocalTime(local.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true }));
    };
    update();
    const i = setInterval(update, 60000);
    return () => clearInterval(i);
  }, [country.offset]);

  const actions = [
    { label: 'Complete profile', done: true },
    { label: 'Upload POA', done: true },
    { label: 'Upload income documents', done: true },
    { label: 'Book video consultation with Ravi Kumar', done: false, action: () => navigate('/nri/consultation'), cta: 'Book Now' },
    { label: 'Apply for NRI home loan', done: false, action: () => navigate('/nri/loan'), cta: 'Apply' },
  ];

  const activities = [
    { text: 'Document verified: PAN Card', time: '2 hours ago', icon: FileText },
    { text: 'Consultation completed with Ravi Kumar', time: 'Jan 15', icon: Video },
    { text: 'Rent received from Rajesh Kumar', time: 'Jan 1', icon: DollarSign },
    { text: 'POA uploaded and verified', time: 'Jan 8', icon: FileText },
    { text: 'Profile created on Dealio', time: 'Jan 5', icon: Globe },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Welcome Banner */}
        <div className="rounded-xl p-6 text-white" style={{ background: 'linear-gradient(135deg, #0F2035 0%, #1B3A5C 100%)' }}>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold">Welcome, {user?.name ?? 'NRI Investor'}! 🌍</h2>
              <p className="text-white/70 mt-1">Your NRI property investment dashboard</p>
            </div>
            <div className="text-right text-sm text-white/60">
              <p>{country.flag} {country.timezone} · {localTime}</p>
            </div>
          </div>
        </div>

        {/* 3 Quick Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl p-4 border cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/nri/property')} style={{ borderColor: '#0D948840' }}>
            <div className="flex items-center gap-2"><Home size={18} className="text-teal-600" /><span className="text-xs text-muted-foreground">My Properties</span></div>
            <p className="text-2xl font-bold mt-1">1 owned</p>
          </div>
          <div className="bg-card rounded-xl p-4 border cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/nri/calculator')} style={{ borderColor: '#F5A62340' }}>
            <div className="flex items-center gap-2"><Wallet size={18} style={{ color: '#F5A623' }} /><span className="text-xs text-muted-foreground">Monthly Investment Target</span></div>
            <p className="text-2xl font-bold mt-1" style={{ color: '#F5A623' }}>₹45,000</p>
          </div>
          <div className="bg-card rounded-xl p-4 border cursor-pointer hover:shadow-md transition-shadow" onClick={() => navigate('/nri/manage')} style={{ borderColor: '#16A34A40' }}>
            <div className="flex items-center gap-2"><DollarSign size={18} className="text-green-600" /><span className="text-xs text-muted-foreground">Rental Income This Month</span></div>
            <p className="text-2xl font-bold mt-1 text-green-600">—</p>
          </div>
        </div>

        {/* 3 Pillar Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl p-5 border cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftWidth: 4, borderLeftColor: '#0D9488' }} onClick={() => navigate('/nri/projects')}>
            <h3 className="font-bold text-teal-700 flex items-center gap-2">🏠 BUY</h3>
            <p className="text-sm text-muted-foreground mt-2">Find your next property in India. 6 active projects available.</p>
            <button className="mt-3 text-xs px-3 py-1.5 rounded-lg text-white font-medium bg-teal-600">Browse Projects</button>
          </div>
          <div className="bg-card rounded-xl p-5 border cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftWidth: 4, borderLeftColor: '#0F2035' }} onClick={() => navigate('/nri/manage')}>
            <h3 className="font-bold text-[#0F2035] flex items-center gap-2">🏗️ MANAGE</h3>
            <p className="text-sm text-muted-foreground mt-2">Your property at My Home Avatar is tenanted. Rent due in 8 days.</p>
            <button className="mt-3 text-xs px-3 py-1.5 rounded-lg text-white font-medium bg-[#0F2035]">Manage Property</button>
          </div>
          <div className="bg-card rounded-xl p-5 border cursor-pointer hover:shadow-md transition-shadow" style={{ borderLeftWidth: 4, borderLeftColor: '#F5A623' }} onClick={() => navigate('/nri/invest')}>
            <h3 className="font-bold flex items-center gap-2" style={{ color: '#F5A623' }}>📈 INVEST</h3>
            <p className="text-sm text-muted-foreground mt-2">You have ₹45,000 idle this month. Put it to work.</p>
            <button className="mt-3 text-xs px-3 py-1.5 rounded-lg text-white font-medium" style={{ backgroundColor: '#F5A623' }}>See Opportunities</button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Actions */}
          <div className="bg-card rounded-xl p-5 border">
            <h3 className="font-semibold mb-4">Upcoming Actions</h3>
            <div className="space-y-2">
              {actions.map((a, i) => (
                <div key={i} className="flex items-center gap-3 py-2">
                  {a.done ? <CheckCircle2 size={16} className="text-green-500 flex-shrink-0" /> : <Circle size={16} className="text-muted-foreground flex-shrink-0" />}
                  <span className={`text-sm flex-1 ${a.done ? 'text-muted-foreground line-through' : 'text-card-foreground'}`}>{a.label}</span>
                  {!a.done && a.cta && (
                    <button onClick={a.action} className="text-xs px-3 py-1 rounded-md text-white font-medium" style={{ backgroundColor: '#F5A623' }}>{a.cta}</button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-card rounded-xl p-5 border">
            <h3 className="font-semibold mb-4">Recent Activity</h3>
            <div className="space-y-3">
              {activities.map((a, i) => (
                <div key={i} className="flex items-start gap-3">
                  <a.icon size={16} className="text-muted-foreground mt-0.5 flex-shrink-0" />
                  <div><p className="text-sm">{a.text}</p><p className="text-xs text-muted-foreground">{a.time}</p></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default NRIDashboard;
