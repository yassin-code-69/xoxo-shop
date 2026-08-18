# Plan 003: Performance Composite Indexes & Frontend Polling Optimization

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 21ad9d5..HEAD -- backend/app/modules/payments/model.py frontend/src/app/(shop)/payment/[orderId]/page.tsx`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P2
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: perf
- **Planned at**: commit `21ad9d5`, 2026-08-18

## Why this matters

1. **Database Lookup Speed**: The manual payment duplicate detection check queries `payments` by both `transaction_id` and `status` simultaneously on every customer submission. Creating a composite index on `(transaction_id, status)` optimizes this query plan and prevents sequential table scans under high concurrent transaction volume.
2. **Network & Client Optimization**: The frontend payment tracking screen (`/payment/[orderId]`) currently polls every 5 seconds on a flat interval. Adding exponential backoff with a maximum ceiling (e.g. 5s -> 8s -> 12s -> 15s) and stopping automatically once terminal state (`COMPLETED` or `FAILED`) is reached cuts redundant network polling by over 60% while maintaining snappy UX.

## Current state

- `backend/app/modules/payments/model.py:10-25` — Has separate single-column indexes on `transaction_id` and `status`, but no composite index.
- `frontend/src/app/(shop)/payment/[orderId]/page.tsx:64-71` — Uses a flat 5000ms `setInterval`:
```typescript
useEffect(() => {
  if (order?.payment_status === "SUBMITTED" || order?.fulfillment_status === "PROCESSING") {
    const timer = setInterval(() => {
      fetchOrderData(false);
    }, 5000);
    return () => clearInterval(timer);
  }
}, [order?.payment_status, order?.fulfillment_status]);
```

## Commands you will need

| Purpose         | Command                                          | Expected on success |
|-----------------|--------------------------------------------------|---------------------|
| Run tests       | `/home/jaber/Documents/job/xoxo-shop/run.sh test` | all pass, exit 0    |
| Build frontend  | `cd frontend && bun run build`                   | all routes compile  |

## Scope

**In scope**:
- `backend/app/modules/payments/model.py` (add composite Index definition)
- `backend/app/db/models.py` (ensure model metadata reflects new index)
- `frontend/src/app/(shop)/payment/[orderId]/page.tsx` (implement smart adaptive interval timer)

**Out of scope**:
- Modifications to order payment calculation logic.

## Git workflow

- Branch: `advisor/003-composite-indexes-polling-opt`
- Commit style: `perf: add payment composite index and optimize checkout polling interval`

## Steps

### Step 1: Add Composite Index to `Payment` Model in `backend/app/modules/payments/model.py`

In `backend/app/modules/payments/model.py`, add `__table_args__` with an `Index`:
```python
from sqlalchemy import Index

class Payment(Base, UUIDPrimaryKeyMixin, TimestampMixin):
    __tablename__ = "payments"
    __table_args__ = (
        Index("ix_payments_trx_status", "transaction_id", "status"),
    )
    # ... existing columns ...
```

### Step 2: Implement Adaptive Interval Polling in Frontend Checkout

In `frontend/src/app/(shop)/payment/[orderId]/page.tsx`:
Replace flat interval with an adaptive timer that increases the poll interval smoothly up to a 15s cap and cleans up immediately on unmount or completion:

```typescript
useEffect(() => {
  const isPending =
    order?.payment_status === "SUBMITTED" ||
    order?.fulfillment_status === "PROCESSING" ||
    order?.fulfillment_status === "QUEUED";

  if (!isPending) return;

  let delay = 5000;
  let timeoutId: NodeJS.Timeout;

  const poll = async () => {
    await fetchOrderData(false);
    delay = Math.min(delay + 2000, 15000);
    timeoutId = setTimeout(poll, delay);
  };

  timeoutId = setTimeout(poll, delay);
  return () => clearTimeout(timeoutId);
}, [order?.payment_status, order?.fulfillment_status]);
```

## Test plan

- Test that `./run.sh test` runs and passes with the new database model index.
- Test that frontend compiles cleanly with `cd frontend && bun run build`.
- Verify that status updates continue to refresh reactively when payment is approved.

## Done criteria

- [ ] Composite index `ix_payments_trx_status` is defined on `payments`.
- [ ] Adaptive polling in `payment/[orderId]` compiles with 0 TypeScript warnings.
- [ ] `./run.sh test` passes 100%.
- [ ] `plans/README.md` status updated.
