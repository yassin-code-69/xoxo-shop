# Frontend Implementation Phase Plan
## Free Fire Diamond Top-Up Platform

> This file defines the required frontend implementation sequence.  
> The AI coding agent must work **phase-by-phase** and must not skip ahead into unrelated future features.

---

# Execution Rules

Before starting any phase:

1. Read `FRONTEND_MASTER_CONTEXT.md`.
2. Read the current phase completely.
3. Inspect existing code before changing it.
4. Do not replace completed architecture unless there is a real defect.
5. Do not implement unapproved features.
6. Do not invent backend endpoints.
7. If backend is unavailable, use typed mock adapters.
8. Keep code production-oriented.
9. Run formatting/lint/type/build checks at the end of each phase.
10. Fix current-phase regressions before moving forward.

Each phase should end with:

- completed tasks
- files created/changed
- remaining known issues
- verification result

---

# Phase 0 — Repository & Frontend Foundation

## Goal

Create a clean, stable frontend workspace before feature development.

## Tasks

### 0.1 Project Initialization

Set up:

- Next.js
- React
- TypeScript
- App Router
- Tailwind CSS
- Bun

### 0.2 Tooling

Install/configure:

- Biome
- shadcn/ui
- Lucide React
- React Hook Form
- Zod
- TanStack Query if needed by the planned architecture

### 0.3 TypeScript

Enable strict TypeScript.

Avoid relaxed compiler settings.

### 0.4 Base Folder Structure

Create:

```text
src/app
src/components
src/features
src/hooks
src/lib
src/types
src/styles
```

Add feature/module folders only as needed.

### 0.5 Environment

Create `.env.example`.

Include only frontend-required variables.

### 0.6 Scripts

Ensure Bun scripts exist for:

- dev
- build
- start
- lint/check
- format if needed

### 0.7 Verification

Confirm:

- dev server starts
- production build passes
- Biome passes
- TypeScript passes

## Deliverable

A clean frontend base with no product-specific UI yet.

---

# Phase 1 — Design System & Global UI Foundation

## Goal

Create the visual foundation before building pages.

## Tasks

### 1.1 Design Tokens

Define:

- background
- foreground
- surface
- border
- muted
- primary
- accent
- success
- warning
- destructive
- typography
- radius
- spacing
- shadow strategy

### 1.2 Typography

Define:

- heading hierarchy
- body
- labels
- captions
- numeric emphasis

### 1.3 Core Layout Components

Build:

- PageContainer
- SectionContainer
- PageHeader
- SectionHeader
- AppLogo / BrandMark wrapper
- PublicNavbar
- PublicFooter

### 1.4 Core Feedback Components

Build reusable:

- LoadingButton
- EmptyState
- ErrorState
- StatusBadge
- CopyButton
- ConfirmDialog

### 1.5 Form Foundation

Standardize:

- input spacing
- labels
- help text
- validation messages
- disabled state
- loading state

### 1.6 Responsive Foundation

Define breakpoint behavior.

### 1.7 Accessibility Check

Verify:

- focus states
- keyboard navigation
- button semantics
- input labels

## Deliverable

A reusable design system and shared UI foundation.

---

# Phase 2 — App Shells & Route Structure

## Goal

Create the routing/layout skeleton for all frontend application areas.

## Tasks

### 2.1 Public Route Group

Create:

- Home
- Top-Up placeholder
- How It Works
- FAQ
- Support
- Terms
- Privacy

### 2.2 Authentication Route Group

Create placeholders/layout for:

- Login
- Register
- Forgot Password
- Reset Password

### 2.3 Customer Route Group

Create protected-area shell for:

- Dashboard
- Orders
- Order Detail
- Payment
- Profile

### 2.4 Admin Route Group

Create:

```text
/admin/dashboard
/admin/orders
/admin/payments
/admin/products
/admin/customers
/admin/payment-methods
/admin/providers
/admin/banners
/admin/settings
/admin/audit-logs
```

### 2.5 Admin Layout

Build:

- sidebar
- topbar
- mobile drawer
- content area
- breadcrumb/page title pattern

### 2.6 Route Metadata

Configure reasonable page metadata.

## Deliverable

All major routes exist with correct layouts and navigation structure.

---

# Phase 3 — Supabase Authentication

## Goal

Implement real frontend authentication foundations.

## Tasks

### 3.1 Supabase Client

Create browser/server-safe Supabase utilities according to Next.js architecture.

### 3.2 Login

Build:

- email
- password
- validation
- loading state
- error handling

### 3.3 Registration

Build:

- name if supported
- email
- password
- confirm password
- validation

### 3.4 Forgot Password

Implement secure flow.

### 3.5 Reset Password

Implement secure reset UX.

### 3.6 Session Handling

Handle:

- session loading
- signed in
- signed out
- expired session

### 3.7 Protected Customer Routes

Prevent unauthenticated access.

### 3.8 Role-Aware Admin Access

Frontend should redirect users who are clearly not admins/support.

Backend still remains authoritative.

### 3.9 Logout

Implement proper logout.

## Deliverable

Stable authentication and protected route UX.

---

# Phase 4 — API Layer & Typed Contracts

## Goal

Create the frontend-backend boundary before real business pages depend on it.

## Tasks

### 4.1 API Client

Create centralized client handling:

- base URL
- token
- JSON
- standard errors
- unauthorized responses

### 4.2 Error Model

Create typed backend error model.

### 4.3 Domain Types

Create types for:

- User/Profile
- Product
- Game
- Order
- Payment
- PaymentMethod
- Fulfillment
- Dashboard metrics
- Admin data

### 4.4 Status Types

Centralize:

- order status
- payment status
- fulfillment status

### 4.5 Feature API Modules

Prepare:

- products
- orders
- payments
- profile
- admin

### 4.6 Mock Adapter

If backend is not ready:

- create typed fixtures
- create mock service layer
- do not insert mock data directly into components

### 4.7 Query Key Strategy

If TanStack Query is used, define stable query keys.

## Deliverable

Frontend can switch from mocks to real FastAPI without rewriting page components.

---

# Phase 5 — Public Home Page

## Goal

Build the main marketing/conversion page.

## Tasks

### 5.1 Navbar

Implement responsive public navigation.

### 5.2 Hero

Include:

- strong Free Fire top-up value proposition
- primary CTA
- secondary support CTA if needed

### 5.3 Popular Packages

Use dynamic product data or mock adapter.

### 5.4 How It Works

Show the four-step top-up process.

### 5.5 Why Choose Us

Create concise trust-oriented blocks.

### 5.6 FAQ Preview

Use reusable FAQ components.

### 5.7 Support CTA

Provide route to support/contact.

### 5.8 Footer

Include relevant links.

### 5.9 Mobile Polish

Verify hero, cards, CTA, spacing.

## Deliverable

Complete responsive home page.

---

# Phase 6 — Public Supporting Pages

## Goal

Complete public information pages.

## Tasks

### 6.1 How It Works

Explain top-up process.

### 6.2 FAQ

Create categorized or simple FAQ list.

### 6.3 Support

Provide:

- phone
- WhatsApp
- social links
- support instructions

Only use backend/configured values where appropriate.

### 6.4 Terms

Create page structure.

Do not invent legal promises.

Use approved legal content when provided.

### 6.5 Privacy

Create page structure.

Do not invent policy commitments beyond approved text.

### 6.6 SEO

Add metadata to all public pages.

## Deliverable

Complete public information layer.

---

# Phase 7 — Product Catalog / Package Selection

## Goal

Build reusable package browsing and selection.

## Tasks

### 7.1 Product Fetching

Load active Free Fire top-up products.

### 7.2 Package Card

Show:

- name
- diamonds
- bonus if present
- price
- featured state

### 7.3 Selection State

Allow one package selection.

### 7.4 Loading State

Use skeleton grid.

### 7.5 Empty State

Handle no available products.

### 7.6 Error State

Handle product API failure.

### 7.7 Responsive Grid

Optimize for mobile.

## Deliverable

A complete package selection experience.

---

# Phase 8 — Top-Up Checkout Flow

## Goal

Build the main order creation flow.

## Tasks

### 8.1 Checkout Architecture

Break into steps/components:

- PackageSelector
- PlayerInfoForm
- PaymentMethodSelector
- OrderSummary
- CheckoutActions

### 8.2 UID Form

Add:

- UID field
- helper text
- server/region only if backend/provider requires it

Do not hardcode unverified provider rules.

### 8.3 Payment Methods

Load enabled payment methods.

Initially support display for:

- bKash
- Nagad
- Rocket

### 8.4 Order Summary

Show:

- selected package
- UID
- current displayed total
- payment method

Displayed price is informative; backend remains authoritative.

### 8.5 Order Creation

Submit only approved order fields.

Do not send trusted/final price as authority.

### 8.6 Duplicate Submission Protection

Disable/restrict repeated creation while request is pending.

### 8.7 Backend Validation Errors

Map API errors into useful UI.

### 8.8 Successful Order Redirect

Redirect to manual payment page or gateway flow according to backend response.

## Deliverable

Customer can create an order safely.

---

# Phase 9 — Manual Payment Submission

## Goal

Complete the MVP payment UX.

## Tasks

### 9.1 Payment Instruction Page

Display:

- Order ID
- Amount
- Method
- Account number
- Account type
- Instructions

### 9.2 Utility Buttons

Build:

- Copy Number
- Copy Amount

### 9.3 Manual Payment Form

Fields:

- Transaction ID
- Sender number if required
- Screenshot if supported

### 9.4 Screenshot UX

Support:

- image validation
- preview
- remove
- replacement
- upload/error state

### 9.5 Submission

Call correct backend API.

### 9.6 Success State

Display:

**Payment submitted and awaiting verification.**

### 9.7 Already Submitted State

Handle repeat visit gracefully.

### 9.8 Rejected State

If backend allows resubmission, show the approved resubmission UX.

Do not invent workflow.

## Deliverable

Manual bKash/Nagad/Rocket submission flow is complete.

---

# Phase 10 — Customer Dashboard

## Goal

Create a useful post-login customer area.

## Tasks

### 10.1 Overview Cards

Show:

- Total Orders
- Completed
- Pending

### 10.2 Recent Orders

Responsive display.

### 10.3 Quick Top-Up CTA

Provide clear path back to top-up.

### 10.4 Loading / Error / Empty

Implement all states.

### 10.5 Mobile UX

Optimize cards and tables.

## Deliverable

Customer dashboard is complete.

---

# Phase 11 — Customer Orders & Tracking

## Goal

Allow customers to understand every order clearly.

## Tasks

### 11.1 Order List

Show:

- Order ID
- Package
- Amount
- Payment Status
- Fulfillment Status
- Date

### 11.2 Pagination

Use backend pagination if available.

### 11.3 Order Details

Show:

- order data
- UID
- package
- amount
- payment details
- current statuses

### 11.4 Timeline

Build normalized order timeline.

### 11.5 Status Badges

Use centralized status mapping.

### 11.6 Rejected/Failed Messaging

Show appropriate actionable message based on backend state.

### 11.7 Top Up Again

Provide convenient repeat-navigation, but do not auto-create an order.

## Deliverable

Complete customer order tracking experience.

---

# Phase 12 — Customer Profile

## Goal

Complete basic customer account UX.

## Tasks

### 12.1 Profile View

Show allowed profile data.

### 12.2 Edit Profile

Support backend-approved editable fields.

### 12.3 Avatar

Only if storage/backend supports it.

### 12.4 Account/Auth Actions

Use secure Supabase flows for auth-sensitive changes.

## Deliverable

Functional customer profile page.

---

# Phase 13 — Admin Panel Foundation

## Goal

Turn the admin shell into a production-grade operational interface.

## Tasks

### 13.1 Role-Aware Navigation

Support:

- SUPPORT
- ADMIN
- SUPER_ADMIN

### 13.2 Admin Shared Components

Create:

- AdminPageHeader
- AdminStatCard
- AdminDataTable
- AdminFilterBar
- AdminPagination
- AdminEmptyState
- AdminErrorState

### 13.3 Responsive Sidebar

Desktop + mobile behavior.

### 13.4 Admin API Boundary

Ensure all admin requests use centralized authorized API.

### 13.5 Access Errors

Handle:

- 401
- 403

correctly.

## Deliverable

Reusable admin foundation ready for modules.

---

# Phase 14 — Admin Dashboard

## Goal

Provide real operational visibility.

## Tasks

### 14.1 Metrics

Show backend-provided:

- Orders Today
- Revenue Today
- Pending Payments
- Processing Top-Ups
- Failed Top-Ups
- Completed Today

### 14.2 Recent Orders

Show latest orders.

### 14.3 Pending Verification

Surface urgent pending manual payments.

### 14.4 Failed Fulfillment Alerts

Surface retry-required orders.

### 14.5 Loading / Error

Handle every card/module.

### 14.6 No Decorative Analytics

Do not add charts unless backend data and business value justify them.

## Deliverable

Operational admin dashboard.

---

# Phase 15 — Admin Orders

## Goal

Build complete admin order management.

## Tasks

### 15.1 Orders Table

Columns:

- Order ID
- Customer
- Package
- UID
- Amount
- Payment
- Fulfillment
- Created
- Action

### 15.2 Search

Support backend-approved search fields.

Likely:

- order ID
- UID

### 15.3 Filters

Support:

- order status
- payment status
- fulfillment status
- date

### 15.4 URL Query State

Persist filters/page in URL.

### 15.5 Pagination

Use backend pagination.

### 15.6 Order Details

Create full admin order page.

### 15.7 Status History

Render history.

## Deliverable

Admin can efficiently inspect all orders.

---

# Phase 16 — Admin Manual Payment Verification

## Goal

Build the critical manual payment review workflow.

## Tasks

### 16.1 Pending Payments List

Optimize for rapid review.

### 16.2 Payment Detail

Show:

- order ID
- customer
- package
- amount
- payment method
- transaction ID
- sender number
- screenshot
- submitted time

### 16.3 Screenshot Viewer

Provide safe preview/modal.

### 16.4 Approve Action

Use:

- confirm dialog
- pending state
- duplicate-click protection

### 16.5 Reject Action

Use:

- reject dialog
- reason field if backend requires

### 16.6 Conflict Handling

If another admin already acted:

- handle backend conflict
- refresh state
- show clear message

### 16.7 Post-Action Refresh

Update:

- current payment
- order
- admin metrics where relevant

## Deliverable

Admin can safely approve/reject manual payments.

---

# Phase 17 — Admin Product Management

## Goal

Allow admins to manage diamond packages.

## Tasks

### 17.1 Product List

Show:

- name
- diamonds
- price
- provider SKU
- active
- featured
- sort order

### 17.2 Create Product

React Hook Form + Zod.

### 17.3 Edit Product

Use same form architecture where possible.

### 17.4 Enable/Disable

Use safe action UI.

### 17.5 Featured

Allow backend-supported toggle.

### 17.6 Sorting

Support sort order field.

### 17.7 Validation Errors

Show backend errors clearly.

## Deliverable

Complete package management frontend.

---

# Phase 18 — Admin Customers

## Goal

Provide basic customer management visibility.

## Tasks

### 18.1 Customer List

Show backend-approved fields.

### 18.2 Search

Use backend support.

### 18.3 Customer Detail

Show:

- profile
- account status
- order summary
- recent orders

### 18.4 Account Status Actions

Only if backend supports them.

Do not invent moderation tools.

## Deliverable

Admin customer module.

---

# Phase 19 — Admin Payment Methods

## Goal

Allow admins to control payment options.

## Tasks

### 19.1 List Methods

bKash, Nagad, Rocket, future gateway entries.

### 19.2 Edit Method

Fields may include:

- name
- account number
- type
- instructions
- active
- sort order

### 19.3 Enable/Disable

Support immediate operational control.

### 19.4 Safe Rendering

Do not expose secret payment credentials.

## Deliverable

Operational payment method management.

---

# Phase 20 — Admin Provider UI

## Goal

Provide safe operational provider visibility.

## Tasks

### 20.1 Provider Overview

Show:

- name
- active state
- connection/health if backend provides it

### 20.2 Product Mapping

Show provider SKU mapping where approved.

### 20.3 Provider Status

Show normalized service status.

### 20.4 Security

Never render secret API keys.

## Deliverable

Safe provider operations UI.

---

# Phase 21 — Admin Fulfillment Retry

## Goal

Allow authorized admins to recover failed top-ups.

## Tasks

### 21.1 Failed Orders

Filter/show fulfillment failures.

### 21.2 Error Information

Display sanitized backend error.

### 21.3 Retry Action

Use explicit confirm dialog.

### 21.4 Pending State

Prevent duplicate retry clicks.

### 21.5 Updated State

Refresh fulfillment status after backend response.

### 21.6 Permission

Only show retry when backend/user role permits it.

## Deliverable

Safe fulfillment recovery workflow.

---

# Phase 22 — Admin Banners & Site Settings

## Goal

Add lightweight site administration without building a full CMS.

## Tasks

### 22.1 Banners

Support backend-defined fields.

Likely:

- image
- title
- link
- active
- sort order

### 22.2 Public Settings

Manage supported:

- site title
- logo
- support phone
- WhatsApp
- Facebook
- announcement
- payment instructions

### 22.3 Validation

Use typed forms.

### 22.4 Preview

Use only where simple and useful.

## Deliverable

Basic site content management.

---

# Phase 23 — Admin Audit Logs

## Goal

Make privileged actions auditable in the UI.

## Tasks

### 23.1 Audit Table

Show:

- actor
- action
- entity
- date/time

### 23.2 Filters

Use backend-supported filters.

### 23.3 Detail View

Show safe metadata.

### 23.4 Read-Only

Do not provide edit/delete.

## Deliverable

Read-only audit visibility.

---

# Phase 24 — Global Status, Error & Feedback Hardening

## Goal

Make the entire frontend behave consistently under real conditions.

## Tasks

### 24.1 Status Mapping

Centralize all order/payment/fulfillment labels.

### 24.2 Unauthorized

Standardize 401 behavior.

### 24.3 Forbidden

Standardize 403 behavior.

### 24.4 Not Found

Handle missing resources.

### 24.5 Network Errors

Provide retry where appropriate.

### 24.6 Backend Conflicts

Handle duplicate/invalid transition responses.

### 24.7 Toast Strategy

Standardize success/failure notifications.

### 24.8 Skeleton Strategy

Standardize loading screens.

## Deliverable

Consistent UX across all modules.

---

# Phase 25 — Automatic Payment Frontend Readiness

## Goal

Prepare checkout UI so automatic gateways can be added without rewriting manual payment.

## Important

Do not implement real gateway integration unless backend/gateway phase is approved.

## Tasks

### 25.1 Payment Method Types

Support normalized types such as:

- MANUAL
- GATEWAY

### 25.2 Checkout Branching

Allow backend response to direct flow.

### 25.3 Gateway Pending Page

Prepare generic UI for:

- payment initiated
- waiting
- redirecting
- verifying
- success
- failed

### 25.4 Return/Callback UX

Frontend should show verification status, not declare success based only on redirect parameters.

## Deliverable

Manual and future automatic methods can coexist cleanly.

---

# Phase 26 — SEO, Accessibility & Performance Pass

## Goal

Polish the product before release.

## Tasks

### 26.1 SEO

Public pages:

- metadata
- OG tags
- sitemap
- robots
- canonical strategy if needed

### 26.2 Noindex

Ensure sensitive/private routes are not indexed.

### 26.3 Accessibility

Audit:

- forms
- tables
- dialogs
- keyboard
- focus
- contrast

### 26.4 Performance

Review:

- client components
- image sizes
- bundle
- unnecessary libraries
- duplicate requests
- hydration cost

### 26.5 Mobile Audit

Review all critical flows on narrow screens.

## Deliverable

Release-quality UX foundation.

---

# Phase 27 — Frontend Testing

## Goal

Protect the critical business flows.

## Tasks

### 27.1 Unit/Component Tests

Prioritize logic-heavy or critical shared components.

### 27.2 Integration Tests

Cover:

- auth form behavior
- top-up validation
- payment submission
- status rendering
- admin forms

### 27.3 E2E Critical Flows

Recommended:

#### Customer

1. Register/Login
2. Select package
3. Enter UID
4. Create order
5. Submit manual payment
6. View order status

#### Admin

1. Login
2. Open pending payment
3. Review
4. Approve
5. Confirm order state refresh

### 27.4 Authorization UX

Test customer cannot access admin UI.

Backend enforcement must also be tested separately by backend project.

## Deliverable

Critical frontend workflows have automated coverage.

---

# Phase 28 — Final Production Hardening

## Goal

Prepare the frontend for real deployment.

## Tasks

### 28.1 Environment Review

Confirm staging/production environment setup.

### 28.2 Secret Review

Ensure no secret is bundled into client code.

### 28.3 Build

Run clean production build.

### 28.4 Biome

Run full check.

### 28.5 TypeScript

Run full type check.

### 28.6 Dead Code

Remove unused mocks/components.

### 28.7 Mock Review

Ensure production mode does not accidentally use development mock data.

### 28.8 Error Boundaries

Confirm important application areas have usable failure screens.

### 28.9 404 / Maintenance

Finalize not-found and maintenance handling where applicable.

### 28.10 Documentation

Update frontend README with:

- setup
- environment
- commands
- architecture
- routes
- API integration
- auth
- development mocks

## Deliverable

Frontend is ready for production deployment.

---

# Recommended Agent Execution Order

The agent should follow this order:

```text
Phase 0  Foundation
Phase 1  Design System
Phase 2  App Shells
Phase 3  Authentication
Phase 4  API Layer

Phase 5  Home
Phase 6  Public Supporting Pages
Phase 7  Product Catalog
Phase 8  Checkout
Phase 9  Manual Payment

Phase 10 Customer Dashboard
Phase 11 Customer Orders
Phase 12 Customer Profile

Phase 13 Admin Foundation
Phase 14 Admin Dashboard
Phase 15 Admin Orders
Phase 16 Admin Payment Verification
Phase 17 Admin Products
Phase 18 Admin Customers
Phase 19 Admin Payment Methods
Phase 20 Admin Provider UI
Phase 21 Fulfillment Retry
Phase 22 Banners & Settings
Phase 23 Audit Logs

Phase 24 UX Hardening
Phase 25 Automatic Payment Readiness
Phase 26 SEO / Accessibility / Performance
Phase 27 Testing
Phase 28 Production Hardening
```

---

# Do Not Skip These Critical Phases

The following are essential and must not be treated as optional:

- Phase 3 — Authentication
- Phase 4 — API Layer
- Phase 8 — Checkout
- Phase 9 — Manual Payment
- Phase 11 — Order Tracking
- Phase 13 — Admin Foundation
- Phase 15 — Admin Orders
- Phase 16 — Manual Payment Verification
- Phase 17 — Product Management
- Phase 19 — Payment Methods
- Phase 24 — Error/Status Hardening
- Phase 27 — Testing
- Phase 28 — Production Hardening

---

# Phase Completion Template for the Agent

At the end of every phase, return:

```markdown
## Phase Completion Report

### Completed
- ...

### Files Created
- ...

### Files Modified
- ...

### API / Mock Contracts Used
- ...

### Verification
- Bun build:
- Biome:
- TypeScript:
- Tests:

### Known Issues
- ...

### Next Phase
- ...
```

Do not claim completion if build/type/lint checks fail.

---

# Final Rule

The frontend must be implemented **incrementally**, with each phase building on the previous one.

The agent must not:

- build random future features
- redesign architecture midway
- invent backend responses
- expose secrets
- replace the approved tech stack
- skip the Admin Panel
- combine sensitive business logic into React components

The final product must remain:

- maintainable
- typed
- responsive
- secure at the frontend boundary
- easy to connect to FastAPI
- easy to extend from manual to automatic payment
- operationally useful for admins
