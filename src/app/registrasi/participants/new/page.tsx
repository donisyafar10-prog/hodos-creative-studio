'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function NewParticipantPageContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const eventId = searchParams.get('eventId')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries())

    try {
      const res = await fetch('/api/registrasi/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, event_id: eventId }),
      })

      if (!res.ok) {
        const err = await res.json()
        setError(err.error ?? 'Gagal mendaftarkan peserta')
        return
      }

      router.push(`/registrasi/participants?eventId=${eventId}`)
    } catch {
      setError('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  if (!eventId) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Event tidak valid</h1>
          <p className="text-muted-foreground">Silakan pilih event terlebih dahulu.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="max-w-xl space-y-8">
      <h1 className="font-anton text-4xl uppercase">Daftar Peserta Baru</h1>

      <form onSubmit={onSubmit} className="space-y-6">
        {error && <p className="text-red-600">{error}</p>}

        <div className="space-y-2">
          <Label htmlFor="nama">Nama Atlet</Label>
          <Input id="nama" name="nama" required placeholder="Contoh: Ahmad Fikri" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tim">Nama Tim</Label>
          <Input id="tim" name="tim" required placeholder="Contoh: Renang Wakatobi" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tahun_lahir">Tahun Lahir</Label>
          <Input id="tahun_lahir" name="tahun_lahir" type="number" placeholder="1997" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gender">Jenis Kelamin</Label>
          <select id="gender" name="gender" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">Pilih...</option>
            <option value="putra">Putra</option>
            <option value="putri">Putri</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="kategori">Kategori Acara</Label>
          <select id="kategori" name="kategori" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">Pilih kategori...</option>
          </select>
        </div>

        <div className="flex gap-4">
          <Button type="submit" className="bg-helix-bg text-helix-fg" disabled={loading}>
            {loading ? 'Mendaftarkan...' : 'Daftarkan Peserta'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Batal
          </Button>
        </div>
      </form>
    </div>
  )
}

export default function NewParticipantPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Memuat...</div>}>
      <NewParticipantPageContent />
    </Suspense>
  )
}