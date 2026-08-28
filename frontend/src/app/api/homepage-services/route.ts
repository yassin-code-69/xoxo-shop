import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";

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

async function readServices(): Promise<HomepageService[]> {
  try {
    const data = await fs.readFile(dataFilePath, "utf8");
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) {
      return parsed.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    }
  } catch {
    // If file doesn't exist or read fails, initialize with defaults
    try {
      await fs.writeFile(dataFilePath, JSON.stringify(defaultServices, null, 2), "utf8");
    } catch {}
  }
  return defaultServices;
}

async function writeServices(services: HomepageService[]): Promise<void> {
  const dir = path.dirname(dataFilePath);
  try {
    await fs.mkdir(dir, { recursive: true });
  } catch {}
  await fs.writeFile(dataFilePath, JSON.stringify(services, null, 2), "utf8");
}

// GET: Return all services (or active only if ?active=true)
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const activeOnly = searchParams.get("active") === "true";

    const services = await readServices();
    const result = activeOnly ? services.filter((s) => s.active !== false) : services;

    return NextResponse.json(result);
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
        active: body.active !== undefined ? body.active : true,
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

// PUT: Update an existing service by ID
export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json({ error: "Service ID is required" }, { status: 400 });
    }

    const services = await readServices();
    const index = services.findIndex((s) => s.id === body.id);

    if (index === -1) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    services[index] = {
      ...services[index],
      ...body,
      sort_order: body.sort_order !== undefined ? Number(body.sort_order) : services[index].sort_order,
      active: body.active !== undefined ? Boolean(body.active) : services[index].active,
    };

    services.sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0));
    await writeServices(services);

    return NextResponse.json({ success: true, data: services[index] });
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
