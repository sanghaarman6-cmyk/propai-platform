import { NextResponse } from "next/server"

export async function POST() {
  try {
    const res = await fetch("http://185.181.11.253:5000/account", {
      cache: "no-store",
    })

    if (!res.ok) {
      return new Response(
        JSON.stringify({ error: "MT5 bridge unreachable" }),
        { status: 500 }
      )
    }

    const data = await res.json()
    return Response.json(data)
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Failed to fetch MT5 data" }),
      { status: 500 }
    )
  }
}
