import { NextRequest, NextResponse } from "next/server";
import fs from "fs/promises";
import path from "path";
import crypto from "crypto";

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

    // 1. Primary: Save directly to public/uploads for instant local serving (<10ms)
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

    // 2. Fallback: If local file system is read-only (e.g., serverless lambda), fallback to ImgBB
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
