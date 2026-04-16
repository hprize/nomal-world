import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@nomal-world/db/server";

export async function POST(request: NextRequest) {
  const supabase = createServerClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ success: 0, error: "Unauthorized" }, { status: 401 });
  }

  const { url } = await request.json();

  if (!url || typeof url !== "string") {
    return NextResponse.json({ success: 0, error: "URL is required" }, { status: 400 });
  }

  // http/https만 허용 — 그 외 scheme은 서버에서 처리 불가
  if (!url.startsWith("http://") && !url.startsWith("https://")) {
    return NextResponse.json({ success: 0, error: "Invalid URL scheme" }, { status: 400 });
  }

  try {
    // 서버 사이드에서 외부 이미지 fetch (CORS 우회)
    const imageRes = await fetch(url);
    if (!imageRes.ok) {
      return NextResponse.json({ success: 0, error: "Failed to fetch image" }, { status: 400 });
    }

    const contentType = imageRes.headers.get("content-type") || "image/jpeg";
    const ext = contentType.split("/")[1]?.split(";")[0]?.replace("jpeg", "jpg") || "jpg";
    const buffer = await imageRes.arrayBuffer();

    const fileName = `content/${Date.now()}-${Math.random().toString(36).slice(2)}.${ext}`;

    const { error } = await supabase.storage
      .from("gathering-images")
      .upload(fileName, buffer, { contentType });

    if (error) throw error;

    const { data: urlData } = supabase.storage
      .from("gathering-images")
      .getPublicUrl(fileName);

    return NextResponse.json({ success: 1, file: { url: urlData.publicUrl } });
  } catch {
    return NextResponse.json({ success: 0, error: "Upload failed" }, { status: 500 });
  }
}
