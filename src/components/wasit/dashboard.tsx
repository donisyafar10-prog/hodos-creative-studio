import Link from 'next/link'

interface Profile {
  nama: string | null
  role: string
}

interface Event {
  id: string
  nama: string
  tanggal: string | null
  lokasi: string | null
  status: string
}

export default function WasitDashboard({
  profile,
  events,
}: {
  profile: Profile
  events: Event[]
}) {
  return (
    <div className="space-y-6">
      <h1 className="font-anton text-3xl mb-2 uppercase">Dashboard Wasit</h1>
      <p className="text-sm text-muted-foreground">
        Selamat datang, {profile.nama ?? 'Wasit'} ({profile.role})
      </p>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {events.map((event) => (
          <Link
            key={event.id}
            href={`/wasit/${event.id}`}
            className="border border-border rounded-lg p-4 hover:bg-muted/50 transition-colors"
          >
            <h3 className="font-anton text-xl mb-1 uppercase">{event.nama}</h3>
            <p className="text-xs text-muted-foreground">
              {event.tanggal ? new Date(event.tanggal).toLocaleDateString('id-ID') : '-'} |
              {event.lokasi || '-'}
            </p>
            <p className="mt-2 text-xs font-medium capitalize text-helix-bg">
              {event.status}
            </p>
          </Link>
        ))}
        {events.length === 0 && (
          <div className="col-span-full border border-border rounded-lg p-8 text-center">
            <p className="text-muted-foreground">Tidak ada event yang sedang berlangsung.</p>
          </div>
        )}
      </div>
    </div>
  )
}