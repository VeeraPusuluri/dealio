import { useState, useEffect, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import DashboardLayout from '@/components/layout/DashboardLayout';
import { cpApi } from '@/lib/api';
import { useAuthStore } from '@/stores/useAuthStore';
import { Clock, CalendarClock, Loader2, ChevronRight } from 'lucide-react';

import CPFollowUps from './CPFollowUps';
import CPMeetingRequests from './CPMeetingRequests';

type Tab = 'followups' | 'meetings';

const CPPipeline = () => {
  const { user } = useAuthStore();
  const [params, setParams] = useSearchParams();
  const initialTab = (params.get('tab') as Tab | null) ?? 'followups';
  const [tab, setTab] = useState<Tab>(initialTab);
  const [loading, setLoading] = useState(true);

  const [pendingFollowUps, setPendingFollowUps] = useState<number | null>(null);
  const [pendingMeetings,  setPendingMeetings]  = useState<number | null>(null);

  const refreshCounts = useCallback(async () => {
    if (!user?.id) return;
    setLoading(true);
    try {
      const [followUps, meetings] = await Promise.all([
        cpApi.getFollowUps(user.id),
        cpApi.getMeetings(user.id),
      ]);
      setPendingFollowUps(((followUps as Array<{ done: boolean }>) ?? []).filter(f => !f.done).length);
      setPendingMeetings(((meetings as Array<{ status: string }>) ?? []).filter(m => m.status === 'Pending').length);
    } catch { /* ignore */ }
    finally { setLoading(false); }
  }, [user?.id]);

  useEffect(() => { refreshCounts(); }, [refreshCounts]);

  const switchTab = (t: Tab) => {
    setTab(t);
    setParams({ tab: t }, { replace: true });
  };

  const TABS: { id: Tab; label: string; icon: React.ElementType; count: number | null; badge?: boolean }[] = [
    { id: 'followups', label: 'Follow Ups',       icon: Clock,         count: pendingFollowUps, badge: (pendingFollowUps ?? 0) > 0 },
    { id: 'meetings',  label: 'Meetings & Share', icon: CalendarClock, count: pendingMeetings,  badge: (pendingMeetings ?? 0) > 0 },
  ];

  return (
    <DashboardLayout>
      <div className="flex flex-col h-[calc(100vh-7rem)] gap-0">

        {/* ── Pipeline header ───────────────────────────────────────── */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div>
            <h2 className="text-[17px] font-bold text-foreground leading-tight">Pipeline</h2>
            <p className="text-[11px] text-muted-foreground mt-0.5">
              Follow Ups · Meetings & Share in one place
            </p>
          </div>
          {loading && (
            <Loader2 size={16} className="animate-spin text-muted-foreground" />
          )}
        </div>

        {/* ── Stats + Tab bar ───────────────────────────────────────── */}
        <div className="flex items-center gap-1 border-b border-border mb-4 flex-shrink-0">
          {TABS.map(t => {
            const Icon = t.icon;
            const isActive = tab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => switchTab(t.id)}
                className={`relative flex items-center gap-2 px-5 py-3 text-[13px] font-semibold border-b-2 -mb-px transition-all ${
                  isActive
                    ? 'border-[#0A7E8C] text-[#0A7E8C]'
                    : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground/30'
                }`}
              >
                <Icon size={14} />
                {t.label}
                {t.count !== null && (
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
                    isActive
                      ? 'bg-[#0A7E8C20] text-[#0A7E8C]'
                      : 'bg-muted text-muted-foreground'
                  }`}>
                    {t.count}
                  </span>
                )}
                {/* Pending items badge */}
                {t.badge && !isActive && (
                  <span className="absolute -top-0.5 right-2 w-2 h-2 rounded-full bg-red-500 border border-card" />
                )}
              </button>
            );
          })}

          {/* Quick-jump breadcrumb on right */}
          <div className="ml-auto flex items-center gap-1 text-[11px] text-muted-foreground pb-1">
            {TABS.filter(t => t.id !== tab).map(t => (
              <button key={t.id} onClick={() => switchTab(t.id)}
                className="flex items-center gap-1 px-2.5 py-1 rounded-lg hover:bg-muted transition-colors hover:text-foreground">
                <t.icon size={11} /> {t.label}
                <ChevronRight size={10} />
              </button>
            ))}
          </div>
        </div>

        {/* ── Tab panels — all mounted, only active is visible ─────── */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <div style={{ display: tab === 'followups' ? 'flex' : 'none', height: '100%', flexDirection: 'column', overflowY: 'auto' }}>
            <CPFollowUps embedded />
          </div>
          <div style={{ display: tab === 'meetings' ? 'flex' : 'none', height: '100%', flexDirection: 'column', overflowY: 'auto' }}>
            <CPMeetingRequests embedded />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default CPPipeline;
