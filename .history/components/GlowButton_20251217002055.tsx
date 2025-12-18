export default function GlowButton({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <button className="rounded bg-accent-green px-4 py-2 text-black transition hover:shadow-glow">
      {children}
    </button>
  )
}
