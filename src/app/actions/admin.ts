'use server'

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL!
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY!

const ALLOWED_ROLES = ['super_admin', 'admin', 'official', 'wasit'] as const

type Role = (typeof ALLOWED_ROLES)[number]

async function supabaseRequest(path: string, init?: RequestInit) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    ...init,
    headers: {
      apikey: SERVICE_ROLE_KEY,
      Authorization: `Bearer ${SERVICE_ROLE_KEY}`,
      ...(init?.headers || {}),
    },
  })
  if (!res.ok) {
    const body = await res.text().catch(() => '')
    throw new Error(`Supabase ${res.status}: ${body || res.statusText}`)
  }
  return res.json()
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

  if (authRes.error) {
    return { error: authRes.error?.message || 'Gagal membuat akun.' }
  }

  const userId = authRes.id

  // 2. Buat profil user
  await supabaseRequest('profiles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ id: userId, email, nama, role }),
  })

  return { success: true }
}

export async function listUserAccounts() {
  const profiles = await supabaseRequest(
    'profiles?select=id,email,nama,role,created_at&order=created_at.desc'
  )

  return { profiles: profiles ?? [] }
}

export async function deleteUserAccount(userId: string) {
  // Hapus user di Supabase Auth
  await supabaseRequest(`auth/admin/users/${userId}`, { method: 'DELETE' })

  return { success: true }
}
