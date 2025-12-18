import { NextResponse } from "next/server"

const VPS_BASE = process.env.MT5_VPS_URL // e.g. http://1.2.3.4:5000

export async function GET() {
  try {
    const [accountRes, positionsRes, historyRes] = await Promise.all([
      fetch(`${VPS_BASE}/account`),
      fetch(`${VPS_BASE}/positions`),
      fetch(`${VPS_BASE}/history`),
    ])

    if (!accountRes.ok) {
      throw new Error("Failed to fetch MT5 account")
    }

    const account = await accountRes.json()
    const positions = await positionsRes.json()
    const history = await historyRes.json()

    return NextResponse.json({
      account: {
        name: account.name,
        login: account.login,
        server: account.server,
        balance: account.balance,
        equity: account.equity,
        currency: account.currency,
        positions,
        history,
      },
    })
  } catch (e) {
    return NextResponse.json(
      { error: "MT5 sync failed" },
      { status: 500 }
    )
  }
}
