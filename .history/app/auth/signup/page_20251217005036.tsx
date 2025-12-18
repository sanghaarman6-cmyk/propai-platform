"use client"

import Link from "next/link"
import GlowButton from "@/components/GlowButton"

export default function SignupPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="w-full max-w-sm rounded border border-border bg-bg-panel p-6">
        <h1 className="mb-6 text-xl font-semibold">Create account</h1>

        <input
          placeholder="Email"
          className="mb-3 w-full rounded border border-border bg-black px-3 py-2 text-sm"
        />
        <input
          placeholder="Password"
          type="password"
          className="mb-6 w-full rounded border border-border bg-black px-3 py-2 text-sm"
        />

        <GlowButton>Create account</GlowButton>

        <div className="mt-4 text-xs text-text-muted">
          Already have an account?{" "}
          <Link href="/auth/login" className="underline">
            Login
          </Link>
        </div>
      </div>
    </div>
  )
}
