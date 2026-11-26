import { createServerClient } from '@/lib/supabase/server'
import Link from 'next/link'
import { format } from 'date-fns'

export default async function AdminEventsPage() {
  const supabase = createServerClient()

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .order('created_at', { ascending: false })

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="font-anton text-4xl uppercase">Kelola Event</h1>
        <Link
          href="/admin/events/new"
          className="px-4 py-2 bg-helix-bg text-helix-fg rounded hover:bg-helix-bg/90 transition-colors text-sm font-medium"
        >
          + Event Baru
        </Link>
      </div>

      {events && events.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-muted text-muted-foreground">
                <th className="p-3 border border-border text-sm font-semibold">Nama Event</th>
                <th className="p-3 border border-border text-sm font-semibold">Tanggal</th>
                <th className="p-3 border border-border text-sm font-semibold">Lokasi</th>
                <th className="p-3 border border-border text-sm font-semibold">Status</th>
                <th className="p-3 border border-border text-sm font-semibold">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {events.map((event) => (
                <tr key={event.id} className="hover:bg-muted/50">
                  <td className="p-3 border border-border font-medium">{event.nama}</td>
                  <td className="p-3 border border-border">
                    {event.tanggal ? format(new Date(event.tanggal), 'dd MMM yyyy') : '-'}
                  </td>
                  <td className="p-3 border border-border">{event.lokasi || '-'}</td>
                  <td className="p-3 border border-border">
                    <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${
                      event.status === 'published' ? 'bg-green-100 text-green-800' :
                      event.status === 'ongoing' ? 'bg-blue-100 text-blue-800' :
                      event.status === 'finished' ? 'bg-gray-100 text-gray-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {event.status}
                    </span>
                  </td>
                  <td className="p-3 border border-border">
                    <div className="flex gap-2">
                      <Link
                        href={`/admin/events/${event.id}`}
                        className="px-3 py-1 text-xs bg-primary text-primary-foreground rounded hover:bg-primary/90"
                      >
                        Kelola
                      </Link>
                      <Link
                        href={`/admin/events/${event.id}/categories/new`}
                        className="px-3 py-1 text-xs bg-secondary text-secondary-foreground rounded hover:bg-secondary/80"
                      >
                        + Kategori
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="border border-border rounded-lg p-12 text-center">
          <p className="text-muted-foreground mb-4">Belum ada event yang dibuat.</p>
          <Link
            href="/admin/events/new"
            className="inline-block px-4 py-2 bg-helix-bg text-helix-fg rounded hover:bg-helix-bg/90 transition-colors text-sm font-medium"
          >
            Buat Event Pertama
          </Link>
        </div>
      )}
    </div>
  )
}