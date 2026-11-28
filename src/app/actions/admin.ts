'use server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const ALLOWED_ROLES = ['super_admin', 'admin', 'official', 'wasit'] as const

type Role = (typeof ALLOWED_ROLES)[number]

function getSupabaseBase(path: string): string {
  // Supabase Auth Admin API (auth/admin/users, auth/admin/users/:id) pakai /auth/v1,
  // sementara database REST API (profiles, events, dst) pakai /rest/v1.
  if (path.startsWith('auth/')) {
    return `${SUPABASE_URL}/auth/v1/${path}`
  }
  return `${SUPABASE_URL}/rest/v1/${path}`
}

async function supabaseRequest(path: string, init?: RequestInit) {
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
  return { data: await res.json() }
}

export async function createUserAccount(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const nama = formData.get('nama') as string
  const role = formData.get('role') as Role

  if (!email || !password || !role || !ALLOWED_ROLES.includes(role)) {
    return { error: 'Data tidak lengkap atau role tidak valid.' }
  }

  // 1. Buat user di Supabase Auth via admin API
  const authRes = await supabaseRequest('auth/admin/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, email_confirm: true }),
  })

  if ('error' in authRes) {
    return { error: authRes.error || 'Gagal membuat akun.' }
  }

  const userId = authRes.data?.id

  if (!userId) {
    return { error: 'Gagal membuat akun: tidak mendapat ID user.' }
  }

  // 2. Buat profil user
  const profileRes = await supabaseRequest('profiles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: userId, email, nama, role }),
  })

  if ('error' in profileRes) {
    return { error: profileRes.error || 'Gagal membuat profil.' }
  }

  return { success: true, error: null }
}

export async function listUserAccounts() {
  const res = await supabaseRequest(
    'profiles?select=id,email,nama,role,created_at&order=created_at.desc'
  )

  if ('error' in res) {
    return { error: res.error, profiles: [] }
  }

  return { error: null, profiles: res.data ?? [] }
}

export async function deleteUserAccount(userId: string) {
  // Hapus user di Supabase Auth
  const res = await supabaseRequest(`auth/admin/users/${userId}`, { method: 'DELETE' })

  if ('error' in res) {
    return { error: res.error }
  }

  return { success: true, error: null }
}
