import EventDetail from '@/components/events/event-detail'
import { createServerClient } from '@/lib/supabase/server'

export default async function EventDetailPage({
  params,
}: {
  params: { id: string }
}) {
  const supabase = createServerClient()

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', params.id)
    .single()

  if (!event) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Event tidak ditemukan</h1>
          <p className="text-muted-foreground">Silakan kembali ke daftar event.</p>
        </div>
      </div>
    )
  }

  const { data: categories } = await supabase
    .from('event_categories')
    .select('*')
    .eq('event_id', params.id)
    .order('urutan', { ascending: true })

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <EventDetail event={event} categories={categories ?? []} />
      </div>
    </div>
  )
}
