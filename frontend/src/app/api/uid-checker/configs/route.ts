import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL || "https://mqrtqldebapvllidkcgs.supabase.co";
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1xcnRxbGRlYmFwdmxsaWRrY2dzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4NzU5MzQzMiwiZXhwIjoyMTAzMTY5NDMyfQ.e_JecxkaenT8OWdIXa-37b4EoPkwlXRp4H9q76eM-n0";

// Server-side privileged client to bypass RLS on uid_checker_configs
const serverSupabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

export async function GET() {
  try {
    const { data, error } = await serverSupabase
      .from("uid_checker_configs")
      .select("*")
      .order("is_primary", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("GET /api/uid-checker/configs error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data || []);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to fetch configs";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const input = await req.json();

    if (!input.provider_name || !input.endpoint_url || !input.api_key) {
      return NextResponse.json(
        { error: "Provider Name, Base Endpoint URL, and API Key are required." },
        { status: 400 },
      );
    }

    // If setting as primary, demote existing primary configs first
    if (input.is_primary) {
      await serverSupabase
        .from("uid_checker_configs")
        .update({ is_primary: false, updated_at: new Date().toISOString() })
        .neq("id", "none");
    }

    const { data, error } = await serverSupabase
      .from("uid_checker_configs")
      .insert({
        provider_name: String(input.provider_name).trim(),
        endpoint_url: String(input.endpoint_url).trim(),
        api_key: String(input.api_key).trim(),
        header_name: String(input.header_name || "x-api-key").trim(),
        default_region: String(input.default_region || "BD").trim(),
        is_active: input.is_active ?? true,
        is_primary: input.is_primary ?? false,
        rate_limit_per_min: Number(input.rate_limit_per_min) || 30,
        notes: input.notes ? String(input.notes).trim() : null,
        usage_count: 0,
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) {
      console.error("POST /api/uid-checker/configs insert error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data, { status: 201 });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create config";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const input = await req.json();
    const id = input.id;

    if (!id) {
      return NextResponse.json({ error: "Missing config ID" }, { status: 400 });
    }

    // If setting as primary, demote others first
    if (input.is_primary) {
      await serverSupabase
        .from("uid_checker_configs")
        .update({ is_primary: false, updated_at: new Date().toISOString() })
        .neq("id", id);
    }

    const updatePayload: Record<string, any> = {
      updated_at: new Date().toISOString(),
    };

    if (input.provider_name !== undefined) updatePayload.provider_name = String(input.provider_name).trim();
    if (input.endpoint_url !== undefined) updatePayload.endpoint_url = String(input.endpoint_url).trim();
    if (input.api_key !== undefined) updatePayload.api_key = String(input.api_key).trim();
    if (input.header_name !== undefined) updatePayload.header_name = String(input.header_name).trim();
    if (input.default_region !== undefined) updatePayload.default_region = String(input.default_region).trim();
    if (input.is_active !== undefined) updatePayload.is_active = Boolean(input.is_active);
    if (input.is_primary !== undefined) updatePayload.is_primary = Boolean(input.is_primary);
    if (input.rate_limit_per_min !== undefined) updatePayload.rate_limit_per_min = Number(input.rate_limit_per_min);
    if (input.notes !== undefined) updatePayload.notes = input.notes ? String(input.notes).trim() : null;

    const { data, error } = await serverSupabase
      .from("uid_checker_configs")
      .update(updatePayload)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("PUT /api/uid-checker/configs update error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json(data);
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update config";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Missing config ID" }, { status: 400 });
    }

    const { error } = await serverSupabase
      .from("uid_checker_configs")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("DELETE /api/uid-checker/configs error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true, id });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete config";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
