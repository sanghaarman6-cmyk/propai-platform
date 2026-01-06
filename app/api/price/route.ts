import { NextResponse } from "next/server"

/* -------------------------------------------------------------------------- */
/*                               Symbol Routing                               */
/* -------------------------------------------------------------------------- */

const FX_SYMBOLS = ["EURUSD", "GBPUSD", "USDJPY", "AUDUSD", "NZDUSD", "USDCAD", "USDCHF"]

const MANUAL_SYMBOLS = [
  "NAS100",
  "SPX500",
  "US30",
  "NDX",
  "SP500",
]

const TWELVE_DATA_SYMBOLS: Record<string, string> = {
  XAUUSD: "XAU/USD",
}

/* -------------------------------------------------------------------------- */
/*                                   GET                                      */
/* -------------------------------------------------------------------------- */

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url)
  const symbol = searchParams.get("symbol")

  if (!symbol) {
    return NextResponse.json({ ok: false, error: "Missing symbol" }, { status: 400 })
  }

  /* ------------------------------ MANUAL ---------------------------------- */
  if (MANUAL_SYMBOLS.includes(symbol)) {
    return NextResponse.json({
      ok: true,
      symbol,
      manual: true,
      price: null, // UI should allow user input
      source: "manual",
    })
  }

  /* ------------------------------ FX -------------------------------------- */
  if (FX_SYMBOLS.includes(symbol)) {
    try {
      const base = symbol.slice(0, 3)
      const quote = symbol.slice(3)

      const r = await fetch(
        `https://api.frankfurter.app/latest?from=${base}&to=${quote}`,
        { cache: "no-store" }
      )

      const d = await r.json()
      const price = d?.rates?.[quote]

      if (!price) throw new Error("No price")

      return NextResponse.json({
        ok: true,
        symbol,
        price,
        source: "frankfurter",
      })
    } catch {
      return NextResponse.json(
        { ok: false, symbol, error: "FX price unavailable" },
        { status: 502 }
      )
    }
  }

  /* ------------------------------ GOLD ------------------------------------ */
  if (symbol in TWELVE_DATA_SYMBOLS) {
    try {
      const tdSymbol = TWELVE_DATA_SYMBOLS[symbol]
      const apiKey = process.env.TWELVEDATA_API_KEY

      if (!apiKey) {
        return NextResponse.json(
          { ok: false, error: "Missing TwelveData API key" },
          { status: 500 }
        )
      }

      const r = await fetch(
        `https://api.twelvedata.com/price?symbol=${tdSymbol}&apikey=${apiKey}`,
        { cache: "no-store" }
      )

      const d = await r.json()

      if (!d?.price) throw new Error("No price")

      return NextResponse.json({
        ok: true,
        symbol,
        price: Number(d.price),
        source: "twelvedata",
      })
    } catch {
      return NextResponse.json(
        { ok: false, symbol, error: "Gold price unavailable" },
        { status: 502 }
      )
    }
  }

  /* ------------------------------ FALLBACK -------------------------------- */
  return NextResponse.json({
    ok: true,
    symbol,
    manual: true,
    price: null,
    source: "manual",
  })
}
