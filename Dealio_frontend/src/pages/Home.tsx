import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  Building2, Users, Home as HomeIcon, Landmark, ShieldCheck,
  Globe2, ArrowRight, CheckCircle2, Sparkles, TrendingUp,
  BarChart3, Zap, Shield, Clock, MessageSquare, Menu, X, MapPin,
  FileSignature, KeyRound,
} from 'lucide-react';
import { DealioLogo } from '@/components/shared/DealioLogo';

const roles = [
  { icon: Building2,   label: 'Builders',        desc: 'Inventory, RERA, demand letters & AI pricing',   color: '#0A7E8C', bg: 'rgba(10,126,140,0.08)' },
  { icon: Users,       label: 'Channel Partners', desc: 'Pipeline, brochures, commissions & leaderboard', color: '#E87722', bg: 'rgba(232,119,34,0.08)'  },
  { icon: HomeIcon,    label: 'Customers',        desc: 'Track journey, EMI calculator & documents',      color: '#16A34A', bg: 'rgba(22,163,74,0.08)'   },
  { icon: Landmark,    label: 'Banks',            desc: 'Loan cases, TAT tracking & approvals',           color: '#2E5D8E', bg: 'rgba(46,93,142,0.08)'   },
  { icon: Globe2,      label: 'NRI Buyers',       desc: 'POA, FEMA, repatriation & remote management',   color: '#D97706', bg: 'rgba(217,119,6,0.08)'   },
  { icon: ShieldCheck, label: 'Admin',            desc: 'Onboarding, fraud detection & revenue',          color: '#6B3FA0', bg: 'rgba(107,63,160,0.08)'  },
];

const journey = [
  { icon: Zap,           label: 'Lead captured',     sub: 'Auto-scored instantly',  color: '#F5A623' },
  { icon: MapPin,        label: 'Site visit',        sub: 'GPS-verified walk-in',   color: '#E87722' },
  { icon: FileSignature, label: 'Agreement signed',  sub: 'RERA-ready paperwork',   color: '#6B3FA0' },
  { icon: Landmark,      label: 'Loan sanctioned',   sub: 'Bank TAT tracked',       color: '#2E5D8E' },
  { icon: TrendingUp,    label: 'Commission released', sub: 'Zero-leak payout',     color: '#0A7E8C' },
  { icon: KeyRound,      label: 'Keys handed over',  sub: 'Journey complete',       color: '#16A34A' },
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
  backgroundImage: 'radial-gradient(rgba(27,58,92,0.05) 1px, transparent 1px)',
  backgroundSize: '28px 28px',
};

const Home = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('revealed');
          io.unobserve(e.target);
        }
      }),
      { threshold: 0.1, rootMargin: '0px 0px -60px 0px' }
    );
    document.querySelectorAll('.reveal, .reveal-left, .reveal-scale').forEach(el => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <>
      <style>{`
        @keyframes heroUp {
          from { opacity: 0; transform: translateY(26px); }
          to   { opacity: 1; transform: translateY(0);    }
        }
        @keyframes heroScale {
          from { opacity: 0; transform: translateY(20px) scale(0.97); }
          to   { opacity: 1; transform: translateY(0) scale(1);       }
        }
        @keyframes floatY {
          0%,100% { transform: translateY(0px);  }
          50%      { transform: translateY(-7px); }
        }
        .hero-badge  { animation: heroUp    0.55s ease 0.10s both; }
        .hero-title  { animation: heroUp    0.65s ease 0.25s both; }
        .hero-sub    { animation: heroUp    0.60s ease 0.40s both; }
        .hero-cta    { animation: heroUp    0.60s ease 0.55s both; }
        .hero-trust  { animation: heroUp    0.55s ease 0.68s both; }
        .hero-cards  { animation: heroScale 0.70s ease 0.80s both; }
        .float-card  { animation: floatY 4.5s ease-in-out infinite; }
        .float-card:nth-child(2) { animation-delay: 0.5s;  }
        .float-card:nth-child(3) { animation-delay: 1.0s;  }
        .float-card:nth-child(4) { animation-delay: 1.5s;  }

        .reveal {
          opacity: 0;
          transform: translateY(30px);
          transition: opacity 0.7s cubic-bezier(0.22, 1, 0.36, 1),
                      transform 0.7s cubic-bezier(0.22, 1, 0.36, 1);
          will-change: opacity, transform;
        }
        .reveal.revealed { opacity: 1; transform: translateY(0); }

        .reveal-left {
          opacity: 0;
          transform: translateX(-28px);
          transition: opacity 0.65s ease, transform 0.65s ease;
          will-change: opacity, transform;
        }
        .reveal-left.revealed { opacity: 1; transform: translateX(0); }

        .reveal-scale {
          opacity: 0;
          transform: scale(0.96);
          transition: opacity 0.6s ease, transform 0.6s ease;
          will-change: opacity, transform;
        }
        .reveal-scale.revealed { opacity: 1; transform: scale(1); }

        /* ── Deal-journey timeline ── */
        @keyframes trackShimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .journey-track {
          background: linear-gradient(90deg,
            #E2E8F0 0%, #E2E8F0 30%,
            #F5A623 45%, #E87722 50%, #0A7E8C 55%,
            #E2E8F0 70%, #E2E8F0 100%);
          background-size: 200% 100%;
          animation: trackShimmer 4.2s linear infinite;
        }
        @keyframes dotTravel {
          0%   { left: 8%;  opacity: 0; }
          5%   { opacity: 1; }
          92%  { opacity: 1; }
          100% { left: 92%; opacity: 0; }
        }
        .journey-dot {
          width: 14px; height: 14px; border-radius: 9999px;
          background: radial-gradient(circle, #FFFFFF 0%, #F5A623 45%, transparent 75%);
          box-shadow: 0 0 18px 5px rgba(245,166,35,0.55);
          transform: translate(-50%, -42%);
          animation: dotTravel 4.2s ease-in-out infinite;
        }
        @keyframes nodeGlow {
          0%, 18%, 100% {
            transform: translateY(0) scale(1);
            box-shadow: 0 0 0 0 transparent;
          }
          8% {
            transform: translateY(-5px) scale(1.08);
            box-shadow: 0 10px 28px -6px color-mix(in srgb, var(--c) 45%, transparent),
                        0 0 0 8px color-mix(in srgb, var(--c) 12%, transparent);
          }
        }
        .journey-node { animation: nodeGlow 4.2s ease-in-out infinite; }
        @media (prefers-reduced-motion: reduce) {
          .journey-track, .journey-dot, .journey-node, .float-card { animation: none; }
        }
      `}</style>

      <div className="min-h-screen bg-white text-[#1B3A5C] overflow-x-hidden">

        {/* ── Navbar ── */}
        <header className="sticky top-0 z-50 bg-[#0C1F35]/95 backdrop-blur-xl border-b border-white/10">
          <div className="max-w-7xl mx-auto px-5 sm:px-8 h-16 flex items-center justify-between">
            <DealioLogo size="sm" variant="light" to="/home" />

            <nav className="hidden md:flex items-center gap-8 text-sm font-medium text-white/70">
              {[['#roles','Who it\'s for'],['#features','Features'],['#journey','Deal journey'],['#testimonials','Stories']].map(([href, label]) => (
                <a key={href} href={href} className="hover:text-white transition-colors">{label}</a>
              ))}
            </nav>

            <div className="hidden md:flex items-center gap-2.5">
              {user ? (
                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium text-white/70">Hi, <span className="font-bold text-white">{user.name}</span></span>
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
                    <button className="px-4 py-2 rounded-xl text-sm font-semibold text-white/90 hover:bg-white/10 transition-colors">
                      Sign In
                    </button>
                  </Link>
                  <Link to="/login?tab=signup">
                    <button className="px-4 py-2 rounded-xl text-sm font-bold text-white shadow-lg shadow-[#E87722]/25 hover:-translate-y-px active:translate-y-0 transition-all"
                      style={{ background: 'linear-gradient(135deg, #EFAE54 0%, #E0833A 55%, #C8621D 100%)' }}>
                      Get Started
                    </button>
                  </Link>
                </>
              )}
            </div>

            <button className="md:hidden p-2 rounded-lg text-white/80 hover:bg-white/10 transition-colors"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
              {mobileMenuOpen ? <X size={20} /> : <Menu size={20} />}
            </button>
          </div>

          {mobileMenuOpen && (
            <div className="md:hidden border-t border-white/10 bg-[#0C1F35] px-5 py-4 space-y-1">
              {[['#roles','Who it\'s for'],['#features','Features'],['#journey','Deal journey'],['#testimonials','Stories']].map(([href, label]) => (
                <a key={href} href={href} onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2.5 rounded-lg text-sm font-medium text-white/70 hover:bg-white/5 hover:text-white">{label}</a>
              ))}
              <div className="flex gap-2 pt-3 border-t border-white/10 mt-2">
                <Link to="/login" className="flex-1">
                  <button className="w-full py-2.5 rounded-xl text-sm font-semibold border border-white/20 text-white">Sign In</button>
                </Link>
                <Link to="/login?tab=signup" className="flex-1">
                  <button className="w-full py-2.5 rounded-xl text-sm font-bold text-white" style={{ background: 'linear-gradient(135deg,#E0833A,#C8621D)' }}>Get Started</button>
                </Link>
              </div>
            </div>
          )}
        </header>

        {/* ── Hero ── */}
        <section className="relative overflow-hidden"
          style={{ background: 'linear-gradient(160deg, #FFFFFF 0%, #F4F9FB 45%, #EAF2F4 100%)' }}>

          <div className="absolute inset-0 pointer-events-none" style={DOT_GRID} />

          <div className="absolute inset-0 pointer-events-none overflow-hidden">
            <div className="absolute -top-32 -right-32 w-[640px] h-[640px] rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(10,126,140,0.14) 0%, transparent 65%)' }} />
            <div className="absolute -bottom-24 -left-24 w-96 h-96 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(232,119,34,0.10) 0%, transparent 65%)' }} />
            <div className="absolute top-[45%] left-[38%] w-72 h-72 rounded-full"
              style={{ background: 'radial-gradient(circle, rgba(245,166,35,0.08) 0%, transparent 70%)' }} />
          </div>

          <div className="relative max-w-7xl mx-auto px-5 sm:px-8 pt-20 pb-16 md:pt-28 md:pb-24">
            <div className="max-w-3xl mx-auto text-center">

              <div className="hero-badge inline-flex items-center gap-2.5 px-4 py-2 rounded-full border border-slate-200 bg-white shadow-sm shadow-slate-200/60 text-slate-600 text-xs font-medium mb-8 tracking-wide">
                <Sparkles size={12} style={{ color: '#E0833A' }} />
                India's unified real-estate operating system
                <span className="ml-0.5 px-2 py-0.5 rounded-full text-white text-[10px] font-bold tracking-wider"
                  style={{ background: 'linear-gradient(135deg,#E0833A,#C8621D)' }}>NEW</span>
              </div>

              <h1 className="hero-title text-4xl sm:text-5xl md:text-6xl lg:text-[72px] font-extrabold text-[#1B3A5C] leading-[1.08] tracking-tight mb-6">
                One platform.<br />
                <span style={{ background: 'linear-gradient(90deg,#E0833A 0%,#C8621D 55%,#0A7E8C 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                  Every stakeholder
                </span><br />
                in your deal.
              </h1>

              <p className="hero-sub text-slate-600 text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed font-light">
                Dealio connects builders, channel partners, customers, banks and NRIs — so every transaction closes faster, with zero leakage.
              </p>

              <div className="hero-cta flex flex-col sm:flex-row items-center justify-center gap-3 mb-12">
                <Link to="/login?tab=signup">
                  <button className="group flex items-center gap-2.5 px-7 py-4 rounded-2xl font-bold text-sm text-white shadow-2xl shadow-[#E87722]/30 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                    style={{ background: 'linear-gradient(135deg,#EFAE54 0%,#E0833A 55%,#C8621D 100%)' }}>
                    Create free account
                    <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                  </button>
                </Link>
                <Link to="/login">
                  <button className="flex items-center gap-2 px-7 py-4 rounded-2xl font-bold text-sm bg-white border border-slate-200 text-[#1B3A5C] shadow-sm shadow-slate-200/60 hover:bg-slate-50 hover:-translate-y-0.5 active:translate-y-0 transition-all">
                    Sign in to dashboard
                  </button>
                </Link>
              </div>

              <div className="hero-trust flex flex-wrap items-center justify-center gap-3 sm:gap-5">
                {[['RERA-ready'], ['6 role portals'], ['WhatsApp-native'], ['AI-powered pricing']].map(([label]) => (
                  <span key={label} className="flex items-center gap-1.5 text-slate-500 text-xs font-medium">
                    <CheckCircle2 size={12} style={{ color: '#16A34A' }} /> {label}
                  </span>
                ))}
              </div>
            </div>

            {/* Dashboard preview cards */}
            <div className="hero-cards relative mt-16 max-w-4xl mx-auto">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4">
                {[
                  { icon: Zap,       label: 'Channel partner', value: 'Lead auto-scored',   delta: 'just now',  color: '#F5A623', progress: '30%'  },
                  { icon: Landmark,  label: 'Bank portal',     value: 'Loan sanctioned',    delta: 'synced',    color: '#38BDF8', progress: '55%'  },
                  { icon: Building2, label: 'Builder portal',  value: 'Demand letter sent', delta: 'auto',      color: '#0DAABF', progress: '80%'  },
                  { icon: HomeIcon,  label: 'Customer portal', value: 'Keys handed over',   delta: 'milestone', color: '#4ADE80', progress: '100%' },
                ].map((item, i) => (
                  <div key={item.label}
                    className="float-card group relative bg-white border border-slate-200/70 shadow-lg shadow-slate-200/50 rounded-2xl p-4 sm:p-5 hover:shadow-xl hover:shadow-slate-200/70 hover:border-slate-300/70 transition-all duration-200 overflow-hidden"
                    style={{ animationDelay: `${i * 0.4}s` }}>
                    <div className="absolute top-0 left-5 right-5 h-px opacity-0 group-hover:opacity-100 transition-opacity"
                      style={{ background: `linear-gradient(90deg, transparent, ${item.color}, transparent)` }} />
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center"
                        style={{ backgroundColor: item.color + '1F' }}>
                        <item.icon size={15} style={{ color: item.color }} />
                      </div>
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-slate-100 text-slate-500">{item.delta}</span>
                    </div>
                    <div className="text-base sm:text-lg font-extrabold text-[#1B3A5C] leading-snug">{item.value}</div>
                    <div className="text-slate-400 text-xs mt-0.5 font-medium">{item.label}</div>
                    <div className="mt-3 h-1 rounded-full bg-slate-100 overflow-hidden">
                      <div className="h-full rounded-full" style={{ width: item.progress, backgroundColor: item.color }} />
                    </div>
                  </div>
                ))}
              </div>

              <div className="absolute -top-3.5 right-3 sm:right-0 flex items-center gap-2 bg-white border border-slate-100 rounded-full px-3 py-1.5 shadow-xl shadow-slate-300/40 text-xs font-bold text-[#1B3A5C]">
                <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                One deal — every portal, live
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

        {/* ── Deal journey ── */}
        <section id="journey" className="bg-white py-14 sm:py-20 overflow-hidden">
          <div className="max-w-6xl mx-auto px-5 sm:px-8">
            <div className="reveal text-center max-w-2xl mx-auto mb-12 sm:mb-16">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#16A34A]/10 text-[#16A34A] text-xs font-bold uppercase tracking-widest mb-4">
                <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse" />
                One living timeline
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-[44px] font-extrabold text-[#1B3A5C] leading-tight tracking-tight">
                Watch a deal flow,<br className="hidden sm:block" /> lead to keys
              </h2>
              <p className="mt-3 text-slate-500 text-base leading-relaxed">
                Builders, channel partners, banks and customers all watch the same milestones
                light up in real time — no status calls, no guesswork.
              </p>
            </div>

            <div className="reveal relative">
              <div className="journey-track hidden md:block absolute top-7 left-[8%] right-[8%] h-[3px] rounded-full -translate-y-1/2" />
              <div className="journey-dot hidden md:block absolute top-7" />
              <div className="relative grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-x-4 gap-y-10">
                {journey.map((s, i) => (
                  <div key={s.label} className="flex flex-col items-center text-center">
                    <div className="journey-node w-14 h-14 rounded-2xl border flex items-center justify-center mb-4 relative z-10"
                      style={{ '--c': s.color, borderColor: s.color + '40', backgroundColor: '#FFFFFF', animationDelay: `${i * 0.7}s` } as React.CSSProperties}>
                      <s.icon size={22} style={{ color: s.color }} />
                    </div>
                    <div className="font-bold text-[#1B3A5C] text-sm leading-tight">{s.label}</div>
                    <div className="text-xs text-slate-400 mt-1 font-medium">{s.sub}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Roles ── */}
        <section id="roles" className="py-16 sm:py-20" style={{ background: 'linear-gradient(180deg, #F8FAFC 0%, #FFFFFF 100%)' }}>
          <div className="max-w-7xl mx-auto px-5 sm:px-8">
            <div className="reveal text-center max-w-2xl mx-auto mb-10">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#0A7E8C]/10 text-[#0A7E8C] text-xs font-bold uppercase tracking-widest mb-4">
                Role-based portals
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-[44px] font-extrabold text-[#1B3A5C] leading-tight tracking-tight">
                Built for every role<br className="hidden sm:block" /> in the deal
              </h2>
              <p className="mt-3 text-slate-500 text-base leading-relaxed">
                Pick your portal. Each one is purpose-built — not a generic dashboard repurposed for your role.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {roles.map((r, i) => (
                <Link to="/login?tab=signup" key={r.label}
                  className="reveal group relative bg-white rounded-2xl border border-slate-100 p-6 hover:shadow-xl hover:shadow-slate-200/70 hover:-translate-y-1.5 transition-all duration-200 overflow-hidden"
                  style={{ transitionDelay: `${i * 0.07}s` }}>
                  <div className="absolute left-0 top-4 bottom-4 w-[3px] rounded-full opacity-30 group-hover:opacity-100 transition-all"
                    style={{ backgroundColor: r.color }} />

                  <div className="w-11 h-11 rounded-2xl flex items-center justify-center mb-4"
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
            <div className="reveal text-center max-w-2xl mx-auto mb-10">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#E87722]/10 text-[#E87722] text-xs font-bold uppercase tracking-widest mb-5">
                Platform features
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#1B3A5C] leading-tight tracking-tight">
                Everything you need,<br className="hidden sm:block" /> nothing you don't
              </h2>
              <p className="mt-4 text-slate-500 text-lg leading-relaxed">
                Six core engines that power every deal from first lead to final possession.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {features.map((f, i) => (
                <div key={f.num}
                  className="reveal group relative bg-[#F8FAFC] rounded-2xl border border-slate-100 p-7 hover:bg-white hover:shadow-2xl hover:shadow-slate-200/60 hover:-translate-y-1.5 transition-all duration-200 overflow-hidden"
                  style={{ transitionDelay: `${i * 0.07}s` }}>
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
          style={{ background: 'linear-gradient(160deg, #F1F6F9 0%, #F8FAFC 55%, #FFFFFF 100%)' }}>
          <div className="absolute inset-0 pointer-events-none" style={DOT_GRID} />
          <div className="absolute -top-40 -right-40 w-[500px] h-[500px] rounded-full pointer-events-none"
            style={{ background: 'radial-gradient(circle, rgba(10,126,140,0.08) 0%, transparent 65%)' }} />

          <div className="relative max-w-7xl mx-auto px-5 sm:px-8">
            <div className="reveal text-center mb-14">
              <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-[#6B3FA0]/10 text-[#6B3FA0] text-xs font-bold uppercase tracking-widest mb-5">
                Real stories
              </span>
              <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#1B3A5C] leading-tight tracking-tight">
                Trusted by India's top<br className="hidden sm:block" /> real-estate professionals
              </h2>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {testimonials.map((t, i) => (
                <div key={t.name}
                  className="reveal relative bg-white border border-slate-100 shadow-sm rounded-2xl p-7 hover:shadow-xl hover:shadow-slate-200/60 hover:-translate-y-1 transition-all duration-200 flex flex-col"
                  style={{ transitionDelay: `${i * 0.1}s` }}>
                  <span className="absolute top-4 right-6 text-6xl font-black leading-none select-none pointer-events-none"
                    style={{ color: 'rgba(27,58,92,0.06)' }}>"</span>

                  <div className="flex gap-0.5 mb-5">
                    {[...Array(5)].map((_, idx) => (
                      <svg key={idx} width="14" height="14" viewBox="0 0 20 20" fill="#F5A623">
                        <path d="M10 1l2.39 5.26 5.61.49-4.19 3.74 1.3 5.51L10 13.27l-5.11 2.73 1.3-5.51L2 6.75l5.61-.49z"/>
                      </svg>
                    ))}
                  </div>

                  <p className="text-slate-600 text-sm leading-[1.75] mb-6 flex-1">"{t.quote}"</p>

                  <div className="border-t border-slate-100 pt-4 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-black text-white flex-shrink-0"
                      style={{ background: `linear-gradient(135deg, ${t.color} 0%, ${t.color}BB 100%)` }}>
                      {t.avatar}
                    </div>
                    <div>
                      <div className="font-bold text-[#1B3A5C] text-sm leading-tight">{t.name}</div>
                      <div className="text-slate-400 text-xs mt-0.5">{t.role}</div>
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
            <div className="reveal-scale relative rounded-3xl overflow-hidden border border-slate-200/70 shadow-xl shadow-slate-200/60"
              style={{ background: 'linear-gradient(150deg, #FFFFFF 0%, #F4F9FA 50%, #EDF5F1 100%)' }}>
              <div className="absolute inset-0 pointer-events-none" style={DOT_GRID} />
              <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(10,126,140,0.12) 0%, transparent 65%)' }} />
              <div className="absolute -bottom-20 -left-20 w-64 h-64 rounded-full pointer-events-none"
                style={{ background: 'radial-gradient(circle, rgba(232,119,34,0.10) 0%, transparent 65%)' }} />

              <div className="relative px-8 py-14 sm:px-14 sm:py-20">
                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white border border-slate-200 shadow-sm text-[#0A7E8C] text-xs font-bold uppercase tracking-widest mb-7">
                  <Sparkles size={11} style={{ color: '#E0833A' }} /> Free to get started
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl font-extrabold text-[#1B3A5C] leading-tight tracking-tight mb-4">
                  Ready to close<br /> deals faster?
                </h2>
                <p className="text-slate-500 text-lg mb-10 max-w-xl mx-auto leading-relaxed">
                  Join the builders, channel partners and banks already running every stage of their deals on Dealio. No credit card needed.
                </p>
                <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
                  <Link to="/login?tab=signup">
                    <button className="group flex items-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-sm text-white shadow-2xl shadow-[#E87722]/30 hover:-translate-y-0.5 active:translate-y-0 transition-all"
                      style={{ background: 'linear-gradient(135deg,#EFAE54 0%,#E0833A 55%,#C8621D 100%)' }}>
                      Get started free
                      <ArrowRight size={16} className="group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  </Link>
                  <Link to="/login">
                    <button className="flex items-center gap-2.5 px-8 py-4 rounded-2xl font-bold text-sm bg-white border border-slate-200 text-[#1B3A5C] shadow-sm hover:bg-slate-50 hover:-translate-y-0.5 transition-all">
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
                {[['#roles','Who it\'s for'],['#features','Features'],['#journey','Deal journey'],['#testimonials','Stories']].map(([href, label]) => (
                  <a key={href} href={href} className="hover:text-white/80 transition-colors">{label}</a>
                ))}
                <Link to="/login"  className="hover:text-white/80 transition-colors">Sign In</Link>
                <Link to="/login?tab=signup" className="hover:text-white/80 transition-colors">Sign Up</Link>
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
    </>
  );
};

export default Home;