// lib/fundamentals/ai/utils.ts
import crypto from "crypto"
import type { AIEventInsight } from "./types"

export function hashPayload(payload: unknown) {
  const str = JSON.stringify(payload)
  return crypto.createHash("sha256").update(str).digest("hex")
}



export function coerceInsight(raw: any): AIEventInsight {
  return {
    simpleSummary:
      String(raw.simpleSummary ?? "").trim() ||
      "No summary available.",

    // ✅ FIX IS HERE
    whyItMatters:
      typeof raw.whyItMatters === "object" && raw.whyItMatters !== null
        ? {
            headline:
              String(raw.whyItMatters.headline ?? "Why this matters"),
            bullets: Array.isArray(raw.whyItMatters.bullets)
              ? raw.whyItMatters.bullets.map((x: any) => String(x))
              : [],
            macroContext:
              raw.whyItMatters.macroContext
                ? String(raw.whyItMatters.macroContext)
                : undefined,
          }
        : {
            headline: "Why this matters",
            bullets:
              typeof raw.whyItMatters === "string"
                ? raw.whyItMatters
                    .split(".")
                    .map((s: string) => s.trim())
                    .filter(Boolean)
                : [],
          },

    marketImpact: {
      equities: raw.marketImpact?.equities ?? "Neutral",
      fx: raw.marketImpact?.fx ?? "Neutral",
      rates: raw.marketImpact?.rates ?? "Neutral",
      metals: raw.marketImpact?.metals ?? "Neutral",
      crypto: raw.marketImpact?.crypto ?? "Neutral",
    },

    affectedSymbols: Array.isArray(raw.affectedSymbols)
      ? raw.affectedSymbols.map((x: any) => String(x))
      : undefined,

    scenarios: Array.isArray(raw.scenarios)
      ? raw.scenarios.map((s: any) => ({
          name: s.name,
          description: String(s.description ?? ""),
          likelyMoves: Array.isArray(s.likelyMoves)
            ? s.likelyMoves.map((x: any) => String(x))
            : [],
        }))
      : undefined,

    keyLevelsOrTriggers: Array.isArray(raw.keyLevelsOrTriggers)
      ? raw.keyLevelsOrTriggers.map((x: any) => String(x))
      : undefined,

    howToInterpret: Array.isArray(raw.howToInterpret)
      ? raw.howToInterpret.map((x: any) => String(x))
      : [],

    howToTrade: Array.isArray(raw.howToTrade)
      ? raw.howToTrade.map((x: any) => String(x))
      : [],

    riskLevel: raw.riskLevel ?? "Medium",

    confidence:
      typeof raw.confidence === "number"
        ? Math.min(100, Math.max(5, Math.round(raw.confidence)))
        : 50,

    disclaimer:
      raw.disclaimer ??
      "Educational only. Not financial advice.",
  }
}

