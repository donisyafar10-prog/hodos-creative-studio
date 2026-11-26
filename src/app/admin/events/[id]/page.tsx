import EventAdminDetail from '@/components/admin/event-admin-detail'
import { createServerClient } from '@/lib/supabase/server'

export default async function AdminEventDetailPage({
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
        </div>
      </div>
    )
  }

  const { data: categories } = await supabase
    .from('event_categories')
    .select('*')
    .eq('event_id', params.id)
    .order('urutan', { ascending: true })

  const { data: teams } = await supabase
    .from('teams')
    .select('*')
    .eq('event_id', params.id)

  return (
    <div className="space-y-8">
      <EventAdminDetail event={event} categories={categories ?? []} teams={teams ?? []} />
    </div>
  )
}