-- OTP table for post-login email verification
CREATE TABLE public.login_otps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  code_hash text NOT NULL,
  attempts int NOT NULL DEFAULT 0,
  consumed boolean NOT NULL DEFAULT false,
  expires_at timestamptz NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_login_otps_user ON public.login_otps(user_id, created_at DESC);

ALTER TABLE public.login_otps ENABLE ROW LEVEL SECURITY;

-- Only edge functions (service role) read/write; users have no direct access.
-- Add restrictive policies so the table is locked from anon/authenticated clients.
CREATE POLICY "login_otps: no client access"
ON public.login_otps
FOR ALL
TO authenticated, anon
USING (false)
WITH CHECK (false);