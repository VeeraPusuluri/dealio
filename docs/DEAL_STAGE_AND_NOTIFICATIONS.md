# Deal Stage Page & Real-Time Notifications — Design

**Scope:** A single, maintainable per-deal "stage + action" experience shared by **builder**, **customer**, and **channel partner (CP)**, and a consolidated real-time notification system (in-app + WhatsApp) keyed off each deal's unique ID.

**Status of this doc:** Reflects the implementation landed alongside it. Items marked _(future)_ are recommended next steps, not yet built.

---

## 1. The deal ID is the spine

Every artifact already hangs off one row:

```
Deal (id) ──┬── builderId   → Builder.userId   (builder's app user)
            ├── customerId  → User.id          (customer's app user)
            ├── cpId?       → ChannelPartner.userId (CP's app user)
            ├── projectId   → Project
            ├── messages       DealMessage[]   (dealId-scoped chat)
            ├── dealDocuments  DealDocument[]   (dealId-scoped, sharedWithCp / sharedWithCustomer)
            ├── loanCase       LoanCase?
            ├── followUps      CPFollowUp[]
            └── callLogs       CPCallLog[]
```

Defined in `Dealio_Backend/prisma/schema.prisma`. Because everything is FK'd to `Deal.id`, "visible only inside this deal" is structurally guaranteed — the only thing that needs *enforcing* is **per-party document visibility**:

| Role | Sees |
|---|---|
| builder | all `dealDocuments` (owner) |
| cp | `dealDocuments.where(sharedWithCp)` |
| customer | `dealDocuments.where(sharedWithCustomer)` |

`BuilderDealsPage.tsx` already gates the customer's pricing quote on `sharedWithCustomer`; the rule is now centralized in the frontend `DealRoom` (`visibleDocs`) and should be mirrored in every backend deal-read.

---

## 2. One stage machine → three role views

### Problem it solves
Stage logic was duplicated with divergent casing across three files:

- `Dealio_frontend/src/pages/builder/BuilderDealsPage.tsx` → `['Meeting Done','Negotiation','Agreement','Pending Booking','Booked','Closed']`
- `Dealio_frontend/src/pages/customer/CustomerJourney.tsx` → `['meeting done','negotiation',…]` (lowercase)
- `Dealio_Backend/src/controllers/builderController.ts` → `normalizeDealStatus` + `DEAL_STATUS_NORM`

Three sources of truth that drift. Adding a stage meant editing all three.

### Solution
**`Dealio_frontend/src/lib/dealStages.ts`** is now the single frontend source of truth:

- `DEAL_PIPELINE` — the canonical ordered stages (mirrors the backend `DEAL_STATUS_NORM` deal track).
- `normalizeStage(raw)` — folds any backend/legacy casing into a canonical stage (frontend twin of `normalizeDealStatus`).
- `STAGE_META` — label, color, badge classes per stage.
- `STAGE_ACTIONS[stage][role]` — the **view model**: `{ headline, action?: { label, to } }`, where `to` is a route string or `(dealId) => route`. This is the "stage → action → action-page" mapping the product requires.
- `actionFor(stage, role, dealId)` — resolves the route.

### Per-role action map (current)

| Stage | Customer → page | CP → page | Builder → page |
|---|---|---|---|
| Meeting Done | Shortlist a unit → `/customer/journey` | Log call / follow-up → `/cp/follow-ups` | Review shortlist → `/builder/leads` |
| Negotiation | Review quote & message → `/customer/journey` | Agree / add note → `/cp/leads` | Share pricing quote → `/builder/deals` |
| Agreement | Confirm & upload signed copy → `/customer/journey` | _(awaiting customer)_ | Countersign agreement → `/builder/deals` |
| Pending Booking | Track booking → `/customer/journey` | _(awaiting builder)_ | Confirm booking → `/builder/deals` |
| Booked | Apply for home loan → `/customer/loan` | View commission → `/cp/commissions` | Set payment schedule → `/builder/deals` |
| Closed | Hire an interior vendor → `/customer/meeting` | Commission status → `/cp/commissions` | Release commission → `/builder/commissions` |

### The shared component
**`Dealio_frontend/src/components/shared/DealRoom.tsx`** renders one deal for any role:

```
<DealRoom deal={normalizedDeal} role={role} />
   ├── <StageStepper>      // same canonical bar for everyone (exported for reuse)
   ├── <ActionCard>        // STAGE_ACTIONS[stage][role] → headline + deep-link button
   ├── Documents           // visibility-filtered via visibleDocs(docs, role)
   ├── Live chat           // useDealSocket(dealId) → socket.io deal:${id} room
   └── Activity timeline
```

Each role page becomes a thin wrapper that fetches the deal (`builderApi.getDeal`, `cpApi.getCPDeal`, `portalApi.getMyDeals`), maps it to the `DealRoomDeal` shape, and renders `<DealRoom>`. Adding a stage or changing an action is now a **one-line edit in `dealStages.ts`**.

> Migration note: `DealRoom` ships as an additive, self-contained component. `CustomerJourney`'s `ActiveDealCard` is the reference implementation; porting Builder/CP pages onto `DealRoom` is incremental and non-breaking.

---

## 3. Real-time notifications — three transports, one fan-out

The architecture was already correct; it was just **duplicated ~15×** and had **one silent hole**.

```
                         ┌─ prisma.notification.create(userId)  → bell dropdown, unread, history, deep link
 deal event ── notifyDealParties() ─┼─ channelManager.publish(`user:${id}`) → live SSE toast (useNotificationStream)
   (ONE helper)          ├─ socket.io deal:${id}                → live chat (useDealSocket; unchanged)
                         └─ sendWhatsApp(phone)  (NEW)          → off-app reach, opt-in + env-gated
```

### `notifyDealParties()` — the single fan-out point
**`Dealio_Backend/src/services/dealNotify.ts`**

```ts
notifyDealParties(dealId, {
  type, title, message,
  to: ['customer','cp','builder'],       // who is notified
  link: { customer: '/customer/journey', cp: '/cp/leads', builder: '/builder/deals' },
  notifType: 'info' | 'success' | …,
  whatsappTemplate?, whatsappVars?,      // optional WhatsApp
})
```

It resolves each party's `userId` + `phone` + `whatsappOptIn` from the deal, then does **DB notification + SSE publish + (opt-in) WhatsApp** for each target in one place. New events call one function instead of copy-pasting three blocks.

### The silent-stage-change fix
`PATCH /builder/:builderId/deals/:dealId/status` (`builderController.updateDealStatus`) previously wrote `status` and returned — **nobody was told**. It now calls `notifyDealParties(...)` so a manual stage move notifies the customer and CP (in-app + WhatsApp), closing the core "notify on every stage" requirement.

The per-transition notifiers are **now routed through `notifyDealParties`** too — document share/upload (`uploadDealDocument`, `addDealDocument`, `uploadSignedAgreement`), deal chat (`sendDealMessage`, `sendCPDealMessage`, `sendCustomerDealMessage`), CP assignment, customer confirm, negotiation/agreement acceptance, and CP agree. This means **documents and messages now also reach parties over WhatsApp**, not just stage changes. The remaining inline notifiers are the pre-deal ones (`requestPricing`, unit shortlist, meetings) — they have no `Deal` row yet, so they stay on the direct `notification.create` + `channelManager.publish` path.

### Hydration, dedupe & read-sync (the duplicate / "unread again" fix)
`DashboardLayout` hydrates the bell once on login via `ingestServerNotifications`. Three things then keep it consistent:

- **Stable identity.** Persisted notifications carry their DB id end-to-end — `notifyDealParties` includes the created row's id in the SSE payload (`ChannelEvent.notificationId`), so the live event and the later hydrate reconcile to one entry instead of two.
- **Dedupe.** `addNotification` dedupes server-id'd events by id and id-less events (city broadcasts, the cross-notify drain) by content; `ingestServerNotifications` drops any hydrated row whose transient live copy is already in the bell. This kills duplicates from overlapping transports and SSE reconnects.
- **Server read-sync.** `PATCH /{builder|cp|customer}/notifications/:id/read` and `…/read-all` persist read-state; the store calls them from `markRead` / `markAllRead` / `dismiss` / `clearAll`. The GET endpoints **no longer mark-read-on-fetch**, so a clicked notification stays read and can't resurface as unread on the next hydrate.

---

## 4. WhatsApp integration

**`Dealio_Backend/src/services/whatsapp.ts`** — env-gated Meta WhatsApp Cloud API sender.

- **Disabled by default.** With no `WHATSAPP_TOKEN` / `WHATSAPP_PHONE_ID`, it logs the intended message and no-ops — safe in dev and CI.
- **Opt-in:** `User.whatsappOptIn` (added to schema, default `false`). Only opted-in users with a phone receive messages. Collect the opt-in at signup/settings.
- **Templates:** business-initiated messages outside the 24h window require pre-approved templates. `TEMPLATES` maps event → template name (e.g. `deal_stage_update`). Approve these in Meta Business Manager.
- **One hook point:** invoked inside `notifyDealParties`, so enabling it lights up WhatsApp for **all** deal events at once.

### Enabling in production
1. Create a Meta WhatsApp Business app → get a permanent `WHATSAPP_TOKEN` and `WHATSAPP_PHONE_ID`.
2. Get templates approved (`deal_stage_update`, `deal_document_shared`, `deal_new_message`).
3. Set env vars (`WHATSAPP_TOKEN`, `WHATSAPP_PHONE_ID`, optional `WHATSAPP_LANG`).
4. `npx prisma db push` to add the `whatsappOptIn` column.
5. Surface an opt-in toggle in customer/CP/builder settings.

### Inbound replies _(future)_
A Meta webhook → write inbound text as a `DealMessage` → it already broadcasts into the `deal:${id}` socket room, closing the loop both directions.

**Alternatives:** AiSensy / Gupshup (India-friendly billing, faster template approval) or Twilio WhatsApp — all are a single HTTPS POST; swap the body inside `sendWhatsApp()`.

---

## 5. Files

**New**
- `Dealio_frontend/src/lib/dealStages.ts` — stage machine (source of truth)
- `Dealio_frontend/src/components/shared/DealRoom.tsx` — shared per-role deal hub
- `Dealio_Backend/src/services/dealNotify.ts` — `notifyDealParties` fan-out
- `Dealio_Backend/src/services/whatsapp.ts` — WhatsApp Cloud API sender
- `docs/DEAL_STAGE_AND_NOTIFICATIONS.md` — this doc

**Changed**
- `Dealio_Backend/src/controllers/builderController.ts` — `updateDealStatus` now notifies all parties; document/message/assign/confirm/negotiation/agreement handlers routed through `notifyDealParties` (adds WhatsApp + bell consistency)
- `Dealio_Backend/src/controllers/cpController.ts` — `agreeDeal` + `sendCPDealMessage` routed through `notifyDealParties`
- `Dealio_Backend/prisma/schema.prisma` — `User.whatsappOptIn`
- `Dealio_frontend/src/stores/useNotificationStore.ts` — `ingestServerNotifications` (DB hydration + dedupe)
- `Dealio_frontend/src/components/layout/DashboardLayout.tsx` — hydrate bell on login
- `Dealio_frontend/src/pages/builder/BuilderDealsPage.tsx` — "Deal Room" deep link from the deal drawer (`/builder/deals/:dealId`)
- `Dealio_frontend/src/pages/cp/CPLeads.tsx` — "Deal Room" deep link from the CP deal drawer (`/cp/deals/:dealId`)
- `Dealio_frontend/src/pages/customer/CustomerJourney.tsx` — "Deal Room" link (`/customer/deals/:dealId`)
- `Dealio_frontend/src/lib/api.ts` — comment corrected (backend envelope, not "Spring Boot")
- `CLAUDE.md` — corrected backend stack (Node/Express/Prisma, not Spring Boot)

## 6. Status of next steps
1. ✅ **DealRoom reachable for all three roles.** Customer (`CustomerJourney`), builder (`BuilderDealsPage` deal drawer), and CP (`CPLeads` deal drawer) each deep-link into the shared `/…/deals/:dealId` Deal Room. Fully replacing the bespoke builder/CP drawers with `<DealRoom>` remains optional polish.
2. ✅ **Deal fan-out sites migrated** onto `notifyDealParties` (see §3) — stage, document, and message events now all go through one helper and reach in-app + WhatsApp.
3. ✅ **Cross-device read state.** `PATCH /…/notifications/:id/read` + `…/read-all` land; the bell syncs read-state to the server and no longer marks-read-on-fetch (fixes duplicate / re-appearing-unread notifications).
4. _(future)_ WhatsApp inbound webhook → `DealMessage`.
5. _(future)_ Thread `notificationId` through the remaining inline notifiers (meetings, shortlist, pricing) so their read-state also persists server-side; today they rely on the client content-dedupe.
