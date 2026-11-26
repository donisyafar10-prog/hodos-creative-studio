'use client'

import { useState } from 'react'
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

export default function RegistrasiPage({ events }: { events: Event[] }) {
  const [selectedEventId, setSelectedEventId] = useState<string | null>(null)
  const [tab, setTab] = useState<'teams' | 'participants'>('teams')

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

  const event = events.find((e) => e.id === selectedEventId)!

  return (
    <div className="min-h-screen bg-background text-foreground py-6 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Link href="/registrasi" className="text-sm underline underline-offset-4">
              ← Kembali ke pilihan event
            </Link>
            <h1 className="font-anton text-3xl mb-1 uppercase">{event.nama}</h1>
            <p className="text-sm text-muted-foreground">Pendaftaran Tim & Peserta</p>
          </div>
          <Button onClick={() => setSelectedEventId(null)} variant="outline">
            Pilih Event Lain
          </Button>
        </div>

        <div className="flex gap-4 mb-6">
          <button
            onClick={() => setTab('teams')}
            className={cn(
              'px-6 py-2 rounded-lg text-sm font-medium transition-all',
              tab === 'teams'
                ? 'bg-helix-bg text-helix-fg'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            Tim
          </button>
          <button
            onClick={() => setTab('participants')}
            className={cn(
              'px-6 py-2 rounded-lg text-sm font-medium transition-all',
              tab === 'participants'
                ? 'bg-helix-bg text-helix-fg'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
            )}
          >
            Peserta
          </button>
        </div>

        {tab === 'teams' ? (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-anton text-2xl uppercase">Daftar Tim</h2>
              <Link href={`/registrasi/teams/new?eventId=${selectedEventId}`}>
                <Button>+ Daftar Tim Baru</Button>
              </Link>
            </div>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-muted text-muted-foreground">
                    <th className="p-3 border border-border">Nama Tim</th>
                    <th className="p-3 border border-border">Asal</th>
                    <th className="p-3 border border-border">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3 border border-border">Belum ada data</td>
                    <td className="p-3 border border-border">-</td>
                    <td className="p-3 border border-border">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="font-anton text-2xl uppercase">Daftar Peserta</h2>
              <Link href={`/registrasi/participants/new?eventId=${selectedEventId}`}>
                <Button>+ Daftar Peserta Baru</Button>
              </Link>
            </div>
            <div className="border border-border rounded-lg overflow-hidden">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-muted text-muted-foreground">
                    <th className="p-3 border border-border">Nama</th>
                    <th className="p-3 border border-border">Tim</th>
                    <th className="p-3 border border-border">Tahun Lahir</th>
                    <th className="p-3 border border-border">Jenis Kelamin</th>
                    <th className="p-3 border border-border">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td className="p-3 border border-border">Belum ada data</td>
                    <td className="p-3 border border-border">-</td>
                    <td className="p-3 border border-border">-</td>
                    <td className="p-3 border border-border">-</td>
                    <td className="p-3 border border-border">-</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}