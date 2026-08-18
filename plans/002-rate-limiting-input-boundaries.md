# Plan 002: API Rate Limiting & Input Validation Boundaries

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 21ad9d5..HEAD -- backend/app/api/v1/orders.py backend/app/modules/orders/schema.py`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: security
- **Planned at**: commit `21ad9d5`, 2026-08-18

## Why this matters

The public checkout and payment endpoints (`POST /api/v1/orders` and `POST /api/v1/orders/{public_order_id}/manual-payment`) currently lack request rate limiting and strict Player UID pattern validation. Without rate limiting, malicious actors could flood the database with spam unpaid orders or attempt brute-force Transaction ID permutations. Without UID pattern validation, non-printable or control characters could pass into provider fulfillment payloads. This plan implements a lightweight sliding-window rate limiter on sensitive endpoints and enforces strict alphanumeric UID validation.

## Current state

- `backend/app/modules/orders/schema.py:10`:
```python
class OrderCreateRequest(BaseModel):
    product_id: str
    player_uid: str = Field(..., min_length=3, max_length=64, description="Free Fire Player UID")
    player_server: Optional[str] = Field(default=None, max_length=64)
    quantity: int = Field(default=1, ge=1, le=10)
    payment_method: str = Field(default="BKASH")
```
- `backend/app/api/v1/orders.py:15`:
```python
@router.post("/orders", response_model=OrderPublicRead)
async def create_order(
    data: OrderCreateRequest,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
```

## Commands you will need

| Purpose   | Command                                              | Expected on success |
|-----------|------------------------------------------------------|---------------------|
| Run tests | `/home/jaber/Documents/job/xoxo-shop/run.sh test`     | all tests pass      |

## Scope

**In scope**:
- `backend/app/core/rate_limit.py` (create lightweight in-memory sliding window limiter dependency)
- `backend/app/modules/orders/schema.py` (add regex pattern validation to `player_uid`)
- `backend/app/api/v1/orders.py` (attach rate limiting dependency)
- `backend/tests/test_orders.py` (add validation and rate limit tests)

**Out of scope**:
- Changes to admin endpoints.
- External Redis dependencies (must remain dependency-free with in-memory fallback).

## Git workflow

- Branch: `advisor/002-rate-limiting-input-boundaries`
- Commit style: `feat(security): add endpoint rate limiting and UID input validation`

## Steps

### Step 1: Add Regex Pattern to `OrderCreateRequest.player_uid`

In `backend/app/modules/orders/schema.py`:
Add `pattern=r"^[a-zA-Z0-9_-]{3,64}$"` to `player_uid` field validation.

```python
class OrderCreateRequest(BaseModel):
    product_id: str
    player_uid: str = Field(
        ...,
        min_length=3,
        max_length=64,
        pattern=r"^[a-zA-Z0-9_\-]+$",
        description="Free Fire Player UID (alphanumeric, underscores, hyphens only)"
    )
    player_server: Optional[str] = Field(default=None, max_length=64)
    quantity: int = Field(default=1, ge=1, le=10)
    payment_method: str = Field(default="BKASH")
```

### Step 2: Implement Rate Limiting Dependency `backend/app/core/rate_limit.py`

Create `backend/app/core/rate_limit.py`:
- Implement `RateLimiter` class tracking timestamps per client IP / user ID.
- Provide `rate_limit(max_requests: int = 15, window_seconds: int = 60)` returning a FastAPI dependency.
- If limit is exceeded, raise `AppException(code="RATE_LIMIT_EXCEEDED", message="Too many requests. Please slow down.", status_code=429)`.

### Step 3: Attach Rate Limiter to `POST /orders` and `POST /orders/.../manual-payment`

In `backend/app/api/v1/orders.py`:
Attach `Depends(rate_limit(max_requests=20, window_seconds=60))` to `create_order` and `submit_manual_payment`.

### Step 4: Add Verification Tests in `backend/tests/test_orders.py`

- Test that invalid UID (e.g. `"<script>alert(1)</script>"`) is rejected with HTTP 422.
- Test that valid UID (e.g. `"1029384756"`) succeeds.
- Test that excessive rapid requests return HTTP 429 when threshold is reached.

## Done criteria

- [ ] Malformed UID characters fail validation with HTTP 422.
- [ ] Rate limit kicks in on excessive rapid calls with HTTP 429.
- [ ] `/home/jaber/Documents/job/xoxo-shop/run.sh test` exits 0.
- [ ] `plans/README.md` status updated to `DONE`.
