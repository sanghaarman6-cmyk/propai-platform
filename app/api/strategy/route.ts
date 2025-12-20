import { NextResponse } from "next/server"

export async function POST(req: Request) {
  const { rawText, parsed } = await req.json()

  console.log("STRATEGY SAVED (TEMP):", rawText)

  return NextResponse.json({
    success: true,
  })
}
