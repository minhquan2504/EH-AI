# Architecture Overview

> Technical deep-dive into the EHealth frontend architecture.

## Table of Contents

- [System Overview](#system-overview)
- [Frontend Architecture](#frontend-architecture)
- [Routing Strategy](#routing-strategy)
- [State & Data Flow](#state--data-flow)
- [Authentication & Authorization](#authentication--authorization)
- [API Integration Layer](#api-integration-layer)
- [Design System](#design-system)

---

## System Overview

EHealth is a multi-portal healthcare management system. The frontend is a **single Next.js 14 application** serving four distinct user interfaces through role-based routing.

```
┌─────────────────────────────────────────────────────────┐
│                    Next.js 14 App                       │
│                                                         │
│  ┌──────────┐  ┌──────────┐  ┌───────────┐  ┌────────┐ │
│  │  Admin   │  │  Doctor  │  │Pharmacist │  │Recep-  │ │
│  │  Portal  │  │  Portal  │  │  Portal   │  │tionist │ │
│  │ /admin/* │  │/portal/  │  │ /portal/  │  │/portal/│ │
│  │          │  │doctor/*  │  │pharmacist/│  │recep-  │ │
│  │          │  │          │  │    *      │  │tionist/│ │
│  └────┬─────┘  └────┬─────┘  └─────┬─────┘  └───┬────┘ │
│       │              │              │             │      │
│  ┌────┴──────────────┴──────────────┴─────────────┴────┐ │
│  │              Shared Service Layer                    │ │
│  │         (services/ + api/endpoints.ts)               │ │
│  └─────────────────────┬───────────────────────────────┘ │
│                        │ Axios                           │
└────────────────────────┼─────────────────────────────────┘
                         ▼
                  ┌──────────────┐
                  │  Backend API │
                  └──────────────┘
```

---

## Frontend Architecture

### Constants-Driven Design

A key architectural decision: **zero hard-coded strings**. All magic values are centralized:

| File | Contains |
|------|----------|
| `constants/routes.ts` | All route paths + sidebar menu items |
| `constants/roles.ts` | User role enum values |
| `constants/status.ts` | Status values (appointment, prescription, etc.) |
| `constants/api.ts` | API configuration |
| `constants/ui-text.ts` | All Vietnamese UI strings |
| `api/endpoints.ts` | All API endpoint URLs |

This approach enables:
- **Single source of truth** — change a route in one place, it updates everywhere
- **Type safety** — `as const` assertions provide literal types
- **Easy i18n** — all UI text already externalized

### Feature-Based Modules

Domain logic is organized by feature rather than by technical layer:

```
features/
├── appointments/
│   ├── components/    # Appointment-specific UI
│   └── types/         # Appointment TypeScript interfaces
├── prescriptions/
│   ├── components/
│   └── types/
├── patients/
│   ├── components/
│   └── types/
└── ...
```

Each feature module is self-contained and can be developed independently.

---

## Routing Strategy

Built on **Next.js App Router** with file-based routing:

```
app/
├── layout.tsx              # Root layout (fonts, icons, global providers)
├── page.tsx                # "/" → redirects to /login
├── login/page.tsx          # Public login page
├── admin/
│   ├── layout.tsx          # Admin layout (sidebar + header)
│   ├── page.tsx            # Admin dashboard
│   ├── users/page.tsx
│   ├── doctors/page.tsx
│   └── ...
└── portal/
    ├── doctor/
    │   ├── layout.tsx      # Doctor layout
    │   ├── page.tsx        # Doctor dashboard
    │   └── examination/page.tsx
    ├── pharmacist/
    │   ├── layout.tsx      # Pharmacist layout
    │   └── ...
    └── receptionist/
        ├── layout.tsx      # Receptionist layout
        └── ...
```

### Layout Composition Pattern

Each role gets a dedicated layout with its own sidebar and header:

```
┌──────────────────────────────────────┐
│  Sidebar (w-64)  │  Header           │
│                  │  ──────────────── │
│  Logo            │                   │
│  Navigation      │  Page Content     │
│  User Profile    │  (scrollable)     │
│                  │                   │
└──────────────────────────────────────┘
```

Sidebar components: `admin-sidebar.tsx`, `doctor-sidebar.tsx`, `pharmacist-sidebar.tsx`, `receptionist-sidebar.tsx`

---

## State & Data Flow

### Current Approach

| Layer | Technology | Usage |
|-------|-----------|-------|
| **Server State** | Service Layer (Axios) | API calls via `src/services/` |
| **Client State** | React Context | Auth state, theme |
| **URL State** | Next.js App Router | Page navigation, query params |

### Service Layer

All API interactions are abstracted into service files:

```
services/
├── authService.ts          # Login, logout, token management
├── userService.ts          # User CRUD operations
├── appointmentService.ts   # Appointment management
├── departmentService.ts    # Department/specialty operations
├── medicineService.ts      # Drug catalog queries
└── index.ts                # Re-exports
```

Each service imports endpoints from `api/endpoints.ts` and uses the shared Axios instance.

---

## Authentication & Authorization

### Auth Flow

```
Login Page → authService.login() → Store token → Redirect by role
                                                      │
                                      ┌───────────────┼───────────────┐
                                      ▼               ▼               ▼
                                   /admin         /portal/doctor   /portal/...
```

### Route Guards

- **AuthGuard** (`components/shared/auth-guard.tsx`) — verifies user is logged in
- **RoleGuard** — verifies user has the required role for the current portal

Guards wrap layout components to enforce access control at the routing level.

---

## API Integration Layer

### Endpoint Management

All backend URLs are centralized in `src/api/endpoints.ts`:

```typescript
// Grouped by domain
AUTH_ENDPOINTS    // /auth/login, /auth/logout, /auth/me
USER_ENDPOINTS    // /users, /users/:id
DOCTOR_ENDPOINTS  // /doctors, /doctors/:id
PATIENT_ENDPOINTS // /patients, /patients/:id
// ... 8+ endpoint groups
```

### Request Pipeline

```
Component → Service → Axios Instance → Backend API
                          │
                     Interceptors:
                     • Auth token injection
                     • Error response mapping
                     • Token refresh handling
```

---

## Design System

### Color Tokens

All colors are defined as CSS custom properties and mapped to Tailwind utilities:

| Token | Value | Usage |
|-------|-------|-------|
| `primary` | `#3C81C6` | Buttons, links, accent |
| `secondary` | `#C6E7FF` | Light backgrounds |
| `success` | `#D2F7E1` | Success states |
| `warning` | `#FFF3CC` | Warning alerts |
| `error` | `#FA707A` | Error states |
| `gray` | `#687582` | Secondary text |

### Theming

- Light/dark mode via CSS variables + Tailwind `dark:` variants
- Background, surface, and border colors adapt per theme
- Components use semantic tokens (`bg-primary`) — never raw hex values

### Typography

- **Primary font**: Inter (Google Fonts)
- **Icons**: Google Material Symbols Outlined (loaded via CDN)
