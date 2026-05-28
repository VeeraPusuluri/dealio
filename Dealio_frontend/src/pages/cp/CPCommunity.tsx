import DashboardLayout from '@/components/layout/DashboardLayout';
import { useAuthStore } from '@/stores/useAuthStore';
import { Users, Bell, Gift, MessageSquare, Upload, ShoppingBag } from 'lucide-react';

const FEATURES = [
  {
    icon: Bell,
    title: 'Society Notices',
    desc: 'Broadcast important updates, events, and maintenance alerts to all residents in a project community.',
  },
  {
    icon: Gift,
    title: 'Group Deals',
    desc: 'Negotiate bulk discounts with interior designers, modular kitchen vendors, and home appliance brands.',
  },
  {
    icon: MessageSquare,
    title: 'Resident Forum',
    desc: 'A private WhatsApp-style forum for residents to connect, ask questions, and share move-in experiences.',
  },
  {
    icon: ShoppingBag,
    title: 'Vendor Marketplace',
    desc: 'Vetted vendors for painting, carpentry, plumbing, and interior work — at pre-negotiated rates.',
  },
  {
    icon: Upload,
    title: 'Resident Onboarding',
    desc: 'Upload a CSV of flat owners to invite them to the community and enable group buying power.',
  },
];

export default function CPCommunity() {
  const { user } = useAuthStore();

  return (
    <DashboardLayout>
      <div className="space-y-5 pb-8 max-w-2xl">

        <div>
          <h1 className="text-[17px] font-bold text-foreground">Community</h1>
          <p className="text-[12px] text-muted-foreground mt-0.5">Connect residents, unlock group benefits, build long-term relationships</p>
        </div>

        {/* Hero card */}
        <div className="rounded-2xl overflow-hidden border border-border">
          <div className="px-6 py-8 text-center" style={{ background: 'linear-gradient(135deg,#0A7E8C15 0%,#0d948815 100%)' }}>
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
              style={{ background: 'linear-gradient(135deg,#0A7E8C,#0d9488)' }}>
              <Users size={24} className="text-white" />
            </div>
            <h2 className="text-[16px] font-bold text-foreground">Community Hub</h2>
            <p className="text-[12px] text-muted-foreground mt-2 max-w-md mx-auto">
              After a deal is closed, your role doesn't end — it evolves. The Community Hub helps you stay connected with buyers even after possession, creating referrals and long-term loyalty.
            </p>
            <span className="inline-block mt-4 text-[11px] font-bold px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
              Launching Soon
            </span>
          </div>
        </div>

        {/* Upcoming features */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <p className="text-[12px] font-bold uppercase tracking-wide text-muted-foreground mb-4">What's Coming</p>
          <div className="space-y-4">
            {FEATURES.map(f => {
              const Icon = f.icon;
              return (
                <div key={f.title} className="flex items-start gap-3.5">
                  <div className="w-9 h-9 rounded-xl bg-teal-50 flex items-center justify-center shrink-0">
                    <Icon size={16} className="text-teal-600" />
                  </div>
                  <div>
                    <p className="text-[13px] font-semibold text-foreground">{f.title}</p>
                    <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">{f.desc}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Early access */}
        <div className="rounded-2xl border border-border bg-card p-5">
          <h3 className="text-[13px] font-bold text-foreground mb-2">Get Early Access</h3>
          <p className="text-[12px] text-muted-foreground mb-4">
            We're rolling out Community to select CPs first. Share your project and we'll notify {user?.name?.split(' ')[0] ?? 'you'} when it's ready.
          </p>
          <button
            onClick={() => {
              const msg = encodeURIComponent('Hi Dealio team! I would like early access to the Community Hub feature.');
              window.open(`https://wa.me/919000000000?text=${msg}`, '_blank');
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-[12px] font-semibold text-white hover:opacity-90 transition-all"
            style={{ background: 'linear-gradient(135deg,#0A7E8C,#0d9488)' }}>
            <MessageSquare size={13} /> Request Early Access
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
