# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Dealio is a multi-role real estate marketplace platform. It consists of five Java Spring Boot microservices and a React/TypeScript frontend.

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

### Backend (run from the service directory, e.g. `Dealio_Backend/Dealio_Auth/`)

```bash
mvn clean package             # Build and package
mvn spring-boot:run           # Run the service
mvn test                      # Run all tests for the service
mvn test -Dtest=ClassName     # Run a single test class (Auth service only has tests)
```

Start services in dependency order: Eureka → Auth → Builder → Customer → Gateway.

### Database

PostgreSQL (`dealio` DB) — dev credentials: `postgres/password`, Docker: `postgres/secret`.  
Flyway migrations run automatically on startup from each service's `db/ddl/` (schema) and `db/dml/` (seed) directories. Dealio_Customer has no migrations (read-only service).

## Architecture

### Microservices

| Service | Port | Responsibility |
|---|---|---|
| `Dealio_Eureka` | 8761 | Service registry (Netflix Eureka) |
| `Dealio_Gateway` | — | API Gateway: routing and custom filters to all services |
| `Dealio_Auth` | 8081 | Auth (phone OTP via Twilio, Google OAuth), JWT generation/refresh |
| `Dealio_Builder` | 8087 | Core platform: projects, units, leads, deals, documents, commissions, RERA |
| `Dealio_Customer` | 8082 | Customer-facing read API: city/project discovery |

Each business service follows: `controller → service → repository → entity`, with `dto/`, `config/`, `exception/`, and `security/` packages alongside.

Auth is the only service with backend tests (`AuthControllerTest`, `AuthServiceTest`, `OtpServiceTest`); tests use an H2 in-memory DB via `application-test.yml`.

The SMS provider is `CONSOLE` in dev (OTPs print to logs) and `TWILIO` in prod.

### Frontend

Entry point: `src/main.tsx` → `src/App.tsx` (React Router). 100+ pages organized by the 8 user roles.

**User roles:** `builder`, `cp` (channel partner), `customer`, `bank`, `vendor`, `admin`, `nri`, `landowner`

**API client** is in `src/lib/api.ts`. It wraps `fetch`, attaches `Authorization: Bearer <token>`, and unwraps the Spring Boot `{ ok, message, data }` response envelope. Three API instances:
- `authApi` → Auth service (`VITE_AUTH_URL`, default `http://localhost:8081/api`)
- `builderApi` → Builder service (`VITE_BUILDER_URL`, default `http://localhost:8080/api`)
- `customerApi` → Customer service (`VITE_CUSTOMER_URL`, default `http://localhost:8082/api`)

Tokens are stored in `localStorage` as `dealio_access_token` / `dealio_refresh_token`. Override base URLs via `.env` (`VITE_AUTH_URL`, `VITE_BUILDER_URL`, `VITE_CUSTOMER_URL`).

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

- `Dealio_Backend/Dealio_*/src/main/resources/application.yml` — per-service Spring config (DB, JWT secret, Twilio, Google OAuth, Flyway, Eureka)
- `Dealio_frontend/.env` — API base URLs and Supabase/Google client credentials
- `Dealio_frontend/src/lib/api.ts` — API base URLs, fetch wrapper, response envelope unwrapping
- `Dealio_Backend/Dealio_Auth/docs/AUTH_API.md` — Auth API endpoint reference
