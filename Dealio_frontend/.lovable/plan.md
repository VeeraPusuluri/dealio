## Scope

Add real authentication via Lovable Cloud while keeping the existing 8-role demo tile experience working. No other data is migrated — all Zustand stores (deals, leads, loans, etc.) remain untouched.

## What gets built

### 1. Cloud backend (schema)

- `app_role` enum: `builder | cp | customer | bank | vendor | admin | nri | landowner`
- `profiles` table — `id` (FK → `auth.users`, cascade), `name`, `email`, `phone`, `avatar_url`, `created_at`
- `user_roles` table — `id`, `user_id` (FK → `auth.users`), `role` (`app_role`), unique on `(user_id, role)`
- `has_role(_user_id uuid, _role app_role)` — SECURITY DEFINER function
- `handle_new_user()` trigger on `auth.users` insert → creates a `profiles` row from signup metadata
- RLS:
  - `profiles`: users select/update their own row; admins select all (via `has_role`)
  - `user_roles`: users select their own roles; only admins insert/update/delete

### 2. Seed 8 demo accounts

One pre-confirmed auth user per role with a fixed email/password, a `profiles` row, and a matching `user_roles` row:

| Role | Email | Password |
|---|---|---|
| builder | builder@dealio.in | Demo@1234 |
| cp | ravi@dealio.in | Demo@1234 |
| customer | rahul@email.com | Demo@1234 |
| bank | ramesh@hdfc.com | Demo@1234 |
| vendor | info@designcraft.in | Demo@1234 |
| admin | admin@dealio.in | Demo@1234 |
| nri | nri@dealio.in | Demo@1234 |
| landowner | rajendra@email.com | Demo@1234 |

Seeded via a one-time migration using `auth.admin` calls (or direct insert into `auth.users` with hashed password + email confirmed).

### 3. Auth integration

- Add `@supabase/supabase-js` client at `src/integrations/supabase/client.ts` (auto-wired by Cloud)
- Update `src/stores/useAuthStore.ts`:
  - Remove `localStorage` `dealio_role` flow
  - On app boot: set up `onAuthStateChange` listener, then `getSession()`
  - `login(role)` → `signInWithPassword` using the seeded demo credentials for that role, then fetch `profiles` + `user_roles` to populate `user`
  - `logout()` → `supabase.auth.signOut()`
  - Persist session via Supabase (default localStorage), no manual role caching
- Existing role tile grid in `src/pages/Login.tsx` stays — clicking a tile calls `login(role)` which now performs a real sign-in against the seeded account
- Add a small "Sign in with email" link on the login page that opens an email/password form (and a Google sign-in button) for users who want real accounts. New signups default to the `customer` role (insert into `user_roles` via the `handle_new_user` trigger reading `raw_user_meta_data.role`, falling back to `customer`)
- Add `/reset-password` route + Forgot password flow (required when email auth is enabled)

### 4. Cleanup

- Remove `localStorage.getItem('dealio_role')` restore logic
- Keep `demoUsers` mapping only as a lookup of demo emails per role tile

## What is NOT changing

- All Zustand stores (`useLeadStore`, `useLoanStore`, `useDealStore`, `useCommissionStore`, `useNotificationStore`, etc.) stay in-memory
- No Storage buckets, no edge functions, no realtime
- No UI/route changes beyond login page additions and `/reset-password`
- All existing pages and features remain identical

## Technical notes

- Auth providers enabled: Email/password + Google (Lovable Cloud defaults)
- Leaked-password (HIBP) check enabled
- All RLS policies use `has_role(auth.uid(), 'admin')` — never query `user_roles` directly inside a policy on another table
- `handle_new_user` runs `SECURITY DEFINER` with `set search_path = public`

## Files touched

- New: `supabase/migrations/*.sql` (schema + seed), `src/integrations/supabase/client.ts` (auto), `src/pages/ResetPassword.tsx`, `src/components/auth/EmailLoginForm.tsx`
- Edited: `src/stores/useAuthStore.ts`, `src/pages/Login.tsx`, `src/App.tsx` (add `/reset-password` route)
