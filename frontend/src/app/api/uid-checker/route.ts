import { NextResponse } from "next/server";
import { supabase, isSupabaseConfigured } from "../../../lib/auth/supabase";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const uid = (body.uid || "").toString().trim();
    let region = (body.region || "").toString().trim();
    const configId = body.config_id ? body.config_id.toString().trim() : null;

    if (!uid || uid.length < 6) {
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
        let query = supabase.from("uid_checker_configs").select("*");
        if (configId) {
          query = query.eq("id", configId);
        } else {
          query = query.eq("is_active", true).order("is_primary", { ascending: false }).limit(1);
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
      const envKey =
        process.env.GAMESKINBO_API_KEY ||
        process.env.FF_UID_API_KEY ||
        "oVsNJUK6TWHcU9UboX-NgA8BMyjdiLXNve9V8FWCU7w";

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
          raw: data,
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
      raw: data,
      timestamp: new Date().toISOString(),
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Internal error verifying Player UUID";
    return NextResponse.json({ valid: false, error: msg }, { status: 500 });
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
