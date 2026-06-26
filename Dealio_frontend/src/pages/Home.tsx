import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '@/stores/useAuthStore';
import {
  Building2, Users, Home as HomeIcon, Landmark, Globe2, ShieldCheck,
  ArrowRight, ArrowUpRight, Menu, X,
} from 'lucide-react';
import { DealioLogo } from '@/components/shared/DealioLogo';

/* ────────────────────────────────────────────────────────────────────────────
   Dealio — home page
   Aesthetic: editorial proptech. Warm paper, ink navy, a single terracotta
   accent. Fraunces (serif) for display, Plus Jakarta Sans for body, Geist Mono
   for indices/labels. Hairline rules, numbered sections, structured layout.
   ──────────────────────────────────────────────────────────────────────────── */

const NAV = [
  ['#who', 'Who it’s for'],
  ['#ledger', 'The ledger'],
  ['#system', 'The system'],
  ['#voices', 'Voices'],
] as const;

const roles = [
  { n: '01', icon: Building2,   label: 'Builders',         line: 'Inventory, RERA filings, demand letters & AI-led pricing.' },
  { n: '02', icon: Users,       label: 'Channel partners', line: 'One pipeline, shared brochures, clean commission ledgers.' },
  { n: '03', icon: HomeIcon,    label: 'Customers',        line: 'A live journey, EMI clarity and every document in one place.' },
  { n: '04', icon: Landmark,    label: 'Banks',            line: 'Loan cases with TAT tracking and a transparent approval trail.' },
  { n: '05', icon: Globe2,      label: 'NRI buyers',       line: 'POA, FEMA and repatriation — managed from anywhere on earth.' },
  { n: '06', icon: ShieldCheck, label: 'Admin',            line: 'Onboarding, fraud signals and revenue, under one roof.' },
];

/* The deal ledger shown in the hero — a real product artifact, not floating cards */
const ledger = [
  { stage: 'Lead',        portal: 'CP',       note: 'Auto-scored · 92', done: true },
  { stage: 'Site visit',  portal: 'Customer', note: 'GPS verified',     done: true },
  { stage: 'Agreement',   portal: 'Builder',  note: 'RERA-ready',       done: true },
  { stage: 'Loan',        portal: 'HDFC',     note: 'Sanctioned',       done: true },
  { stage: 'Commission',  portal: 'CP',       note: '₹2.4L released',   done: false, active: true },
  { stage: 'Possession',  portal: 'Customer', note: 'Keys pending',     done: false },
];

const stats = [
  { v: '₹4,200 Cr', k: 'transacted on platform' },
  { v: '13', k: 'milestones, one timeline' },
  { v: '6', k: 'role-built portals' },
  { v: '60%', k: 'less follow-up time' },
];

const system = [
  { n: '01', title: 'Universal milestones', line: 'A 13-stage journey that builder, channel partner, bank and buyer all read from the same source — no parallel WhatsApp threads.' },
  { n: '02', title: 'Lead intelligence',    line: 'Leads scored 0–100 the moment they land, with instant eligibility checks and GPS-verified walk-ins.' },
  { n: '03', title: 'Commission engine',    line: 'Real-time payouts, L1/L2 referral bonuses and an audit trail a partner can actually trust.' },
  { n: '04', title: 'RERA, handled',        line: 'Generate filings, track deadlines and keep every project document in one auditable vault.' },
  { n: '05', title: 'WhatsApp-native',      line: 'Broadcasts, demand letters and OTPs flow through the layer your teams already live in.' },
  { n: '06', title: 'Pricing that moves',   line: 'Daily price guidance from project velocity, comparable sales and live demand signals.' },
];

const Home = () => {
  const [open, setOpen] = useState(false);
  const { user } = useAuthStore();

  useEffect(() => {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => {
        if (e.isIntersecting) { e.target.classList.add('shown'); io.unobserve(e.target); }
      }),
      { threshold: 0.12, rootMargin: '0px 0px -50px 0px' }
    );
    document.querySelectorAll('.rise').forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, []);

  return (
    <div className="dealio-home min-h-screen antialiased">
      <style>{`
        .dealio-home {
          --ink:    #0A1628;
          --ink-2:  #07101C;
          --muted:  #5C6B7C;
          --paper:  #FFFFFF;
          --paper-2:#F4F6F8;
          --line:   rgba(10,22,40,0.13);
          --line-2: rgba(10,22,40,0.07);
          --brand:   #0A7E8C;
          --brand-2: #0DAABF;
          --warm:    #F5A623;
          --warm-2:  #E87722;
          --teal:   #0A7E8C;
          background: var(--paper);
          color: var(--ink);
          font-feature-settings: "ss01","cv01";
        }
        .ff-serif { font-family: "Fraunces", Georgia, "Times New Roman", serif; font-optical-sizing: auto; }
        .ff-mono  { font-family: "Geist Mono", ui-monospace, SFMono-Regular, Menlo, monospace; }
        .kicker {
          font-family: "Geist Mono", ui-monospace, monospace;
          font-size: 11px; letter-spacing: 0.22em; text-transform: uppercase;
        }
        .grain::after {
          content:""; position:fixed; inset:0; z-index:60; pointer-events:none;
          opacity:.02; mix-blend-mode:multiply;
          background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        }
        .link-underline { position:relative; }
        .link-underline::after {
          content:""; position:absolute; left:0; bottom:-3px; height:1px; width:100%;
          background:currentColor; transform:scaleX(0); transform-origin:left;
          transition:transform .35s cubic-bezier(.22,1,.36,1);
        }
        .link-underline:hover::after { transform:scaleX(1); }

        @keyframes up { from { opacity:0; transform:translateY(22px); } to { opacity:1; transform:translateY(0); } }
        .in-1 { animation: up .8s cubic-bezier(.22,1,.36,1) .05s both; }
        .in-2 { animation: up .8s cubic-bezier(.22,1,.36,1) .16s both; }
        .in-3 { animation: up .8s cubic-bezier(.22,1,.36,1) .27s both; }
        .in-4 { animation: up .8s cubic-bezier(.22,1,.36,1) .38s both; }
        .in-5 { animation: up .9s cubic-bezier(.22,1,.36,1) .50s both; }

        .rise { opacity:0; transform:translateY(26px); transition:opacity .8s cubic-bezier(.22,1,.36,1), transform .8s cubic-bezier(.22,1,.36,1); }
        .rise.shown { opacity:1; transform:translateY(0); }

        @keyframes pulseDot { 0%,100%{opacity:1;transform:scale(1);} 50%{opacity:.35;transform:scale(.7);} }
        .live-dot { animation: pulseDot 1.8s ease-in-out infinite; }

        @keyframes flow { 0%{ left:-30%; } 100%{ left:130%; } }
        .flow-line { position:relative; overflow:hidden; }
        .flow-line::after { content:""; position:absolute; top:0; bottom:0; width:30%;
          background:linear-gradient(90deg, transparent, var(--brand-2), transparent);
          animation: flow 3.4s ease-in-out infinite; }

        @media (prefers-reduced-motion: reduce) {
          .in-1,.in-2,.in-3,.in-4,.in-5,.rise { animation:none!important; opacity:1!important; transform:none!important; }
          .live-dot,.flow-line::after { animation:none!important; }
        }
      `}</style>

      <div className="grain" />

      {/* ─── Nav ─────────────────────────────────────────────────────────────── */}
      <header className="sticky top-0 z-50 border-b border-[var(--line)] bg-[var(--paper)]/85 backdrop-blur-md">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 h-[68px] flex items-center justify-between">
          <DealioLogo size="sm" variant="default" to="/home" />

          <nav className="hidden md:flex items-center gap-9 kicker text-[var(--muted)]">
            {NAV.map(([href, label]) => (
              <a key={href} href={href} className="link-underline hover:text-[var(--ink)] transition-colors">{label}</a>
            ))}
          </nav>

          <div className="hidden md:flex items-center gap-3">
            {user ? (
              <>
                <span className="kicker text-[var(--muted)]">{user.name}</span>
                <Link to={`/${user.role}`}
                  className="group inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-[var(--paper)] bg-[var(--ink)] rounded-full hover:bg-[var(--brand)] transition-colors">
                  Dashboard <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </>
            ) : (
              <>
                <Link to="/login" className="text-sm font-semibold link-underline">Sign in</Link>
                <Link to="/login?tab=signup"
                  className="group inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-[var(--paper)] bg-[var(--ink)] rounded-full hover:bg-[var(--brand)] transition-colors">
                  Get started <ArrowRight size={15} className="group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </>
            )}
          </div>

          <button className="md:hidden p-2 -mr-2" onClick={() => setOpen(!open)} aria-label="Menu">
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {open && (
          <div className="md:hidden border-t border-[var(--line)] bg-[var(--paper)] px-5 py-5">
            {NAV.map(([href, label]) => (
              <a key={href} href={href} onClick={() => setOpen(false)}
                className="block py-2.5 ff-serif text-xl">{label}</a>
            ))}
            <div className="flex gap-3 pt-4 mt-3 border-t border-[var(--line)]">
              <Link to="/login" className="flex-1 text-center py-3 rounded-full border border-[var(--ink)] text-sm font-semibold">Sign in</Link>
              <Link to="/login?tab=signup" className="flex-1 text-center py-3 rounded-full bg-[var(--ink)] text-[var(--paper)] text-sm font-semibold">Get started</Link>
            </div>
          </div>
        )}
      </header>

      {/* ─── Hero ────────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(120% 90% at 85% -10%, rgba(224,123,54,0.10), transparent 55%), radial-gradient(80% 60% at 0% 100%, rgba(10,126,140,0.07), transparent 60%)' }} />
        <div className="relative max-w-[1240px] mx-auto px-5 sm:px-8 pt-16 pb-20 md:pt-24 md:pb-28">
          <div className="grid lg:grid-cols-12 gap-12 lg:gap-10 items-end">

            {/* Left — headline */}
            <div className="lg:col-span-7">
              <div className="in-1 flex items-center gap-3 mb-8">
                <span className="kicker text-[var(--brand)]">India’s real-estate operating system</span>
                <span className="h-px flex-1 max-w-[120px] bg-[var(--line)]" />
              </div>

              <h1 className="in-2 ff-serif font-light leading-[0.98] tracking-[-0.02em] text-[var(--ink)]"
                style={{ fontSize: 'clamp(2.7rem, 6.4vw, 5.4rem)' }}>
                One platform.<br />
                <span className="italic" style={{ background: 'linear-gradient(90deg,#FCD34D 0%,#F59E0B 45%,#E87722 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Every stakeholder</span><br />
                in your deal.
              </h1>

              <p className="in-3 mt-8 max-w-xl text-[17px] leading-relaxed text-[var(--muted)]">
                Builders, channel partners, customers, banks and NRIs work the same
                transaction in real time — so deals close faster and not a rupee of
                commission leaks along the way.
              </p>

              <div className="in-4 mt-10 flex flex-col sm:flex-row sm:items-center gap-4">
                <Link to="/login?tab=signup"
                  className="group inline-flex items-center justify-center gap-2.5 px-7 py-4 rounded-full bg-[var(--brand)] text-white text-sm font-semibold tracking-wide hover:bg-[var(--ink)] transition-colors">
                  Create a free account
                  <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link to="/login" className="inline-flex items-center gap-2 text-sm font-semibold link-underline self-center">
                  Sign in to your portal
                </Link>
              </div>

              <div className="in-5 mt-12 flex flex-wrap items-center gap-x-8 gap-y-2 kicker text-[var(--muted)]">
                <span>RERA-ready</span><span className="text-[var(--line)]">/</span>
                <span>WhatsApp-native</span><span className="text-[var(--line)]">/</span>
                <span>AI pricing</span><span className="text-[var(--line)]">/</span>
                <span>Zero-leak commissions</span>
              </div>
            </div>

            {/* Right — the deal ledger */}
            <div className="lg:col-span-5 in-5">
              <div className="relative bg-[var(--ink)] text-[var(--paper)] rounded-2xl p-6 sm:p-7 shadow-[0_30px_60px_-30px_rgba(17,36,59,0.55)]">
                <div className="flex items-center justify-between pb-4 border-b border-white/12">
                  <div>
                    <div className="kicker text-white/45">Live deal</div>
                    <div className="ff-mono text-sm mt-1 text-white/90">DLO-4471 · Prestige Lakeside</div>
                  </div>
                  <span className="inline-flex items-center gap-1.5 kicker text-[var(--warm-2)]">
                    <span className="live-dot w-1.5 h-1.5 rounded-full bg-[var(--warm-2)]" /> open
                  </span>
                </div>

                <div className="divide-y divide-white/8">
                  {ledger.map((r) => (
                    <div key={r.stage} className="flex items-center gap-3 py-3">
                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ff-mono shrink-0 ${
                        r.done ? 'bg-[var(--brand-2)] text-[var(--ink)]' : r.active ? 'border border-[var(--warm-2)] text-[var(--warm-2)]' : 'border border-white/20 text-white/35'
                      }`}>{r.done ? '✓' : '·'}</span>
                      <span className="text-sm font-medium flex-1">{r.stage}</span>
                      <span className="kicker text-white/35">{r.portal}</span>
                      <span className={`ff-mono text-xs text-right w-[88px] ${r.active ? 'text-[var(--warm-2)]' : r.done ? 'text-white/70' : 'text-white/30'}`}>{r.note}</span>
                    </div>
                  ))}
                </div>

                <div className="mt-4 pt-4 border-t border-white/12">
                  <div className="flex items-center justify-between kicker text-white/45 mb-2">
                    <span>progress</span><span className="text-[var(--brand-2)]">67%</span>
                  </div>
                  <div className="flow-line h-1 rounded-full bg-white/10 overflow-hidden">
                    <div className="h-full rounded-full bg-[var(--brand-2)]" style={{ width: '67%' }} />
                  </div>
                </div>
              </div>
              <p className="mt-3 text-center kicker text-[var(--muted)]">one deal — read by every portal, live</p>
            </div>
          </div>
        </div>

        {/* stat band */}
        <div className="border-y border-[var(--line)] bg-[var(--paper-2)]">
          <div className="max-w-[1240px] mx-auto px-5 sm:px-8 grid grid-cols-2 lg:grid-cols-4 divide-x divide-[var(--line)]">
            {stats.map((s) => (
              <div key={s.k} className="py-7 px-5 first:pl-0">
                <div className="ff-serif text-3xl sm:text-[2.4rem] leading-none text-[var(--ink)]">{s.v}</div>
                <div className="mt-2 kicker text-[var(--muted)] !tracking-[0.12em] normal-case" style={{ textTransform: 'none' }}>{s.k}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Who it’s for ────────────────────────────────────────────────────── */}
      <section id="who" className="py-20 sm:py-28">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8">
          <div className="rise grid lg:grid-cols-12 gap-8 items-end mb-14">
            <div className="lg:col-span-8">
              <div className="kicker text-[var(--brand)] mb-5">[ 01 ] — Who it’s for</div>
              <h2 className="ff-serif font-light leading-[1.04] tracking-[-0.02em]" style={{ fontSize: 'clamp(2rem,4.4vw,3.4rem)' }}>
                Six portals, purpose-built —<br className="hidden sm:block" /> not one dashboard wearing six hats.
              </h2>
            </div>
            <p className="lg:col-span-4 text-[var(--muted)] leading-relaxed">
              Each role sees the work the way they actually do it. Same deal underneath,
              a different lens on top.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 border-t border-l border-[var(--line)]">
            {roles.map((r, i) => (
              <Link to="/login?tab=signup" key={r.label}
                className="rise group relative border-b border-r border-[var(--line)] p-7 sm:p-8 hover:bg-[var(--paper-2)] transition-colors"
                style={{ transitionDelay: `${i * 50}ms` }}>
                <div className="flex items-start justify-between mb-10">
                  <span className="ff-mono text-xs text-[var(--muted)]">{r.n}</span>
                  <r.icon size={20} strokeWidth={1.5} className="text-[var(--ink)] group-hover:text-[var(--brand)] transition-colors" />
                </div>
                <div className="ff-serif text-2xl mb-2 text-[var(--ink)]">{r.label}</div>
                <p className="text-sm text-[var(--muted)] leading-relaxed pr-2">{r.line}</p>
                <span className="mt-5 inline-flex items-center gap-1.5 kicker text-[var(--brand)] opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                  Open portal <ArrowUpRight size={13} />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ─── The ledger (journey) ────────────────────────────────────────────── */}
      <section id="ledger" className="py-20 sm:py-28 bg-[var(--ink)] text-[var(--paper)] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none opacity-[0.6]"
          style={{ background: 'radial-gradient(70% 50% at 50% 0%, rgba(224,123,54,0.16), transparent 60%)' }} />
        <div className="relative max-w-[1240px] mx-auto px-5 sm:px-8">
          <div className="rise max-w-2xl mb-16">
            <div className="kicker text-[var(--brand-2)] mb-5">[ 02 ] — The ledger</div>
            <h2 className="ff-serif font-light leading-[1.05] tracking-[-0.02em]" style={{ fontSize: 'clamp(2rem,4.4vw,3.4rem)' }}>
              From first lead to handed-over keys — one moving line.
            </h2>
            <p className="mt-5 text-white/55 leading-relaxed">
              No status calls, no “let me check and revert.” Everyone watches the same
              milestones light up, the moment they happen.
            </p>
          </div>

          <div className="rise relative">
            <div className="flow-line hidden md:block absolute top-[22px] left-0 right-0 h-px bg-white/15" />
            <ol className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-y-10 gap-x-4">
              {ledger.map((s, i) => (
                <li key={s.stage} className="relative">
                  <div className="relative z-10 w-11 h-11 rounded-full flex items-center justify-center mb-5 ff-mono text-xs"
                    style={{
                      background: s.done ? 'var(--brand-2)' : 'var(--ink)',
                      color: s.done ? 'var(--ink)' : (s.active ? 'var(--warm-2)' : 'rgba(255,255,255,0.4)'),
                      border: s.done ? 'none' : `1px solid ${s.active ? 'var(--warm-2)' : 'rgba(255,255,255,0.2)'}`,
                    }}>
                    {String(i + 1).padStart(2, '0')}
                  </div>
                  <div className="font-medium text-[15px]">{s.stage}</div>
                  <div className="kicker text-white/40 mt-1">{s.note}</div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* ─── The system (features) ───────────────────────────────────────────── */}
      <section id="system" className="py-20 sm:py-28">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8">
          <div className="rise max-w-2xl mb-14">
            <div className="kicker text-[var(--brand)] mb-5">[ 03 ] — The system</div>
            <h2 className="ff-serif font-light leading-[1.04] tracking-[-0.02em]" style={{ fontSize: 'clamp(2rem,4.4vw,3.4rem)' }}>
              Everything the deal needs.<br />Nothing it doesn’t.
            </h2>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 border-t border-l border-[var(--line)]">
            {system.map((f, i) => (
              <div key={f.n} className="rise group border-b border-r border-[var(--line)] p-8 hover:bg-[var(--ink)] transition-colors duration-300"
                style={{ transitionDelay: `${i * 50}ms` }}>
                <div className="ff-mono text-sm text-[var(--brand)] mb-6">{f.n}</div>
                <h3 className="ff-serif text-2xl mb-3 text-[var(--ink)] group-hover:text-[var(--paper)] transition-colors">{f.title}</h3>
                <p className="text-sm text-[var(--muted)] leading-relaxed group-hover:text-white/55 transition-colors">{f.line}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Voices ──────────────────────────────────────────────────────────── */}
      <section id="voices" className="py-20 sm:py-28 bg-[var(--paper-2)] border-y border-[var(--line)]">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8">
          <div className="rise kicker text-[var(--brand)] mb-10">[ 04 ] — Voices</div>
          <figure className="rise max-w-4xl">
            <blockquote className="ff-serif font-light leading-[1.15] tracking-[-0.015em] text-[var(--ink)]"
              style={{ fontSize: 'clamp(1.7rem,3.8vw,3rem)' }}>
              “Dealio cut our channel-partner follow-up by <span className="italic text-[var(--warm-2)]">sixty percent</span>.
              Every stakeholder finally reads the same deal status — in real time.”
            </blockquote>
            <figcaption className="mt-8 flex items-center gap-4">
              <span className="w-11 h-11 rounded-full bg-[var(--ink)] text-[var(--paper)] flex items-center justify-center ff-mono text-sm">PS</span>
              <span>
                <span className="block font-semibold text-[var(--ink)]">Priya Sharma</span>
                <span className="block kicker text-[var(--muted)] mt-0.5">Sales Head · Prestige Group</span>
              </span>
            </figcaption>
          </figure>

          <div className="rise grid sm:grid-cols-2 gap-px mt-16 bg-[var(--line)] border border-[var(--line)]">
            {[
              { q: 'Finally a platform that speaks banker. TAT tracking alone saved two weeks per loan case.', who: 'Ramesh B.', role: 'Branch Manager · HDFC Bank' },
              { q: 'As an NRI, managing property remotely was a nightmare. Dealio made it boring — in the best way.', who: 'Arjun M.', role: 'NRI Buyer · Dubai' },
            ].map((t) => (
              <div key={t.who} className="bg-[var(--paper)] p-8">
                <p className="text-[var(--ink)] leading-relaxed mb-5">“{t.q}”</p>
                <div className="font-semibold text-sm text-[var(--ink)]">{t.who}</div>
                <div className="kicker text-[var(--muted)] mt-1">{t.role}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA ─────────────────────────────────────────────────────────────── */}
      <section className="bg-[var(--ink)] text-[var(--paper)] relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none"
          style={{ background: 'radial-gradient(60% 80% at 100% 0%, rgba(224,123,54,0.18), transparent 55%)' }} />
        <div className="relative max-w-[1240px] mx-auto px-5 sm:px-8 py-24 sm:py-32">
          <div className="rise max-w-3xl">
            <div className="kicker text-[var(--brand-2)] mb-7">Free to begin</div>
            <h2 className="ff-serif font-light leading-[1.02] tracking-[-0.02em]" style={{ fontSize: 'clamp(2.4rem,6vw,4.6rem)' }}>
              Close the next deal<br />with everyone in the room.
            </h2>
            <p className="mt-7 text-white/55 text-lg max-w-xl leading-relaxed">
              The builders, channel partners and banks already running their pipeline on
              Dealio aren’t going back to spreadsheets. No card required.
            </p>
            <div className="mt-10 flex flex-col sm:flex-row gap-4">
              <Link to="/login?tab=signup"
                className="group inline-flex items-center justify-center gap-2.5 px-8 py-4 rounded-full bg-[var(--brand)] text-white text-sm font-semibold hover:bg-white hover:text-[var(--ink)] transition-colors">
                Get started free <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link to="/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 rounded-full border border-white/25 text-sm font-semibold hover:bg-white/5 transition-colors">
                Sign in to your portal
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ─── Footer ──────────────────────────────────────────────────────────── */}
      <footer className="bg-[var(--ink-2)] text-[var(--paper)]">
        <div className="max-w-[1240px] mx-auto px-5 sm:px-8 py-16">
          <div className="grid md:grid-cols-12 gap-10">
            <div className="md:col-span-5">
              <DealioLogo size="sm" variant="light" />
              <p className="mt-4 text-white/40 text-sm max-w-xs leading-relaxed">
                India’s unified real-estate operating system — every stakeholder in the
                deal, reading from one ledger.
              </p>
            </div>
            <nav className="md:col-span-4 md:col-start-9">
              <div className="kicker text-white/30 mb-4">Explore</div>
              <ul className="space-y-2.5">
                {NAV.map(([href, label]) => (
                  <li key={href}><a href={href} className="text-white/65 hover:text-white link-underline transition-colors">{label}</a></li>
                ))}
                <li><Link to="/login" className="text-white/65 hover:text-white link-underline transition-colors">Sign in</Link></li>
                <li><Link to="/login?tab=signup" className="text-white/65 hover:text-white link-underline transition-colors">Create account</Link></li>
              </ul>
            </nav>
          </div>
          <div className="mt-14 pt-7 border-t border-white/10 flex flex-col sm:flex-row items-center justify-between gap-3 kicker text-white/30">
            <span>© {new Date().getFullYear()} Dealio — built with care in India</span>
            <span className="flex gap-6">
              <a href="#" className="hover:text-white/60 transition-colors">Privacy</a>
              <a href="#" className="hover:text-white/60 transition-colors">Terms</a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
