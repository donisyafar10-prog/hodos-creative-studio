'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import { createUserAccount, listUserAccounts, deleteUserAccount } from '@/app/actions/admin'

type Profile = {
  id: string
  email: string
  nama: string | null
  role: string
  created_at: string
}

type RoleOption = 'super_admin' | 'admin' | 'official' | 'wasit'

const ROLE_LABELS: Record<RoleOption, string> = {
  super_admin: 'Super Admin',
  admin: 'Admin',
  official: 'Official / Tim',
  wasit: 'Wasit',
}

export default function AdminAkunPage() {
  const [profiles, setProfiles] = useState<Profile[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)
  const [creating, setCreating] = useState(false)
  const [myRole, setMyRole] = useState<string>('')

  const loadProfiles = async () => {
    setLoading(true)
    try {
      const res = await listUserAccounts()
      setProfiles(res.profiles ?? [])
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal memuat daftar akun.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadProfiles()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setSuccess(null)
    setCreating(true)

    const formData = new FormData(e.currentTarget as HTMLFormElement)
    const res = await createUserAccount(formData)

    if (res.error) {
      setError(res.error)
    } else {
      setSuccess('Akun berhasil dibuat.')
      ;(e.currentTarget as HTMLFormElement).reset()
      await loadProfiles()
    }

    setCreating(false)
  }

  const handleDelete = async (id: string) => {
    if (!window.confirm('Yakin ingin menghapus akun ini?')) return
    try {
      await deleteUserAccount(id)
      setSuccess('Akun berhasil dihapus.')
      await loadProfiles()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Gagal menghapus akun.')
    }
  }

  const canCreateAll = myRole === 'super_admin'

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="font-[var(--font-inter-tight)] text-[20px] font-bold tracking-[0.02em] uppercase">
              Kelola Akun
            </h1>
            <p className="text-sm text-muted-foreground mt-1">
              Kelola akun admin, official/tim, dan wasit
            </p>
          </div>
          <Link href="/admin" className="text-sm underline underline-offset-4">
            ← Kembali ke Dashboard
          </Link>
        </div>

        {error && (
          <div className="mb-6 p-4 rounded bg-destructive/10 text-destructive text-sm border border-destructive/20">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 p-4 rounded bg-green-100 text-green-800 text-sm border border-green-200">
            {success}
          </div>
        )}

        {/* Form buat akun */}
        <div className="border border-border rounded-lg p-6 mb-8">
          <h2 className="font-[var(--font-inter-tight)] text-[14px] font-bold tracking-[0.02em] uppercase mb-4">
            Buat Akun Baru
          </h2>
          <form onSubmit={handleCreate} className="grid gap-4 md:grid-cols-4 items-end">
            <div className="col-span-4 md:col-span-2">
              <label className="block text-sm font-medium mb-1 text-muted-foreground">Email</label>
              <input
                name="email"
                type="email"
                required
                className="w-full px-3 py-2 bg-background border border-input rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="col-span-4 md:col-span-1">
              <label className="block text-sm font-medium mb-1 text-muted-foreground">Nama</label>
              <input
                name="nama"
                required
                className="w-full px-3 py-2 bg-background border border-input rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="col-span-4 md:col-span-1">
              <label className="block text-sm font-medium mb-1 text-muted-foreground">Password</label>
              <input
                name="password"
                type="password"
                required
                minLength={6}
                className="w-full px-3 py-2 bg-background border border-input rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            <div className="col-span-4 md:col-span-1">
              <label className="block text-sm font-medium mb-1 text-muted-foreground">Role</label>
              <select
                name="role"
                className="w-full px-3 py-2 bg-background border border-input rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                {canCreateAll
                  ? Object.entries(ROLE_LABELS).map(([value, label]) => (
                      <option key={value} value={value}>
                        {label}
                      </option>
                    ))
                  : ['official', 'wasit'].map((value) => (
                      <option key={value} value={value}>
                        {ROLE_LABELS[value as RoleOption]}
                      </option>
                    ))}
              </select>
            </div>
            <div className="col-span-4 md:col-span-1">
              <button
                type="submit"
                disabled={creating}
                className="w-full px-4 py-2 bg-helix-bg text-helix-fg rounded hover:bg-helix-bg/90 disabled:opacity-50 text-sm font-bold tracking-[0.02em] uppercase"
              >
                {creating ? 'Membuat...' : 'Buat Akun'}
              </button>
            </div>
          </form>
          <p className="mt-2 text-xs text-muted-foreground">
            {canCreateAll
              ? 'Super Admin dapat membuat akun untuk semua role.'
              : 'Admin hanya dapat membuat akun untuk Official/Tim dan Wasit.'}
          </p>
        </div>

        {/* Daftar akun */}
        <div className="border border-border rounded-lg overflow-hidden">
          <div className="bg-muted px-4 py-3 border-b border-border">
            <h2 className="font-[var(--font-inter-tight)] text-[14px] font-bold tracking-[0.02em] uppercase">
              Daftar Akun
            </h2>
          </div>

          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Memuat...</div>
          ) : profiles.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground">Belum ada akun.</div>
          ) : (
            <table className="w-full text-left">
              <thead>
                <tr className="bg-muted/50 border-b border-border">
                  <th className="p-3 text-xs font-medium text-muted-foreground uppercase">Email</th>
                  <th className="p-3 text-xs font-medium text-muted-foreground uppercase">Nama</th>
                  <th className="p-3 text-xs font-medium text-muted-foreground uppercase">Role</th>
                  <th className="p-3 text-xs font-medium text-muted-foreground uppercase">Terdaftar sejak</th>
                  <th className="p-3 text-xs font-medium text-muted-foreground uppercase text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {profiles.map((p) => (
                  <tr key={p.id} className="hover:bg-muted/50">
                    <td className="p-3 text-sm">{p.email}</td>
                    <td className="p-3 text-sm">{p.nama ?? '-'}</td>
                    <td className="p-3 text-sm capitalize">{p.role}</td>
                    <td className="p-3 text-sm text-muted-foreground">
                      {new Date(p.created_at).toLocaleDateString('id-ID')}
                    </td>
                    <td className="p-3 text-right">
                      <button
                        onClick={() => handleDelete(p.id)}
                        className="px-2 py-1 text-xs text-destructive hover:bg-destructive/10 rounded"
                        disabled={myRole === 'super_admin' ? false : true}
                      >
                        Hapus
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}