import type { MT5Account } from "@/lib/mt5Store"

export type RouteState = {
  isAuthed: boolean
  account: MT5Account | null | undefined
}

export function getRedirectForPath(
  pathname: string,
  state: RouteState
): string | null {
  const { isAuthed, account } = state

  /* ------------------------------------------------------------------
     1️⃣ NOT LOGGED IN → protect app
  ------------------------------------------------------------------ */
  if (!isAuthed) {
    if (pathname === "/" || pathname.startsWith("/auth")) return null
    return "/"
  }

  /* ------------------------------------------------------------------
     2️⃣ LOGGED IN, NO ACCOUNT → ❌ NO REDIRECTS
     User can freely browse the app and add account later
  ------------------------------------------------------------------ */
  if (!account) {
    // Allow everything: dashboard, analytics, accounts, onboarding, etc.
    return null
  }

  /* ------------------------------------------------------------------
     3️⃣ ACCOUNT EXISTS, RULES NOT CONFIRMED
     (keep this ONLY if you still want enforced setup)
  ------------------------------------------------------------------ */
  if (!account.rulesConfirmed) {
    if (pathname.startsWith("/onboarding")) {
      return null
    }
    return "/onboarding/account-setup"
  }

  /* ------------------------------------------------------------------
     4️⃣ ACCOUNT READY → keep user out of onboarding
  ------------------------------------------------------------------ */
  if (pathname.startsWith("/onboarding")) {
    return "/app/dashboard"
  }

  return null
}
