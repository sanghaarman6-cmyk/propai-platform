const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL!

export async function apiFetch(
  path: string,
  options: RequestInit = {}
) {
  const res = await fetch(`${API_BASE}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {}),
    },
  })

  if (!res.ok) {
    throw new Error(`API error ${res.status}`)
  }

  return res.json()
}
