import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getClientIp, isRateLimited } from "../../../lib/rateLimit";

export const dynamic = "force-dynamic";

// Rate limit: 35 lookups per IP per minute
const MAX_LOOKUPS_PER_MINUTE = 35;
const UID_PATTERN = /^[0-9]{6,20}$/;
const REGION_PATTERN = /^[A-Za-z]{2,5}$/;

const DEFAULT_GAMESKINBO_KEY = "oVsNJUK6TWHcU9UboX-NgA8BMyjdiLXNve9V8FWCU7w";
const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mqrtqldebapvllidkcgs.supabase.co";
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xcnRxbGRlYmFwdmxsaWRrY2dzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzU5MzQzMiwiZXhwIjoyMTAzMTY5NDMyfQ.e_JecxkaenT8OWdIXa-37b4EoPkwlXRp4H9q76eM-n0";
const BACKEND_API_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL || "https://xoxo-shop-production.up.railway.app/api/v1";

// Server-side privileged client to bypass RLS on uid_checker_configs
const serverSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export async function POST(req: Request) {
  try {
    if (isRateLimited(`uid-checker:${getClientIp(req)}`, MAX_LOOKUPS_PER_MINUTE, 60_000)) {
      return NextResponse.json(
        {
          valid: false,
          error: "অনেক বেশি রিকোয়েস্ট হয়েছে। এক মিনিট পর আবার চেষ্টা করুন।",
        },
        { status: 429 },
      );
    }

    const body = await req.json();
    const uid = (body.uid || "").toString().trim();
    let region = (body.region || "").toString().trim();
    const configId = body.config_id ? body.config_id.toString().trim() : null;

    if (region && !REGION_PATTERN.test(region)) {
      return NextResponse.json({ valid: false, error: "Invalid region code." }, { status: 400 });
    }

    if (!UID_PATTERN.test(uid)) {
      return NextResponse.json(
        {
          valid: false,
          error: "অনুগ্রহ করে সঠিক প্লেয়ার আইডি দিন (সর্বনিম্ন ৬ সংখ্যার Player UID)।",
        },
        { status: 400 },
      );
    }

    // 1. Fetch active/primary config from Supabase uid_checker_configs
    let activeConfig: {
      id?: string;
      provider_name: string;
      endpoint_url: string;
      api_key: string;
      header_name: string;
      default_region: string;
      usage_count?: number;
    } | null = null;

    try {
      let query = serverSupabase.from("uid_checker_configs").select("*").eq("is_active", true);
      if (configId && configId !== "primary") {
        query = query.eq("id", configId).limit(1);
      } else {
        query = query.order("is_primary", { ascending: false }).limit(1);
      }

      const { data, error } = await query;
      if (!error && data && data.length > 0) {
        activeConfig = data[0];
      }
    } catch (dbErr) {
      console.warn("Could not query uid_checker_configs from Supabase:", dbErr);
    }

    // Fallback to environment variables or embedded default key if not in DB
    if (!activeConfig || !activeConfig.api_key) {
      const envKey =
        process.env.GAMESKINBO_API_KEY || process.env.FF_UID_API_KEY || DEFAULT_GAMESKINBO_KEY;

      activeConfig = {
        provider_name: "Games Kinbo",
        endpoint_url: "https://api.gameskinbo.com/ff-info/get",
        api_key: envKey,
        header_name: "x-api-key",
        default_region: "BD",
      };
    }

    if (!region) {
      region = activeConfig.default_region || "BD";
    }

    // 2. Query provider with browser headers
    const queryUrl = `${activeConfig.endpoint_url}${activeConfig.endpoint_url.includes("?") ? "&" : "?"}uid=${encodeURIComponent(uid)}&region=${encodeURIComponent(region)}`;

    const headers: Record<string, string> = {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36",
      Accept: "application/json, text/plain, */*",
      "Accept-Language": "en-US,en;q=0.9",
      Referer: "https://gameskinbo.com/",
    };

    if (activeConfig.header_name.toLowerCase() === "authorization") {
      headers["Authorization"] = activeConfig.api_key.startsWith("Bearer ")
        ? activeConfig.api_key
        : `Bearer ${activeConfig.api_key}`;
    } else {
      headers[activeConfig.header_name] = activeConfig.api_key;
    }

    let data: any = null;
    let isSuccess = false;

    // Attempt direct provider lookup
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 9000);

      const apiRes = await fetch(queryUrl, {
        method: "GET",
        headers,
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);

      const rawText = await apiRes.text();
      try {
        data = JSON.parse(rawText);
        if (apiRes.ok && data && !data.error) {
          isSuccess = true;
        }
      } catch {
        console.warn("Direct UID checker parse error, raw response:", rawText.slice(0, 150));
      }
    } catch (fetchErr) {
      console.warn("Direct provider fetch error, attempting backend proxy:", fetchErr);
    }

    // Fallback to Railway backend proxy if direct call failed or returned error
    if (!isSuccess && (!data || !data.AccountInfo)) {
      try {
        const proxyUrl = `${BACKEND_API_URL}/uid-checker/lookup?uid=${encodeURIComponent(uid)}&region=${encodeURIComponent(region)}&api_key=${encodeURIComponent(activeConfig.api_key)}&endpoint_url=${encodeURIComponent(activeConfig.endpoint_url)}`;
        const backendRes = await fetch(proxyUrl, {
          method: "GET",
          cache: "no-store",
        });
        if (backendRes.ok) {
          const backendData = await backendRes.json();
          if (backendData.valid) {
            return NextResponse.json(backendData);
          } else if (backendData.error) {
            return NextResponse.json(backendData, { status: 200 });
          }
        }
      } catch (proxyErr) {
        console.warn("Backend proxy lookup failed:", proxyErr);
      }
    }

    // Process provider response
    if (!data || data.error) {
      const rawError = data?.error || "Player UUID not found on this server.";
      const isInvalidUid =
        typeof rawError === "string" &&
        (rawError.toLowerCase().includes("invalid uid") ||
          rawError.toLowerCase().includes("not found") ||
          rawError.toLowerCase().includes("error") ||
          rawError.toLowerCase().includes("please try again"));

      const userFriendlyError = isInvalidUid
        ? "প্লেয়ার আইডি পাওয়া যায়নি। অনুগ্রহ করে সঠিক Free Fire Player UID দিন।"
        : (data?.error || "প্লেয়ার আইডি যাচাই করা যায়নি। অনুগ্রহ করে পুনরায় চেষ্টা করুন।");

      return NextResponse.json(
        {
          valid: false,
          uid,
          provider: activeConfig.provider_name,
          error: userFriendlyError,
        },
        { status: 200 },
      );
    }

    // 3. Track API usage asynchronously in Supabase
    if (activeConfig.id) {
      void serverSupabase
        .from("uid_checker_configs")
        .update({
          usage_count: (activeConfig.usage_count || 0) + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq("id", activeConfig.id);
    }

    const accountInfo = data.AccountInfo || data.account_info || {};
    const profileInfo = data.AccountProfileInfo || data.account_profile_info || {};
    const guildInfo = data.GuildInfo || data.guild_info || {};

    const playerName =
      accountInfo.AccountName || data.player_name || data.nickname || "Unknown Player";

    return NextResponse.json({
      valid: true,
      uid,
      player_name: playerName,
      level: accountInfo.AccountLevel || null,
      likes: accountInfo.AccountLikes || null,
      region: accountInfo.AccountRegion || region,
      guild_name: guildInfo.GuildName || null,
      br_rank_points: profileInfo.BrRankPoint || null,
      cs_rank_points: profileInfo.CsRankPoint || null,
      status: "Active & Verified",
      provider: activeConfig.provider_name,
      message: `প্লেয়ার আইডি সফলভাবে ভেরিফাইড হয়েছে (${playerName})`,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    console.error("UID checker failure:", err);
    return NextResponse.json(
      { valid: false, error: "Player UUID যাচাই করা যায়নি। কিছুক্ষণ পর আবার চেষ্টা করুন।" },
      { status: 500 },
    );
  }
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const uid = searchParams.get("uid");
  const region = searchParams.get("region") || "";
  const config_id = searchParams.get("config_id") || undefined;

  if (!uid) {
    return NextResponse.json({ valid: false, error: "Missing uid parameter" }, { status: 400 });
  }

  return POST(
    new Request(req.url, {
      method: "POST",
      body: JSON.stringify({ uid, region, config_id }),
    }),
  );
}
