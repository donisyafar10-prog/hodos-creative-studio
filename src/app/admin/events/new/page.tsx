'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function NewEventPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries())

    try {
      const res = await fetch('/api/admin/events', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json()
        setError(err.error ?? 'Gagal membuat event')
        return
      }

      const event = await res.json()
      router.push(`/admin/events/${event.id}`)
    } catch {
      setError('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="font-anton text-4xl uppercase">Buat Event Baru</h1>

      <form onSubmit={onSubmit} className="space-y-6">
        {error && <p className="text-red-600">{error}</p>}

        <div className="space-y-2">
          <Label htmlFor="nama">Nama Event</Label>
          <Input id="nama" name="nama" required placeholder="Contoh: Kejuaran Renang Sultra 2024" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="tanggal">Tanggal</Label>
          <Input id="tanggal" name="tanggal" type="date" required />
        </div>

        <div className="space-y-2">
          <Label htmlFor="lokasi">Lokasi</Label>
          <Input id="lokasi" name="lokasi" placeholder="Contoh: Kolam Renang UHO, Kendari" />
        </div>

        <div className="flex gap-4">
          <Button type="submit" className="bg-helix-bg text-helix-fg" disabled={loading}>
            {loading ? 'Membuat...' : 'Buat Event'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Batal
          </Button>
        </div>
      </form>
    </div>
  )
}