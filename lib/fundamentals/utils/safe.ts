export async function safe<T>(
  fn: () => Promise<T>,
  fallback: T,
  label?: string
): Promise<T> {
  try {
    return await fn()
  } catch (err) {
    console.warn(`⚠️ ${label ?? "provider"} failed`, err)
    return fallback
  }
}
