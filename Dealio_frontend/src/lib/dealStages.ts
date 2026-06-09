// ─── Deal stage machine — single source of truth ──────────────────────────────
//
// One config that maps each canonical deal stage to a per-role view model:
//   stage → { headline, action? { label, route } } for builder / cp / customer.
//
// This is the frontend twin of the backend `normalizeDealStatus` / `DEAL_STATUS_NORM`
// in Dealio_Backend/src/controllers/builderController.ts. Keep the two in sync.
//
// Previously this logic was duplicated (with divergent casing) across
// BuilderDealsPage.tsx, CustomerJourney.tsx and the backend. Add or change a stage
// HERE and every role page that renders <DealRoom> picks it up.

export type DealRole = 'builder' | 'cp' | 'customer';

// Canonical, ordered deal pipeline (post-lead). Mirrors BuilderDealsPage's STAGES.
export const DEAL_PIPELINE = [
  'Meeting Done',
  'Negotiation',
  'Agreement',
  'Pending Booking',
  'Booked',
  'Closed',
] as const;

export type DealStage = (typeof DEAL_PIPELINE)[number];

// Fold any backend / legacy / lower-case status into a canonical stage.
// Anything earlier than the deal pipeline (enquiry, lead, meeting requested…) maps
// to the first stage so a freshly-created deal still renders sensibly.
const STAGE_ALIASES: Record<string, DealStage> = {
  'enquiry': 'Meeting Done',
  'new lead': 'Meeting Done',
  'profile created': 'Meeting Done',
  'meeting requested': 'Meeting Done',
  'meeting confirmed': 'Meeting Done',
  'meeting completed': 'Meeting Done',
  'meeting done': 'Meeting Done',
  'negotiation': 'Negotiation',
  'interested - loan required': 'Negotiation',
  'interested loan required': 'Negotiation',
  'agreement': 'Agreement',
  'pending booking': 'Pending Booking',
  'booked': 'Booked',
  'loan applied': 'Booked',
  'loan processing': 'Booked',
  'loan sanctioned': 'Booked',
  'loan disbursed': 'Booked',
  'registration done': 'Closed',
  'possession given': 'Closed',
  'possession': 'Closed',
  'closed': 'Closed',
};

export function normalizeStage(raw: string | null | undefined): DealStage {
  if (!raw) return 'Meeting Done';
  return STAGE_ALIASES[raw.toLowerCase().trim()] ?? 'Meeting Done';
}

export function stageIndex(stage: string): number {
  return DEAL_PIPELINE.indexOf(normalizeStage(stage));
}

/** True if `current` has reached (or passed) `target` in the pipeline. */
export function stageReached(current: string, target: DealStage): boolean {
  return stageIndex(current) >= DEAL_PIPELINE.indexOf(target);
}

// ─── Presentation ─────────────────────────────────────────────────────────────

export interface StageMeta {
  label: string;
  color: string; // hex — dots, progress bar
  badge: string; // tailwind classes — pill
}

export const STAGE_META: Record<DealStage, StageMeta> = {
  'Meeting Done':    { label: 'Meeting Done',    color: '#6366F1', badge: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  'Negotiation':     { label: 'Negotiation',     color: '#D97706', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  'Agreement':       { label: 'Agreement',       color: '#2563EB', badge: 'bg-blue-50 text-blue-700 border-blue-200' },
  'Pending Booking': { label: 'Pending Booking', color: '#0891B2', badge: 'bg-cyan-50 text-cyan-700 border-cyan-200' },
  'Booked':          { label: 'Booked',          color: '#059669', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  'Closed':          { label: 'Closed',          color: '#7C3AED', badge: 'bg-violet-50 text-violet-700 border-violet-200' },
};

// ─── Per-role action map ────────────────────────────────────────────────────────
// `route` is either a static path or a function of the deal id (for deep links that
// target a specific deal). `action` is null when a role has nothing to do at a stage.

export interface RoleAction {
  /** Short explanation of what's happening for this role at this stage. */
  headline: string;
  /** The next action this role can take, and the page it routes to. */
  action: { label: string; route: string | ((dealId: number) => string) } | null;
}

type StageActionMap = Record<DealStage, Record<DealRole, RoleAction>>;

export const STAGE_ACTIONS: StageActionMap = {
  'Meeting Done': {
    customer: { headline: 'Your site visit is done — shortlist the unit you liked and request a price.',
                action: { label: 'Shortlist a unit', route: '/customer/journey' } },
    cp:       { headline: 'Visit complete. Follow up with the customer to move the deal forward.',
                action: { label: 'Log a follow-up', route: '/cp/follow-ups' } },
    builder:  { headline: 'Customer has visited. Review their shortlist when it arrives.',
                action: { label: 'Review shortlists', route: '/builder/leads' } },
  },
  'Negotiation': {
    customer: { headline: 'Pricing & terms are being worked out. Review the quote and message your builder or CP.',
                action: { label: 'Review quote & message', route: '/customer/journey' } },
    cp:       { headline: 'Negotiate on the customer’s behalf and agree to the deal terms.',
                action: { label: 'Open deal & agree', route: (id) => `/cp/leads?deal=${id}` } },
    builder:  { headline: 'Share a pricing quote and negotiate terms with the customer.',
                action: { label: 'Share pricing quote', route: (id) => `/builder/deals?deal=${id}` } },
  },
  'Agreement': {
    customer: { headline: 'The agreement is ready. Confirm acceptance and upload your signed copy.',
                action: { label: 'Confirm & upload signed copy', route: '/customer/journey' } },
    cp:       { headline: 'Agreement shared — awaiting the customer’s signature.',
                action: null },
    builder:  { headline: 'Once the customer uploads the signed agreement, countersign to proceed.',
                action: { label: 'Countersign agreement', route: (id) => `/builder/deals?deal=${id}` } },
  },
  'Pending Booking': {
    customer: { headline: 'Your signed agreement was accepted — the booking is being confirmed.',
                action: { label: 'Track booking', route: '/customer/journey' } },
    cp:       { headline: 'Agreement accepted — booking in progress with the builder.',
                action: null },
    builder:  { headline: 'Confirm the booking to lock the unit for this customer.',
                action: { label: 'Confirm booking', route: (id) => `/builder/deals?deal=${id}` } },
  },
  'Booked': {
    customer: { headline: 'Unit booked! Apply for a home loan if you need financing.',
                action: { label: 'Apply for a home loan', route: '/customer/loan' } },
    cp:       { headline: 'Unit booked — your commission is being processed.',
                action: { label: 'View commission', route: '/cp/commissions' } },
    builder:  { headline: 'Unit booked. Set up the payment schedule for the customer.',
                action: { label: 'Set payment schedule', route: (id) => `/builder/deals?deal=${id}` } },
  },
  'Closed': {
    customer: { headline: 'Deal complete — welcome home! Hire a trusted interior vendor to set up.',
                action: { label: 'Hire an interior vendor', route: '/customer/meeting' } },
    cp:       { headline: 'Deal closed. Track your commission payout.',
                action: { label: 'Commission status', route: '/cp/commissions' } },
    builder:  { headline: 'Deal closed. Release the channel-partner commission.',
                action: { label: 'Release commission', route: '/builder/commissions' } },
  },
};

/** Resolve the action route for a stage + role, deep-linking with the deal id. */
export function actionFor(stage: string, role: DealRole, dealId: number): { label: string; href: string } | null {
  const a = STAGE_ACTIONS[normalizeStage(stage)][role].action;
  if (!a) return null;
  return { label: a.label, href: typeof a.route === 'function' ? a.route(dealId) : a.route };
}

/** Headline for a stage + role. */
export function headlineFor(stage: string, role: DealRole): string {
  return STAGE_ACTIONS[normalizeStage(stage)][role].headline;
}
