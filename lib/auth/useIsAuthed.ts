"use client"

import { useEffect, useState } from "react"
import { supabase } from "@/lib/supabase/client"

export function useIsAuthed() {
  const [isAuthed, setIsAuthed] = useState<boolean | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true

    // 1️⃣ Get initial session AFTER hydration
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return
      setIsAuthed(!!data.session)
      setLoading(false)
    })

    // 2️⃣ Listen for future auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsAuthed(!!session)
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  return { isAuthed, loading }
}
