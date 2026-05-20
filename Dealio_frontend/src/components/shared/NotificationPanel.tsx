import { useNotificationStore } from '@/stores/useNotificationStore';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  X, Bell, CheckCheck, Building2, Calendar, CheckCircle2,
  AlertTriangle, XCircle, MessageSquare, ArrowRight, Info,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const TYPE_META = {
  success: { icon: CheckCircle2, bg: 'bg-green-100',  text: 'text-green-600',  dot: 'bg-green-500' },
  info:    { icon: Info,         bg: 'bg-blue-100',   text: 'text-blue-600',   dot: 'bg-blue-500' },
  warning: { icon: AlertTriangle,bg: 'bg-amber-100',  text: 'text-amber-600',  dot: 'bg-amber-500' },
  error:   { icon: XCircle,      bg: 'bg-red-100',    text: 'text-red-600',    dot: 'bg-red-500' },
};

function timeAgo(ts: string) {
  const diff = Math.floor((Date.now() - new Date(ts).getTime()) / 60000);
  if (diff < 1)   return 'Just now';
  if (diff < 60)  return `${diff}m ago`;
  if (diff < 1440) return `${Math.floor(diff / 60)}h ago`;
  return `${Math.floor(diff / 1440)}d ago`;
}

const NotificationPanel = ({ onClose }: { onClose: () => void }) => {
  const { notifications, markAllRead, markRead, dismiss } = useNotificationStore();
  const navigate = useNavigate();

  const handleClick = (id: string, link?: string) => {
    markRead(id);
    if (link) { navigate(link); onClose(); }
  };

  const unread = notifications.filter(n => !n.read).length;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0" onClick={onClose} />
      <div className="absolute right-4 top-16 w-96 max-h-[75vh] bg-card rounded-2xl shadow-2xl border border-border flex flex-col animate-slide-up overflow-hidden">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border flex-shrink-0">
          <div className="flex items-center gap-2">
            <Bell size={16} className="text-secondary" />
            <h3 className="font-bold text-card-foreground text-sm">Notifications</h3>
            {unread > 0 && (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-destructive text-white">{unread}</span>
            )}
          </div>
          <div className="flex items-center gap-2">
            {unread > 0 && (
              <button onClick={markAllRead}
                className="text-xs text-muted-foreground hover:text-secondary flex items-center gap-1 transition-colors">
                <CheckCheck size={12} /> Mark all read
              </button>
            )}
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-muted transition-colors">
              <X size={14} className="text-muted-foreground" />
            </button>
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {notifications.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
              <div className="w-12 h-12 rounded-2xl bg-muted flex items-center justify-center">
                <Bell size={22} className="text-muted-foreground/50" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">All caught up!</p>
              <p className="text-xs text-muted-foreground">New notifications from the builder or customers will appear here.</p>
            </div>
          ) : (
            notifications.map(n => {
              const meta = TYPE_META[n.type] ?? TYPE_META.info;
              const Icon = meta.icon;
              return (
                <div key={n.id}
                  className={`group flex items-start gap-3 px-5 py-4 border-b border-border last:border-0 hover:bg-muted/40 transition-colors ${!n.read ? 'bg-secondary/3' : ''}`}>

                  {/* Icon */}
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${meta.bg}`}>
                    <Icon size={14} className={meta.text} />
                  </div>

                  {/* Content */}
                  <button
                    className="flex-1 min-w-0 text-left"
                    onClick={() => handleClick(n.id, n.link)}
                  >
                    <div className="flex items-start gap-1.5">
                      <p className="text-sm font-semibold text-card-foreground leading-snug flex-1">{n.title}</p>
                      {!n.read && <span className={`w-2 h-2 rounded-full flex-shrink-0 mt-1.5 ${meta.dot}`} />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed line-clamp-2">{n.message}</p>
                    <div className="flex items-center gap-2 mt-1.5">
                      <p className="text-[10px] text-muted-foreground">{timeAgo(n.timestamp)}</p>
                      {n.link && (
                        <span className="text-[10px] text-secondary flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                          View <ArrowRight size={9} />
                        </span>
                      )}
                    </div>
                  </button>

                  {/* Dismiss */}
                  <button
                    onClick={(e) => { e.stopPropagation(); dismiss(n.id); }}
                    className="p-1 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-muted text-muted-foreground transition-all flex-shrink-0"
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Footer */}
        {notifications.length > 0 && (
          <div className="border-t border-border px-5 py-3 flex-shrink-0">
            <button
              onClick={() => { useNotificationStore.getState().markAllRead(); }}
              className="w-full text-center text-xs text-muted-foreground hover:text-secondary transition-colors py-1"
            >
              Clear all notifications
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationPanel;