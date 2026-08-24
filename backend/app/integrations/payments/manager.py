from dataclasses import dataclass, field
from decimal import Decimal
from typing import Any

from app.core.exceptions import PaymentGatewayError
from app.core.logging import logger
from app.integrations.payments.bkash import BkashGatewayClient
from app.integrations.payments.nagad import NagadGatewayClient


@dataclass
class GatewayInitiateResult:
    gateway: str
    payment_session_id: str
    redirect_url: str
    is_mock: bool = False
    raw_data: dict[str, Any] = field(default_factory=dict)


@dataclass
class GatewayCallbackResult:
    success: bool
    gateway: str
    payment_session_id: str
    trx_id: str | None = None
    amount: str | None = None
    currency: str | None = "BDT"
    status: str = "PENDING"
    message: str | None = None
    is_mock: bool = False
    raw_data: dict[str, Any] = field(default_factory=dict)


class PaymentGatewayManager:
    """Unified Gateway Manager for bKash & Nagad payments."""

    def __init__(
        self,
        bkash_client: BkashGatewayClient | None = None,
        nagad_client: NagadGatewayClient | None = None,
    ):
        self.bkash = bkash_client or BkashGatewayClient()
        self.nagad = nagad_client or NagadGatewayClient()

    async def initiate_payment(
        self,
        gateway: str,
        order_id: str,
        amount: Decimal | float | str,
        currency: str = "BDT",
        invoice_number: str | None = None,
        client_ip: str = "127.0.0.1",
    ) -> GatewayInitiateResult:
        """Initiates gateway checkout session and produces client redirect URL."""
        gw = gateway.upper().strip()

        if gw == "BKASH":
            res = await self.bkash.create_payment(
                order_id=order_id,
                amount=amount,
                currency=currency,
                invoice_number=invoice_number,
            )
            return GatewayInitiateResult(
                gateway="BKASH",
                payment_session_id=res["paymentID"],
                redirect_url=res["bkashURL"],
                is_mock=res.get("is_mock", False),
                raw_data=res,
            )

        if gw == "NAGAD":
            res = await self.nagad.initialize_payment(
                order_id=order_id,
                amount=amount,
                currency=currency,
                client_ip=client_ip,
            )
            return GatewayInitiateResult(
                gateway="NAGAD",
                payment_session_id=res["paymentReferenceId"],
                redirect_url=res["callbackUrl"],
                is_mock=res.get("is_mock", False),
                raw_data=res,
            )

        raise PaymentGatewayError(
            message=f"Unsupported payment gateway: '{gateway}'. Supported: BKASH, NAGAD",
            code="UNSUPPORTED_GATEWAY",
        )

    async def handle_callback(
        self,
        gateway: str,
        query_params: dict[str, Any],
        body: dict[str, Any] | None = None,
    ) -> GatewayCallbackResult:
        """Handles bKash or Nagad callback redirect/webhook and executes/verifies transaction."""
        gw = gateway.upper().strip()
        merged = {**query_params, **(body or {})}

        if gw == "BKASH":
            payment_id = merged.get("paymentID")
            status = str(merged.get("status", "")).lower()

            if not payment_id:
                logger.warning("[bKash Callback] Missing paymentID parameter")
                return GatewayCallbackResult(
                    success=False,
                    gateway="BKASH",
                    payment_session_id="",
                    status="INVALID",
                    message="Missing paymentID in callback parameters",
                )

            if status in ("cancel", "cancelled"):
                logger.info(f"[bKash Callback] Payment {payment_id} cancelled by user")
                return GatewayCallbackResult(
                    success=False,
                    gateway="BKASH",
                    payment_session_id=payment_id,
                    status="CANCELLED",
                    message="Payment cancelled by customer",
                    raw_data=merged,
                )

            if status in ("failure", "failed"):
                logger.warning(f"[bKash Callback] Payment {payment_id} reported failure from gateway")
                return GatewayCallbackResult(
                    success=False,
                    gateway="BKASH",
                    payment_session_id=payment_id,
                    status="FAILED",
                    message="Payment failed at bKash gateway",
                    raw_data=merged,
                )

            try:
                exec_data = await self.bkash.execute_payment(payment_id)
                trx_id = exec_data.get("trxID")
                amount = exec_data.get("amount")
                currency = exec_data.get("currency", "BDT")

                return GatewayCallbackResult(
                    success=True,
                    gateway="BKASH",
                    payment_session_id=payment_id,
                    trx_id=trx_id,
                    amount=amount,
                    currency=currency,
                    status="SUCCESS",
                    message="bKash payment successfully executed",
                    is_mock=exec_data.get("is_mock", False),
                    raw_data=exec_data,
                )
            except Exception as e:
                logger.error(f"[bKash Callback] Execute exception for payment {payment_id}: {e}")
                return GatewayCallbackResult(
                    success=False,
                    gateway="BKASH",
                    payment_session_id=payment_id,
                    status="FAILED",
                    message=str(e),
                )

        if gw == "NAGAD":
            payment_ref_id = merged.get("payment_ref_id") or merged.get("paymentRefId")
            status = str(merged.get("status", "")).lower()

            if not payment_ref_id:
                logger.warning("[Nagad Callback] Missing payment_ref_id parameter")
                return GatewayCallbackResult(
                    success=False,
                    gateway="NAGAD",
                    payment_session_id="",
                    status="INVALID",
                    message="Missing payment reference ID in callback parameters",
                )

            if status in ("aborted", "cancel", "cancelled"):
                logger.info(f"[Nagad Callback] Payment {payment_ref_id} cancelled by user")
                return GatewayCallbackResult(
                    success=False,
                    gateway="NAGAD",
                    payment_session_id=payment_ref_id,
                    status="CANCELLED",
                    message="Payment cancelled by customer",
                    raw_data=merged,
                )

            if status in ("failure", "failed"):
                logger.warning(f"[Nagad Callback] Payment {payment_ref_id} reported failure from gateway")
                return GatewayCallbackResult(
                    success=False,
                    gateway="NAGAD",
                    payment_session_id=payment_ref_id,
                    status="FAILED",
                    message="Payment failed at Nagad gateway",
                    raw_data=merged,
                )

            try:
                verify_data = await self.nagad.verify_payment(payment_ref_id)
                trx_id = verify_data.get("issuerPaymentRefNo") or verify_data.get("paymentRefId")
                amount = verify_data.get("amount")

                return GatewayCallbackResult(
                    success=True,
                    gateway="NAGAD",
                    payment_session_id=payment_ref_id,
                    trx_id=trx_id,
                    amount=amount,
                    currency="BDT",
                    status="SUCCESS",
                    message="Nagad payment successfully verified",
                    is_mock=verify_data.get("is_mock", False),
                    raw_data=verify_data,
                )
            except Exception as e:
                logger.error(f"[Nagad Callback] Verification exception for {payment_ref_id}: {e}")
                return GatewayCallbackResult(
                    success=False,
                    gateway="NAGAD",
                    payment_session_id=payment_ref_id,
                    status="FAILED",
                    message=str(e),
                )

        raise PaymentGatewayError(
            message=f"Unsupported payment gateway callback: '{gateway}'",
            code="UNSUPPORTED_GATEWAY",
        )


gateway_manager = PaymentGatewayManager()
