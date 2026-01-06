import "server-only"
import { openai } from "@/lib/openai/server"
import { createSupabaseServerClient } from "@/lib/supabase/server"

/**
 * EDGE BRAIN v2
 * ------------------------------------------------------------
 * Goals:
 * 1) Behave like "normal ChatGPT" for trading knowledge & prop firm rules
 * 2) Still do deep analysis from user's own DB trades when asked
 * 3) Output JSON blocks consistently for your current UI components:
 *    - KPI cards: snapshot[]
 *    - Insight bullets: edge_read[]
 *    - Rule cards: fix_rules[]
 *    - Action banner: next_action
 *
 * IMPORTANT: This file intentionally remains backward-compatible with your existing API route,
 * because it ALWAYS returns `text` = JSON.stringify(EdgeBlocks).
 *
 * You can later upgrade route.ts/UI to support markdown rendering if you want.
 */

/* -------------------------------------------------------------------------- */
/*                                    Types                                   */
/* -------------------------------------------------------------------------- */

export type EdgeBlocks = {
  snapshot: { label: string; value: string }[]
  edge_read: string[]
  fix_rules: string[]
  next_action: string
}

type EdgeBrainInput = {
  message: string
  accountId?: string | null
}

type EdgeBrainOk = {
  ok: true
  text: string // JSON string of EdgeBlocks
  meta?: Record<string, any>
}

type EdgeBrainErr = {
  ok: false
  error: string
}

type EdgeBrainResult = EdgeBrainOk | EdgeBrainErr

type TradeRow = {
  id: string
  account_id: string | null
  platform_trade_id: string | null
  symbol: string | null
  side: string | null
  entry_price: string | null
  exit_price: string | null
  quantity: string | null
  pnl: string | null
  commission: string | null
  fees: string | null
  opened_at: string | null
  closed_at: string | null
  platform: string | null
}

type AccountRow = {
  id: string
  name: string | null
  login: number | null
  server: string | null
  firm_detected: string | null
  status: string | null
  balance: string | null
  equity: string | null
  currency: string | null
  baseline_balance: string | null
  updated_at: string | null
}

type EdgeIntent = "chat" | "analysis" | "info"


function mergeFirmContext(
  prev: ParsedFirmQuery,
  next: ParsedFirmQuery
): ParsedFirmQuery {
  return {
    firm: next.firm ?? prev.firm,
    program: next.program ?? prev.program,
    phase: next.phase ?? prev.phase,
    accountSize: next.accountSize ?? prev.accountSize,
  }
}

/* -------------------------------------------------------------------------- */
/*                                  Prompts                                   */
/* -------------------------------------------------------------------------- */

/**
 * Analysis mode: strict JSON output
 * Uses DB context blob.
 */
const analysisSystemPrompt = `
You are EDGE AI — a trading performance engine inside a prop trading platform.

ROLE:
- Analyze the user's real trading data (provided in context JSON).
- Be blunt, practical, risk-focused.
- Speak like a prop firm risk manager + trading coach.

HARD RULES:
- You MUST return VALID JSON ONLY.
- NO markdown.
- NO commentary outside the schema.
- NO extra keys.
- NO null fields — use empty arrays or empty strings.

RESPONSE SCHEMA (STRICT):
{
  "snapshot": [
    { "label": string, "value": string }
  ],
  "edge_read": string[],
  "fix_rules": string[],
  "next_action": string
}

FIELD GUIDELINES:
- snapshot: 3–6 KPI-style facts (short, numeric, comparative)
- edge_read: 1–3 blunt observations
- fix_rules: 3–5 strict rules written as rules, not advice
- next_action: ONE clear instruction for the next session

STYLE:
- Trader language
- Short sentences
- Decisive
- Capital preservation first

If data is weak or sample size is small:
- Explicitly say so in edge_read

If user suggests breaking prop rules:
- Warn clearly
- Provide safer alternative

Return ONLY the JSON object. Nothing else.
`.trim()

/**
 * Info mode: we still return EdgeBlocks (for your UI)
 * but the content is "ChatGPT-like": headings, structure, coaching tone.
 *
 * We DO NOT browse the internet here (your server has no web tool),
 * so we:
 * - Give typical ranges + common constraints
 * - Ask for exact program if needed
 * - Avoid claiming exact numbers unless user provides program details
 */
const infoSystemPrompt = `
You are an expert proprietary trading mentor.

You explain prop firm rules clearly, confidently, and conversationally,
exactly like ChatGPT would.

STYLE:
- Clear section headers
- Trader-practical language
- Concrete examples
- No internal disclaimers
- No JSON
- No schemas
- No repetition

RULES:
- If exact numbers vary, explain the concept and typical ranges
- Say “check your dashboard” once, not repeatedly
- Never ask for info already provided
- Do NOT analyze the user’s personal trades unless explicitly asked

Write naturally.
`.trim()



/* -------------------------------------------------------------------------- */
/*                              Utility: JSON blocks                           */
/* -------------------------------------------------------------------------- */

function safeBlocks(x: any): EdgeBlocks {
  return {
    snapshot: Array.isArray(x?.snapshot) ? x.snapshot : [],
    edge_read: Array.isArray(x?.edge_read) ? x.edge_read : [],
    fix_rules: Array.isArray(x?.fix_rules) ? x.fix_rules : [],
    next_action: typeof x?.next_action === "string" ? x.next_action : "",
  }
}

function blocksToText(blocks: Partial<EdgeBlocks>): string {
  return JSON.stringify(safeBlocks(blocks))
}

function clampText(s: string, max = 12000) {
  if (!s) return ""
  return s.length > max ? s.slice(0, max) + "…" : s
}

function hasEnoughFirmContext(q: ParsedFirmQuery) {
  return Boolean(
    q.firm &&
    q.program &&
    q.phase &&
    q.accountSize
  )
}

/* -------------------------------------------------------------------------- */
/*                            Utility: numbers & time                           */
/* -------------------------------------------------------------------------- */

function toNum(v: any): number {
  if (v === null || v === undefined) return 0
  const n = typeof v === "number" ? v : Number(v)
  return Number.isFinite(n) ? n : 0
}

function secondsBetween(a?: string | null, b?: string | null): number | null {
  if (!a || !b) return null
  const ta = Date.parse(a)
  const tb = Date.parse(b)
  if (!Number.isFinite(ta) || !Number.isFinite(tb)) return null
  return Math.max(0, Math.round((tb - ta) / 1000))
}

/* -------------------------------------------------------------------------- */
/*                          Prop firm parsing & heuristics                      */
/* -------------------------------------------------------------------------- */

type ParsedFirmQuery = {
  firm?: string | null
  program?: "stellar" | "express" | "evaluation" | "one-step" | "two-step" | null
  phase?: "evaluation" | "funded" | null
  accountSize?: number | null
}


function normalizeSpaces(s: string) {
  return (s ?? "").replace(/\s+/g, " ").trim()
}

function extractAccountSize(raw: string): string | null {
  const m = raw.toLowerCase()
  // matches: 10k, 25 k, 200k, $200k, 100000, $100,000
  const kMatch = m.match(/\b\$?\s?(\d{1,3})\s?k\b/)
  if (kMatch?.[1]) return `${kMatch[1]}k`

  const bigMatch = m.match(/\b\$?\s?(\d{1,3})(?:,(\d{3}))+\b/)
  if (bigMatch) {
    // "$100,000" -> "100k"
    const num = Number(m.replace(/[^0-9]/g, ""))
    if (Number.isFinite(num) && num >= 5000) {
      const k = Math.round(num / 1000)
      return `${k}k`
    }
  }

  const rawNum = m.match(/\b(\d{4,6})\b/)
  if (rawNum?.[1]) {
    const num = Number(rawNum[1])
    if (Number.isFinite(num) && num >= 5000) {
      const k = Math.round(num / 1000)
      return `${k}k`
    }
  }

  return null
}

function detectFirmKey(raw: string): { key: string | null; display: string | null } {
  const m = raw.toLowerCase()
  if (m.includes("fundednext") || m.includes("funded next")) return { key: "fundednext", display: "FundedNext" }
  if (m.includes("ftmo")) return { key: "ftmo", display: "FTMO" }
  if (m.includes("the5ers") || m.includes("5ers")) return { key: "the5ers", display: "The5ers" }
  if (m.includes("alpha capital") || m.includes("alphacapital")) return { key: "alpha-capital", display: "Alpha Capital" }
  if (m.includes("funding pips")) return { key: "fundingpips", display: "Funding Pips" }
  if (m.includes("topstep")) return { key: "topstep", display: "Topstep" }
  // add more as you like
  return { key: null, display: null }
}

function detectPhase(raw: string): string | null {
  const m = raw.toLowerCase()
  if (m.includes("phase 1") || m.includes("p1")) return "Phase 1"
  if (m.includes("phase 2") || m.includes("p2")) return "Phase 2"
  if (m.includes("evaluation") || m.includes("challenge")) return "Evaluation"
  if (m.includes("funded") || m.includes("live")) return "Funded"
  return null
}

function detectProgram(raw: string): string | null {
  const m = raw.toLowerCase()
  if (m.includes("stellar")) return "Stellar"
  if (m.includes("express")) return "Express"
  if (m.includes("one step") || m.includes("1 step") || m.includes("1-step")) return "One-step"
  if (m.includes("two step") || m.includes("2 step") || m.includes("2-step")) return "Two-step"
  if (m.includes("swing")) return "Swing"
  return null
}

function isRulesQuestion(raw: string): boolean {
  const m = raw.toLowerCase()
  const keys = [
    "rules",
    "rule",
    "max drawdown",
    "daily drawdown",
    "profit target",
    "consistency",
    "news trading",
    "weekend",
    "holding",
    "payout",
    "phase",
    "evaluation",
    "challenge",
    "funded",
  ]
  return keys.some((k) => m.includes(k))
}

function looksLikeProgramDetailReply(raw: string): boolean {
  const m = raw.toLowerCase().trim()
  // short replies like: "1 step", "200k 1 step", "stellar 10k"
  if (m.split(" ").length <= 6) {
    if (detectProgram(m)) return true
    if (extractAccountSize(m)) return true
    if (detectPhase(m)) return true
    if (m.includes("fundednext") || m.includes("ftmo") || m.includes("the5ers") || m.includes("alpha")) return true
  }
  return false
}

function parseFirmQuery(message: string): ParsedFirmQuery {
  const m = message.toLowerCase()

  const q: ParsedFirmQuery = {}

  // Firm
  if (m.includes("fundednext") || m.includes("funded next")) {
    q.firm = "FundedNext"
  }

  // Program
  if (m.includes("stellar")) {
    q.program = "stellar"
  } else if (m.includes("express")) {
    q.program = "express"
  }

  // Step
  if (m.includes("1 step") || m.includes("one step")) {
    q.program = "one-step"
  }
  if (m.includes("2 step") || m.includes("two step")) {
    q.program = "two-step"
  }

  // Phase
  if (m.includes("evaluation") || m.includes("eval")) {
    q.phase = "evaluation"
  }
  if (m.includes("funded")) {
    q.phase = "funded"
  }

  // Account size
  const sizeMatch =
    m.match(/(\$?\d{2,3})\s?k/) ||
    m.match(/(\d{5,6})/)

  if (sizeMatch) {
    const raw = sizeMatch[1].replace("$", "")
    q.accountSize = Number(raw) * (raw.length <= 3 ? 1000 : 1)
  }

  return q
}

/* -------------------------------------------------------------------------- */
/*                       Trade analysis: summarize user data                    */
/* -------------------------------------------------------------------------- */

function summarizeTrades(trades: TradeRow[]) {
  const netPnls = trades.map((t) => {
    const pnl = toNum(t.pnl)
    const commission = toNum(t.commission)
    const fees = toNum(t.fees)
    return pnl - commission - fees
  })

  const wins = netPnls.filter((x) => x > 0).length
  const losses = netPnls.filter((x) => x < 0).length
  const breakeven = netPnls.filter((x) => x === 0).length

  const total = netPnls.reduce((a, b) => a + b, 0)
  const avg = netPnls.length ? total / netPnls.length : 0

  const avgWin = wins ? netPnls.filter((x) => x > 0).reduce((a, b) => a + b, 0) / wins : 0
  const avgLoss = losses ? netPnls.filter((x) => x < 0).reduce((a, b) => a + b, 0) / losses : 0
  const winRate = netPnls.length ? wins / netPnls.length : 0

  const lossRate = netPnls.length ? losses / netPnls.length : 0
  const expectancy = winRate * avgWin + lossRate * avgLoss

  const bySide: Record<string, { n: number; net: number }> = {}
  for (const t of trades) {
    const side = (t.side ?? "unknown").toLowerCase()
    const net = toNum(t.pnl) - toNum(t.commission) - toNum(t.fees)
    bySide[side] = bySide[side] ?? { n: 0, net: 0 }
    bySide[side].n += 1
    bySide[side].net += net
  }

  const bySymbol: Record<string, { n: number; net: number }> = {}
  for (const t of trades) {
    const sym = t.symbol ?? "unknown"
    const net = toNum(t.pnl) - toNum(t.commission) - toNum(t.fees)
    bySymbol[sym] = bySymbol[sym] ?? { n: 0, net: 0 }
    bySymbol[sym].n += 1
    bySymbol[sym].net += net
  }

  const topSymbols = Object.entries(bySymbol)
    .sort((a, b) => b[1].n - a[1].n)
    .slice(0, 8)
    .map(([symbol, v]) => ({ symbol, trades: v.n, net: v.net }))

  return {
    count: netPnls.length,
    wins,
    losses,
    breakeven,
    winRate,
    totalNetPnl: total,
    avgNetPnl: avg,
    avgWin,
    avgLoss,
    expectancy,
    bySide,
    topSymbols,
  }
}

function buildUserContextBlob(args: {
  userEmail?: string | null
  accounts: AccountRow[]
  activeAccount?: AccountRow | null
  tradeSummary: ReturnType<typeof summarizeTrades>
  recentTradesCompact: any[]
}) {
  const { userEmail, accounts, activeAccount, tradeSummary, recentTradesCompact } = args

  const blob = {
    user: { email: userEmail ?? null },
    accounts: accounts.map((a) => ({
      id: a.id,
      name: a.name,
      login: a.login,
      server: a.server,
      firm_detected: a.firm_detected,
      status: a.status,
      balance: a.balance,
      equity: a.equity,
      currency: a.currency,
      baseline_balance: a.baseline_balance,
      updated_at: a.updated_at,
    })),
    active_account: activeAccount
      ? {
          id: activeAccount.id,
          name: activeAccount.name,
          firm_detected: activeAccount.firm_detected,
          status: activeAccount.status,
          balance: activeAccount.balance,
          equity: activeAccount.equity,
          currency: activeAccount.currency,
          baseline_balance: activeAccount.baseline_balance,
          updated_at: activeAccount.updated_at,
        }
      : null,
    performance: {
      recent_window: "last 200 trades (or less)",
      summary: tradeSummary,
    },
    recent_trades: recentTradesCompact,
  }

  return clampText(JSON.stringify(blob, null, 2), 12000)
}

/* -------------------------------------------------------------------------- */
/*                             Intent routing & handlers                        */
/* -------------------------------------------------------------------------- */

function isGreeting(raw: string) {
  const m = raw.trim().toLowerCase()
  if (!m) return true
  if (m.length <= 5 && ["hi", "hey", "yo", "sup", "hello"].includes(m)) return true
  if (["good morning", "good afternoon", "good evening"].includes(m)) return true
  return false
}

function detectIntent(raw: string): EdgeIntent {
  if (isGreeting(raw)) return "chat"
  if (isRulesQuestion(raw)) return "info"

  const m = raw.toLowerCase()
  const analysisHints = [
    "analy",
    "review my",
    "my trades",
    "my performance",
    "expectancy",
    "win rate",
    "overtrading",
    "tilt",
    "drawdown",
    "leak",
    "edge",
    "compare long",
    "compare short",
  ]
  if (analysisHints.some((k) => m.includes(k))) return "analysis"

  return "analysis"
}


/**
 * The key fix for your “rules convo” issue:
 * If user sends a short follow-up like “200k 1 step” / “1 step” / “stellar 10k”,
 * we force INFO continuation so it never falls into trade analysis accidentally.
 */
function shouldForceInfoContinuation(message: string): boolean {
  const m = message.trim()
  if (!m) return false
  if (m.length > 60) return false
  return looksLikeProgramDetailReply(m)
}

/* -------------------------------------------------------------------------- */
/*                               Chat mode (simple)                             */
/* -------------------------------------------------------------------------- */

function runChatMode(): EdgeBrainOk {
  return {
    ok: true,
    text: blocksToText({
      snapshot: [],
      edge_read: [
        "I’m EDGE AI — your trading co-pilot.",
        "Ask me about prop firm rules, or tell me to analyze your trades and I’ll be blunt.",
      ],
      fix_rules: [],
      next_action: "Try: “FundedNext rules for 200k one-step” or “Find my biggest leak in the last 50 trades.”",
    }),
    meta: { mode: "chat" },
  }
}

/* -------------------------------------------------------------------------- */
/*                               Info mode (rules)                              */
/* -------------------------------------------------------------------------- */

function needsClarificationForFirmRules(q: ParsedFirmQuery) {
  return !q.firm || !q.program || !q.phase || !q.accountSize
}


/**
 * We generate a “ChatGPT-like” answer while still returning EdgeBlocks.
 * We do this by composing structured paragraphs into edge_read items.
 */
function buildRulesAnswerTemplate(q: ParsedFirmQuery) {
  const firm = q.firm ?? "that prop firm"
  const size = q.accountSize ? `$${Math.round(q.accountSize / 1000)}K` : null

  const program = q.program ?? null
  const phase = q.phase ?? null

  const header = `Here are the key trading rules to keep in mind for **${firm}**${size ? ` (${size})` : ""}${program ? ` — ${program}` : ""}${phase ? ` — ${phase}` : ""}.`
  const caveat =
    `These rules often vary slightly by program type, account size, and phase. If anything below differs from your dashboard terms, follow the dashboard.`
  return { header, caveat }
}

async function runInfoMode(message: string): Promise<EdgeBrainOk> {
  const q = parseFirmQuery(message)





  /**
   * 1️⃣ Missing critical details → ask ONCE, cleanly
   */
  const contextReady = hasEnoughFirmContext(q)

    if (!contextReady) {
    return {
        ok: true,
        text: `
    I can explain the rules accurately, but I need the full context.

    Please tell me:
    - Firm
    - Program
    - Phase
    - Account size

    Once provided, I won’t ask again.
        `.trim(),
        meta: { mode: "info", kind: "clarify" },
    }
    }


  /**
   * 2️⃣ Enough info → answer like ChatGPT (narrative)
   */
  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: [
      {
        role: "system",
        content: `
You are EDGE AI in INFORMATION MODE.

You explain prop firm rules exactly like ChatGPT would.

RULES:
- Use clear headings with emojis.
- Be trader-practical.
- If numbers vary, give typical ranges AND say they must confirm dashboard terms.
- NEVER invent exact limits.
- End with ONE short confirmation question if something is still missing.
- Do NOT output JSON.
- Do NOT mention internal parsing or schemas.
        `.trim(),
      },
      {
        role: "user",
        content: `
User question:
${message}

Parsed context:
${JSON.stringify(q, null, 2)}

Explain the rules clearly.
        `.trim(),
      },
    ],
  })

  const text =
    response.output_text?.trim() ??
    "I couldn’t retrieve the rules. Please try again."

  return {
    ok: true,
    text, // ✅ plain ChatGPT-style answer
    meta: {
      mode: "info",
      firm: q.firm ?? null,
      program: q.program ?? null,
      phase: q.phase ?? null,
      accountSize: q.accountSize ?? null,
    },
  }
}


/* -------------------------------------------------------------------------- */
/*                           Analysis mode (uses DB trades)                      */
/* -------------------------------------------------------------------------- */

async function runAnalysisMode(args: { message: string; accountId?: string | null }): Promise<EdgeBrainResult> {
  const { message, accountId } = args

  // SAFETY: If the message still looks like program detail/rules follow-up, do NOT analyze trades.
  // This prevents your “rules convo” from slipping into analysis by accident.
  if (shouldForceInfoContinuation(message) || isRulesQuestion(message)) {
    return await runInfoMode(message)
  }

  const supabase = await createSupabaseServerClient()
  const { data: auth, error: authErr } = await supabase.auth.getUser()
  if (authErr || !auth?.user) return { ok: false, error: "Not authenticated." }

  const { data: accounts, error: accErr } = await supabase
    .from("trading_accounts")
    .select("id,name,login,server,firm_detected,status,balance,equity,currency,baseline_balance,updated_at")
    .order("updated_at", { ascending: false })

  if (accErr) return { ok: false, error: `Accounts fetch failed: ${accErr.message}` }

  const activeAccount =
    (accountId ? accounts?.find((a: any) => a.id === accountId) : null) ??
    (accounts?.[0] ?? null)

  let tradesQuery = supabase
    .from("trades")
    .select("id,account_id,platform_trade_id,platform,symbol,side,entry_price,exit_price,quantity,pnl,commission,fees,opened_at,closed_at")
    .order("closed_at", { ascending: false })
    .limit(200)

  if (activeAccount?.id) tradesQuery = tradesQuery.eq("account_id", activeAccount.id)

  const { data: trades, error: trErr } = await tradesQuery
  if (trErr) return { ok: false, error: `Trades fetch failed: ${trErr.message}` }

  const tradeSummary = summarizeTrades((trades ?? []) as TradeRow[])

  const recentTradesCompact = (trades ?? []).slice(0, 60).map((t: TradeRow) => {
    const pnl = toNum(t.pnl)
    const commission = toNum(t.commission)
    const fees = toNum(t.fees)
    const net = pnl - commission - fees
    return {
      symbol: t.symbol,
      side: t.side,
      qty: toNum(t.quantity),
      entry: toNum(t.entry_price),
      exit: toNum(t.exit_price),
      pnl,
      commission,
      fees,
      net,
      opened_at: t.opened_at,
      closed_at: t.closed_at,
      duration_s: secondsBetween(t.opened_at, t.closed_at),
      platform_trade_id: t.platform_trade_id,
      platform: t.platform,
    }
  })

  const context = buildUserContextBlob({
    userEmail: auth.user.email,
    accounts: (accounts ?? []) as AccountRow[],
    activeAccount: (activeAccount ?? null) as AccountRow | null,
    tradeSummary,
    recentTradesCompact,
  })

  const response = await openai.responses.create({
    model: "gpt-4.1-mini",
    input: [
      { role: "system", content: analysisSystemPrompt },
      {
        role: "user",
        content:
          `Here is the user's trading context (JSON):\n${context}\n\n` +
          `User message:\n${message}`,
      },
    ],
  })

  const raw = response.output_text?.trim() || ""

  try {
    const parsed = JSON.parse(raw)
    const blocks = safeBlocks(parsed)

    // Ensure snapshot has something if model forgets
    if (blocks.snapshot.length === 0) {
      blocks.snapshot = [
        { label: "Trades analyzed", value: String(tradeSummary.count) },
        { label: "Win rate", value: `${Math.round(tradeSummary.winRate * 1000) / 10}%` },
        { label: "Net PnL", value: `${Math.round(tradeSummary.totalNetPnl * 100) / 100}` },
      ]
    }

    return {
      ok: true,
      text: JSON.stringify(blocks),
      meta: {
        mode: "analysis",
        activeAccountId: activeAccount?.id ?? null,
        firm: activeAccount?.firm_detected ?? null,
        tradeCount: tradeSummary.count,
      },
    }
  } catch {
    // Never break UI
    return {
      ok: true,
      text: blocksToText({
        snapshot: [{ label: "Trades analyzed", value: String(tradeSummary.count) }],
        edge_read: [
          "I couldn’t format the response cleanly.",
          "Ask again with a specific question (bias, overtrading, expectancy, risk control).",
        ],
        fix_rules: [],
        next_action: "Try: “Compare my short vs long performance and give rules to fix it.”",
      }),
      meta: { mode: "analysis", parseFail: true },
    }
  }
}

/* -------------------------------------------------------------------------- */
/*                                   Main API                                  */
/* -------------------------------------------------------------------------- */

export async function runEdgeBrain({ message, accountId }: EdgeBrainInput): Promise<EdgeBrainResult> {
  const msg = normalizeSpaces(message ?? "")
  if (!msg) return runChatMode()

  // Force INFO continuation for short program detail replies
  const forceInfo = shouldForceInfoContinuation(msg)

  let intent = detectIntent(msg)
  if (forceInfo) intent = "info"

  if (intent === "chat") return runChatMode()

  if (intent === "info") {
    return await runInfoMode(msg)
  }

  return await runAnalysisMode({ message: msg, accountId: accountId ?? null })
}
