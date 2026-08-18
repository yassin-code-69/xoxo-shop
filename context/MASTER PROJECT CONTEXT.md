# MASTER PROJECT CONTEXT

## Free Fire Diamond Top-Up Platform

You are the lead software architect and senior full-stack engineer responsible for building a production-ready **Free Fire Diamond Top-Up Platform**.

Read this entire document before generating code, database schemas, UI, APIs, or folder structures.

Do not make major architectural decisions that contradict this document.

The project is inspired by the general business/workflow concept of:

**Reference:** `https://offertopup.com/`

However:

* Do NOT copy the reference website's UI.
* Do NOT copy its source code.
* Do NOT copy branding, assets, layouts, or visual identity.
* The reference is only for understanding the general concept of an online Free Fire diamond top-up service.
* Our UI/UX must be original, modern, premium, fast, mobile-first, and significantly more polished.

---

# 1. PROJECT OBJECTIVE

Build a web platform where customers can purchase **Free Fire Diamonds**.

The platform will connect to an external **Diamond Provider API**.

The external provider is responsible for actually delivering diamonds to the customer's Free Fire account.

Our application is responsible for:

1. Product/package presentation
2. Customer authentication
3. Free Fire UID collection
4. Order creation
5. Payment collection
6. Manual or automatic payment verification
7. Provider API communication
8. Diamond fulfillment
9. Order tracking
10. Customer order history
11. Administrative management
12. Audit and transaction history

The system must initially support **manual payment verification**, but its architecture must already support **automatic payment gateway integration** without requiring a major rewrite.

---

# 2. CORE BUSINESS FLOW

The primary product is:

**Free Fire Diamond Top-Up**

A typical customer flow is:

Customer

→ Browses available diamond packages

→ Selects package

→ Enters Free Fire UID/account information

→ Creates an order

→ Pays using available payment method

→ Payment is verified

→ Backend sends top-up request to Provider API

→ Provider processes diamond delivery

→ Order becomes completed

→ Customer sees updated status/history

---

# 3. PAYMENT SYSTEM

The system must support TWO payment modes.

## Payment Mode A — Manual Payment

This will be implemented first.

Supported payment methods may include:

* bKash
* Nagad
* Rocket

Admin must be able to enable/disable individual methods.

Example flow:

Customer selects:

**100 Diamonds — ৳XX**

Customer enters:

* Free Fire UID
* Additional account/server information if required by provider
* Payment method

System displays the merchant payment number and payment instructions.

Example:

bKash Personal/Merchant Number

`01XXXXXXXXX`

The customer manually sends the money.

Then customer submits:

* Transaction ID / TrxID
* Sender number if required
* Payment amount
* Optional payment screenshot

After submission:

Payment Status:

`PENDING_VERIFICATION`

Admin receives the order in the dashboard.

Admin checks the transaction manually.

Admin can:

* Approve Payment
* Reject Payment
* Request Review if needed

If approved:

Payment status becomes:

`VERIFIED`

Then the backend automatically starts the diamond fulfillment process through the Provider API.

The admin should NOT normally have to manually send the provider request after payment approval.

---

# 4. AUTOMATIC PAYMENT SYSTEM

The architecture must support automatic gateway integration.

Possible future gateway integrations may include:

* SSLCOMMERZ
* bKash merchant/payment API
* Nagad merchant/payment API
* other Bangladeshi payment gateways

Do NOT tightly couple orders to a specific payment gateway.

Create a generic payment-provider abstraction.

Example conceptual interface:

`PaymentGateway`

Responsibilities:

* initiatePayment()
* verifyPayment()
* handleCallback()
* handleWebhook()
* queryTransaction()
* normalizePaymentStatus()

Possible implementations:

* ManualPaymentGateway
* SSLCommerzGateway
* BkashGateway
* NagadGateway

More providers should be addable without modifying core order logic.

---

# 5. AUTOMATIC PAYMENT FLOW

Example:

Customer creates order

→ Backend creates payment session

→ User completes gateway payment

→ Gateway sends callback/webhook/IPN

→ Backend independently validates transaction

→ Validate:

* Transaction ID
* Order ID
* Amount
* Currency
* Payment status
* Gateway response

→ Payment marked successful

→ Fulfillment automatically starts

→ Provider API receives top-up request

→ Provider confirms delivery

→ Order completed.

Frontend redirect alone must NEVER determine payment success.

Payment confirmation must always happen on the backend.

---

# 6. DIAMOND PROVIDER API

The actual provider is not known yet.

Therefore create a **Provider Adapter Architecture**.

Core business logic must not depend directly on a specific provider.

Conceptual interface:

`TopupProvider`

Responsibilities:

* submitTopup()
* getOrderStatus()
* validateProduct()
* mapProviderStatus()
* handleProviderWebhook() if available

Possible implementations:

`ProviderAAdapter`

Future:

`ProviderBAdapter`

`ProviderCAdapter`

If provider changes later, the rest of the application should remain unchanged.

Provider credentials must NEVER be exposed to the frontend.

---

# 7. PROVIDER TOP-UP FLOW

After verified payment:

Order:

`PAYMENT_VERIFIED`

↓

Create fulfillment attempt

↓

Send Provider API request containing necessary information such as:

* Free Fire UID
* Product/provider SKU
* Client order reference
* Required region/server information

↓

Provider responds

Possible statuses:

* accepted
* pending
* processing
* completed
* failed

↓

Normalize provider-specific statuses into internal platform statuses.

Never expose provider-specific implementation details directly to frontend business logic.

---

# 8. ORDER STATE MODEL

Payment and fulfillment statuses MUST be stored separately.

Do not create one giant ambiguous `status` field for everything.

## Order Status

Possible values:

* PENDING_PAYMENT
* PAYMENT_SUBMITTED
* PAYMENT_VERIFIED
* PROCESSING
* COMPLETED
* FAILED
* CANCELLED
* REFUNDED

## Payment Status

Possible values:

* PENDING
* SUBMITTED
* VERIFYING
* VERIFIED
* REJECTED
* FAILED
* REFUNDED

## Fulfillment Status

Possible values:

* NOT_STARTED
* QUEUED
* PROCESSING
* COMPLETED
* FAILED
* RETRYING

Internal services must control valid state transitions.

Invalid transitions must be rejected.

Example:

`COMPLETED → PENDING_PAYMENT`

must never be possible.

---

# 9. TARGET TECH STACK

## Frontend

Use:

* Next.js — App Router
* React
* TypeScript
* Tailwind CSS
* shadcn/ui
* Bun
* Biome
* React Hook Form
* Zod
* TanStack Query where client-side server-state management is required
* Lucide Icons
* next-themes if theme switching is implemented

Do NOT introduce unnecessary frontend libraries.

Avoid excessive global state.

Use Zustand only if there is an actual application-wide state requirement that cannot be solved cleanly using server state, URL state, React context, or local state.

---

# 10. FRONTEND PACKAGE MANAGEMENT

Use:

**Bun**

Commands should primarily use:

`bun install`

`bun add`

`bun run`

Do not mix package managers unnecessarily.

Do not maintain:

* package-lock.json
* pnpm-lock.yaml
* yarn.lock

when Bun is the chosen package manager.

Maintain one consistent lock file.

---

# 11. FRONTEND CODE QUALITY

Use:

**Biome**

for:

* formatting
* linting
* import organization where appropriate

Avoid configuring ESLint + Prettier in parallel unless there is a strong technical reason.

TypeScript should use strict mode.

Avoid:

* `any`
* unsafe casting
* duplicated types
* giant components
* excessive `"use client"`

Prefer Server Components by default.

Use Client Components only where browser-side interaction is required.

---

# 12. BACKEND

Use:

## FastAPI

Language:

**Python**

Recommended supporting technologies:

* FastAPI
* Pydantic
* SQLAlchemy 2.x
* async PostgreSQL driver
* Alembic
* HTTPX
* Pytest
* structured logging

Backend must be:

* async where appropriate
* strongly typed
* modular
* service-oriented
* testable
* provider-independent
* payment-gateway-independent

Do not create a giant `main.py`.

Do not put business logic inside route handlers.

Routes should remain thin.

---

# 13. DATABASE

Use:

**PostgreSQL hosted on Supabase**

Supabase will provide:

* PostgreSQL
* Authentication
* Storage
* potentially realtime functionality if actually needed

Do not use multiple primary databases.

PostgreSQL/Supabase is the application's single source of truth.

---

# 14. AUTHENTICATION

Use:

**Supabase Auth**

Initial authentication can support:

* Email/password

Architecture should allow future support for:

* OTP
* Google
* phone authentication

without rewriting application authorization.

Frontend uses Supabase authentication.

After authentication, requests to FastAPI must include the user's valid access token/session credential.

FastAPI must verify authentication before returning protected data.

Never trust user ID supplied manually by frontend.

Authenticated user identity must come from the verified authentication token.

---

# 15. AUTHORIZATION / ROLES

Implement Role-Based Access Control.

Initial roles:

### CUSTOMER

Can:

* manage own profile
* place orders
* submit manual payment
* view own orders
* view own payment information
* view top-up status

### SUPPORT

Can:

* view relevant customer orders
* help review orders
* view payment information as permitted
* add internal notes

Cannot:

* change highly sensitive system configuration
* access provider secrets
* access payment gateway secrets

### ADMIN

Can:

* manage orders
* verify manual payments
* reject payments
* manage products
* manage payment methods
* manage site content
* retry failed fulfillment
* inspect operational logs

### SUPER_ADMIN

Can:

* perform all admin actions
* manage admins/roles
* configure providers
* configure system-level settings
* manage sensitive integrations

Every privileged action must be authorized on the backend.

Never rely only on hiding frontend buttons.

---

# 16. DATABASE SECURITY

Use Supabase RLS where applicable.

Even when the main application accesses business data through FastAPI, database policies should provide additional protection for exposed Supabase resources.

Customers must NEVER be able to read another customer's:

* orders
* payments
* transaction IDs
* account information
* payment screenshots

Admin-only information must remain protected.

Supabase service-role credentials must never be exposed to browsers.

---

# 17. HIGH-LEVEL DATABASE DESIGN

Design relational tables similar to the following.

Exact implementation may evolve during database planning.

## profiles

Fields conceptually include:

* id
* auth_user_id
* full_name
* phone
* avatar_url
* status
* created_at
* updated_at

---

## roles

Examples:

* CUSTOMER
* SUPPORT
* ADMIN
* SUPER_ADMIN

---

## user_roles

Maps users to application roles.

---

## games

Although the MVP focuses on Free Fire, avoid hardcoding the entire database exclusively around one product.

Fields:

* id
* name
* slug
* logo
* active
* created_at

Example:

`free-fire`

This allows future games without redesigning the database.

Do NOT build multi-game UI unless requested.

This is only architectural future-proofing.

---

## topup_products

Fields:

* id
* game_id
* name
* slug
* diamond_amount
* bonus_amount if required
* provider_sku
* selling_price
* provider_cost
* currency
* active
* featured
* sort_order
* created_at
* updated_at

Provider cost is admin-only.

Never expose internal margins to customers.

---

## orders

Fields conceptually include:

* id
* public_order_id
* user_id
* product_id
* game_id
* player_uid
* player_server
* quantity
* unit_price
* total_amount
* currency
* order_status
* payment_status
* fulfillment_status
* created_at
* updated_at
* completed_at

Product price must be SNAPSHOTTED on the order.

Changing product price later must not change historical orders.

---

## payments

Fields:

* id
* order_id
* payment_type
* payment_method
* gateway
* amount
* currency
* transaction_id
* sender_number if applicable
* proof_url
* status
* submitted_at
* verified_at
* verified_by
* rejection_reason
* created_at
* updated_at

Transaction IDs should be protected against accidental reuse where appropriate.

---

## payment_attempts

Used particularly for automated payment gateways.

Fields may include:

* id
* payment_id
* gateway
* gateway_session_id
* gateway_transaction_id
* attempt_number
* status
* request_reference
* response_reference
* created_at
* updated_at

Do not store sensitive secrets.

---

## provider_orders

Fields:

* id
* order_id
* provider
* provider_sku
* provider_order_id
* client_reference
* status
* attempt_count
* last_error
* submitted_at
* completed_at
* created_at
* updated_at

---

## order_status_history

Maintain order lifecycle history.

Fields:

* id
* order_id
* previous_status
* new_status
* reason
* changed_by
* created_at

---

## payment_methods

Allows admin to configure:

* bKash
* Nagad
* Rocket
* gateways

Fields:

* id
* name
* code
* type
* account_number
* account_type
* instructions
* logo
* active
* sort_order

Never store private API secrets in ordinary public configuration fields.

---

## provider_configs

Store only non-secret provider configuration where appropriate.

Secrets should live in environment variables or a secure secret-management system.

---

## banners

For homepage marketing banners.

---

## site_settings

Possible values:

* support phone
* WhatsApp
* Facebook URL
* site title
* logo
* announcement
* maintenance mode
* manual payment instructions

---

## audit_logs

Track important administrative actions.

Examples:

* payment approved
* payment rejected
* product price modified
* order manually changed
* fulfillment retried
* admin role changed

Fields:

* actor_id
* action
* entity_type
* entity_id
* metadata
* IP if appropriate
* created_at

---

# 18. PAYMENT SCREENSHOT STORAGE

Use:

**Supabase Storage**

Create a private bucket such as:

`payment-proofs`

Payment proof screenshots must NOT be publicly enumerable.

Only:

* owning customer where necessary
* authorized admins

should access them.

Use controlled/signed access URLs where required.

Marketing assets may use a separate public bucket.

Example:

`public-assets`

---

# 19. MONEY HANDLING

Never use floating-point arithmetic for money.

Use PostgreSQL:

`NUMERIC`

or equivalent precise decimal handling.

Backend monetary calculations must use decimal types.

Always validate:

* order amount
* payment amount
* provider product
* currency

on the server.

Never trust prices sent from frontend.

Frontend should normally send:

`product_id`

Backend determines the official current selling price.

---

# 20. ORDER CREATION RULE

Incorrect:

Frontend sends:

`price = 100`

Backend blindly creates order for ৳100.

Correct:

Frontend sends:

* product_id
* Free Fire UID
* required account information

Backend:

1. reads active product
2. gets official price
3. snapshots product information
4. calculates amount
5. creates order

---

# 21. DUPLICATE PAYMENT PROTECTION

Manual transaction IDs should have appropriate uniqueness rules.

The same transaction must not accidentally verify multiple orders.

Automatic gateway transaction IDs must also be protected from duplicate processing.

Webhook processing must be idempotent.

Receiving the same payment webhook multiple times must NOT:

* create multiple payments
* create multiple orders
* trigger diamond fulfillment multiple times

---

# 22. IDEMPOTENCY

Critical operations must support idempotency.

Especially:

* order creation where necessary
* payment initiation
* webhook handling
* provider top-up submission
* fulfillment retries

Every provider request should have an internal client reference.

Before sending another top-up request, check whether one has already been successfully submitted.

Never risk sending the customer diamonds twice because of retries.

---

# 23. PROVIDER FAILURE HANDLING

Provider failure must NOT automatically destroy the order.

Example:

Payment verified

↓

Provider unavailable

↓

Order:

`PROCESSING`

or

`FAILED / RETRY_REQUIRED`

Payment remains:

`VERIFIED`

Admin can investigate and retry.

The system must distinguish between:

* payment failure
* provider failure

These are different events.

---

# 24. RETRY SYSTEM

Provider requests may fail because of:

* timeout
* networking issues
* provider maintenance
* temporary provider error

Implement safe retry logic.

Do not blindly retry permanent errors such as:

* invalid UID
* invalid product
* permanently rejected provider order

Use controlled retries.

Maintain attempt history.

---

# 25. CRITICAL BACKGROUND PROCESSING

Provider fulfillment is business-critical.

Do not build the architecture assuming the HTTP request must remain open until fulfillment completes.

Order creation/payment verification should return appropriate responses while fulfillment can continue independently.

The architecture should support a worker/job mechanism.

For the first version, keep this lightweight.

Prefer a clean abstraction such as:

`FulfillmentJob`

with the option to later use:

* Redis-backed worker
* dedicated worker service
* PostgreSQL-backed queue

without changing order services.

Do NOT introduce a complex distributed system prematurely.

---

# 26. FRONTEND APPLICATION AREAS

The frontend has THREE conceptual areas.

## A. Public Website

Available without login.

Pages may include:

* Home
* Top-Up
* How It Works
* FAQ
* Support
* Terms & Conditions
* Privacy Policy

---

# 27. HOME PAGE

Create an original premium UI.

Potential sections:

### Navbar

* Logo
* Home
* Top Up
* Orders
* Support
* Login/Profile

### Hero

Clear primary CTA:

**Top Up Free Fire Diamonds**

### Popular Packages

Beautiful product cards.

Example:

* 25 Diamonds
* 50 Diamonds
* 115 Diamonds
* Weekly Membership
* Monthly Membership

Actual packages must come from the database/admin.

Never hardcode production package data in UI components.

### How It Works

Example:

1. Select package
2. Enter UID
3. Pay securely
4. Receive diamonds

### Why Choose Us

Examples:

* Fast Delivery
* Trusted Payment
* Simple Process
* Order Tracking
* Support

### FAQ

### Support CTA

### Footer

---

# 28. TOP-UP PAGE

This is one of the most important pages.

UX should be extremely simple.

Suggested structure:

### Step 1 — Select Diamond Package

Grid/cards.

### Step 2 — Enter Player Information

* Free Fire UID
* required server/region if needed

Provide helper text showing customers where UID can be found.

### Step 3 — Payment Method

Manual initially:

* bKash
* Nagad
* Rocket

Later automatic options.

### Step 4 — Order Summary

Show:

* package
* diamonds
* subtotal
* total
* UID

### Step 5 — Confirm

Create order.

---

# 29. MANUAL PAYMENT PAGE

After creating manual-payment order:

Display:

* Order ID
* Amount
* Payment method
* Merchant number
* Payment instructions
* Copy Number button
* Copy Amount button

Input:

* Transaction ID
* Sender number if needed
* Screenshot upload optional

CTA:

**Submit Payment**

Show clear message:

`Payment submitted and awaiting verification.`

---

# 30. CUSTOMER DASHBOARD

Authenticated customers should have a simple dashboard.

Sections:

### Overview

* total orders
* completed orders
* pending orders

### My Orders

Table/cards showing:

* order ID
* product
* amount
* UID
* payment status
* top-up status
* date

### Order Details

Timeline:

Order Created

↓

Payment Submitted

↓

Payment Verified

↓

Processing Top-Up

↓

Completed

### Profile

Customer profile settings.

---

# 31. ADMIN PANEL

The admin interface is extremely important.

Route conceptually:

`/admin`

Use its own layout/navigation.

Admin sidebar:

* Dashboard
* Orders
* Payments
* Products
* Games
* Customers
* Payment Methods
* Providers
* Banners
* Site Settings
* Audit Logs

Some pages may be hidden according to role.

---

# 32. ADMIN DASHBOARD

Show useful operational information.

Examples:

* Orders Today
* Revenue Today
* Pending Payments
* Processing Orders
* Failed Top-Ups
* Completed Orders

Recent Orders

Pending Verification

Provider Failure Alerts

Do not create meaningless decorative charts.

Only create dashboards where data is operationally useful.

---

# 33. ADMIN ORDER MANAGEMENT

Admin must be able to:

* search orders
* filter by date
* filter by payment status
* filter by fulfillment status
* filter by product
* view order
* view payment details
* review screenshot
* approve manual payment
* reject payment
* inspect provider fulfillment
* retry failed fulfillment
* add internal notes

Sensitive actions require confirmation dialogs.

---

# 34. PRODUCT MANAGEMENT

Admin can:

* create package
* edit package
* enable/disable package
* configure selling price
* configure provider SKU
* configure diamond quantity
* sort packages
* feature packages

Product deletion should normally use soft-disable instead of deleting historical product references.

---

# 35. PAYMENT METHOD MANAGEMENT

Admin can configure manual methods.

Example:

### bKash

* Account Number
* Account Type
* Instructions
* Enabled

### Nagad

Same concept.

### Rocket

Same concept.

Admin can disable a payment method instantly.

---

# 36. PROVIDER MANAGEMENT

Provider secrets must not be casually editable or visible.

Sensitive credentials belong in environment/secrets management.

Admin UI may display operational provider information such as:

* provider name
* active/inactive
* connectivity status
* supported products

Do not show secret API keys.

---

# 37. FRONTEND ARCHITECTURE

Use a feature-oriented structure.

Recommended structure:

```text
apps/
└── web/
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
    │   │   └── layout/
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
    │   │   ├── supabase/
    │   │   ├── auth/
    │   │   ├── config/
    │   │   └── utils/
    │   │
    │   ├── types/
    │   └── constants/
    │
    ├── public/
    ├── biome.json
    ├── components.json
    ├── package.json
    └── tsconfig.json
```

Do not force all logic into `app/`.

Keep reusable feature logic inside the relevant feature modules.

---

# 38. FRONTEND API LAYER

Create one centralized API client.

Example conceptual structure:

```text
lib/api/
├── client.ts
├── errors.ts
└── endpoints.ts
```

Feature-specific API functions can live near their feature.

Do not scatter raw `fetch()` calls throughout components.

The API client must handle:

* API base URL
* auth token
* JSON parsing
* standardized errors
* unauthorized responses
* request cancellation where needed

---

# 39. BACKEND ARCHITECTURE

Recommended structure:

```text
apps/
└── api/
    ├── app/
    │   ├── main.py
    │   │
    │   ├── api/
    │   │   └── v1/
    │   │       └── router.py
    │   │
    │   ├── core/
    │   │   ├── config.py
    │   │   ├── security.py
    │   │   ├── logging.py
    │   │   ├── exceptions.py
    │   │   └── constants.py
    │   │
    │   ├── db/
    │   │   ├── base.py
    │   │   ├── session.py
    │   │   └── migrations/
    │   │
    │   ├── modules/
    │   │   ├── users/
    │   │   ├── games/
    │   │   ├── products/
    │   │   ├── orders/
    │   │   ├── payments/
    │   │   ├── fulfillment/
    │   │   ├── providers/
    │   │   ├── admin/
    │   │   ├── settings/
    │   │   └── audit/
    │   │
    │   ├── integrations/
    │   │   ├── payments/
    │   │   └── providers/
    │   │
    │   ├── workers/
    │   └── shared/
    │
    ├── tests/
    ├── alembic.ini
    ├── pyproject.toml
    └── Dockerfile
```

---

# 40. BACKEND MODULE STRUCTURE

Use domain-oriented modules.

Example:

```text
modules/orders/
├── model.py
├── schema.py
├── repository.py
├── service.py
├── router.py
└── exceptions.py
```

Responsibilities:

### router.py

HTTP layer only.

### schema.py

Request/response validation.

### service.py

Business rules.

### repository.py

Database persistence/query logic.

### model.py

ORM/database model.

Avoid unnecessary abstraction when a module is tiny, but preserve separation of business logic from HTTP handlers.

---

# 41. BACKEND API

Use versioned APIs.

Base:

`/api/v1`

Possible customer endpoints:

```text
GET    /api/v1/products
GET    /api/v1/products/{slug}

POST   /api/v1/orders
GET    /api/v1/orders/{order_id}
GET    /api/v1/me/orders

POST   /api/v1/orders/{order_id}/manual-payment

POST   /api/v1/payments/{gateway}/initiate

POST   /api/v1/webhooks/payments/{gateway}
POST   /api/v1/webhooks/providers/{provider}
```

Possible admin endpoints:

```text
GET    /api/v1/admin/orders
GET    /api/v1/admin/orders/{order_id}

POST   /api/v1/admin/payments/{payment_id}/approve
POST   /api/v1/admin/payments/{payment_id}/reject

POST   /api/v1/admin/orders/{order_id}/retry-fulfillment

GET    /api/v1/admin/products
POST   /api/v1/admin/products
PATCH  /api/v1/admin/products/{product_id}

GET    /api/v1/admin/payment-methods
PATCH  /api/v1/admin/payment-methods/{id}
```

Exact API design should be finalized during backend planning.

---

# 42. ERROR RESPONSE STANDARD

Backend must return consistent errors.

Conceptual response:

```json
{
  "error": {
    "code": "PAYMENT_NOT_VERIFIED",
    "message": "Payment must be verified before fulfillment."
  }
}
```

Do not expose:

* stack traces
* database errors
* API secrets
* provider raw credentials

to customers.

---

# 43. LOGGING

Use structured backend logging.

Important events:

* order created
* manual payment submitted
* payment approved
* payment rejected
* payment gateway callback received
* payment validated
* provider request started
* provider request succeeded
* provider request failed
* provider retry
* order completed

Never log:

* passwords
* full secret tokens
* private provider keys
* Supabase service-role keys

---

# 44. AUDITABILITY

Financial/order systems require traceability.

Important records should retain:

* who performed the action
* when
* previous value/status
* new value/status
* associated order/payment

Do not silently overwrite important transactional information.

---

# 45. CONCURRENCY SAFETY

Two admins may accidentally approve the same payment.

Two webhooks may arrive simultaneously.

Two workers may try to fulfill an order.

The backend must prevent duplicate processing using:

* transactions
* database constraints
* row locking where appropriate
* idempotency
* state-transition validation

Never rely only on frontend disabled buttons.

---

# 46. UID VALIDATION

Player UID requirements may depend on the final provider.

Therefore:

* define basic configurable validation
* do not assume unnecessary fixed UID format until provider documentation is available

Provider-specific validation can live inside provider adapters.

---

# 47. UI/UX DIRECTION

Design should feel:

* modern
* trustworthy
* gaming-oriented
* clean
* premium
* fast
* mobile-first

Avoid:

* clutter
* excessive gradients
* excessive glow
* cheap gaming UI
* oversized animations
* unreadable neon colors

Visual inspiration may come from modern:

* gaming marketplaces
* fintech checkout systems
* premium e-commerce systems

But maintain original branding.

---

# 48. RESPONSIVE DESIGN

The majority of top-up users may access the platform from mobile devices.

Design mobile-first.

Support:

* mobile
* tablet
* laptop
* desktop

Top-up and payment flows must be particularly easy on small screens.

---

# 49. PERFORMANCE

Prioritize:

* fast initial page load
* optimized images
* minimal client JavaScript
* Server Components where useful
* lazy loading
* efficient API requests
* database indexes
* pagination
* avoiding N+1 queries

Do not prematurely optimize with complicated infrastructure.

---

# 50. SEO

Public pages should support:

* metadata
* Open Graph data
* proper headings
* semantic HTML
* canonical URLs where applicable
* sitemap
* robots configuration

Customer/admin dashboards do not require public indexing.

---

# 51. ACCESSIBILITY

Implement:

* accessible forms
* labels
* keyboard navigation
* visible focus states
* proper dialogs
* semantic HTML
* reasonable contrast

shadcn components may be used as primitives but customize design appropriately.

---

# 52. SECURITY REQUIREMENTS

Mandatory:

* validate all backend input
* sanitize upload metadata
* validate file size/type
* enforce authorization
* rate-limit sensitive endpoints where necessary
* validate payment callbacks
* validate payment amount server-side
* use HTTPS in production
* secure CORS configuration
* protect secrets
* use DB transactions
* prevent duplicate fulfillment
* maintain audit logs

Never expose secrets through:

* frontend environment variables
* browser network payloads
* client JavaScript
* public Supabase configuration tables

---

# 53. ENVIRONMENT CONFIGURATION

Conceptual backend environment variables:

```text
DATABASE_URL

SUPABASE_URL
SUPABASE_JWT_CONFIG

PROVIDER_API_BASE_URL
PROVIDER_API_KEY

PAYMENT_GATEWAY_STORE_ID
PAYMENT_GATEWAY_SECRET

FRONTEND_URL
ENVIRONMENT
```

Frontend may contain only public configuration intended for browsers.

Do NOT put server secrets behind variables prefixed as public.

---

# 54. DATABASE MIGRATIONS

Database structure must be version-controlled.

Use migrations.

Avoid modifying production database schema manually through dashboards without corresponding migrations.

Schema changes, indexes, constraints, and important policies should be reproducible.

---

# 55. TESTING

## Backend

Use Pytest.

Test:

* order creation
* price calculation
* authorization
* manual payment submission
* payment approval
* duplicate transaction IDs
* payment state transitions
* fulfillment state transitions
* provider failures
* provider retry
* webhook duplication
* idempotency
* permissions

Payment/provider APIs should be mockable.

---

# 56. FRONTEND TESTING

Test critical flows rather than testing every trivial component.

Important flows:

* login
* package selection
* UID input
* checkout
* manual payment submission
* order tracking
* admin payment approval

Use end-to-end tests for major workflows where appropriate.

---

# 57. API MOCKING

Because the real diamond provider API may not initially be available, implement a development provider.

Example:

`MockTopupProvider`

It should simulate:

* success
* processing
* failure
* timeout

Do the same for automatic payment gateway development if credentials are unavailable.

This allows the application to be fully developed before production credentials arrive.

---

# 58. DEVELOPMENT MODES

Support environments:

* local
* staging
* production

Never test real financial transactions directly in production during development.

Integration credentials must be environment-specific.

---

# 59. FEATURE FLAGS / PAYMENT MODE

Allow configuration for:

```text
MANUAL_PAYMENT_ENABLED=true
AUTOMATIC_PAYMENT_ENABLED=false
```

This allows the application to launch with manual payment.

Later automatic gateway support can be enabled without rewriting checkout.

---

# 60. MANUAL → AUTOMATIC PAYMENT MIGRATION

This is a fundamental requirement.

Version 1:

Customer

→ Manual payment

→ TrxID

→ Admin verification

→ Provider API

Version 2:

Customer

→ Gateway payment

→ Backend verification

→ Automatic Provider API

The domain model must support both from the beginning.

Do NOT create Version 1 in a way that requires rewriting Orders when Version 2 is introduced.

---

# 61. PROVIDER MIGRATION

Similarly:

Version 1 may use:

`Provider A`

Future may use:

`Provider B`

Changing provider should require implementing/reconfiguring an adapter, not rewriting:

* checkout
* payment logic
* order history
* customer dashboard

---

# 62. FUTURE-PROOFING

Architect for reasonable expansion, but do NOT build unnecessary features now.

Possible future features:

* additional games
* coupons
* referral system
* reseller system
* wallet
* loyalty points
* automatic refunds
* multiple providers
* dynamic provider routing
* mobile application

Do not implement these unless explicitly approved.

Architecture should merely avoid blocking them.

---

# 63. FEATURES NOT CURRENTLY REQUIRED

Do NOT automatically add:

* wallet
* affiliate program
* reseller panel
* multi-vendor marketplace
* cryptocurrency
* subscription billing
* complex microservices
* Kubernetes
* event streaming
* blockchain
* AI features

unless separately requested.

Keep the MVP focused.

---

# 64. REPOSITORY STRATEGY

For this project, prefer a single repository containing both applications:

```text
topup-platform/
├── apps/
│   ├── web/
│   └── api/
│
├── docs/
├── infra/
├── scripts/
├── .github/
├── .env.example
├── README.md
└── docker-compose.yml
```

Frontend and backend must remain independently deployable.

The monorepo is for development convenience, not tight runtime coupling.

---

# 65. ARCHITECTURE OVERVIEW

Conceptually:

```text
                    ┌──────────────────────┐
                    │      CUSTOMER        │
                    └──────────┬───────────┘
                               │
                               ▼
                    ┌──────────────────────┐
                    │      NEXT.JS WEB     │
                    │ React / TS / Tailwind│
                    │     shadcn/ui        │
                    └──────────┬───────────┘
                               │
                  Authentication / API
                               │
              ┌────────────────┴───────────────┐
              │                                │
              ▼                                ▼
    ┌────────────────────┐          ┌────────────────────┐
    │   SUPABASE AUTH    │          │      FASTAPI       │
    └────────────────────┘          │   BUSINESS API     │
                                    └─────────┬──────────┘
                                              │
                    ┌─────────────────────────┼─────────────────────────┐
                    │                         │                         │
                    ▼                         ▼                         ▼
             ┌──────────────┐         ┌───────────────┐       ┌────────────────┐
             │ PostgreSQL   │         │ Payment       │       │ Topup Provider │
             │ Supabase     │         │ Integrations  │       │ API            │
             └──────────────┘         └───────────────┘       └────────────────┘
```

---

# 66. IMPORTANT SYSTEM BOUNDARY

Frontend responsibilities:

* render UI
* collect user input
* manage UX
* authenticate through Supabase
* communicate with backend
* display backend results

Frontend must NOT decide:

* whether payment is actually valid
* final price
* whether fulfillment should run
* whether an admin has permission
* whether provider request succeeded

Those are backend responsibilities.

---

# 67. BACKEND AS BUSINESS-LOGIC AUTHORITY

FastAPI is the authoritative business layer.

All financially or operationally sensitive actions must pass through the backend.

Examples:

* create order
* submit payment
* verify payment
* approve/reject payment
* initiate gateway transaction
* fulfill diamonds
* retry fulfillment
* modify prices
* update provider SKU

---

# 68. ADMIN EXPERIENCE

The admin system should optimize operational speed.

For example:

Pending Payments page should allow admin to quickly see:

* order
* customer
* package
* amount
* payment method
* TrxID
* sender number
* screenshot
* submitted time

Admin can approve/reject with minimal clicks.

However approval must still have proper backend safeguards.

---

# 69. ORDER IDENTIFIERS

Do not expose sequential database IDs as customer-friendly order numbers.

Generate a separate public order reference.

Example concept:

`FF-260817-A7K4P`

Exact format can be finalized later.

Internally continue using UUID/database IDs.

---

# 70. TIME STORAGE

Store timestamps consistently in UTC in the database.

Convert/display according to the application's configured timezone.

Default business timezone can later be configured for Bangladesh.

---

# 71. SOFT DELETION / HISTORICAL DATA

Do not hard-delete transactional records such as:

* completed orders
* payments
* provider transactions
* audit history

Products/payment methods should generally be deactivated instead of deleted when they already have historical references.

---

# 72. API DOCUMENTATION

FastAPI API endpoints should be self-documented through appropriate schemas.

All important request and response models must be typed.

Maintain clear API contracts so frontend and backend can be developed separately.

---

# 73. CODE QUALITY RULES

Mandatory principles:

* DRY, but avoid premature abstraction
* SOLID where practical
* small focused functions
* domain-oriented modules
* typed interfaces
* clear naming
* avoid magic values
* avoid massive files
* avoid circular dependencies
* no duplicated payment/provider logic
* no business logic in React components
* no business logic in API routers

---

# 74. COMMENTS

Do not over-comment obvious code.

Add comments where they explain:

* unusual business rules
* security decisions
* provider quirks
* payment validation requirements
* complex concurrency behavior

---

# 75. DOCUMENTATION

Maintain:

`README.md`

and project documentation covering:

* setup
* architecture
* environment variables
* database migrations
* local development
* frontend commands
* backend commands
* testing
* deployment basics
* payment integration
* provider integration

---

# 76. IMPLEMENTATION PRINCIPLE

Do not attempt to build the entire project in one giant uncontrolled generation.

Implementation must be phase-driven.

After reading this Master Context:

FIRST understand and document the architecture.

Then create separate detailed execution plans for:

1. Frontend
2. Backend

Each must later be broken down into smaller implementation phases.

---

# 77. FUTURE FRONTEND PHASES

The detailed frontend plan will later include areas such as:

* foundation/setup
* design system
* public pages
* authentication
* top-up checkout
* manual payment flow
* customer dashboard
* admin layout
* admin products
* admin orders
* admin payments
* integrations with backend
* loading/error states
* responsive polishing
* testing

Do NOT generate this full phase plan yet unless requested.

---

# 78. FUTURE BACKEND PHASES

The detailed backend plan will later include areas such as:

* FastAPI foundation
* configuration
* PostgreSQL connection
* migrations
* Supabase authentication verification
* RBAC
* users
* product catalog
* order domain
* manual payments
* payment verification
* provider abstraction
* provider fulfillment
* admin APIs
* automatic payment adapter
* webhooks
* audit
* background jobs
* testing
* production hardening

Do NOT generate this full phase plan yet unless requested.

---

# 79. INITIAL DELIVERY STRATEGY

The initial production-capable release should focus on:

### MVP

* Supabase authentication
* customer profile
* Free Fire product/package listing
* UID-based checkout
* manual bKash
* manual Nagad
* manual Rocket
* TrxID submission
* payment screenshot support
* admin verification
* provider API integration
* automatic top-up after approval
* customer order tracking
* admin product management
* admin order management
* admin payment management
* basic site settings
* audit logging

Then:

### Phase 2 Integration

* automatic payment gateway

The database/domain architecture must already support Phase 2.

---

# 80. FINAL ARCHITECTURAL RULE

The system should be:

**Simple enough for the current business, but structured enough that future payment gateways, diamond providers, increased traffic, and additional games can be introduced without rebuilding the core platform.**

Do not overengineer.

Do not underengineer payment and fulfillment security.

Financial state and fulfillment state must always be reliable and auditable.

---

# 81. FINAL TECH STACK SUMMARY

## Frontend

* Next.js
* React
* TypeScript
* Tailwind CSS
* shadcn/ui
* Bun
* Biome
* React Hook Form
* Zod
* TanStack Query where needed

## Backend

* Python
* FastAPI
* Pydantic
* SQLAlchemy
* PostgreSQL async driver
* Alembic
* HTTPX
* Pytest

## Platform / Infrastructure

* Supabase PostgreSQL
* Supabase Auth
* Supabase Storage

## External Integrations

* Diamond Provider API
* Manual Payment System
* Future Payment Gateway API

---

# 82. INSTRUCTIONS TO THE AI CODING AGENT

Before writing implementation code:

1. Read this Master Context completely.
2. Preserve the architecture defined here.
3. Do not introduce unnecessary technologies.
4. Do not replace FastAPI without explicit approval.
5. Do not replace Supabase/PostgreSQL without explicit approval.
6. Do not build automatic payment before its implementation phase.
7. Create provider/payment adapters instead of hardcoding integrations.
8. Keep frontend and backend clearly separated.
9. Keep sensitive business operations on the backend.
10. Design database constraints before relying on application logic.
11. Maintain strict TypeScript and Python typing.
12. Build reusable UI components without overabstracting.
13. Maintain responsive mobile-first UX.
14. Treat payment and fulfillment as separate state machines.
15. Protect against duplicate payment/provider processing.
16. Maintain migrations, tests, documentation, and `.env.example`.
17. Never commit credentials or secrets.
18. Never expose provider/payment secrets to the browser.
19. Never trust amounts/statuses sent by frontend.
20. Ask for provider-specific API documentation only when implementation reaches the real Provider Integration phase.

For now, consider this document the **single source of truth for the project architecture and scope**.
