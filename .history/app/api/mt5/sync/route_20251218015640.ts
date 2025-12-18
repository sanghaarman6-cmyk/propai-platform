import { NextResponse } from "next/server"

const VPS_BASE = process.env.MT5_VPS_URL! // e.g. http://185.181.11.253:5000

export async function GET() {
  try {
    const [accountRes, positionsRes, historyRes] = await Promise.all([
      fetch(`${VPS_BASE}/account`, { cache: "no-store" }),
      fetch(`${VPS_BASE}/positions`, { cache: "no-store" }),
      fetch(`${VPS_BASE}/history?days=30`, { cache: "no-store" }),
    ])

    if (!accountRes.ok) throw new Error("account fetch failed")

    const account = await accountRes.json()
    const positions = positionsRes.ok ? await positionsRes.json() : []
    const history = historyRes.ok ? await historyRes.json() : []

    return NextResponse.json({ account, positions, history })
  } catch (e) {
    return NextResponse.json({ error: "MT5 sync failed" }, { status: 500 })
  }
}
