export type AccountPhase = "evaluation" | "funded" | "unknown"

// metrics-based (used by MT5 sync)
export function inferPhase(metrics: any): AccountPhase {
  if (!metrics) return "unknown"

  if (metrics.maxLossRemaining !== undefined) {
    return "evaluation"
  }

  if (metrics.trailingDrawdown !== undefined) {
    return "funded"
  }

  return "unknown"
}

// text-based (used by rules inference later)
export function inferPhaseFromText(text?: string): AccountPhase {
  if (!text) return "unknown"

  const t = text.toLowerCase()

  if (t.includes("evaluation") || t.includes("phase 1") || t.includes("phase 2")) {
    return "evaluation"
  }

  if (t.includes("funded")) {
    return "funded"
  }

  return "unknown"
}
