# Plan 001: Background Worker Fail-Safe & Auto-Recovery

> **Executor instructions**: Follow this plan step by step. Run every
> verification command and confirm the expected result before moving to the
> next step. If anything in the "STOP conditions" section occurs, stop and
> report — do not improvise. When done, update the status row for this plan
> in `plans/README.md`.
>
> **Drift check (run first)**: `git diff --stat 21ad9d5..HEAD -- backend/app/workers/tasks.py backend/app/modules/fulfillment/service.py`
> If any in-scope file changed since this plan was written, compare the
> "Current state" excerpts against the live code before proceeding; on a
> mismatch, treat it as a STOP condition.

## Status

- **Priority**: P1
- **Effort**: S
- **Risk**: LOW
- **Depends on**: none
- **Category**: bug
- **Planned at**: commit `21ad9d5`, 2026-08-18

## Why this matters

When an order payment is approved, diamond fulfillment is enqueued as an asynchronous background task. If an unhandled runtime error occurs (e.g., unexpected network disconnection, provider service timeout, or transient database lock), the task could terminate without updating the order's state. This leaves the order stuck indefinitely in `QUEUED` or `PROCESSING` without alerting the customer or admin. This plan introduces a top-level transactional error handler in the worker task that catches any unexpected error, marks the order's fulfillment status as `FAILED` with detailed diagnostic logging, and makes it immediately visible for admin 1-click retry.

## Current state

- `backend/app/workers/tasks.py` — Dispatches background fulfillment jobs using asyncio:
```python
# backend/app/workers/tasks.py:15-28
async def _run_fulfillment_job(order_id: str, is_retry: bool = False):
    try:
        async with AsyncSessionLocal() as db:
            service = FulfillmentService(db)
            await service.execute_fulfillment(order_id=order_id, is_retry=is_retry)
    except Exception as e:
        logger.error(f"[Worker] Unexpected failure executing fulfillment for order {order_id}: {e}", exc_info=True)
```
- `backend/app/modules/fulfillment/service.py` — Contains `execute_fulfillment`:
```python
# backend/app/modules/fulfillment/service.py:100-115
# Updates order.fulfillment_status to COMPLETED or FAILED based on ProviderResponse
```

If an error is raised before or during `execute_fulfillment` inside `_run_fulfillment_job`, the exception is logged to stderr, but the database order entity is left in `QUEUED` or `PROCESSING`.

## Commands you will need

| Purpose   | Command                                              | Expected on success |
|-----------|------------------------------------------------------|---------------------|
| Run tests | `/home/jaber/Documents/job/xoxo-shop/run.sh test`     | 17+ passed, exit 0  |
| Direct Pytest | `/home/jaber/Documents/job/xoxo-shop/backend/.venv/bin/pytest` | exit 0 |

## Scope

**In scope**:
- `backend/app/workers/tasks.py`
- `backend/tests/test_fulfillment.py`

**Out of scope**:
- Modifications to `OrderService` or `PaymentService` state machines.
- Provider adapter integration files (`app/integrations/providers/*`).

## Git workflow

- Branch: `advisor/001-worker-failsafe-recovery`
- Commit style: `fix(workers): add top-level fail-safe error handler for fulfillment jobs`

## Steps

### Step 1: Add Fail-Safe Database Status Recovery in `tasks.py`

Update `_run_fulfillment_job` in `backend/app/workers/tasks.py` to open an emergency recovery session upon uncaught exceptions and transition the `order.fulfillment_status` to `FAILED` with `last_error_message = str(e)`.

```python
async def _run_fulfillment_job(order_id: str, is_retry: bool = False):
    try:
        async with AsyncSessionLocal() as db:
            service = FulfillmentService(db)
            await service.execute_fulfillment(order_id=order_id, is_retry=is_retry)
    except Exception as e:
        logger.error(f"[Worker] Unexpected failure executing fulfillment for order {order_id}: {e}", exc_info=True)
        # Fail-safe state cleanup
        try:
            async with AsyncSessionLocal() as emergency_db:
                from sqlalchemy import select
                from app.modules.orders.model import Order, OrderStatusHistory
                from app.shared.enums import FulfillmentStatus, OrderStatus
                res = await emergency_db.execute(select(Order).where(Order.id == order_id))
                order = res.scalars().first()
                if order and order.fulfillment_status in (FulfillmentStatus.QUEUED.value, FulfillmentStatus.PROCESSING.value):
                    order.fulfillment_status = FulfillmentStatus.FAILED.value
                    order.order_status = OrderStatus.FAILED.value
                    emergency_db.add(
                        OrderStatusHistory(
                            order_id=order.id,
                            status_type="FULFILLMENT",
                            previous_status=FulfillmentStatus.QUEUED.value,
                            new_status=FulfillmentStatus.FAILED.value,
                            reason=f"Worker background failure: {str(e)[:250]}",
                            changed_by="SYSTEM_WORKER",
                        )
                    )
                    await emergency_db.commit()
        except Exception as db_err:
            logger.critical(f"[Worker] Emergency status recovery failed for order {order_id}: {db_err}", exc_info=True)
```

**Verify**: Run `/home/jaber/Documents/job/xoxo-shop/run.sh test` → exits with code 0.

### Step 2: Add Automated Unit Test for Worker Crash Recovery

In `backend/tests/test_fulfillment.py`, add a test case `test_worker_handles_unexpected_exceptions_safely`:
- Mock `FulfillmentService.execute_fulfillment` to simulate an unhandled exception (`RuntimeError("Simulated network crash")`).
- Invoke `_run_fulfillment_job(order.id)`.
- Assert that the order's `fulfillment_status` transitions to `FAILED` and `order_status` transitions to `FAILED` with history logged.

**Verify**: `/home/jaber/Documents/job/xoxo-shop/run.sh test` → All 18 tests pass.

## Test plan

- Test that normal order fulfillments continue to succeed asynchronously.
- Test that an unexpected runtime crash in the worker thread marks the order as `FAILED` rather than leaving it stuck in `QUEUED`.
- Test that the failed order can be retried by the admin using `POST /api/v1/admin/orders/{public_id}/retry-fulfillment`.

## Done criteria

- [ ] Unhandled worker exceptions transition `Order.fulfillment_status` to `FAILED`.
- [ ] New test in `backend/tests/test_fulfillment.py` passes.
- [ ] `run.sh test` exits 0 with 100% pass rate.
- [ ] `plans/README.md` status row updated to `DONE`.

## STOP conditions

- If `AsyncSessionLocal` cannot connect to the database in tests.
- If existing 17 tests regress.

## Maintenance notes

- When transitioning from in-memory asyncio worker tasks to Celery/Redis in enterprise deployments, this fail-safe logic should be translated into Celery's `on_failure` task hook.
