import RegistrasiPage from '@/components/registrasi/registrasi-page'
import { createServerClient } from '@/lib/supabase/server'
import { requireRole } from '@/lib/auth'

export default async function RegistrasiPageWrapper() {
  await requireRole(['super_admin', 'admin', 'official'])

  const supabase = createServerClient()

  const { data: events } = await supabase
    .from('events')
    .select('*')
    .in('status', ['published', 'ongoing'])
    .order('tanggal', { ascending: true })

  return <RegistrasiPage events={events ?? []} />
}