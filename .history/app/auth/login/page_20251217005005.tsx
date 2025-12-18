"use client"

import Link from "next/link"
import GlowButton from "@/components/GlowButton"

export default function LoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="w-full max-w-sm rounded border border-border bg-bg-panel p-6">
        <h1 className="mb-6 text-xl font-semibold">Login</h1>

        <input
          placeholder="Email"
          className="mb-3 w-full rounded border border-border bg-black px-3 py-2 text-sm"
        />
        <input
          placeholder="Password"
          type="password"
          className="mb-6 w-full rounded border border-border bg-black px-3 py-2 text-sm"
        />

        <Link href="/app/dashboard">
          <GlowButton>Enter Dashboard</GlowButton>
        </Link>

        <div className="mt-4 flex justify-between text-xs text-text-muted">
          <Link href="/auth/forgot">Forgot password?</Link>
          <Link href="/auth/signup">Create account</Link>
        </div>
      </div>
    </div>
  )
}
