from typing import Any
import httpx
from fastapi import APIRouter, Query, HTTPException

router = APIRouter(prefix="/uid-checker", tags=["UID Checker"])

DEFAULT_GAMESKINBO_KEY = "oVsNJUK6TWHcU9UboX-NgA8BMyjdiLXNve9V8FWCU7w"
DEFAULT_ENDPOINT = "https://api.gameskinbo.com/ff-info/get"

@router.get("/lookup", response_model=dict[str, Any])
@router.post("/lookup", response_model=dict[str, Any])
async def lookup_player_uid(
    uid: str = Query(..., description="Free Fire Player UUID", min_length=6, max_length=25),
    region: str = Query("BD", description="Game Server Region Code"),
    api_key: str | None = Query(None, description="Optional custom API key"),
    endpoint_url: str | None = Query(None, description="Optional custom endpoint URL"),
):
    clean_uid = uid.strip()
    clean_region = (region or "BD").strip()
    key_to_use = (api_key or DEFAULT_GAMESKINBO_KEY).strip()
    url_to_use = (endpoint_url or DEFAULT_ENDPOINT).strip()

    target_url = f"{url_to_use}{'&' if '?' in url_to_use else '?'}uid={clean_uid}&region={clean_region}"

    headers = {
        "x-api-key": key_to_use,
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
        "Accept": "application/json, text/plain, */*",
        "Accept-Language": "en-US,en;q=0.9",
        "Referer": "https://gameskinbo.com/",
    }

    try:
        async with httpx.AsyncClient(timeout=12.0, follow_redirects=True) as client:
            resp = await client.get(target_url, headers=headers)
            
            if resp.status_code != 200:
                try:
                    err_json = resp.json()
                    raw_err = err_json.get("error") or f"HTTP {resp.status_code}"
                except Exception:
                    raw_err = f"HTTP {resp.status_code}"

                is_invalid = "invalid" in raw_err.lower() or "not found" in raw_err.lower()
                user_msg = "প্লেয়ার আইডি পাওয়া যায়নি। অনুগ্রহ করে সঠিক Free Fire Player UID দিন।" if is_invalid else f"প্লেয়ার যাচাই করা যায়নি: {raw_err}"

                return {
                    "valid": False,
                    "uid": clean_uid,
                    "provider": "Games Kinbo",
                    "error": user_msg,
                }

            data = resp.json()
            if data.get("error"):
                is_invalid = "invalid" in str(data.get("error")).lower()
                user_msg = "প্লেয়ার আইডি পাওয়া যায়নি। অনুগ্রহ করে সঠিক Free Fire Player UID দিন।" if is_invalid else f"প্লেয়ার যাচাই করা যায়নি: {data.get('error')}"
                return {
                    "valid": False,
                    "uid": clean_uid,
                    "provider": "Games Kinbo",
                    "error": user_msg,
                }

            account_info = data.get("AccountInfo") or {}
            profile_info = data.get("AccountProfileInfo") or {}
            guild_info = data.get("GuildInfo") or {}

            player_name = account_info.get("AccountName") or "Unknown Player"

            return {
                "valid": True,
                "uid": clean_uid,
                "player_name": player_name,
                "level": account_info.get("AccountLevel"),
                "likes": account_info.get("AccountLikes"),
                "region": account_info.get("AccountRegion") or clean_region,
                "guild_name": guild_info.get("GuildName"),
                "br_rank_points": profile_info.get("BrRankPoint"),
                "cs_rank_points": profile_info.get("CsRankPoint"),
                "status": "Active & Verified",
                "provider": "Games Kinbo",
                "message": f"প্লেয়ার আইডি সফলভাবে ভেরিফাইড হয়েছে ({player_name})",
            }
    except Exception as exc:
        return {
            "valid": False,
            "uid": clean_uid,
            "provider": "Games Kinbo",
            "error": "প্লেয়ার ভেরিফিকেশন প্রোভাইডারে সংযোগ করা যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।",
        }
