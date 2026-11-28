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

export async function GET() {
  try {
    const res = await supabaseRequest(
      'profiles?select=id,email,nama,role,created_at&order=created_at.desc'
    )
    if ('error' in res) {
      return NextResponse.json({ error: res.error, profiles: [] }, { status: 500 })
    }
    return NextResponse.json({ profiles: res.data ?? [] })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error', profiles: [] }, { status: 500 })
  }
}

export async function POST(req: NextRequest) {
  try {
    const { email, password, nama, role } = await req.json()
    if (!email || !password || !role) {
      return NextResponse.json({ error: 'Data tidak lengkap.' }, { status: 400 })
    }
    const authRes = await supabaseRequest('auth/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, email_confirm: true }),
    })
    if ('error' in authRes) {
      const raw = authRes.error || ''
      if (raw.includes('email_exists') || raw.includes('already been registered')) {
        return NextResponse.json({ error: `Email "${email}" sudah terdaftar.` }, { status: 400 })
      }
      if (raw.includes('password')) {
        return NextResponse.json({ error: 'Password tidak valid. Minimal 6 karakter.' }, { status: 400 })
      }
      return NextResponse.json({ error: raw || 'Gagal membuat akun.' }, { status: 500 })
    }
    const userId = authRes.data?.id
    if (!userId) {
      return NextResponse.json({ error: 'Gagal membuat akun: tidak mendapat ID user.' }, { status: 500 })
    }
    const profileRes = await supabaseRequest('profiles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: userId, email, nama, role }),
    })
    if ('error' in profileRes) {
      return NextResponse.json({ error: profileRes.error || 'Gagal membuat profil.' }, { status: 500 })
    }
    return NextResponse.json({ success: true })
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : 'Unknown error' }, { status: 500 })
  }
}