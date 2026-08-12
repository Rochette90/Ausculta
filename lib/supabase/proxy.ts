import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  const createResponse = () => {
    const requestHeaders = new Headers(request.headers);
    requestHeaders.set(
      "x-medtrain-pathname",
      `${request.nextUrl.pathname}${request.nextUrl.search}`,
    );
    return NextResponse.next({ request: { headers: requestHeaders } });
  };

  let response = createResponse();
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return response;

  const supabase = createServerClient(url, key, {
    cookies: {
      getAll: () => request.cookies.getAll(),
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = createResponse();
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options),
        );
      },
    },
  });

  // getUser verifies the JWT with Supabase and refreshes it when necessary.
  await supabase.auth.getUser();
  return response;
}
