import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mqrtqldebapvllidkcgs.supabase.co";
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xcnRxbGRlYmFwdmxsaWRrY2dzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzU5MzQzMiwiZXhwIjoyMTAzMTY5NDMyfQ.e_JecxkaenT8OWdIXa-37b4EoPkwlXRp4H9q76eM-n0";

function getSupabaseClient() {
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });
}

// GET: Return public site settings
export async function GET() {
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("key, value")
      .eq("is_public", true);

    if (error) {
      throw error;
    }

    const settingsMap: Record<string, string> = {};
    if (Array.isArray(data)) {
      for (const item of data) {
        settingsMap[item.key] = item.value;
      }
    }

    return NextResponse.json(settingsMap, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "CDN-Cache-Control": "no-store",
        "Vercel-CDN-Cache-Control": "no-store",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load site settings";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PATCH: Update settings
export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json();
    const settings = body.settings || body;
    const supabase = getSupabaseClient();

    const upsertRows = Object.entries(settings).map(([key, value]) => ({
      key,
      value: String(value),
      is_public: true,
    }));

    if (upsertRows.length > 0) {
      const { error } = await supabase
        .from("site_settings")
        .upsert(upsertRows, { onConflict: "key" });

      if (error) {
        throw error;
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update site settings";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
