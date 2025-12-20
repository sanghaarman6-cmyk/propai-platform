import { createClient } from "@supabase/supabase-js"

const URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const ANON = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
const SERVICE = process.env.SUPABASE_SERVICE_ROLE_KEY!

export async function requireUser(req: Request) {
  const auth = req.headers.get("authorization")
  if (!auth?.startsWith("Bearer ")) return null

  const token = auth.slice(7)

  const supabase = createClient(URL, ANON, {
    auth: { persistSession: false },
  })

  const { data, error } = await supabase.auth.getUser(token)
  if (error) return null
  return data.user
}

export function adminClient() {
  return createClient(URL, SERVICE, {
    auth: { persistSession: false },
  })
}
