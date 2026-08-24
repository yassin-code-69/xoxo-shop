from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    APP_NAME: str = "XoXo Shop API"
    APP_ENV: str = "development"
    DEBUG: bool = True
    APP_URL: str = "http://localhost:8000"
    API_V1_STR: str = "/api/v1"

    # CORS
    BACKEND_CORS_ORIGINS: list[str] = [
        "http://localhost:3000",
        "http://127.0.0.1:3000",
        "http://localhost:8000",
        "http://127.0.0.1:8000",
    ]

    # Database
    # Default to sqlite+aiosqlite:///./xoxo_shop.db for local dev / testing if DATABASE_URL not set
    DATABASE_URL: str = "sqlite+aiosqlite:///./xoxo_shop.db"
    DB_ECHO: bool = False

    # Supabase Auth & JWT
    SUPABASE_URL: str | None = None
    SUPABASE_ANON_KEY: str | None = None
    SUPABASE_SERVICE_ROLE_KEY: str | None = None
    SUPABASE_JWT_SECRET: str | None = "dev-secret-key-change-in-production-must-be-long-enough-32bytes"
    SUPABASE_JWT_AUDIENCE: str = "authenticated"

    # Storage
    SUPABASE_STORAGE_BUCKET_PAYMENT_PROOFS: str = "payment-proofs"

    # Provider configuration
    PROVIDER_NAME: str = "mock"
    PROVIDER_API_BASE_URL: str = "https://api.mockprovider.com"
    PROVIDER_API_KEY: str = "mock-key"
    PROVIDER_TIMEOUT_SECONDS: int = 15
    MOCK_PROVIDER_OUTCOME: str = "success"  # success, processing, temporary_fail, permanent_fail, timeout

    # Payment Gateways
    MANUAL_PAYMENT_ENABLED: bool = True
    AUTOMATIC_PAYMENT_ENABLED: bool = True
    PAYMENT_GATEWAY_NAME: str = "mock"

    # bKash Gateway
    BKASH_APP_KEY: str = ""
    BKASH_APP_SECRET: str = ""
    BKASH_USERNAME: str = ""
    BKASH_PASSWORD: str = ""
    BKASH_BASE_URL: str = "https://tokenized.sandbox.bka.sh/v1.2.0-beta"
    BKASH_CALLBACK_URL: str = "http://localhost:8000/api/v1/payments/bkash/callback"

    # Nagad Gateway
    NAGAD_MERCHANT_ID: str = ""
    NAGAD_MERCHANT_PRIVATE_KEY: str = ""
    NAGAD_PG_PUBLIC_KEY: str = ""
    NAGAD_BASE_URL: str = "http://sandbox.mynagad.com:10080/remote-payment-gateway-1.0/api/dfs"
    NAGAD_CALLBACK_URL: str = "http://localhost:8000/api/v1/payments/nagad/callback"

    # Frontend URL for post-payment redirects
    FRONTEND_URL: str = "http://localhost:3000"

    # Admin bootstrap
    ADMIN_EMAIL: str = "admin@xoxoshop.com"

    LOG_LEVEL: str = "INFO"


settings = Settings()
