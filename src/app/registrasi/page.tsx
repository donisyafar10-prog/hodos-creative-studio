import RegistrasiPage from '@/components/registrasi/registrasi-page'
import { createServerClient } from '@/lib/supabase/server'

export default async function RegistrasiPageWrapper() {
  const supabase = createServerClient()

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .in('status', ['published', 'ongoing'])
    .order('tanggal', { ascending: true })

  return <RegistrasiPage events={events ?? []} />
}