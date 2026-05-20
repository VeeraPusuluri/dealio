import DashboardLayout from '@/components/layout/DashboardLayout';
import { socialAnalytics } from '@/data/socialMedia';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from 'recharts';
import { Instagram, Linkedin, MessageSquare, Facebook, TrendingUp, Users, Eye, Target } from 'lucide-react';

const platformIcons: Record<string, React.ElementType> = { Instagram: Instagram, Facebook: Facebook, LinkedIn: Linkedin, WhatsApp: MessageSquare };

const CPSocialAnalytics = () => {
  const totals = socialAnalytics.platforms.reduce((acc, p) => ({ reach: acc.reach + p.reach, leads: acc.leads + p.leads, engagement: acc.engagement + p.engagement, posts: acc.posts + p.posts }), { reach: 0, leads: 0, engagement: 0, posts: 0 });

  const stats = [
    { label: 'Total Reach', value: totals.reach.toLocaleString('en-IN'), icon: Eye, color: 'text-blue-600' },
    { label: 'Total Leads', value: totals.leads, icon: Users, color: 'text-green-600' },
    { label: 'Engagement', value: totals.engagement.toLocaleString('en-IN'), icon: TrendingUp, color: 'text-amber-600' },
    { label: 'Posts Published', value: totals.posts, icon: Target, color: 'text-purple-600' },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {stats.map(s => (
            <div key={s.label} className="bg-card rounded-lg p-4 border border-border">
              <div className="flex items-center gap-2 mb-1"><s.icon size={16} className={s.color} /><span className="text-xs text-muted-foreground">{s.label}</span></div>
              <p className="text-xl font-bold text-card-foreground">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-lg p-5 border border-border">
            <h3 className="font-semibold text-card-foreground mb-4">Platform Performance</h3>
            <div className="space-y-3">
              {socialAnalytics.platforms.map(p => {
                const Icon = platformIcons[p.name] || Target;
                return (
                  <div key={p.name} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                    <Icon size={20} className="text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-card-foreground">{p.name}</p>
                      <p className="text-xs text-muted-foreground">{p.posts} posts • {p.reach.toLocaleString('en-IN')} reach</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-card-foreground">{p.leads} leads</p>
                      <p className="text-xs text-green-600 font-medium">ROI: {p.roi}x</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-card rounded-lg p-5 border border-border">
            <h3 className="font-semibold text-card-foreground mb-4">Monthly Trend</h3>
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={socialAnalytics.monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="reach" stroke="hsl(var(--primary))" strokeWidth={2} name="Reach" />
                <Line type="monotone" dataKey="leads" stroke="hsl(var(--accent))" strokeWidth={2} name="Leads" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-card rounded-lg p-5 border border-border">
          <h3 className="font-semibold text-card-foreground mb-4">ROI: Leads → Commission</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={socialAnalytics.platforms}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis dataKey="name" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip />
              <Bar dataKey="leads" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Leads Generated" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CPSocialAnalytics;
