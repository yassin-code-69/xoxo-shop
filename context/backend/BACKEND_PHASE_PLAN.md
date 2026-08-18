# Backend Implementation Phase Plan
## Free Fire Diamond Top-Up Platform

> This document defines the backend execution sequence.
>
> The AI coding agent must complete work **phase-by-phase** and must read `BACKEND_MASTER_CONTEXT.md` before starting any phase.

---

# Global Execution Rules

Before starting a phase:

1. Read `BACKEND_MASTER_CONTEXT.md`.
2. Inspect existing backend code.
3. Read the current phase completely.
4. Do not rewrite working architecture without a documented reason.
5. Do not skip required migrations.
6. Do not invent provider/payment API contracts.
7. Use mocks where external credentials/documentation are unavailable.
8. Add or update tests for critical business behavior.
9. Run verification after the phase.
10. Do not start unrelated future features.

At the end of every phase, report:

- completed work
- files created
- files modified
- migrations
- tests
- verification result
- known issues

---

# Phase 0 — Backend Project Foundation

## Goal

Create a clean FastAPI application foundation.

## Tasks

### 0.1 Initialize Backend

Set up:

- Python project
- FastAPI
- Uvicorn
- Pydantic
- pydantic-settings
- SQLAlchemy
- async PostgreSQL driver
- Alembic
- HTTPX
- Pytest

### 0.2 Package Configuration

Create:

```text
pyproject.toml
```

Define:

- dependencies
- dev dependencies
- test configuration where appropriate

### 0.3 App Structure

Create:

```text
app/
├── main.py
├── api/
├── core/
├── db/
├── modules/
├── integrations/
├── workers/
└── shared/
```

### 0.4 Base Configuration

Create typed settings.

### 0.5 Health Routes

Add:

```text
GET /health
GET /ready
```

### 0.6 Error Foundation

Create base application/domain exception handling.

### 0.7 Logging Foundation

Add structured logging.

### 0.8 Request ID

Add request correlation ID middleware.

### 0.9 Verification

Confirm:

- app boots
- docs load in development
- tests run
- configuration loads

## Deliverable

Stable backend skeleton without business features.

---

# Phase 1 — Database Connection & Migration Foundation

## Goal

Connect FastAPI to Supabase PostgreSQL safely.

## Tasks

### 1.1 Async SQLAlchemy Engine

Configure:

- engine
- session factory
- dependency

### 1.2 Database Base

Create declarative base / model registration strategy.

### 1.3 Alembic

Initialize migrations.

### 1.4 Migration Environment

Make Alembic aware of models.

### 1.5 Timestamp Conventions

Standardize:

- created_at
- updated_at
- UTC-aware timestamps

### 1.6 Base Model Utilities

Create only useful shared model helpers.

### 1.7 Database Health

`/ready` may check database connectivity.

## Deliverable

Database and migration pipeline works.

---

# Phase 2 — Shared Domain Types & Utilities

## Goal

Create foundational types before business models.

## Tasks

### 2.1 Status Enums

Define:

- OrderStatus
- PaymentStatus
- FulfillmentStatus
- PaymentType
- RoleCode

### 2.2 Money Utility

Create Decimal-safe helpers.

### 2.3 Pagination

Create:

- pagination request schema
- standard paginated response

### 2.4 Time Utilities

Use UTC-aware time helpers.

### 2.5 Public ID Strategy

Define order reference generator interface.

### 2.6 Common Error Codes

Define stable application error codes.

## Deliverable

Shared primitives are consistent across modules.

---

# Phase 3 — User Profiles & Supabase Auth Verification

## Goal

Establish trusted user identity.

## Tasks

### 3.1 Supabase Auth Verification

Implement token verification.

### 3.2 Authentication Dependency

Create:

```text
get_current_user
```

or equivalent typed dependency.

### 3.3 Profile Model

Create `profiles`.

### 3.4 Profile Creation/Sync Strategy

Define how authenticated Supabase user receives application profile.

Options may include:

- lazy profile creation
- explicit registration hook

Choose one consistent approach.

### 3.5 Customer Profile APIs

Add:

```text
GET /api/v1/me/profile
PATCH /api/v1/me/profile
```

### 3.6 Tests

Test:

- valid token
- invalid token
- missing token
- customer profile access

## Deliverable

Backend can reliably identify authenticated users.

---

# Phase 4 — Roles & RBAC

## Goal

Implement backend-enforced authorization.

## Tasks

### 4.1 Role Models

Create:

- roles
- user_roles

### 4.2 Seed Initial Roles

Seed:

- CUSTOMER
- SUPPORT
- ADMIN
- SUPER_ADMIN

### 4.3 Authorization Dependencies

Create helpers such as:

```text
require_roles(...)
```

### 4.4 Service-Level Permission Checks

Do not rely only on router dependencies.

Critical services should also validate assumptions where necessary.

### 4.5 Role Tests

Test all role boundaries.

### 4.6 Admin Bootstrapping

Document safe method for initial SUPER_ADMIN assignment.

Do not hardcode production admin credentials.

## Deliverable

RBAC is operational.

---

# Phase 5 — Games & Product Catalog

## Goal

Create backend product catalog.

## Tasks

### 5.1 Games Model

Create `games`.

### 5.2 Products Model

Create `topup_products`.

### 5.3 Migrations

Add:

- constraints
- indexes
- foreign keys

### 5.4 Public Product APIs

Add:

```text
GET /api/v1/products
GET /api/v1/products/{slug-or-id}
```

Return only public-safe data.

### 5.5 Admin Product APIs

Add:

```text
GET /api/v1/admin/products
POST /api/v1/admin/products
PATCH /api/v1/admin/products/{id}
```

### 5.6 Product Rules

Validate:

- active
- price
- provider SKU
- diamond amount
- sort order

### 5.7 Tests

Test public/admin response separation.

## Deliverable

Admins manage packages; customers can browse active packages.

---

# Phase 6 — Payment Methods Configuration

## Goal

Create configurable manual payment methods.

## Tasks

### 6.1 Payment Method Model

Create `payment_methods`.

### 6.2 Initial Types

Support:

- MANUAL
- GATEWAY

### 6.3 Public API

Add:

```text
GET /api/v1/payment-methods
```

Return enabled public-safe methods only.

### 6.4 Admin APIs

Add:

```text
GET /api/v1/admin/payment-methods
PATCH /api/v1/admin/payment-methods/{id}
```

Create endpoint if required.

### 6.5 Seed Manual Methods

Optionally seed:

- bKash
- Nagad
- Rocket

Use placeholder data, not real credentials.

### 6.6 Tests

Test enabled/disabled visibility.

## Deliverable

Payment methods are configurable from admin.

---

# Phase 7 — Order Domain & State Machine

## Goal

Create reliable order model before payments.

## Tasks

### 7.1 Order Model

Create `orders`.

### 7.2 Snapshot Fields

Persist:

- product name
- price
- diamond amount
- relevant SKU snapshot

### 7.3 Public Order ID

Implement unique generator.

### 7.4 Order State Service

Create valid transition rules.

### 7.5 History Model

Create `order_status_history`.

### 7.6 Order Repository

Create:

- customer list
- admin list
- lookup by public ID
- locking query where needed

### 7.7 Order Creation Service

Rules:

- authenticated customer
- active product
- official price
- valid payment method
- generic UID validation

### 7.8 Customer APIs

Add:

```text
POST /api/v1/orders
GET /api/v1/orders/{public_order_id}
GET /api/v1/me/orders
```

### 7.9 Tests

Mandatory:

- price cannot be controlled by frontend
- inactive product rejected
- order ownership enforced
- snapshot preserved
- invalid transition rejected

## Deliverable

Order system is authoritative and auditable.

---

# Phase 8 — Manual Payment Domain

## Goal

Allow customers to submit manual payments.

## Tasks

### 8.1 Payment Model

Create `payments`.

### 8.2 Manual Payment Schema

Define request fields.

### 8.3 Payment Submission Service

Validate:

- ownership
- order state
- enabled payment method
- transaction ID
- duplicate submission

### 8.4 Transaction ID Protection

Add appropriate DB/index constraint.

### 8.5 Payment State Service

Centralize state transitions.

### 8.6 API

Add:

```text
POST /api/v1/orders/{public_order_id}/manual-payment
```

### 8.7 Order State Update

On successful submission:

```text
payment_status = SUBMITTED
order_status = PAYMENT_SUBMITTED
```

### 8.8 Tests

Test:

- ownership
- disabled payment method
- duplicate transaction
- duplicate submission
- invalid order state

## Deliverable

Manual payment submission works safely.

---

# Phase 9 — Payment Proof Storage

## Goal

Securely support screenshot evidence.

## Tasks

### 9.1 Storage Service

Create Supabase Storage integration abstraction.

### 9.2 Private Bucket

Use:

```text
payment-proofs
```

### 9.3 Validation

Validate:

- image MIME
- extension where relevant
- file size
- object path

### 9.4 Safe Naming

Generate backend-controlled storage path.

### 9.5 Access

Create controlled access/signed URL flow for admins/customer where required.

### 9.6 Cleanup

Define behavior if DB save fails after upload.

### 9.7 Tests

Mock storage service.

## Deliverable

Payment proof upload is private and controlled.

---

# Phase 10 — Admin Manual Payment Verification

## Goal

Implement the core operational payment approval flow.

## Tasks

### 10.1 Admin Payment List

Add:

```text
GET /api/v1/admin/payments
GET /api/v1/admin/payments/{id}
```

### 10.2 Filtering

Support:

- status
- method
- date
- order ID

### 10.3 Approval Service

Use DB transaction.

Validate:

- admin role
- current payment state
- order state
- amount
- concurrent review

### 10.4 Approve API

Add:

```text
POST /api/v1/admin/payments/{id}/approve
```

### 10.5 Reject API

Add:

```text
POST /api/v1/admin/payments/{id}/reject
```

### 10.6 Rejection Reason

Persist reason.

### 10.7 Audit Integration Hook

If audit module not built yet, create interface/event point.

### 10.8 Concurrency

Protect against two admins approving same payment.

### 10.9 Tests

Mandatory concurrency/duplicate approval tests.

## Deliverable

Admin can safely verify manual payments.

---

# Phase 11 — Provider Abstraction

## Goal

Create provider-independent fulfillment interface.

## Tasks

### 11.1 Base Provider Interface

Define provider adapter contract.

### 11.2 Provider Result Models

Define normalized result types.

### 11.3 Error Types

Create:

- ProviderTemporaryError
- ProviderPermanentError

### 11.4 Mock Provider

Implement:

- success
- processing
- temporary failure
- permanent failure
- timeout

### 11.5 Provider Factory/Registry

Resolve active provider without hardcoding order service.

### 11.6 Provider Configuration

Use environment/config abstraction.

## Deliverable

Core system can operate against a mock provider.

---

# Phase 12 — Fulfillment Domain

## Goal

Create safe top-up fulfillment workflow.

## Tasks

### 12.1 Provider Order Model

Create `provider_orders`.

### 12.2 Fulfillment Service

Responsibilities:

- ensure payment verified
- ensure not already completed
- generate client reference
- create provider attempt
- submit provider request
- normalize result
- update states

### 12.3 Idempotency

Prevent duplicate top-up.

### 12.4 Status Updates

Update:

- provider_order
- fulfillment_status
- order_status
- status history

### 12.5 Failure Mapping

Temporary vs permanent.

### 12.6 Tests

Mandatory:

- payment not verified -> block
- already completed -> block duplicate
- provider success
- provider processing
- provider temporary fail
- provider permanent fail

## Deliverable

Payment-approved orders can be fulfilled safely.

---

# Phase 13 — Fulfillment Job / Worker Abstraction

## Goal

Decouple fulfillment from request lifecycle.

## Tasks

### 13.1 Job Interface

Create:

```text
FulfillmentJob
```

### 13.2 Queue Strategy

Choose lightweight initial strategy.

Prefer a DB-backed or durable approach if practical.

Do not add complex infrastructure without need.

### 13.3 Job States

Track:

- pending
- processing
- completed
- failed
- retrying

### 13.4 Worker

Process pending jobs.

### 13.5 Crash Safety

Avoid losing jobs if process restarts.

### 13.6 Duplicate Worker Protection

Ensure two workers cannot process same job concurrently.

### 13.7 Tests

Test duplicate claim protection.

## Deliverable

Fulfillment does not rely on long HTTP requests.

---

# Phase 14 — Automatic Fulfillment Trigger After Approval

## Goal

Connect manual payment approval to fulfillment.

## Tasks

### 14.1 Approval Hook

After payment becomes VERIFIED:

- enqueue/create fulfillment job

### 14.2 Transaction Boundary

Ensure approval and job creation cannot become inconsistent.

### 14.3 Return Behavior

Admin approval API should return promptly.

### 14.4 Status

Order becomes:

```text
PAYMENT_VERIFIED / QUEUED
```

then worker moves to processing.

### 14.5 Tests

Verify exactly one job is created.

## Deliverable

Manual approval automatically starts diamond fulfillment.

---

# Phase 15 — Fulfillment Retry

## Goal

Recover temporary provider failures safely.

## Tasks

### 15.1 Retry Rules

Retry temporary failures only.

### 15.2 Retry Metadata

Track:

- attempt number
- last error
- next retry if applicable

### 15.3 Admin Retry API

Add:

```text
POST /api/v1/admin/orders/{public_order_id}/retry-fulfillment
```

### 15.4 Permissions

Restrict to approved admin roles.

### 15.5 Idempotency

Do not retry completed fulfillment.

### 15.6 Automatic Retry

If implemented, use bounded backoff.

### 15.7 Tests

Cover:

- temporary failure retry
- permanent failure rejection
- completed order rejection
- concurrent retry

## Deliverable

Provider outages can be handled without duplicate delivery.

---

# Phase 16 — Admin Orders APIs

## Goal

Support complete admin order operations.

## Tasks

### 16.1 Order List

Add:

```text
GET /api/v1/admin/orders
```

### 16.2 Filters

Support:

- order status
- payment status
- fulfillment status
- date
- product
- UID
- public order ID

### 16.3 Pagination

Server-side.

### 16.4 Order Detail

Add:

```text
GET /api/v1/admin/orders/{public_order_id}
```

### 16.5 Expanded Data

Include safe operational:

- customer
- payment
- provider order
- histories

### 16.6 Query Optimization

Avoid N+1.

## Deliverable

Admin frontend has complete order data APIs.

---

# Phase 17 — Admin Customers APIs

## Goal

Support customer management visibility.

## Tasks

### 17.1 Customer List

Add:

```text
GET /api/v1/admin/customers
```

### 17.2 Customer Detail

Add:

```text
GET /api/v1/admin/customers/{id}
```

### 17.3 Search

Support approved fields.

### 17.4 Summary

Include:

- order count
- completed count
- recent orders

### 17.5 Sensitive Data

Do not expose auth internals unnecessarily.

## Deliverable

Admin can inspect customer accounts safely.

---

# Phase 18 — Admin Dashboard API

## Goal

Provide operational metrics.

## Tasks

### 18.1 Dashboard Endpoint

Add:

```text
GET /api/v1/admin/dashboard
```

### 18.2 Metrics

Return:

- orders today
- revenue today
- pending payments
- processing fulfillment
- failed fulfillment
- completed today

### 18.3 Recent Orders

Return limited recent list.

### 18.4 Pending Verification

Return count and/or small list.

### 18.5 Query Performance

Add required indexes/query optimizations.

## Deliverable

Admin dashboard has meaningful backend data.

---

# Phase 19 — Banners & Site Settings

## Goal

Support lightweight public content configuration.

## Tasks

### 19.1 Banners Model/API

Create admin CRUD.

### 19.2 Public Banner API

Return active banners.

### 19.3 Site Settings Model

Implement safe key/value or typed settings design.

### 19.4 Public Settings API

Expose only public-safe fields.

### 19.5 Admin Settings API

Allow authorized updates.

### 19.6 Audit Hooks

Track important changes.

## Deliverable

Frontend can manage basic site content.

---

# Phase 20 — Audit Logging

## Goal

Make sensitive actions traceable.

## Tasks

### 20.1 Audit Model

Create `audit_logs`.

### 20.2 Audit Service

Centralize logging.

### 20.3 Integrate

Audit:

- payment approve/reject
- product changes
- payment method changes
- provider changes
- retry
- settings changes
- role changes

### 20.4 Admin List API

Add:

```text
GET /api/v1/admin/audit-logs
```

### 20.5 Filters

Support:

- actor
- action
- entity
- date

### 20.6 Read-Only

No update/delete endpoint.

## Deliverable

Privileged activity is auditable.

---

# Phase 21 — Internal Notes (Optional if Approved)

## Goal

Support operational admin/support notes if needed.

## Tasks

### 21.1 Note Model

Create append-only notes.

### 21.2 Permissions

Admin/support only.

### 21.3 APIs

Add create/list.

### 21.4 Customer Isolation

Never expose internal notes to customers.

## Deliverable

Only implement if approved in current scope.

---

# Phase 22 — Automatic Payment Abstraction

## Goal

Prepare backend for future gateway integration.

## Important

Do not implement a real payment gateway without official credentials/documentation.

## Tasks

### 22.1 Gateway Interface

Create normalized payment gateway interface.

### 22.2 Payment Attempt Model

Create `payment_attempts`.

### 22.3 Gateway Registry

Resolve gateway by configured code.

### 22.4 Mock Gateway

Implement development gateway.

### 22.5 Payment Initiation API

Generic structure:

```text
POST /api/v1/payments/{gateway}/initiate
```

### 22.6 Normalized Gateway Result

Define:

- redirect URL
- session ID
- payment ID
- status

## Deliverable

Real gateway can be added as an adapter later.

---

# Phase 23 — Real Automatic Gateway Integration

## Goal

Integrate the selected gateway when official documentation/credentials are provided.

## Tasks

### 23.1 Read Official Documentation

Do not guess request/response fields.

### 23.2 Adapter

Implement selected gateway adapter.

### 23.3 Initiation

Create transaction/session server-side.

### 23.4 Return/Callback

Handle browser return safely.

### 23.5 IPN/Webhook

Implement server-to-server verification.

### 23.6 Validation

Validate:

- order
- amount
- currency
- transaction
- gateway status

### 23.7 Idempotency

Handle duplicate callbacks.

### 23.8 Tests

Use sandbox/mock environment.

## Deliverable

Automatic payment works without changing core order logic.

---

# Phase 24 — Payment Webhook Hardening

## Goal

Protect automatic payment callbacks.

## Tasks

### 24.1 Signature/Token Validation

Use gateway-approved method.

### 24.2 Replay Protection

Prevent duplicate processing.

### 24.3 Amount Mismatch

Reject mismatch.

### 24.4 Currency Mismatch

Reject mismatch.

### 24.5 Unknown Order

Handle safely.

### 24.6 Already Verified

Return idempotent success where appropriate.

### 24.7 Logging

Log only safe references.

### 24.8 Tests

Cover malicious/invalid callbacks.

## Deliverable

Payment webhook processing is reliable.

---

# Phase 25 — Provider Webhook / Status Sync

## Goal

Support asynchronous provider completion if provider offers it.

## Tasks

### 25.1 Provider Documentation

Do not invent webhook behavior.

### 25.2 Webhook Endpoint

Example:

```text
POST /api/v1/webhooks/providers/{provider}
```

### 25.3 Verification

Use provider-supported security.

### 25.4 Status Normalization

Map raw status.

### 25.5 Idempotency

Handle repeated events.

### 25.6 Polling Fallback

If provider has no webhook, define controlled status polling.

## Deliverable

Fulfillment status can update asynchronously.

---

# Phase 26 — Security Hardening

## Goal

Review all backend security boundaries.

## Tasks

### 26.1 CORS

Restrict production origins.

### 26.2 Rate Limiting

Apply to abuse-sensitive endpoints.

### 26.3 Secrets

Review all config/logging.

### 26.4 Upload Security

Review payment proof path/type/size.

### 26.5 Authorization Audit

Review all admin/customer endpoints.

### 26.6 Ownership Audit

Verify customer isolation.

### 26.7 Error Leakage

Remove internal error exposure.

### 26.8 OpenAPI Exposure

Configure production behavior if required.

## Deliverable

Security checklist passes.

---

# Phase 27 — Concurrency & Idempotency Hardening

## Goal

Test and reinforce race-condition safety.

## Tasks

### 27.1 Payment Approval Race

Simulate two admins.

### 27.2 Webhook Race

Simulate duplicate callbacks.

### 27.3 Fulfillment Race

Simulate two workers.

### 27.4 Retry Race

Simulate manual retry plus worker retry.

### 27.5 DB Locks/Constraints

Add only where required.

### 27.6 Unique References

Review all unique/idempotency references.

## Deliverable

No critical double-processing path remains.

---

# Phase 28 — Database Performance & Query Review

## Goal

Prepare for realistic traffic.

## Tasks

### 28.1 Analyze Admin List Queries

Avoid N+1.

### 28.2 Add Indexes

Based on actual filters.

### 28.3 Pagination

Ensure all large lists are paginated.

### 28.4 Dashboard Queries

Optimize aggregations.

### 28.5 Connection Settings

Review pool settings for deployment.

### 28.6 Avoid Premature Cache

Do not add Redis cache without measured need.

## Deliverable

Database behavior is efficient and predictable.

---

# Phase 29 — Testing Expansion

## Goal

Build reliable automated backend coverage.

## Tasks

### 29.1 Unit Tests

State machines and domain services.

### 29.2 API Integration Tests

Customer and admin APIs.

### 29.3 Database Tests

Constraints and transactions.

### 29.4 Provider Mock Tests

All provider states.

### 29.5 Payment Mock Tests

Manual and gateway abstractions.

### 29.6 Authorization Matrix Tests

All roles.

### 29.7 Failure Tests

Timeouts, DB conflicts, invalid state.

## Deliverable

Critical backend behavior is protected by tests.

---

# Phase 30 — Observability & Operational Logging

## Goal

Make production issues diagnosable.

## Tasks

### 30.1 Structured Log Review

Ensure event names are consistent.

### 30.2 Request IDs

Verify end-to-end propagation.

### 30.3 External Call Logging

Log provider/gateway request reference, not secrets.

### 30.4 Error Classification

Separate:

- client validation
- authorization
- business conflict
- external temporary
- external permanent
- unexpected server error

### 30.5 Health/Readiness

Finalize.

## Deliverable

Operations can trace failed orders/payments.

---

# Phase 31 — API Documentation & Backend README

## Goal

Make the backend easy to hand off.

## Tasks

### 31.1 README

Document:

- local setup
- environment
- migrations
- startup
- tests
- architecture
- auth
- payment
- provider
- worker

### 31.2 API Tags

Organize OpenAPI.

### 31.3 Endpoint Descriptions

Add useful descriptions.

### 31.4 Error Codes

Document key error codes.

### 31.5 Integration Notes

Document how to add:

- new payment gateway
- new top-up provider

## Deliverable

Another engineer/agent can continue safely.

---

# Phase 32 — Production Deployment Hardening

## Goal

Prepare backend for production deployment.

## Tasks

### 32.1 Dockerfile

Create secure production image.

### 32.2 Environment Validation

Production fails on missing critical secrets.

### 32.3 DB Migration Strategy

Document deployment migration command.

### 32.4 Process Configuration

Configure production server/workers.

### 32.5 Trusted Hosts / Proxy

Configure based on hosting environment.

### 32.6 HTTPS Assumption

Ensure secure headers/proxy behavior if needed.

### 32.7 Debug

Disable debug in production.

### 32.8 Mock Integrations

Ensure mock provider/gateway cannot accidentally run in production unless explicitly configured.

## Deliverable

Backend can be deployed safely.

---

# Phase 33 — Final End-to-End Backend Verification

## Goal

Verify the complete MVP business flow.

## Customer Scenario

1. Customer authenticates.
2. Customer loads products.
3. Customer selects active product.
4. Backend creates order using authoritative price.
5. Customer receives manual payment instructions.
6. Customer submits transaction ID/proof.
7. Payment becomes SUBMITTED.

## Admin Scenario

8. Admin loads pending payments.
9. Admin reviews transaction.
10. Admin approves payment.
11. Payment becomes VERIFIED.
12. Exactly one fulfillment job is created.

## Provider Scenario

13. Worker sends top-up through provider adapter.
14. Provider returns result.
15. Fulfillment updates.
16. Order becomes COMPLETED on success.
17. Customer order API shows completed state.

## Failure Scenario

18. Provider temporary failure occurs.
19. Payment remains VERIFIED.
20. Fulfillment becomes FAILED/RETRYABLE.
21. Authorized admin retries.
22. No duplicate fulfillment occurs.

## Security Scenario

23. Customer cannot access another customer's order.
24. Customer cannot access admin API.
25. Support cannot access super-admin-only operations.
26. Provider/payment secrets are absent from responses/logs.

## Deliverable

MVP backend is verified end-to-end.

---

# Recommended Execution Order

```text
Phase 0   Foundation
Phase 1   Database
Phase 2   Shared Types
Phase 3   Auth
Phase 4   RBAC
Phase 5   Products
Phase 6   Payment Methods
Phase 7   Orders
Phase 8   Manual Payments
Phase 9   Payment Proofs
Phase 10  Admin Verification

Phase 11  Provider Abstraction
Phase 12  Fulfillment
Phase 13  Worker
Phase 14  Auto Fulfillment Trigger
Phase 15  Retry

Phase 16  Admin Orders
Phase 17  Admin Customers
Phase 18  Admin Dashboard
Phase 19  Banners & Settings
Phase 20  Audit

Phase 22  Payment Gateway Abstraction
Phase 23  Real Gateway
Phase 24  Payment Webhooks
Phase 25  Provider Sync

Phase 26  Security
Phase 27  Concurrency
Phase 28  Performance
Phase 29  Testing
Phase 30  Observability
Phase 31  Documentation
Phase 32  Production Hardening
Phase 33  End-to-End Verification
```

Phase 21 is optional and should only be implemented if internal notes are approved.

---

# MVP Boundary

For the initial launch, the minimum required phases are:

```text
0–20
26–33
```

Automatic gateway-specific implementation:

```text
22–25
```

can follow after the manual-payment MVP is stable and official gateway credentials/documentation are available.

---

# Critical Phases That Must Not Be Skipped

- Phase 3 — Authentication
- Phase 4 — RBAC
- Phase 7 — Orders
- Phase 8 — Manual Payments
- Phase 10 — Admin Payment Verification
- Phase 11 — Provider Abstraction
- Phase 12 — Fulfillment
- Phase 13 — Worker
- Phase 14 — Automatic Fulfillment Trigger
- Phase 15 — Retry
- Phase 20 — Audit
- Phase 26 — Security
- Phase 27 — Concurrency
- Phase 29 — Testing
- Phase 32 — Production Hardening
- Phase 33 — End-to-End Verification

---

# Agent Phase Completion Template

At the end of each phase, return:

```markdown
## Backend Phase Completion Report

### Completed
- ...

### Files Created
- ...

### Files Modified
- ...

### Database Migrations
- ...

### API Endpoints Added/Changed
- ...

### Tests Added
- ...

### Verification
- App boot:
- Migration:
- Test suite:
- Static/type checks if configured:

### Security / Data Notes
- ...

### Known Issues
- ...

### Next Phase
- ...
```

Do not report the phase as completed if critical tests or migrations fail.

---

# Final Agent Rule

The backend must be built incrementally.

The agent must never:

- trust frontend price
- trust frontend payment status
- expose provider secrets
- expose payment gateway secrets
- skip authorization
- skip ownership checks
- trigger duplicate fulfillment
- hardcode raw provider response formats into order services
- create arbitrary status update endpoints
- silently modify historical financial records
- make real provider/payment calls in tests
- invent integration fields without documentation
- add unrequested future features

The final backend must remain:

- modular
- auditable
- idempotent
- secure
- migration-driven
- testable
- payment-provider-independent
- diamond-provider-independent
- easy to operate from the Admin Panel
