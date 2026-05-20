
-- 1) Profiles: add email_verified
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS email_verified boolean NOT NULL DEFAULT false;

-- 2) login_otps: add purpose column (login | signup)
ALTER TABLE public.login_otps ADD COLUMN IF NOT EXISTS purpose text NOT NULL DEFAULT 'login';

-- Helper: get role of current user (any role)
CREATE OR REPLACE FUNCTION public.current_user_role()
RETURNS public.app_role
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid() LIMIT 1
$$;

-- =========================================================
-- PROJECTS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  builder_id uuid NOT NULL,
  name text NOT NULL,
  city text,
  location text,
  status text NOT NULL DEFAULT 'active',
  rera_id text,
  unit_types text[],
  price_min numeric,
  price_max numeric,
  cover_url text,
  description text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
CREATE POLICY "projects: read active by anyone authed" ON public.projects FOR SELECT TO authenticated USING (status = 'active' OR builder_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "projects: builder insert own" ON public.projects FOR INSERT TO authenticated WITH CHECK (builder_id = auth.uid() AND public.has_role(auth.uid(),'builder'));
CREATE POLICY "projects: builder update own" ON public.projects FOR UPDATE TO authenticated USING (builder_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "projects: builder delete own" ON public.projects FOR DELETE TO authenticated USING (builder_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- =========================================================
-- UNITS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.units (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id uuid NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  block text,
  floor int,
  unit_no text NOT NULL,
  type text,
  carpet_sqft numeric,
  price numeric,
  status text NOT NULL DEFAULT 'available',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.units ENABLE ROW LEVEL SECURITY;
CREATE POLICY "units: read all authed" ON public.units FOR SELECT TO authenticated USING (true);
CREATE POLICY "units: builder manages own" ON public.units FOR ALL TO authenticated USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (p.builder_id = auth.uid() OR public.has_role(auth.uid(),'admin')))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND (p.builder_id = auth.uid() OR public.has_role(auth.uid(),'admin')))
);

-- =========================================================
-- LEADS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  name text NOT NULL,
  phone text,
  email text,
  city text,
  source text,
  stage text NOT NULL DEFAULT 'new',
  score int DEFAULT 0,
  budget_min numeric,
  budget_max numeric,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;
CREATE POLICY "leads: owner all" ON public.leads FOR ALL TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- =========================================================
-- DEALS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.deals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  customer_id uuid,
  cp_id uuid,
  builder_id uuid,
  bank_id uuid,
  status text NOT NULL DEFAULT 'enquired',
  booking_amount numeric,
  total_amount numeric,
  stage text DEFAULT 'enquiry',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.deals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "deals: parties read" ON public.deals FOR SELECT TO authenticated USING (
  customer_id = auth.uid() OR cp_id = auth.uid() OR builder_id = auth.uid() OR bank_id = auth.uid() OR public.has_role(auth.uid(),'admin')
);
CREATE POLICY "deals: cp/builder insert" ON public.deals FOR INSERT TO authenticated WITH CHECK (
  cp_id = auth.uid() OR builder_id = auth.uid() OR public.has_role(auth.uid(),'admin')
);
CREATE POLICY "deals: parties update" ON public.deals FOR UPDATE TO authenticated USING (
  cp_id = auth.uid() OR builder_id = auth.uid() OR bank_id = auth.uid() OR public.has_role(auth.uid(),'admin')
);

-- =========================================================
-- COMMISSIONS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid REFERENCES public.deals(id) ON DELETE CASCADE,
  cp_id uuid NOT NULL,
  amount numeric NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  released_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.commissions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "commissions: cp read own" ON public.commissions FOR SELECT TO authenticated USING (cp_id = auth.uid() OR public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'builder'));
CREATE POLICY "commissions: builder/admin manage" ON public.commissions FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'builder')) WITH CHECK (public.has_role(auth.uid(),'admin') OR public.has_role(auth.uid(),'builder'));

-- =========================================================
-- LOAN CASES
-- =========================================================
CREATE TABLE IF NOT EXISTS public.loan_cases (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  deal_id uuid REFERENCES public.deals(id) ON DELETE CASCADE,
  customer_id uuid NOT NULL,
  bank_id uuid,
  amount numeric,
  tenure_months int,
  interest_rate numeric,
  status text NOT NULL DEFAULT 'submitted',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.loan_cases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "loans: parties read" ON public.loan_cases FOR SELECT TO authenticated USING (customer_id = auth.uid() OR bank_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "loans: customer insert" ON public.loan_cases FOR INSERT TO authenticated WITH CHECK (customer_id = auth.uid());
CREATE POLICY "loans: bank/admin update" ON public.loan_cases FOR UPDATE TO authenticated USING (bank_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- =========================================================
-- DOCUMENTS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  related_type text,
  related_id uuid,
  name text NOT NULL,
  url text,
  mime_type text,
  size_bytes bigint,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
CREATE POLICY "documents: owner all" ON public.documents FOR ALL TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- =========================================================
-- NOTIFICATIONS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  body text,
  link text,
  read boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY "notifications: own read" ON public.notifications FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notifications: own update" ON public.notifications FOR UPDATE TO authenticated USING (user_id = auth.uid());
CREATE POLICY "notifications: admin insert" ON public.notifications FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(),'admin') OR user_id = auth.uid());

-- =========================================================
-- MEETINGS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organizer_id uuid NOT NULL,
  invitee_id uuid,
  project_id uuid REFERENCES public.projects(id) ON DELETE SET NULL,
  scheduled_at timestamptz NOT NULL,
  location text,
  mode text DEFAULT 'in_person',
  status text NOT NULL DEFAULT 'scheduled',
  notes text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "meetings: parties read" ON public.meetings FOR SELECT TO authenticated USING (organizer_id = auth.uid() OR invitee_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "meetings: organizer manage" ON public.meetings FOR ALL TO authenticated USING (organizer_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (organizer_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- =========================================================
-- PROPERTIES (customer-owned)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.properties (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  unit_id uuid REFERENCES public.units(id) ON DELETE SET NULL,
  project_name text,
  address text,
  current_value numeric,
  purchase_price numeric,
  purchased_at date,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.properties ENABLE ROW LEVEL SECURITY;
CREATE POLICY "properties: owner all" ON public.properties FOR ALL TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- =========================================================
-- INVESTMENTS (NRI opportunities)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.investments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  city text,
  expected_yield numeric,
  ticket_size numeric,
  cover_url text,
  status text NOT NULL DEFAULT 'open',
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.investments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "investments: read open" ON public.investments FOR SELECT TO authenticated USING (status = 'open' OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "investments: admin manage" ON public.investments FOR ALL TO authenticated USING (public.has_role(auth.uid(),'admin')) WITH CHECK (public.has_role(auth.uid(),'admin'));

-- =========================================================
-- VENDOR LISTINGS (interior)
-- =========================================================
CREATE TABLE IF NOT EXISTS public.vendor_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  vendor_id uuid NOT NULL,
  title text NOT NULL,
  category text,
  city text,
  price_from numeric,
  cover_url text,
  description text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.vendor_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "vendors: read active" ON public.vendor_listings FOR SELECT TO authenticated USING (active OR vendor_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "vendors: vendor manage own" ON public.vendor_listings FOR ALL TO authenticated USING (vendor_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (vendor_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- =========================================================
-- LAND LISTINGS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.land_listings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  title text NOT NULL,
  city text,
  area_acres numeric,
  expected_price numeric,
  zoning text,
  description text,
  status text NOT NULL DEFAULT 'available',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.land_listings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "land: read available" ON public.land_listings FOR SELECT TO authenticated USING (status = 'available' OR owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "land: owner manage" ON public.land_listings FOR ALL TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- =========================================================
-- FOLLOW UPS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.follow_ups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL,
  lead_id uuid REFERENCES public.leads(id) ON DELETE CASCADE,
  due_at timestamptz NOT NULL,
  type text DEFAULT 'call',
  notes text,
  done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.follow_ups ENABLE ROW LEVEL SECURITY;
CREATE POLICY "followups: owner all" ON public.follow_ups FOR ALL TO authenticated USING (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (owner_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- =========================================================
-- COMMUNITIES
-- =========================================================
CREATE TABLE IF NOT EXISTS public.communities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cp_id uuid NOT NULL,
  name text NOT NULL,
  city text,
  member_count int DEFAULT 0,
  description text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.communities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "communities: cp own" ON public.communities FOR ALL TO authenticated USING (cp_id = auth.uid() OR public.has_role(auth.uid(),'admin')) WITH CHECK (cp_id = auth.uid() OR public.has_role(auth.uid(),'admin'));

-- =========================================================
-- REFERRALS
-- =========================================================
CREATE TABLE IF NOT EXISTS public.referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_id uuid NOT NULL,
  level int NOT NULL DEFAULT 1,
  bonus_amount numeric DEFAULT 0,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(referrer_id, referred_id)
);
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
CREATE POLICY "referrals: parties read" ON public.referrals FOR SELECT TO authenticated USING (referrer_id = auth.uid() OR referred_id = auth.uid() OR public.has_role(auth.uid(),'admin'));
CREATE POLICY "referrals: referrer insert" ON public.referrals FOR INSERT TO authenticated WITH CHECK (referrer_id = auth.uid());
CREATE POLICY "referrals: admin manage" ON public.referrals FOR UPDATE TO authenticated USING (public.has_role(auth.uid(),'admin'));

-- updated_at triggers
CREATE TRIGGER trg_projects_updated BEFORE UPDATE ON public.projects FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_units_updated BEFORE UPDATE ON public.units FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_leads_updated BEFORE UPDATE ON public.leads FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_deals_updated BEFORE UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE TRIGGER trg_loan_cases_updated BEFORE UPDATE ON public.loan_cases FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Trigger to create profile/role on auth signup (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
