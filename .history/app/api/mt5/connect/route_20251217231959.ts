import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const body = await req.json()

  const res = await fetch("http://YOUR_VPS_IP:5000/connect", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      login: body.login,
      password: body.investorPassword,
      server: body.server,
    }),
  })

  if (!res.ok) {
    const err = await res.text()
    return NextResponse.json({ error: err }, { status: 500 })
  }

  return NextResponse.json({ ok: true })
}
