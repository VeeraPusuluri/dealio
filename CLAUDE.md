# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dealio is a multi-role real estate marketplace platform. It consists of a single Node.js/Express + TypeScript backend (Prisma ORM over PostgreSQL) and a React/TypeScript frontend.

## Commands

### Frontend (`Dealio_frontend/`)

```bash
npm run dev           # Start Vite dev server (port 8083)
npm run build         # Production build
npm run build:dev     # Dev build
npm run lint          # ESLint
npm run test          # Run Vitest once
npm run test:watch    # Vitest in watch mode
npm run test -- <pattern>  # Run a single test file/pattern
npx playwright test   # E2E tests (Playwright)
npm run preview       # Preview production build
```

### Backend (`Dealio_Backend/`)

```bash
npm run dev          # Dev server with hot reload (ts-node-dev), port 8090
npm run build        # Compile TypeScript to dist/
npm start            # Run the compiled server (node dist/index.js)
npm test             # Jest + Supertest (src/tests/api.test.ts)
npm run migrate      # Init DB + apply Prisma schema (scripts/init-db.js then prisma db push)
npx prisma generate  # Regenerate the Prisma client after schema changes
npx prisma studio    # Browse the database
```

Single Express app: `src/app.ts` (routes/middleware) → `src/index.ts` (HTTP server + socket.io attach).

### Database

PostgreSQL via **Prisma ORM**. The schema is the single source of truth at `Dealio_Backend/prisma/schema.prisma`; the connection string is `DATABASE_URL` in `Dealio_Backend/.env`. Apply schema changes with `npm run migrate` (dev) or `prisma migrate deploy` (prod), and run `npx prisma generate` afterwards so the typed client matches.

## Architecture

### Backend (single Express service, port 8090)

One Node.js/Express + TypeScript app. Routers are mounted under `/api/*` in `src/app.ts`:

| Mount | Router | Responsibility |
|---|---|---|
| `/api/auth` | authRoutes | Phone OTP + Google OAuth login, JWT issue/refresh |
| `/api/builder` | builderRoutes | Core platform: projects, units, leads, deals, documents, commissions, meetings |
| `/api/portal` | builderRoutes | Customer-portal views of builder data (same controllers, customer-facing) |
| `/api/customer` | customerRoutes | City/project discovery, customer notifications |
| `/api/cp` | cpRoutes | Channel-partner contacts, leads, follow-ups, deals, commissions |
| `/api/ai` | aiRoutes | Anthropic-backed AI chat (SSE stream), `ANTHROPIC_API_KEY` |
| `/api/admin` | adminRoutes | Admin: users, projects, CP verification, revenue, loan cases |

Layering: `routes → controller → prisma`. Controllers in `src/controllers/`, shared logic in `src/services/`. Uploaded files are served from `/uploads`. Responses use the `{ ok, message, data }` envelope.

**Real-time:** two transports in `src/services/` — `socketServer.ts` (socket.io, per-deal chat rooms `deal:${id}`) and `channelManager.ts` (SSE: personal `user:${id}` and per-city channels for live notifications). Deal events fan out through `services/dealNotify.ts` (`notifyDealParties`): a persisted `Notification` row **+** SSE push **+** optional WhatsApp, in one place.

**Integrations:** Google OAuth (`GOOGLE_CLIENT_ID`), JWT (`JWT_SECRET`), email via SMTP (`SMTP_*`, `services/emailService.ts`), WhatsApp via Meta Cloud API (`WHATSAPP_*`, `services/whatsapp.ts` — opt-in + env-gated, off by default), Anthropic (`ANTHROPIC_API_KEY`), SMS OTP via Twilio or MSG91 (`TWILIO_ACCOUNT_SID`/`TWILIO_AUTH_TOKEN`/`TWILIO_FROM` or `MSG91_AUTH_KEY`/`MSG91_TEMPLATE_ID`, optional `SMS_PROVIDER`, `services/smsService.ts`). Login/signup OTP delivery prefers WhatsApp when `WHATSAPP_*` is set (`WHATSAPP_OTP_TEMPLATE` — an auth-category template), falls back to SMS, then to a console-logged mock when neither is configured; the code is echoed to the client only outside production.

See `docs/DEAL_STAGE_AND_NOTIFICATIONS.md` for the deal-stage machine and notification architecture.

### Frontend

Entry point: `src/main.tsx` → `src/App.tsx` (React Router). 100+ pages organized by the 8 user roles.

**User roles:** `builder`, `cp` (channel partner), `customer`, `bank`, `vendor`, `admin`, `nri`, `landowner`

**API client** is in `src/lib/api.ts`. It wraps `fetch`, attaches `Authorization: Bearer <token>`, and unwraps the `{ ok, message, data }` response envelope. All instances target the single backend (default `http://127.0.0.1:8090/api`); `VITE_AUTH_URL` / `VITE_BUILDER_URL` / `VITE_CUSTOMER_URL` all default to it. Instances are grouped by route prefix: `authApi` (`/auth`), `builderApi` (`/builder`), `portalApi` (`/portal`, customer-facing), `customerApi` (`/customer`), `cpApi` (`/cp`), `adminApi` (`/admin`), `aiApi` (`/ai`).

Tokens are stored in `localStorage` as `dealio_access_token` / `dealio_refresh_token`. Real-time hooks: `useDealSocket` (socket.io deal chat) and `useNotificationStream` (SSE notification bell).

**State management** — Zustand stores in `src/stores/`:
- `useAuthStore` — auth state and current user/role
- `useDealStore`, `useLeadStore`, `useLoanStore`, `useLoanThreadStore`, `useCommissionStore` — domain state
- `useCustomerMilestoneStore`, `useFollowUpStore`, `useInteriorStore`, `useNRIStore` — role-specific state
- `useNotificationStore` — toast/notification management

**UI layer:** shadcn/ui components in `src/components/ui/`, TailwindCSS, `DashboardLayout.tsx` as the authenticated shell, shared reusable components in `src/components/shared/`.

**Forms** use React Hook Form + Zod validation. **Server state** uses TanStack React Query.

**Mock data** in `src/data/` (18 files: leads, deals, projects, loans, commissions, etc.) is used by pages that don't yet have a live backend endpoint.

The frontend also integrates Supabase (`src/integrations/supabase/`) — client and auto-generated types are there.

### Authentication Flow

1. User authenticates via phone OTP (`/api/auth/login/phone/send-otp` → `verify-otp`) or Google OAuth (`/api/auth/google`)
2. Auth Service returns JWT access + refresh tokens
3. Frontend stores tokens in `localStorage`; `useAuthStore` holds the decoded user/role
4. Token refresh via `/api/auth/refresh`
5. All authenticated routes are wrapped in `<ProtectedRoute>` which reads `useAuthStore.isAuthenticated`

### Key Configuration Files

- `Dealio_Backend/prisma/schema.prisma` — database schema (source of truth; run `prisma generate` after edits)
- `Dealio_Backend/.env` — `DATABASE_URL`, `JWT_SECRET`, `GOOGLE_CLIENT_ID`, `SMTP_*`, `WHATSAPP_*`, `ANTHROPIC_API_KEY`, `TWILIO_*`/`MSG91_*` (SMS OTP)
- `Dealio_Backend/src/app.ts` — Express app and route mounts
- `Dealio_frontend/.env` — `VITE_*` API base URLs and Supabase/Google client credentials
- `Dealio_frontend/src/lib/api.ts` — API instances, fetch wrapper, response envelope unwrapping
- `docs/DEAL_STAGE_AND_NOTIFICATIONS.md` — deal-stage machine + real-time notification design
