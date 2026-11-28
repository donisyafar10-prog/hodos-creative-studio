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
  const [tab, setTab] = useState<'teams' | 'participants'>('teams')
  const [teams, setTeams] = useState<Team[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(false)

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
                  {teams.length === 0 ? (
                    <tr>
                      <td className="p-3 border border-border">Belum ada data</td>
                      <td className="p-3 border border-border">-</td>
                      <td className="p-3 border border-border">-</td>
                    </tr>
                  ) : (
                    teams.map((t) => (
                      <tr key={t.id} className="hover:bg-muted/50 transition-colors">
                        <td className="p-3 border border-border">{t.nama}</td>
                        <td className="p-3 border border-border text-muted-foreground">{t.asal ?? '-'}</td>
                        <td className="p-3 border border-border text-right">
                          <Button variant="outline" size="sm" onClick={() => alert('Edit belum tersedia')}>
                            Edit
                          </Button>
                        </td>
                      </tr>
                    ))
                  )}
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
                    <th className="p-3 border border-border">Kategori</th>
                    <th className="p-3 border border-border">Aksi</th>
                  </tr>
                </thead>
                <tbody>
                  {participants.length === 0 ? (
                    <tr>
                      <td className="p-3 border border-border">Belum ada data</td>
                      <td className="p-3 border border-border">-</td>
                      <td className="p-3 border border-border">-</td>
                      <td className="p-3 border border-border">-</td>
                      <td className="p-3 border border-border">-</td>
                      <td className="p-3 border border-border">-</td>
                    </tr>
                  ) : (
                    participants.map((p) => {
                      const cat = categories.find((c) => c.id === (p as any).event_category_id)
                      return (
                        <tr key={p.id} className="hover:bg-muted/50 transition-colors">
                          <td className="p-3 border border-border font-medium">{p.nama}</td>
                          <td className="p-3 border border-border text-muted-foreground">{p.team_nama ?? '-'}</td>
                          <td className="p-3 border border-border text-muted-foreground">{p.tahun_lahir ?? '-'}</td>
                          <td className="p-3 border border-border capitalize text-muted-foreground">{p.gender ?? '-'}</td>
                          <td className="p-3 border border-border text-sm">{cat ? `${cat.nomor_acara} — ${cat.gaya}` : '-'}</td>
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
        )}
      </div>
    </div>
  )
}

function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(' ')
}
