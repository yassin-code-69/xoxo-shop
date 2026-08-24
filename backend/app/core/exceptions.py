from typing import Any

from fastapi import status


class AppException(Exception):
    """Base application exception with standardized code and status code."""

    def __init__(
        self,
        message: str,
        code: str = "INTERNAL_ERROR",
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Any | None = None,
    ):
        super().__init__(message)
        self.message = message
        self.code = code
        self.status_code = status_code
        self.details = details


class NotFoundError(AppException):
    def __init__(self, message: str = "Resource not found", code: str = "NOT_FOUND", details: Any | None = None):
        super().__init__(message=message, code=code, status_code=status.HTTP_404_NOT_FOUND, details=details)


class UnauthorizedError(AppException):
    def __init__(
        self, message: str = "Authentication required", code: str = "UNAUTHORIZED", details: Any | None = None
    ):
        super().__init__(message=message, code=code, status_code=status.HTTP_401_UNAUTHORIZED, details=details)


class ForbiddenError(AppException):
    def __init__(self, message: str = "Permission denied", code: str = "FORBIDDEN", details: Any | None = None):
        super().__init__(message=message, code=code, status_code=status.HTTP_403_FORBIDDEN, details=details)


class ConflictError(AppException):
    def __init__(self, message: str = "Conflict state encountered", code: str = "CONFLICT", details: Any | None = None):
        super().__init__(message=message, code=code, status_code=status.HTTP_409_CONFLICT, details=details)


class ValidationError(AppException):
    def __init__(self, message: str = "Invalid input data", code: str = "VALIDATION_ERROR", details: Any | None = None):
        super().__init__(message=message, code=code, status_code=status.HTTP_422_UNPROCESSABLE_ENTITY, details=details)


class ProviderError(AppException):
    def __init__(
        self,
        message: str = "Provider error",
        is_temporary: bool = False,
        code: str = "PROVIDER_ERROR",
        details: Any | None = None,
    ):
        status_code = status.HTTP_503_SERVICE_UNAVAILABLE if is_temporary else status.HTTP_502_BAD_GATEWAY
        super().__init__(message=message, code=code, status_code=status_code, details=details)
        self.is_temporary = is_temporary


class PaymentGatewayError(AppException):
    def __init__(
        self,
        message: str = "Payment gateway error",
        code: str = "PAYMENT_GATEWAY_ERROR",
        status_code: int = status.HTTP_502_BAD_GATEWAY,
        details: Any | None = None,
    ):
        super().__init__(message=message, code=code, status_code=status_code, details=details)

