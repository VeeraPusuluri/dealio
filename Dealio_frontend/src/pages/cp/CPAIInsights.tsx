import { useState } from 'react';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { aiLeadInsights } from '@/data/aiEngine';
import { Brain, Phone, MessageSquare, TrendingUp, Eye, Clock, Zap, ChevronDown, ChevronUp } from 'lucide-react';
import { toast } from 'sonner';

const scoreColor = (label: string) => {
  if (label === 'Hot') return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-300', bar: 'bg-red-500' };
  if (label === 'Warm') return { bg: 'bg-amber-100 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-300', bar: 'bg-amber-500' };
  return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-300', bar: 'bg-blue-500' };
};

const CPAIInsights = () => {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<'All' | 'Hot' | 'Warm' | 'Cold'>('All');

  const filtered = filter === 'All' ? aiLeadInsights : aiLeadInsights.filter(l => l.label === filter);
  const hotCount = aiLeadInsights.filter(l => l.label === 'Hot').length;
  const warmCount = aiLeadInsights.filter(l => l.label === 'Warm').length;
  const coldCount = aiLeadInsights.filter(l => l.label === 'Cold').length;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Brain size={24} className="text-primary" />
          <div>
            <h2 className="text-lg font-bold text-card-foreground">AI Lead Intelligence</h2>
            <p className="text-sm text-muted-foreground">Behaviour-based scoring: page views, response time, tour views</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Total Leads', value: aiLeadInsights.length, color: 'text-primary' },
            { label: 'Hot Leads', value: hotCount, color: 'text-red-600' },
            { label: 'Warm Leads', value: warmCount, color: 'text-amber-600' },
            { label: 'Cold Leads', value: coldCount, color: 'text-blue-600' },
          ].map(s => (
            <div key={s.label} className="bg-card rounded-lg p-4 border border-border">
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
            </div>
          ))}
        </div>

        <div className="flex gap-2">
          {(['All', 'Hot', 'Warm', 'Cold'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)} className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground hover:bg-muted/80'}`}>{f}</button>
          ))}
        </div>

        <div className="space-y-3">
          {filtered.map(lead => {
            const colors = scoreColor(lead.label);
            const expanded = expandedId === lead.leadId;
            return (
              <div key={lead.leadId} className="bg-card rounded-lg border border-border overflow-hidden">
                <div className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => setExpandedId(expanded ? null : lead.leadId)}>
                  <div className="flex-shrink-0">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center text-lg font-bold text-muted-foreground">{lead.leadName[0]}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-semibold text-card-foreground">{lead.leadName}</p>
                      <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${colors.bg} ${colors.text}`}>{lead.score} · {lead.label}</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">{lead.projectInterest} • Last contact: {lead.daysSinceContact}d ago</p>
                  </div>
                  <div className="w-24 flex-shrink-0">
                    <div className="w-full h-2 bg-muted rounded-full overflow-hidden"><div className={`h-full rounded-full ${colors.bar}`} style={{ width: `${lead.score}%` }} /></div>
                  </div>
                  {expanded ? <ChevronUp size={16} className="text-muted-foreground" /> : <ChevronDown size={16} className="text-muted-foreground" />}
                </div>

                {expanded && (
                  <div className="border-t border-border p-4 space-y-4 bg-muted/30">
                    <div className="bg-primary/10 rounded-lg p-3 flex items-start gap-2">
                      <Zap size={16} className="text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-xs font-semibold text-primary">Next Best Action</p>
                        <p className="text-sm text-card-foreground mt-0.5">{lead.nextBestAction}</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Eye size={14} /> {lead.pageViews} page views</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground"><TrendingUp size={14} /> {lead.tourViews} tour views</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Clock size={14} /> Response: {lead.responseTime}</div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground"><Phone size={14} /> {lead.phone}</div>
                    </div>
                    <div>
                      <p className="text-xs font-medium text-card-foreground mb-1.5">Behaviour Signals</p>
                      <div className="flex flex-wrap gap-1.5">{lead.signals.map((s, i) => <span key={i} className="text-[10px] px-2 py-1 rounded-full bg-muted text-muted-foreground">{s}</span>)}</div>
                    </div>
                    <div className="flex gap-2">
                      <button onClick={() => { window.open(`tel:${lead.phone}`); toast.success('Calling...'); }} className="px-4 py-2 rounded-lg bg-green-600 text-white text-xs font-semibold flex items-center gap-1 hover:bg-green-700"><Phone size={12} /> Call Now</button>
                      <button onClick={() => { window.open(`https://wa.me/91${lead.phone}`); }} className="px-4 py-2 rounded-lg bg-green-500 text-white text-xs font-semibold flex items-center gap-1 hover:bg-green-600"><MessageSquare size={12} /> WhatsApp</button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CPAIInsights;
