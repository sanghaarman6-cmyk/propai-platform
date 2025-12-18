"use client"

import { useEffect } from "react"
import { useToastStore } from "@/lib/toastStore"

export default function ToastHost() {
  const { toasts, removeToast } = useToastStore()

  useEffect(() => {
    if (toasts.length === 0) return
    const timers = toasts.map((t) =>
      setTimeout(() => removeToast(t.id), t.durationMs ?? 2600)
    )
    return () => timers.forEach(clearTimeout)
  }, [toasts, removeToast])

  return (
    <div className="fixed right-4 top-4 z-50 space-y-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          className="w-[320px] rounded border border-border bg-bg-panel p-3 shadow-glow"
        >
          <div className="text-sm font-medium">{t.title}</div>
          {t.description && (
            <div className="mt-1 text-xs text-text-muted">{t.description}</div>
          )}
        </div>
      ))}
    </div>
  )
}
