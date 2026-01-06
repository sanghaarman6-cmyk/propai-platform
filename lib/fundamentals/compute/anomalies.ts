// lib/fundamentals/compute/anomalies.ts
import { series } from "@/lib/fundamentals/providers/prices"
import type { Anomaly } from "@/lib/types"

type Input = {
  symbols: string[]
}

export async function buildAnomalies({ symbols }: Input): Promise<Anomaly[]> {
  console.log("🧠 buildAnomalies CALLED with symbols:", symbols)

  const out: Anomaly[] = []
  const now = Date.now()

  for (const symbol of symbols) {
    try {
      const data = await series(symbol, 12, 5 * 60_000)

      if (data.length < 6) {
        console.log(`⚠️ ${symbol}: insufficient candles (${data.length})`)
        continue
      }

      const prices = data.map((d) => d.price)
      const hi = Math.max(...prices)
      const lo = Math.min(...prices)
      const rangePct = ((hi - lo) / lo) * 100

      const firstTs = new Date(data[0].ts).toLocaleTimeString()
      const lastTs = new Date(data.at(-1)!.ts).toLocaleTimeString()

      console.log(
        `📊 ${symbol} window ${firstTs} → ${lastTs}`,
        `| range=${rangePct.toFixed(2)}%`
      )

      let triggered = false

      if (rangePct > 0.6) {
        triggered = true
        out.push({
          id: `vol-${symbol}-${now}`,
          ts: now,
          name: "Short-term volatility expansion",
          symbol,
          severity: Math.min(90, Math.round(rangePct * 20)),
          category: "Volatility",
          detection: `Range expanded ${rangePct.toFixed(2)}% over recent candles.`,
          implication: "Breakouts more likely; mean reversion weaker.",
          suggestedAction: "Reduce size or wait for confirmation.",
        })
      }

      const last = prices.at(-1)!
      const prev = prices.at(-2)!
      const jumpPct = Math.abs((last - prev) / prev) * 100

      console.log(
        `↳ ${symbol} last-candle jump=${jumpPct.toFixed(2)}%`
      )

      if (jumpPct > 0.3) {
        triggered = true
        out.push({
          id: `liq-${symbol}-${now}`,
          ts: now,
          name: "Abrupt price jump",
          symbol,
          severity: Math.min(85, Math.round(jumpPct * 30)),
          category: "Liquidity",
          detection: `Single-interval move of ${jumpPct.toFixed(2)}%.`,
          implication: "Thin liquidity or headline-driven move.",
          suggestedAction: "Avoid market orders; wait for pullback.",
        })
      }

      if (!triggered) {
        console.log(`✅ ${symbol}: NO anomalies → market calm`)
      }
    } catch (e) {
      console.log(`❌ ${symbol}: anomaly check failed`, e)
    }
  }

  console.log(`🧠 buildAnomalies DONE → ${out.length} anomalies`)
  return out.sort((a, b) => b.severity - a.severity)
}
