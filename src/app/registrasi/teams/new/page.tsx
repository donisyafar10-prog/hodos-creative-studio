'use client'

import { Suspense, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function NewTeamPageContent() {
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
      const res = await fetch('/api/registrasi/teams', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...data, event_id: eventId }),
      })

      if (!res.ok) {
        const err = await res.json()
        setError(err.error ?? 'Gagal mendaftarkan tim')
        return
      }

      router.push(`/registrasi/teams?eventId=${eventId}`)
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
      <h1 className="font-anton text-4xl uppercase">Daftar Tim Baru</h1>

      <form onSubmit={onSubmit} className="space-y-6">
        {error && <p className="text-red-600">{error}</p>}

        <div className="space-y-2">
          <Label htmlFor="nama">Nama Tim</Label>
          <Input id="nama" name="nama" required placeholder="Contoh: Renang Wakatobi" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="asal">Asal Daerah</Label>
          <Input id="asal" name="asal" placeholder="Contoh: Kota Kendari" />
        </div>

        <div className="flex gap-4">
          <Button type="submit" className="bg-helix-bg text-helix-fg" disabled={loading}>
            {loading ? 'Mendaftarkan...' : 'Daftarkan Tim'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Batal
          </Button>
        </div>
      </form>
    </div>
  )
}

export default function NewTeamPage() {
  return (
    <Suspense fallback={<div className="p-8 text-center text-muted-foreground">Memuat...</div>}>
      <NewTeamPageContent />
    </Suspense>
  )
}