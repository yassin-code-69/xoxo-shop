import time
import uuid
from datetime import datetime, timezone
from decimal import Decimal
from typing import Any

import httpx

from app.core.config import settings
from app.core.exceptions import PaymentGatewayError
from app.core.logging import logger


class BkashGatewayClient:
    """Client for bKash Tokenized Checkout API v1.2.0-beta.

    Supports token grant & caching, payment creation, execution, status query,
    and automatic mock fallback for local development and CI testing.
    """

    def __init__(
        self,
        app_key: str | None = None,
        app_secret: str | None = None,
        username: str | None = None,
        password: str | None = None,
        base_url: str | None = None,
        callback_url: str | None = None,
    ):
        self.app_key = app_key if app_key is not None else settings.BKASH_APP_KEY
        self.app_secret = app_secret if app_secret is not None else settings.BKASH_APP_SECRET
        self.username = username if username is not None else settings.BKASH_USERNAME
        self.password = password if password is not None else settings.BKASH_PASSWORD
        self.base_url = (base_url or settings.BKASH_BASE_URL).rstrip("/")
        self.callback_url = callback_url or settings.BKASH_CALLBACK_URL

        # Token caching state
        self._id_token: str | None = None
        self._refresh_token: str | None = None
        self._token_expires_at: float = 0.0

    def is_mock_mode(self) -> bool:
        """Determines if the client should run in mock mode."""
        return (
            not self.app_key
            or self.app_key.strip().lower() in ("mock", "mock-key", "")
            or not self.app_secret
            or not self.username
            or not self.password
        )

    async def get_token(self, force_refresh: bool = False) -> str:
        """Retrieves a valid grant ID token, using cache or refreshing if needed."""
        if self.is_mock_mode():
            return "mock_bkash_id_token_12345"

        now = time.time()
        # Use cached token if valid for at least 60 more seconds
        if not force_refresh and self._id_token and now < (self._token_expires_at - 60):
            return self._id_token

        logger.info(f"[bKash Gateway] Requesting grant token from {self.base_url}/tokenized/checkout/token/grant")
        url = f"{self.base_url}/tokenized/checkout/token/grant"
        headers = {
            "username": self.username,
            "password": self.password,
            "Content-Type": "application/json",
        }
        body = {
            "app_key": self.app_key,
            "app_secret": self.app_secret,
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(url, json=body, headers=headers)
                data = res.json()

            if res.status_code != 200 or data.get("statusCode") not in (None, "0000"):
                err_msg = data.get("statusMessage") or res.text
                logger.error(f"[bKash Gateway] Token grant failed: {err_msg}")
                raise PaymentGatewayError(
                    message=f"bKash token grant error: {err_msg}",
                    code="BKASH_TOKEN_ERROR",
                )

            self._id_token = data.get("id_token")
            self._refresh_token = data.get("refresh_token")
            expires_in = int(data.get("expires_in", 3600))
            self._token_expires_at = time.time() + expires_in
            logger.info(f"[bKash Gateway] Grant token acquired, valid for {expires_in}s")
            return self._id_token

        except httpx.RequestError as e:
            logger.error(f"[bKash Gateway] Network error during token grant: {e}")
            raise PaymentGatewayError(
                message=f"Failed to connect to bKash gateway: {e!s}",
                code="BKASH_CONNECTION_ERROR",
            )

    async def create_payment(
        self,
        order_id: str,
        amount: Decimal | float | str,
        currency: str = "BDT",
        invoice_number: str | None = None,
        payer_reference: str | None = None,
    ) -> dict[str, Any]:
        """Creates a bKash payment session and returns paymentID & bkashURL."""
        formatted_amount = f"{Decimal(str(amount)):.2f}"
        inv_no = invoice_number or order_id

        if self.is_mock_mode():
            mock_payment_id = f"BK_MOCK_{uuid.uuid4().hex[:12].upper()}"
            mock_bkash_url = (
                f"{self.callback_url}?paymentID={mock_payment_id}&status=success&invoice={inv_no}"
            )
            logger.info(f"[bKash Gateway MOCK] Created mock payment {mock_payment_id} for order {order_id} ({formatted_amount} {currency})")
            return {
                "statusCode": "0000",
                "statusMessage": "Successful",
                "paymentID": mock_payment_id,
                "bkashURL": mock_bkash_url,
                "callbackURL": self.callback_url,
                "amount": formatted_amount,
                "currency": currency,
                "intent": "sale",
                "merchantInvoiceNumber": inv_no,
                "is_mock": True,
            }

        token = await self.get_token()
        url = f"{self.base_url}/tokenized/checkout/create"
        headers = {
            "Authorization": token,
            "X-APP-Key": self.app_key,
            "Content-Type": "application/json",
        }
        body = {
            "mode": "0011",
            "payerReference": payer_reference or order_id,
            "callbackURL": self.callback_url,
            "amount": formatted_amount,
            "currency": currency,
            "intent": "sale",
            "merchantInvoiceNumber": inv_no,
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(url, json=body, headers=headers)
                data = res.json()

            if res.status_code != 200 or data.get("statusCode") != "0000":
                err_msg = data.get("statusMessage") or res.text
                logger.error(f"[bKash Gateway] Payment creation failed: {err_msg}")
                raise PaymentGatewayError(
                    message=f"bKash create payment failed: {err_msg}",
                    code="BKASH_CREATE_FAILED",
                )

            logger.info(f"[bKash Gateway] Created payment {data.get('paymentID')} for order {order_id}")
            return data

        except httpx.RequestError as e:
            logger.error(f"[bKash Gateway] Network error during create payment: {e}")
            raise PaymentGatewayError(
                message=f"Failed to connect to bKash gateway: {e!s}",
                code="BKASH_CONNECTION_ERROR",
            )

    async def execute_payment(self, payment_id: str) -> dict[str, Any]:
        """Executes/confirms payment with bKash and returns trxID & transaction status."""
        if self.is_mock_mode() or payment_id.startswith("BK_MOCK_"):
            mock_trx_id = f"TRX_BK_{uuid.uuid4().hex[:10].upper()}"
            logger.info(f"[bKash Gateway MOCK] Executed mock payment {payment_id} -> TrxID: {mock_trx_id}")
            return {
                "statusCode": "0000",
                "statusMessage": "Successful",
                "paymentID": payment_id,
                "trxID": mock_trx_id,
                "transactionStatus": "Completed",
                "amount": "100.00",
                "currency": "BDT",
                "intent": "sale",
                "paymentExecuteTime": datetime.now(timezone.utc).isoformat(),
                "is_mock": True,
            }

        token = await self.get_token()
        url = f"{self.base_url}/tokenized/checkout/execute"
        headers = {
            "Authorization": token,
            "X-APP-Key": self.app_key,
            "Content-Type": "application/json",
        }
        body = {"paymentID": payment_id}

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(url, json=body, headers=headers)
                data = res.json()

            # Handle possible expired token retry
            if res.status_code == 401 or data.get("statusCode") in ("2001", "2002"):
                logger.warning("[bKash Gateway] Token expired during execute, refreshing...")
                token = await self.get_token(force_refresh=True)
                headers["Authorization"] = token
                async with httpx.AsyncClient(timeout=15.0) as client:
                    res = await client.post(url, json=body, headers=headers)
                    data = res.json()

            if res.status_code != 200 or data.get("statusCode") != "0000":
                err_msg = data.get("statusMessage") or res.text
                logger.error(f"[bKash Gateway] Execute payment failed: {err_msg}")
                raise PaymentGatewayError(
                    message=f"bKash execute payment failed: {err_msg}",
                    code="BKASH_EXECUTE_FAILED",
                )

            logger.info(f"[bKash Gateway] Payment {payment_id} executed successfully: TrxID {data.get('trxID')}")
            return data

        except httpx.RequestError as e:
            logger.error(f"[bKash Gateway] Network error during execute payment: {e}")
            raise PaymentGatewayError(
                message=f"Failed to connect to bKash gateway: {e!s}",
                code="BKASH_CONNECTION_ERROR",
            )

    async def query_payment(self, payment_id: str) -> dict[str, Any]:
        """Queries the status of a bKash payment."""
        if self.is_mock_mode() or payment_id.startswith("BK_MOCK_"):
            return {
                "statusCode": "0000",
                "statusMessage": "Successful",
                "paymentID": payment_id,
                "trxID": f"TRX_BK_{payment_id[-8:]}",
                "transactionStatus": "Completed",
                "amount": "100.00",
                "currency": "BDT",
                "is_mock": True,
            }

        token = await self.get_token()
        url = f"{self.base_url}/tokenized/checkout/payment/status"
        headers = {
            "Authorization": token,
            "X-APP-Key": self.app_key,
            "Content-Type": "application/json",
        }
        body = {"paymentID": payment_id}

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(url, json=body, headers=headers)
                return res.json()
        except httpx.RequestError as e:
            logger.error(f"[bKash Gateway] Query payment network error: {e}")
            raise PaymentGatewayError(
                message=f"Failed to query bKash payment status: {e!s}",
                code="BKASH_QUERY_ERROR",
            )
