from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.modules.settings.model import SiteSetting


PRIVATE_SETTING_KEYS = {
    "diamond_api_key",
    "gemini_api_key",
    "telegram_bot_token",
}

PUBLIC_SETTING_KEYS = {
    "site_title",
    "notice",
    "support_phone",
    "support_whatsapp",
    "support_telegram",
    "support_facebook",
    "support_facebook_group",
    "support_instagram",
    "support_youtube",
    "support_email",
    "telegram_helpline_text",
    "telegram_helpline_label",
    "app_download_url",
    "maintenance_mode",
    "wallet_pay_image",
    "instant_pay_image",
    "homepage_services",
    "diamond_api_mode",
    "diamond_api_url",
}


class SiteSettingService:
    def __init__(self, db: AsyncSession):
        self.db = db

    async def get_public_settings(self) -> dict[str, str]:
        query = select(SiteSetting).where(SiteSetting.is_public == True)  # noqa: E712
        result = await self.db.execute(query)
        settings_list = result.scalars().all()
        return {s.key: s.value for s in settings_list}

    async def get_all_settings(self) -> list[SiteSetting]:
        query = select(SiteSetting).order_by(SiteSetting.key.asc())
        result = await self.db.execute(query)
        return list(result.scalars().all())

    async def update_settings(self, new_settings: dict[str, str]) -> dict[str, str]:
        for key, value in new_settings.items():
            res = await self.db.execute(select(SiteSetting).where(SiteSetting.key == key))
            setting = res.scalars().first()
            is_pub = key in PUBLIC_SETTING_KEYS or (
                key not in PRIVATE_SETTING_KEYS and not key.endswith("_key") and not key.endswith("_secret")
            )
            if setting:
                setting.value = value
                setting.is_public = is_pub
            else:
                setting = SiteSetting(key=key, value=value, is_public=is_pub)
                self.db.add(setting)
        await self.db.commit()
        return await self.get_public_settings()

