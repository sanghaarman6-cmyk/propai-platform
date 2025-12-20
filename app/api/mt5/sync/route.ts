import { NextResponse } from "next/server"
import { detectPropFirm } from "@/lib/rules/detectFirm"
import { FIRM_TEMPLATES } from "@/lib/rules/firmTemplates"
import { computeMetrics } from "@/lib/rules/computeMetrics"
import { evaluateAccountStatus } from "@/lib/rules/evaluateStatus"

const VPS_BASE = process.env.NEXT_PUBLIC_API_BASE_URL
const BRIDGE_SECRET = process.env.BRIDGE_SECRET

export async function GET() {
  try {
    if (!VPS_BASE || !BRIDGE_SECRET) {
      return NextResponse.json(
        { error: "MT5 bridge not configured" },
        { status: 500 }
      )
    }

    const headers = {
      "x-bridge-secret": BRIDGE_SECRET,
    }

    const [accountRes, positionsRes, historyRes] =
      await Promise.all([
        fetch(`${VPS_BASE}/account`, {
          cache: "no-store",
          headers,
        }),
        fetch(`${VPS_BASE}/positions`, {
          cache: "no-store",
          headers,
        }),
        fetch(`${VPS_BASE}/history?days=30`, {
          cache: "no-store",
          headers,
        }),
      ])

    if (!accountRes.ok) {
      throw new Error("Account fetch failed")
    }

    const rawAccount = await accountRes.json()
    const positions = positionsRes.ok
      ? await positionsRes.json()
      : []
    const history = historyRes.ok
      ? await historyRes.json()
      : []

    const firmName = detectPropFirm(
      rawAccount.name,
      rawAccount.server
    )

    const firmRules = FIRM_TEMPLATES.find(
      (f) => f.name === firmName
    )

    const metrics = firmRules
      ? computeMetrics({
          equity: rawAccount.equity,
          balance: rawAccount.balance,
          startBalance: rawAccount.balance,
          dayHighEquity:
            rawAccount.equity + (rawAccount.profit ?? 0),
        })
      : null

    const status =
      firmRules && metrics
        ? evaluateAccountStatus(metrics, firmRules)
        : "unknown"

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
  } catch (error) {
    console.error("🔥 MT5 sync error:", error)
    return NextResponse.json(
      { error: "Failed to sync MT5 data" },
      { status: 500 }
    )
  }
}
