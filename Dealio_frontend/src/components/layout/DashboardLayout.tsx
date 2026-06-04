import {useState, useEffect, useCallback, useRef} from 'react';
import {drainNotifs} from '@/lib/crossNotify';
import {useNotificationStream} from '@/hooks/useNotificationStream';
import {useNavigate, useLocation} from 'react-router-dom';
import {useAuthStore, roleLabels, roleColors, UserRole} from '@/stores/useAuthStore';
import {useNotificationStore} from '@/stores/useNotificationStore';
import NotificationPanel from '@/components/shared/NotificationPanel';
import AIChatWidget from '@/components/shared/AIChatWidget';
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
                    {label: 'Leads & Pipeline', path: '/cp/leads', icon: Users},
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
                    {label: 'Home Loan', path: '/customer/loan', icon: CreditCard},
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
                    {label: 'Meetings', path: '/admin/meetings', icon: Calendar},
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
    const [openNavSection, setOpenNavSection] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchOpen, setSearchOpen] = useState(false);
    const [searchIndex, setSearchIndex] = useState(0);
    const searchRef = useRef<HTMLInputElement>(null);

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

    useEffect(() => {
        const onKey = (e: KeyboardEvent) => {
            if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
                e.preventDefault();
                searchRef.current?.focus();
                setSearchOpen(true);
            }
            if (e.key === 'Escape') { setSearchOpen(false); setSearchQuery(''); searchRef.current?.blur(); }
        };
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, []);

    useNotificationStream(`${CUSTOMER_BASE}/customer/subscribe`, role === 'customer', sseKey);
    useNotificationStream(`${BUILDER_BASE}/portal/customer/notifications/stream`, role === 'customer', sseKey);
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

    const searchResults = searchQuery.trim().length > 0
        ? navSections.flatMap(s =>
              s.items
                  .filter(item =>
                      item.label.toLowerCase().includes(searchQuery.toLowerCase()) ||
                      s.title.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map(item => ({...item, section: s.title}))
          ).slice(0, 8)
        : [];

    const handleSearchKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); setSearchIndex(i => Math.min(i + 1, searchResults.length - 1)); }
        else if (e.key === 'ArrowUp') { e.preventDefault(); setSearchIndex(i => Math.max(i - 1, 0)); }
        else if (e.key === 'Enter' && searchResults[searchIndex]) {
            navigate(searchResults[searchIndex].path);
            setSearchQuery(''); setSearchOpen(false); searchRef.current?.blur();
        }
        else if (e.key === 'Escape') { setSearchOpen(false); setSearchQuery(''); searchRef.current?.blur(); }
    };
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

    const isCustomer = role === 'customer';

    return (
        <div className="flex h-screen overflow-hidden bg-background">
            {/* ── Sidebar — hidden for customer ── */}
            <aside
                className={`${isCustomer ? 'hidden' : ''} ${collapsed ? 'w-[60px]' : 'w-[220px]'} flex flex-col transition-all duration-200 flex-shrink-0`}
                style={{backgroundColor: sidebarBg}}
            >
                {/* Logo */}
                <div className="h-14 flex items-center px-3.5 border-b border-white/[0.07] flex-shrink-0 cursor-pointer" onClick={() => navigate(`/${user.role}`)}>
                    <div
                        className="w-8 h-8 flex items-center justify-center flex-shrink-0"
                        style={{
                            borderRadius: 7,
                            background: 'linear-gradient(145deg, #0B1B2E 0%, #0E2542 60%, #112E50 100%)',
                            boxShadow: '0 1px 3px rgba(0,0,0,0.22), 0 4px 16px rgba(0,0,0,0.32), 0 0 0 1.5px rgba(28,216,238,0.2), inset 0 1px 0 rgba(255,255,255,0.06)',
                        }}
                    >
                        <svg width="15" height="15" viewBox="0 0 20 20" fill="none">
                            <path
                                fillRule="evenodd" clipRule="evenodd"
                                d="M3 2 H9 C16 2 18 6 18 10 C18 14 16 18 9 18 H3 Z M6 5.5 H9 C13.5 5.5 15 7.5 15 10 C15 12.5 13.5 14.5 9 14.5 H6 Z"
                                fill="white" fillOpacity="0.94"
                            />
                            <rect x="3" y="7.8"  width="3" height="1.4" rx="0.5" fill="#FF8930" fillOpacity="0.88"/>
                            <rect x="3" y="11.4" width="3" height="1.4" rx="0.5" fill="#FF8930" fillOpacity="0.60"/>
                            <circle cx="16.2" cy="5.8" r="1.4" fill="#1CD8EE" fillOpacity="0.92"/>
                        </svg>
                    </div>
                    {!collapsed && (
                        <span className="ml-2.5 font-bold text-[17px] leading-none select-none" style={{letterSpacing: '-0.03em'}}>
                            <span className="text-white">Deal</span>
                            <span style={{color: '#3ECDE2'}}>io</span>
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
                {/* ── Apple-style customer top nav ── */}
                {isCustomer && (() => {
                    const NAV_LINKS = [
                        { label: 'Home',      path: '/customer' },
                        { label: 'Property',  path: '/customer/property' },
                        { label: 'Journey',   path: '/customer/journey' },
                        { label: 'Meetings',  path: '/customer/meeting' },
                        { label: 'Documents', path: '/customer/documents' },
                        { label: 'Loan',      path: '/customer/loan' },
                    ];
                    const MORE_ITEMS: NavItem[] = [
                        { label: 'Loan Top-up',   path: '/customer/topup',         icon: Wallet },
                        { label: 'Investments',   path: '/customer/investments',   icon: TrendingUp },
                        { label: 'Possession',    path: '/customer/possession',    icon: ListChecks },
                        { label: 'Snagging',      path: '/customer/snagging',      icon: AlertTriangle },
                        { label: 'Conversations', path: '/customer/conversations', icon: MessageSquare },
                        { label: 'Settings',      path: '/customer/settings',      icon: Settings },
                    ];
                    const moreOpen = openNavSection === '__more__';
                    const moreActive = MORE_ITEMS.some(i =>
                        i.path === '/customer' ? location.pathname === i.path : location.pathname.startsWith(i.path)
                    );
                    return (
                        <>
                            <style>{`
                                .apnav-link {
                                    display: inline-flex; align-items: center; gap: 4px;
                                    height: 44px; padding: 0 11px;
                                    border: none; background: transparent; cursor: pointer;
                                    font-size: 12px; font-weight: 400; letter-spacing: -0.01em;
                                    color: rgba(210,210,215,0.7);
                                    transition: color 0.12s;
                                    white-space: nowrap; position: relative;
                                    -webkit-font-smoothing: antialiased;
                                    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
                                }
                                .apnav-link:hover { color: #f5f5f7; }
                                .apnav-link.active { color: #f5f5f7; font-weight: 500; }
                                .apnav-link.active::after {
                                    content: ''; position: absolute; bottom: 5px; left: 50%; transform: translateX(-50%);
                                    width: 3px; height: 3px; border-radius: 50%;
                                    background: rgba(255,255,255,0.55);
                                }
                                .apnav-icon-btn {
                                    width: 32px; height: 32px; display: inline-flex; align-items: center; justify-content: center;
                                    border: none; background: transparent; cursor: pointer; border-radius: 8px; flex-shrink: 0;
                                    color: rgba(210,210,215,0.62); transition: background 0.12s, color 0.12s; position: relative;
                                }
                                .apnav-icon-btn:hover { background: rgba(255,255,255,0.08); color: #f5f5f7; }
                                .apnav-more-drop {
                                    position: absolute; top: calc(100% + 10px); left: 50%; transform: translateX(-50%);
                                    min-width: 192px;
                                    background: rgba(30,30,34,0.97);
                                    backdrop-filter: saturate(180%) blur(24px);
                                    -webkit-backdrop-filter: saturate(180%) blur(24px);
                                    border: 1px solid rgba(255,255,255,0.1);
                                    border-radius: 13px;
                                    box-shadow: 0 20px 44px rgba(0,0,0,0.55), 0 4px 12px rgba(0,0,0,0.3);
                                    padding: 4px; z-index: 9999;
                                    animation: apnav-drop-c 0.18s cubic-bezier(0.25,0.46,0.45,0.94) both;
                                    transform-origin: top center;
                                }
                                @keyframes apnav-drop-c {
                                    from { opacity:0; transform: translateX(-50%) scale(0.97) translateY(-5px); }
                                    to   { opacity:1; transform: translateX(-50%) scale(1) translateY(0); }
                                }
                                .apnav-more-item {
                                    display: flex; align-items: center; gap: 9px;
                                    width: 100%; padding: 7px 11px; border-radius: 8px;
                                    border: none; background: transparent; cursor: pointer;
                                    font-size: 12px; text-align: left; color: rgba(210,210,215,0.68);
                                    transition: background 0.1s, color 0.1s; white-space: nowrap;
                                    -webkit-font-smoothing: antialiased;
                                    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
                                }
                                .apnav-more-item:hover { background: rgba(255,255,255,0.07); color: #f5f5f7; }
                                .apnav-more-item.active { color: #f5f5f7; background: rgba(255,255,255,0.05); }
                                .apnav-prof-drop {
                                    position: absolute; right: 0; top: calc(100% + 8px); width: 230px;
                                    background: rgba(30,30,34,0.97);
                                    backdrop-filter: saturate(180%) blur(24px);
                                    -webkit-backdrop-filter: saturate(180%) blur(24px);
                                    border: 1px solid rgba(255,255,255,0.1); border-radius: 13px;
                                    box-shadow: 0 20px 44px rgba(0,0,0,0.55); overflow: hidden; z-index: 9999;
                                    animation: apnav-drop-r 0.18s cubic-bezier(0.25,0.46,0.45,0.94) both;
                                    transform-origin: top right;
                                }
                                @keyframes apnav-drop-r {
                                    from { opacity:0; transform: scale(0.97) translateY(-5px); }
                                    to   { opacity:1; transform: scale(1) translateY(0); }
                                }
                                .apnav-prof-action {
                                    display: flex; align-items: center; gap: 10px;
                                    width: 100%; padding: 8px 12px;
                                    border: none; background: transparent; cursor: pointer;
                                    font-size: 12px; text-align: left; color: rgba(210,210,215,0.78);
                                    transition: background 0.1s, color 0.1s;
                                    -webkit-font-smoothing: antialiased;
                                    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
                                }
                                .apnav-prof-action:hover { background: rgba(255,255,255,0.07); color: #f5f5f7; }
                                .apnav-prof-action.danger { color: rgba(255,69,58,0.82); }
                                .apnav-prof-action.danger:hover { background: rgba(255,69,58,0.08); color: #ff453a; }
                                .apnav-search-input {
                                    height: 28px; padding: 0 8px 0 27px;
                                    background: rgba(255,255,255,0.07); border: 1px solid rgba(255,255,255,0.1);
                                    border-radius: 7px; font-size: 12px; color: #f5f5f7; outline: none; width: 148px;
                                    transition: background 0.15s, border-color 0.15s;
                                    -webkit-font-smoothing: antialiased;
                                    font-family: -apple-system, BlinkMacSystemFont, 'SF Pro Text', system-ui, sans-serif;
                                }
                                .apnav-search-input::placeholder { color: rgba(210,210,215,0.28); }
                                .apnav-search-input:focus { background: rgba(255,255,255,0.1); border-color: rgba(255,255,255,0.18); }
                                .apnav-search-results {
                                    position: absolute; top: calc(100% + 8px); right: 0; width: 280px;
                                    background: rgba(30,30,34,0.97);
                                    backdrop-filter: saturate(180%) blur(24px);
                                    -webkit-backdrop-filter: saturate(180%) blur(24px);
                                    border: 1px solid rgba(255,255,255,0.1); border-radius: 13px;
                                    box-shadow: 0 20px 44px rgba(0,0,0,0.55);
                                    padding: 4px; z-index: 9999;
                                    animation: apnav-drop-r 0.15s ease both;
                                }
                                .apnav-search-item {
                                    display: flex; align-items: center; gap: 10px;
                                    width: 100%; padding: 7px 10px; border-radius: 8px;
                                    border: none; cursor: pointer; text-align: left;
                                    background: transparent; transition: background 0.1s;
                                    -webkit-font-smoothing: antialiased;
                                }
                                .apnav-search-item.sel { background: rgba(255,255,255,0.07); }
                            `}</style>

                            <nav style={{
                                flexShrink: 0, position: 'relative', zIndex: 60, height: 44,
                                background: 'rgba(22,22,26,0.92)',
                                backdropFilter: 'saturate(180%) blur(20px)',
                                WebkitBackdropFilter: 'saturate(180%) blur(20px)',
                                borderBottom: '1px solid rgba(255,255,255,0.07)',
                            }}>
                                <div style={{
                                    display: 'grid', gridTemplateColumns: '180px 1fr 260px',
                                    alignItems: 'center', height: '100%', padding: '0 20px',
                                }}>
                                    {/* Left: Logo */}
                                    <button onClick={() => navigate('/customer')} style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'none', border: 'none', cursor: 'pointer', padding: '0 4px' }}>
                                        <div style={{ width: 26, height: 26, borderRadius: 6, flexShrink: 0, background: 'linear-gradient(145deg,#0B1B2E,#0E2542,#112E50)', boxShadow: '0 0 0 1px rgba(28,216,238,0.22)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                            <svg width="13" height="13" viewBox="0 0 20 20" fill="none">
                                                <path fillRule="evenodd" clipRule="evenodd" d="M3 2 H9 C16 2 18 6 18 10 C18 14 16 18 9 18 H3 Z M6 5.5 H9 C13.5 5.5 15 7.5 15 10 C15 12.5 13.5 14.5 9 14.5 H6 Z" fill="white" fillOpacity="0.94"/>
                                                <rect x="3" y="7.8" width="3" height="1.4" rx="0.5" fill="#FF8930" fillOpacity="0.88"/>
                                                <rect x="3" y="11.4" width="3" height="1.4" rx="0.5" fill="#FF8930" fillOpacity="0.60"/>
                                                <circle cx="16.2" cy="5.8" r="1.4" fill="#1CD8EE" fillOpacity="0.92"/>
                                            </svg>
                                        </div>
                                        <span style={{ fontSize: 15, fontWeight: 700, letterSpacing: '-0.04em', background: 'linear-gradient(135deg,#fff 0%,#c7f0fb 50%,#3ECDE2 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text', WebkitFontSmoothing: 'antialiased' }}>dealio</span>
                                    </button>

                                    {/* Center: Nav Links */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        {NAV_LINKS.map(item => {
                                            const isActive = item.path === '/customer' ? location.pathname === item.path : location.pathname.startsWith(item.path);
                                            return (
                                                <button key={item.path} className={`apnav-link${isActive ? ' active' : ''}`} onClick={() => navigate(item.path)}>
                                                    {item.label}
                                                </button>
                                            );
                                        })}
                                        <div style={{ position: 'relative' }}>
                                            <button className={`apnav-link${moreActive || moreOpen ? ' active' : ''}`} onClick={() => setOpenNavSection(moreOpen ? null : '__more__')}>
                                                More
                                                <svg style={{ width: 10, height: 10, opacity: 0.48, transition: 'transform 0.18s', transform: moreOpen ? 'rotate(180deg)' : undefined }} viewBox="0 0 16 16" fill="none">
                                                    <path d="M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                                                </svg>
                                            </button>
                                            {moreOpen && (
                                                <div className="apnav-more-drop">
                                                    {MORE_ITEMS.map(item => {
                                                        const isActive = item.path === '/customer' ? location.pathname === item.path : location.pathname.startsWith(item.path);
                                                        return (
                                                            <button key={item.path} className={`apnav-more-item${isActive ? ' active' : ''}`} onClick={() => { navigate(item.path); setOpenNavSection(null); }}>
                                                                <item.icon size={12} strokeWidth={1.5} style={{ opacity: 0.42, flexShrink: 0 }}/>
                                                                {item.label}
                                                            </button>
                                                        );
                                                    })}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Right: Search + Bell + Avatar */}
                                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 2 }}>
                                        {/* Search */}
                                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                            <Search size={13} style={{ position: 'absolute', left: 8, color: 'rgba(210,210,215,0.36)', pointerEvents: 'none', zIndex: 1 }}/>
                                            <input
                                                ref={searchRef}
                                                value={searchQuery}
                                                onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); setSearchIndex(0); }}
                                                onFocus={() => setSearchOpen(true)}
                                                onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
                                                onKeyDown={handleSearchKeyDown}
                                                className="apnav-search-input"
                                                placeholder="Search… ⌘K"
                                            />
                                            {searchQuery && (
                                                <button onClick={() => { setSearchQuery(''); setSearchOpen(false); }} style={{ position: 'absolute', right: 7, color: 'rgba(210,210,215,0.38)', background: 'none', border: 'none', cursor: 'pointer', fontSize: 10, lineHeight: 1 }}>✕</button>
                                            )}
                                            {searchOpen && searchResults.length > 0 && (
                                                <div className="apnav-search-results">
                                                    {searchResults.map((item, i) => (
                                                        <button key={item.path} className={`apnav-search-item${i === searchIndex ? ' sel' : ''}`}
                                                            onMouseDown={() => { navigate(item.path); setSearchQuery(''); setSearchOpen(false); }}
                                                            onMouseEnter={() => setSearchIndex(i)}>
                                                            <div style={{ width: 26, height: 26, borderRadius: 6, background: i === searchIndex ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                                                                <item.icon size={12} style={{ color: 'rgba(210,210,215,0.65)' }}/>
                                                            </div>
                                                            <div style={{ flex: 1, minWidth: 0 }}>
                                                                <div style={{ fontSize: 12, fontWeight: 500, color: '#f5f5f7' }}>{item.label}</div>
                                                                <div style={{ fontSize: 10.5, color: 'rgba(210,210,215,0.36)', marginTop: 1 }}>{item.section}</div>
                                                            </div>
                                                            {i === searchIndex && <kbd style={{ fontSize: 10, color: 'rgba(210,210,215,0.32)', background: 'rgba(255,255,255,0.06)', padding: '2px 5px', borderRadius: 4, border: '1px solid rgba(255,255,255,0.1)' }}>↵</kbd>}
                                                        </button>
                                                    ))}
                                                </div>
                                            )}
                                            {searchOpen && searchQuery.trim().length > 0 && searchResults.length === 0 && (
                                                <div className="apnav-search-results" style={{ padding: '12px 14px', textAlign: 'center' }}>
                                                    <p style={{ fontSize: 12, color: 'rgba(210,210,215,0.48)' }}>No results for "<span style={{ color: '#f5f5f7' }}>{searchQuery}</span>"</p>
                                                </div>
                                            )}
                                        </div>

                                        {/* Bell */}
                                        <button className="apnav-icon-btn" onClick={() => setShowNotifications(true)}>
                                            <Bell size={15} strokeWidth={1.5}/>
                                            {unreadCount > 0 && <span style={{ position: 'absolute', top: 6, right: 6, width: 6, height: 6, borderRadius: '50%', background: '#ff453a', border: '1.5px solid rgba(22,22,26,0.92)' }}/>}
                                        </button>

                                        {/* Avatar */}
                                        <div style={{ position: 'relative' }}>
                                            <button
                                                onClick={() => setShowDropdown(!showDropdown)}
                                                style={{ display: 'flex', alignItems: 'center', gap: 5, background: 'none', border: 'none', cursor: 'pointer', padding: '4px 6px 4px 4px', borderRadius: 20, transition: 'background 0.12s', marginLeft: 2 }}
                                                onMouseEnter={e => (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.07)'}
                                                onMouseLeave={e => (e.currentTarget as HTMLElement).style.background = 'none'}
                                            >
                                                <div style={{ width: 26, height: 26, borderRadius: '50%', flexShrink: 0, background: user.avatar ? 'transparent' : `linear-gradient(135deg, ${color} 0%, ${color}bb 100%)`, boxShadow: `0 0 0 1.5px ${color}44`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontSize: 10, fontWeight: 700, color: '#fff' }}>
                                                    {user.avatar ? <img src={user.avatar} alt="av" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : initials}
                                                </div>
                                                <ChevronDown size={11} style={{ color: 'rgba(210,210,215,0.42)', transition: 'transform 0.18s', transform: showDropdown ? 'rotate(180deg)' : undefined }}/>
                                            </button>

                                            {showDropdown && (
                                                <div className="apnav-prof-drop">
                                                    <div style={{ padding: '14px 14px 12px', borderBottom: '1px solid rgba(255,255,255,0.07)' }}>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                                                            <div style={{ width: 36, height: 36, borderRadius: '50%', flexShrink: 0, background: user.avatar ? 'transparent' : `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', fontSize: 13, fontWeight: 700, color: '#fff', boxShadow: `0 2px 10px ${color}40` }}>
                                                                {user.avatar ? <img src={user.avatar} alt="av" style={{ width: '100%', height: '100%', objectFit: 'cover' }}/> : initials}
                                                            </div>
                                                            <div style={{ minWidth: 0 }}>
                                                                <div style={{ fontSize: 13, fontWeight: 600, color: '#f5f5f7', WebkitFontSmoothing: 'antialiased', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{user.name}</div>
                                                                <div style={{ fontSize: 11, color: 'rgba(210,210,215,0.38)', marginTop: 2 }}>{roleLabels[user.role]}</div>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div style={{ padding: '5px 5px 7px' }}>
                                                        <button className="apnav-prof-action" onClick={() => { setShowDropdown(false); navigate(`/${user.role}/settings`); }}>
                                                            <span style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Settings size={12} style={{ color: 'rgba(210,210,215,0.52)' }}/></span>
                                                            Settings
                                                        </button>
                                                        <button className="apnav-prof-action" onClick={() => { setShowDropdown(false); logout(); navigate('/login'); }}>
                                                            <span style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><RoleIcon size={12} style={{ color: 'rgba(210,210,215,0.52)' }}/></span>
                                                            Switch Role
                                                        </button>
                                                        <div style={{ margin: '4px 7px', borderTop: '1px solid rgba(255,255,255,0.07)' }}/>
                                                        <button className="apnav-prof-action danger" onClick={() => { logout(); navigate('/login'); setShowDropdown(false); }}>
                                                            <span style={{ width: 24, height: 24, borderRadius: 6, background: 'rgba(255,69,58,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><LogOut size={12} style={{ color: 'rgba(255,69,58,0.62)' }}/></span>
                                                            Sign Out
                                                        </button>
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </nav>
                        </>
                    );
                })()}
                {openNavSection && <div className="fixed inset-0 z-30" onClick={() => setOpenNavSection(null)} />}

                {/* Header — hidden for customer (search/bell/avatar live in the apple nav above) */}
                {!isCustomer && <header className="h-14 bg-card border-b border-border flex items-center px-5 gap-4 flex-shrink-0 relative z-50">
                    <h1 className="text-[15px] font-semibold text-card-foreground tracking-tight">{currentTitle}</h1>
                    <div className="flex-1"/>

                    {/* Search */}
                    <div className="relative hidden md:flex items-center">
                        <Search size={14} className="absolute left-3 text-muted-foreground pointer-events-none z-10"/>
                        <input
                            ref={searchRef}
                            value={searchQuery}
                            onChange={e => { setSearchQuery(e.target.value); setSearchOpen(true); setSearchIndex(0); }}
                            onFocus={() => setSearchOpen(true)}
                            onBlur={() => setTimeout(() => setSearchOpen(false), 150)}
                            onKeyDown={handleSearchKeyDown}
                            className="pl-8 pr-16 py-1.5 rounded-lg bg-muted text-[13px] w-64 outline-none text-foreground placeholder:text-muted-foreground border border-transparent focus:border-border transition-colors"
                            placeholder="Search... ⌘K"
                        />
                        {searchQuery && (
                            <button onClick={() => { setSearchQuery(''); setSearchOpen(false); }} className="absolute right-3 text-muted-foreground hover:text-foreground text-[11px]">✕</button>
                        )}
                        {searchOpen && searchResults.length > 0 && (
                            <div className="absolute top-full left-0 mt-1.5 w-80 bg-card border border-border rounded-xl shadow-xl z-50 overflow-hidden py-1">
                                {searchResults.map((item, i) => (
                                    <button
                                        key={item.path}
                                        onMouseDown={() => { navigate(item.path); setSearchQuery(''); setSearchOpen(false); }}
                                        onMouseEnter={() => setSearchIndex(i)}
                                        className="w-full flex items-center gap-3 px-3.5 py-2.5 text-left transition-colors"
                                        style={{ background: i === searchIndex ? `${color}15` : 'transparent' }}
                                    >
                                        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                                            style={{ background: i === searchIndex ? `${color}20` : 'var(--muted)' }}>
                                            <item.icon size={13} style={{ color: i === searchIndex ? color : undefined }} className="text-muted-foreground"/>
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="text-[13px] font-medium text-card-foreground truncate">{item.label}</div>
                                            <div className="text-[11px] text-muted-foreground truncate">{item.section} · {item.path}</div>
                                        </div>
                                        {i === searchIndex && (
                                            <kbd className="text-[10px] text-muted-foreground bg-muted px-1.5 py-0.5 rounded border border-border flex-shrink-0">↵</kbd>
                                        )}
                                    </button>
                                ))}
                            </div>
                        )}
                        {searchOpen && searchQuery.trim().length > 0 && searchResults.length === 0 && (
                            <div className="absolute top-full left-0 mt-1.5 w-72 bg-card border border-border rounded-xl shadow-xl z-50 px-4 py-5 text-center">
                                <p className="text-[13px] text-muted-foreground">No results for "<span className="text-foreground font-medium">{searchQuery}</span>"</p>
                            </div>
                        )}
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
                                    className="w-8 h-8 rounded-full overflow-hidden flex items-center justify-center text-white text-[12px] font-bold"
                                    style={{
                                        background: user.avatar ? 'transparent' : `linear-gradient(135deg, ${color} 0%, ${color}bb 100%)`,
                                        boxShadow: `0 0 0 2px ${color}30`,
                                    }}
                                >
                                    {user.avatar
                                        ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                                        : initials}
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
                                            className="w-11 h-11 rounded-xl overflow-hidden flex items-center justify-center text-white text-[15px] font-bold flex-shrink-0"
                                            style={{
                                                background: user.avatar ? 'transparent' : `linear-gradient(135deg, ${color} 0%, ${color}cc 100%)`,
                                                boxShadow: `0 4px 16px ${color}50`,
                                            }}
                                        >
                                            {user.avatar
                                                ? <img src={user.avatar} alt="avatar" className="w-full h-full object-cover" />
                                                : initials}
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
                </header>}

                <main className="flex-1 overflow-y-auto p-6">{children}</main>
            </div>

            {showDropdown && <div className="fixed inset-0 z-40" onClick={() => setShowDropdown(false)}/>}
            {showNotifications && <NotificationPanel onClose={() => setShowNotifications(false)}/>}
            <AIChatWidget />
        </div>
    );
};

export default DashboardLayout;