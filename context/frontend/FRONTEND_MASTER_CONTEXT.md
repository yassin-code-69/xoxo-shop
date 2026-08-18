# Frontend Master Context
## Free Fire Diamond Top-Up Platform

> **Purpose:** This document is the single source of truth for the **frontend application** of the Free Fire Diamond Top-Up Platform.  
> The AI coding agent must read this entire file before creating or modifying frontend code.

---

# 1. Project Overview

We are building a modern, production-ready **Free Fire Diamond Top-Up Platform**.

The product concept is similar to an online game top-up website such as `offertopup.com`, but:

- Do **not** copy its UI.
- Do **not** copy its layout.
- Do **not** copy its branding.
- Do **not** copy its content.
- Use it only as a business-flow reference.
- Our UI/UX must be original, modern, polished, mobile-first, fast, and trustworthy.

The application initially focuses on **Free Fire Diamond Top-Up**.

A customer will:

1. Browse available diamond packages.
2. Select a package.
3. Enter Free Fire UID and any required account information.
4. Choose a payment method.
5. Create an order.
6. Pay manually using bKash, Nagad, or Rocket.
7. Submit transaction information.
8. Wait for admin verification.
9. After payment approval, the backend sends the top-up request to the diamond provider API.
10. Customer can track the order until completion.

Later, automatic payment gateway integration will be added without redesigning the frontend architecture.

---

# 2. Frontend Scope

The frontend has **three major application areas**:

## A. Public Website

For visitors and potential customers.

Includes:

- Home
- Top-Up / Packages
- How It Works
- FAQ
- Support / Contact
- Terms & Conditions
- Privacy Policy
- Login / Register

## B. Customer Application

For authenticated customers.

Includes:

- Customer Dashboard
- My Orders
- Order Details
- Payment Submission
- Payment Status
- Top-Up Status
- Profile
- Authentication / Session Handling

## C. Admin Panel

A complete admin frontend is mandatory.

Includes:

- Admin Dashboard
- Orders
- Order Details
- Manual Payment Verification
- Payments
- Products / Diamond Packages
- Customers
- Payment Methods
- Provider Status / Provider Management UI
- Banners
- Site Settings
- Audit Logs
- Role-aware navigation
- Failed fulfillment retry UI

The Admin Panel is part of the core product, not an optional future feature.

---

# 3. Approved Frontend Tech Stack

Use the following stack.

## Core

- **Next.js**
- **React**
- **TypeScript**
- **Tailwind CSS**
- **shadcn/ui**

## Tooling

- **Bun**
- **Biome**

## Forms & Validation

- **React Hook Form**
- **Zod**

## Server-State / API State

- **TanStack Query**, only where client-side server-state management is actually useful.

Do not use TanStack Query everywhere by default.

Use Next.js Server Components and server-side data patterns where appropriate.

## Icons

- **Lucide React**

## Theme

- `next-themes` only if dark/light theme switching is implemented.

## Optional State Management

Do **not** add Zustand unless a real application-wide client-state requirement appears.

Prefer:

1. Server state
2. URL state
3. Local state
4. React context
5. Zustand only if still necessary

---

# 4. Package Management

Use **Bun** consistently.

Examples:

```bash
bun install
bun add <package>
bun run dev
bun run build
```

Do not mix Bun with npm, pnpm, or Yarn without explicit approval.

Maintain a single lock file.

---

# 5. Code Quality Rules

Use **Biome** for:

- formatting
- linting
- import organization where appropriate

TypeScript must use strict mode.

Avoid:

- `any`
- unsafe type assertions
- duplicated interfaces
- huge React components
- giant page files
- business logic inside UI components
- unnecessary `"use client"`
- scattered fetch calls
- inline duplicated validation schemas
- hardcoded production package data

Prefer:

- small focused components
- typed API contracts
- feature-oriented modules
- shared reusable primitives
- semantic naming
- predictable loading/error/empty states

---

# 6. Architecture Principles

The frontend is responsible for:

- rendering UI
- collecting user input
- authentication UX
- form validation
- navigation
- user feedback
- displaying backend data
- presenting order/payment/provider statuses
- calling backend APIs

The frontend is **not** responsible for deciding:

- final product price
- whether a payment is valid
- whether an order is completed
- whether diamonds should be fulfilled
- whether an admin has permission
- whether provider delivery succeeded
- whether a transaction ID is authentic

Those are backend responsibilities.

Frontend must never become the source of truth for financial or fulfillment state.

---

# 7. Backend Boundary

The frontend communicates with a FastAPI backend.

Base API concept:

```text
/api/v1
```

The frontend must use a centralized API layer.

Do not scatter raw `fetch()` calls throughout components.

Recommended structure:

```text
src/lib/api/
├── client.ts
├── errors.ts
├── types.ts
└── endpoints.ts
```

Feature-specific API functions may live inside feature modules.

Example:

```text
src/features/orders/api/
src/features/products/api/
src/features/payments/api/
```

The centralized API client should handle:

- base URL
- auth token attachment
- JSON parsing
- HTTP errors
- standardized backend error shape
- 401 handling
- abort/cancellation where useful

---

# 8. Authentication

Use **Supabase Auth**.

Initial authentication:

- Email/password

Architecture should remain compatible with future:

- Google login
- OTP
- Phone authentication

Authentication flow:

1. User signs in with Supabase.
2. Frontend receives valid Supabase session.
3. Protected backend requests include the valid access token.
4. FastAPI validates the token.
5. Backend returns authorized application data.

Never manually send a user ID and treat it as authentication.

---

# 9. Roles

Application roles:

- CUSTOMER
- SUPPORT
- ADMIN
- SUPER_ADMIN

Frontend may use roles to:

- show/hide navigation
- show/hide actions
- redirect users
- improve UX

But frontend role checks are **not security enforcement**.

Backend remains authoritative.

---

# 10. Route Architecture

Recommended Next.js App Router structure:

```text
src/app/
├── (public)/
│   ├── page.tsx
│   ├── top-up/
│   ├── how-it-works/
│   ├── faq/
│   ├── support/
│   ├── terms/
│   └── privacy/
│
├── (auth)/
│   ├── login/
│   ├── register/
│   ├── forgot-password/
│   └── reset-password/
│
├── (customer)/
│   ├── dashboard/
│   ├── orders/
│   │   └── [orderId]/
│   ├── payment/
│   │   └── [orderId]/
│   └── profile/
│
├── admin/
│   ├── dashboard/
│   ├── orders/
│   │   └── [orderId]/
│   ├── payments/
│   ├── products/
│   ├── customers/
│   ├── payment-methods/
│   ├── providers/
│   ├── banners/
│   ├── settings/
│   └── audit-logs/
│
├── layout.tsx
├── loading.tsx
├── error.tsx
└── not-found.tsx
```

Exact route naming may evolve, but public/customer/admin separation must remain clear.

---

# 11. Recommended Frontend Folder Structure

```text
apps/web/
├── src/
│   ├── app/
│   │   ├── (public)/
│   │   ├── (auth)/
│   │   ├── (customer)/
│   │   └── admin/
│   │
│   ├── components/
│   │   ├── ui/
│   │   ├── common/
│   │   ├── layout/
│   │   ├── feedback/
│   │   └── data-display/
│   │
│   ├── features/
│   │   ├── auth/
│   │   ├── products/
│   │   ├── topup/
│   │   ├── orders/
│   │   ├── payments/
│   │   ├── profile/
│   │   └── admin/
│   │
│   ├── hooks/
│   ├── lib/
│   │   ├── api/
│   │   ├── auth/
│   │   ├── supabase/
│   │   ├── config/
│   │   ├── constants/
│   │   └── utils/
│   │
│   ├── types/
│   └── styles/
│
├── public/
├── biome.json
├── components.json
├── next.config.ts
├── package.json
└── tsconfig.json
```

---

# 12. Feature Module Structure

Use feature-oriented organization.

Example:

```text
src/features/orders/
├── api/
├── components/
├── hooks/
├── schemas/
├── types/
└── utils/
```

Do not force every feature to contain every folder.

Create only what is needed.

---

# 13. Design System

Build a consistent design system before creating many pages.

Define:

- color tokens
- background colors
- surface colors
- text colors
- border colors
- accent colors
- success colors
- warning colors
- destructive colors
- spacing
- radii
- shadows
- typography scale
- container widths

Use CSS variables / Tailwind-compatible tokens.

Avoid hardcoded random colors in individual components.

---

# 14. UI Direction

The visual style should feel:

- modern
- premium
- gaming-aware
- trustworthy
- clean
- fast
- mobile-first

Avoid:

- cheap neon-heavy gaming UI
- excessive glow
- excessive glassmorphism
- too many gradients
- oversized animation
- visual clutter
- low-contrast text
- unnecessary dashboard charts

The payment experience should feel closer to a modern fintech/e-commerce checkout than a noisy gaming website.

---

# 15. shadcn/ui Usage

Use shadcn/ui as reusable primitives.

Likely components:

- Button
- Card
- Input
- Label
- Select
- Dialog
- Alert Dialog
- Sheet
- Dropdown Menu
- Tabs
- Table
- Badge
- Skeleton
- Toast/Sonner
- Tooltip
- Breadcrumb
- Pagination
- Form-related primitives

Customize these to match the project design system.

Do not leave the application looking like an untouched default shadcn demo.

---

# 16. Responsive Design

Mobile-first is mandatory.

The key mobile flows are:

- package selection
- UID input
- checkout
- manual payment instructions
- transaction submission
- order status tracking

Admin panel must also be usable on tablet and smaller laptop screens.

Admin sidebar should become a drawer/sheet on small screens.

---

# 17. Public Website

## Home Page

Recommended sections:

### Navbar

- Brand logo
- Home
- Top Up
- Orders
- Support
- Login/Profile

### Hero

Primary message around:

**Free Fire Diamond Top-Up**

Primary CTA:

**Top Up Now**

### Popular Packages

Dynamic packages from backend.

### How It Works

1. Select package
2. Enter UID
3. Make payment
4. Receive diamonds

### Why Choose Us

Examples:

- Simple checkout
- Fast processing
- Order tracking
- Trusted support

### FAQ Preview

### Support CTA

### Footer

---

# 18. Product / Top-Up Page

This is a critical conversion page.

Recommended experience:

## Step 1 — Select Package

Show dynamic cards containing:

- package name
- diamond quantity
- bonus if applicable
- selling price
- badge such as Popular if configured

## Step 2 — Enter Player Information

Inputs:

- Free Fire UID
- region/server only if required

Do not invent provider-specific required fields before provider documentation exists.

## Step 3 — Payment Method

Initially:

- bKash
- Nagad
- Rocket

Only enabled methods from backend should appear.

## Step 4 — Order Summary

Show:

- selected package
- UID
- price
- total

## Step 5 — Create Order

Frontend sends:

- product ID
- UID
- required account fields
- payment method

Frontend should **not** send an authoritative price.

---

# 19. Manual Payment UX

After an order is created:

Show:

- Public Order ID
- Payment amount
- Selected payment method
- Merchant/account number
- Payment instructions
- Copy Number button
- Copy Amount button

Form may include:

- Transaction ID
- Sender number
- Payment proof screenshot

CTA:

**Submit Payment**

After submission show:

**Payment submitted and awaiting verification.**

The page should clearly explain the next step.

---

# 20. File Upload UX

Payment proof upload:

- image only
- validate size
- validate extension/MIME client-side
- preview image
- allow remove/replace
- show upload progress if appropriate
- show clear error state

Client validation improves UX only.

Backend/storage rules remain authoritative.

---

# 21. Customer Dashboard

Customer dashboard should be simple.

## Overview

Show:

- total orders
- completed orders
- pending orders

## Recent Orders

Display:

- Order ID
- Package
- Amount
- Payment status
- Top-up status
- Date

## Quick CTA

- Top Up Again

Do not overload the dashboard.

---

# 22. Customer Orders

Support:

- list
- pagination
- status filters if useful
- responsive cards/table
- order detail navigation

Order detail should show a timeline.

Example:

```text
Order Created
↓
Payment Submitted
↓
Payment Verified
↓
Processing Top-Up
↓
Completed
```

Status labels must come from normalized backend values.

---

# 23. Customer Profile

Allow customer to manage safe profile fields such as:

- full name
- phone
- avatar if supported

Authentication-sensitive changes should follow Supabase's secure flow.

---

# 24. Admin Panel Overview

The Admin Panel is a separate application experience inside the same Next.js frontend.

Recommended main route:

```text
/admin
```

Use a dedicated admin layout.

Desktop:

- collapsible sidebar
- top bar
- content area

Mobile/tablet:

- sheet/drawer navigation
- responsive content

---

# 25. Admin Navigation

Initial navigation:

- Dashboard
- Orders
- Payments
- Products
- Customers
- Payment Methods
- Providers
- Banners
- Site Settings
- Audit Logs

Navigation visibility may depend on role.

Example:

SUPPORT may not see:

- provider configuration
- sensitive settings
- role management

---

# 26. Admin Dashboard

Show operational metrics only.

Recommended:

- Orders Today
- Revenue Today
- Pending Payments
- Processing Top-Ups
- Failed Top-Ups
- Completed Today

Operational widgets:

- Recent Orders
- Pending Payment Verification
- Failed Fulfillment Alerts

Avoid decorative charts that provide no operational value.

---

# 27. Admin Orders

Admin Orders page must support:

- search by Order ID
- search by UID
- search by customer where supported
- filter by order status
- filter by payment status
- filter by fulfillment status
- filter by date
- pagination
- responsive table

Possible table columns:

- Order ID
- Customer
- Package
- UID
- Amount
- Payment
- Fulfillment
- Created
- Actions

---

# 28. Admin Order Details

Show clearly separated sections.

## Order

- Public Order ID
- Customer
- Package
- UID
- Price snapshot
- Created date

## Payment

- method
- amount
- transaction ID
- sender number
- screenshot
- payment status

## Fulfillment

- provider
- provider order ID if available
- fulfillment status
- last attempt/error
- retry action if permitted

## Status History

Timeline/table of changes.

## Internal Notes

Only if supported by backend.

---

# 29. Manual Payment Verification UI

This is one of the most important admin workflows.

Pending verification screen should allow quick review of:

- Order ID
- Customer
- Package
- Amount
- Payment method
- Transaction ID
- Sender number
- Screenshot
- Submitted time

Actions:

- Approve
- Reject

Reject requires reason if backend expects it.

Sensitive actions should use confirmation dialogs.

While approving/rejecting:

- disable duplicate submission
- show pending state
- handle backend conflict response
- refresh current record after success

Frontend must not assume approval succeeded until backend confirms it.

---

# 30. Admin Products

Admin can:

- create package
- edit package
- set diamond amount
- set bonus amount if needed
- set selling price
- set provider SKU
- mark featured
- set sort order
- enable/disable

Do not expose provider cost to public/customer UI.

Admin form validation:

- Zod
- React Hook Form

---

# 31. Admin Payment Methods

Admin can configure:

- bKash
- Nagad
- Rocket
- future gateways

Fields may include:

- name
- account number
- account type
- instructions
- active status
- sort order

Frontend should render only fields the backend supports.

Do not invent secret-key management inside ordinary public forms.

---

# 32. Admin Provider UI

Provider page may show:

- provider name
- active/inactive
- connectivity/health status if backend provides it
- supported product mapping
- operational status

Do not display:

- API secret
- full private credentials
- sensitive tokens

Secrets belong outside ordinary UI.

---

# 33. Admin Customers

Admin customer list may show:

- name
- email
- phone
- account status
- total orders
- created date

Customer detail may show:

- profile
- recent orders
- account status

Do not expose unnecessary sensitive auth data.

---

# 34. Banners / Site Content

Admin may manage simple public content such as:

- homepage banners
- announcements
- support details
- selected public text blocks

Avoid turning the MVP into a complex CMS.

---

# 35. Site Settings

Possible settings:

- site title
- logo
- support phone
- WhatsApp
- Facebook
- maintenance message
- payment instructions

Only render settings supported by backend.

---

# 36. Audit Logs

Admin audit screen may support:

- actor
- action
- entity
- timestamp
- metadata/details

Add filters where backend supports them.

Do not allow ordinary admins to modify audit history.

---

# 37. Status Presentation

Create centralized status maps.

Do not hardcode badge labels/colors independently on every page.

Example types:

```ts
type PaymentStatus =
  | "PENDING"
  | "SUBMITTED"
  | "VERIFYING"
  | "VERIFIED"
  | "REJECTED"
  | "FAILED"
  | "REFUNDED";
```

```ts
type FulfillmentStatus =
  | "NOT_STARTED"
  | "QUEUED"
  | "PROCESSING"
  | "COMPLETED"
  | "FAILED"
  | "RETRYING";
```

Use consistent UI mappings for:

- text
- semantic visual state
- icon where useful

---

# 38. Loading States

Every remote-data screen needs proper loading UX.

Use:

- Skeleton
- inline progress
- button loading state

Avoid full-page spinners where skeletons provide better UX.

---

# 39. Empty States

Examples:

- No orders yet
- No pending payments
- No products available
- No audit records

Each empty state should explain what it means and show a relevant CTA where appropriate.

---

# 40. Error States

Handle:

- network failure
- unauthorized
- forbidden
- validation errors
- backend conflict
- not found
- unexpected server failure

Do not display raw stack traces.

Use backend's standardized error message/code when safe.

---

# 41. Toasts / Notifications

Use concise notifications for actions such as:

- payment submitted
- product updated
- payment approved
- payment rejected
- settings saved
- retry requested

Do not rely only on toasts for critical state.

The page should also visibly update.

---

# 42. Form Rules

All forms must have:

- typed schema
- visible labels
- validation messages
- loading state
- disabled duplicate submission
- accessible focus
- backend error handling

Do not trust frontend validation as final validation.

---

# 43. Tables

Admin tables must support the data scale reasonably.

Use:

- server-side pagination where appropriate
- backend filters
- backend search
- sorting only where supported

Do not fetch thousands of records and filter everything in the browser.

---

# 44. URL State

For admin lists, use URL query parameters where useful.

Example:

```text
/admin/orders?payment=SUBMITTED&page=2
```

This makes filters:

- shareable
- refresh-safe
- browser-navigation friendly

---

# 45. SEO

Public routes should implement:

- metadata
- titles
- descriptions
- Open Graph
- semantic headings
- sitemap
- robots

Do not index:

- customer dashboard
- admin panel
- sensitive payment pages

---

# 46. Accessibility

Mandatory:

- semantic HTML
- visible labels
- keyboard accessibility
- focus states
- accessible dialogs
- correct button types
- reasonable contrast
- alt text for meaningful images
- aria attributes when actually needed

---

# 47. Performance

Prioritize:

- Server Components by default
- optimized images
- Next.js Image where appropriate
- code splitting
- lazy-loading noncritical UI
- minimal client JS
- avoiding huge third-party libraries
- avoiding duplicated requests

Use `"use client"` only at interaction boundaries.

---

# 48. Security Rules

Frontend must never contain:

- provider API secret
- payment gateway secret
- Supabase service-role key
- backend private credentials

Only browser-safe public environment variables may use public prefixes.

Do not expose internal server configuration in page source.

---

# 49. Environment Variables

Conceptual frontend environment:

```text
NEXT_PUBLIC_APP_URL=
NEXT_PUBLIC_API_BASE_URL=
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
```

Only public values belong in `NEXT_PUBLIC_*`.

Never place server secrets there.

---

# 50. API Contract Discipline

Do not invent API response structures while implementing real integration.

During UI-first development:

- define mock contracts explicitly
- keep them in typed fixtures
- later replace mock implementations with real API implementations

Do not silently change domain types just to make mock data easier.

---

# 51. Mock Development

Before backend is fully ready, support frontend development using typed mock data.

Mock:

- products
- user
- orders
- payment methods
- dashboard metrics
- admin tables

Mocks must be easy to remove.

Do not mix fake data inside production UI components.

Recommended:

```text
src/mocks/
```

or feature-scoped mock files.

---

# 52. Component Boundaries

Example:

Bad:

`TopUpPage.tsx` containing:

- API calls
- forms
- product cards
- payment logic
- dialogs
- layout
- validation
- status mapping

Good:

```text
TopUpPage
├── PackageSelector
├── PlayerInfoForm
├── PaymentMethodSelector
├── OrderSummary
└── CheckoutActions
```

Page coordinates features; components remain focused.

---

# 53. Shared Components

Potential shared components:

- PageContainer
- SectionHeader
- EmptyState
- ErrorState
- LoadingButton
- StatusBadge
- CurrencyDisplay
- CopyButton
- ConfirmDialog
- DataTable
- Pagination
- PageHeader

Create shared components only after identifying real reuse.

---

# 54. Currency Display

Primary currency:

**BDT / ৳**

Use centralized formatting.

Do not manually concatenate currency symbols throughout pages.

---

# 55. Date/Time Display

Database timestamps are expected to be UTC.

Frontend should format them consistently for users.

Business/customer-facing display may use Bangladesh timezone/configuration when decided.

Centralize date formatting.

---

# 56. Order IDs

Display public order IDs such as:

```text
FF-260817-A7K4P
```

Do not display internal sequential database IDs as the primary customer identifier.

---

# 57. Payment Migration Readiness

Frontend must support both:

## Manual

```text
Order
→ Payment instructions
→ TrxID submission
→ Pending verification
```

## Automatic

```text
Order
→ Gateway payment
→ Callback/status
→ Processing
```

Checkout components should not be tightly hardcoded around manual-only assumptions.

Use payment-method type metadata returned by backend.

---

# 58. Provider Independence

Frontend should never know provider API-specific details.

Frontend deals with normalized domain concepts:

- package
- order
- payment
- fulfillment

Do not make React components depend on a provider's raw response format.

---

# 59. Do Not Build Yet

Do not add without explicit approval:

- wallet
- referral program
- reseller panel
- affiliate system
- coupon system
- loyalty points
- multi-vendor marketplace
- cryptocurrency
- mobile app
- AI features
- complex CMS
- multi-game UI

The database/backend may be future-friendly, but frontend MVP remains focused on Free Fire.

---

# 60. Frontend Definition of Done

Frontend is considered production-ready only when:

- core pages exist
- responsive behavior works
- auth flows work
- protected routes work
- customer dashboard works
- admin panel works
- top-up checkout works
- manual payment flow works
- API layer is centralized
- backend errors are handled
- loading/empty/error states exist
- forms are validated
- status UI is consistent
- security-sensitive data is not exposed
- lint/format/build pass
- core flows are tested

---

# 61. Agent Operating Rules

The AI coding agent must follow these rules:

1. Read this file completely before coding.
2. Treat this file as frontend scope authority.
3. Do not alter the approved stack without explicit approval.
4. Do not invent backend behavior.
5. Do not invent payment provider requirements.
6. Do not invent Free Fire UID rules before provider documentation exists.
7. Keep public, customer, and admin areas clearly separated.
8. Admin Panel is mandatory.
9. Use Server Components by default.
10. Add Client Components only where needed.
11. Use Bun consistently.
12. Use Biome consistently.
13. Use strict TypeScript.
14. Do not use `any` as a shortcut.
15. Centralize API communication.
16. Keep business rules on backend.
17. Do not hardcode production prices or packages.
18. Do not expose secrets.
19. Use typed schemas and contracts.
20. Build mobile-first.
21. Build accessibility into components.
22. Handle loading, empty, error, and success states.
23. Use reusable patterns, but do not overengineer.
24. Do not create unrequested features.
25. Do not change domain status names casually.
26. Complete work phase-by-phase.
27. At the end of each phase, verify build/lint/type correctness before starting the next phase.
28. If a backend endpoint is not ready, use an explicit mock adapter rather than inventing a production API.
29. Keep code easy to hand off to another engineer/agent.
30. Maintain a short implementation note/changelog for significant frontend architecture decisions.

---

# 62. Final Frontend Architecture Summary

```text
PUBLIC WEBSITE
        │
        ├────────────┐
        │            │
        ▼            ▼
SUPABASE AUTH   NEXT.JS FRONTEND
                     │
                     ▼
              CENTRAL API CLIENT
                     │
                     ▼
                FASTAPI API
                     │
       ┌─────────────┼─────────────┐
       ▼             ▼             ▼
   PRODUCTS        ORDERS       PAYMENTS
                                     │
                                     ▼
                               FULFILLMENT
```

Customer and Admin UI both use the same typed frontend API boundary, while authorization and all sensitive decisions remain on the backend.

---

# 63. Single Source of Truth

For frontend implementation, this document is the **single source of truth** unless a newer project instruction explicitly replaces part of it.

Do not hallucinate features, APIs, database fields, provider behavior, or payment behavior that are not defined or approved.
