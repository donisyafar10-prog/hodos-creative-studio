import WasitDashboard from '@/components/wasit/dashboard'
import { createServerClient } from '@/lib/supabase/server'

export default async function WasitPage() {
  const supabase = createServerClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) {
    return <div className="text-center py-12">Memuat...</div>
  }

  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single()

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .in('status', ['published', 'ongoing'])
    .order('tanggal', { ascending: true })

  return (
    <WasitDashboard profile={profile} events={events ?? []} />
  )
}