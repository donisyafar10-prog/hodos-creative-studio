import WasitEventCategories from '@/components/wasit/event-categories'
import { createServerClient } from '@/lib/supabase/server'

export default async function WasitEventPage({
  params,
}: {
  params: { eventId: string }
}) {
  const supabase = createServerClient()

  const { data: event } = await supabase
    .from('events')
    .select('*')
    .eq('id', params.eventId)
    .single()

  if (!event) {
    return <div className="text-center py-12">Event tidak ditemukan</div>
  }

  const { data: categories } = await supabase
    .from('event_categories')
    .select('*')
    .eq('event_id', params.eventId)
    .order('urutan', { ascending: true })

  return (
    <WasitEventCategories event={event} categories={categories ?? []} />
  )
}