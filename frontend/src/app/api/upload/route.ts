import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

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

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File | Blob | null;

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    // Determine extension
    let ext = "png";
    if ("name" in file && typeof file.name === "string" && file.name.includes(".")) {
      ext = file.name.split(".").pop()?.toLowerCase() || "png";
    } else if (file.type) {
      const typeParts = file.type.split("/");
      if (typeParts.length > 1) {
        ext = typeParts[1].toLowerCase().replace("jpeg", "jpg");
      }
    }
    // Sanitize extension
    if (!["jpg", "jpeg", "png", "webp", "gif", "svg"].includes(ext)) {
      ext = "png";
    }

    const randomId = crypto.randomBytes(8).toString("hex");
    const filename = `img-${Date.now()}-${randomId}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());

    // 1. Primary: Upload directly to Supabase Storage bucket 'public-assets' (fast, global CDN, works everywhere)
    try {
      const supabase = getSupabaseClient();
      const mimeType =
        file.type ||
        (ext === "jpg" || ext === "jpeg"
          ? "image/jpeg"
          : ext === "png"
          ? "image/png"
          : ext === "webp"
          ? "image/webp"
          : "application/octet-stream");

      const { error: uploadError } = await supabase.storage
        .from("public-assets")
        .upload(filename, buffer, {
          contentType: mimeType,
          upsert: true,
        });

      if (!uploadError) {
        const { data: publicUrlData } = supabase.storage
          .from("public-assets")
          .getPublicUrl(filename);

        const cdnUrl = publicUrlData.publicUrl;

        // Optionally cache locally if filesystem is writable (local dev environment)
        try {
          const uploadDir = path.join(process.cwd(), "public", "uploads");
          await fs.mkdir(uploadDir, { recursive: true });
          await fs.writeFile(path.join(uploadDir, filename), buffer);
        } catch {
          // Gracefully ignored on read-only serverless filesystem like Vercel
        }

        return NextResponse.json({
          url: cdnUrl,
          display_url: cdnUrl,
          filename,
        });
      } else {
        console.warn("Supabase storage upload error, falling back:", uploadError);
      }
    } catch (supabaseErr) {
      console.warn("Supabase storage exception, falling back:", supabaseErr);
    }

    // 2. Secondary fallback: Save directly to public/uploads if local file system is writable
    try {
      const uploadDir = path.join(process.cwd(), "public", "uploads");
      await fs.mkdir(uploadDir, { recursive: true });
      const filePath = path.join(uploadDir, filename);
      await fs.writeFile(filePath, buffer);

      const localUrl = `/uploads/${filename}`;
      return NextResponse.json({
        url: localUrl,
        display_url: localUrl,
        filename,
      });
    } catch (fsErr) {
      console.warn("Local storage write failed, attempting ImgBB fallback:", fsErr);
    }

    // 3. Fallback: ImgBB
    const apiKey =
      process.env.IMGBB_API_KEY ||
      process.env.NEXT_PUBLIC_IMGBB_API_KEY ||
      "4c1d4f76829038f65836adf33d320182";

    const base64Image = buffer.toString("base64");
    const imgbbForm = new FormData();
    imgbbForm.append("image", base64Image);

    const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: "POST",
      body: imgbbForm,
    });

    const data = await imgbbRes.json();
    if (!data.success) {
      return NextResponse.json(
        { error: data.error?.message || "Failed to upload image" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      url: data.data.url || data.data.display_url,
      display_url: data.data.display_url,
      delete_url: data.data.delete_url,
      thumb: data.data.thumb?.url,
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Internal server error during upload";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
