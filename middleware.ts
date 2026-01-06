import { NextResponse, type NextRequest } from "next/server"
import { createServerClient } from "@supabase/ssr"

export async function middleware(req: NextRequest) {
  const url = req.nextUrl
  const pathname = url.pathname

  const needsAuth = pathname.startsWith("/app") || pathname.startsWith("/onboarding")
  if (!needsAuth) return NextResponse.next()

  const res = NextResponse.next()

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll()
        },
        setAll(cookies) {
          for (const { name, value, options } of cookies) {
            res.cookies.set(name, value, options)
          }
        },
      },
    }
  )

  const { data } = await supabase.auth.getUser()

  // ✅ Only block logged-out users
  if (!data.user) {
    const redirectUrl = req.nextUrl.clone()
    redirectUrl.pathname = "/"
    redirectUrl.searchParams.set("next", pathname)
    return NextResponse.redirect(redirectUrl)
  }

  // ✅ Do NOT check billing here
  return res
}

export const config = {
  matcher: ["/app/:path*", "/onboarding/:path*"],
}
