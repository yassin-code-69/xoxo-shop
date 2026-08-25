import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get("code");
  const origin = requestUrl.origin;
  const next = requestUrl.searchParams.get("next") ?? "/";

  if (code) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (supabaseUrl && supabaseAnonKey) {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      const { error } = await supabase.auth.exchangeCodeForSession(code);
      if (error) {
        console.error("Auth callback code exchange error:", error);
      }
    }
  }

  // Redirect user to destination page (profile or home)
  return NextResponse.redirect(`${origin}${next.startsWith("/") ? next : "/" + next}`);
}
