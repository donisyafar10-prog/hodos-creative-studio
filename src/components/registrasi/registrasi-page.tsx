'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

interface Event {
  id: string
  nama: string
  tanggal: string | null
}

interface Team {
  id: string
  nama: string
  asal: string | null
}

interface Participant {
  id: string
  nama: string
  team_nama: string | null
  tahun_lahir: number | null
  gender: string | null
  event_category_id: string | null
}

interface Category {
  id: string
  nomor_acara: string
  gaya: string
  jenis_kelamin: string
  sesi: string
}

export default function RegistrasiPage({ events }: { events: Event[] }) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [teams, setTeams] = useState<Team[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)
  const [formError, setFormError] = useState<string | null>(null)
  const [formLoading, setFormLoading] = useState(false)

  const event = events.find((e) => e.id === selectedEventId)

  const loadData = async () => {
    if (!selectedEventId) return
    setLoading(true)
    try {
      const [teamsRes, participantsRes, categoriesRes] = await Promise.all([
        fetch(`/api/registrasi/teams?event_id=${selectedEventId}`),
        fetch(`/api/registrasi/participants?event_id=${selectedEventId}`),
        fetch(`/api/registrasi/categories?event_id=${selectedEventId}`),
      ])
      const teamsJson = await teamsRes.json()
      const participantsJson = await participantsRes.json()
      const categoriesJson = await categoriesRes.json()
      setTeams(Array.isArray(teamsJson) ? teamsJson : [])
      setParticipants(Array.isArray(participantsJson) ? participantsJson : [])
      setCategories(Array.isArray(categoriesJson) ? categoriesJson : [])
    } catch {
      // silently ignore
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [selectedEventId])

  const handleAddParticipant = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setFormError(null)
    setFormLoading(true)

    const formData = new FormData(e.currentTarget)
    const teamId = formData.get('team_id')
    const nama = formData.get('nama')
    const tahun_lahir = formData.get('tahun_lahir')
    const gender = formData.get('gender')
    const kategori_id = formData.get('kategori_id')

    if (!teamId || !nama || !kategori_id) {
      setFormError('Tim, nama atlet, dan kategori wajib diisi.')
      setFormLoading(false)
      return
    }

    try {
      const res = await fetch('/api/registrasi/participants', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nama,
          tim: '', // tim akan diambil dari team_id dipilih
          tahun_lahir: tahun_lahir || null,
          gender: gender || null,
          event_id: selectedEventId,
          kategori_id: kategori_id || null,
          team_id: teamId,
        }),
      })

      if (!res.ok) {
        const err = await res.json()
        setFormError(err.error ?? 'Gagal mendaftarkan atlet')
        return
      }

      e.currentTarget.reset()
      await loadData()
    } catch {
      setFormError('Terjadi kesalahan saat mendaftarkan atlet.')
    } finally {
      setFormLoading(false)
    }
  }

  if (!events.length) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Belum ada event yang aktif</h1>
          <p className="text-muted-foreground">Silakan tunggu hingga ada event yang dipublikasikan.</p>
        </div>
      </div>
    )
  }

  if (!selectedEventId) {
    return (
      <div className="min-h-screen bg-background text-foreground py-12 px-4">
        <div className="max-w-2xl mx-auto">
          <h1 className="font-anton text-4xl mb-8 uppercase text-center">Pilih Event</h1>
          <div className="space-y-3">
            {events.map((event) => (
              <div
                key={event.id}
                onClick={() => setSelectedEventId(event.id)}
                className="block border border-border rounded-lg p-6 hover:bg-muted/50 transition-colors text-left cursor-pointer"
              >
                <h2 className="font-anton text-xl mb-1 uppercase">{event.nama}</h2>
                <p className="text-sm text-muted-foreground">
                  {event.tanggal ? new Date(event.tanggal).toLocaleDateString('id-ID') : '-'}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background text-foreground py-6 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/registrasi" className="text-sm underline underline-offset-4">
              ← Kembali ke pilihan event
            </Link>
            <h1 className="font-anton text-3xl mb-1 uppercase">{event?.nama}</h1>
            <p className="text-sm text-muted-foreground">Pendaftaran Atlet ke Tim</p>
          </div>
          <Button onClick={() => setSelectedEventId(null)} variant="outline">
            Pilih Event Lain
          </Button>
        </div>

        {/* Referensi tim yang sudah ada */}
        <div className="mb-8">
          <h2 className="font-anton text-2xl mb-4 uppercase">Tim Tersedia</h2>
          {loading ? (
            <div className="p-8 text-center text-muted-foreground">Memuat...</div>
          ) : teams.length === 0 ? (
            <div className="border border-border rounded-lg p-8 text-center text-muted-foreground">
              Belum ada tim terdaftar untuk event ini.
            </div>
          ) : (
            <div className="grid gap-3 md:grid-cols-3">
              {teams.map((t) => (
                <div
                  key={t.id}
                  className="border border-border rounded-lg p-4 flex flex-col items-center text-center hover:bg-muted/50 transition-colors"
                >
                  <h3 className="font-anton text-lg mb-1 font-bold">{t.nama}</h3>
                  <p className="text-xs text-muted-foreground">{t.asal ?? '-'}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Form tambah atlet */}
        <div className="border border-border rounded-lg p-6 mb-8">
          <h2 className="font-anton text-2xl mb-6 uppercase">Tambah Atlet Baru</h2>
          {formError && (
            <div className="mb-4 p-3 rounded bg-destructive/10 text-destructive text-sm border border-destructive/20">
              {formError}
            </div>
          )}
          <form onSubmit={handleAddParticipant} className="grid gap-4 md:grid-cols-4 items-end">
            <div className="col-span-4 md:col-span-2">
              <Label htmlFor="team_id">Pilih Tim</Label>
              <select
                id="team_id"
                name="team_id"
                required
                className="w-full px-3 py-2 bg-background border border-input rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Pilih tim...</option>
                {teams.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.nama}
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-4 md:col-span-1">
              <Label htmlFor="nama">Nama Atlet</Label>
              <Input id="nama" name="nama" required placeholder="Contoh: Ahmad Fikri" />
            </div>
            <div className="col-span-4 md:col-span-1">
              <Label htmlFor="tahun_lahir">Tahun Lahir</Label>
              <Input id="tahun_lahir" name="tahun_lahir" type="number" placeholder="1997" />
            </div>
            <div className="col-span-4 md:col-span-1">
              <Label htmlFor="gender">Jenis Kelamin</Label>
              <select
                id="gender"
                name="gender"
                className="w-full px-3 py-2 bg-background border border-input rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Pilih...</option>
                <option value="putra">Putra</option>
                <option value="putri">Putri</option>
              </select>
            </div>
            <div className="col-span-4 md:col-span-1">
              <Label htmlFor="kategori_id">Nomor Acara</Label>
              <select
                id="kategori_id"
                name="kategori_id"
                required
                className="w-full px-3 py-2 bg-background border border-input rounded text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              >
                <option value="">Pilih nomor acara...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    Acara {c.nomor_acara} — {c.gaya} {c.jenis_kelamin} ({c.sesi})
                  </option>
                ))}
              </select>
            </div>
            <div className="col-span-4">
              <button
                type="submit"
                disabled={formLoading}
                className="w-full px-4 py-2 bg-helix-bg text-helix-bg rounded hover:bg-helix-bg/90 disabled:opacity-50 text-sm font-bold tracking-[0.02em] uppercase"
              >
                {formLoading ? 'Mendaftarkan...' : 'Daftarkan Atlet'}
              </button>
            </div>
          </form>
        </div>

        {/* Daftar atlet yang sudah terdaftar */}
        <div className="mb-8">
          <h2 className="font-anton text-2xl mb-4 uppercase">Daftar Atlet Terdaftar</h2>
          <div className="border border-border rounded-lg overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-muted text-muted-foreground">
                <tr>
                  <th className="p-3 border border-border text-xs uppercase">Nama</th>
                  <th className="p-3 border border-border text-xs uppercase">Tim</th>
                  <th className="p-3 border border-border text-xs uppercase">Tgl Lahir</th>
                  <th className="p-3 border border-border text-xs uppercase">Jenis Kelamin</th>
                  <th className="p-3 border border-border text-xs uppercase">Nomor Acara</th>
                  <th className="p-3 border border-border text-xs uppercase text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {participants.length === 0 ? (
                  <tr>
                    <td className="p-4 text-center text-muted-foreground italic" colSpan={6}>
                      Belum ada atlet terdaftar.
                    </td>
                  </tr>
                ) : (
                  participants.map((p) => {
                    const cat = categories.find((c) => c.id === p.event_category_id)
                    return (
                      <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                        <td className="p-3 border border-border font-medium">{p.nama}</td>
                        <td className="p-3 border border-border text-muted-foreground">{p.team_nama ?? '-'}</td>
                        <td className="p-3 border border-border text-muted-foreground">{p.tahun_lahir ?? '-'}</td>
                        <td className="p-3 border border-border capitalize text-muted-foreground">{p.gender ?? '-'}</td>
                        <td className="p-3 border border-border text-sm">
                          {cat ? `Acara ${cat.nomor_acara}` : '-'}
                        </td>
                        <td className="p-3 border border-border text-right">
                          <Button variant="outline" size="sm" onClick={() => alert('Edit belum tersedia')}>
                            Edit
                          </Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
