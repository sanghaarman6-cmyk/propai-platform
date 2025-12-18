import { NextResponse } from "next/server"

export async function POST(req: Request) {
  if (req.headers.get("x-api-secret") !== "dev-secret") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  const payload = await req.json()

  console.log("MT5 DATA RECEIVED:", payload)

  // Later: store in DB, compute rules, etc.

  return NextResponse.json({ ok: true })
}
