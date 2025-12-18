import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const body = await req.json()

  const { login, server, investorPassword } = body

  if (!login || !server || !investorPassword) {
    return NextResponse.json(
      { error: "Missing credentials" },
      { status: 400 }
    )
  }

  // Simulate connection delay
  await new Promise((r) => setTimeout(r, 800))

  return NextResponse.json({
    success: true,
    status: "connected",
    lastSyncAt: new Date().toISOString(),
  })
}
