import EventList from '@/components/events/event-list'
import { createServerClient } from '@/lib/supabase/server'

export default async function EventsPage() {
  const supabase = createServerClient()

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .eq('status', 'published')
    .order('tanggal', { ascending: true })

  return (
    <div className="min-h-screen bg-background text-foreground py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <h1 className="font-anton text-4xl mb-8 text-center uppercase">Daftar Event</h1>
        <EventList events={events ?? []} />
      </div>
    </div>
  )
}
