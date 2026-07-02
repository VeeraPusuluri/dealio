import { useEffect, useState } from 'react';
import { authApi, type DeviceSession } from '@/lib/api';
import { Monitor, Smartphone, Loader2, LogOut, ShieldCheck, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';

function timeAgo(iso: string): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const s = Math.max(1, Math.floor((Date.now() - t) / 1000));
  if (s < 60) return 'just now';
  const m = Math.floor(s / 60); if (m < 60) return `${m} min ago`;
  const h = Math.floor(m / 60); if (h < 24) return `${h} hr${h > 1 ? 's' : ''} ago`;
  const d = Math.floor(h / 24); if (d < 30) return `${d} day${d > 1 ? 's' : ''} ago`;
  return new Date(iso).toLocaleDateString();
}

const isMobileDevice = (name?: string | null) => /iphone|ipad|android|app/i.test(name || '');

interface Props {
  color?: string;
}

const LoggedInDevices = ({ color = '#0A7E8C' }: Props) => {
  const [sessions, setSessions] = useState<DeviceSession[] | null>(null);
  const [error, setError] = useState('');
  const [busyId, setBusyId] = useState<number | null>(null);
  const [busyAll, setBusyAll] = useState(false);

  const load = () => {
    setError('');
    authApi.listSessions()
      .then(setSessions)
      .catch((e: any) => { setError(e?.message || 'Failed to load devices'); setSessions([]); });
  };
  useEffect(load, []);

  const revoke = async (id: number) => {
    setBusyId(id);
    try {
      await authApi.revokeSession(id);
      setSessions((prev) => prev?.filter((s) => s.id !== id) ?? null);
      toast.success('Device signed out');
    } catch (e: any) {
      toast.error(e?.message || 'Could not sign out device');
    } finally { setBusyId(null); }
  };

  const revokeOthers = async () => {
    setBusyAll(true);
    try {
      const { count } = await authApi.revokeOtherSessions();
      setSessions((prev) => prev?.filter((s) => s.current) ?? null);
      toast.success(count > 0 ? `Signed out of ${count} other device${count === 1 ? '' : 's'}` : 'No other devices');
    } catch (e: any) {
      toast.error(e?.message || 'Could not sign out other devices');
    } finally { setBusyAll(false); }
  };

  const otherCount = sessions?.filter((s) => !s.current).length ?? 0;

  return (
    <div className="bg-card rounded-2xl border border-border p-5 space-y-4">
      <div className="flex items-center justify-between pb-3 border-b border-border">
        <div className="flex items-center gap-2">
          <ShieldCheck size={14} style={{ color }} />
          <h3 className="text-[13px] font-semibold text-card-foreground">Logged-in devices</h3>
        </div>
        <button onClick={load} title="Refresh" className="text-muted-foreground hover:text-card-foreground transition-colors">
          <RefreshCw size={13} />
        </button>
      </div>

      <p className="text-[13px] text-muted-foreground">
        These devices are currently signed in to your account. Sign out any you don't recognise.
      </p>

      {sessions === null ? (
        <div className="flex items-center gap-2 text-[13px] text-muted-foreground py-3">
          <Loader2 size={13} className="animate-spin" /> Loading devices…
        </div>
      ) : error ? (
        <p className="text-[13px] text-destructive">{error}</p>
      ) : sessions.length === 0 ? (
        <p className="text-[13px] text-muted-foreground py-2">No active sessions found.</p>
      ) : (
        <div className="space-y-2">
          {sessions.map((s) => {
            const Icon = isMobileDevice(s.deviceName) ? Smartphone : Monitor;
            return (
              <div key={s.id} className="flex items-center gap-3 p-3.5 rounded-xl border border-border bg-muted/20">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: color + '18' }}>
                  <Icon size={16} style={{ color }} />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[13px] font-semibold text-card-foreground truncate">{s.deviceName || 'Unknown device'}</span>
                    {s.current && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full text-white shrink-0" style={{ backgroundColor: color }}>
                        This device
                      </span>
                    )}
                  </div>
                  <div className="text-[11px] text-muted-foreground mt-0.5 truncate">
                    {s.ip ? `${s.ip} · ` : ''}Active {timeAgo(s.lastSeenAt)}
                  </div>
                </div>
                {s.current ? (
                  <span className="text-[11px] text-muted-foreground shrink-0">Current</span>
                ) : (
                  <button
                    onClick={() => revoke(s.id)}
                    disabled={busyId === s.id}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[12px] font-semibold text-destructive border border-destructive/30 hover:bg-destructive/10 transition-colors disabled:opacity-50 shrink-0"
                  >
                    {busyId === s.id ? <Loader2 size={12} className="animate-spin" /> : <LogOut size={12} />}
                    Sign out
                  </button>
                )}
              </div>
            );
          })}

          {otherCount > 0 && (
            <button
              onClick={revokeOthers}
              disabled={busyAll}
              className="w-full mt-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-[13px] font-semibold text-destructive border border-destructive/30 hover:bg-destructive/10 transition-colors disabled:opacity-50"
            >
              {busyAll ? <Loader2 size={13} className="animate-spin" /> : <LogOut size={13} />}
              Sign out of all other devices ({otherCount})
            </button>
          )}
        </div>
      )}
    </div>
  );
};

export default LoggedInDevices;
