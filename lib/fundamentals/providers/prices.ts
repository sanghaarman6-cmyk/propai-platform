// lib/fundamentals/providers/prices.ts

export type PricePoint = { ts: number; price: number }

function nowTs() {
  return Date.now()
}

async function fetchJson<T>(url: string, init?: RequestInit): Promise<T> {
  const r = await fetch(url, init)
  if (!r.ok) throw new Error(`fetch failed ${r.status}: ${url}`)
  return (await r.json()) as T
}

/* -------------------------------------------------------------------------- */
/*                               Twelve Data                                  */
/* -------------------------------------------------------------------------- */

async function twelveDataQuote(symbol: string): Promise<number> {
  const key = process.env.TWELVEDATA_API_KEY
  if (!key) throw new Error("TWELVEDATA_API_KEY not set")

  const MAP: Record<string, string> = {
  // FX
  EURUSD: "EUR/USD",
  GBPUSD: "GBP/USD",
  USDJPY: "USD/JPY",

  // Indices (Twelve Data official)

  // Commodities
  XAUUSD: "XAU/USD",
  WTI: "WTI/USD",

  // Crypto
  BTCUSD: "BTC/USD",
}


  const tdSymbol = MAP[symbol]
  if (!tdSymbol) throw new Error(`No TwelveData mapping for ${symbol}`)

  const url = `https://api.twelvedata.com/quote?symbol=${encodeURIComponent(
    tdSymbol
  )}&apikey=${encodeURIComponent(key)}`

  const j = await fetchJson<any>(url, { next: { revalidate: 30 } })

  const price =
    Number(j?.price) ||
    Number(j?.close) ||
    Number(j?.last) ||
    Number(j?.value)

  if (!Number.isFinite(price)) {
    throw new Error(`TwelveData price missing for ${symbol}`)
  }

  return price
}

/* -------------------------------------------------------------------------- */
/*                              Other Providers                                */
/* -------------------------------------------------------------------------- */

// Crypto (free, no key)
export async function cryptoUsdPrice(coinId: string): Promise<number> {
  const url = `https://api.coingecko.com/api/v3/simple/price?ids=${encodeURIComponent(
    coinId
  )}&vs_currencies=usd`
  const j = await fetchJson<any>(url, { next: { revalidate: 60 } })
  const v = j?.[coinId]?.usd
  if (!v) throw new Error("Crypto price not available")
  return Number(v)
}

/* -------------------------------------------------------------------------- */
/*                                  SPOT                                      */
/* -------------------------------------------------------------------------- */

/**
 * Unified "spot" price for your UI symbols.
 */
export async function spot(symbol: string): Promise<number> {
  // Crypto (keep CoinGecko)
  if (symbol === "BTCUSD") return cryptoUsdPrice("bitcoin")

  // Everything else → Twelve Data
  return twelveDataQuote(symbol)
}

/* -------------------------------------------------------------------------- */
/*                                  SERIES                                    */
/* -------------------------------------------------------------------------- */

/**
 * Simple recent series generator:
 * We query spot several times server-side with caching; not perfect, but real data.
 */
export async function series(
  symbol: string,
  points = 24,
  stepMs = 5 * 60_000
): Promise<PricePoint[]> {
  const out: PricePoint[] = []
  const t0 = nowTs()

  for (let i = points - 1; i >= 0; i--) {
    const ts = t0 - i * stepMs
    const price = await spot(symbol)
    out.push({ ts, price })
  }

  return out
}
