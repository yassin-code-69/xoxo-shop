# Backend Master Context
## Free Fire Diamond Top-Up Platform

> **Purpose:** This document is the single source of truth for the **backend application** of the Free Fire Diamond Top-Up Platform.
>
> The AI coding agent must read this entire file before creating backend code, database schemas, APIs, payment logic, provider integrations, migrations, or admin services.

---

# 1. Project Overview

We are building a production-ready **Free Fire Diamond Top-Up Platform**.

The platform allows customers to:

1. Browse available Free Fire diamond packages.
2. Enter their Free Fire UID and required account information.
3. Create an order.
4. Pay using manual payment methods initially.
5. Submit transaction information.
6. Wait for admin payment verification.
7. After payment approval, the backend sends a top-up request to an external Diamond Provider API.
8. Track the order until fulfillment completes.

Later, the system will support automatic payment gateways such as:

- SSLCOMMERZ
- bKash merchant/payment API
- Nagad merchant/payment API
- other approved gateways

The backend architecture must support manual and automatic payment without rewriting the core order system.

---

# 2. Backend Scope

The backend is responsible for all sensitive and authoritative business logic.

Responsibilities include:

- authentication verification
- authorization / RBAC
- customer profiles
- product/package management
- order creation
- pricing authority
- manual payment submission
- manual payment approval/rejection
- automatic payment initiation
- payment callback/webhook verification
- payment status management
- provider API integration
- fulfillment management
- retry handling
- order status management
- customer order history
- admin APIs
- payment method configuration
- provider configuration abstraction
- banners/site settings APIs
- audit logging
- concurrency protection
- idempotency
- rate limiting where appropriate
- structured logging
- health checks
- API documentation
- migrations
- testing

The backend is the **source of truth** for:

- prices
- payment status
- fulfillment status
- permissions
- valid state transitions
- provider results

---

# 3. Approved Backend Tech Stack

Use:

## Core

- **Python**
- **FastAPI**
- **Pydantic**
- **SQLAlchemy 2.x**
- **Alembic**
- **PostgreSQL**
- **HTTPX**
- **Pytest**

## Database

- **Supabase PostgreSQL**

## Authentication

- **Supabase Auth**
- Backend verifies Supabase-issued access tokens.

## Storage

- **Supabase Storage**

Primary use:

- payment proof screenshots
- public assets where needed

## Async PostgreSQL Driver

Use an async PostgreSQL driver compatible with SQLAlchemy.

Recommended:

- `asyncpg`

## Configuration

Use typed settings.

Recommended:

- `pydantic-settings`

## Logging

Use structured application logging.

The implementation may use the Python logging module with structured formatting or a lightweight structured logging package.

Do not introduce unnecessary infrastructure.

---

# 4. Architecture Principle

The backend must be modular but not overengineered.

Do not start with microservices.

Use a **modular monolith**.

Recommended deployment boundary:

```text
Frontend: Next.js
Backend: FastAPI
Database: Supabase PostgreSQL
Auth: Supabase Auth
Storage: Supabase Storage
External: Diamond Provider API
External: Payment Gateways
```

The backend must be independently deployable from the frontend.

---

# 5. Repository Structure

The project may use a monorepo:

```text
topup-platform/
├── apps/
│   ├── web/
│   └── api/
├── docs/
├── infra/
├── scripts/
├── .github/
├── .env.example
├── README.md
└── docker-compose.yml
```

Backend root:

```text
apps/api/
```

---

# 6. Recommended Backend Folder Structure

```text
apps/api/
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
│   │   ├── constants.py
│   │   └── middleware.py
│   │
│   ├── db/
│   │   ├── base.py
│   │   ├── session.py
│   │   ├── models.py
│   │   └── migrations/
│   │
│   ├── modules/
│   │   ├── users/
│   │   ├── roles/
│   │   ├── games/
│   │   ├── products/
│   │   ├── orders/
│   │   ├── payments/
│   │   ├── fulfillment/
│   │   ├── providers/
│   │   ├── payment_methods/
│   │   ├── settings/
│   │   ├── banners/
│   │   ├── audit/
│   │   └── admin/
│   │
│   ├── integrations/
│   │   ├── payments/
│   │   │   ├── base.py
│   │   │   ├── manual.py
│   │   │   └── gateways/
│   │   └── providers/
│   │       ├── base.py
│   │       ├── mock.py
│   │       └── adapters/
│   │
│   ├── workers/
│   │   ├── fulfillment.py
│   │   └── tasks.py
│   │
│   └── shared/
│       ├── enums.py
│       ├── money.py
│       ├── pagination.py
│       ├── time.py
│       └── utils.py
│
├── tests/
│   ├── unit/
│   ├── integration/
│   └── fixtures/
│
├── alembic.ini
├── pyproject.toml
├── Dockerfile
└── README.md
```

Exact file names can evolve when justified.

The separation of responsibilities must remain.

---

# 7. Module Structure

Recommended domain module pattern:

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

## model.py

SQLAlchemy ORM model.

## schema.py

Pydantic request/response models.

## repository.py

Database persistence/query logic.

## service.py

Business rules and orchestration.

## router.py

HTTP transport layer.

## exceptions.py

Domain-specific exceptions.

Do not put complex business logic inside routers.

---

# 8. API Versioning

Base API:

```text
/api/v1
```

Example:

```text
GET /api/v1/products
POST /api/v1/orders
GET /api/v1/me/orders
```

Admin:

```text
/api/v1/admin/*
```

Payment webhooks:

```text
/api/v1/webhooks/payments/*
```

Provider webhooks:

```text
/api/v1/webhooks/providers/*
```

---

# 9. Authentication

Use **Supabase Auth**.

Frontend authenticates with Supabase.

Backend receives the Supabase access token.

Backend must:

1. Extract bearer token.
2. Validate the token correctly.
3. Resolve authenticated user identity.
4. Load application profile/role information.
5. Apply authorization rules.

Never trust:

- user ID sent in request body
- role sent by frontend
- email sent by frontend as identity proof

Authenticated identity comes only from verified credentials.

---

# 10. Application Users and Profiles

Supabase Auth user and application profile are related but separate concepts.

Application profile stores business-specific information.

Example fields:

- id
- auth_user_id
- full_name
- phone
- avatar_url
- status
- created_at
- updated_at

Use a stable UUID-style primary key.

---

# 11. Role-Based Access Control

Initial roles:

- CUSTOMER
- SUPPORT
- ADMIN
- SUPER_ADMIN

## CUSTOMER

Can:

- view active products
- create own orders
- submit manual payment for own order
- view own payment status
- view own order history
- update allowed profile fields

## SUPPORT

Can:

- inspect relevant orders
- view payment details as allowed
- assist operational review
- add internal notes if implemented

Cannot:

- manage sensitive provider secrets
- change system-level security settings
- grant privileged roles

## ADMIN

Can:

- manage products
- manage orders
- approve/reject manual payments
- retry failed fulfillment where allowed
- manage payment methods
- manage banners/site settings
- inspect customers
- inspect audit logs

## SUPER_ADMIN

Can:

- perform all admin operations
- manage privileged roles
- manage sensitive integration configuration
- enable/disable providers
- manage system-level settings

Authorization must be enforced on backend endpoints and services.

---

# 12. Database Security

Use least privilege.

Supabase service-role credentials must never be exposed to frontend.

If direct Supabase access exists for limited frontend use, use appropriate RLS.

Financial/order business operations should go through FastAPI.

Database constraints must enforce important invariants where possible.

---

# 13. Core Domain Entities

Core tables conceptually include:

- profiles
- roles
- user_roles
- games
- topup_products
- orders
- payments
- payment_attempts
- payment_methods
- provider_orders
- order_status_history
- provider_configs
- banners
- site_settings
- audit_logs

Additional technical tables may be added where necessary.

---

# 14. Games

Although MVP is Free Fire, avoid hardcoding the entire database around one game.

Table:

```text
games
```

Conceptual fields:

- id
- name
- slug
- logo_url
- active
- created_at
- updated_at

Initial game:

```text
Free Fire
slug: free-fire
```

Do not implement multi-game business logic beyond what is needed for clean architecture.

---

# 15. Top-Up Products

Table:

```text
topup_products
```

Conceptual fields:

- id
- game_id
- name
- slug
- diamond_amount
- bonus_amount
- provider_sku
- selling_price
- provider_cost
- currency
- active
- featured
- sort_order
- metadata
- created_at
- updated_at

Rules:

- selling price is authoritative on backend
- provider cost is private/admin-only
- product can be disabled
- historical orders must remain valid if product changes later

---

# 16. Money Handling

Never use floating point for money.

Use:

- PostgreSQL `NUMERIC`
- Python `Decimal`

Currency:

```text
BDT
```

Never trust monetary values sent from frontend.

Frontend sends:

```text
product_id
```

Backend loads the product and determines authoritative price.

---

# 17. Order Creation

Correct flow:

1. Authenticate customer.
2. Validate requested product.
3. Ensure product is active.
4. Validate required player/account fields.
5. Load official price.
6. Snapshot relevant product data.
7. Create order.
8. Create initial payment state.
9. Return public order reference.

Frontend should not create final amount authority.

---

# 18. Orders Table

Conceptual fields:

- id
- public_order_id
- user_id
- game_id
- product_id
- product_name_snapshot
- product_sku_snapshot
- diamond_amount_snapshot
- selling_price_snapshot
- player_uid
- player_server
- quantity
- total_amount
- currency
- order_status
- payment_status
- fulfillment_status
- created_at
- updated_at
- completed_at
- cancelled_at

Avoid relying on mutable product values after order creation.

---

# 19. Public Order ID

Do not expose sequential DB IDs to customers.

Use a separate public reference.

Example:

```text
FF-260817-A7K4P
```

The exact algorithm may be finalized during implementation.

Requirements:

- unique
- non-sequential
- customer-friendly
- safe to expose publicly

---

# 20. Order Status

Possible normalized values:

- PENDING_PAYMENT
- PAYMENT_SUBMITTED
- PAYMENT_VERIFIED
- PROCESSING
- COMPLETED
- FAILED
- CANCELLED
- REFUNDED

---

# 21. Payment Status

Possible values:

- PENDING
- SUBMITTED
- VERIFYING
- VERIFIED
- REJECTED
- FAILED
- REFUNDED

---

# 22. Fulfillment Status

Possible values:

- NOT_STARTED
- QUEUED
- PROCESSING
- COMPLETED
- FAILED
- RETRYING

---

# 23. Separate State Machines

Do not use one ambiguous status for everything.

Maintain separate:

- order status
- payment status
- fulfillment status

Example:

Payment can be:

```text
VERIFIED
```

while fulfillment can be:

```text
FAILED
```

This is a valid situation.

The customer paid successfully, but the provider failed.

---

# 24. State Transition Rules

State transitions must be controlled by services.

Do not allow arbitrary status updates from generic endpoints.

Example invalid transition:

```text
COMPLETED -> PENDING_PAYMENT
```

Example valid flow:

```text
PENDING_PAYMENT
-> PAYMENT_SUBMITTED
-> PAYMENT_VERIFIED
-> PROCESSING
-> COMPLETED
```

Failure paths must also be explicit.

---

# 25. Order Status History

Table:

```text
order_status_history
```

Conceptual fields:

- id
- order_id
- status_type
- previous_status
- new_status
- reason
- changed_by
- metadata
- created_at

Track important lifecycle changes.

Do not silently overwrite transaction history.

---

# 26. Manual Payment System

Initial supported methods:

- bKash
- Nagad
- Rocket

Flow:

```text
Customer creates order
-> backend returns payment instructions
-> customer sends money manually
-> customer submits transaction info
-> payment status becomes SUBMITTED
-> admin reviews
-> admin approves or rejects
```

After approval:

```text
payment_status = VERIFIED
```

Then fulfillment is triggered automatically.

---

# 27. Manual Payment Submission

Conceptual request:

- order_id
- transaction_id
- sender_number if required
- proof file/reference if supported

Backend must validate:

- authenticated user owns order
- order is in correct state
- method is enabled
- payment has not already been successfully submitted/verified
- transaction ID format if reasonable
- duplicate transaction ID protections

---

# 28. Payment Proof Storage

Use **Supabase Storage**.

Private bucket concept:

```text
payment-proofs
```

Rules:

- not public
- validate file type
- validate file size
- generate controlled object path
- store only safe reference in database
- use signed/authorized access

Do not trust client-provided object paths blindly.

---

# 29. Payments Table

Conceptual fields:

- id
- order_id
- payment_type
- payment_method
- gateway
- amount
- currency
- transaction_id
- sender_number
- proof_path
- status
- submitted_at
- verified_at
- verified_by
- rejection_reason
- created_at
- updated_at

Use database constraints where appropriate.

---

# 30. Duplicate Transaction Protection

A transaction ID should not verify multiple orders accidentally.

Use appropriate uniqueness rules.

Important nuance:

Do not assume all external payment systems have globally unique transaction ID semantics without checking provider documentation.

Design constraints so they can be adapted safely.

---

# 31. Manual Payment Approval

Admin approval flow:

1. Authenticate admin.
2. Authorize action.
3. Load payment/order with concurrency protection.
4. Ensure status is still reviewable.
5. Verify order/payment amount consistency.
6. Mark payment VERIFIED.
7. Record verified_by and timestamp.
8. Update order state.
9. Write audit log.
10. Create/queue fulfillment.
11. Commit transaction safely.

Do not trigger duplicate fulfillment.

---

# 32. Manual Payment Rejection

Admin rejection:

1. Validate admin permission.
2. Confirm payment is reviewable.
3. Require rejection reason where policy expects it.
4. Mark payment REJECTED.
5. Update appropriate order state.
6. Write audit log.
7. Return normalized result.

Do not delete the rejected payment record.

---

# 33. Automatic Payment Architecture

Do not hardcode checkout around one gateway.

Create a generic interface.

Concept:

```python
class PaymentGateway:
    async def initiate_payment(...): ...
    async def verify_payment(...): ...
    async def query_transaction(...): ...
    async def handle_callback(...): ...
    async def handle_webhook(...): ...
```

Implementations may include:

```text
ManualPaymentGateway
SSLCommerzGateway
BkashGateway
NagadGateway
```

Exact interface can evolve.

The abstraction itself is mandatory.

---

# 34. Payment Attempts

Table:

```text
payment_attempts
```

Conceptual fields:

- id
- payment_id
- gateway
- gateway_session_id
- gateway_transaction_id
- attempt_number
- status
- request_reference
- response_reference
- created_at
- updated_at

Do not store secrets in request/response snapshots.

Sanitize sensitive data before persistence/logging.

---

# 35. Automatic Payment Rules

Payment success must never be determined only from frontend redirect.

Backend must validate:

- order
- amount
- currency
- gateway transaction identity
- gateway validation result
- payment state
- duplicate callbacks

Callbacks and webhooks must be idempotent.

---

# 36. Payment Webhook Security

For gateways supporting webhooks/IPN:

- validate origin according to provider documentation
- validate signature/token if supported
- verify transaction independently where required
- compare amount and currency
- protect against replay
- make handler idempotent
- log sanitized event reference
- return gateway-appropriate response

Never trust raw webhook body without verification.

---

# 37. Diamond Provider Architecture

The actual diamond provider may change.

Create a provider abstraction.

Concept:

```python
class TopupProvider:
    async def submit_topup(...): ...
    async def get_order_status(...): ...
    async def validate_product(...): ...
    async def handle_webhook(...): ...
```

Possible implementations:

```text
MockTopupProvider
ProviderAAdapter
ProviderBAdapter
```

Core order/payment services must not depend directly on raw provider responses.

---

# 38. Provider Request Data

Provider request may include:

- player UID
- server/region if required
- provider SKU
- client reference
- quantity
- provider-required metadata

Do not invent provider-required fields before documentation is available.

---

# 39. Provider Order Table

Table:

```text
provider_orders
```

Conceptual fields:

- id
- order_id
- provider
- provider_sku
- provider_order_id
- client_reference
- status
- attempt_count
- last_error_code
- last_error_message
- request_reference
- response_reference
- submitted_at
- completed_at
- created_at
- updated_at

Store sanitized response references or safe metadata only.

---

# 40. Provider Status Normalization

Provider-specific statuses must map into internal normalized fulfillment statuses.

Example:

Provider:

```text
accepted
processing
success
failed
```

Internal:

```text
QUEUED
PROCESSING
COMPLETED
FAILED
```

Frontend should never depend on raw provider status names.

---

# 41. Provider Fulfillment Flow

After verified payment:

```text
Payment VERIFIED
-> Fulfillment QUEUED
-> Provider request submitted
-> Fulfillment PROCESSING
-> Provider confirms completion
-> Fulfillment COMPLETED
-> Order COMPLETED
```

Failure:

```text
Payment VERIFIED
-> Fulfillment PROCESSING
-> Provider error
-> Fulfillment FAILED
```

Payment remains verified.

---

# 42. Idempotency

Critical operations must be idempotent.

Especially:

- payment webhooks
- provider webhooks
- fulfillment submission
- fulfillment retry
- payment initiation
- sensitive admin actions where relevant

Before sending a provider top-up request, ensure the same order has not already been successfully submitted.

Never allow duplicate diamond delivery because a request was retried.

---

# 43. Concurrency Safety

Potential concurrency scenarios:

- two admins approve same payment
- two webhook deliveries arrive simultaneously
- two workers process same order
- customer submits payment twice
- retry action overlaps existing provider call

Protect using:

- DB transactions
- constraints
- conditional updates
- row-level locking where appropriate
- idempotency keys
- unique references
- state checks

Do not rely on frontend button disabling.

---

# 44. Database Transactions

Financial/order state changes that must be atomic should run in a database transaction.

Examples:

- payment approval + order update + audit record
- payment webhook verification + state update
- fulfillment creation + state transition
- role assignment changes

Do not split critical state transitions across unrelated commits without reason.

---

# 45. Retry Strategy

Retry only temporary failures.

Potential temporary failures:

- network timeout
- provider unavailable
- HTTP 5xx
- temporary gateway issue

Potential permanent failures:

- invalid UID
- invalid SKU
- rejected account
- unsupported product

Do not blindly retry permanent errors.

Maintain attempt history.

---

# 46. Background Jobs

Provider fulfillment should not depend on keeping an HTTP request open.

The architecture must support background processing.

For MVP, keep infrastructure lightweight.

Create a worker/task abstraction.

Concept:

```text
FulfillmentJob
```

Possible implementation stages:

1. Simple controlled background task for development.
2. PostgreSQL-backed job table or lightweight queue.
3. Redis-based worker if scale/operational need justifies it.

Do not introduce Redis/Celery on day one unless necessary.

But code must not tightly couple fulfillment to HTTP request lifecycle.

---

# 47. Job Reliability

Business-critical jobs require:

- unique job reference
- retry count
- next retry time if used
- failure reason
- processing state
- idempotent handler

If using a database-backed worker pattern, avoid losing jobs on process restart.

---

# 48. Product Validation

Backend validates product:

- exists
- active
- belongs to correct game
- provider mapping exists where required
- current selling price
- allowed quantity

Do not rely on frontend product data.

---

# 49. UID Validation

Do only safe generic validation until provider requirements are known.

Do not invent a fixed UID length or format without provider documentation.

Provider adapters may apply additional validation.

---

# 50. Payment Methods

Table:

```text
payment_methods
```

Conceptual fields:

- id
- name
- code
- type
- account_number
- account_type
- instructions
- logo_url
- active
- sort_order
- metadata
- created_at
- updated_at

Payment method types may include:

```text
MANUAL
GATEWAY
```

Frontend should receive only public-safe fields.

---

# 51. Sensitive Configuration

Provider/payment secrets must not be stored in ordinary public settings tables.

Use:

- environment variables
- deployment secret manager
- secure encrypted configuration only if later approved

Examples:

- provider API keys
- gateway store secrets
- service-role key

Never return these in API responses.

---

# 52. Site Settings

Table:

```text
site_settings
```

Potential public-safe settings:

- site title
- support phone
- WhatsApp
- Facebook URL
- logo
- announcement
- maintenance mode
- payment instructions

Do not turn site settings into arbitrary secret storage.

---

# 53. Banners

Table:

```text
banners
```

Conceptual fields:

- id
- title
- subtitle
- image_url/path
- link_url
- active
- sort_order
- created_at
- updated_at

Keep CMS scope simple.

---

# 54. Audit Logs

Important admin/business actions must be audited.

Examples:

- payment approved
- payment rejected
- product created
- product price changed
- payment method changed
- provider mapping changed
- fulfillment retried
- user role changed
- important settings changed

Table:

```text
audit_logs
```

Conceptual fields:

- id
- actor_id
- action
- entity_type
- entity_id
- metadata
- request_id
- ip_address if appropriate
- user_agent if appropriate
- created_at

Audit logs should be append-only from application perspective.

---

# 55. Admin APIs

Recommended admin endpoints:

```text
GET    /api/v1/admin/dashboard

GET    /api/v1/admin/orders
GET    /api/v1/admin/orders/{order_id}

GET    /api/v1/admin/payments
GET    /api/v1/admin/payments/{payment_id}
POST   /api/v1/admin/payments/{payment_id}/approve
POST   /api/v1/admin/payments/{payment_id}/reject

GET    /api/v1/admin/products
POST   /api/v1/admin/products
PATCH  /api/v1/admin/products/{product_id}

GET    /api/v1/admin/customers
GET    /api/v1/admin/customers/{customer_id}

GET    /api/v1/admin/payment-methods
PATCH  /api/v1/admin/payment-methods/{payment_method_id}

GET    /api/v1/admin/providers
POST   /api/v1/admin/orders/{order_id}/retry-fulfillment

GET    /api/v1/admin/banners
POST   /api/v1/admin/banners
PATCH  /api/v1/admin/banners/{banner_id}

GET    /api/v1/admin/settings
PATCH  /api/v1/admin/settings

GET    /api/v1/admin/audit-logs
```

Exact endpoint shape should remain RESTful and consistent.

---

# 56. Customer APIs

Recommended:

```text
GET    /api/v1/products
GET    /api/v1/payment-methods

POST   /api/v1/orders
GET    /api/v1/orders/{public_order_id}
GET    /api/v1/me/orders

POST   /api/v1/orders/{public_order_id}/manual-payment

GET    /api/v1/me/profile
PATCH  /api/v1/me/profile
```

Only return data the authenticated customer is allowed to see.

---

# 57. Pagination

Use server-side pagination.

Create a consistent response shape.

Example:

```json
{
  "items": [],
  "page": 1,
  "page_size": 20,
  "total": 0,
  "total_pages": 0
}
```

Do not fetch entire large tables.

---

# 58. Filtering and Search

Admin list endpoints may support:

- order ID
- UID
- payment status
- fulfillment status
- order status
- date range
- customer
- product

Queries must be parameterized through ORM/query builder.

Never build unsafe SQL from raw query parameters.

---

# 59. Error Response Standard

Use consistent errors.

Concept:

```json
{
  "error": {
    "code": "PAYMENT_NOT_VERIFIED",
    "message": "Payment must be verified before fulfillment.",
    "details": null
  }
}
```

Do not expose:

- stack traces
- SQL errors
- secrets
- raw provider credentials
- internal filesystem paths

---

# 60. Domain Errors

Create meaningful domain exception classes.

Examples:

- ProductNotFound
- ProductInactive
- OrderNotFound
- InvalidOrderState
- PaymentAlreadySubmitted
- PaymentAlreadyVerified
- DuplicateTransaction
- PaymentVerificationConflict
- FulfillmentAlreadyCompleted
- ProviderTemporaryError
- ProviderPermanentError
- UnauthorizedAction

Map domain errors to consistent HTTP responses.

---

# 61. Request IDs / Correlation

Every request should have a request/correlation identifier.

Include it in structured logs.

Return safe request ID in server-error responses if useful.

This helps trace:

```text
order -> payment -> fulfillment -> provider request
```

---

# 62. Logging

Structured logs should cover:

- request start/end
- authentication failure
- order creation
- payment submission
- payment approval/rejection
- webhook receipt
- payment verification
- fulfillment queued
- provider request
- provider response outcome
- retry
- order completion
- unexpected exception

Never log:

- passwords
- access tokens
- API secrets
- full sensitive payloads
- service-role keys

Mask sensitive values.

---

# 63. Rate Limiting

Apply rate limiting where abuse is meaningful.

Candidates:

- login-related backend endpoints if any
- order creation
- payment submission
- webhook endpoints according to design
- expensive public endpoints
- retry actions

Do not add complicated distributed rate limiting prematurely.

Design middleware/service so production strategy can evolve.

---

# 64. CORS

Allow only approved frontend origins in production.

Do not use unrestricted CORS in production.

Development may allow local frontend origins.

---

# 65. Input Validation

All API request bodies/query parameters must use typed Pydantic validation.

Validate:

- strings
- lengths
- enums
- pagination
- UUIDs/public IDs
- monetary fields where accepted
- URLs
- upload metadata

Do not accept arbitrary unvalidated dictionaries for core business operations.

---

# 66. Output Schemas

Use explicit response schemas.

Do not return ORM entities directly without controlled serialization.

Separate:

- public product response
- admin product response
- customer order response
- admin order response

Avoid leaking private fields.

---

# 67. Time Handling

Store timestamps in UTC.

Use timezone-aware datetimes.

Business display timezone can be Bangladesh on frontend/configuration.

Backend should avoid naive datetime usage.

---

# 68. Soft Delete / Deactivation

Transactional data should not be hard-deleted.

Do not hard-delete:

- orders
- payments
- provider orders
- audit logs

Products/payment methods should usually be deactivated rather than deleted after use.

---

# 69. Database Indexing

Add indexes based on real query patterns.

Likely candidates:

- public_order_id
- user_id
- product_id
- created_at
- order_status
- payment_status
- fulfillment_status
- payment transaction ID
- provider order ID
- audit actor/entity fields

Avoid adding indexes blindly.

---

# 70. Database Constraints

Use constraints for critical invariants.

Examples:

- non-negative amounts
- valid currency length
- unique public order reference
- unique provider client reference
- appropriate transaction ID uniqueness
- required foreign keys
- not-null on critical fields

Application validation and database constraints should complement each other.

---

# 71. Migrations

Use Alembic.

All schema changes must be migration-driven.

Do not rely on manual production edits.

Migrations should include:

- tables
- indexes
- constraints
- enum strategy if used
- data migration when required

---

# 72. Enum Strategy

Be deliberate with enums.

Options:

- PostgreSQL enum
- string columns with application validation
- lookup/reference tables

Choose a strategy that supports safe migrations.

Do not create fragile enum migrations casually.

---

# 73. Database Session Rules

Use short-lived async DB sessions.

Do not keep sessions globally.

Use dependency injection.

Transactions should be explicit for critical operations.

---

# 74. HTTP Client

Use **HTTPX** for provider/gateway APIs.

Configure:

- timeout
- connection limits where appropriate
- retries only through controlled logic
- error mapping
- request correlation

Never call external APIs without timeout.

---

# 75. External API Timeouts

Every provider/gateway call requires explicit timeout.

Different operations may use different timeouts.

Do not allow requests to hang indefinitely.

---

# 76. External API Error Mapping

Map raw integration errors into domain errors.

Example:

```text
HTTPX timeout
-> ProviderTemporaryError
```

```text
provider says invalid UID
-> ProviderPermanentError
```

Do not leak raw external exceptions to clients.

---

# 77. Mock Provider

Before real provider credentials exist, implement:

```text
MockTopupProvider
```

It should simulate:

- immediate success
- processing
- temporary failure
- permanent failure
- timeout

Behavior should be configurable in development/test.

---

# 78. Mock Payment Gateway

Before automatic gateway credentials exist, support a mock gateway for development/test.

Do not mix mock gateway logic with production implementation.

---

# 79. Health Endpoints

Provide:

```text
GET /health
GET /ready
```

Concept:

- `/health`: process alive
- `/ready`: required dependencies available

Do not expose sensitive environment details.

---

# 80. API Documentation

FastAPI-generated OpenAPI documentation should remain useful.

Use:

- descriptions
- typed schemas
- tags
- examples where helpful

Production docs exposure can later be configured.

---

# 81. Testing Strategy

Use Pytest.

Tests should cover:

## Unit

- state transition logic
- price calculation
- payment rules
- provider mapping
- permission checks
- retry decision logic

## Integration

- database repositories
- API endpoints
- authentication dependency
- admin actions
- transaction behavior

## External Integration Tests

Mock external provider/gateway.

Never make real paid top-up calls in automated test suite.

---

# 82. Critical Backend Test Cases

Mandatory tests:

1. Customer creates order with active product.
2. Customer cannot control final price.
3. Customer cannot order inactive product.
4. Customer cannot view another customer's order.
5. Customer can submit manual payment for own valid order.
6. Duplicate transaction handling works.
7. Customer cannot approve own payment.
8. Support/admin permissions are enforced.
9. Two admins cannot approve same payment twice.
10. Payment approval creates exactly one fulfillment process.
11. Provider temporary failure is retryable.
12. Provider permanent failure is not blindly retried.
13. Completed fulfillment cannot be duplicated.
14. Duplicate webhook is idempotent.
15. Automatic payment amount mismatch is rejected.
16. Audit log is written for privileged actions.
17. Provider secrets never appear in public API.
18. Admin-only product cost is hidden from customer APIs.

---

# 83. Environment Configuration

Conceptual backend environment:

```text
APP_ENV=
APP_NAME=
APP_URL=
FRONTEND_URL=

DATABASE_URL=

SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SUPABASE_JWT_AUDIENCE=
SUPABASE_STORAGE_BUCKET_PAYMENT_PROOFS=

PROVIDER_NAME=
PROVIDER_API_BASE_URL=
PROVIDER_API_KEY=

PAYMENT_GATEWAY_ENABLED=
PAYMENT_GATEWAY_NAME=
PAYMENT_GATEWAY_STORE_ID=
PAYMENT_GATEWAY_SECRET=

LOG_LEVEL=
```

Exact variables should depend on implemented integrations.

Never commit actual secrets.

---

# 84. Configuration Rules

Use typed settings.

Fail fast when required production configuration is missing.

Do not silently fall back to insecure defaults in production.

---

# 85. Development Environments

Support:

- local
- staging
- production
- test

Environment-specific credentials must be separate.

---

# 86. Feature Flags

Useful flags:

```text
MANUAL_PAYMENT_ENABLED=true
AUTOMATIC_PAYMENT_ENABLED=false
MOCK_PROVIDER_ENABLED=true
```

Do not let frontend alone decide feature availability.

Backend configuration is authoritative.

---

# 87. Payment Mode Migration

Initial:

```text
MANUAL
```

Future:

```text
GATEWAY
```

Core order model must not need redesign.

Payment type/provider details belong in payment domain.

---

# 88. Provider Migration

Provider should be replaceable through adapter/configuration.

Changing provider should not require rewriting:

- order domain
- payment domain
- customer history
- admin order APIs

---

# 89. Admin Dashboard Data

Backend should provide useful aggregated metrics.

Examples:

- orders today
- revenue today
- pending payments
- processing fulfillment
- failed fulfillment
- completed today

Avoid expensive unindexed aggregation.

Use appropriate queries.

---

# 90. Customer Order Response

Customer response should include safe fields such as:

- public order ID
- product snapshot
- amount
- player UID
- order status
- payment status
- fulfillment status
- created date
- completed date
- safe payment information

Do not expose:

- provider cost
- provider API raw data
- admin notes unless intended
- internal IDs unnecessarily
- secret config

---

# 91. Admin Order Response

Admin may receive expanded operational fields:

- customer
- payment detail
- provider state
- retry state
- status history
- internal notes
- audit reference where appropriate

Still do not expose secrets.

---

# 92. Internal Notes

If implemented:

- internal notes are admin/support only
- not returned to customer
- include author and timestamp
- do not overwrite previous notes silently

---

# 93. Maintenance Mode

Backend/site settings may expose maintenance state.

When enabled:

- public read-only endpoints may still work
- order creation/payment actions may be blocked according to business policy
- admin remains accessible

Do not implement destructive shutdown behavior.

---

# 94. Security Checklist

Mandatory:

- validate JWT
- enforce RBAC
- validate ownership
- validate all inputs
- use Decimal
- server-authoritative pricing
- DB constraints
- transactional state changes
- idempotency
- webhook verification
- external API timeout
- secret protection
- safe logging
- CORS restrictions
- private payment proof storage
- rate limiting where useful
- no stack trace leakage

---

# 95. Do Not Build Yet

Do not implement without explicit approval:

- wallet
- affiliate program
- referral system
- reseller panel
- loyalty points
- coupon engine
- multi-vendor system
- crypto payment
- complex microservices
- Kafka
- Kubernetes
- blockchain
- AI features
- multi-provider smart routing
- automatic refunds
- multi-game business UI

Architecture may remain compatible with future expansion.

---

# 96. Non-Goals

Do not overengineer:

- CQRS
- event sourcing
- distributed transactions
- service mesh
- complex message brokers
- unnecessary caching layers

This is a focused top-up platform.

Reliability matters more than architecture complexity.

---

# 97. Coding Rules

The coding agent must:

1. Use FastAPI.
2. Use async SQLAlchemy appropriately.
3. Keep routers thin.
4. Keep business logic in services.
5. Keep DB access in repositories where beneficial.
6. Use typed Pydantic schemas.
7. Use Decimal for money.
8. Use UTC-aware timestamps.
9. Use explicit transactions for critical workflows.
10. Add tests with each critical feature.
11. Never expose secrets.
12. Never trust frontend price/status.
13. Never invent provider rules.
14. Never invent payment verification logic.
15. Maintain migration history.
16. Maintain API consistency.
17. Keep integration adapters isolated.
18. Avoid giant utility files.
19. Avoid circular imports.
20. Avoid global mutable state.

---

# 98. Implementation Order Principle

Do not implement the backend as one giant generation.

Build phase-by-phase:

1. Foundation
2. Database
3. Auth
4. RBAC
5. Products
6. Orders
7. Manual Payments
8. Admin Verification
9. Provider Abstraction
10. Fulfillment
11. Admin APIs
12. Settings
13. Audit
14. Automatic Payment Foundation
15. Webhooks
16. Reliability
17. Testing
18. Production Hardening

A detailed phase plan exists separately.

---

# 99. Definition of Done

Backend is production-ready only when:

- FastAPI starts cleanly
- database migrations run
- Supabase Auth verification works
- RBAC works
- product APIs work
- order creation is server-authoritative
- manual payment works
- admin payment verification works
- provider abstraction works
- fulfillment is idempotent
- customer order history works
- admin APIs work
- audit logs work
- errors are standardized
- external calls have timeouts
- tests cover critical flows
- secrets are protected
- staging/production config is documented

---

# 100. Final Architecture Summary

```text
                    NEXT.JS FRONTEND
                           │
                           ▼
                     FASTAPI API
                           │
          ┌────────────────┼────────────────┐
          │                │                │
          ▼                ▼                ▼
    SUPABASE AUTH      POSTGRESQL      STORAGE
                           │
                ┌──────────┴──────────┐
                │                     │
                ▼                     ▼
          PAYMENT DOMAIN       ORDER DOMAIN
                │                     │
                └──────────┬──────────┘
                           ▼
                    FULFILLMENT DOMAIN
                           │
                           ▼
                   PROVIDER ADAPTER
                           │
                           ▼
                  DIAMOND PROVIDER API
```

Automatic payment adds gateway adapters beside manual payment without changing the core order/fulfillment model.

---

# 101. Single Source of Truth

For backend implementation, this document is the **single source of truth** unless a newer explicit project instruction replaces a section.

Do not hallucinate:

- provider API fields
- payment gateway fields
- UID rules
- database requirements
- permissions
- business features

When real provider/gateway documentation becomes available, implement it through the existing adapter architecture rather than rewriting the core domain.
