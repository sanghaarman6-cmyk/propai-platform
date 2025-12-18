import { NextResponse } from "next/server"

export async function GET() {
  const base = process.env.MT5_BRIDGE_URL

  const [account, positions, history] = await Promise.all([
    fetch(`${base}/account`).then(r => r.json()),
    fetch(`${base}/positions`).then(r => r.json()),
    fetch(`${base}/history`).then(r => r.json()),
  ])

  return NextResponse.json({
    account,
    positions,
    history,
  })
}
