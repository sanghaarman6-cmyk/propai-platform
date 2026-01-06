"use client"

import { useEffect, useState } from "react"
import clsx from "clsx"
import { Monitor, AlertTriangle } from "lucide-react"

const MIN_DESKTOP_WIDTH = 1024 // lg breakpoint

export default function MobileWarningGate({
  children,
}: {
  children: React.ReactNode
}) {
  const [isMobile, setIsMobile] = useState(false)
  const [dismissed, setDismissed] = useState(true)

  useEffect(() => {
    const dismissedFlag = localStorage.getItem("edgely_mobile_warning_dismissed")
    setDismissed(Boolean(dismissedFlag))

    function check() {
      setIsMobile(window.innerWidth < MIN_DESKTOP_WIDTH)
    }

    check()
    window.addEventListener("resize", check)
    return () => window.removeEventListener("resize", check)
  }, [])

  function continueAnyway() {
    localStorage.setItem("edgely_mobile_warning_dismissed", "1")
    setDismissed(true)
  }

  const shouldBlock = isMobile && !dismissed

  return (
    <>
      {children}

      {shouldBlock && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur">
          <div className="mx-4 w-full max-w-md rounded-2xl border border-white/10 bg-black p-6 text-white shadow-2xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-yellow-400/30 bg-yellow-400/10">
                <AlertTriangle className="h-5 w-5 text-yellow-300" />
              </div>
              <div className="text-sm font-semibold">
                Desktop experience recommended
              </div>
            </div>

            <p className="mt-4 text-sm text-white/70">
              Mobile support is currently under development. For the best experience,
              please use a desktop or laptop.
            </p>

            <div className="mt-6 space-y-3">
              <a
                href="https://www.google.com/search?q=what+is+desktop+mode+on+mobile"
                className="flex items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/80 hover:bg-white/10"
              >
                <Monitor className="h-4 w-4" />
                How to use desktop mode
              </a>

              <button
                onClick={continueAnyway}
                className={clsx(
                  "w-full rounded-xl px-4 py-2 text-sm font-semibold transition",
                  "bg-emerald-500 text-black hover:bg-emerald-400"
                )}
              >
                Continue anyway
              </button>

              <button
                onClick={() => window.history.back()}
                className="w-full text-center text-xs text-white/50 hover:text-white"
              >
                Go back
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
