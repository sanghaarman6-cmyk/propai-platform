export default function PaywallSuccessPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-black text-white">
      <div className="max-w-md text-center">
        <h1 className="text-3xl font-semibold">Payment successful 🎉</h1>
        <p className="mt-3 text-white/70">
          Your subscription is being activated. You can now access the dashboard.
        </p>

        <a
          href="/app/dashboard"
          className="mt-6 inline-block rounded-xl bg-emerald-500 px-6 py-3 font-semibold text-black"
        >
          Go to dashboard
        </a>
      </div>
    </div>
  )
}
