import {useState, useEffect, useCallback, useRef} from 'react';
import {drainNotifs} from '@/lib/crossNotify';
import {useNotificationStream} from '@/hooks/useNotificationStream';
import {useNavigate, useLocation} from 'react-router-dom';
import {useAuthStore, roleLabels, roleColors, UserRole} from '@/stores/useAuthStore';
import {useNotificationStore} from '@/stores/useNotificationStore';
import NotificationPanel from '@/components/shared/NotificationPanel';
import {
    Building2, Users, User, Landmark, Shield,
    LayoutDashboard, FolderOpen, Megaphone, BarChart3, FileText,
    HandCoins, Share2, Palette, Home as HomeIcon, CreditCard,
    Calendar, Globe, Inbox, PieChart, ListChecks,
    Calculator, MessageSquare, AlertTriangle, ChevronLeft, ChevronRight,
    LogOut, Bell, Search, ChevronDown, Grid3X3, Briefcase, UserPlus,
    Trophy, ClipboardList, Radio, UserCircle, TrendingUp, Wallet, Video, Scale,
    Paintbrush, Brain, Share, BarChart, Columns, Settings, UserIcon,
} from 'lucide-react';

interface NavItem {
    label: string;
    path: string;
    icon: React.ElementType;
    badge?: number;
}

interface NavSection {
    title: string;
    items: NavItem[];
}

const getRoleNavSections = (role: UserRole, badges: Record<string, number>): NavSection[] => {
    if (!role) return [];
    const sectionsMap: Record<string, NavSection[]> = {
        builder: [
            {
                title: 'Core',
                items: [
                    {label: 'Overview', path: '/builder', icon: LayoutDashboard},
                    {label: 'Projects', path: '/builder/projects', icon: Building2},
                    {label: 'Unit Matrix', path: '/builder/units', icon: Grid3X3},
                ],
            },
            {
                title: 'Sales',
                items: [
                    {label: 'Leads & Meetings', path: '/builder/leads', icon: Users},
                    {label: 'Deals', path: '/builder/deals', icon: Briefcase},
                    {label: 'Meeting Requests', path: '/builder/meetings', icon: Calendar, badge: badges.meetings},
                ],
            },
            {
                title: 'Intelligence',
                items: [
                    {label: 'CP Performance', path: '/builder/cp-performance', icon: BarChart3},
                    {label: 'Analytics', path: '/builder/analytics', icon: PieChart},
                    {label: 'AI Intelligence', path: '/builder/ai', icon: Brain},
                ],
            },
            {
                title: 'Marketing',
                items: [
                    {label: 'Virtual Tours', path: '/builder/virtual-tours', icon: Video},
                    {label: 'Inventory', path: '/builder/inventory', icon: Columns},
                    {label: 'Broadcast', path: '/builder/broadcast', icon: Megaphone},
                ],
            },
            {
                title: 'Compliance',
                items: [
                    {label: 'RERA Compliance', path: '/builder/rera', icon: Shield},
                    {label: 'Demand Letters', path: '/builder/demand-letters', icon: FileText},
                    {label: 'Possession', path: '/builder/possession', icon: ListChecks},
                    {label: 'Snagging', path: '/builder/snagging', icon: AlertTriangle},
                ],
            },
            {
                title: 'Finance & Docs',
                items: [
                    {label: 'Loan Threads', path: '/builder/loan', icon: CreditCard},
                    {label: 'Documents', path: '/builder/documents', icon: FileText},
                ],
            },
            {
                title: 'Communication',
                items: [
                    {label: 'Conversations', path: '/builder/conversations', icon: MessageSquare},
                ],
            },
            {
                title: 'System',
                items: [
                    {label: 'Settings', path: '/builder/settings', icon: Settings},
                ],
            },
        ],
        cp: [
            {
                title: 'Core',
                items: [
                    {label: 'Overview', path: '/cp', icon: LayoutDashboard},
                    {label: 'Projects', path: '/cp/projects', icon: Building2},
                ],
            },
            {
                title: 'Sales',
                items: [
                    {label: 'Leads', path: '/cp/leads', icon: Users},
                    {label: 'Pipeline', path: '/cp/pipeline', icon: Columns},
                    {label: 'Follow-ups', path: '/cp/followups', icon: ClipboardList},
                    {label: 'Meetings & Share', path: '/cp/meetings', icon: Calendar},
                ],
            },
            {
                title: 'Intelligence',
                items: [
                    {label: 'AI Lead Intelligence', path: '/cp/ai-insights', icon: Brain},
                    {label: 'Social Analytics', path: '/cp/social-analytics', icon: BarChart},
                    {label: 'Content Studio', path: '/cp/content-studio', icon: Paintbrush},
                    {label: 'WhatsApp Broadcast', path: '/cp/whatsapp-broadcast', icon: Share},
                ],
            },
            {
                title: 'Earnings',
                items: [
                    {label: 'Commissions', path: '/cp/commissions', icon: HandCoins},
                    {label: 'Leaderboard', path: '/cp/leaderboard', icon: Trophy},
                ],
            },
            {
                title: 'Network',
                items: [
                    {label: 'My Contacts', path: '/cp/contacts', icon: UserPlus},
                    {label: 'Referral Tree', path: '/cp/referral', icon: Share2},
                    {label: 'Community', path: '/cp/community', icon: Globe},
                ],
            },
            {
                title: 'Finance',
                items: [
                    {label: 'Loan Threads', path: '/cp/loan', icon: CreditCard},
                ],
            },
            {
                title: 'Resources',
                items: [
                    {label: 'Brochure', path: '/cp/brochure', icon: Palette},
                    {label: 'Conversations', path: '/cp/conversations', icon: MessageSquare},
                ],
            },
            {
                title: 'System',
                items: [
                    {label: 'Settings', path: '/cp/settings', icon: Settings},
                ],
            },
        ],
        customer: [
            {
                title: 'Home',
                items: [
                    {label: 'Dashboard', path: '/customer', icon: LayoutDashboard},
                    {label: 'Property', path: '/customer/property', icon: Building2},
                    {label: 'Journey', path: '/customer/journey', icon: ListChecks},
                ],
            },
            {
                title: 'Finance',
                items: [
                    {label: 'Loan Engine', path: '/customer/loan-engine', icon: Calculator},
                    {label: 'Loan', path: '/customer/loan', icon: CreditCard},
                    {label: 'Loan Status', path: '/customer/loan-status', icon: BarChart3},
                    {label: 'EMI Calculator', path: '/customer/emi', icon: Calculator},
                    {label: 'Loan Top-up', path: '/customer/topup', icon: Wallet},
                ],
            },
            {
                title: 'Property',
                items: [
                    {label: 'Investments', path: '/customer/investments', icon: TrendingUp},
                    {label: 'Possession', path: '/customer/possession', icon: ListChecks},
                    {label: 'Snagging', path: '/customer/snagging', icon: AlertTriangle},
                ],
            },
            {
                title: 'Support',
                items: [
                    {label: 'Schedule Visit', path: '/customer/meeting', icon: Calendar},
                    {label: 'Conversations', path: '/customer/conversations', icon: MessageSquare},
                    {label: 'Documents', path: '/customer/documents', icon: FileText},
                ],
            },
            {
                title: 'System',
                items: [
                    {label: 'Settings', path: '/customer/settings', icon: Settings},
                ],
            },
        ],
        bank: [
            {
                title: 'Core',
                items: [
                    {label: 'Overview', path: '/bank', icon: LayoutDashboard},
                    {label: 'Loan Inbox', path: '/bank/inbox', icon: Inbox},
                    {label: 'Loan Cases', path: '/bank/loan-cases', icon: Briefcase},
                ],
            },
            {
                title: 'Finance',
                items: [
                    {label: 'Loan Threads', path: '/bank/loan', icon: CreditCard},
                ],
            },
            {
                title: 'Operations',
                items: [
                    {label: 'Documents', path: '/bank/documents', icon: FileText},
                    {label: 'Status Update', path: '/bank/status', icon: ListChecks},
                ],
            },
            {
                title: 'Communication',
                items: [
                    {label: 'Conversations', path: '/bank/conversations', icon: MessageSquare},
                ],
            },
            {
                title: 'Insights',
                items: [
                    {label: 'Analytics', path: '/bank/analytics', icon: PieChart},
                ],
            },
        ],
        admin: [
            {
                title: 'Platform',
                items: [
                    {label: 'Overview', path: '/admin', icon: LayoutDashboard},
                    {label: 'Users', path: '/admin/users', icon: Users},
                ],
            },
            {
                title: 'Stakeholders',
                items: [
                    {label: 'Builders', path: '/admin/builders', icon: Building2},
                    {label: 'Channel Partners', path: '/admin/cps', icon: UserPlus},
                    {label: 'Customers', path: '/admin/customers', icon: User},
                ],
            },
            {
                title: 'Business',
                items: [
                    {label: 'Projects', path: '/admin/projects', icon: FolderOpen},
                    {label: 'Revenue', path: '/admin/revenue', icon: BarChart3},
                    {label: 'Commissions', path: '/admin/commissions', icon: HandCoins},
                    {label: 'Deals', path: '/admin/deals', icon: Briefcase},
                ],
            },
            {
                title: 'Operations',
                items: [
                    {label: 'Campaigns', path: '/admin/campaigns', icon: Radio},
                    {label: 'Fraud', path: '/admin/fraud', icon: AlertTriangle},
                ],
            },
        ],
        nri: [
            {
                title: 'Core',
                items: [
                    {label: 'Dashboard', path: '/nri', icon: LayoutDashboard},
                    {label: 'Buy Property', path: '/nri/projects', icon: Search},
                    {label: 'My Property', path: '/nri/property', icon: Building2},
                    {label: 'Property Mgmt', path: '/nri/manage', icon: HomeIcon},
                ],
            },
            {
                title: 'Finance',
                items: [
                    {label: 'Investment Planner', path: '/nri/invest', icon: TrendingUp},
                    {label: 'Monthly Calculator', path: '/nri/calculator', icon: Calculator},
                    {label: 'Home Loan', path: '/nri/loan', icon: CreditCard},
                    {label: 'Loan Status', path: '/nri/loan-status', icon: BarChart3},
                ],
            },
            {
                title: 'Support',
                items: [
                    {label: 'Consultation', path: '/nri/consultation', icon: Video},
                    {label: 'Conversations', path: '/nri/conversations', icon: MessageSquare},
                    {label: 'Documents', path: '/nri/documents', icon: FileText},
                ],
            },
            {
                title: 'Legal',
                items: [
                    {label: 'POA Management', path: '/nri/poa', icon: Scale},
                    {label: 'Legal Guide', path: '/nri/legal', icon: Globe},
                ],
            },
            {
                title: 'Account',
                items: [
                    {label: 'My Profile', path: '/nri/profile', icon: UserCircle},
                ],
            },
        ],
    };
    return sectionsMap[role] || [];
};

const roleIcons: Record<UserRole, React.ElementType> = {
    builder: Building2, cp: Users, customer: User,
    bank: Landmark, admin: Shield, nri: Globe,
};

const DashboardLayout = ({children}: { children: React.ReactNode }) => {
    const {user, logout} = useAuthStore();
    const {unreadCount} = useNotificationStore();
    const navigate = useNavigate();
    const location = useLocation();
    const [collapsed, setCollapsed] = useState(() => {
        try {
            return localStorage.getItem('dealio_sidebar_collapsed') === 'true';
        } catch {
            return false;
        }
    });
    const [showDropdown, setShowDropdown] = useState(false);
    const [showNotifications, setShowNotifications] = useState(false);

    const toggleCollapsed = () => {
        const next = !collapsed;
        setCollapsed(next);
        try {
            localStorage.setItem('dealio_sidebar_collapsed', String(next));
        } catch { /* ignore */ }
    };
    const [sseKey, setSseKey] = useState(0);

    const role = user?.role;

    const CUSTOMER_BASE = import.meta.env.VITE_CUSTOMER_URL ?? 'http://127.0.0.1:8090/api';
    const BUILDER_BASE = import.meta.env.VITE_BUILDER_URL ?? 'http://127.0.0.1:8090/api';

    const handleCityChanged = useCallback(() => setSseKey(k => k + 1), []);
    useEffect(() => {
        window.addEventListener('dealio:city-changed', handleCityChanged);
        return () => window.removeEventListener('dealio:city-changed', handleCityChanged);
    }, [handleCityChanged]);

    useNotificationStream(`${CUSTOMER_BASE}/customer/subscribe`, role === 'customer', sseKey);
    useNotificationStream(`${BUILDER_BASE}/builder/notifications/stream`, role === 'builder', 0);
    useNotificationStream(`${BUILDER_BASE}/cp/notifications/stream`, role === 'cp', 0);

    const drainedRef = useRef(false);
    useEffect(() => {
        if (!user?.id || !user?.role) return;
        const drain = () => {
            const pending = drainNotifs(user.role, user.id);
            pending.forEach(n => useNotificationStore.getState().addNotification({
                type: n.type, title: n.title, message: n.message, link: n.link,
            }));
        };
        if (!drainedRef.current) {
            drain();
            drainedRef.current = true;
        }
        const evt = `dealio:xnotif:${user.role}`;
        window.addEventListener(evt, drain);
        return () => window.removeEventListener(evt, drain);
    }, [user?.id, user?.role]);

    const [pendingMeetings, setPendingMeetings] = useState(() =>
        Number(localStorage.getItem('dealio_pending_meetings') || '0'),
    );

    useEffect(() => {
        const update = () => setPendingMeetings(Number(localStorage.getItem('dealio_pending_meetings') || '0'));
        window.addEventListener('dealio:new-meeting', update);
        window.addEventListener('dealio:meetings-updated', update);
        return () => {
            window.removeEventListener('dealio:new-meeting', update);
            window.removeEventListener('dealio:meetings-updated', update);
        };
    }, []);

    if (!user) return null;

    const navSections = getRoleNavSections(user.role, {meetings: pendingMeetings});
    const allItems = navSections.flatMap(s => s.items);
    const color = user ? roleColors[user.role] || '#0A7E8C' : '#0A7E8C';
    const RoleIcon = user && user.role && roleIcons[user.role] ? roleIcons[user.role] : UserIcon;
    const sidebarBg = '#0B1929';

    const currentTitle = allItems.find(item => {
        if (item.path === `/${user.role}`) return location.pathname === item.path;
        return location.pathname.startsWith(item.path);
    })?.label || 'Dashboard';

    const initials = user.name
        .split(' ')
        .map((w: string) => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase();

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* ── Sidebar ── */}
            <aside
                className={`${collapsed ? 'w-[60px]' : 'w-[220px]'} flex flex-col transition-all duration-200 flex-shrink-0`}
                style={{backgroundColor: sidebarBg}}
            >
                {/* Logo */}
                <div className="h-14 flex items-center px-3.5 border-b border-white/[0.07] flex-shrink-0">
                    <div
                        className="w-8 h-8 flex items-center justify-center flex-shrink-0"
                        style={{
                            borderRadius: 9,
                            background: 'linear-gradient(145deg, #0FA5BB 0%, #0A7E8C 100%)',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.2), 0 4px 12px rgba(10,126,140,0.4)',
                        }}
                    >
                        <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                            <path
                                fillRule="evenodd" clipRule="evenodd"
                                d="M3.5 3 H9 A7 7 0 0 1 9 17 H3.5 Z M6 5.5 H9 A4.5 4.5 0 0 1 9 14.5 H6 Z"
                                fill="white" fillOpacity="0.96"
                            />
                        </svg>
                    </div>
                    {!collapsed && (
                        <span className="ml-2.5 font-bold text-[17px] leading-none select-none" style={{letterSpacing: '-0.025em'}}>
                            <span className="text-white">Deal</span>
                            <span style={{color: '#5DD8E8'}}>io</span>
                        </span>
                    )}
                </div>

                {/* Nav Sections */}
                <nav className="flex-1 overflow-y-auto py-2 scrollbar-thin">
                    {navSections.map((section, si) => (
                        <div key={section.title}>
                            {/* Section divider + label */}
                            {si > 0 && (
                                <div className={`${collapsed ? 'mx-3 my-2' : 'mx-4 mt-3 mb-1'} border-t border-white/[0.06]`}/>
                            )}
                            {!collapsed && (
                                <div className={`px-4 ${si === 0 ? 'pt-1' : ''} pb-1`}>
                                    <span className="text-[9px] uppercase tracking-[0.15em] font-semibold"
                                          style={{color: 'rgba(255,255,255,0.28)'}}>
                                        {section.title}
                                    </span>
                                </div>
                            )}

                            {section.items.map((item) => {
                                const isActive = item.path === `/${user.role}`
                                    ? location.pathname === item.path
                                    : location.pathname.startsWith(item.path);
                                return (
                                    <button
                                        key={item.path}
                                        onClick={() => navigate(item.path)}
                                        title={collapsed ? item.label : undefined}
                                        className={`w-full flex items-center transition-all duration-150 ${
                                            collapsed
                                                ? 'justify-center py-2.5 px-0'
                                                : 'gap-2.5 px-3.5 py-[7px]'
                                        } ${
                                            isActive
                                                ? 'text-white'
                                                : 'text-white/45 hover:text-white/75'
                                        }`}
                                        style={
                                            isActive
                                                ? {
                                                    borderLeft: collapsed ? 'none' : `2px solid ${color}`,
                                                    backgroundColor: `${color}1a`,
                                                    paddingLeft: collapsed ? undefined : '12px',
                                                }
                                                : {borderLeft: collapsed ? 'none' : '2px solid transparent'}
                                        }
                                    >
                                        <item.icon
                                            size={15}
                                            style={isActive ? {color} : undefined}
                                            className={isActive ? '' : 'opacity-70'}
                                        />
                                        {!collapsed && (
                                            <span className={`flex-1 text-left text-[12.5px] truncate ${isActive ? 'font-medium' : ''}`}>
                                                {item.label}
                                            </span>
                                        )}
                                        {!collapsed && item.badge && item.badge > 0 && (
                                            <span className="w-[18px] h-[18px] rounded-full bg-red-500 text-white text-[9px] flex items-center justify-center font-bold flex-shrink-0">
                                                {item.badge}
                                            </span>
                                        )}
                                        {collapsed && item.badge && item.badge > 0 && (
                                            <span className="absolute top-1 right-1 w-1.5 h-1.5 rounded-full bg-red-500"/>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    ))}
                </nav>

                {/* Sidebar Footer */}
                <div className="border-t border-white/[0.07] flex-shrink-0">
                    {!collapsed && (
                        <div className="flex items-center gap-2.5 px-3.5 py-3">
                            <div
                                className="w-7 h-7 rounded-lg flex items-center justify-center text-white text-[11px] font-bold flex-shrink-0"
                                style={{
                                    background: `linear-gradient(135deg, ${color}, ${color}99)`,
                                }}
                            >
                                {initials[0]}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="text-white text-[11.5px] font-medium truncate leading-tight">{user.name}</p>
                                <p className="text-[10px] leading-tight" style={{color: 'rgba(255,255,255,0.35)'}}>{roleLabels[user.role]}</p>
                            </div>
                        </div>
                    )}
                    <button
                        onClick={toggleCollapsed}
                        className={`w-full flex items-center py-2 text-white/30 hover:text-white/60 transition-colors ${
                            collapsed ? 'justify-center' : 'justify-end px-4'
                        }`}
                    >
                        {collapsed ? <ChevronRight size={14}/> : <ChevronLeft size={14}/>}
                    </button>
                </div>
            </aside>

            {/* ── Main Content ── */}
            <div className="flex-1 flex flex-col min-w-0">
                {/* Header */}
                <header className="h-14 bg-card border-b border-border flex items-center px-5 gap-4 flex-shrink-0">
                    <h1 className="text-[15px] font-semibold text-card-foreground tracking-tight">{currentTitle}</h1>
                    <div className="flex-1"/>

                    {/* Search */}
                    <div className="relative hidden md:flex items-center">
                        <Search size={14} className="absolute left-3 text-muted-foreground"/>
                        <input
                            className="pl-8 pr-4 py-1.5 rounded-lg bg-muted text-[13px] w-56 outline-none text-foreground placeholder:text-muted-foreground border border-transparent focus:border-border transition-colors"
                            placeholder="Search..."
                        />
                    </div>

                    {/* Notifications */}
                    <button
                        onClick={() => setShowNotifications(true)}
                        className="relative p-2 hover:bg-muted rounded-lg transition-colors"
                    >
                        <Bell size={16} className="text-muted-foreground"/>
                        {unreadCount > 0 && (
                            <span className="absolute -top-0.5 -right-0.5 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] flex items-center justify-center font-bold animate-pulse">
                                {unreadCount}
                            </span>
                        )}
                    </button>

                    {/* User Avatar + Dropdown */}
                    <div className="relative">
                        <button
                            onClick={() => setShowDropdown(!showDropdown)}
                            className="flex items-center gap-2 pl-1 pr-2 py-1 rounded-xl hover:bg-muted transition-all duration-150"
                        >
                            {/* Avatar */}
                            <div className="relative flex-shrink-0">
                                <div
                                    className="w-8 h-8 rounded-full flex items-center justify-center text-white text-[12px] font-bold"
                                    style={{
                                        background: `linear-gradient(135deg, ${color} 0%, ${color}bb 100%)`,
                                        boxShadow: `0 0 0 2px ${color}30`,
                                    }}
                                >
                                    {initials}
                                </div>
                                <span
                                    className="absolute -bottom-px -right-px w-2.5 h-2.5 rounded-full border-2 border-card"
                                    style={{backgroundColor: '#22c55e'}}
                                />
                            </div>

                            {/* Name + Role (md+) */}
                            <div className="hidden lg:flex flex-col items-start leading-none">
                                <span className="text-[12.5px] font-semibold text-card-foreground">{user.name}</span>
                                <span className="text-[10px] text-muted-foreground mt-0.5">{roleLabels[user.role]}</span>
                            </div>

                            <ChevronDown
                                size={12}
                                className={`text-muted-foreground transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`}
                            />
                        </button>

                        {/* Dropdown */}
                        {showDropdown && (
                            <div className="absolute right-0 top-[calc(100%+8px)] w-60 rounded-2xl border border-border bg-card shadow-2xl z-50 overflow-hidden animate-slide-up">
                                {/* Card header */}
                                <div
                                    className="px-4 py-4"
                                    style={{background: `linear-gradient(135deg, ${color}18 0%, ${color}06 100%)`}}
                                >
                                    <div className="flex items-center gap-3">
                                        <div
                                            className="w-11 h-11 rounded-xl flex items-center justify-center text-white text-[15px] font-bold flex-shrink-0"
                                            style={{
                                                background: `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
                                                boxShadow: `0 4px 16px ${color}50`,
                                            }}
                                        >
                                            {initials}
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-[13px] font-semibold text-card-foreground truncate">{user.name}</p>
                                            <span
                                                className="inline-block mt-1 text-[10px] font-semibold px-2 py-0.5 rounded-full text-white"
                                                style={{backgroundColor: color}}
                                            >
                                                {roleLabels[user.role]}
                                            </span>
                                        </div>
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="py-1.5">
                                    <button
                                        onClick={() => {setShowDropdown(false); navigate(`/${user.role}/settings`);}}
                                        className="w-full text-left px-3.5 py-2 text-[12.5px] text-card-foreground hover:bg-muted flex items-center gap-3 transition-colors"
                                    >
                                        <span className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                                            <Settings size={13} className="text-muted-foreground"/>
                                        </span>
                                        <span>Settings</span>
                                    </button>
                                    <button
                                        onClick={() => {setShowDropdown(false); logout(); navigate('/login');}}
                                        className="w-full text-left px-3.5 py-2 text-[12.5px] text-card-foreground hover:bg-muted flex items-center gap-3 transition-colors"
                                    >
                                        <span className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                                            <RoleIcon size={13} className="text-muted-foreground"/>
                                        </span>
                                        <span>Switch Role</span>
                                    </button>
                                    <div className="mx-3.5 my-1 border-t border-border"/>
                                    <button
                                        onClick={() => {logout(); navigate('/login'); setShowDropdown(false);}}
                                        className="w-full text-left px-3.5 py-2 text-[12.5px] text-destructive hover:bg-destructive/5 flex items-center gap-3 transition-colors"
                                    >
                                        <span className="w-7 h-7 rounded-lg bg-destructive/10 flex items-center justify-center flex-shrink-0">
                                            <LogOut size={13} className="text-destructive"/>
                                        </span>
                                        <span>Sign Out</span>
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-6">{children}</main>
            </div>

            {showDropdown && <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)}/>}
            {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)}/>}
        </div>
    );
};

export default DashboardLayout;