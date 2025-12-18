import type { Challenge, Trade } from "@/lib/types"

export type GuruMessage = {
  id: string
  role: "user" | "guru"
  tsISO: string
  content: string
}

export function makeId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(16).slice(2)}`
}

function fmtUsd(n: number) {
  return `$${Math.round(n).toLocaleString()}`
}

export function buildContextChips(challenge: Challenge | null) {
  if (!challenge || !challenge.live) {
    return [
      { label: "You are in: Dashboard", tone: "neutral" as const },
      { label: "No live challenge selected", tone: "amber" as const },
    ]
  }

  const daily = challenge.live.dailyLossRemainingUsd
  const riskTone = daily < 150 ? ("red" as const) : daily < 300 ? ("amber" as const) : ("green" as const)

  return [
    { label: `You are in: Live Challenge`, tone: "neutral" as const },
    { label: `${challenge.firmName} · ${challenge.phase}`, tone: "neutral" as const },
    { label: `Daily loss remaining: ${fmtUsd(daily)}`, tone: riskTone },
    { label: `Rule risk score: ${challenge.stats.ruleRiskScore}`, tone: challenge.stats.ruleRiskScore >= 70 ? "red" : challenge.stats.ruleRiskScore >= 40 ? "amber" : "green" as const },
  ]
}

export function generateGuruReply(args: {
  prompt: string
  activeChallenge: Challenge | null
  recentTrades: Trade[]
}) {
  const p = args.prompt.toLowerCase()
  const c = args.activeChallenge
  const last = args.recentTrades[0]

  if (!c || !c.live) {
    return `I don’t see a live challenge selected. Pick an in-progress challenge, and I’ll coach you against its exact rules (profit target, daily loss, max loss, min days, time limit).`
  }

  const daily = c.live.dailyLossRemainingUsd
  const maxBuffer = c.live.maxLossBufferUsd
  const profitRemaining = c.live.profitTargetRemainingUsd

  // Prop-firm aware coaching heuristics (mocked, but believable)
  if (p.includes("risk") || p.includes("daily") || p.includes("rule")) {
    return `Right now your rule exposure is the priority.\n\n• Daily loss remaining: ${Math.round(daily)}\n• Max loss buffer: ${Math.round(maxBuffer)}\n• Profit target remaining: ${Math.round(profitRemaining)}\n\nCoaching: If you take one more loss at current sizing, you’re likely to enter “panic mode” and start violating discipline rules. Implement a 2-loss cooldown: after 2 losses, reduce size by ~30% and pause 20 minutes.`
  }

  if (p.includes("why did i fail") || p.includes("fail")) {
    return `Based on your patterns, your failures typically come from *sequence risk* (loss → re-entry → size holds constant).\n\nAction plan:\n1) Cap risk to 0.5R until 3 consecutive green days.\n2) Limit NY-open attempts to 2.\n3) If daily loss remaining < $200, treat today as “protect capital” mode.`
  }

  if (p.includes("plan") || p.includes("phase 1")) {
    return `Phase 1 plan (prop-firm aware):\n\n1) Primary session: London AM (highest stability).\n2) NY open: optional — only A+ setups.\n3) Daily structure:\n   • Max 3 trades\n   • Stop after 2 losses\n   • Stop after +1.5R\n\nGoal: reduce rule proximity events while steadily reducing profit target remaining.`
  }

  if (last) {
    return `On your latest trade (${last.instrument} · ${last.session} · ${last.setupTag}), your outcome suggests you’re close to a good process but leaking on execution consistency.\n\nSuggestion: keep the setup, but standardize sizing and avoid immediate re-entries after a loss. Your rule-risk score is ${c.stats.ruleRiskScore}, so we’re prioritizing survival + clean reps.`
  }

  return `Tell me what you’re optimizing today: passing speed, lower drawdown, or rule safety. I’ll tailor coaching to your ${c.firmName} rules and your recent behavior.`
}
