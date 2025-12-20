import { NextResponse } from "next/server"

export async function GET() {
  const res = await fetch(
    `${process.env.NEXT_PUBLIC_API_BASE_URL}/account`,
    {
      headers: {
        "x-bridge-secret": process.env.BRIDGE_SECRET!,
      },
    }
  )

  const data = await res.json()
  return NextResponse.json(data)
}
