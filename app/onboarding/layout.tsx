"use client"

import type { ReactNode } from "react"
import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"

import { getRedirectForPath } from "@/lib/auth/routeGuard"
import { useActiveAccountLive } from "@/lib/selectors/useActiveAccountLive"
import { useIsAuthed } from "@/lib/auth/useIsAuthed"

export default function OnboardingLayout({
  children,
}: {
  children: ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()

  const { isAuthed, loading } = useIsAuthed()
  const account = useActiveAccountLive()

  useEffect(() => {
    if (loading || isAuthed === null) return


    const redirect = getRedirectForPath(pathname, {
      isAuthed,
      account,
    })

    if (redirect) {
      router.replace(redirect)
    }
  }, [pathname, isAuthed, account, loading, router])

  return <>{children}</>
}
