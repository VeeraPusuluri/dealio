import { useState, useEffect } from 'react';
import { useNotificationStore, Notification } from '@/stores/useNotificationStore';
import { X, Bell, CheckCheck, ArrowUpRight, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

/* ─── type config ─────────────────────────────────────────────────────────── */
const TYPE_META = {
  success: { label: 'Done',    accent: '#10b981', bar: '#10b981', glow: 'rgba(16,185,129,0.15)' },
  info:    { label: 'Info',    accent: '#0A7E8C', bar: '#0A7E8C', glow: 'rgba(10,126,140,0.15)' },
  warning: { label: 'Alert',   accent: '#f59e0b', bar: '#f59e0b', glow: 'rgba(245,158,11,0.15)' },
  error:   { label: 'Urgent',  accent: '#ef4444', bar: '#ef4444', glow: 'rgba(239,68,68,0.15)'  },
};

/* ─── time helpers ────────────────────────────────────────────────────────── */
function timeAgo(ts: string) {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (diff < 1)    return 'just now';
  if (diff < 60)   return `${diff}m`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h`;
  return `${Math.floor(diff / 1440)}d`;
}

function groupKey(ts: string): string {
  const now  = new Date();
  const date = new Date(ts);
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7)  return 'This week';
  return 'Earlier';
}

function groupNotifications(list: Notification[]) {
  const order = ['Today', 'Yesterday', 'This week', 'Earlier'];
  const map: Record<string, Notification[]> = {};
  for (const n of list) {
    const key = groupKey(n.timestamp);
    (map[key] ||= []).push(n);
  }
  return order.filter(k => map[k]).map(k => ({ label: k, items: map[k] }));
}

/* ─── component ───────────────────────────────────────────────────────────── */
const NotificationPanel = ({ onClose }: { onClose: () => void }) => {
  const { notifications, markAllRead, markRead, dismiss, clearAll } = useNotificationStore();
  const navigate = useNavigate();
  const [tab, setTab]           = useState<'all' | 'unread'>('all');
  const [mounted, setMounted]   = useState(false);
  const [leaving, setLeaving]   = useState(false);

  useEffect(() => { requestAnimationFrame(() => setMounted(true)); }, []);

  const close = () => {
    setLeaving(true);
    setTimeout(onClose, 260);
  };

  const handleClick = (id: string, link?: string) => {
    markRead(id);
    if (link) { navigate(link); close(); }
  };

  const unread   = notifications.filter(n => !n.read);
  const filtered = tab === 'unread' ? unread : notifications;
  const groups   = groupNotifications(filtered);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{
          background: 'rgba(0,0,0,0.25)',
          backdropFilter: 'blur(2px)',
          opacity: mounted && !leaving ? 1 : 0,
          transition: 'opacity 260ms ease',
        }}
        onClick={close}
      />

      {/* Panel */}
      <div
        style={{
          position: 'fixed',
          top: '60px',
          right: '12px',
          width: '400px',
          maxHeight: 'calc(100vh - 80px)',
          zIndex: 50,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: '20px',
          overflow: 'hidden',
          background: 'hsl(var(--card))',
          border: '1px solid hsl(var(--border))',
          boxShadow: '0 24px 64px -12px rgba(0,0,0,0.35), 0 0 0 1px rgba(255,255,255,0.04) inset',
          transform: mounted && !leaving ? 'translateY(0) scale(1)' : 'translateY(-10px) scale(0.97)',
          opacity: mounted && !leaving ? 1 : 0,
          transition: 'transform 280ms cubic-bezier(0.34,1.3,0.64,1), opacity 260ms ease',
        }}
      >
        {/* ── Header ── */}
        <div style={{
          padding: '18px 20px 14px',
          borderBottom: '1px solid hsl(var(--border))',
          background: 'linear-gradient(135deg, hsl(var(--card)) 0%, hsl(var(--muted)/0.3) 100%)',
          flexShrink: 0,
        }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <div style={{
                width: '32px', height: '32px', borderRadius: '10px',
                background: 'linear-gradient(135deg, hsl(var(--secondary)) 0%, hsl(var(--primary)) 100%)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(10,126,140,0.35)',
              }}>
                <Bell size={14} color="white" />
              </div>
              <div>
                <p style={{ fontSize: '14px', fontWeight: 700, color: 'hsl(var(--card-foreground))', lineHeight: 1 }}>
                  Notifications
                </p>
                {unread.length > 0 && (
                  <p style={{ fontSize: '11px', color: 'hsl(var(--muted-foreground))', marginTop: '2px' }}>
                    {unread.length} unread
                  </p>
                )}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              {unread.length > 0 && (
                <button
                  onClick={markAllRead}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '5px',
                    padding: '5px 10px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                    background: 'hsl(var(--muted))', color: 'hsl(var(--muted-foreground))',
                    fontSize: '11px', fontWeight: 600, transition: 'all 160ms',
                  }}
                  onMouseEnter={e => { (e.currentTarget as HTMLElement).style.color = 'hsl(var(--secondary))'; }}
                  onMouseLeave={e => { (e.currentTarget as HTMLElement).style.color = 'hsl(var(--muted-foreground))'; }}
                >
                  <CheckCheck size={11} />
                  All read
                </button>
              )}
              <button
                onClick={close}
                style={{
                  width: '30px', height: '30px', borderRadius: '8px', border: 'none', cursor: 'pointer',
                  background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: 'hsl(var(--muted-foreground))', transition: 'background 160ms',
                }}
                onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = 'hsl(var(--muted))'; }}
                onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                <X size={14} />
              </button>
            </div>
          </div>

          {/* Tabs */}
          <div style={{
            display: 'inline-flex', gap: '2px', padding: '3px',
            borderRadius: '10px', background: 'hsl(var(--muted))',
          }}>
            {(['all', 'unread'] as const).map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '5px 14px', borderRadius: '7px', border: 'none', cursor: 'pointer',
                  fontSize: '12px', fontWeight: 600, transition: 'all 180ms',
                  background: tab === t ? 'hsl(var(--card))' : 'transparent',
                  color: tab === t ? 'hsl(var(--card-foreground))' : 'hsl(var(--muted-foreground))',
                  boxShadow: tab === t ? '0 1px 4px rgba(0,0,0,0.12)' : 'none',
                  textTransform: 'capitalize',
                }}
              >
                {t === 'unread' && unread.length > 0 ? `Unread · ${unread.length}` : t === 'unread' ? 'Unread' : 'All'}
              </button>
            ))}
          </div>
        </div>

        {/* ── List ── */}
        <div style={{ flex: 1, overflowY: 'auto' }}>
          {groups.length === 0 ? (
            <EmptyState />
          ) : (
            groups.map(({ label, items }) => (
              <div key={label}>
                {/* Group label */}
                <div style={{
                  padding: '10px 20px 6px',
                  display: 'flex', alignItems: 'center', gap: '8px',
                  position: 'sticky', top: 0, zIndex: 2,
                  background: 'hsl(var(--card))',
                }}>
                  <span style={{ fontSize: '10px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'hsl(var(--muted-foreground))' }}>
                    {label}
                  </span>
                  <div style={{ flex: 1, height: '1px', background: 'hsl(var(--border))' }} />
                </div>

                {/* Items */}
                {items.map((n, i) => (
                  <NotifRow
                    key={n.id}
                    n={n}
                    index={i}
                    onDismiss={() => dismiss(n.id)}
                    onClick={() => handleClick(n.id, n.link)}
                  />
                ))}
              </div>
            ))
          )}
        </div>

        {/* ── Footer ── */}
        {notifications.length > 0 && (
          <div style={{
            borderTop: '1px solid hsl(var(--border))',
            padding: '12px 20px',
            flexShrink: 0,
            background: 'hsl(var(--muted)/0.3)',
          }}>
            <button
              onClick={() => { clearAll(); close(); }}
              style={{
                width: '100%', padding: '8px', borderRadius: '10px', border: '1px solid hsl(var(--border))',
                background: 'transparent', cursor: 'pointer', fontSize: '12px', fontWeight: 600,
                color: 'hsl(var(--muted-foreground))', transition: 'all 160ms',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              }}
              onMouseEnter={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.color = '#ef4444';
                el.style.borderColor = 'rgba(239,68,68,0.3)';
                el.style.background = 'rgba(239,68,68,0.05)';
              }}
              onMouseLeave={e => {
                const el = e.currentTarget as HTMLElement;
                el.style.color = 'hsl(var(--muted-foreground))';
                el.style.borderColor = 'hsl(var(--border))';
                el.style.background = 'transparent';
              }}
            >
              <X size={11} />
              Clear all
            </button>
          </div>
        )}
      </div>
    </>
  );
};

/* ─── Single row ──────────────────────────────────────────────────────────── */
const NotifRow = ({
  n, index, onDismiss, onClick,
}: { n: Notification; index: number; onDismiss: () => void; onClick: () => void }) => {
  const meta     = TYPE_META[n.type] ?? TYPE_META.info;
  const [hovered, setHovered] = useState(false);
  const [gone, setGone]       = useState(false);

  const dismiss = (e: React.MouseEvent) => {
    e.stopPropagation();
    setGone(true);
    setTimeout(onDismiss, 220);
  };

  return (
    <div
      style={{
        display: 'flex', alignItems: 'stretch',
        borderBottom: '1px solid hsl(var(--border))',
        background: hovered
          ? `linear-gradient(90deg, ${meta.glow} 0%, hsl(var(--muted)/0.3) 100%)`
          : n.read ? 'transparent' : `linear-gradient(90deg, ${meta.glow} 0%, transparent 60%)`,
        cursor: 'pointer',
        transition: 'all 220ms ease',
        overflow: 'hidden',
        maxHeight: gone ? '0px' : '120px',
        opacity: gone ? 0 : 1,
        animationDelay: `${index * 30}ms`,
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={onClick}
    >
      {/* Accent bar */}
      <div style={{
        width: hovered ? '4px' : n.read ? '2px' : '3px',
        background: n.read ? 'hsl(var(--border))' : meta.bar,
        flexShrink: 0,
        transition: 'all 220ms ease',
        boxShadow: !n.read && hovered ? `0 0 8px ${meta.bar}` : 'none',
      }} />

      {/* Content */}
      <div style={{ flex: 1, padding: '13px 14px 13px 12px', minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
          {/* Type pill */}
          <span style={{
            display: 'inline-block', padding: '2px 7px', borderRadius: '4px', flexShrink: 0,
            fontSize: '9px', fontWeight: 800, letterSpacing: '0.07em', textTransform: 'uppercase',
            color: meta.accent,
            background: `${meta.glow}`,
            border: `1px solid ${meta.accent}33`,
            marginTop: '1px',
          }}>
            {meta.label}
          </span>

          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <p style={{
                fontSize: '12.5px', fontWeight: n.read ? 500 : 700,
                color: 'hsl(var(--card-foreground))', lineHeight: 1.3,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
                flex: 1,
              }}>
                {n.title}
              </p>
              {!n.read && (
                <span style={{
                  width: '6px', height: '6px', borderRadius: '50%',
                  background: meta.accent, flexShrink: 0,
                  boxShadow: `0 0 6px ${meta.accent}`,
                }} />
              )}
            </div>

            <p style={{
              fontSize: '11.5px', color: 'hsl(var(--muted-foreground))',
              marginTop: '3px', lineHeight: 1.5,
              display: '-webkit-box', WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical', overflow: 'hidden',
            }}>
              {n.message}
            </p>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '6px' }}>
              <span style={{ fontSize: '10px', color: 'hsl(var(--muted-foreground)/0.7)', fontWeight: 500 }}>
                {timeAgo(n.timestamp)}
              </span>
              {n.link && (
                <span style={{
                  display: 'flex', alignItems: 'center', gap: '2px',
                  fontSize: '10px', fontWeight: 600, color: meta.accent,
                  opacity: hovered ? 1 : 0, transition: 'opacity 160ms',
                }}>
                  View <ArrowUpRight size={9} />
                </span>
              )}
            </div>
          </div>

          {/* Dismiss */}
          <button
            onClick={dismiss}
            style={{
              width: '24px', height: '24px', borderRadius: '6px', border: 'none', cursor: 'pointer',
              background: hovered ? 'hsl(var(--muted))' : 'transparent',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'hsl(var(--muted-foreground))', flexShrink: 0,
              opacity: hovered ? 1 : 0, transition: 'all 160ms',
            }}
          >
            <X size={11} />
          </button>
        </div>
      </div>
    </div>
  );
};

/* ─── Empty state ─────────────────────────────────────────────────────────── */
const EmptyState = () => (
  <div style={{
    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
    padding: '56px 32px', gap: '12px', textAlign: 'center',
  }}>
    <div style={{
      width: '56px', height: '56px', borderRadius: '16px',
      background: 'hsl(var(--muted))',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.08)',
    }}>
      <Sparkles size={22} style={{ color: 'hsl(var(--muted-foreground)/0.4)' }} />
    </div>
    <p style={{ fontSize: '14px', fontWeight: 700, color: 'hsl(var(--card-foreground))' }}>
      All clear
    </p>
    <p style={{ fontSize: '12px', color: 'hsl(var(--muted-foreground))', lineHeight: 1.6, maxWidth: '220px' }}>
      You're fully caught up. New activity from your team will appear here.
    </p>
  </div>
);

export default NotificationPanel;