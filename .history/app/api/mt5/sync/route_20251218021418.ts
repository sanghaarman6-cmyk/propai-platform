import { NextResponse } from "next/server"
import { detectPropFirm } from "@/lib/rules/detectFirm"
import { FIRM_TEMPLATES } from "@/lib/rules/firmTemplates"
import { computeMetrics } from "@/lib/rules/computeMetrics"
import { evaluateAccountStatus } from "@/lib/rules/evaluateStatus"

const VPS_BASE = process.env.MT5_VPS_URL! // e.g. http://185.181.11.253:5000

export async function GET() {
  try {
    const [accountRes, positionsRes, historyRes] = await Promise.all([
      fetch(`${VPS_BASE}/account`, { cache: "no-store" }),
      fetch(`${VPS_BASE}/positions`, { cache: "no-store" }),
      fetch(`${VPS_BASE}/history?days=30`, { cache: "no-store" }),
    ])

    if (!accountRes.ok) throw new Error("account fetch failed")

    const rawAccount = await accountRes.json()
    const positions = positionsRes.ok ? await positionsRes.json() : []
    const history = historyRes.ok ? await historyRes.json() : []

    // 1. Detect firm
    const firmName = detectPropFirm(rawAccount.name, rawAccount.server)

    // 2. Load firm rules
    const firmRules = FIRM_TEMPLATES.find(
      (f) => f.name === firmName
    )

    // 3. Compute metrics (safe defaults)
    const metrics = firmRules
      ? computeMetrics({
          equity: rawAccount.equity,
          balance: rawAccount.balance,
          startBalance: rawAccount.balance, // TODO: store initial balance later
          dayHighEquity:
            rawAccount.equity + rawAccount.profit, // TEMP
        })
      : null

    // 4. Evaluate status
    const status =
      firmRules && metrics
        ? evaluateAccountStatus(metrics, firmRules)
        : "unknown"

    // 5. Return enriched account
    return NextResponse.json({
      account: {
        ...rawAccount,
        firmDetected: firmName,
        metrics,
        status,
      },
      positions,
      history,
    })

