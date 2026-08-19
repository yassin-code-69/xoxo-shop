from decimal import Decimal
from typing import Any

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.logging import logger
from app.modules.games.model import Game
from app.modules.products.model import TopupProduct
from app.shared.utils import slugify


class ExternalTopupProviderService:
    @staticmethod
    async def test_external_api(api_url: str, api_key: str | None = None) -> dict[str, Any]:
        """Test HTTP connectivity and discover packages from external diamond API."""
        if not api_url or not api_url.strip():
            return {
                "success": False,
                "status_code": 400,
                "packages_found": 0,
                "message": "External API URL cannot be empty.",
                "sample_data": [],
            }

        headers = {
            "User-Agent": "XoXoShop-DiamondIntegration/1.0",
            "Accept": "application/json",
        }
        if api_key and api_key.strip():
            headers["Authorization"] = f"Bearer {api_key.strip()}"
            headers["x-api-key"] = api_key.strip()

        try:
            async with httpx.AsyncClient(timeout=6.0, follow_redirects=True) as client:
                resp = await client.get(api_url.strip(), headers=headers)
                status_code = resp.status_code

                if resp.is_success:
                    try:
                        data = resp.json()
                    except Exception:
                        data = []

                    packages = ExternalTopupProviderService._extract_packages(data)
                    return {
                        "success": True,
                        "status_code": status_code,
                        "packages_found": len(packages),
                        "sample_data": packages[:5],
                        "message": f"Successfully connected! Discovered {len(packages)} diamond packages from provider API.",
                    }
                else:
                    return {
                        "success": False,
                        "status_code": status_code,
                        "packages_found": 0,
                        "sample_data": [],
                        "message": f"Provider API responded with HTTP status {status_code}: {resp.text[:200]}",
                    }
        except httpx.TimeoutException:
            return {
                "success": False,
                "status_code": 408,
                "packages_found": 0,
                "sample_data": [],
                "message": "Connection to external diamond API timed out after 6 seconds.",
            }
        except Exception as exc:
            logger.warning(f"External API test error: {exc}")
            return {
                "success": False,
                "status_code": 500,
                "packages_found": 0,
                "sample_data": [],
                "message": f"Could not reach external diamond API: {str(exc)}",
            }

    @staticmethod
    def _extract_packages(data: Any) -> list[dict[str, Any]]:
        """Normalize JSON response structures into standard diamond package dicts."""
        items: list[Any] = []
        if isinstance(data, list):
            items = data
        elif isinstance(data, dict):
            for key in ["data", "products", "packages", "items", "results"]:
                if key in data and isinstance(data[key], list):
                    items = data[key]
                    break
            if not items and "name" in data:
                items = [data]

        normalized: list[dict[str, Any]] = []
        for i, item in enumerate(items):
            if not isinstance(item, dict):
                continue
            name = item.get("name") or item.get("title") or item.get("product_name") or f"Diamond Pack {i + 1}"
            sku = item.get("provider_sku") or item.get("sku") or item.get("code") or slugify(name).upper()

            # Extract diamond amount
            diamonds = item.get("diamond_amount") or item.get("diamonds") or item.get("amount") or 0
            if isinstance(diamonds, str) and diamonds.isdigit():
                diamonds = int(diamonds)
            elif not isinstance(diamonds, int):
                diamonds = 0

            # Extract price
            price_raw = item.get("selling_price") or item.get("price") or item.get("bdt") or 0
            try:
                price = Decimal(str(price_raw))
            except Exception:
                price = Decimal("0.00")

            cost_raw = item.get("provider_cost") or item.get("cost") or (price * Decimal("0.9"))
            try:
                cost = Decimal(str(cost_raw))
            except Exception:
                cost = Decimal("0.00")

            normalized.append(
                {
                    "name": str(name),
                    "slug": slugify(name),
                    "diamond_amount": diamonds,
                    "bonus_amount": int(item.get("bonus_amount", 0) or 0),
                    "selling_price": price,
                    "provider_cost": cost,
                    "provider_sku": str(sku),
                    "tag": item.get("tag"),
                    "category": item.get("category", "UID Topup"),
                    "sort_order": int(item.get("sort_order", i + 1)),
                }
            )
        return normalized

    @staticmethod
    async def fetch_external_products(api_url: str, api_key: str | None = None) -> list[dict[str, Any]]:
        """Fetch live product packages from external API."""
        headers = {
            "User-Agent": "XoXoShop-DiamondIntegration/1.0",
            "Accept": "application/json",
        }
        if api_key and api_key.strip():
            headers["Authorization"] = f"Bearer {api_key.strip()}"
            headers["x-api-key"] = api_key.strip()

        async with httpx.AsyncClient(timeout=4.0, follow_redirects=True) as client:
            resp = await client.get(api_url.strip(), headers=headers)
            if resp.is_success:
                return ExternalTopupProviderService._extract_packages(resp.json())
        return []

    @staticmethod
    async def sync_external_packages_to_db(
        db: AsyncSession, api_url: str, api_key: str | None = None
    ) -> dict[str, Any]:
        """Fetch from external API and upsert into database."""
        packages = await ExternalTopupProviderService.fetch_external_products(api_url, api_key)
        if not packages:
            return {"success": False, "synced_count": 0, "message": "No packages retrieved from external API."}

        # Get default Free Fire game
        game_res = await db.execute(select(Game).where(Game.slug == "free-fire"))
        game = game_res.scalars().first()
        if not game:
            game = Game(name="Free Fire", slug="free-fire", active=True)
            db.add(game)
            await db.flush()

        synced_count = 0
        for p in packages:
            slug = p["slug"]
            existing = await db.execute(select(TopupProduct).where(TopupProduct.slug == slug))
            prod = existing.scalars().first()

            if prod:
                prod.name = p["name"]
                prod.diamond_amount = p["diamond_amount"]
                prod.bonus_amount = p["bonus_amount"]
                prod.selling_price = p["selling_price"]
                prod.provider_cost = p["provider_cost"]
                prod.provider_sku = p["provider_sku"]
                prod.tag = p.get("tag")
                prod.active = True
            else:
                new_prod = TopupProduct(
                    game_id=game.id,
                    name=p["name"],
                    slug=slug,
                    category="UID Topup",
                    diamond_amount=p["diamond_amount"],
                    bonus_amount=p["bonus_amount"],
                    selling_price=p["selling_price"],
                    provider_cost=p["provider_cost"],
                    provider_sku=p["provider_sku"],
                    currency="BDT",
                    active=True,
                    sort_order=p["sort_order"],
                    tag=p.get("tag"),
                )
                db.add(new_prod)
            synced_count += 1

        await db.commit()
        return {
            "success": True,
            "synced_count": synced_count,
            "message": f"Successfully synchronized {synced_count} diamond packages into database!",
        }
