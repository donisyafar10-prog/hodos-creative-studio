'use server'

import { createAdminClient } from '@/lib/supabase/admin'

const ALLOWED_ROLES = ['super_admin', 'admin', 'official', 'wasit'] as const

type Role = (typeof ALLOWED_ROLES)[number]

export async function createUserAccount(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string
  const nama = formData.get('nama') as string
  const role = formData.get('role') as Role

  if (!email || !password || !role || !ALLOWED_ROLES.includes(role)) {
    return { error: 'Data tidak lengkap atau role tidak valid.' }
  }

  const supabase = createAdminClient()

  // Buat user di Supabase Auth
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
  })

  if (authError || !authData.user) {
    return { error: authError?.message || 'Gagal membuat akun.' }
  }

  // Buat profil user
  const { error: profileError } = await supabase.from('profiles').insert({
    id: authData.user.id,
    email,
    nama,
    role,
  })

  if (profileError) {
    return { error: profileError.message }
  }

  return { success: true }
}

export async function listUserAccounts() {
  const supabase = createAdminClient()

  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, email, nama, role, created_at')
    .order('created_at', { ascending: false })

  return { profiles: profiles ?? [] }
}

export async function deleteUserAccount(userId: string) {
  const supabase = createAdminClient()

  const { error } = await supabase.auth.admin.deleteUser(userId)
  if (error) {
    return { error: error.message }
  }

  return { success: true }
}