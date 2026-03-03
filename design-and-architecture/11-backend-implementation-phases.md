# 11 — Backend Implementation Phases

> **Status**: Planning
> **Last Updated**: 2026-03-02
> **Prerequisites**: Read `10-backend-architecture.md` for full architecture context
> **Approach**: Supabase-Centric Stack (Recommended)

---

## Table of Contents

1. [Phase Overview](#phase-overview)
2. [Phase 0: Pre-Setup (Accounts & Tooling)](#phase-0-pre-setup)
3. [Phase 1: Foundation (Auth + Database + CRUD API)](#phase-1-foundation)
4. [Phase 2: Multi-Tenancy (Organizations + Roles + Permissions)](#phase-2-multi-tenancy)
5. [Phase 3: Real-Time Collaboration](#phase-3-real-time-collaboration)
6. [Phase 4: App Hosting Platform](#phase-4-app-hosting-platform)
7. [Phase 5: Billing & Monetization](#phase-5-billing--monetization)
8. [Phase 6: Scale & Optimization](#phase-6-scale--optimization)
9. [Phase Dependencies](#phase-dependencies)
10. [Risk Mitigation](#risk-mitigation)

---

## Phase Overview

```
Phase 0: Pre-Setup              ──→  1-2 days     (accounts, tooling)
Phase 1: Foundation             ──→  2-3 weeks    (auth, DB, CRUD, migration)
Phase 2: Multi-Tenancy          ──→  2-3 weeks    (orgs, roles, RLS)
Phase 3: Real-Time Collaboration──→  3-4 weeks    (Yjs, presence, cursors)
Phase 4: App Hosting            ──→  2-3 weeks    (viewer, deploy, domains)
Phase 5: Billing                ──→  1-2 weeks    (Stripe, plans, webhooks)
Phase 6: Scale                  ──→  Ongoing      (performance, monitoring)

Total estimated: 12-16 weeks (solo developer)
Each phase is independently shippable.

Performance optimizations are built INTO each phase (not deferred):
  Phase 1 includes: IndexedDB cache, metadata-first loading, optimistic saves
  Phase 4 includes: ISR, CDN pre-warming, streaming SSR, code splitting
  Phase 6 adds: partial updates, service workers, monitoring
```

```
Phase 0 ──→ Phase 1 ──→ Phase 2 ──→ Phase 3
                │                       │
                └──→ Phase 4 ◄──────────┘
                         │
                         └──→ Phase 5 ──→ Phase 6
```

---

## Phase 0: Pre-Setup

**Duration**: 1-2 days
**Cost**: $0

### 0.1 Create Accounts

| # | Account | URL | Notes |
|---|---|---|---|
| 1 | **GitHub** (if not already) | github.com | Source code + CI/CD |
| 2 | **Vercel** | vercel.com | Connect to GitHub repo |
| 3 | **Supabase** | supabase.com | Create project (choose nearest region) |

### 0.2 Initialize Monorepo

```
Task: Convert existing project to Turborepo monorepo
├── Install Turborepo
├── Move existing app to apps/editor/
├── Create apps/api/ (Next.js)
├── Create packages/shared-types/
├── Create packages/database/
├── Create packages/auth/
├── Create packages/api-client/
├── Configure turbo.json pipeline
├── Verify existing editor still works
└── Push to GitHub, connect to Vercel
```

**Key files to create:**
- `turbo.json` — Pipeline configuration
- `package.json` — Root workspace config (pnpm workspaces)
- `pnpm-workspace.yaml` — Workspace definitions
- `apps/api/package.json` — Next.js API app
- `packages/*/package.json` — Shared packages

**Verification:**
- [ ] `pnpm install` succeeds from root
- [ ] `pnpm turbo dev` starts both editor and API
- [ ] `pnpm turbo build` builds all packages and apps
- [ ] Existing editor tests still pass
- [ ] Vercel preview deployment works

### 0.3 Setup Supabase Project

```
Task: Configure Supabase project
├── Create new project in Supabase dashboard
├── Note SUPABASE_URL and SUPABASE_ANON_KEY
├── Note SUPABASE_SERVICE_ROLE_KEY (keep secret)
├── Configure auth providers (email/password first)
├── Enable Google OAuth provider
├── Enable GitHub OAuth provider
├── Create .env.local files in apps/api/ and apps/editor/
└── Add environment variables to Vercel
```

### 0.4 Setup Development Tooling

```
Task: Configure local development environment
├── Install Supabase CLI: brew install supabase/tap/supabase
├── Initialize local Supabase: supabase init
├── Link to remote project: supabase link
├── Install Prisma: pnpm --filter @procode/database add prisma @prisma/client
├── Initialize Prisma schema
└── Configure database URL for local development
```

---

## Phase 1: Foundation

**Duration**: 2-3 weeks
**Cost**: $0 (free tier)
**Goal**: Replace localStorage with server-side persistence. Users can sign up, log in, and save/load apps.

### 1.1 Database Schema (Week 1)

```
Task: Create initial database schema
├── Create Prisma schema with core tables:
│   ├── users (synced from Supabase Auth)
│   ├── apps (id, name, slug, definition JSONB, created_by, timestamps)
│   ├── templates (id, name, definition JSONB, is_public, created_by)
│   ├── widget_definitions (id, name, definition JSONB, created_by)
│   ├── presets (id, name, description, icon, components JSONB, is_public, created_by)
│   └── themes (id, name, config JSONB, is_public, created_by)
├── Run first migration: prisma migrate dev
├── Seed development data
└── Verify tables in Supabase dashboard
```

**Initial schema (Phase 1 — simplified, no orgs yet):**

```prisma
// packages/database/prisma/schema.prisma

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

generator client {
  provider = "prisma-client-js"
}

model User {
  id        String   @id @default(uuid()) @db.Uuid
  email     String   @unique
  fullName  String?  @map("full_name")
  avatarUrl String?  @map("avatar_url")
  createdAt DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt DateTime @updatedAt @map("updated_at") @db.Timestamptz

  apps              App[]
  templates         Template[]
  widgetDefinitions WidgetDefinition[]
  presets           Preset[]
  themes            Theme[]

  @@map("users")
}

model App {
  id         String   @id @default(uuid()) @db.Uuid
  name       String
  slug       String
  definition Json     @db.JsonB
  thumbnail  String?
  createdBy  String   @map("created_by") @db.Uuid
  updatedBy  String?  @map("updated_by") @db.Uuid
  createdAt  DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt  DateTime @updatedAt @map("updated_at") @db.Timestamptz

  creator  User         @relation(fields: [createdBy], references: [id])
  versions AppVersion[]

  @@unique([createdBy, slug])
  @@map("apps")
}

model AppVersion {
  id            String   @id @default(uuid()) @db.Uuid
  appId         String   @map("app_id") @db.Uuid
  version       Int
  definition    Json     @db.JsonB
  changeSummary String?  @map("change_summary")
  createdBy     String   @map("created_by") @db.Uuid
  createdAt     DateTime @default(now()) @map("created_at") @db.Timestamptz

  app App @relation(fields: [appId], references: [id], onDelete: Cascade)

  @@unique([appId, version])
  @@map("app_versions")
}

model Template {
  id          String   @id @default(uuid()) @db.Uuid
  name        String
  description String?
  thumbnail   String?
  definition  Json     @db.JsonB
  isPublic    Boolean  @default(false) @map("is_public")
  category    String?
  tags        String[] @default([])
  createdBy   String   @map("created_by") @db.Uuid
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz

  creator User @relation(fields: [createdBy], references: [id])

  @@map("templates")
}

model WidgetDefinition {
  id          String   @id @default(uuid()) @db.Uuid
  name        String
  description String?
  icon        String?
  category    String?
  tags        String[] @default([])
  definition  Json     @db.JsonB
  isPublic    Boolean  @default(false) @map("is_public")
  createdBy   String   @map("created_by") @db.Uuid
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz

  creator User @relation(fields: [createdBy], references: [id])

  @@map("widget_definitions")
}

model Preset {
  id          String   @id @default(uuid()) @db.Uuid
  name        String
  description String?
  icon        String?
  components  Json     @db.JsonB  // TemplateComponent[] tree structure
  isPublic    Boolean  @default(false) @map("is_public")
  category    String?
  tags        String[] @default([])
  createdBy   String   @map("created_by") @db.Uuid
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz

  creator User @relation(fields: [createdBy], references: [id])

  @@map("presets")
}

model Theme {
  id          String   @id @default(uuid()) @db.Uuid
  name        String
  description String?
  config      Json     @db.JsonB
  isPublic    Boolean  @default(false) @map("is_public")
  createdBy   String   @map("created_by") @db.Uuid
  createdAt   DateTime @default(now()) @map("created_at") @db.Timestamptz
  updatedAt   DateTime @updatedAt @map("updated_at") @db.Timestamptz

  creator User @relation(fields: [createdBy], references: [id])

  @@map("themes")
}
```

### 1.2 Auth Integration (Week 1)

```
Task: Implement authentication
├── Create packages/auth/ abstraction layer
│   ├── types.ts (AuthProvider interface)
│   ├── supabase.ts (Supabase Auth implementation)
│   └── index.ts (re-export active provider)
├── Create API middleware
│   ├── withAuth.ts (verify JWT, attach user to request)
│   └── withValidation.ts (Zod schema validation)
├── Create auth API routes in apps/api/
│   ├── POST /api/auth/signup
│   ├── POST /api/auth/signin
│   ├── POST /api/auth/signout
│   ├── GET  /api/auth/session
│   └── POST /api/auth/callback (OAuth callback)
├── Create Supabase Auth trigger (sync user to users table)
│   └── Database function: on auth.users INSERT → INSERT into public.users
├── Add auth UI to editor
│   ├── Login page (email/password + Google + GitHub buttons)
│   ├── Signup page
│   ├── Auth context provider
│   └── Protected route wrapper
└── Verify: Can sign up, sign in, sign out, OAuth with Google/GitHub
```

**Supabase Auth trigger (auto-sync users):**

```sql
-- Run in Supabase SQL Editor
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
```

### 1.3 CRUD API Routes (Week 2)

```
Task: Implement core API endpoints
├── App endpoints
│   ├── GET    /api/apps          (list user's apps — metadata only)
│   ├── POST   /api/apps          (create new app)
│   ├── GET    /api/apps/:id      (get full AppDefinition)
│   ├── PUT    /api/apps/:id      (save/update AppDefinition)
│   ├── DELETE /api/apps/:id      (delete app)
│   ├── POST   /api/apps/:id/duplicate (clone app)
│   └── POST   /api/apps/:id/versions  (create version snapshot)
├── Template endpoints
│   ├── GET    /api/templates     (list templates)
│   ├── POST   /api/templates     (create template)
│   ├── GET    /api/templates/:id (get template)
│   ├── PUT    /api/templates/:id (update template)
│   └── DELETE /api/templates/:id (delete template)
├── Widget endpoints
│   ├── GET    /api/widgets       (list widgets)
│   ├── POST   /api/widgets       (create widget)
│   ├── GET    /api/widgets/:id   (get widget)
│   ├── PUT    /api/widgets/:id   (update widget)
│   └── DELETE /api/widgets/:id   (delete widget)
├── Preset endpoints
│   ├── GET    /api/presets       (list user's custom presets)
│   ├── POST   /api/presets       (save preset from component tree)
│   ├── GET    /api/presets/:id   (get preset)
│   ├── PUT    /api/presets/:id   (update/rename preset)
│   ├── DELETE /api/presets/:id   (delete preset)
│   ├── GET    /api/presets/:id/export   (export single preset as JSON)
│   ├── GET    /api/presets/export       (export all presets)
│   └── POST   /api/presets/import       (import presets with ID remapping)
├── Theme endpoints
│   ├── GET    /api/themes        (list themes)
│   ├── POST   /api/themes        (create theme)
│   ├── PUT    /api/themes/:id    (update theme)
│   └── DELETE /api/themes/:id    (delete theme)
├── Import/Export endpoints
│   ├── GET    /api/export/apps/:id   (export single app as JSON)
│   ├── GET    /api/export/apps       (export all apps)
│   └── POST   /api/import/apps       (import apps with ID remapping)
└── Input validation with Zod schemas on all endpoints
```

**Example API route:**

```typescript
// apps/api/src/app/api/apps/route.ts

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { withAuth } from '@/lib/middleware/withAuth';
import { db } from '@procode/database';

const createAppSchema = z.object({
  name: z.string().min(1).max(100),
  templateId: z.string().uuid().optional(),
});

// GET /api/apps — list user's apps (metadata only)
export async function GET(request: NextRequest) {
  const { user } = await withAuth(request);

  const apps = await db.app.findMany({
    where: { createdBy: user.id },
    select: {
      id: true,
      name: true,
      slug: true,
      thumbnail: true,
      createdAt: true,
      updatedAt: true,
    },
    orderBy: { updatedAt: 'desc' },
  });

  return NextResponse.json(apps);
}

// POST /api/apps — create new app
export async function POST(request: NextRequest) {
  const { user } = await withAuth(request);
  const body = createAppSchema.parse(await request.json());

  let definition = createDefaultAppDefinition(); // Default empty app

  if (body.templateId) {
    const template = await db.template.findUnique({ where: { id: body.templateId } });
    if (template) definition = template.definition;
  }

  const app = await db.app.create({
    data: {
      name: body.name,
      slug: generateSlug(body.name),
      definition,
      createdBy: user.id,
    },
  });

  return NextResponse.json(app, { status: 201 });
}
```

### 1.4 API Client Package (Week 2)

```
Task: Create frontend API client
├── Create packages/api-client/
│   ├── client.ts     (configured fetch wrapper with auth headers)
│   ├── apps.ts       (getApps, getApp, saveApp, createApp, deleteApp, etc.)
│   ├── templates.ts  (CRUD methods)
│   ├── widgets.ts    (CRUD methods)
│   ├── presets.ts    (CRUD + import/export methods)
│   ├── themes.ts     (CRUD methods)
│   └── index.ts      (re-exports)
├── Matches the existing storageService.ts interface
│   so migration is a drop-in replacement
└── Includes error handling, retry logic, token refresh
```

**API Client design (mirrors existing storageService interface):**

```typescript
// packages/api-client/src/apps.ts

import { httpClient } from './client';
import type { AppDefinition, AppMetadata } from '@procode/shared-types';

export const appsApi = {
  async getAllAppsMetadata(): Promise<AppMetadata[]> {
    return httpClient.get('/api/apps');
  },

  async getApp(id: string): Promise<AppDefinition | null> {
    return httpClient.get(`/api/apps/${id}`);
  },

  async saveApp(app: AppDefinition): Promise<AppDefinition> {
    return httpClient.put(`/api/apps/${app.id}`, app);
  },

  async createApp(name: string, templateDefinition?: AppDefinition): Promise<AppDefinition> {
    return httpClient.post('/api/apps', { name, templateDefinition });
  },

  async deleteApp(id: string): Promise<void> {
    return httpClient.delete(`/api/apps/${id}`);
  },

  async duplicateApp(id: string, newName: string): Promise<AppDefinition> {
    return httpClient.post(`/api/apps/${id}/duplicate`, { name: newName });
  },

  // ... matches all existing storageService methods
};
```

### 1.5 Migrate Editor to Use API (Week 3)

```
Task: Replace localStorage with API calls
├── Create storage adapter pattern in editor
│   ├── StorageAdapter interface (matches current storageService)
│   ├── LocalStorageAdapter (existing implementation)
│   ├── ApiStorageAdapter (uses @procode/api-client)
│   └── Toggle based on auth state
│       (logged in → API, not logged in → localStorage)
├── Update Dashboard.tsx to use storage adapter
├── Update Editor.tsx to use storage adapter
├── Update auto-save to debounce API calls
├── Add loading states and error handling
├── Add offline fallback (save to localStorage, sync when online)
└── End-to-end test: sign up → create app → edit → reload → data persists
```

**Migration strategy — gradual, non-breaking:**

```typescript
// apps/editor/src/services/storageAdapter.ts

import { localStorageService } from './storageService';  // existing
import { apiClient } from '@procode/api-client';          // new
import type { AppStorageService } from './storageService';

export function getStorageAdapter(isAuthenticated: boolean): AppStorageService {
  if (isAuthenticated) {
    return apiClient;  // Same interface, different implementation
  }
  return localStorageService;  // Fallback for unauthenticated/offline
}
```

### 1.6 Performance Optimizations — Design Time (Week 3)

```
Task: Implement performance optimizations to ensure <1s design-time load
├── IndexedDB client cache (stale-while-revalidate)
│   ├── Install idb (lightweight IndexedDB wrapper)
│   ├── Cache AppDefinition on every successful load
│   ├── On editor open: show cached version immediately
│   ├── Background sync: fetch latest, update if changed
│   └── Cache invalidation on logout or explicit refresh
├── Metadata-first loading
│   ├── API endpoint: GET /api/apps/:id/metadata (~5KB)
│   │   Returns: name, pages, mainPageId, theme, variables
│   ├── API endpoint: GET /api/apps/:id/pages/:pageId (~50-500KB)
│   │   Returns: components for a single page only
│   ├── Editor loads skeleton → metadata → current page → prefetch rest
│   └── Show usable editor in ~300ms, full load by ~600ms
├── Skeleton UI for editor
│   ├── Render toolbar, sidebar, canvas shell immediately
│   ├── Show loading state in canvas while fetching components
│   └── Progressive reveal as data arrives
├── Optimistic auto-save (non-blocking)
│   ├── UI reflects changes instantly (React state)
│   ├── Background debounced API call (1-second delay)
│   ├── Show "Saving..." / "Saved" / "Error" indicator
│   ├── Update IndexedDB cache after successful save
│   └── Queue failed saves for retry
└── Verify performance targets
    ├── Cached load < 300ms (measure with Performance API)
    ├── First load < 1000ms for apps up to 5MB
    └── Auto-save 0ms perceived latency
```

**Performance target verification script:**

```typescript
// Add to editor for development-mode performance logging
if (process.env.NODE_ENV === 'development') {
  performance.mark('editor-load-start');

  // After app renders:
  performance.mark('editor-load-end');
  performance.measure('editor-load', 'editor-load-start', 'editor-load-end');

  const measure = performance.getEntriesByName('editor-load')[0];
  console.log(`Editor load time: ${measure.duration.toFixed(0)}ms`);

  if (measure.duration > 1000) {
    console.warn('PERF WARNING: Editor load exceeded 1 second target');
  }
}
```

### 1.7 Phase 1 Verification Checklist

> **Performance targets are mandatory** — see Section 18 of `10-backend-architecture.md` for full rationale.

- [ ] User can sign up with email/password
- [ ] User can sign in with Google OAuth
- [ ] User can sign in with GitHub OAuth
- [ ] Dashboard lists apps from database (not localStorage)
- [ ] User can create a new app
- [ ] User can open and edit an app
- [ ] Auto-save persists to database (debounced)
- [ ] User can reload the page and see their saved work
- [ ] User can delete an app
- [ ] User can duplicate an app
- [ ] Templates, widgets, presets, themes are loaded from database
- [ ] User can save, rename, delete, import/export custom presets
- [ ] Import/export still works (JSON format unchanged)
- [ ] Unauthenticated users get localStorage fallback
- [ ] All existing unit tests pass
- [ ] Vercel deployment works
- [ ] **PERF**: Cached editor load (IndexedDB) < 300ms
- [ ] **PERF**: First editor load (no cache, 500KB app) < 1 second
- [ ] **PERF**: First editor load (no cache, 5MB app) < 1 second (metadata-first)
- [ ] **PERF**: Auto-save is non-blocking (0ms perceived latency)
- [ ] **PERF**: Skeleton UI appears within 50ms of navigation

---

## Phase 2: Multi-Tenancy

**Duration**: 2-3 weeks
**Cost**: $0-25/month
**Goal**: Organizations, team management, role-based access control.
**Prerequisite**: Phase 1 complete

### 2.1 Organization Schema Extension (Week 1)

```
Task: Add organization tables
├── Create migration:
│   ├── organizations table
│   ├── organization_members table (user-org-role mapping)
│   ├── Add org_id to apps, templates, widgets, presets, themes
│   ├── Create default "Personal" org for each existing user
│   └── Migrate existing apps to user's personal org
├── Create Row Level Security policies
│   ├── Users see only their orgs
│   ├── Users see only apps in their orgs
│   ├── Editors+ can modify apps
│   ├── Admins+ can manage members
│   └── Owners can delete org
└── Run migration in staging first, then production
```

### 2.2 Organization API (Week 1-2)

```
Task: Implement org management endpoints
├── Organization CRUD
│   ├── GET    /api/orgs          (list user's orgs)
│   ├── POST   /api/orgs          (create org)
│   ├── GET    /api/orgs/:id      (get org details)
│   ├── PUT    /api/orgs/:id      (update org)
│   └── DELETE /api/orgs/:id      (delete org — owner only)
├── Member management
│   ├── GET    /api/orgs/:id/members     (list members)
│   ├── POST   /api/orgs/:id/members     (invite member)
│   ├── PUT    /api/orgs/:id/members/:uid (change role)
│   └── DELETE /api/orgs/:id/members/:uid (remove member)
├── Org context middleware
│   ├── withTenant.ts (resolve org from header/URL)
│   ├── Attach org_id to all queries automatically
│   └── RLS handles data isolation
└── Invitation flow
    ├── Generate invite token
    ├── Send invite email (Resend)
    └── Accept invite endpoint
```

### 2.3 Role-Based Access Control (Week 2)

```
Task: Implement RBAC
├── Role definitions:
│   ├── owner:   Full control, billing, delete org
│   ├── admin:   Manage members, all app operations
│   ├── editor:  Create/edit/delete apps, templates, widgets
│   └── viewer:  Read-only access to apps
├── Permission middleware
│   ├── withRole('admin') — requires role or higher
│   ├── withPermission('apps.write') — granular permission check
│   └── Permissions matrix:
│       │ Action              │ Owner │ Admin │ Editor │ Viewer │
│       │ View apps           │  ✓    │   ✓   │   ✓    │   ✓    │
│       │ Create/edit apps    │  ✓    │   ✓   │   ✓    │   ✗    │
│       │ Delete apps         │  ✓    │   ✓   │   ✓    │   ✗    │
│       │ Manage members      │  ✓    │   ✓   │   ✗    │   ✗    │
│       │ Manage billing      │  ✓    │   ✗   │   ✗    │   ✗    │
│       │ Delete org          │  ✓    │   ✗   │   ✗    │   ✗    │
├── Update all existing API routes to check permissions
└── Add org switcher to editor UI
```

### 2.4 Editor UI Updates (Week 2-3)

```
Task: Add org features to the editor
├── Org switcher in header/sidebar
│   ├── Show current org name
│   ├── Dropdown to switch orgs
│   └── "Create new org" option
├── Members management page
│   ├── List members with roles
│   ├── Invite by email
│   ├── Change member role
│   └── Remove member
├── App sharing within org
│   ├── All org members can see org apps
│   ├── Respect role permissions
│   └── Show who created / last edited
└── Audit log (basic)
    ├── Show recent actions in org
    └── Filter by user, action type
```

### 2.5 Phase 2 Verification Checklist

- [ ] User can create an organization
- [ ] User can invite team members by email
- [ ] Invited user can accept and join org
- [ ] Org owner can change member roles
- [ ] Members see only their org's apps
- [ ] Viewers cannot edit apps (read-only)
- [ ] Editors can create/edit/delete apps
- [ ] Admins can manage members
- [ ] Org switcher works in editor
- [ ] RLS policies prevent cross-org data access
- [ ] All Phase 1 features still work
- [ ] Personal org works for solo users

---

## Phase 3: Real-Time Collaboration

**Duration**: 3-4 weeks
**Cost**: $25-50/month (Supabase Pro for more realtime connections)
**Goal**: Multiple users can edit the same app simultaneously.
**Prerequisite**: Phase 2 complete

### 3.1 Presence System (Week 1)

```
Task: Show who's editing an app
├── Use Supabase Realtime Broadcast channel
│   ├── Channel per app: "app:{appId}"
│   ├── Track: userId, userName, avatarUrl, cursor position, selected component
│   └── Heartbeat: every 5 seconds (remove stale users after 15s)
├── Editor UI: Show avatars of active users
│   ├── Avatar stack in header (overlapping circles)
│   ├── User's name on hover
│   └── Color-coded cursor indicators
├── Component selection highlighting
│   ├── When User A selects a component, show colored border to User B
│   └── Label with user's name on the selection
└── "User X is editing..." banner when same component selected
```

### 3.2 Yjs Integration (Week 2-3)

```
Task: CRDT-based conflict-free editing
├── Install Yjs: pnpm add yjs y-protocols
├── Create Yjs document structure mapping
│   ├── Y.Map for root AppDefinition
│   ├── Y.Array for components[], pages[], variables[]
│   ├── Y.Map for each component (props as Y.Map)
│   ├── Y.Map for theme
│   └── Y.Map for dataStore
├── Create Yjs ↔ AppDefinition sync layer
│   ├── appDefinitionToYDoc(appDef) → Y.Doc
│   ├── yDocToAppDefinition(yDoc) → AppDefinition
│   ├── applyAppDefinitionUpdate(yDoc, changes) → void
│   └── observeYDocChanges(yDoc, callback) → unsubscribe
├── Yjs transport via Supabase Realtime
│   ├── Broadcast Yjs update messages on channel
│   ├── Apply received updates to local Y.Doc
│   ├── Handle connection/disconnection
│   └── Sync initial state on join
├── Persistence: Save Yjs state to database
│   ├── collaboration_sessions table (yjs_state BYTEA)
│   ├── Debounced persistence (every 5 seconds)
│   └── Full snapshot on session end
└── Conflict resolution
    ├── Yjs CRDT handles property-level conflicts automatically
    ├── Component additions: both appear (no conflict)
    ├── Component deletions: propagate to all clients
    └── Same property edit: last-write-wins (character level)
```

### 3.3 Cursor & Selection Sharing (Week 3)

```
Task: Show real-time cursors and selections
├── Track mouse position on canvas
│   ├── Broadcast position via Supabase Realtime
│   ├── Throttle to 50ms (20fps) to avoid flooding
│   └── Show remote cursors as colored arrows with name labels
├── Component selection sharing
│   ├── Broadcast selected component IDs
│   ├── Show colored borders on remotely-selected components
│   └── Prevent conflicting edits (optional: lock component while editing)
├── Properties panel awareness
│   ├── Show "User X is editing this property" indicator
│   └── Auto-merge property changes via Yjs
└── Page navigation awareness
    ├── Show which page each user is on
    └── Page indicator next to user avatar
```

### 3.4 Session Management (Week 3-4)

```
Task: Manage collaboration sessions
├── Session lifecycle
│   ├── First user opens app → create session + load Yjs doc
│   ├── Additional users join → sync from existing session
│   ├── User disconnects → remove from presence, keep session
│   ├── Last user leaves → persist final state, close session
│   └── Reconnection → resync from session state
├── API endpoints
│   ├── POST /api/collab/:appId/join    (join session, get initial state)
│   ├── POST /api/collab/:appId/leave   (leave session)
│   └── GET  /api/collab/:appId/presence (get active users)
├── Edge cases
│   ├── Browser tab close → beforeunload cleanup
│   ├── Network disconnection → auto-reconnect with resync
│   ├── Stale sessions → cleanup after 30 min inactivity
│   └── Large documents → incremental sync (Yjs handles this)
└── Undo/redo in collaborative context
    ├── Yjs UndoManager (per-user undo stack)
    ├── User A's undo doesn't affect User B's changes
    └── Replaces current 50-snapshot undo system
```

### 3.5 Phase 3 Verification Checklist

- [ ] Two users can open the same app simultaneously
- [ ] User avatars appear in the header for all active users
- [ ] Component added by User A appears for User B in real-time
- [ ] Component property change by User A appears for User B
- [ ] Component deletion by User A removes it for User B
- [ ] Cursors are visible to other users
- [ ] Component selection highlighting works across users
- [ ] Undo/redo only affects the current user's changes
- [ ] Disconnection and reconnection recovers state
- [ ] Session cleanup works when all users leave
- [ ] No data loss under any disconnection scenario
- [ ] Performance: <100ms latency for updates

---

## Phase 4: App Hosting Platform

**Duration**: 2-3 weeks
**Cost**: $45-100/month (Vercel Pro for custom domains)
**Goal**: Users can deploy their apps and share live URLs.
**Prerequisite**: Phase 1 complete (can run in parallel with Phase 2-3)

### 4.1 Viewer Application (Week 1)

```
Task: Create apps/viewer/ Next.js app
├── Initialize Next.js app with App Router
├── Dynamic routing: /[orgSlug]/[appSlug]
│   ├── Server-side: load AppDefinition from deployments table
│   ├── Server-side: render initial HTML (SSR)
│   ├── Client-side: hydrate for interactivity
│   └── Client-side: expression engine for dynamic behavior
├── Renderer (shared with editor Preview component)
│   ├── Extract Preview rendering logic to packages/renderer/
│   ├── Server-compatible (no window/document dependencies)
│   ├── Render components from AppDefinition
│   └── Support all 23 component types
├── Runtime state management
│   ├── Component values (input state)
│   ├── Variable state
│   ├── Expression evaluation (safeEval)
│   └── Data queries (REST/static)
└── Error handling
    ├── App not found → 404 page
    ├── App not published → 403 page
    └── Runtime errors → error boundary with user-friendly message
```

### 4.2 Deployment System (Week 2)

```
Task: Implement app deployment flow
├── Deployment API
│   ├── POST /api/apps/:id/deploy
│   │   ├── Create version snapshot
│   │   ├── Create deployment record (frozen AppDefinition)
│   │   ├── Generate subdomain: {appSlug}.{orgSlug}.procode.app
│   │   ├── Purge CDN cache
│   │   └── Return deployment URL
│   ├── GET  /api/apps/:id/deployment (status + URL)
│   ├── PUT  /api/apps/:id/deployment (update settings)
│   └── DELETE /api/apps/:id/deployment (undeploy)
├── Deployment table
│   ├── app_id, version_id, definition (frozen)
│   ├── subdomain, custom_domain
│   ├── status (active | inactive)
│   └── settings (custom CSS, analytics ID, etc.)
├── Editor UI: "Publish" button
│   ├── Shows deployment URL after publish
│   ├── "View live app" link
│   ├── "Unpublish" option
│   └── Version selector (deploy specific version)
└── Caching strategy
    ├── ISR: Regenerate page on re-deploy (revalidateTag)
    ├── CDN caches rendered pages
    └── 5-minute stale-while-revalidate for minor edits
```

### 4.3 Runtime Performance Optimizations (Week 2-3)

```
Task: Ensure deployed apps load in < 1 second
├── ISR (Incremental Static Regeneration)
│   ├── Pre-render app pages at deploy time
│   ├── Cache rendered HTML at Vercel Edge (300+ PoPs)
│   ├── Revalidate only on re-deploy (revalidatePath)
│   └── After first render, all visitors get CDN hit (~100-200ms)
├── CDN cache pre-warming
│   ├── On deploy: trigger synthetic request to pre-render
│   ├── Ensures even the first real visitor gets a cache hit
│   └── async fetch(`https://${subdomain}.procode.app`)
├── Streaming SSR (React 18)
│   ├── Send <head> + shell immediately (~50ms first byte)
│   ├── Stream above-fold components first (~200ms FCP)
│   ├── Stream remaining components progressively
│   └── Selective hydration (interactive at ~700ms)
├── Code splitting for viewer
│   ├── Split component renderers by type (lazy import)
│   ├── Only load JS for component types used in the app
│   ├── Reduces JS bundle from ~500KB to ~100-200KB
│   └── Use next/dynamic for heavy components (Table, List)
├── Image optimization
│   ├── Use next/image for all app images
│   ├── Automatic WebP/AVIF conversion
│   ├── Lazy loading for below-fold images
│   └── CDN-served responsive images
└── Verify performance targets
    ├── CDN-cached load < 300ms (Vercel Analytics)
    ├── Cache-miss FCP < 500ms (streaming SSR)
    ├── Cache-miss TTI < 1000ms
    ├── LCP < 1000ms for complex apps
    └── Cache hit rate > 95% in steady state
```

### 4.5 Custom Domains (Week 3)

```
Task: Support custom domains for deployed apps
├── Vercel custom domain API
│   ├── POST domains to Vercel via API
│   ├── DNS verification flow
│   └── Auto-provision SSL
├── UI in editor
│   ├── "Custom Domain" setting in deployment panel
│   ├── DNS instructions for the user
│   ├── Verification status indicator
│   └── SSL certificate status
├── Routing
│   ├── Middleware: check custom_domain → resolve deployment
│   ├── Fallback: check subdomain → resolve deployment
│   └── Cache domain → deployment mapping
└── Limits by plan
    ├── Free: 1 deployed app, subdomain only
    ├── Pro: 5 deployed apps, 1 custom domain
    ├── Team: Unlimited apps, unlimited domains
    └── Enterprise: Custom limits
```

### 4.6 Phase 4 Verification Checklist

- [ ] User can click "Publish" and get a live URL
- [ ] Deployed app renders correctly (all 23 component types)
- [ ] Expression engine works in deployed apps
- [ ] Interactive components work (inputs, buttons, forms)
- [ ] Multiple pages work with navigation
- [ ] Responsive design works on mobile
- [ ] Custom domain can be configured
- [ ] SSL auto-provisioned for custom domains
- [ ] Re-publish updates the live app
- [ ] Unpublish removes access to the live app
- [ ] SEO metadata renders correctly
- [ ] **PERF**: CDN-cached deployed app loads in < 300ms
- [ ] **PERF**: Cache-miss FCP (streaming SSR) < 500ms
- [ ] **PERF**: Cache-miss TTI < 1 second
- [ ] **PERF**: LCP < 1 second for apps with 100+ components
- [ ] **PERF**: Cache hit rate > 95% after initial pre-warm
- [ ] **PERF**: CDN pre-warm on deploy works (first visitor gets cache hit)
- [ ] **PERF**: JS bundle for viewer < 200KB (code-split by component type)

---

## Phase 5: Billing & Monetization

**Duration**: 1-2 weeks
**Cost**: Stripe processing fees only (2.9% + $0.30 per transaction)
**Goal**: Subscription plans, payment processing, usage limits.
**Prerequisite**: Phase 2 complete

### 5.1 Stripe Integration (Week 1)

```
Task: Set up Stripe billing
├── Create Stripe account (stripe.com)
├── Define products and plans
│   ├── Free:       $0/mo — 3 apps, 1 org, 2 members, 1 deployment
│   ├── Pro:        $19/mo — 20 apps, 3 orgs, 10 members, 5 deployments
│   ├── Team:       $49/mo — Unlimited apps, unlimited orgs, unlimited members
│   └── Enterprise: Custom — SLA, SSO, audit log, dedicated support
├── API endpoints
│   ├── POST /api/billing/create-checkout    (Stripe checkout session)
│   ├── POST /api/billing/portal             (customer portal URL)
│   ├── POST /api/billing/webhook            (Stripe webhook handler)
│   └── GET  /api/billing/subscription       (current plan)
├── Webhook handlers
│   ├── checkout.session.completed → activate subscription
│   ├── customer.subscription.updated → update plan
│   ├── customer.subscription.deleted → downgrade to free
│   └── invoice.payment_failed → notify user
├── Plan enforcement middleware
│   ├── Check limits before: create app, add member, deploy
│   ├── Return 402 with upgrade URL if limit exceeded
│   └── Graceful degradation (don't delete data on downgrade)
└── UI
    ├── Pricing page (public)
    ├── Upgrade button in editor (when hitting limits)
    ├── Billing page in org settings
    └── Customer portal link (Stripe hosted)
```

### 5.2 Usage Tracking (Week 1-2)

```
Task: Track usage for plan enforcement
├── Usage metrics
│   ├── Number of apps per org
│   ├── Number of members per org
│   ├── Number of deployments per org
│   ├── Storage used (files, app definitions)
│   └── API requests (for rate limiting)
├── Enforcement points
│   ├── Create app → check app count vs plan limit
│   ├── Invite member → check member count vs plan limit
│   ├── Deploy app → check deployment count vs plan limit
│   └── Upload file → check storage vs plan limit
├── Soft limits (warning) vs hard limits (block)
│   ├── At 80%: Show warning banner
│   ├── At 100%: Block action with upgrade prompt
│   └── Never delete existing data on downgrade
└── Usage dashboard in org settings
    ├── Visual bars for each limit
    ├── Current usage vs plan limit
    └── "Upgrade" CTA when approaching limits
```

### 5.3 Phase 5 Verification Checklist

- [ ] Stripe checkout flow works (test mode)
- [ ] Subscription activates after payment
- [ ] Plan limits are enforced correctly
- [ ] Upgrade/downgrade transitions work
- [ ] Stripe customer portal accessible
- [ ] Webhook handles payment failure gracefully
- [ ] Usage tracking is accurate
- [ ] Downgrade doesn't delete existing data
- [ ] Free tier works without payment method

---

## Phase 6: Scale & Optimization

**Duration**: Ongoing
**Cost**: Scales with usage
**Goal**: Performance, reliability, and monitoring at scale.
**Prerequisite**: Phases 1-5 stable

### 6.1 Performance Optimization

> **Note**: Core performance optimizations (IndexedDB cache, metadata-first loading, ISR, streaming SSR, optimistic saves) are built into Phase 1 and Phase 4. See `10-backend-architecture.md` Section 18 for full details. This section covers **additional** optimizations for 10K+ users.

```
Task: Optimize for 10K+ users
├── Database
│   ├── Connection pooling (Supabase PgBouncer built-in)
│   ├── Read replicas for dashboard queries
│   ├── JSONB partial updates (instead of full document write)
│   │   ├── Track changed paths in AppDefinition
│   │   ├── Send only delta to API: PATCH /api/apps/:id
│   │   ├── Server applies jsonb_set() for partial updates
│   │   └── Reduces write payload from 5MB to ~1-10KB
│   ├── Materialized views for analytics
│   └── Query optimization (EXPLAIN ANALYZE on slow queries)
├── Caching
│   ├── Vercel Edge Cache for static assets
│   ├── ISR for deployed apps (built in Phase 4)
│   ├── API response caching (stale-while-revalidate headers)
│   ├── Supabase edge functions for hot paths
│   └── Service worker for offline support + background sync
├── CDN
│   ├── Vercel Edge Network (automatic)
│   ├── Image optimization (next/image)
│   └── Static asset compression (brotli)
├── Client-side
│   ├── Code splitting (lazy load editor components)
│   ├── Virtual scrolling for large component trees in palette/explorer
│   └── Web Worker for expression evaluation (offload from main thread)
└── Performance monitoring dashboard
    ├── Track key metrics from 10-backend-architecture.md Section 18
    ├── Automated alerts when P95 exceeds targets
    └── Weekly performance regression reports
```

### 6.2 Monitoring & Observability

```
Task: Set up production monitoring
├── Sentry (error tracking)
│   ├── Capture unhandled exceptions
│   ├── Source maps for readable stack traces
│   ├── Performance monitoring (transaction traces)
│   └── Alert to Slack/email on new errors
├── Vercel Analytics
│   ├── Web vitals (LCP, FID, CLS)
│   ├── Page view analytics
│   └── Serverless function performance
├── Supabase Dashboard
│   ├── Database performance metrics
│   ├── Auth usage stats
│   ├── Storage usage
│   └── Realtime connection count
├── Custom metrics
│   ├── App saves per minute
│   ├── Active collaboration sessions
│   ├── Deployment success/failure rate
│   └── API response time percentiles
└── Alerting
    ├── Error rate spike → Slack alert
    ├── Database connection pool exhaustion → email
    ├── Storage quota approaching → email
    └── Monthly usage report → email digest
```

### 6.3 Security Hardening

```
Task: Production security measures
├── Rate limiting
│   ├── Auth endpoints: 10 requests/minute per IP
│   ├── API endpoints: 100 requests/minute per user
│   ├── File uploads: 10/minute per user
│   └── Use Vercel Edge Middleware (no additional service)
├── Input validation
│   ├── Zod schemas on all API inputs
│   ├── File type validation on uploads
│   ├── AppDefinition size limit (10MB max)
│   └── Expression injection protection
├── Security headers
│   ├── Content-Security-Policy
│   ├── X-Frame-Options
│   ├── X-Content-Type-Options
│   └── Strict-Transport-Security
├── Audit logging
│   ├── All CRUD operations logged
│   ├── Auth events logged
│   ├── Admin actions logged
│   └── 90-day retention (configurable by plan)
└── Compliance
    ├── GDPR: data export, deletion API
    ├── SOC 2: audit log, encryption
    └── Data residency: Supabase region selection
```

### 6.4 Advanced Features (Future)

```
Ideas for post-Phase 6:
├── AI enhancements
│   ├── AI-powered app generation (existing Gemini service)
│   ├── AI code completion in expression editor
│   └── AI-suggested component layouts
├── Marketplace
│   ├── Public template marketplace
│   ├── Widget marketplace (community-built)
│   ├── Preset marketplace (community-built component presets)
│   ├── Theme marketplace
│   └── Revenue sharing for creators
├── Advanced collaboration
│   ├── Comments/annotations on components
│   ├── Version comparison (diff view)
│   ├── Branch/merge (like Git for app designs)
│   └── Design review workflow
├── Analytics for deployed apps
│   ├── Page views, user sessions
│   ├── Form submission tracking
│   ├── Error tracking in deployed apps
│   └── Dashboard for app owners
└── Enterprise features
    ├── SSO (SAML/OIDC)
    ├── Custom branding (white-label)
    ├── Dedicated infrastructure
    ├── SLA guarantees
    └── Priority support
```

---

## Phase Dependencies

```
                    Phase 0: Pre-Setup
                         │
                         ▼
                    Phase 1: Foundation
                    (Auth + DB + CRUD)
                         │
              ┌──────────┼──────────┐
              ▼          ▼          ▼
         Phase 2:   Phase 4:   Phase 5:
         Multi-     App        Billing
         Tenancy    Hosting    (needs Phase 2)
              │          │          │
              ▼          │          │
         Phase 3:        │          │
         Real-Time       │          │
         Collaboration   │          │
              │          │          │
              └──────────┼──────────┘
                         ▼
                    Phase 6: Scale
                    (Ongoing)
```

**Parallel tracks after Phase 1:**
- Phase 2 (Multi-Tenancy) and Phase 4 (App Hosting) can start simultaneously
- Phase 3 (Collaboration) requires Phase 2 (needs org/member context)
- Phase 5 (Billing) requires Phase 2 (billing is per-org)
- Phase 6 (Scale) starts after core features are stable

---

## Risk Mitigation

### Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| **Yjs complexity** (Phase 3) | High | High | Start with presence only (simple). Add CRDT incrementally. Yjs has good docs + community. |
| **Large AppDefinition saves** | Medium | Medium | JSONB partial updates, debounce saves to 2-5 seconds, compress in transit (gzip) |
| **Supabase Realtime limits** | Low | Medium | 200 free connections is enough for early phases. Pro tier adds more. Can switch to dedicated WebSocket server later. |
| **Storage quota** | Low | Low | 1GB is enough for Phase 1-3. Add Cloudflare R2 when needed. |
| **Migration from localStorage** | Medium | High | Keep localStorage as fallback. Gradual migration with feature flag. Never delete local data until confirmed synced. |
| **Auth provider swap** | Low | Medium | Abstraction layer (packages/auth/) designed for swap. Only one file changes. |

### Business Risks

| Risk | Mitigation |
|---|---|
| **Low initial adoption** | Free tier is generous. localStorage fallback means no friction for new users. |
| **Solo developer burnout** | Phase approach — ship Phase 1, get feedback, iterate. Don't build Phase 3-6 until validated. |
| **Supabase pricing changes** | PostgreSQL is portable. Auth is abstracted. Storage is S3-compatible. Can migrate components independently. |
| **Scaling costs** | Revenue should grow with usage. Supabase scales predictably. No surprise bills (set spending limits). |

### Recommended Order for Solo Developer

**If time is limited, focus on this order:**

1. **Phase 0 + Phase 1** — Get backend working. This is the foundation for everything.
2. **Phase 5** (lightweight) — Add Stripe early so you can start charging. Even a simple paywall validates the market.
3. **Phase 2** — Multi-tenancy when you have paying users who need teams.
4. **Phase 4** — App hosting when users ask for it.
5. **Phase 3** — Collaboration is the hardest and most expensive. Build it when there's demand.
6. **Phase 6** — Scale when you need to.

**Golden rule: Ship Phase 1, get 10 paying users, then decide what to build next based on their feedback.**
