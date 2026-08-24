from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ManualPaymentSubmitRequest(BaseModel):
    transaction_id: str = Field(..., min_length=4, max_length=128, description="Transaction ID / TrxID from SMS or App")
    sender_number: str | None = Field(default=None, max_length=32, description="Sender bKash/Nagad/Rocket phone number")
    payment_method: str | None = Field(default=None, description="Optional method override e.g. BKASH, NAGAD, ROCKET")
    proof_path: str | None = Field(default=None, max_length=512, description="Uploaded screenshot path if any")


class PaymentPublicRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: str
    order_id: str
    payment_type: str
    payment_method: str
    amount: Decimal
    currency: str
    transaction_id: str | None = None
    sender_number: str | None = None
    status: str
    submitted_at: datetime | None = None


class PaymentAdminRead(PaymentPublicRead):
    public_order_id: str | None = None
    customer_email: str | None = None
    customer_name: str | None = None
    proof_path: str | None = None
    verified_at: datetime | None = None
    verified_by: str | None = None
    rejection_reason: str | None = None
    created_at: datetime
    updated_at: datetime


class PaymentApproveRequest(BaseModel):
    notes: str | None = None


class PaymentRejectRequest(BaseModel):
    reason: str = Field(..., min_length=3, max_length=255, description="Reason for rejection")


class GatewayInitiateRequest(BaseModel):
    gateway: str = Field(..., description="Gateway name: BKASH or NAGAD")


class GatewayInitiateResponse(BaseModel):
    gateway: str
    redirect_url: str
    payment_session_id: str
    order_id: str
    public_order_id: str
    amount: Decimal
    currency: str
    is_mock: bool = False

