import { useEffect, useRef, useState } from "react"
import md5 from "md5"

type CacheEntry = {
  hash: string
  text: string
  ts: number
}

export function usePersistentAI<TPayload>({
  cacheKey,
  payload,
  run,
  enabled = true
}: {
  cacheKey: string
  payload: TPayload
  run: (payload: TPayload) => Promise<string>
  enabled?: boolean
}) {
  const payloadHash = md5(JSON.stringify(payload))
  const storageKey = `${cacheKey}`

  const [text, setText] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const lastHashRef = useRef<string | null>(null)

  // Load from cache on mount / payload change
  useEffect(() => {
    if (!enabled) return

    try {
      const raw = localStorage.getItem(storageKey)
      if (!raw) return

      const parsed: CacheEntry = JSON.parse(raw)
      if (parsed.hash === payloadHash) {
        setText(parsed.text)
        lastHashRef.current = parsed.hash
      }
    } catch {}
  }, [storageKey, payloadHash, enabled])

  async function generate(force = false) {
    if (!enabled) return
    if (!force && lastHashRef.current === payloadHash && text) return

    setLoading(true)
    try {
      const result = await run(payload)
      setText(result)
      lastHashRef.current = payloadHash

      localStorage.setItem(
        storageKey,
        JSON.stringify({
          hash: payloadHash,
          text: result,
          ts: Date.now()
        })
      )
    } finally {
      setLoading(false)
    }
  }

  return {
    text,
    loading,
    generate,
    hasCache: !!text
  }
}
