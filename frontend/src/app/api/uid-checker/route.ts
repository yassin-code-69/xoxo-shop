import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "../../../lib/auth/supabase";
import { getClientIp, isRateLimited } from "../../../lib/rateLimit";

// This route spends a paid provider API key on every call, so it is capped per IP.
const MAX_LOOKUPS_PER_MINUTE = 15;
const UID_PATTERN = /^[0-9]{6,20}$/;
const REGION_PATTERN = /^[A-Za-z]{2,5}$/;

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
          error:
            "অনুগ্রহ করে সঠিক প্লেয়ার আইডি/UUID দিন (Please enter a valid Player UUID, minimum 6 digits).",
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

    if (isSupabaseConfigured) {
      try {
        // Always constrained to active configs: config_id comes from the client, and
        // without this it could select a disabled or unrelated provider key.
        let query = supabase.from("uid_checker_configs").select("*").eq("is_active", true);
        if (configId) {
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
    }

    // Fallback to environment variables if not found in DB
    if (!activeConfig) {
      const envKey = process.env.GAMESKINBO_API_KEY || process.env.FF_UID_API_KEY;
      if (!envKey) {
        console.error("UID checker: no active config in DB and GAMESKINBO_API_KEY is not set");
        return NextResponse.json(
          {
            valid: false,
            error:
              "UID যাচাই সেবা এই মুহূর্তে কনফিগার করা নেই। অনুগ্রহ করে সাপোর্টে যোগাযোগ করুন।",
          },
          { status: 503 },
        );
      }

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

    // 2. Call the provider endpoint
    const queryUrl = `${activeConfig.endpoint_url}${activeConfig.endpoint_url.includes("?") ? "&" : "?"}uid=${encodeURIComponent(uid)}&region=${encodeURIComponent(region)}`;

    const headers: Record<string, string> = {};
    if (activeConfig.header_name.toLowerCase() === "authorization") {
      headers["Authorization"] = activeConfig.api_key.startsWith("Bearer ")
        ? activeConfig.api_key
        : `Bearer ${activeConfig.api_key}`;
    } else {
      headers[activeConfig.header_name] = activeConfig.api_key;
    }

    const apiRes = await fetch(queryUrl, {
      method: "GET",
      headers,
      next: { revalidate: 15 },
    });

    const data = await apiRes.json();

    if (!apiRes.ok || data.error) {
      const apiError = data.error || "Player UUID not found on this server.";
      return NextResponse.json(
        {
          valid: false,
          uid,
          provider: activeConfig.provider_name,
          error: `প্লেয়ার পাওয়া যায়নি: ${apiError} (Player not found on ${region} server)`,
        },
        { status: 200 },
      );
    }

    // 3. Track API usage asynchronously in Supabase
    if (isSupabaseConfigured && activeConfig.id) {
      void supabase
        .from("uid_checker_configs")
        .update({
          usage_count: (activeConfig.usage_count || 0) + 1,
          last_used_at: new Date().toISOString(),
        })
        .eq("id", activeConfig.id);
    }

    const accountInfo = data.AccountInfo || {};
    const profileInfo = data.AccountProfileInfo || {};
    const guildInfo = data.GuildInfo || {};

    return NextResponse.json({
      valid: true,
      uid,
      player_name: accountInfo.AccountName || "Unknown Player",
      level: accountInfo.AccountLevel || null,
      likes: accountInfo.AccountLikes || null,
      region: accountInfo.AccountRegion || region,
      guild_name: guildInfo.GuildName || null,
      br_rank_points: profileInfo.BrRankPoint || null,
      cs_rank_points: profileInfo.CsRankPoint || null,
      status: "Active & Verified",
      provider: activeConfig.provider_name,
      message: `প্লেয়ার আইডি সফলভাবে ভেরিফাইড হয়েছে (${accountInfo.AccountName})`,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    // The upstream error text can name internal hosts and key handling; log it, don't ship it.
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
