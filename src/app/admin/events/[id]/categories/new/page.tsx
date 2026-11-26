'use client'

import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

export default function NewCategoryPage() {
  const router = useRouter()
  const params = useParams()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const data = Object.fromEntries(formData.entries())

    try {
      const res = await fetch(`/api/admin/events/${params.id}/categories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      })

      if (!res.ok) {
        const err = await res.json()
        setError(err.error ?? 'Gagal membuat kategori')
        return
      }

      router.push(`/admin/events/${params.id}/categories`)
    } catch {
      setError('Terjadi kesalahan')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl space-y-8">
      <h1 className="font-anton text-4xl uppercase">Tambah Kategori Acara</h1>

      <form onSubmit={onSubmit} className="space-y-6">
        {error && <p className="text-red-600">{error}</p>}

        <div className="space-y-2">
          <Label htmlFor="nomor_acara">Nomor Acara</Label>
          <Input id="nomor_acara" name="nomor_acara" required placeholder="Contoh: 101" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="gaya">Gaya</Label>
          <Input id="gaya" name="gaya" required placeholder="Contoh: 50m Bifins" />
        </div>

        <div className="space-y-2">
          <Label htmlFor="jenis_kelamin">Jenis Kelamin</Label>
          <select id="jenis_kelamin" name="jenis_kelamin" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">Pilih...</option>
            <option value="putra">Putra</option>
            <option value="putri">Putri</option>
            <option value="campuran">Campuran</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="sesi">Sesi</Label>
          <select id="sesi" name="sesi" required className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
            <option value="">Pilih...</option>
            <option value="pagi">Pagi</option>
            <option value="sore">Sore</option>
          </select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="urutan">Urutan</Label>
          <Input id="urutan" name="urutan" type="number" defaultValue="0" required />
        </div>

        <div className="flex gap-4">
          <Button type="submit" className="bg-helix-bg text-helix-fg" disabled={loading}>
            {loading ? 'Membuat...' : 'Buat Kategori'}
          </Button>
          <Button type="button" variant="secondary" onClick={() => router.back()}>
            Batal
          </Button>
        </div>
      </form>
    </div>
  )
}