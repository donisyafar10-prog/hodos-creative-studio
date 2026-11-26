import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { requireRole, getUserRole } from '@/lib/auth'
import { ActiveLink } from '@/components/layout/active-link'
import AdminLogoutButton from '@/components/layout/admin-logout-button'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireRole(['super_admin', 'admin'])
  const role = await getUserRole()
  const isSuperAdmin = role === 'super_admin'

  const navItems = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/events', label: 'Events' },
  ]

  const accountItems = [
    { href: '/admin/akun', label: 'Kelola Akun' },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-helix-bg text-helix-fg border-b border-helix-fg/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link href="/admin" className="font-[var(--font-inter-tight)] text-[22px] font-bold tracking-[-0.01em] uppercase">
                Hodos Creative Studio
              </Link>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <div className="flex items-center gap-2 font-[var(--font-inter-tight)] text-[13px] font-bold tracking-[0.02em] uppercase">
                <ActiveLink
                  href="/admin"
                  className="px-3 py-2"
                  activeClassName="bg-helix-fg/10 text-helix-fg"
                >
                  Dashboard
                </ActiveLink>
                <ActiveLink
                  href="/admin/events"
                  className="px-3 py-2"
                  activeClassName="bg-helix-fg/10 text-helix-fg"
                >
                  Events
                </ActiveLink>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link
                href="/admin/akun"
                className="font-[var(--font-inter-tight)] text-[13px] font-bold tracking-[0.02em] uppercase px-4 py-2 bg-helix-fg text-helix-bg rounded hover:bg-helix-fg/90 transition-colors"
              >
                H
              </Link>
              <AdminLogoutButton />
            </div>
          </div>
        </div>
      </nav>

      <div className="flex pt-16">
        <aside className="fixed inset-y-0 left-0 z-40 w-64 bg-helix-bg text-helix-fg border-r border-helix-fg/30 transform transition-transform duration-300">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-helix-fg/30">
              <Link href="/admin" className="font-anton text-xl tracking-tight uppercase">
                Admin Panel
              </Link>
            </div>
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {navItems.map((item) => (
                <ActiveLink
                  key={item.href}
                  href={item.href}
                  className="px-3 py-2 rounded text-sm font-medium transition-colors text-helix-fg/70 hover:bg-helix-fg/10"
                  activeClassName="bg-helix-fg/20 text-helix-fg"
                >
                  {item.label}
                </ActiveLink>
              ))}
              {isSuperAdmin && (
                <>
                  <div className="px-3 py-1 text-[10px] font-bold tracking-widest uppercase text-helix-fg/40 mb-2">
                    Akun
                  </div>
                  {accountItems.map((item) => (
                    <ActiveLink
                      key={item.href}
                      href={item.href}
                      className="px-3 py-2 rounded text-sm font-medium transition-colors text-helix-fg/70 hover:bg-helix-fg/10"
                      activeClassName="bg-helix-fg/20 text-helix-fg"
                    >
                      {item.label}
                    </ActiveLink>
                  ))}
                </>
              )}
            </nav>
            <div className="p-4 border-t border-helix-fg/30">
              <p className="text-xs opacity-50">Hodos Creative Studio</p>
            </div>
          </div>
        </aside>

        <main className="flex-1 min-h-screen pt-4 pb-8 px-8">
          {children}
        </main>
      </div>
    </div>
  )
}