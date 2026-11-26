import Link from 'next/link'

interface Event {
  id: string
  nama: string
  tanggal: string | null
  lokasi: string | null
  status: string
}

export default function EventList({ events }: { events: Event[] }) {
  if (events.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Belum ada event yang dipublikasikan.</p>
      </div>
    )
  }

  return (
    <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
      {events.map((event) => (
        <Link
          key={event.id}
          href={`/events/${event.id}`}
          className="border border-border rounded-lg p-6 hover:bg-accent transition-colors group"
        >
          <h3 className="font-anton text-xl mb-2 uppercase group-hover:text-primary">
            {event.nama}
          </h3>
          <p className="text-sm text-muted-foreground mb-1">
            {event.tanggal ? new Date(event.tanggal).toLocaleDateString('id-ID') : 'Tanggal belum ditentukan'}
          </p>
          {event.lokasi && (
            <p className="text-sm text-muted-foreground">{event.lokasi}</p>
          )}
        </Link>
      ))}
    </div>
  )
}
