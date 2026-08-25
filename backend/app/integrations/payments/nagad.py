import base64
import json
import uuid
from datetime import datetime
from decimal import Decimal
from typing import Any

import httpx
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding

from app.core.config import settings
from app.core.exceptions import PaymentGatewayError
from app.core.logging import logger


class NagadGatewayClient:
    """Client for Nagad Remote Payment Gateway (DFS API).

    Handles encryption/signing with RSA PKCS1v15, checkout initialization,
    callback verification, and seamless mock fallback.
    """

    def __init__(
        self,
        merchant_id: str | None = None,
        merchant_private_key: str | None = None,
        pg_public_key: str | None = None,
        base_url: str | None = None,
        callback_url: str | None = None,
    ):
        self.merchant_id = merchant_id if merchant_id is not None else settings.NAGAD_MERCHANT_ID
        self.merchant_private_key = (
            merchant_private_key if merchant_private_key is not None else settings.NAGAD_MERCHANT_PRIVATE_KEY
        )
        self.pg_public_key = pg_public_key if pg_public_key is not None else settings.NAGAD_PG_PUBLIC_KEY
        self.base_url = (base_url or settings.NAGAD_BASE_URL).rstrip("/")
        self.callback_url = callback_url or settings.NAGAD_CALLBACK_URL

        # Amounts of mock sessions, so mock callbacks reconcile like real ones
        self._mock_amounts: dict[str, str] = {}

    def is_mock_mode(self) -> bool:
        """Determines if Nagad client should run in mock mode."""
        if settings.is_production:
            # Mock mode always reports success, which would mean free orders.
            return False

        return (
            not self.merchant_id
            or self.merchant_id.strip().lower() in ("mock", "mock-merchant", "")
            or not self.merchant_private_key
            or not self.pg_public_key
        )

    def _assert_configured(self) -> None:
        """In production, missing credentials must fail loudly instead of mocking."""
        if settings.is_production and not (self.merchant_id and self.merchant_private_key and self.pg_public_key):
            raise PaymentGatewayError(
                message="Nagad gateway is not configured on this server",
                code="NAGAD_NOT_CONFIGURED",
            )

    def _format_pem_key(self, key_str: str, is_public: bool = False) -> bytes:
        """Ensures PEM key string has proper headers and newlines."""
        clean_key = key_str.replace("\\n", "\n").strip()
        if is_public:
            if not clean_key.startswith("-----BEGIN"):
                clean_key = f"-----BEGIN PUBLIC KEY-----\n{clean_key}\n-----END PUBLIC KEY-----"
        else:
            if not clean_key.startswith("-----BEGIN"):
                clean_key = f"-----BEGIN RSA PRIVATE KEY-----\n{clean_key}\n-----END RSA PRIVATE KEY-----"
        return clean_key.encode("utf-8")

    def _encrypt_with_public_key(self, plain_text: str) -> str:
        """Encrypts data with Nagad Payment Gateway Public Key."""
        try:
            pem_bytes = self._format_pem_key(self.pg_public_key, is_public=True)
            public_key = serialization.load_pem_public_key(pem_bytes)
            encrypted = public_key.encrypt(
                plain_text.encode("utf-8"),
                padding.PKCS1v15(),
            )
            return base64.b64encode(encrypted).decode("utf-8")
        except Exception as e:
            logger.error(f"[Nagad Gateway] Encryption error: {e}")
            raise PaymentGatewayError(
                message=f"Nagad encryption error: {e!s}",
                code="NAGAD_ENCRYPTION_ERROR",
            )

    def _sign_with_private_key(self, plain_text: str) -> str:
        """Signs data with Merchant Private Key using SHA256withRSA."""
        try:
            pem_bytes = self._format_pem_key(self.merchant_private_key, is_public=False)
            private_key = serialization.load_pem_private_key(pem_bytes, password=None)
            signature = private_key.sign(
                plain_text.encode("utf-8"),
                padding.PKCS1v15(),
                hashes.SHA256(),
            )
            return base64.b64encode(signature).decode("utf-8")
        except Exception as e:
            logger.error(f"[Nagad Gateway] Signing error: {e}")
            raise PaymentGatewayError(
                message=f"Nagad signing error: {e!s}",
                code="NAGAD_SIGNING_ERROR",
            )

    def _decrypt_with_private_key(self, encrypted_base64: str) -> str:
        """Decrypts data with Merchant Private Key."""
        try:
            pem_bytes = self._format_pem_key(self.merchant_private_key, is_public=False)
            private_key = serialization.load_pem_private_key(pem_bytes, password=None)
            encrypted_bytes = base64.b64decode(encrypted_base64)
            decrypted = private_key.decrypt(
                encrypted_bytes,
                padding.PKCS1v15(),
            )
            return decrypted.decode("utf-8")
        except Exception as e:
            logger.error(f"[Nagad Gateway] Decryption error: {e}")
            raise PaymentGatewayError(
                message=f"Nagad decryption error: {e!s}",
                code="NAGAD_DECRYPTION_ERROR",
            )

    async def initialize_payment(
        self,
        order_id: str,
        amount: Decimal | float | str,
        currency: str = "BDT",
        client_ip: str = "127.0.0.1",
    ) -> dict[str, Any]:
        """Initializes Nagad payment session and returns redirect URL."""
        formatted_amount = f"{Decimal(str(amount)):.2f}"
        self._assert_configured()

        if self.is_mock_mode():
            mock_payment_ref_id = f"NG_MOCK_{uuid.uuid4().hex[:12].upper()}"
            self._mock_amounts[mock_payment_ref_id] = formatted_amount
            mock_nagad_url = (
                f"{self.callback_url}?payment_ref_id={mock_payment_ref_id}&status=Success&order_id={order_id}"
            )
            logger.info(f"[Nagad Gateway MOCK] Initialized mock payment {mock_payment_ref_id} for order {order_id} ({formatted_amount} {currency})")
            return {
                "paymentReferenceId": mock_payment_ref_id,
                "callbackUrl": mock_nagad_url,
                "status": "Success",
                "is_mock": True,
            }

        now_str = datetime.now().strftime("%Y%m%d%H%M%S")
        challenge = uuid.uuid4().hex

        # 1. Initialize Step
        sensitive_data = {
            "merchantId": self.merchant_id,
            "datetime": now_str,
            "orderId": order_id,
            "challenge": challenge,
        }
        sensitive_json = json.dumps(sensitive_data)
        encrypted_sensitive = self._encrypt_with_public_key(sensitive_json)
        signature = self._sign_with_private_key(sensitive_json)

        init_url = f"{self.base_url}/check-out/initialize/{self.merchant_id}/{order_id}"
        headers = {
            "X-KM-IP-V4": client_ip,
            "X-KM-Client-Type": "PC_WEB",
            "X-KM-Api-Version": "v-0.2.0",
            "Content-Type": "application/json",
        }
        init_payload = {
            "accountNumber": self.merchant_id,
            "dateTime": now_str,
            "sensitiveData": encrypted_sensitive,
            "signature": signature,
        }

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.post(init_url, json=init_payload, headers=headers)
                init_res_data = res.json()

            if res.status_code != 200 or "sensitiveData" not in init_res_data:
                err_msg = init_res_data.get("reason") or res.text
                logger.error(f"[Nagad Gateway] Initialize failed: {err_msg}")
                raise PaymentGatewayError(
                    message=f"Nagad initialize failed: {err_msg}",
                    code="NAGAD_INIT_FAILED",
                )

            # Decrypt response
            decrypted_json = self._decrypt_with_private_key(init_res_data["sensitiveData"])
            decrypted_data = json.loads(decrypted_json)
            payment_ref_id = decrypted_data.get("paymentReferenceId")
            resp_challenge = decrypted_data.get("challenge")

            # 2. Complete Checkout Step
            checkout_data = {
                "merchantId": self.merchant_id,
                "orderId": order_id,
                "currencyCode": "050",  # BDT currency code in Nagad
                "amount": formatted_amount,
                "challenge": resp_challenge,
            }
            checkout_json = json.dumps(checkout_data)
            encrypted_checkout = self._encrypt_with_public_key(checkout_json)
            checkout_sig = self._sign_with_private_key(checkout_json)

            complete_url = f"{self.base_url}/check-out/complete/{payment_ref_id}"
            complete_payload = {
                "sensitiveData": encrypted_checkout,
                "signature": checkout_sig,
                "merchantCallbackURL": self.callback_url,
            }

            async with httpx.AsyncClient(timeout=15.0) as client:
                comp_res = await client.post(complete_url, json=complete_payload, headers=headers)
                comp_data = comp_res.json()

            if comp_res.status_code != 200 or comp_data.get("status") != "Success":
                err_msg = comp_data.get("reason") or comp_res.text
                logger.error(f"[Nagad Gateway] Complete checkout failed: {err_msg}")
                raise PaymentGatewayError(
                    message=f"Nagad complete failed: {err_msg}",
                    code="NAGAD_COMPLETE_FAILED",
                )

            callback_url = comp_data.get("callBackUrl")
            logger.info(f"[Nagad Gateway] Created payment {payment_ref_id} for order {order_id}")
            return {
                "paymentReferenceId": payment_ref_id,
                "callbackUrl": callback_url,
                "status": "Success",
                "is_mock": False,
            }

        except httpx.RequestError as e:
            logger.error(f"[Nagad Gateway] Network error during payment initialization: {e}")
            raise PaymentGatewayError(
                message=f"Failed to connect to Nagad gateway: {e!s}",
                code="NAGAD_CONNECTION_ERROR",
            )

    async def verify_payment(self, payment_ref_id: str) -> dict[str, Any]:
        """Verifies payment status with Nagad."""
        self._assert_configured()

        if self.is_mock_mode() or payment_ref_id.startswith("NG_MOCK_"):
            mock_trx_id = f"TRX_NG_{uuid.uuid4().hex[:10].upper()}"
            logger.info(f"[Nagad Gateway MOCK] Verified payment {payment_ref_id} -> TrxID: {mock_trx_id}")
            return {
                "status": "Success",
                "statusCode": "000_0000",
                "paymentRefId": payment_ref_id,
                "issuerPaymentRefNo": mock_trx_id,
                "amount": self._mock_amounts.get(payment_ref_id, "0.00"),
                "merchantId": self.merchant_id or "MOCK_MERCHANT",
                "orderId": "order_mock",
                "is_mock": True,
            }

        verify_url = f"{self.base_url}/verify/payment/{payment_ref_id}"
        headers = {"X-KM-Api-Version": "v-0.2.0"}

        try:
            async with httpx.AsyncClient(timeout=15.0) as client:
                res = await client.get(verify_url, headers=headers)
                data = res.json()

            if res.status_code != 200:
                logger.error(f"[Nagad Gateway] Verify payment HTTP error: {res.text}")
                raise PaymentGatewayError(
                    message=f"Nagad payment verification failed: {res.text}",
                    code="NAGAD_VERIFY_FAILED",
                )

            logger.info(f"[Nagad Gateway] Payment {payment_ref_id} verification status: {data.get('status')}")
            return data

        except httpx.RequestError as e:
            logger.error(f"[Nagad Gateway] Network error during verify payment: {e}")
            raise PaymentGatewayError(
                message=f"Failed to connect to Nagad gateway: {e!s}",
                code="NAGAD_CONNECTION_ERROR",
            )
