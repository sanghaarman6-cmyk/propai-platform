// lib/mt5/manualSync.ts
export async function manualMT5Sync(accountId: string) {
  const res = await fetch("/api/mt5/sync", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      accountId,
      forceReconnect: true,
    }),
  })

  const json = await res.json()

  if (!res.ok || json?.ok === false) {
    throw new Error(json?.error ?? "MT5 sync failed")
  }

  return json
}
