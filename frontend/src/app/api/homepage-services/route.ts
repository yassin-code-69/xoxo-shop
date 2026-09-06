import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import { createClient } from "@supabase/supabase-js";

export interface HomepageService {
  id: string;
  name: string;
  src: string;
  href: string;
  tag?: string;
  active: boolean;
  sort_order: number;
}

const defaultServices: HomepageService[] = [
  {
    id: "uid-topup-bd",
    name: "UID TOPUP (BD)",
    src: "/FF/2.jpg",
    href: "/uid-topup",
    tag: "INSTANT",
    active: true,
    sort_order: 1,
  },
  {
    id: "weekly-monthly",
    name: "Weekly & Monthly",
    src: "/FF/3.jpg",
    href: "/weekly-monthly",
    tag: "BEST VALUE",
    active: true,
    sort_order: 2,
  },
  {
    id: "weekly-lite",
    name: "Weekly Lite",
    src: "/FF/4.jpg",
    href: "/weekly-lite",
    tag: "",
    active: true,
    sort_order: 3,
  },
  {
    id: "level-up-pass",
    name: "Level Up Pass",
    src: "/FF/5.jpg",
    href: "/level-up-pass",
    tag: "REWARD",
    active: true,
    sort_order: 4,
  },
  {
    id: "indo-server",
    name: "Indo Server",
    src: "/FF/6.jpg",
    href: "/indonesia-server",
    tag: "",
    active: true,
    sort_order: 5,
  },
  {
    id: "ff-likes",
    name: "FF Likes",
    src: "/FF/1.jpg",
    href: "/ff-likes",
    tag: "",
    active: true,
    sort_order: 6,
  },
];

const dataFilePath = path.join(process.cwd(), "src", "data", "homepage_services.json");

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

async function readServices(): Promise<HomepageService[]> {
  // 1. Primary: Try reading from Supabase site_settings table (persisted across Vercel deployments)
  try {
    const supabase = getSupabaseClient();
    const { data, error } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "homepage_services")
      .maybeSingle();

    if (!error && data?.value) {
      const parsed = JSON.parse(data.value);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
      }
    }
  } catch (supabaseErr) {
    console.warn("Could not read homepage_services from Supabase:", supabaseErr);
  }

  // 2. Fallback: Read from local JSON file
  try {
    const data = await fs.readFile(dataFilePath, "utf8");
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    }
  } catch {
    // If local file doesn't exist or read fails, ignore
  }

  return defaultServices;
}

async function writeServices(services: HomepageService[]): Promise<void> {
  // 1. Primary: Persist to Supabase site_settings database (works on Vercel without filesystem access)
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("site_settings").upsert(
      {
        key: "homepage_services",
        value: JSON.stringify(services),
        is_public: true,
        description: "Homepage diamond category services cards",
      },
      { onConflict: "key" }
    );
    if (error) {
      console.error("Supabase upsert error in writeServices:", error);
    }
  } catch (supabaseErr) {
    console.error("Supabase exception in writeServices:", supabaseErr);
  }

  // 2. Local fallback / sync: attempt writing to local disk, safely catch EROFS on Vercel
  try {
    const dir = path.dirname(dataFilePath);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(dataFilePath, JSON.stringify(services, null, 2), "utf8");
  } catch {
    // Silently ignore EROFS (read-only file system) on Vercel/serverless environments
  }
}

export const dynamic = "force-dynamic";
export const revalidate = 0;

// GET: Return all services (or active only if ?active=true)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") === "true";

    const services = await readServices();
    const result = activeOnly ? services.filter((s) => s.active !== false) : services;

    return NextResponse.json(result, {
      headers: {
        "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
        "CDN-Cache-Control": "no-store",
        "Vercel-CDN-Cache-Control": "no-store",
      },
    });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to load services";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// POST: Add new service or bulk update
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let services = await readServices();

    if (Array.isArray(body)) {
      // Bulk update
      services = body;
    } else {
      const newService: HomepageService = {
        id: body.id || `service-${Date.now()}`,
        name: body.name || "New Service",
        src: body.src || "/FF/2.jpg",
        href: body.href || "/uid-topup",
        tag: body.tag || "",
        active: body.active !== undefined ? Boolean(body.active) : true,
        sort_order: Number(body.sort_order) || services.length + 1,
      };
      services.push(newService);
    }

    services.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    await writeServices(services);

    return NextResponse.json({ success: true, data: services });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to create service";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// PUT: Update or upsert an existing service by ID
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const serviceId = body.id || `service-${Date.now()}`;

    const services = await readServices();
    const index = services.findIndex((s) => s.id === serviceId);

    let updatedService: HomepageService;

    if (index === -1) {
      // Upsert if not found
      updatedService = {
        id: serviceId,
        name: body.name || "Service",
        src: body.src || "/FF/2.jpg",
        href: body.href || "/uid-topup",
        tag: body.tag || "",
        active: body.active !== undefined ? Boolean(body.active) : true,
        sort_order: body.sort_order !== undefined ? Number(body.sort_order) : services.length + 1,
      };
      services.push(updatedService);
    } else {
      updatedService = {
        ...services[index],
        ...body,
        id: serviceId,
        sort_order: body.sort_order !== undefined ? Number(body.sort_order) : services[index].sort_order,
        active: body.active !== undefined ? Boolean(body.active) : services[index].active,
      };
      services[index] = updatedService;
    }

    services.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    await writeServices(services);

    return NextResponse.json({ success: true, data: updatedService });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to update service";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}

// DELETE: Delete a service by ID
export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Service ID is required" }, { status: 400 });
    }

    let services = await readServices();
    services = services.filter((s) => s.id !== id);

    await writeServices(services);

    return NextResponse.json({ success: true });
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : "Failed to delete service";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
