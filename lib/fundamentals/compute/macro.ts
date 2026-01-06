// lib/fundamentals/compute/macro.ts
import type { MacroSnapshot, MarketRegime } from "@/lib/fundamentals/types"

export function macroFromSignals(args: {
  riskScore: number // 0..100
  inflationScore: number // 0..100
  growthScore: number // 0..100
}): MacroSnapshot {
  const { riskScore, inflationScore, growthScore } = args

  const regime: MarketRegime =
    inflationScore >= 62
      ? "Inflation"
      : inflationScore <= 40
      ? "Disinflation"
      : riskScore >= 60
      ? "Risk-On"
      : riskScore <= 40
      ? "Risk-Off"
      : growthScore >= 60
      ? "Growth"
      : growthScore <= 40
      ? "Recession"
      : "Risk-On"

  const headline =
    regime === "Risk-On"
      ? "Risk appetite supported; dips likely bought while rates stable"
      : regime === "Risk-Off"
      ? "Defensive posture; volatility clustering risk elevated"
      : regime === "Inflation"
      ? "Inflation impulse re-pricing rates; duration sensitive risk vulnerable"
      : regime === "Disinflation"
      ? "Disinflation narrative supports duration; risk rallies easier to sustain"
      : regime === "Growth"
      ? "Growth surprises broaden; cyclicals and beta favoured"
      : "Downside growth risk; defensives favoured"

  return {
    regime,
    headline,
    marketPricing: {
      fedCutsNext12m: "Derived from rates expectations (v2)",
      terminalRate: "Derived from front-end (v2)",
      inflationBreakevens: "Derived from breakevens (v2)",
      growthNowcast: "Derived from surprise index (v2)",
      riskPremium: "Derived from vol/credit (v2)",
    },
    positioning: {
      usd: "Neutral",
      equities: "Neutral",
      bonds: "Neutral",
      gold: "Neutral",
    },
    narrative:
      "This is a deterministic regime engine (no AI). It uses multi-asset signals to define the market’s current stance and your default playbook.",
    reactionRules: [
      {
        if: "If CPI/CB headlines push yields higher quickly",
        then: "Reduce duration-sensitive exposure; prefer USD strength vs high beta FX; tighten risk.",
        confidence: 0.68,
      },
      {
        if: "If yields stabilise and risk breadth improves",
        then: "Risk-on bias: buy dips at structure; trail winners; avoid late shorts.",
        confidence: 0.66,
      },
      {
        if: "If liquidity/volatility anomalies spike into events",
        then: "Lower size, widen stops, avoid market orders, wait for confirmation.",
        confidence: 0.7,
      },
    ],
    watch: ["USD", "Gold", "NASDAQ", "US10Y", "Oil", "JPY"],
  }
}
