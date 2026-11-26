import { createServerClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export type UserRole =
  | 'super_admin'
  | 'admin'
  | 'official'
  | 'wasit'
  | null

export async function getUserRole(): Promise<UserRole> {
  const supabase = createServerClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) return null

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single()

  return (profile?.role as UserRole) ?? null
}

export const DOWNLOADABLE_ROLES: UserRole[] = ['super_admin', 'admin', 'official']

export function canDownload(role: UserRole): boolean {
  return DOWNLOADABLE_ROLES.includes(role)
}

export async function requireRole(allowed: string[]): Promise<void> {
  const role = await getUserRole()
  if (!role || !allowed.includes(role)) {
    redirect('/login')
  }
}