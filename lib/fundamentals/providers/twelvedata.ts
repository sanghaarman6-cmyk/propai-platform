// lib/market/providers/twelvedata.ts

const BASE = "https://api.twelvedata.com"

type TDQuote = {
  symbol: string
  price: string
  timestamp: string
}

async function tdFetch<T>(url: string): Promise<T> {
  const res = await fetch(url, { cache: "no-store" })
  if (!res.ok) {
    throw new Error(`TwelveData fetch failed ${res.status}`)
  }

  const json = await res.json()
  if (json.status === "error") {
    throw new Error(json.message || "TwelveData error")
  }

  return json
}

/**
 * Map your internal symbols → TwelveData symbols
 */
export function mapToTwelveData(symbol: string): string {
  const MAP: Record<string, string> = {
    // FX
    EURUSD: "EUR/USD",
    GBPUSD: "GBP/USD",
    USDJPY: "USD/JPY",

    // Indices
    NAS100: "NASDAQ",
    SPX500: "SPX",
    US30: "DJI",

    // Commodities
    XAUUSD: "XAU/USD",
    WTI: "WTI",

    // Crypto
    BTCUSD: "BTC/USD",
  }

  const mapped = MAP[symbol]
  if (!mapped) {
    throw new Error(`No TwelveData mapping for ${symbol}`)
  }

  return mapped
}

export async function twelveDataQuote(symbol: string) {
  const apiKey = process.env.TWELVEDATA_API_KEY
  if (!apiKey) throw new Error("Missing TWELVEDATA_API_KEY")

  const tdSymbol = mapToTwelveData(symbol)

  const url = `${BASE}/quote?symbol=${encodeURIComponent(
    tdSymbol
  )}&apikey=${apiKey}`

  const data = await tdFetch<TDQuote>(url)

  return {
    symbol,
    price: Number(data.price),
    ts: Date.parse(data.timestamp) || Date.now(),
  }
}
