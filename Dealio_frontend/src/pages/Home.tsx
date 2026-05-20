import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  Building2, Users, Home as HomeIcon, Landmark, Hammer, ShieldCheck,
  Globe2, MapPin, ArrowRight, CheckCircle2, Sparkles, TrendingUp,
  BarChart3, Zap, Shield, Clock, MessageSquare, Menu, X,
} from 'lucide-react';
import { DealioLogo } from '@/components/shared/DealioLogo';

const roles = [
  { icon: Building2,   label: 'Builders',         desc: 'Inventory, RERA, demand letters & AI pricing',   color: '#0A7E8C', bg: 'rgba(10,126,140,0.08)'  },
  { icon: Users,       label: 'Channel Partners',  desc: 'Pipeline, brochures, commissions & leaderboard', color: '#E87722', bg: 'rgba(232,119,34,0.08)'   },
  { icon: HomeIcon,    label: 'Customers',         desc: 'Track journey, EMI calculator & documents',      color: '#16A34A', bg: 'rgba(22,163,74,0.08)'    },
  { icon: Landmark,    label: 'Banks',             desc: 'Loan cases, TAT tracking & approvals',           color: '#2E5D8E', bg: 'rgba(46,93,142,0.08)'    },
  { icon: Hammer,      label: 'Interior Vendors',  desc: 'Quotes, leads & interior marketplace',           color: '#7B5E3A', bg: 'rgba(123,94,58,0.08)'    },
  { icon: Globe2,      label: 'NRI Buyers',        desc: 'POA, FEMA, repatriation & remote management',   color: '#D97706', bg: 'rgba(217,119,6,0.08)'    },
  { icon: MapPin,      label: 'Land Owners',       desc: 'List parcels, explore JV partnerships',          color: '#C0392B', bg: 'rgba(192,57,43,0.08)'    },
  { icon: ShieldCheck, label: 'Admin',             desc: 'Onboarding, fraud detection & revenue',          color: '#6B3FA0', bg: 'rgba(107,63,160,0.08)'   },
];

const stats = [
  { v: '12,400+',   l: 'Active Units',        icon: Building2,  color: '#0A7E8C' },
  { v: '₹2,800 Cr', l: 'GMV Tracked',         icon: TrendingUp, color: '#E87722' },
  { v: '850+',      l: 'Channel Partners',    icon: Users,      color: '#16A34A' },
  { v: '24',        l: 'Cities Across India', icon: MapPin,     color: '#6B3FA0' },
];

const features = [
  { num: '01', icon: BarChart3,    color: '#0A7E8C', title: 'Universal Milestones',  desc: '13-stage customer journey synced in real-time across builder, CP and bank portals — no more WhatsApp follow-ups.' },
  { num: '02', icon: Zap,          color: '#E87722', title: 'Lead Intelligence',      desc: 'Auto-scored leads (0–100), instant loan eligibility checks, GPS walk-in tracking and AI-powered follow-up nudges.' },
  { num: '03', icon: TrendingUp,   color: '#16A34A', title: 'Commission Engine',      desc: 'Real-time payout tracking, L1/L2 referral bonuses and a zero-leak audit trail every channel partner can trust.' },
  { num: '04', icon: Shield,       color: '#2E5D8E', title: 'RERA Compliance',        desc: 'Auto-generate RERA reports, track compliance deadlines and store all project documents in one auditable place.' },
  { num: '05', icon: MessageSquare,color: '#7B5E3A', title: 'WhatsApp-Native',        desc: 'Broadcast updates, send demand letters and receive OTPs — without leaving the communication layer your teams use.' },
  { num: '06', icon: Clock,        color: '#6B3FA0', title: 'AI Pricing Engine',      desc: 'Dynamic price recommendations based on project velocity, market comps and demand signals — updated daily.' },
];

const testimonials = [
  { quote: 'Dealio cut our CP follow-up time by 60%. Every stakeholder sees the same deal status in real time.', name: 'Priya S.', role: 'Sales Head, Prestige Group',    avatar: 'PS', color: '#0A7E8C' },
  { quote: 'Finally a platform that speaks banker. TAT tracking alone saved us 2 weeks per loan case.',          name: 'Ramesh B.', role: 'Branch Manager, HDFC Bank',   avatar: 'RB', color: '#E87722' },
  { quote: 'As an NRI, managing my property remotely was a nightmare. Dealio changed that completely.',          name: 'Arjun M.', role: 'NRI Buyer, Dubai',             avatar: 'AM', color: '#16A34A' },
];

const DOT_GRID = {
  backgroundImage: 'radial-gradient(rgba(255,255,255,0.07) 1px, transparent 1px)',
  backgroundSize: '28px 28px',
};

const Home = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuthStore();

  return (
    <div className="min-h-screen bg-white text-[#1B3A5C] overflow-x-hidden">

      {/* ── Navbar ── */}
      <header className="sticky top-0 z-50 bg-white/92 backdrop-blur-xl border-b border-slate-100/80">
        <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
          <DealioLogo size="sm" to="/home" />

          <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-slate-500">
            {[['#roles','Who it\'s for'],['#features','Features'],['#stats','Numbers'],['#testimonials','Stories']].map(([href, label]) => (
              <a key={href} href={href} className="hover:text-[#0A7E8C] transition-colors">{label}</a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-2.5">
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-sm font-medium text-slate-600">Hi, <span className="font-bold text-[#1B3A5C]">{user.name}</span></span>
                <Link to={`/${user.role}`}>
                  <button className="px-4 py-2 rounded-xl text-sm font-bold text-white shadow-lg shadow-[#0A7E8C]/25 hover:-translate-y-px active:translate-y-0 transition-all"
                    style={{ background: 'linear-gradient(135deg, #0DAABF 0%, #0A7E8C 100%)' }}>
                    Dashboard
                  </button>
                </Link>
              </div>
            ) : (
              <>
                <Link to="/login">
                  <button className="px-4 py-2 rounded-xl text-sm font-semibold text-[#1B3A5C] hover:bg-slate-100 transition-colors">
                    Sign In
                  </button>
                </Link>
                <Link to="/signup">
                  <button className="px-4 py-2 rounded-xl text-sm font-bold text-white shadow-lg shadow-[#E87722]/25 hover:-translate-y-px active:translate-y-0 transition-all"
                    style={{ background: 'linear-gradient(135deg, #F59E0B 0%, #E87722 60%, #D4691C 100%)' }}>
                    Get Started
                  </button>
                </Link>
              </>
            )}
          </div>

          <button className="md:hidden p-2 rounded-lg text-slate-500 hover:bg-slate-100 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
            {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-100 bg-white px-5 py-4 space-y-1">
            {[['#roles','Who it\'s for'],['#features','Features'],['#stats','Numbers'],['#testimonials','Stories']].map(([href, label]) => (
              <a key={href} href={href} onClick={() => setMobileMenuOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-50 hover:text-[#1B3A5C]">{label}</a>
            ))}
            <div className="flex gap-2 pt-3 border-t border-slate-100 mt-2">
              <Link to="/login" className="flex-1">
                <button className="w-full py-2.5 rounded-xl text-sm font-semibold border border-slate-200 text-[#1B3A5C]">Sign In</button>
              </Link>
              <Link to="/signup" className="flex-1">
                <button className="w-full py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg,#E87722,#D4691C)' }}>Get Started</button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* ── Hero ── */}
      <section className="relative overflow-hidden"
        style={{ background: 'linear-gradient(150deg, #0C1F35 0%, #0F2A45 30%, #1B3A5C 60%, #0A7E8C 100%)' }}>

        {/* Dot grid */}
        <div className="absolute inset-0 pointer-events-none" style={DOT_GRID} />

        {/* Ambient blobs */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute -top-32 -right-32 w-[640px] h-[640px] rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(10,126,140,0.25) 0%, transparent 65%)' }} />
          <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(232,119,34,0.2) 0%, transparent 65%)' }} />
          <div className="absolute top-[45%] left-[38%] w-72 h-72 rounded-full"
            style={{ background: 'radial-gradient(circle, rgba(245,166,35,0.1) 0%, transparent 70%)' }} />
        </div>

        <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-20 pb-16 md:pt-28 md:pb-24">
          <div className="max-w-3xl mx-auto text-center">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/15 bg-white/8 backdrop-blur-sm text-white/85 text-xs font-semibold mb-8 shadow-inner">
              <Sparkles size={12} style={{ color: '#F5A623' }} />
              India's unified real-estate operating system
              <span className="ml-0.5 px-2 py-0.5 rounded-full text-white text-[10px] font-bold"
                style={{ background: 'linear-gradient(135deg,#E87722,#D4691C)' }}>New</span>
            </div>

            <h1 className="text-4xl sm:text-5xl md:text-6xl lg:text-[70px] font-black text-white leading-[1.04] tracking-tight mb-6">
              One platform.<br />
              <span style={{ background: 'linear-gradient(90deg,#FCD34D,#F59E0B,#E87722)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Every stakeholder
              </span><br />
              in your deal.
            </h1>

            <p className="text-white/65 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed">
              Dealio connects builders, channel partners, customers, banks, interior vendors, NRIs and land owners — so every transaction closes faster, with zero leakage.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
              <Link to="/signup">
                <button className="group flex items-center gap-2.5 px-7 py-4 rounded-2xl font-bold text-sm text-white shadow-2xl shadow-[#E87722]/30 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                  style={{ background: 'linear-gradient(135deg,#F59E0B 0%,#E87722 55%,#D4691C 100%)' }}>
                  Create free account
                  <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                </button>
              </Link>
              <Link to="/login">
                <button className="flex items-center gap-2 px-7 py-4 rounded-2xl font-bold text-sm bg-white/10 border border-white/20 text-white hover:bg-white/18 hover:-translate-y-0.5 active:translate-y-0 transition-all backdrop-blur-sm">
                  Sign in to dashboard
                </button>
              </Link>
            </div>

            {/* Trust pills */}
            <div className="flex flex-wrap items-center justify-center gap-3 sm:gap-5">
              {[['RERA-ready'], ['8 role portals'], ['WhatsApp-native'], ['AI-powered pricing']].map(([label]) => (
                <span key={label} className="flex items-center gap-1.5 text-white/55 text-xs font-medium">
                  <CheckCircle2 size={12} style={{ color: '#F5A623' }} /> {label}
                </span>
              ))}
            </div>
          </div>

          {/* Dashboard preview cards */}
          <div className="relative mt-16 max-w-4xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
              {[
                { icon: Building2,  label: 'Projects live',     value: '340',   delta: '+12 this week', color: '#0A7E8C' },
                { icon: TrendingUp, label: 'Deals this month',  value: '1,240', delta: '+8.4%',         color: '#E87722' },
                { icon: Users,      label: 'Active CPs',        value: '856',   delta: '+23 today',     color: '#16A34A' },
                { icon: Zap,        label: 'Leads today',       value: '2,318', delta: 'Live',          color: '#F5A623' },
              ].map((item) => (
                <div key={item.label}
                  className="group bg-white/8 border border-white/12 backdrop-blur-sm rounded-2xl p-4 sm:p-5 hover:bg-white/14 hover:border-white/20 transition-all duration-200">
                  <div className="flex items-start justify-between mb-3">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                      style={{ backgroundColor: item.color + '28' }}>
                      <item.icon size={15} style={{ color: item.color }} />
                    </div>
                    <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-white/10 text-white/60">{item.delta}</span>
                  </div>
                  <div className="text-xl sm:text-2xl font-black text-white">{item.value}</div>
                  <div className="text-white/50 text-xs mt-0.5 font-medium">{item.label}</div>
                  {/* Mini bar */}
                  <div className="mt-3 h-0.5 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full transition-all" style={{ width: '65%', backgroundColor: item.color + 'AA' }} />
                  </div>
                </div>
              ))}
            </div>

            {/* Live pill */}
            <div className="absolute -top-3.5 right-3 sm:right-0 flex items-center gap-2 bg-white rounded-full px-3 py-1.5 shadow-xl shadow-black/15 text-xs font-bold text-[#1B3A5C]">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
              42 deals closed today
            </div>
          </div>
        </div>

        {/* Wave */}
        <div className="absolute bottom-0 left-0 right-0">
          <svg viewBox="0 0 1440 72" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full block" preserveAspectRatio="none">
            <path d="M0 72L1440 72L1440 28C1320 60 1080 4 840 24C600 44 360 0 120 20L0 40Z" fill="white"/>
          </svg>
        </div>
      </section>

      {/* ── Stats ── */}
      <section id="stats" className="bg-white py-12 sm:py-16">
        <div className="max-w-5xl mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-y md:divide-y-0 divide-slate-100 border border-slate-100 rounded-3xl overflow-hidden">
            {stats.map((s) => (
              <div key={s.l} className="group flex flex-col items-center justify-center py-10 px-6 hover:bg-slate-50/60 transition-colors text-center">
                <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4 transition-colors"
                  style={{ backgroundColor: s.color + '12' }}>
                  <s.icon size={20} style={{ color: s.color }} />
                </div>
                <div className="text-3xl sm:text-4xl font-black"
                  style={{ background: `linear-gradient(135deg, ${s.color} 0%, ${s.color}AA 100%)`, WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  {s.v}
                </div>
                <div className="text-sm text-slate-500 mt-1.5 font-medium">{s.l}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Roles ── */}
      <section id="roles" className="py-16 sm:py-20" style={{ background: 'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)' }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0A7E8C]/10 text-[#0A7E8C] text-xs font-bold uppercase tracking-widest mb-4">
              Role-based portals
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-[44px] font-black text-[#1B3A5C] leading-tight tracking-tight">
              Built for every role<br className="hidden sm:block" /> in the deal
            </h2>
            <p className="mt-3 text-slate-500 text-base leading-relaxed">
              Pick your portal. Each one is purpose-built — not a generic dashboard repurposed for your role.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {roles.map((r) => (
              <Link to="/signup" key={r.label}
                className="group relative bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-xl hover:shadow-slate-200/70 hover:-translate-y-1.5 transition-all duration-200 overflow-hidden">
                {/* Left color bar — visible at low opacity, full on hover */}
                <div className="absolute left-0 top-4 bottom-4 w-[3px] rounded-full opacity-30 group-hover:opacity-100 transition-all"
                  style={{ backgroundColor: r.color }} />

                <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4 transition-colors"
                  style={{ backgroundColor: r.bg }}>
                  <r.icon size={20} style={{ color: r.color }} />
                </div>

                <div className="font-bold text-[#1B3A5C] text-[15px] mb-1.5">{r.label}</div>
                <div className="text-xs text-slate-500 leading-relaxed mb-4">{r.desc}</div>

                <div className="flex items-center gap-1 text-xs font-semibold opacity-50 group-hover:opacity-100 group-hover:translate-x-0.5 transition-all"
                  style={{ color: r.color }}>
                  Open portal <ArrowRight size={11} />
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ── Features ── */}
      <section id="features" className="bg-white py-16 sm:py-20">
        <div className="max-w-7xl mx-auto px-5 sm:px-8">
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E87722]/10 text-[#E87722] text-xs font-bold uppercase tracking-widest mb-5">
              Platform features
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-[#1B3A5C] leading-tight tracking-tight">
              Everything you need,<br className="hidden sm:block" /> nothing you don't
            </h2>
            <p className="mt-4 text-slate-500 text-lg leading-relaxed">
              Six core engines that power every deal from first lead to final possession.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {features.map((f) => (
              <div key={f.num}
                className="group relative bg-[#F8FAFC] rounded-2xl border border-slate-100 p-7 hover:bg-white hover:shadow-2xl hover:shadow-slate-200/60 hover:-translate-y-1.5 transition-all duration-200 overflow-hidden">
                {/* Colored top border on hover */}
                <div className="absolute top-0 left-6 right-6 h-[2px] rounded-b-full opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ backgroundColor: f.color }} />

                <div className="flex items-start justify-between mb-5">
                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center"
                    style={{ background: `linear-gradient(135deg, ${f.color}22 0%, ${f.color}0A 100%)` }}>
                    <f.icon size={20} style={{ color: f.color }} />
                  </div>
                  <span className="text-4xl font-black select-none tabular-nums leading-none"
                    style={{ color: f.color + '18' }}>{f.num}</span>
                </div>

                <h3 className="font-bold text-[#1B3A5C] text-[16px] mb-2">{f.title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-16 sm:py-20 relative overflow-hidden"
        style={{ background: 'linear-gradient(150deg, #0C1F35 0%, #0F2A45 35%, #1A3B5D 65%, #0A6E7C 100%)' }}>
        <div className="absolute inset-0 pointer-events-none" style={DOT_GRID} />
        <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full pointer-events-none"
          style={{ background: 'radial-gradient(circle, rgba(10,126,140,0.2) 0%, transparent 65%)' }} />

        <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
          <div className="text-center mb-14">
            <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/75 text-xs font-bold uppercase tracking-widest mb-5">
              Real stories
            </span>
            <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight tracking-tight">
              Trusted by India's top<br className="hidden sm:block" /> real-estate professionals
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {testimonials.map((t) => (
              <div key={t.name}
                className="relative bg-white/7 border border-white/10 rounded-2xl p-7 hover:bg-white/11 hover:border-white/18 transition-all duration-200 flex flex-col">
                {/* Large quote mark */}
                <span className="absolute top-4 right-6 text-6xl font-black leading-none select-none pointer-events-none"
                  style={{ color: 'rgba(255,255,255,0.07)' }}>"</span>

                {/* Stars */}
                <div className="flex gap-0.5 mb-5">
                  {[...Array(5)].map((_, i) => (
                    <svg key={i} width="14" height="14" viewBox="0 0 20 20" fill="#F5A623">
                      <path d="M10 1l2.39 5.26 5.61.49-4.19 3.74 1.3 5.51L10 13.27l-5.11 2.73 1.3-5.51L2 6.75l5.61-.49z"/>
                    </svg>
                  ))}
                </div>

                <p className="text-white/80 text-sm leading-[1.75] mb-6 flex-1">"{t.quote}"</p>

                <div className="border-t border-white/10 pt-4 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${t.color} 0%, ${t.color}BB 100%)` }}>
                    {t.avatar}
                  </div>
                  <div>
                    <div className="font-bold text-white text-sm leading-tight">{t.name}</div>
                    <div className="text-white/45 text-xs mt-0.5">{t.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="bg-white py-16 sm:py-20">
        <div className="max-w-4xl mx-auto px-5 sm:px-8 text-center">
          <div className="relative rounded-3xl overflow-hidden"
            style={{ background: 'linear-gradient(150deg, #0C1F35 0%, #0F2A45 40%, #1A3B5D 70%, #0A7E8C 100%)' }}>
            <div className="absolute inset-0 pointer-events-none" style={DOT_GRID} />
            <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(10,126,140,0.3) 0%, transparent 65%)' }} />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full pointer-events-none"
              style={{ background: 'radial-gradient(circle, rgba(232,119,34,0.25) 0%, transparent 65%)' }} />

            <div className="relative px-8 py-14 sm:px-14 sm:py-20">
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 border border-white/15 text-white/75 text-xs font-bold uppercase tracking-widest mb-7">
                <Sparkles size={11} style={{ color: '#F5A623' }} /> Free to get started
              </div>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-black text-white leading-tight tracking-tight mb-4">
                Ready to close<br /> deals faster?
              </h2>
              <p className="text-white/60 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
                Join 850+ channel partners and 120+ builders already running on Dealio. No credit card needed.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                <Link to="/signup">
                  <button className="group flex items-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-sm text-white shadow-2xl shadow-[#E87722]/30 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                    style={{ background: 'linear-gradient(135deg,#F59E0B 0%,#E87722 55%,#D4691C 100%)' }}>
                    Get started free
                    <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </Link>
                <Link to="/login">
                  <button className="flex items-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-sm bg-white/10 border border-white/20 text-white hover:bg-white/18 hover:-translate-y-0.5 transition-all">
                    Sign in to dashboard
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-[#0C1F35] border-t-2" style={{ borderColor: '#E87722' }}>
        <div className="max-w-7xl mx-auto px-5 sm:px-8 py-12">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
            <div>
              <DealioLogo size="sm" variant="light" />
              <p className="mt-3 text-white/45 text-sm max-w-xs leading-relaxed">
                India's unified real-estate OS — connecting every stakeholder in the deal.
              </p>
            </div>
            <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm text-white/45">
              {[['#roles','Who it\'s for'],['#features','Features'],['#stats','Numbers'],['#testimonials','Stories']].map(([href, label]) => (
                <a key={href} href={href} className="hover:text-white/80 transition-colors">{label}</a>
              ))}
              <Link to="/login"  className="hover:text-white/80 transition-colors">Sign In</Link>
              <Link to="/signup" className="hover:text-white/80 transition-colors">Sign Up</Link>
            </div>
          </div>
          <div className="border-t border-white/8 mt-10 pt-6 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-white/25">
            <span>© {new Date().getFullYear()} Dealio. Made with care in India.</span>
            <div className="flex gap-5">
              <a href="#" className="hover:text-white/50 transition-colors">Privacy</a>
              <a href="#" className="hover:text-white/50 transition-colors">Terms</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;