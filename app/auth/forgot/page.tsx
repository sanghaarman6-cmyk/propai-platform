"use client"

import GlowButton from "@/components/GlowButton"

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-bg">
      <div className="w-full max-w-sm rounded border border-border bg-bg-panel p-6">
        <h1 className="mb-6 text-xl font-semibold">Reset password</h1>

        <input
          placeholder="Email"
          className="mb-6 w-full rounded border border-border bg-black px-3 py-2 text-sm"
        />

        <GlowButton>Send reset link</GlowButton>
      </div>
    </div>
  )
}
