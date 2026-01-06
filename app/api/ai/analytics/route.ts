import { NextResponse } from "next/server"
import { generateAnalyticsInsights } from "@/lib/ai/analyticsInsights"

export async function POST(req: Request) {
  try {
    const body = await req.json()

    const metrics = body?.metrics
    const trade_count = Number(body?.trade_count ?? 0)
    const baseline_balance = Number(body?.baseline_balance ?? 0)

    if (!metrics) {
      return NextResponse.json({ error: "Missing metrics" }, { status: 400 })
    }

    const result = await generateAnalyticsInsights({
      metrics,
      trade_count,
      baseline_balance
    })

    return NextResponse.json(result)
  } catch (e: any) {
    return NextResponse.json(
      { error: e?.message ?? "AI analytics failed" },
      { status: 500 }
    )
  }
}
