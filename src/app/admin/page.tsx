import { createServerClient } from '@/lib/supabase/server'

export default async function AdminDashboard() {
  const supabase = createServerClient()

  const [{ count: eventsCount }, { count: categoriesCount }, { count: participantsCount }] = await Promise.all([
    supabase.from('events').select('*', { count: 'exact', head: true }),
    supabase.from('event_categories').select('*', { count: 'exact', head: true }),
    supabase.from('participants').select('*', { count: 'exact', head: true }),
  ])

  return (
    <div className="space-y-8">
      <h1 className="font-anton text-4xl uppercase">Dashboard</h1>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="border border-border rounded-lg p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Event</h3>
          <p className="font-anton text-4xl">{eventsCount ?? 0}</p>
        </div>
        <div className="border border-border rounded-lg p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Kategori Acara</h3>
          <p className="font-anton text-4xl">{categoriesCount ?? 0}</p>
        </div>
        <div className="border border-border rounded-lg p-6">
          <h3 className="text-sm font-medium text-muted-foreground mb-1">Total Peserta</h3>
          <p className="font-anton text-4xl">{participantsCount ?? 0}</p>
        </div>
      </div>

      <div className="border border-border rounded-lg p-6">
        <h2 className="font-anton text-2xl mb-4 uppercase">Quick Actions</h2>
        <div className="flex flex-wrap gap-4">
          <a href="/admin/events/new" className="px-4 py-2 bg-helix-bg text-helix-fg rounded hover:bg-helix-bg/90 transition-colors text-sm font-medium">
            + Buat Event Baru
          </a>
        </div>
      </div>
    </div>
  )
}