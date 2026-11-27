'use client'

import { useState } from 'react'
import Link from 'next/link'
import { format } from 'date-fns'
import { Button } from '@/components/ui/button'

interface Event {
  id: string
  nama: string
  tanggal: string | null
  lokasi: string | null
  status: string
  created_at: string
}

interface Category {
  id: string
  nomor_acara: string
  gaya: string
  jenis_kelamin: string
  sesi: string
  urutan: number
}

interface Team {
  id: string
  nama: string
  asal: string | null
}

export default function EventAdminDetail({
  event,
  categories,
  teams,
}: {
  event: Event
  categories: Category[]
  teams: Team[]
}) {
  const [status, setStatus] = useState(event.status)
  const [loading, setLoading] = useState(false)

  async function handleStatusChange(newStatus: string) {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/events/${event.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      })
      if (res.ok) {
        setStatus(newStatus)
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-anton text-4xl uppercase">{event.nama}</h1>
          <p className="text-muted-foreground">
            {event.tanggal ? format(new Date(event.tanggal), 'dd MMM yyyy') : '-'} &nbsp;|&nbsp;
            {event.lokasi || '-'}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <select
            value={status}
            onChange={(e) => handleStatusChange(e.target.value)}
            disabled={loading}
            className="px-3 py-2 border border-border rounded bg-background text-sm"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="ongoing">Ongoing</option>
            <option value="finished">Finished</option>
          </select>
          <Link
            href="/admin/events"
            className="px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
          >
            Kembali
          </Link>
          <a
            href={`/api/download/buku-acara/${event.id}`}
            className="px-4 py-2 text-sm bg-helix-bg text-helix-fg rounded hover:bg-helix-bg/90 font-medium uppercase"
          >
            Unduh Buku Acara
          </a>
          <a
            href={`/api/download/buku-hasil/${event.id}`}
            className="px-4 py-2 text-sm bg-secondary text-secondary-foreground rounded hover:bg-secondary/80 font-medium uppercase"
          >
            Unduh Buku Hasil
          </a>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <section className="border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-anton text-xl uppercase">Kategori Acara</h2>
            <Link href={`/admin/events/${event.id}/categories/new`}>
              <Button size="sm">+ Tambah</Button>
            </Link>
          </div>
          {categories.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Belum ada kategori.</p>
          ) : (
            <div className="space-y-2">
              {categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/admin/events/${event.id}/categories/${cat.id}`}
                  className="block p-3 border border-border rounded hover:bg-muted/50 transition-colors"
                >
                  <div className="font-medium uppercase">Acara {cat.nomor_acara}: {cat.gaya} {cat.jenis_kelamin}</div>
                  <div className="text-sm text-muted-foreground">{cat.sesi}</div>
                </Link>
              ))}
            </div>
          )}
        </section>

        <section className="border border-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-anton text-xl uppercase">Tim Terdaftar</h2>
            <Link href={`/admin/events/${event.id}/teams/new`}>
              <Button size="sm">+ Tambah Tim</Button>
            </Link>
          </div>
          {teams.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">Belum ada tim terdaftar.</p>
          ) : (
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {teams.map((team) => (
                <div key={team.id} className="p-3 border border-border rounded">
                  <div className="font-medium">{team.nama}</div>
                  {team.asal && <div className="text-sm text-muted-foreground">{team.asal}</div>}
                </div>
              ))}
            </div>
          )}
        </section>
      </div>
    </div>
  )
}