import { useState, useEffect, useCallback, useRef } from 'react';
import { drainNotifs } from '@/lib/crossNotify';
import { useNotificationStream } from '@/hooks/useNotificationStream';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore, roleLabels, roleColors, UserRole } from '@/stores/useAuthStore';
import { useNotificationStore } from '@/stores/useNotificationStore';
import NotificationPanel from '@/components/shared/NotificationPanel';
import {
  Building2, Users, User, Landmark, Shield,
  LayoutDashboard, FolderOpen, Megaphone, BarChart3, FileText,
  HandCoins, Share2, Palette, Home as HomeIcon, CreditCard,
  Calendar, Globe, ShoppingBag, Inbox, PieChart, ListChecks,
  Calculator, MessageSquare, AlertTriangle, ChevronLeft, ChevronRight,
  LogOut, Bell, Search, ChevronDown, Grid3X3, Briefcase, UserPlus,
  Trophy, ClipboardList, Radio, UserCircle, TrendingUp, Wallet, Video, Scale,
  Paintbrush, Brain, Share, BarChart, Columns, Settings,
} from 'lucide-react';
interface NavItem { label: string; path: string; icon: React.ElementType; badge?: number; }

const getRoleNavItems = (role: UserRole, _badges: Record<string, number>): NavItem[] => {
  if (!role) return [];
  const navMap: Record<string, NavItem[]> = {
    builder: [
      { label: 'Overview', path: '/builder', icon: LayoutDashboard },
      { label: 'Projects', path: '/builder/projects', icon: Building2 },
      { label: 'Unit Matrix', path: '/builder/units', icon: Grid3X3 },
      { label: 'Leads & Meetings', path: '/builder/leads', icon: Users },
      { label: 'Deals', path: '/builder/deals', icon: Briefcase },
      { label: 'Meeting Requests', path: '/builder/meetings', icon: Calendar },
      { label: 'CP Performance', path: '/builder/cp-performance', icon: BarChart3 },
      { label: 'Analytics', path: '/builder/analytics', icon: PieChart },
      { label: 'AI Intelligence', path: '/builder/ai', icon: Brain },
      { label: 'Virtual Tours', path: '/builder/virtual-tours', icon: Video },
      { label: 'Inventory', path: '/builder/inventory', icon: Columns },
      { label: 'RERA Compliance', path: '/builder/rera', icon: Shield },
      { label: 'Demand Letters', path: '/builder/demand-letters', icon: FileText },
      { label: 'Possession', path: '/builder/possession', icon: ListChecks },
      { label: 'Snagging', path: '/builder/snagging', icon: AlertTriangle },
      { label: 'Loan Threads', path: '/builder/loan', icon: CreditCard },
      { label: 'Conversations', path: '/builder/conversations', icon: MessageSquare },
      { label: 'Documents', path: '/builder/documents', icon: FileText },
      { label: 'Broadcast', path: '/builder/broadcast', icon: Megaphone },
      { label: 'Settings', path: '/builder/settings', icon: Settings },
    ],
    cp: [
      { label: 'Overview', path: '/cp', icon: LayoutDashboard },
      { label: 'Projects', path: '/cp/projects', icon: Building2 },
      { label: 'Leads', path: '/cp/leads', icon: Users },
      { label: 'Pipeline', path: '/cp/pipeline', icon: Columns },
      { label: 'AI Lead Intelligence', path: '/cp/ai-insights', icon: Brain },
      { label: 'Content Studio', path: '/cp/content-studio', icon: Paintbrush },
      { label: 'Social Analytics', path: '/cp/social-analytics', icon: BarChart },
      { label: 'WhatsApp Broadcast', path: '/cp/whatsapp-broadcast', icon: Share },
      { label: 'Meetings & Share', path: '/cp/meetings', icon: Calendar },
      { label: 'Follow-ups', path: '/cp/followups', icon: ClipboardList },
      { label: 'Commissions', path: '/cp/commissions', icon: HandCoins },
      { label: 'Leaderboard', path: '/cp/leaderboard', icon: Trophy },
      { label: 'My Contacts', path: '/cp/contacts', icon: UserPlus },
      { label: 'Loan Threads', path: '/cp/loan', icon: CreditCard },
      { label: 'Conversations', path: '/cp/conversations', icon: MessageSquare },
      { label: 'Referral Tree', path: '/cp/referral', icon: Share2 },
      { label: 'Brochure', path: '/cp/brochure', icon: Palette },
      { label: 'Community', path: '/cp/community', icon: Globe },
      { label: 'Services', path: '/cp/services', icon: ShoppingBag },
      { label: 'Settings', path: '/cp/settings', icon: Settings },
    ],
    customer: [
      { label: 'Dashboard', path: '/customer', icon: LayoutDashboard },
      { label: 'Property', path: '/customer/property', icon: Building2 },
      { label: 'Journey', path: '/customer/journey', icon: ListChecks },
      { label: 'Loan Engine', path: '/customer/loan-engine', icon: Calculator },
      { label: 'Loan', path: '/customer/loan', icon: CreditCard },
      { label: 'Loan Status', path: '/customer/loan-status', icon: BarChart3 },
      { label: 'Documents', path: '/customer/documents', icon: FileText },
      { label: 'EMI Calculator', path: '/customer/emi', icon: Calculator },
      { label: 'Schedule Visit', path: '/customer/meeting', icon: Calendar },
      { label: 'Conversations', path: '/customer/conversations', icon: MessageSquare },
      { label: 'Investments', path: '/customer/investments', icon: TrendingUp },
      { label: 'Loan Top-up', path: '/customer/topup', icon: Wallet },
      { label: 'Possession', path: '/customer/possession', icon: ListChecks },
      { label: 'Snagging', path: '/customer/snagging', icon: AlertTriangle },
      { label: 'Settings', path: '/customer/settings', icon: Settings },
    ],
    bank: [
      { label: 'Overview', path: '/bank', icon: LayoutDashboard },
      { label: 'Loan Inbox', path: '/bank/inbox', icon: Inbox },
      { label: 'Loan Cases', path: '/bank/loan-cases', icon: Briefcase },
      { label: 'Loan Threads', path: '/bank/loan', icon: CreditCard },
      { label: 'Documents', path: '/bank/documents', icon: FileText },
      { label: 'Conversations', path: '/bank/conversations', icon: MessageSquare },
      { label: 'Status Update', path: '/bank/status', icon: ListChecks },
      { label: 'Analytics', path: '/bank/analytics', icon: PieChart },
    ],
    admin: [
      { label: 'Overview', path: '/admin', icon: LayoutDashboard },
      { label: 'Users', path: '/admin/users', icon: Users },
      { label: 'Builders', path: '/admin/builders', icon: Building2 },
      { label: 'Channel Partners', path: '/admin/cps', icon: UserPlus },
      { label: 'Projects', path: '/admin/projects', icon: FolderOpen },
      { label: 'Customers', path: '/admin/customers', icon: User },
      { label: 'Revenue', path: '/admin/revenue', icon: BarChart3 },
      { label: 'Commissions', path: '/admin/commissions', icon: HandCoins },
      { label: 'Deals', path: '/admin/deals', icon: Briefcase },
      { label: 'Campaigns', path: '/admin/campaigns', icon: Radio },
      { label: 'Fraud', path: '/admin/fraud', icon: AlertTriangle },
    ],
    nri: [
      { label: 'Dashboard', path: '/nri', icon: LayoutDashboard },
      { label: 'Buy Property', path: '/nri/projects', icon: Search },
      { label: 'My Property', path: '/nri/property', icon: Building2 },
      { label: 'Property Mgmt', path: '/nri/manage', icon: HomeIcon },
      { label: 'Investment Planner', path: '/nri/invest', icon: TrendingUp },
      { label: 'Monthly Calculator', path: '/nri/calculator', icon: Calculator },
      { label: 'Home Loan', path: '/nri/loan', icon: CreditCard },
      { label: 'Loan Status', path: '/nri/loan-status', icon: BarChart3 },
      { label: 'Consultation', path: '/nri/consultation', icon: Video },
      { label: 'Conversations', path: '/nri/conversations', icon: MessageSquare },
      { label: 'Documents', path: '/nri/documents', icon: FileText },
      { label: 'POA Management', path: '/nri/poa', icon: Scale },
      { label: 'Legal Guide', path: '/nri/legal', icon: Globe },
      { label: 'My Profile', path: '/nri/profile', icon: UserCircle },
    ],
  };
  return navMap[role] || [];
};

const roleIcons: Record<UserRole, React.ElementType> = {
  builder: Building2, cp: Users, customer: User,
  bank: Landmark, admin: Shield, nri: Globe,
};

const DashboardLayout = ({ children }: { children: React.ReactNode }) => {
  const { user, logout } = useAuthStore();
  const { unreadCount } = useNotificationStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [sseKey, setSseKey] = useState(0);

  const role = user?.role;

  const CUSTOMER_BASE = import.meta.env.VITE_CUSTOMER_URL ?? 'http://127.0.0.1:8090/api';
  const BUILDER_BASE  = import.meta.env.VITE_BUILDER_URL  ?? 'http://127.0.0.1:8090/api';

  // Reconnect customer SSE when preferred city changes
  const handleCityChanged = useCallback(() => setSseKey(k => k + 1), []);
  useEffect(() => {
    window.addEventListener('dealio:city-changed', handleCityChanged);
    return () => window.removeEventListener('dealio:city-changed', handleCityChanged);
  }, [handleCityChanged]);

  // Customer → city channel stream
  useNotificationStream(`${CUSTOMER_BASE}/customer/subscribe`, role === 'customer', sseKey);
  // Builder → personal user channel stream
  useNotificationStream(`${BUILDER_BASE}/builder/notifications/stream`, role === 'builder', 0);

  // Drain cross-role notifications (localStorage bridge) on mount and on custom events
  const drainedRef = useRef(false);
  useEffect(() => {
    if (!user?.id || !user?.role) return;
    const drain = () => {
      const pending = drainNotifs(user.role, user.id);
      pending.forEach(n => useNotificationStore.getState().addNotification({
        type: n.type, title: n.title, message: n.message, link: n.link,
      }));
    };
    if (!drainedRef.current) { drain(); drainedRef.current = true; }
    const evt = `dealio:xnotif:${user.role}`;
    window.addEventListener(evt, drain);
    return () => window.removeEventListener(evt, drain);
  }, [user?.id, user?.role]);

  if (!user) return null;

  const navItems = getRoleNavItems(user.role, {}) || [];
  const color = user ? roleColors[user.role] || '#0A7E8C' : '#0A7E8C';
  const RoleIcon = user && user.role && roleIcons[user.role] ? roleIcons[user.role] : UserIcon;
  const sidebarBg = '#0F2035';

  const currentTitle = (navItems || []).find(item => {
    if (item.path === `/${user.role}`) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  })?.label || 'Dashboard';

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <aside className={`${collapsed ? 'w-16' : 'w-60'} flex flex-col transition-all duration-200 flex-shrink-0`} style={{ backgroundColor: sidebarBg }}>
        <div className="h-16 flex items-center px-4 border-b border-white/10">
          {/* Icon mark */}
          <div
            className="w-9 h-9 flex items-center justify-center flex-shrink-0"
            style={{
              borderRadius: 11,
              background: 'linear-gradient(145deg, #0FA5BB 0%, #0A7E8C 100%)',
              boxShadow: '0 1px 3px rgba(0,0,0,0.15), 0 4px 14px rgba(10,126,140,0.35)',
            }}
          >
            <svg width="17" height="17" viewBox="0 0 20 20" fill="none">
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M3.5 3 H9 A7 7 0 0 1 9 17 H3.5 Z M6 5.5 H9 A4.5 4.5 0 0 1 9 14.5 H6 Z"
                fill="white"
                fillOpacity="0.96"
              />
            </svg>
          </div>
          {!collapsed && (
            <span className="ml-3 font-bold text-[18px] leading-none select-none tracking-tight" style={{ letterSpacing: '-0.02em' }}>
              <span className="text-white">Deal</span><span style={{ color: '#7AE0EC' }}>io</span>
            </span>
          )}
        </div>

        <nav className="flex-1 py-3 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = item.path === `/${user.role}` ? location.pathname === item.path : location.pathname.startsWith(item.path);
            return (
              <button key={item.path} onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${isActive ? 'text-white font-semibold' : 'text-white/60 hover:text-white/90 hover:bg-white/5'}`}
                style={isActive ? { borderLeft: `3px solid ${color}`, backgroundColor: color + '20' } : { borderLeft: '3px solid transparent' }}
                title={collapsed ? item.label : undefined}>
                <item.icon size={18} />
                {!collapsed && (
                  <span className="flex-1 text-left">{item.label}</span>
                )}
                {!collapsed && item.badge && item.badge > 0 && (
                  <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] flex items-center justify-center font-bold">{item.badge}</span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="border-t border-white/10 p-3">
          {!collapsed && (
            <div className="flex items-center gap-2 mb-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ backgroundColor: color }}>
                <RoleIcon size={14} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-white text-xs font-medium truncate">{user.name}</p>
                <p className="text-white/50 text-[10px]">{roleLabels[user.role]}</p>
              </div>
            </div>
          )}
          <button onClick={() => setCollapsed(!collapsed)} className={`w-full flex items-center py-1.5 text-white/50 hover:text-white/90 transition-colors ${collapsed ? 'justify-center' : 'justify-end px-4'}`}>
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </aside>

      <div className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-card border-b border-border flex items-center px-6 gap-4 flex-shrink-0">
          <h1 className="text-lg font-bold text-card-foreground">{currentTitle}</h1>
          <div className="flex-1" />
          <div className="relative hidden md:flex items-center">
            <Search size={16} className="absolute left-3 text-muted-foreground" />
            <input className="pl-9 pr-4 py-2 rounded-lg bg-muted text-sm w-64 outline-none text-foreground placeholder:text-muted-foreground" placeholder="Search..." />
          </div>
          <button onClick={() => setShowNotifications(true)} className="relative p-2 hover:bg-muted rounded-lg transition-colors">
            <Bell size={18} className="text-muted-foreground" />
            {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[10px] flex items-center justify-center font-bold animate-pulse">{unreadCount}</span>}
          </button>
          <div className="relative">
            <button onClick={() => setShowDropdown(!showDropdown)} className="flex items-center gap-2 p-1.5 hover:bg-muted rounded-lg transition-colors">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ backgroundColor: color }}>{user.name[0]}</div>
              <ChevronDown size={14} className="text-muted-foreground" />
            </button>
            {showDropdown && (
              <div className="absolute right-0 top-12 w-48 bg-card rounded-lg card-shadow border border-border py-1 z-50 animate-slide-up">
                <div className="px-3 py-2 border-b border-border">
                  <p className="text-sm font-medium text-card-foreground">{user.name}</p>
                  <p className="text-xs text-muted-foreground">{roleLabels[user.role]}</p>
                </div>
                <button onClick={() => { setShowDropdown(false); navigate(`/${user.role}/settings`); }} className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:bg-muted flex items-center gap-2"><Settings size={14} /> Settings</button>
                <button onClick={() => { setShowDropdown(false); logout(); navigate('/login'); }} className="w-full text-left px-3 py-2 text-sm text-muted-foreground hover:bg-muted flex items-center gap-2"><Users size={14} /> Switch Role</button>
                <button onClick={() => { logout(); navigate('/login'); setShowDropdown(false); }} className="w-full text-left px-3 py-2 text-sm text-destructive hover:bg-muted flex items-center gap-2"><LogOut size={14} /> Logout</button>
              </div>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-y-auto p-6">{children}</main>
      </div>

      {showDropdown && <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)} />}
      {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)} />}
    </div>
  );
};

export default DashboardLayout;
