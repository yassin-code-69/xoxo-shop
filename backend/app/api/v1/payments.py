from typing import Any
from urllib.parse import quote, urlencode

from fastapi import APIRouter, Depends, Request
from fastapi.responses import JSONResponse, RedirectResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.config import settings
from app.core.logging import logger
from app.core.rate_limit import rate_limit
from app.core.security import AuthenticatedUser, get_current_user
from app.db.session import get_db
from app.modules.payments.schema import (
    GatewayInitiateRequest,
    GatewayInitiateResponse,
)
from app.modules.payments.service import PaymentService

router = APIRouter(prefix="/payments", tags=["Payment Gateways"])


@router.post(
    "/{order_id}/initiate-gateway",
    response_model=GatewayInitiateResponse,
    dependencies=[Depends(rate_limit(max_requests=30, window_seconds=60))],
)
async def initiate_gateway_payment(
    order_id: str,
    data: GatewayInitiateRequest,
    request: Request,
    current_user: AuthenticatedUser = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Initiates an automated payment gateway checkout session (bKash or Nagad)."""
    service = PaymentService(db)
    client_ip = request.client.host if request.client else "127.0.0.1"
    return await service.initiate_gateway_payment(
        public_order_id=order_id,
        user_id=current_user.id,
        gateway=data.gateway,
        client_ip=client_ip,
    )


async def _extract_request_params(request: Request) -> tuple[dict[str, Any], dict[str, Any]]:
    """Extracts query parameters and body from request."""
    query_params = dict(request.query_params)
    body: dict[str, Any] = {}
    try:
        content_type = request.headers.get("content-type", "")
        if "application/json" in content_type:
            body = await request.json()
        elif "application/x-www-form-urlencoded" in content_type or "multipart/form-data" in content_type:
            form_data = await request.form()
            body = dict(form_data)
    except Exception as e:
        logger.debug(f"Could not parse body from callback request: {e}")
    return query_params, body


def _handle_gateway_response(
    request: Request,
    order: Any | None,
    cb_result: Any,
):
    """Formats either a redirect or JSON response depending on client Accept header.

    The order id used here always comes from the order we resolved server-side, never
    from the callback query string, so it cannot be used to shape the redirect URL.
    """
    public_id = order.public_order_id if order else None
    wants_json = "application/json" in request.headers.get("accept", "")

    if cb_result.success:
        if wants_json:
            return JSONResponse(
                {
                    "success": True,
                    "status": "SUCCESS",
                    "gateway": cb_result.gateway,
                    "trx_id": cb_result.trx_id,
                    "public_order_id": public_id,
                    "message": cb_result.message,
                }
            )
        query = urlencode(
            {"status": "success", "trx_id": cb_result.trx_id or "", "gateway": cb_result.gateway}
        )
        target_url = f"{settings.FRONTEND_URL}/payment/{quote(public_id or '', safe='')}?{query}"
        return RedirectResponse(url=target_url, status_code=303)

    # Failure / cancellation
    status_tag = "cancelled" if cb_result.status == "CANCELLED" else "failed"
    err_msg = cb_result.message or "Payment could not be completed"

    if wants_json:
        return JSONResponse(
            {
                "success": False,
                "status": cb_result.status,
                "gateway": cb_result.gateway,
                "public_order_id": public_id,
                "message": err_msg,
            },
            status_code=400,
        )

    if public_id:
        query = urlencode({"status": status_tag, "error": err_msg, "gateway": cb_result.gateway})
        target_url = f"{settings.FRONTEND_URL}/payment/{quote(public_id, safe='')}?{query}"
    else:
        query = urlencode({"status": status_tag, "error": err_msg})
        target_url = f"{settings.FRONTEND_URL}/orders?{query}"
    return RedirectResponse(url=target_url, status_code=303)


@router.get("/bkash/callback")
@router.post("/bkash/callback")
async def bkash_payment_callback(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Callback endpoint for bKash Checkout URL redirect & webhook."""
    query_params, body = await _extract_request_params(request)
    service = PaymentService(db)
    order, cb_result = await service.process_gateway_callback(
        gateway="BKASH",
        query_params=query_params,
        body=body,
    )
    return _handle_gateway_response(request, order, cb_result)


@router.get("/nagad/callback")
@router.post("/nagad/callback")
async def nagad_payment_callback(
    request: Request,
    db: AsyncSession = Depends(get_db),
):
    """Callback endpoint for Nagad PGW URL redirect & webhook."""
    query_params, body = await _extract_request_params(request)
    service = PaymentService(db)
    order, cb_result = await service.process_gateway_callback(
        gateway="NAGAD",
        query_params=query_params,
        body=body,
    )
    return _handle_gateway_response(request, order, cb_result)
