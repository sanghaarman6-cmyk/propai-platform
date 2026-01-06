export type AIEventInsight = {
  simpleSummary: string

  whyItMatters: {
    headline: string
    bullets: string[]
    macroContext?: string
  }

  marketImpact: {
    equities: "Bullish" | "Bearish" | "Neutral"
    fx: "Bullish" | "Bearish" | "Neutral"
    rates: "Bullish" | "Bearish" | "Neutral"
    metals?: "Bullish" | "Bearish" | "Neutral"
    crypto?: "Bullish" | "Bearish" | "Neutral"
  }

  affectedSymbols?: string[]

  scenarios?: {
    name: "Above expectations" | "Inline" | "Below expectations"
    description: string
    likelyMoves: string[]
  }[]

  keyLevelsOrTriggers?: string[]   // ✅ ADD THIS

  howToInterpret: string[]
  howToTrade: string[]

  riskLevel: "Low" | "Medium" | "High"
  confidence: number

  disclaimer?: string
}
