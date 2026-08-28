import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as Blob | null;

    if (!file) {
      return NextResponse.json({ error: "No image file provided" }, { status: 400 });
    }

    const apiKey =
      process.env.IMGBB_API_KEY ||
      process.env.NEXT_PUBLIC_IMGBB_API_KEY ||
      "4c1d4f76829038f65836adf33d320182";

    if (!apiKey) {
      return NextResponse.json(
        { error: "ImgBB API Key is not configured in .env" },
        { status: 500 }
      );
    }

    // Convert file to Base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Image = buffer.toString("base64");

    // Upload to ImgBB API
    const imgbbForm = new FormData();
    imgbbForm.append("image", base64Image);

    const imgbbRes = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: "POST",
      body: imgbbForm,
    });

    const data = await imgbbRes.json();

    if (!data.success) {
      return NextResponse.json(
        { error: data.error?.message || "Failed to upload image to ImgBB" },
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
