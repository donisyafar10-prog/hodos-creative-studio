import { NextRequest, NextResponse } from 'next/server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

function getSupabaseBase(path: string): string {
  if (path.startsWith('auth/')) {
    const authPath = path.slice('auth/'.length)
    return `${SUPABASE_URL}/auth/v1/${authPath}`
  }
  return `${SUPABASE_URL}/rest/v1/${path}`
}

async function supabaseRequest(path: string, init?: RequestInit) {
  if (!SERVICE_ROLE_KEY) {
    return { error: 'SUPABASE_SERVICE_ROLE_KEY belum di-set di environment variables Vercel.' }
  }
  const res = await fetch(getSupabaseBase(path), {
    ...init,
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      ...(init?.headers || {}),
    },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    return { error: `Supabase ${res.status}: ${body || res.statusText}` }
  }
  const text = await res.text().catch(() => '')
  if (!text) return { data: null }
  try {
    return { data: JSON.parse(text) }
  } catch {
    return { data: text }
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const res = await supabaseRequest(`auth/admin/users/${id}`, { method: 'DELETE' })
    if ('error' in res) {
      return NextResponse.json({ error: res.error }, { status: 500 })
    }
    await supabaseRequest(`profiles?id=eq.${id}`, { method: 'DELETE' })
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 })
  }
}