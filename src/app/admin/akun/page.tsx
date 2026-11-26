import Link from 'next/link'
import { createServerClient } from '@/lib/supabase/server'

interface Profile {
  id: string
  email: string
  role: string
  nama: string | null
  created_at: string
}

export default async function AdminAkunPage() {
  const supabase = createServerClient()

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Tidak diizinkan</h1>
          <p className="text-muted-foreground">Silakan login terlebih dahulu.</p>
        </div>
      </div>
    )
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email, role, nama, created_at')
    .eq('id', user.id)
    .single()

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-[var(--font-inter-tight)] text-[20px] font-bold tracking-[0.02em] uppercase">
            Kelola Akun
          </h1>
          <Link href="/admin" className="text-sm underline underline-offset-4">
            ← Kembali ke Dashboard
          </Link>
        </div>

        <div className="border border-border rounded-lg p-6">
          <div className="space-y-4">
            <div className="flex justify-between items-center border-b border-border pb-2">
              <span className="text-sm text-muted-foreground">Email</span>
              <span className="text-sm font-medium">{profile?.email ?? user.email}</span>
            </div>
            <div className="flex justify-between items-center border-b border-border pb-2">
              <span className="text-sm text-muted-foreground">Nama</span>
              <span className="text-sm font-medium">{profile?.nama ?? '-'}</span>
            </div>
            <div className="flex justify-between items-center border-b border-border pb-2">
              <span className="text-sm text-muted-foreground">Role</span>
              <span className="text-sm font-medium capitalize">
                {profile?.role ?? '-'}
              </span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Terdaftar sejak</span>
              <span className="text-sm font-medium">
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString('id-ID')
                  : '-'}
              </span>
            </div>
          </div>
        </div>

        <div className="mt-8 p-4 rounded-lg bg-muted/30 text-xs text-muted-foreground">
          <p className="mb-2">Untuk mengubah password, silakan hubungi administrator sistem atau gunakan fitur lupa password di halaman login.</p>
          <Link
            href="/login"
            className="text-sm font-medium text-helix-bg hover:underline"
          >
            Keluar (Logout)
          </Link>
        </div>
      </div>
    </div>
  )
}
