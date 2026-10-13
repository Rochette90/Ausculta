import { NextResponse } from "next/server";
import { assertSameOrigin } from "@/app/lib/api-security";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  try {
    assertSameOrigin(request);
    const supabase = await createClient();
    await supabase.auth.signOut();
  } catch {
    // Always return to the public homepage, even if the remote session expired.
  }
  return NextResponse.redirect(new URL("/", request.url), { status: 303 });
}
