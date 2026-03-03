# 10 — Backend Architecture

> **Status**: Planning
> **Last Updated**: 2026-03-02
> **Decision**: Supabase-centric stack (Recommended) with distributed alternative documented

---

## Table of Contents

1. [Context & Requirements](#1-context--requirements)
2. [Architecture Decision: SQL vs NoSQL](#2-architecture-decision-sql-vs-nosql)
3. [Approach A: Distributed Services Stack](#3-approach-a-distributed-services-stack)
4. [Approach B: Supabase-Centric Stack (Recommended)](#4-approach-b-supabase-centric-stack-recommended)
5. [Comparison & Recommendation](#5-comparison--recommendation)
6. [Project Structure: Monorepo](#6-project-structure-monorepo)
7. [Database Schema Design](#7-database-schema-design)
8. [Auth Architecture](#8-auth-architecture)
9. [Real-Time Collaboration Architecture](#9-real-time-collaboration-architecture)
10. [App Hosting Architecture](#10-app-hosting-architecture)
11. [File Storage Architecture](#11-file-storage-architecture)
12. [API Design](#12-api-design)
13. [Multi-Tenancy Model](#13-multi-tenancy-model)
14. [Automation & DevOps](#14-automation--devops)
15. [Accounts Required](#15-accounts-required)
16. [Cost Projections](#16-cost-projections)
17. [Security Considerations](#17-security-considerations)
18. [Performance Architecture](#18-performance-architecture)
19. [Local Development Guide](#19-local-development-guide)

---

## 1. Context & Requirements

### Current State

The ProcodeAppDesigner is a **client-side only** low-code/no-code application builder. All data is stored in the browser's `localStorage`:

- `gemini-low-code-apps-index` — array of AppMetadata (id, name, timestamps)
- `gemini-low-code-app-{id}` — full AppDefinition per app (50KB-5MB each)
- `gemini-low-code-global-themes` — array of GlobalTheme
- `gemini-low-code-app-templates` — array of AppTemplate
- `gemini-low-code-widget-definitions` — array of WidgetDefinition

**Limitations of current approach:**
- ~5-10MB localStorage quota per domain
- Data loss if browser data is cleared
- No cross-device access
- No collaboration or sharing
- No user authentication
- No backup/recovery

### Target Requirements

| Requirement | Detail |
|---|---|
| **Multi-tenancy** | Full SaaS — multiple organizations, each with users, roles, permissions, billing |
| **Collaboration** | Real-time — multiple users editing the same app simultaneously (Figma-like) |
| **App Hosting** | Full platform — users build AND deploy production apps on the platform |
| **Scale** | 10K+ users within 12-18 months |
| **Auth** | Start with managed auth, migrate to custom OAuth later |
| **Deployment** | Deployment-agnostic architecture |
| **Cost** | Minimize initial cost, scale with revenue |
| **Team Size** | Solo developer — maximize automation, minimize ops |

### Data Model Characteristics

The `AppDefinition` is a **self-contained JSON document** that is always loaded and saved as a whole:

- **Components**: Flat array with `parentId` references (not deeply nested)
- **Write pattern**: Debounced full-document save (~1/second during editing)
- **Read pattern**: Metadata listing (frequent, small) + full document load (per session, large)
- **No cross-document transactions**: Each app/template/widget is independent
- **No server-side expression evaluation**: All computation is client-side

Approximate document sizes:
- Small app: 50-200 KB
- Medium app: 200 KB - 1 MB
- Large app: 1-5 MB

---

## 2. Architecture Decision: SQL vs NoSQL

### Analysis

| Factor | SQL (PostgreSQL) | MongoDB (Document) | DynamoDB (Key-Value) | Firestore (Document) |
|---|---|---|---|---|
| **Data model fit** | JSONB column = document storage | Natural document fit | Key-value with JSON | Document with subcollections |
| **Query flexibility** | Index INTO JSONB + full SQL | Aggregation pipeline | Limited (scan/query) | Limited compound queries |
| **Multi-tenancy** | Row-Level Security (built-in) | Application-level filtering | Application-level filtering | Security rules |
| **Consistency** | Strong ACID | Tunable (eventual default) | Eventual (strong optional) | Strong (single-doc) |
| **Max document size** | No practical limit (TOAST) | 16MB | **400KB** (too small!) | **1MB** (risky) |
| **Schema evolution** | JSONB = schemaless + relational | Schemaless | Schemaless | Schemaless |
| **Ecosystem (Next.js)** | Prisma/Drizzle first-class | Mongoose, less mature in Next.js | AWS SDK | Firebase SDK |
| **Managed options** | Supabase, Neon, Vercel Postgres | Atlas | AWS only | Firebase only |
| **Cost at scale** | Predictable | Can be costly | Pay-per-request | Pay-per-read/write |

### Decision: **PostgreSQL with JSONB**

**Rationale:**
1. **JSONB gives document flexibility** — store AppDefinition as-is, no schema flattening
2. **Relational where needed** — users, organizations, permissions, audit logs are naturally relational
3. **Row-Level Security** — multi-tenancy isolation at the database level, not application code
4. **No document size limits** — PostgreSQL TOAST handles large JSONB transparently
5. **Query into JSON** — find apps containing specific component types, search by theme, etc.
6. **Best Next.js ecosystem** — Prisma, Drizzle, Supabase, Neon all treat PostgreSQL as first-class
7. **DynamoDB eliminated** — 400KB limit is a dealbreaker (apps can reach 5MB)
8. **Firestore eliminated** — 1MB limit is risky, vendor lock-in to Google

---

## 3. Approach A: Distributed Services Stack

### Overview

Each concern is handled by a best-in-class specialized service.

```
┌─────────────────────────────────────────────────────────────────┐
│                   DISTRIBUTED SERVICES STACK                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Hosting:     Vercel            (auto-deploy, edge, CDN)        │
│  Database:    Neon PostgreSQL   (serverless, branching)         │
│  Auth:        NextAuth (Auth.js)(providers, sessions, JWT)      │
│  Cache:       Upstash Redis     (serverless, per-request)       │
│  Storage:     Cloudflare R2     (S3-compatible, zero egress)    │
│  Real-time:   Hocuspocus/y-ws   (Yjs CRDT WebSocket server)    │
│  Email:       Resend            (transactional emails)          │
│  Billing:     Stripe            (subscriptions, webhooks)       │
│  Errors:      Sentry            (error tracking, alerts)        │
│                                                                  │
│  Total services: 9                                               │
│  Total accounts: 7+                                              │
└─────────────────────────────────────────────────────────────────┘
```

### Architecture Diagram

```
Clients (Editor SPA, Viewer SSR)
         │
         ├── HTTPS ──→ Vercel (Next.js API Routes)
         │                  │
         │                  ├── NextAuth ──→ OAuth Providers
         │                  │                (Google, GitHub, etc.)
         │                  │
         │                  ├── Prisma ──→ Neon PostgreSQL
         │                  │               (users, orgs, app defs)
         │                  │
         │                  ├── ioredis ──→ Upstash Redis
         │                  │               (cache, sessions, rate limit)
         │                  │
         │                  └── S3 SDK ──→ Cloudflare R2
         │                                  (files, exports, assets)
         │
         └── WebSocket ──→ Hocuspocus Server (self-hosted)
                            │
                            ├── Yjs CRDT (conflict resolution)
                            ├── Presence (cursors, selections)
                            └── Persistence ──→ Neon PostgreSQL
```

### Pros

- **Best-in-class for each concern** — each service is optimized for its job
- **No vendor lock-in** — swap any service independently
- **Cloudflare R2** has 10GB free storage with zero egress (best free tier for files)
- **Neon** has database branching (great for dev/staging/prod)
- **More control** over each layer

### Cons

- **7+ accounts to manage** — each with its own dashboard, billing, monitoring
- **Configuration overhead** — CORS, environment variables, secrets for each service
- **More failure points** — if any one service has an outage, you're debugging across platforms
- **Self-hosted WebSocket** — Hocuspocus needs a server (not serverless)
- **Solo developer burden** — significant ops overhead for one person
- **NextAuth maintenance** — you maintain provider configs, session logic, token rotation

### Cost (Distributed)

| Phase | Services | Monthly Cost |
|---|---|---|
| Phase 1 (MVP) | Vercel Free + Neon Free + NextAuth | **$0** |
| Phase 2 (Growing) | + Upstash Free + R2 Free | **$0** |
| Phase 3 (Revenue) | Vercel Pro + Neon Pro + Upstash Pro | **$60-100** |
| Phase 4 (Scale) | + Hocuspocus server + all Pro tiers | **$200-500** |

---

## 4. Approach B: Supabase-Centric Stack (Recommended)

### Overview

Consolidate database, auth, storage, and real-time into a single managed platform.

```
┌─────────────────────────────────────────────────────────────────┐
│                  SUPABASE-CENTRIC STACK                          │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  Hosting:     Vercel            (auto-deploy, edge, CDN)        │
│  Backend:     Supabase          (ALL of the below):             │
│                ├── PostgreSQL    (database + JSONB)              │
│                ├── Auth          (OAuth, SSO, MFA, magic link)  │
│                ├── Storage       (S3-compatible, CDN)           │
│                ├── Realtime      (Postgres changes, presence)   │
│                ├── Edge Functions(serverless compute)            │
│                ├── RLS           (multi-tenancy at DB level)    │
│                └── Auto-backups  (daily + point-in-time)        │
│                                                                  │
│  Utility (add when needed):                                      │
│    Stripe     (billing)                                          │
│    Resend     (emails)                                           │
│    Sentry     (errors)                                           │
│                                                                  │
│  Total core services: 2                                          │
│  Total core accounts: 2                                          │
└─────────────────────────────────────────────────────────────────┘
```

### Architecture Diagram

```
┌──────────────────────────────────────────────────────────────┐
│                        CLIENTS                                │
│                                                               │
│  ┌─────────────────┐          ┌─────────────────┐            │
│  │  Editor          │          │  Viewer          │            │
│  │  (Vite + React)  │          │  (Next.js SSR)   │            │
│  │  Design canvas,  │          │  Serves deployed │            │
│  │  drag-drop,      │          │  end-user apps   │            │
│  │  properties      │          │                  │            │
│  └───────┬──────────┘          └────────┬─────────┘            │
│          │                              │                      │
└──────────┼──────────────────────────────┼──────────────────────┘
           │                              │
           │  REST API + WebSocket        │  REST API
           │                              │
┌──────────▼──────────────────────────────▼──────────────────────┐
│                    VERCEL (Next.js)                              │
│                                                                  │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────┐     │
│  │  API Routes   │  │  Middleware   │  │  Server Components│     │
│  │  /api/apps/*  │  │  (auth check, │  │  (Viewer SSR)     │     │
│  │  /api/orgs/*  │  │   rate limit, │  │                   │     │
│  │  /api/collab/*│  │   tenant ctx) │  │                   │     │
│  └──────┬───────┘  └──────────────┘  └───────────────────┘     │
│         │                                                        │
└─────────┼────────────────────────────────────────────────────────┘
          │
          │  Supabase JS Client
          │
┌─────────▼────────────────────────────────────────────────────────┐
│                        SUPABASE                                   │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  PostgreSQL   │  │  Auth         │  │  Realtime             │   │
│  │              │  │              │  │                       │   │
│  │  Tables:     │  │  • Email/Pass│  │  • Broadcast          │   │
│  │  • users     │  │  • OAuth     │  │    (presence, cursors)│   │
│  │  • orgs      │  │    (Google,  │  │  • Postgres Changes   │   │
│  │  • members   │  │     GitHub)  │  │    (live updates)     │   │
│  │  • apps      │  │  • Magic Link│  │  • Yjs doc sync       │   │
│  │    (JSONB)   │  │  • SSO/SAML │  │                       │   │
│  │  • versions  │  │  • MFA       │  │  200 concurrent conns │   │
│  │  • templates │  │  • JWT tokens│  │  (free tier)          │   │
│  │  • widgets   │  │              │  │                       │   │
│  │  • audit_log │  │  50K MAU free│  │                       │   │
│  │              │  │              │  │                       │   │
│  │  RLS Policies│  └──────────────┘  └──────────────────────┘   │
│  │  (multi-     │                                                │
│  │   tenancy)   │  ┌──────────────┐  ┌──────────────────────┐   │
│  │              │  │  Storage      │  │  Edge Functions       │   │
│  │  GIN indexes │  │              │  │                       │   │
│  │  on JSONB    │  │  • Images    │  │  • Webhooks           │   │
│  └──────────────┘  │  • Exports   │  │  • Cron jobs          │   │
│                    │  • Assets    │  │  • Background tasks   │   │
│                    │              │  │                       │   │
│                    │  1GB free    │  │  500K invocations/mo  │   │
│                    │  RLS-secured │  │  (free tier)          │   │
│                    └──────────────┘  └──────────────────────┘   │
│                                                                   │
│  Auto-backups (daily) + Point-in-time recovery (Pro)             │
└───────────────────────────────────────────────────────────────────┘
          │
          │  Webhooks (when needed)
          │
┌─────────▼────────────────────────────────────────────────────────┐
│                    UTILITY SERVICES (Phase 2+)                    │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │  Stripe       │  │  Resend       │  │  Sentry              │   │
│  │              │  │              │  │                       │   │
│  │  Billing,    │  │  Transactional│  │  Error tracking,     │   │
│  │  subscriptions│  │  emails       │  │  performance         │   │
│  │  customer    │  │  (welcome,   │  │  monitoring           │   │
│  │  portal      │  │   reset,     │  │                       │   │
│  │              │  │   invite)    │  │  Auto-alerts to       │   │
│  │  Webhooks →  │  │              │  │  Slack/email          │   │
│  │  auto-update │  │  3K/mo free  │  │                       │   │
│  │  user plans  │  │              │  │  Free tier available  │   │
│  └──────────────┘  └──────────────┘  └──────────────────────┘   │
└───────────────────────────────────────────────────────────────────┘
```

### Pros

- **2 accounts to manage** — Vercel + Supabase (vs 7+ in Approach A)
- **Single dashboard for backend** — database, auth, storage, realtime all in one place
- **Auth is handled** — Supabase Auth supports OAuth, SSO, MFA, magic links out of the box
- **RLS for multi-tenancy** — write SQL policies once, enforced at database level
- **Auto-backups** — daily backups + point-in-time recovery on Pro tier
- **Auto-scaling** — pauses on inactivity (saves money), scales with traffic
- **Less code** — auto-generated REST API from schema, client libraries
- **Solo developer friendly** — maximum automation, minimum ops

### Cons

- **Storage is 1GB free** (vs 10GB on R2) — sufficient for Phase 1, upgrade or add R2 later
- **Supabase Realtime** is simpler than Hocuspocus — for full Figma-like CRDT collaboration, you'll still need Yjs (but Supabase can transport the Yjs updates)
- **Some vendor coupling** — switching away from Supabase is more work than switching individual services (but PostgreSQL is standard, and auth is abstracted)
- **200 concurrent realtime connections** on free tier — sufficient for early phases

### Hybrid Architecture: Own API Layer + Supabase as Infrastructure

> **Key Decision**: The frontend **never** talks to Supabase directly. All client requests go through your own REST API layer, which calls Supabase server-side as infrastructure.

This hybrid approach gives you:
- **No vendor lock-in on the API surface** — frontend only knows your `/api/*` endpoints
- **Full control over business logic** — validation, rate limiting, audit logging happen in your code
- **Swap path** — each Supabase dependency (DB, Auth, Storage) is isolated to 1-5 files inside the API layer; replacing Supabase with another provider requires changing only those files
- **Security** — Supabase service-role key never reaches the client; RLS policies enforce data isolation at the DB level as a defense-in-depth layer

```
┌─────────────┐         ┌──────────────────────┐         ┌──────────────────┐
│   Frontend   │  REST   │   Your API Layer      │  SDK    │    Supabase       │
│   (Vite +    │ ──────→ │   (Vercel Serverless  │ ──────→ │    (DB, Auth,     │
│    React)    │  /api/* │    or Next.js Routes) │         │     Storage)      │
└─────────────┘         └──────────────────────┘         └──────────────────┘
                              │
                              │  Also calls:
                              ├── Stripe (billing)
                              ├── Resend (email)
                              └── Sentry (errors)
```

**What this means in practice:**
- `storageService.ts` in the editor calls `fetch('/api/v1/apps')`, not `supabase.from('apps').select()`
- Auth flow: frontend calls `POST /api/v1/auth/signin`, API calls `supabase.auth.signInWithPassword()`
- File uploads: frontend calls `POST /api/v1/storage/upload`, API calls `supabase.storage.from('assets').upload()`

### Cost (Supabase-Centric)

| Phase | Supabase | Vercel | Utilities | **Total** |
|---|---|---|---|---|
| Phase 1 (MVP) | Free | Free | — | **$0/mo** |
| Phase 2 (Growing) | Pro $25 | Free | — | **$25/mo** |
| Phase 3 (Revenue) | Pro $25 | Pro $20 | Stripe ($0) + Resend ($0) | **$45/mo** |
| Phase 4 (Scale) | Team $599 | Pro $20 | Stripe + Resend + Sentry | **$650/mo** |

---

## 5. Comparison & Recommendation

### Head-to-Head

| Factor | Approach A (Distributed) | Approach B (Supabase) |
|---|---|---|
| **Accounts to manage** | 7+ | 2 |
| **Dashboards to monitor** | 7+ | 2 |
| **Configuration complexity** | High (CORS, env vars, secrets per service) | Low (one client library) |
| **Auth setup** | Manual (NextAuth providers, session config) | Built-in (toggle providers in dashboard) |
| **Multi-tenancy** | Application-level code | Database-level RLS policies |
| **File storage free tier** | 10GB (R2) | 1GB (Supabase Storage) |
| **Real-time** | Hocuspocus (self-hosted server) | Supabase Realtime (managed) |
| **Vendor lock-in** | Minimal | Moderate (but PostgreSQL is portable) |
| **Solo dev feasibility** | Challenging | Manageable |
| **Time to first deploy** | 2-3 weeks | 3-5 days |
| **Monthly cost (Phase 1)** | $0 | $0 |
| **Monthly cost (Phase 3)** | $60-100 | $45 |

### Recommendation: **Approach B (Supabase-Centric)**

**For a solo developer building a full SaaS platform, the consolidation benefit of Supabase far outweighs the individual advantages of specialized services.**

The key insight: **your time is your scarcest resource**. Every hour spent configuring CORS between services, debugging auth token flow between NextAuth and Neon, or managing Cloudflare R2 bucket policies is an hour not spent building features that attract users.

### Migration Path

If you outgrow Supabase or need more control later:
1. **Database**: PostgreSQL is standard — export and import to any PostgreSQL host
2. **Auth**: Abstract behind `@procode/auth` package — swap implementation without changing API code
3. **Storage**: S3-compatible API — switch to R2/S3 by changing endpoint config
4. **Realtime**: Yjs documents are transport-agnostic — switch from Supabase channels to WebSocket server

---

## 6. Project Structure: Monorepo

> **Solo Developer Note**: Defer monorepo migration until Phase 4 (viewer app). For Phases 1-2, keep the existing Vite project and add the API as a `/api` directory (Vercel Serverless Functions) or a separate lightweight Next.js app deployed alongside it. This avoids 2-5 days of Turborepo/build-system work before delivering any user value. The monorepo structure below is the **target** architecture, not the starting point.

### Why Monorepo

| Option | Migration Risk | Cost | Solo Dev Friendly |
|---|---|---|---|
| Convert to Next.js monolith | **Very high** — complex SPA with drag-drop, canvas | Low (1 deploy) | Risky |
| Separate projects | Low | Medium (2 deploys) | More repos to manage |
| **Monorepo (Turborepo)** | **Zero** — keep existing app | Low (shared infra) | **Best** |

### Directory Structure

```
procode-platform/
│
├── apps/
│   ├── editor/                    # EXISTING Vite+React app (zero changes initially)
│   │   ├── src/
│   │   │   ├── App.tsx
│   │   │   ├── Editor.tsx
│   │   │   ├── Dashboard.tsx
│   │   │   ├── types.ts           → imports from @procode/shared-types
│   │   │   ├── storageService.ts  → replaced with @procode/api-client
│   │   │   └── ...
│   │   ├── package.json
│   │   └── vite.config.ts
│   │
│   ├── api/                       # NEW Next.js backend
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── api/
│   │   │   │   │   ├── apps/
│   │   │   │   │   │   ├── route.ts          # GET (list), POST (create)
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       ├── route.ts      # GET, PUT, DELETE
│   │   │   │   │   │       └── versions/
│   │   │   │   │   │           └── route.ts  # GET (version history)
│   │   │   │   │   ├── orgs/
│   │   │   │   │   │   ├── route.ts          # GET, POST
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       ├── route.ts      # GET, PUT, DELETE
│   │   │   │   │   │       └── members/
│   │   │   │   │   │           └── route.ts  # GET, POST, DELETE
│   │   │   │   │   ├── templates/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── widgets/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── themes/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── presets/
│   │   │   │   │   │   ├── route.ts          # GET (list), POST (create)
│   │   │   │   │   │   ├── export/
│   │   │   │   │   │   │   └── route.ts      # GET (export all)
│   │   │   │   │   │   ├── import/
│   │   │   │   │   │   │   └── route.ts      # POST (import)
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       ├── route.ts      # GET, PUT, DELETE
│   │   │   │   │   │       └── export/
│   │   │   │   │   │           └── route.ts  # GET (export single)
│   │   │   │   │   ├── auth/
│   │   │   │   │   │   └── [...nextauth]/
│   │   │   │   │   │       └── route.ts
│   │   │   │   │   └── billing/
│   │   │   │   │       └── webhook/
│   │   │   │   │           └── route.ts      # Stripe webhook
│   │   │   │   └── middleware.ts              # Auth + tenant context
│   │   │   ├── lib/
│   │   │   │   ├── supabase.ts               # Supabase client
│   │   │   │   ├── auth.ts                   # Auth helpers
│   │   │   │   └── middleware/
│   │   │   │       ├── withAuth.ts
│   │   │   │       ├── withTenant.ts
│   │   │   │       └── withRateLimit.ts
│   │   │   └── services/
│   │   │       ├── appService.ts             # App CRUD business logic
│   │   │       ├── orgService.ts             # Organization management
│   │   │       ├── versionService.ts         # Version history
│   │   │       ├── collaborationService.ts   # Real-time session mgmt
│   │   │       └── billingService.ts         # Stripe integration
│   │   ├── package.json
│   │   ├── next.config.ts
│   │   └── tsconfig.json
│   │
│   └── viewer/                    # FUTURE: Serves deployed end-user apps
│       ├── src/
│       │   ├── app/
│       │   │   ├── [orgSlug]/
│       │   │   │   └── [appSlug]/
│       │   │   │       └── page.tsx          # SSR rendered app
│       │   │   └── layout.tsx
│       │   └── lib/
│       │       └── renderer.ts               # Server-side AppDefinition renderer
│       ├── package.json
│       └── next.config.ts
│
├── packages/
│   ├── shared-types/              # Extracted from editor's types.ts
│   │   ├── src/
│   │   │   ├── app-definition.ts  # AppDefinition, AppComponent, etc.
│   │   │   ├── auth.ts            # AuthUser, AuthSession
│   │   │   ├── api.ts             # API request/response types
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── database/                  # Prisma schema + migrations
│   │   ├── prisma/
│   │   │   ├── schema.prisma
│   │   │   └── migrations/
│   │   ├── src/
│   │   │   ├── client.ts          # Configured Prisma client
│   │   │   └── index.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── auth/                      # Auth abstraction layer
│   │   ├── src/
│   │   │   ├── types.ts           # AuthProvider interface
│   │   │   ├── supabase.ts        # Supabase Auth implementation
│   │   │   ├── nextauth.ts        # NextAuth implementation (if needed)
│   │   │   └── index.ts           # Re-exports active provider
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   └── api-client/                # Client SDK for frontend
│       ├── src/
│       │   ├── client.ts          # Configured HTTP client
│       │   ├── apps.ts            # App CRUD methods
│       │   ├── orgs.ts            # Org methods
│       │   ├── templates.ts       # Template methods
│       │   ├── widgets.ts         # Widget methods
│       │   ├── themes.ts          # Theme methods
│       │   └── index.ts
│       ├── package.json
│       └── tsconfig.json
│
├── turbo.json                     # Turborepo pipeline config
├── package.json                   # Root workspace
├── .github/
│   └── workflows/
│       ├── ci.yml                 # Lint + type check + test on PR
│       └── deploy.yml             # Deploy on merge to main
└── .env.example                   # Required environment variables
```

### Turborepo Configuration

```json
// turbo.json
{
  "$schema": "https://turbo.build/schema.json",
  "globalDependencies": ["**/.env.*local"],
  "pipeline": {
    "build": {
      "dependsOn": ["^build"],
      "outputs": ["dist/**", ".next/**"]
    },
    "dev": {
      "cache": false,
      "persistent": true
    },
    "test": {
      "dependsOn": ["^build"]
    },
    "lint": {},
    "type-check": {
      "dependsOn": ["^build"]
    },
    "db:migrate": {
      "cache": false
    }
  }
}
```

---

## 7. Database Schema Design

### Core Tables

```sql
-- ============================================================
-- TENANT & ORGANIZATION
-- ============================================================

CREATE TABLE organizations (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL UNIQUE,       -- URL-safe org identifier
  logo_url      TEXT,
  plan          TEXT NOT NULL DEFAULT 'free',  -- free | pro | team | enterprise
  stripe_customer_id TEXT UNIQUE,
  stripe_subscription_id TEXT UNIQUE,
  settings      JSONB DEFAULT '{}',         -- org-level settings
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE users (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email         TEXT NOT NULL UNIQUE,
  full_name     TEXT,
  avatar_url    TEXT,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE organization_members (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id       UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role          TEXT NOT NULL DEFAULT 'member',  -- owner | admin | editor | viewer
  invited_by    UUID REFERENCES users(id),
  joined_at     TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, user_id)
);

-- ============================================================
-- APPLICATIONS
-- ============================================================

CREATE TABLE apps (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  slug          TEXT NOT NULL,                -- URL-safe app identifier
  description   TEXT,
  definition    JSONB NOT NULL,               -- Full AppDefinition
  thumbnail     TEXT,                         -- Base64 or storage URL
  is_published  BOOLEAN DEFAULT FALSE,
  published_at  TIMESTAMPTZ,
  created_by    UUID NOT NULL REFERENCES users(id),
  updated_by    UUID REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(org_id, slug)
);

-- Version history (snapshots)
CREATE TABLE app_versions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id        UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  version       INTEGER NOT NULL,
  definition    JSONB NOT NULL,               -- Snapshot of AppDefinition
  change_summary TEXT,                        -- "Added login page" (auto or manual)
  created_by    UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(app_id, version)
);

-- ============================================================
-- SHARED RESOURCES
-- ============================================================

CREATE TABLE templates (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID REFERENCES organizations(id) ON DELETE CASCADE,  -- NULL = global
  name          TEXT NOT NULL,
  description   TEXT,
  thumbnail     TEXT,
  definition    JSONB NOT NULL,               -- AppDefinition template
  is_public     BOOLEAN DEFAULT FALSE,        -- Visible to all users
  category      TEXT,
  tags          TEXT[] DEFAULT '{}',
  created_by    UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE widget_definitions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  description   TEXT,
  icon          TEXT,
  category      TEXT,
  tags          TEXT[] DEFAULT '{}',
  definition    JSONB NOT NULL,               -- WidgetDefinition (inputs, outputs, components)
  is_public     BOOLEAN DEFAULT FALSE,
  created_by    UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE themes (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID REFERENCES organizations(id) ON DELETE CASCADE,  -- NULL = global
  name          TEXT NOT NULL,
  description   TEXT,
  config        JSONB NOT NULL,               -- Theme object
  is_public     BOOLEAN DEFAULT FALSE,
  created_by    UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- PRESETS (Saved Component Configurations)
-- ============================================================

CREATE TABLE presets (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID REFERENCES organizations(id) ON DELETE CASCADE,  -- NULL = personal
  name          TEXT NOT NULL,
  description   TEXT,
  icon          TEXT,                              -- Emoji or icon name
  components    JSONB NOT NULL,                    -- Array of component definitions
  is_public     BOOLEAN DEFAULT FALSE,
  category      TEXT,                              -- 'form', 'dashboard', 'navigation', etc.
  tags          TEXT[] DEFAULT '{}',               -- Searchable tags
  created_by    UUID NOT NULL REFERENCES users(id),
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- COLLABORATION
-- ============================================================

CREATE TABLE collaboration_sessions (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id        UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  yjs_state     BYTEA,                        -- Serialized Yjs document
  active_users  JSONB DEFAULT '[]',           -- [{userId, cursor, selection, color}]
  started_at    TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- AUDIT & ANALYTICS
-- ============================================================

CREATE TABLE audit_log (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  user_id       UUID REFERENCES users(id),
  action        TEXT NOT NULL,                -- 'app.created', 'member.invited', etc.
  resource_type TEXT NOT NULL,                -- 'app', 'org', 'template', etc.
  resource_id   UUID,
  metadata      JSONB DEFAULT '{}',           -- Action-specific data
  ip_address    INET,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- DEPLOYED APPS (App Hosting)
-- ============================================================

CREATE TABLE deployments (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  app_id        UUID NOT NULL REFERENCES apps(id) ON DELETE CASCADE,
  org_id        UUID NOT NULL REFERENCES organizations(id) ON DELETE CASCADE,
  version_id    UUID REFERENCES app_versions(id),
  status        TEXT NOT NULL DEFAULT 'active',  -- active | inactive | failed
  custom_domain TEXT UNIQUE,                     -- "myapp.example.com"
  subdomain     TEXT UNIQUE,                     -- "myapp.procode.app"
  definition    JSONB NOT NULL,                  -- Frozen AppDefinition for this deployment
  settings      JSONB DEFAULT '{}',              -- Deployment-specific settings
  deployed_by   UUID NOT NULL REFERENCES users(id),
  deployed_at   TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- Fast app listing by org
CREATE INDEX idx_apps_org_id ON apps(org_id);
CREATE INDEX idx_apps_org_slug ON apps(org_id, slug);

-- Fast version lookup
CREATE INDEX idx_app_versions_app_id ON app_versions(app_id, version DESC);

-- Query INTO JSONB (find apps with specific component types)
CREATE INDEX idx_apps_definition_gin ON apps USING GIN (definition jsonb_path_ops);

-- Audit log queries
CREATE INDEX idx_audit_log_org ON audit_log(org_id, created_at DESC);
CREATE INDEX idx_audit_log_user ON audit_log(user_id, created_at DESC);

-- Member lookups
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_org_members_org ON organization_members(org_id);

-- Template/widget browsing
CREATE INDEX idx_templates_public ON templates(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_widgets_org ON widget_definitions(org_id);

-- Preset browsing
CREATE INDEX idx_presets_org ON presets(org_id);
CREATE INDEX idx_presets_public ON presets(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_presets_category ON presets(category);

-- Deployments
CREATE INDEX idx_deployments_app ON deployments(app_id);
CREATE INDEX idx_deployments_subdomain ON deployments(subdomain);
CREATE INDEX idx_deployments_domain ON deployments(custom_domain);
```

### Row Level Security Policies

```sql
-- ============================================================
-- RLS POLICIES (Multi-Tenancy at Database Level)
-- ============================================================

ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE apps ENABLE ROW LEVEL SECURITY;
ALTER TABLE templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE widget_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE presets ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- Users can only see orgs they belong to
CREATE POLICY "Users see own orgs" ON organizations
  FOR SELECT USING (
    id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())
  );

-- Users can only see apps in their orgs
CREATE POLICY "Users see org apps" ON apps
  FOR SELECT USING (
    org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())
  );

-- Only editors+ can modify apps
CREATE POLICY "Editors modify apps" ON apps
  FOR ALL USING (
    org_id IN (
      SELECT org_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
    )
  );

-- Public templates visible to all, org templates visible to members
CREATE POLICY "Templates visibility" ON templates
  FOR SELECT USING (
    is_public = TRUE
    OR org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())
  );

-- Public presets visible to all, org presets visible to members, own presets always visible
CREATE POLICY "Presets visibility" ON presets
  FOR SELECT USING (
    is_public = TRUE
    OR created_by = auth.uid()
    OR org_id IN (SELECT org_id FROM organization_members WHERE user_id = auth.uid())
  );

-- Users can modify their own presets
CREATE POLICY "Users modify own presets" ON presets
  FOR ALL USING (
    created_by = auth.uid()
  );

-- Audit logs visible to org admins
CREATE POLICY "Admins see audit logs" ON audit_log
  FOR SELECT USING (
    org_id IN (
      SELECT org_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin')
    )
  );
```

---

## 8. Auth Architecture

### Abstraction Layer (Swap-Ready)

The auth system is abstracted so you can start with Supabase Auth and migrate to custom OAuth later without changing any API route code.

```typescript
// packages/auth/src/types.ts

export interface AuthUser {
  id: string;
  email: string;
  fullName: string | null;
  avatarUrl: string | null;
  metadata: Record<string, unknown>;
}

export interface AuthSession {
  user: AuthUser;
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
}

export interface AuthProvider {
  // Session management
  getSession(request: Request): Promise<AuthSession | null>;
  requireSession(request: Request): Promise<AuthSession>;  // throws if not authenticated

  // Sign in/out
  signInWithEmail(email: string, password: string): Promise<AuthSession>;
  signInWithOAuth(provider: 'google' | 'github' | 'azure'): Promise<{ url: string }>;
  signInWithMagicLink(email: string): Promise<void>;
  signOut(request: Request): Promise<void>;

  // User management
  getUser(userId: string): Promise<AuthUser | null>;
  updateUser(userId: string, data: Partial<AuthUser>): Promise<AuthUser>;

  // Token management
  refreshSession(refreshToken: string): Promise<AuthSession>;
  verifyToken(token: string): Promise<AuthUser>;
}
```

```typescript
// packages/auth/src/supabase.ts — Phase 1 implementation

import { createClient } from '@supabase/supabase-js';
import type { AuthProvider, AuthSession, AuthUser } from './types';

export class SupabaseAuthProvider implements AuthProvider {
  private client;

  constructor(url: string, anonKey: string) {
    this.client = createClient(url, anonKey);
  }

  async getSession(request: Request): Promise<AuthSession | null> {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return null;

    const { data: { user }, error } = await this.client.auth.getUser(token);
    if (error || !user) return null;

    return {
      user: { id: user.id, email: user.email!, fullName: user.user_metadata.full_name, avatarUrl: user.user_metadata.avatar_url, metadata: user.user_metadata },
      accessToken: token,
      refreshToken: '',
      expiresAt: 0,
    };
  }

  // ... other method implementations
}
```

```typescript
// packages/auth/src/index.ts — swap provider here, nowhere else

import { SupabaseAuthProvider } from './supabase';
// import { CustomOAuthProvider } from './oauth';  // Future

export const authProvider = new SupabaseAuthProvider(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_ANON_KEY!
);

export type { AuthProvider, AuthSession, AuthUser } from './types';
```

### Auth Flow

```
User clicks "Sign In"
      │
      ▼
  ┌─────────────────────────────────────────────┐
  │  Supabase Auth (managed)                     │
  │                                               │
  │  ┌─────────────┐  ┌──────────┐  ┌────────┐  │
  │  │ Email/Pass  │  │ OAuth    │  │ Magic  │  │
  │  │             │  │ (Google, │  │ Link   │  │
  │  │             │  │  GitHub) │  │        │  │
  │  └──────┬──────┘  └────┬─────┘  └───┬────┘  │
  │         └──────────────┼─────────────┘       │
  │                        ▼                      │
  │              JWT Token issued                  │
  └────────────────────────┬──────────────────────┘
                           │
                           ▼
  ┌─────────────────────────────────────────────┐
  │  API Middleware                               │
  │                                               │
  │  1. Extract JWT from Authorization header     │
  │  2. Verify with Supabase                      │
  │  3. Load user + org membership                │
  │  4. Attach to request context                 │
  │  5. RLS automatically filters by org_id       │
  └─────────────────────────────────────────────┘
```

---

## 9. Real-Time Collaboration Architecture

### Phase 1: Presence Only (Simple)

```
User A editing ─── Supabase Realtime Channel ─── User B sees A's cursor
                   (Broadcast)
```

Supabase Realtime Broadcast is sufficient for:
- Who's currently viewing/editing an app
- Cursor positions
- Selection highlights
- "User X is editing..." indicators

### Phase 3: Full CRDT Collaboration (Yjs)

For Figma-like simultaneous editing:

```
┌─────────┐     ┌─────────┐
│ Client A │     │ Client B │
│  (Yjs)   │     │  (Yjs)   │
└────┬─────┘     └─────┬────┘
     │                  │
     │   Yjs updates    │
     │   (binary diffs) │
     ▼                  ▼
┌────────────────────────────────┐
│  Supabase Realtime Channel     │
│  (transport for Yjs updates)   │
│                                │
│  OR                            │
│                                │
│  Hocuspocus/y-websocket Server │
│  (dedicated WebSocket server)  │
└───────────────┬────────────────┘
                │
                ▼
┌────────────────────────────────┐
│  PostgreSQL                    │
│  collaboration_sessions.       │
│  yjs_state (BYTEA)             │
│  (persisted Yjs document)     │
└────────────────────────────────┘
```

**Yjs Data Mapping:**
- `Y.Map` → root AppDefinition
- `Y.Array` → components[], pages[], variables[]
- `Y.Map` → each component's props
- Automatic conflict resolution at property level

### Collaboration Granularity

```
AppDefinition (Y.Map)
├── pages (Y.Array of Y.Map)
│   └── Each page: independent editable unit
├── components (Y.Array of Y.Map)
│   └── Each component: independent editable unit
│       └── props (Y.Map): property-level conflict resolution
├── variables (Y.Array of Y.Map)
├── theme (Y.Map)
│   └── colors, typography, etc.: independent editable units
└── dataStore (Y.Map)
```

Two users can simultaneously:
- Edit different components (no conflict)
- Edit different properties of the same component (no conflict)
- Edit the same property of the same component (last-write-wins at character level)

---

## 10. App Hosting Architecture

### How End-User Apps Are Served

```
End user visits: https://myapp.procode.app
                 or https://myapp.example.com (custom domain)
      │
      ▼
┌──────────────────────────────────────────────────────┐
│  Vercel Edge Network (CDN)                            │
│  Route: apps/viewer/src/app/[orgSlug]/[appSlug]/     │
└──────────────────────┬───────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────┐
│  Viewer App (Next.js SSR)                             │
│                                                       │
│  1. Look up deployment by subdomain/domain            │
│  2. Load frozen AppDefinition from deployments table  │
│  3. Server-side render the app (React SSR)            │
│  4. Hydrate on client for interactivity               │
│  5. Expression engine runs client-side                │
│                                                       │
│  Cache: ISR (Incremental Static Regeneration)         │
│  Revalidate on re-deploy                              │
└──────────────────────────────────────────────────────┘
```

### Deployment Flow

```
Designer clicks "Publish" in Editor
      │
      ▼
API: POST /api/apps/{id}/deploy
      │
      ├── 1. Create app_version snapshot
      ├── 2. Create/update deployment record
      │       (frozen AppDefinition, subdomain, domain)
      ├── 3. Purge CDN cache for this app
      └── 4. Return deployment URL

Subdomain: {appSlug}.{orgSlug}.procode.app
Custom:    Vercel domain configuration API
```

---

## 11. File Storage Architecture

### Storage Buckets (Supabase Storage)

```
storage/
├── avatars/                    # User profile photos
│   └── {userId}/avatar.{ext}
├── app-assets/                 # Images used in app components
│   └── {orgId}/{appId}/{filename}
├── thumbnails/                 # App/template preview images
│   └── {orgId}/{appId}/thumb.png
├── exports/                    # Generated project exports
│   └── {orgId}/{appId}/{timestamp}.zip
└── org-assets/                 # Organization logos, branding
    └── {orgId}/{filename}
```

### Storage Policies (RLS)

```sql
-- Users can only access files in their org's folders
CREATE POLICY "Org members access org files"
ON storage.objects FOR ALL USING (
  bucket_id = 'app-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT org_id::text FROM organization_members WHERE user_id = auth.uid()
  )
);

-- Public deployed app assets are accessible to anyone
CREATE POLICY "Public app assets"
ON storage.objects FOR SELECT USING (
  bucket_id = 'app-assets'
  AND (storage.foldername(name))[1] IN (
    SELECT org_id::text FROM deployments WHERE status = 'active'
  )
);
```

---

## 12. API Design

### REST Endpoints

```
# Auth (handled by Supabase, but wrapped for abstraction)
POST   /api/auth/signup              # Email/password signup
POST   /api/auth/signin              # Email/password signin
POST   /api/auth/signin/oauth        # OAuth redirect
POST   /api/auth/signout             # Sign out
GET    /api/auth/session             # Get current session

# Organizations
GET    /api/orgs                     # List user's organizations
POST   /api/orgs                     # Create organization
GET    /api/orgs/:id                 # Get organization details
PUT    /api/orgs/:id                 # Update organization
DELETE /api/orgs/:id                 # Delete organization (owner only)

# Organization Members
GET    /api/orgs/:id/members         # List members
POST   /api/orgs/:id/members         # Invite member
PUT    /api/orgs/:id/members/:uid    # Update member role
DELETE /api/orgs/:id/members/:uid    # Remove member

# Apps
GET    /api/apps                     # List apps in current org
POST   /api/apps                     # Create app
GET    /api/apps/:id                 # Get full app (AppDefinition)
PUT    /api/apps/:id                 # Save app (full document)
DELETE /api/apps/:id                 # Delete app
POST   /api/apps/:id/duplicate       # Clone app

# App Versions
GET    /api/apps/:id/versions        # List version history
GET    /api/apps/:id/versions/:vid   # Get specific version
POST   /api/apps/:id/versions        # Create version snapshot

# App Deployment
POST   /api/apps/:id/deploy          # Deploy/publish app
GET    /api/apps/:id/deployment      # Get deployment status
DELETE /api/apps/:id/deployment      # Undeploy app

# Templates
GET    /api/templates                 # List templates (org + public)
POST   /api/templates                 # Create template
GET    /api/templates/:id             # Get template
PUT    /api/templates/:id             # Update template
DELETE /api/templates/:id             # Delete template

# Widget Definitions
GET    /api/widgets                   # List widgets (org + public)
POST   /api/widgets                   # Create widget
GET    /api/widgets/:id               # Get widget
PUT    /api/widgets/:id               # Update widget
DELETE /api/widgets/:id               # Delete widget

# Themes
GET    /api/themes                    # List themes (org + public)
POST   /api/themes                    # Create theme
PUT    /api/themes/:id                # Update theme
DELETE /api/themes/:id                # Delete theme

# Presets
GET    /api/presets                   # List presets (own + org + public)
POST   /api/presets                   # Create preset
GET    /api/presets/:id               # Get preset
PUT    /api/presets/:id               # Update preset
DELETE /api/presets/:id               # Delete preset
GET    /api/presets/:id/export        # Export single preset as JSON
GET    /api/presets/export            # Export all user presets
POST   /api/presets/import            # Import presets from JSON

# Import/Export
POST   /api/import/apps               # Import apps from JSON
GET    /api/export/apps                # Export all org apps
GET    /api/export/apps/:id            # Export single app
POST   /api/import/templates           # Import templates
GET    /api/export/templates           # Export all templates

# Collaboration
POST   /api/collab/:appId/join        # Join collaboration session
POST   /api/collab/:appId/leave       # Leave session
GET    /api/collab/:appId/presence     # Get active users

# Billing (Stripe)
POST   /api/billing/create-checkout    # Create Stripe checkout session
POST   /api/billing/portal             # Create customer portal link
POST   /api/billing/webhook            # Stripe webhook handler
GET    /api/billing/subscription       # Get current plan details

# Audit
GET    /api/audit-log                  # Query audit log (admin only)
```

---

## 13. Multi-Tenancy Model

### Data Isolation

```
┌─────────────────────────────────────────────────────────────┐
│                    MULTI-TENANCY MODEL                       │
│                                                              │
│  Strategy: Shared Database + Row-Level Security              │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Single PostgreSQL Database                           │   │
│  │                                                       │   │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐              │   │
│  │  │ Org A   │  │ Org B   │  │ Org C   │   All in    │   │
│  │  │ apps    │  │ apps    │  │ apps    │   same      │   │
│  │  │ widgets │  │ widgets │  │ widgets │   tables,   │   │
│  │  │ themes  │  │ themes  │  │ themes  │   filtered  │   │
│  │  │ members │  │ members │  │ members │   by RLS    │   │
│  │  └─────────┘  └─────────┘  └─────────┘              │   │
│  │                                                       │   │
│  │  RLS Policy: WHERE org_id = current_user_org()       │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  Benefits:                                                   │
│  - Single database to manage (cost efficient)                │
│  - RLS enforced at database level (can't bypass in code)    │
│  - Easy to query across tenants (admin/analytics)            │
│  - Standard PostgreSQL (portable)                            │
│                                                              │
│  Scale path:                                                 │
│  - Start: Single database                                    │
│  - Growth: Read replicas for analytics                       │
│  - Large: Database-per-tenant for enterprise customers       │
└─────────────────────────────────────────────────────────────┘
```

### Tenant Context Middleware

```typescript
// apps/api/src/lib/middleware/withTenant.ts

export async function withTenant(request: Request) {
  const session = await authProvider.requireSession(request);

  // Get org from header, URL, or user's default org
  const orgId = request.headers.get('X-Org-Id')
    || extractOrgFromUrl(request)
    || await getDefaultOrg(session.user.id);

  // Verify membership
  const membership = await db.organizationMembers.findUnique({
    where: { org_id_user_id: { org_id: orgId, user_id: session.user.id } }
  });

  if (!membership) throw new ForbiddenError('Not a member of this organization');

  return {
    user: session.user,
    org: { id: orgId, role: membership.role },
  };
}
```

---

## 14. Automation & DevOps

### CI/CD Pipeline (GitHub Actions)

```yaml
# .github/workflows/ci.yml
name: CI

on:
  pull_request:
    branches: [main]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo lint type-check test

  preview:
    # Vercel auto-creates preview deployment for every PR
    # No config needed — just connect repo to Vercel
```

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  migrate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - run: pnpm install --frozen-lockfile
      - run: pnpm --filter @procode/database db:migrate
    env:
      DATABASE_URL: ${{ secrets.DATABASE_URL }}

  # Vercel auto-deploys on push to main — no job needed
```

### What's Automated

| Workflow | How | Your Effort |
|---|---|---|
| Code deploy | `git push` → Vercel auto-build + deploy | Zero |
| Preview environments | Every PR gets a preview URL | Zero |
| Tests | GitHub Actions on every PR | Write tests once |
| Type checking | GitHub Actions on every PR | Zero |
| DB migrations | GitHub Actions before deploy | Write migration |
| SSL certificates | Vercel auto-provisions | Zero |
| CDN | Vercel edge network | Zero |
| Database backups | Supabase daily auto-backups | Zero |
| Scaling | Vercel + Supabase auto-scale | Zero |
| Auth | Supabase handles flows | Configure once |
| Billing | Stripe webhooks → auto-update plans | Configure once |
| Emails | Resend triggered by webhooks | Template once |
| Error alerts | Sentry → Slack/email notification | Configure once |
| Monitoring | Vercel Analytics + Supabase dashboard | Zero |

---

## 15. Accounts Required

### Phase 1 (MVP) — 2 Core Accounts

| Service | Purpose | Free Tier | Sign Up |
|---|---|---|---|
| **Vercel** | Hosting, CDN, edge functions, deployments | 100GB bandwidth, serverless functions | vercel.com |
| **Supabase** | Database, Auth, Storage, Realtime | 500MB DB, 1GB storage, 50K MAU, 200 concurrent realtime | supabase.com |

### Phase 2+ (Add When Needed)

| Service | Purpose | Free Tier | When |
|---|---|---|---|
| **Stripe** | Billing, subscriptions | Free until you charge | When adding paid plans |
| **Resend** | Transactional emails | 3,000 emails/month | When adding invites/notifications |
| **Sentry** | Error tracking | 5K events/month | Before going to production |
| **GitHub** | Source code, CI/CD | Unlimited private repos | You likely already have this |

### Optional (Phase 4+)

| Service | Purpose | When |
|---|---|---|
| **Cloudflare R2** | Additional file storage (10GB free, zero egress) | If 1GB Supabase storage isn't enough |
| **Upstash Redis** | Additional caching/rate limiting | If Supabase edge functions need faster cache |
| **PostHog** | Product analytics | When you need user behavior data |

---

## 16. Cost Projections

### Supabase-Centric Stack (Recommended)

| Phase | Users | Supabase | Vercel | Utilities | **Total/mo** |
|---|---|---|---|---|---|
| **1: MVP** | 0-100 | Free | Free | — | **$0** |
| **2: Growing** | 100-1K | Pro $25 | Free | Sentry free | **$25** |
| **3: Revenue** | 1K-5K | Pro $25 | Pro $20 | Stripe $0 + Resend $0 | **$45** |
| **4: Scale** | 5K-10K | Pro $25 + usage | Pro $20 | + Sentry $26 | **$100-200** |
| **5: Large** | 10K+ | Team $599 | Enterprise | All paid tiers | **$800+** |

### Distributed Stack (Comparison)

| Phase | Users | Services | **Total/mo** |
|---|---|---|---|
| **1: MVP** | 0-100 | Vercel + Neon + NextAuth (all free) | **$0** |
| **2: Growing** | 100-1K | + Upstash + R2 (all free) | **$0** |
| **3: Revenue** | 1K-5K | Neon Pro $19 + Vercel Pro $20 + Upstash Pro $10 | **$60-80** |
| **4: Scale** | 5K-10K | + Hocuspocus server ~$20 | **$150-300** |
| **5: Large** | 10K+ | All pro/team tiers | **$500-1000** |

### Key Insight

The distributed stack is slightly cheaper at Phase 3-4, but the **operational complexity cost** (your time) far exceeds the dollar savings for a solo developer.

---

## 17. Security Considerations

### Data Protection

- **Row-Level Security**: All tenant data isolated at database level
- **JWT Verification**: Every API request verified against Supabase Auth
- **HTTPS Only**: Vercel enforces HTTPS on all endpoints
- **CORS**: Configured to allow only your frontend domains
- **Input Validation**: Zod schemas on all API inputs
- **SQL Injection**: Prisma ORM parameterizes all queries
- **XSS Prevention**: React escapes output by default; CSP headers on deployed apps

### Auth Security

- **Password Hashing**: Supabase uses bcrypt (handled automatically)
- **JWT Rotation**: Short-lived access tokens + refresh tokens
- **OAuth State**: CSRF protection on OAuth flows (Supabase handles)
- **MFA**: Available via Supabase Auth (TOTP)
- **Rate Limiting**: On auth endpoints to prevent brute force

### Secrets Management

```
# .env.local (never committed)
SUPABASE_URL=https://xxx.supabase.co
SUPABASE_ANON_KEY=eyJ...                  # Public (safe for client)
SUPABASE_SERVICE_ROLE_KEY=eyJ...           # Private (server-only!)
STRIPE_SECRET_KEY=sk_live_...              # Private
STRIPE_WEBHOOK_SECRET=whsec_...            # Private
RESEND_API_KEY=re_...                      # Private
SENTRY_DSN=https://...                     # Public (safe for client)
```

**Vercel Environment Variables**: Store all secrets in Vercel dashboard (encrypted, per-environment).

---

## 18. Performance Architecture

### Performance Targets

| Scenario | Target | Criticality |
|---|---|---|
| **Runtime (deployed app)** — CDN cached | <500ms | Must hit |
| **Runtime (deployed app)** — first visitor | <1s perceived (FCP) | Must hit |
| **Design time (editor)** — cached app | <300ms | Must hit |
| **Design time (editor)** — first load | <1s | Must hit |
| **Auto-save latency** | 0ms perceived | Must hit |
| **Collaboration update propagation** | <100ms | Should hit |

### Baseline: Current Performance (localStorage)

```
User clicks "Edit App"
  ├── localStorage.getItem()     ~10-50ms   (local disk)
  ├── JSON.parse(5MB)            ~20-50ms   (CPU)
  ├── React render canvas        ~100-500ms (CPU, depends on component count)
  Total: ~130-600ms  — Always under 1 second
```

### Performance Risk: Without Optimization

Moving from localStorage to a remote database introduces network latency:

```
DESIGN TIME — Without optimization:
  ├── API call to Vercel         ~20-50ms   (DNS + TLS)
  ├── Vercel → Supabase DB       ~30-100ms  (server-to-DB)
  ├── PostgreSQL reads 5MB JSONB ~50-200ms  (TOAST decompression)
  ├── Response over network      ~50-500ms  (depends on connection)
  ├── JSON.parse on client       ~20-50ms   (CPU)
  ├── React render canvas        ~100-500ms (CPU, same as today)
  Total: ~270-1400ms  — Complex apps COULD exceed 1 second

RUNTIME — Without optimization:
  ├── DNS resolution             ~50ms      (first visit)
  ├── Vercel Edge routing        ~10ms
  ├── Fetch from Supabase DB     ~50-200ms
  ├── SSR render 100+ components ~200-800ms (CPU intensive)
  ├── HTML transfer              ~50-200ms
  ├── JS bundle download         ~100-300ms
  ├── React hydration            ~100-500ms
  Total: ~560-2060ms  — Will NOT hit sub-second
```

### Optimization Strategy (6 Layers)

All optimizations below are **mandatory** — they must be built into the implementation.

#### Layer 1: Response Compression (Automatic)

Vercel auto-applies gzip/brotli compression to all responses.

```
5MB AppDefinition JSON:
  ├── gzip compressed   → ~400-600KB  (85-90% reduction)
  └── brotli compressed → ~300-500KB  (90%+ reduction)

Transfer time at different speeds:
  ├── Fast broadband (50Mbps):  ~10-20ms
  ├── Average (10Mbps):         ~40-80ms
  ├── Mobile 4G (5Mbps):        ~80-160ms
  └── Slow 3G (1Mbps):          ~400-800ms
```

**Impact**: Network transfer drops from 50-500ms to 10-160ms for most users.
**Effort**: Zero — Vercel handles this automatically.

#### Layer 2: Client-Side Cache (IndexedDB)

Cache AppDefinition in the browser's IndexedDB. Show cached version immediately, sync in background (stale-while-revalidate pattern).

```
FIRST load (no cache):
  API fetch + parse           ~300-600ms
  React render                ~100-500ms
  Total:                      ~400-1100ms

SUBSEQUENT loads (cached):
  IndexedDB read              ~5-20ms     (local, same speed as localStorage!)
  React render                ~100-500ms
  Background sync API call    ~300-600ms  (user doesn't wait)
  Total perceived:            ~105-520ms  — Under 1 second!
```

```typescript
// Stale-while-revalidate pattern

async function loadApp(appId: string): Promise<AppDefinition> {
  // 1. Try local cache first (instant)
  const cached = await indexedDB.get(`app:${appId}`);
  if (cached) {
    // Show cached version immediately
    renderApp(cached.definition);

    // 2. Sync in background (user doesn't wait)
    const latest = await api.getApp(appId);
    if (latest.updatedAt > cached.updatedAt) {
      await indexedDB.put(`app:${appId}`, latest);
      renderApp(latest);  // Silently update if changed
    }
    return cached.definition;
  }

  // 3. No cache — full fetch (first time only)
  const app = await api.getApp(appId);
  await indexedDB.put(`app:${appId}`, app);
  return app;
}
```

**Impact**: After first load, editor opens as fast as localStorage.
**Effort**: ~1 day of implementation.

#### Layer 3: Metadata-First Loading (Skeleton UI)

Don't wait for the full 5MB. Load lightweight metadata first, show a skeleton, then load page components progressively.

```
Step 1 (instant):   Show editor skeleton + toolbar + sidebar
Step 2 (~100ms):    Load app metadata (name, pages, theme) — ~5KB
Step 3 (~200ms):    Load current page components only — ~50-500KB
Step 4 (background): Prefetch other pages' components

User sees usable editor in ~300ms, full app loaded by ~600ms
```

API endpoints to support this:

```
GET /api/apps/:id/metadata            → ~5KB   (name, pages, theme, variable defs)
GET /api/apps/:id/pages/:pageId       → ~50-500KB (components for one page)
GET /api/apps/:id                     → ~5MB   (full, for export/save operations)
```

```sql
-- Partial JSONB queries (PostgreSQL does the filtering, less data transferred)

-- Metadata only:
SELECT id, name, slug, updated_at,
       definition->'pages' AS pages,
       definition->'mainPageId' AS main_page_id,
       definition->'theme' AS theme,
       definition->'variables' AS variables
FROM apps WHERE id = $1;

-- Single page components:
SELECT jsonb_path_query_array(
  definition,
  '$.components[*] ? (@.pageId == $pageId)',
  jsonb_build_object('pageId', $1)
) AS components
FROM apps WHERE id = $2;
```

**Impact**: Perceived load time drops to ~300ms even for complex apps.
**Effort**: ~2-3 days (API endpoints + editor loading refactor).

#### Layer 4: Edge Caching / ISR for Runtime

For deployed end-user apps, pre-render at deploy time and serve from CDN (300+ global PoPs).

```
Designer clicks "Publish"
  ├── Freeze AppDefinition in deployments table
  ├── Trigger ISR build (pre-render all pages)
  ├── Cache rendered HTML at Vercel Edge
  └── Invalidate old cache

End-user visits myapp.procode.app:
  ├── Vercel Edge CDN hit        ~10-30ms   (served from nearest PoP)
  ├── HTML already rendered       ~0ms       (pre-built)
  ├── Browser parse + paint      ~50-100ms
  ├── JS bundle (code-split)     ~50-150ms  (only needed components)
  ├── Selective hydration         ~50-200ms  (React 18)
  Total: ~160-480ms  — Sub-second!
```

```typescript
// apps/viewer/src/app/[orgSlug]/[appSlug]/page.tsx

export const revalidate = false; // Only revalidate on re-deploy

export default async function DeployedApp({ params }) {
  const deployment = await getDeployment(params.orgSlug, params.appSlug);
  return <AppRenderer definition={deployment.definition} />;
}

// POST /api/apps/:id/deploy triggers:
//   revalidatePath(`/${orgSlug}/${appSlug}`)
```

Pre-warm cache on deploy so the first real visitor gets a CDN hit:

```typescript
async function deployApp(appId: string) {
  const deployment = await createDeployment(appId);

  // Pre-warm the CDN cache (synthetic first request)
  await fetch(`https://${deployment.subdomain}.procode.app`, {
    headers: { 'X-Prerender': 'true' }
  });

  return deployment;
}
```

**Impact**: All visitors after first (or pre-warm) get <200ms loads globally.
**Effort**: Built into Phase 4 (app hosting).

#### Layer 5: Streaming SSR + Selective Hydration

For cache-miss requests (first visitor before pre-warm), use React 18 streaming to progressively send content.

```
Without streaming:
  Server renders ALL 100 components → sends complete HTML
  Time to first byte: ~800-1500ms

With streaming:
  Server sends <head> + shell immediately      → ~50ms   (first byte)
  Server streams above-fold components         → ~200ms  (user sees content)
  Server streams remaining components          → ~500ms  (complete page)
  Client hydrates visible components first     → ~200ms  (interactive)

  First contentful paint: ~250ms
  Fully interactive: ~700ms
```

```tsx
// Streaming SSR with Suspense boundaries

export default async function DeployedApp({ params }) {
  const deployment = await getDeployment(params.orgSlug, params.appSlug);
  const { definition } = deployment;

  return (
    <AppShell theme={definition.theme}>
      {/* Main page renders immediately (no Suspense) */}
      <PageRenderer
        components={getPageComponents(definition, definition.mainPageId)}
      />

      {/* Other pages lazy-loaded */}
      {definition.pages
        .filter(p => p.id !== definition.mainPageId)
        .map(page => (
          <Suspense key={page.id} fallback={null}>
            <PageRenderer components={getPageComponents(definition, page.id)} />
          </Suspense>
        ))}
    </AppShell>
  );
}
```

**Impact**: Even on cache miss, user sees content at ~250ms.
**Effort**: Built into Phase 4 viewer app architecture.

#### Layer 6: Optimistic Auto-Save

The API approach is actually **better** than localStorage for auto-save because it's asynchronous (localStorage is synchronous and blocks the main thread).

```
Current (localStorage):
  JSON.stringify(5MB)    ~30-50ms  (synchronous, blocks UI)
  localStorage.setItem   ~10-30ms  (synchronous, blocks UI)
  Total: ~40-80ms blocking

After (API):
  Optimistic UI update   ~0ms      (UI reflects change immediately)
  Debounced API call     ~100-300ms (background, non-blocking)
  DB write               ~50-100ms  (server-side)
  Total perceived: ~0ms  — Better than localStorage!
```

```typescript
function useAutoSave(appDefinition: AppDefinition) {
  const saveTimeout = useRef<number>();
  const [saveStatus, setSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');

  useEffect(() => {
    clearTimeout(saveTimeout.current);
    setSaveStatus('saving');

    saveTimeout.current = window.setTimeout(async () => {
      try {
        await api.saveApp(appDefinition);  // Background, non-blocking
        setSaveStatus('saved');

        // Update IndexedDB cache
        await indexedDB.put(`app:${appDefinition.id}`, appDefinition);
      } catch (error) {
        setSaveStatus('error');
        // Queue for retry
      }
    }, 1000);
  }, [appDefinition]);

  return saveStatus; // Show "Saving..." / "Saved" / "Error" indicator
}
```

**Impact**: 0ms perceived save latency. Non-blocking UI.
**Effort**: ~0.5 days (modify existing auto-save hook).

### Database Query Optimizations

```sql
-- Dashboard listing (metadata only) — ~5ms
SELECT id, name, slug, thumbnail, created_at, updated_at
FROM apps WHERE org_id = $1
ORDER BY updated_at DESC;

-- Full app load — ~20-50ms (with TOAST compression, 5MB stored as ~500KB on disk)
SELECT definition FROM apps WHERE id = $1;

-- Deployed app lookup — ~10-30ms (simple indexed lookup)
SELECT definition FROM deployments
WHERE subdomain = $1 AND status = 'active';

-- Partial page load — ~30-80ms (DB filters, less data transferred)
SELECT jsonb_path_query_array(
  definition,
  '$.components[*] ? (@.pageId == $pageId)',
  jsonb_build_object('pageId', $1)
) FROM apps WHERE id = $2;
```

### Performance Summary After All Optimizations

| Scenario | Without Optimization | With All Optimizations | Target Met? |
|---|---|---|---|
| **Runtime, CDN cached** | N/A | **100-300ms** | ✅ Sub-second |
| **Runtime, first visitor (cache miss)** | 1.5-2.3s | **250ms FCP, 700ms interactive** (streaming) | ✅ Perceived sub-second |
| **Runtime, pre-warmed** | N/A | **100-200ms** | ✅ Sub-second |
| **Design, cached (IndexedDB)** | N/A | **100-300ms** | ✅ Sub-second |
| **Design, first load (complex)** | 1-1.4s | **300-600ms** (metadata-first) | ✅ Sub-second |
| **Auto-save** | 40-80ms (blocking) | **0ms perceived** (async optimistic) | ✅ Better than today |
| **Collaboration update** | N/A | **50-100ms** (Supabase Realtime) | ✅ Sub-second |

### Performance Data Flow Diagrams

#### Design Time (Optimized)

```
┌─────────────────────────────────────────────────────────────┐
│ User clicks "Edit App"                                       │
│                                                              │
│  ┌──────────────────┐    Cache hit?                         │
│  │  IndexedDB Cache  │──── YES ──→ Render immediately        │
│  │  (local browser)  │            (~100-300ms)               │
│  └────────┬─────────┘            + background sync           │
│           │ NO (first time)                                  │
│           ▼                                                  │
│  ┌──────────────────┐                                       │
│  │  1. Show skeleton │  (~50ms, instant)                     │
│  │  2. Load metadata │  (~100ms, 5KB compressed)             │
│  │  3. Load page     │  (~200ms, 50-500KB compressed)       │
│  │  4. Prefetch rest │  (background, non-blocking)           │
│  └──────────────────┘                                       │
│                                                              │
│  Perceived: ~300ms (skeleton → usable editor)               │
│  Complete:  ~600ms (all pages loaded)                        │
└─────────────────────────────────────────────────────────────┘
```

#### Runtime (Optimized)

```
┌─────────────────────────────────────────────────────────────┐
│ End-user visits myapp.procode.app                            │
│                                                              │
│  ┌──────────────────┐    Edge cache hit?                    │
│  │  Vercel CDN Edge  │──── YES ──→ Serve cached HTML         │
│  │  (300+ PoPs)      │            (~100-200ms total)         │
│  └────────┬─────────┘                                       │
│           │ NO (first visitor / re-deploy)                   │
│           ▼                                                  │
│  ┌──────────────────┐                                       │
│  │  Streaming SSR    │                                       │
│  │  Shell:   ~50ms   │  (first byte)                        │
│  │  Content: ~200ms  │  (first contentful paint)            │
│  │  Full:    ~500ms  │  (complete page)                     │
│  │  Hydrate: ~200ms  │  (interactive)                       │
│  └──────────────────┘                                       │
│                                                              │
│  Cache result → next visitor gets CDN hit                   │
│  Pre-warm on deploy → even first visitor gets CDN hit       │
└─────────────────────────────────────────────────────────────┘
```

#### Auto-Save (Optimized)

```
┌─────────────────────────────────────────────────────────────┐
│ User edits a component property                              │
│                                                              │
│  1. AppDefinition updated in React state       (~0ms)       │
│  2. Canvas re-renders with new value           (~10-50ms)   │
│  3. UI shows "Saving..." indicator             (~0ms)       │
│  │                                                           │
│  │  ← User perceives change is instant                      │
│  │                                                           │
│  4. Debounce timer (1 second)                               │
│  5. Background API call                        (~100-300ms) │
│  6. DB write                                   (~50-100ms)  │
│  7. IndexedDB cache update                     (~5-10ms)    │
│  8. UI shows "Saved" indicator                              │
│                                                              │
│  User perceived latency: ~0ms (optimistic update)           │
│  Actual persistence: ~1.2-1.4s after edit (debounce + API)  │
└─────────────────────────────────────────────────────────────┘
```

### Performance Monitoring

Track these metrics in production to ensure targets are met:

```typescript
// Key metrics to track

const PERFORMANCE_METRICS = {
  // Design Time
  'editor.load.cached':      { target: '<300ms', p95: true },
  'editor.load.uncached':    { target: '<1000ms', p95: true },
  'editor.save.api':         { target: '<500ms', p95: true },
  'editor.render.canvas':    { target: '<500ms', p95: true },

  // Runtime
  'viewer.ttfb':             { target: '<200ms', p95: true },
  'viewer.fcp':              { target: '<500ms', p95: true },
  'viewer.lcp':              { target: '<1000ms', p95: true },
  'viewer.tti':              { target: '<1000ms', p95: true },
  'viewer.cache_hit_rate':   { target: '>95%',   avg: true },

  // Database
  'db.query.app_metadata':   { target: '<10ms',  p95: true },
  'db.query.app_full':       { target: '<100ms', p95: true },
  'db.query.deployment':     { target: '<50ms',  p95: true },
  'db.write.app_save':       { target: '<200ms', p95: true },

  // Collaboration
  'collab.update.latency':   { target: '<100ms', p95: true },
  'collab.presence.latency': { target: '<200ms', p95: true },
};
```

---

## 19. Local Development Guide

### Overview

Your daily development experience changes minimally. The biggest difference is running one extra process.

### Option A: Supabase Cloud for Dev (Recommended to Start)

```bash
# One-time setup
pnpm install
cp .env.example .env.local    # Add your Supabase project keys

# Daily development
pnpm turbo dev                 # Starts editor (localhost:3000) + API (localhost:3001)
```

| Factor | Before | After |
|---|---|---|
| **Start command** | `npm run start` | `pnpm turbo dev` |
| **RAM usage** | ~200MB | ~400MB (+Next.js dev server) |
| **Startup time** | ~3 seconds | ~5-8 seconds |
| **Internet required** | No (except AI) | Yes (DB calls go to Supabase cloud) |
| **Docker required** | No | No |

### Option B: Supabase Local (Docker, Full Offline)

```bash
# One-time setup
brew install supabase/tap/supabase
pnpm install
supabase init && supabase link --project-ref <your-project-id>

# Daily development
supabase start                 # Starts local PostgreSQL + Auth + Storage + Studio
pnpm turbo dev                 # Starts editor + API

# When done
supabase stop
```

| Factor | Before | After |
|---|---|---|
| **RAM usage** | ~200MB | ~1.5-2GB (Docker containers) |
| **Startup time** | ~3 seconds | ~15 seconds (after first time) |
| **Internet required** | No | No (fully offline) |
| **Docker required** | No | Yes |
| **Bonus** | — | Supabase Studio at localhost:54323 (visual DB browser) |

### Environment Variables

```bash
# .env.local (Option A — cloud)
SUPABASE_URL=https://xxxxx.supabase.co
SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...

# .env.local (Option B — local)
SUPABASE_URL=http://localhost:54321
SUPABASE_ANON_KEY=eyJ...(from supabase start output)
SUPABASE_SERVICE_ROLE_KEY=eyJ...(from supabase start output)
```

Same code, same API — only the URL changes.

### Dev Auth Bypass

Skip login during development:

```typescript
// apps/api/src/lib/middleware/withAuth.ts

export async function withAuth(request: Request) {
  if (process.env.NODE_ENV === 'development' && process.env.DEV_BYPASS_AUTH === 'true') {
    return {
      user: { id: 'dev-user-id', email: 'dev@localhost', fullName: 'Dev User' }
    };
  }
  // Normal auth flow...
}
```

### What Stays the Same

- Editor hot reload (Vite HMR) — identical
- Component development — no backend involvement
- Expression engine — runs client-side
- AI features — Gemini calls stay client-side
- Canvas drag-drop — pure frontend
- Properties panel — pure frontend
- Unit tests — mock API client same as mocking storageService
- E2E tests — same Playwright, just configure API URL

### What Changes

- `pnpm` instead of `npm` (Turborepo works best with pnpm)
- One extra dev server process (Next.js API alongside Vite)
- `.env.local` files required (one-time setup)
- Database migrations when changing schema: `pnpm --filter @procode/database db:migrate`
- Auth login during development (or use DEV_BYPASS_AUTH)

### Common Commands

```bash
pnpm turbo dev                           # Start all apps in development
pnpm turbo build                         # Build all apps and packages
pnpm turbo test                          # Run all tests
pnpm turbo lint                          # Lint all packages
pnpm turbo type-check                    # Type check all packages
pnpm --filter @procode/database db:migrate  # Run database migrations
pnpm --filter @procode/database db:studio   # Open Prisma Studio (DB browser)
supabase start                           # Start local Supabase (Option B)
supabase stop                            # Stop local Supabase
supabase db reset                        # Reset local database to clean state
```

---

## Next Steps

See `11-backend-implementation-phases.md` for the detailed phase-wise implementation plan.
