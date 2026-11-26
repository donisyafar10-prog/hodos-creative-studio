import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@/lib/utils'
import { requireRole } from '@/lib/auth'

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  await requireRole(['super_admin', 'admin'])
  const pathname = usePathname()

  const navItems = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/events', label: 'Events' },
  ]

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="flex">
        <aside className="fixed inset-y-0 left-0 z-40 w-64 bg-helix-bg text-helix-fg border-r border-helix-fg/30 transform transition-transform duration-300">
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-helix-fg/30">
              <Link href="/admin" className="font-anton text-xl tracking-tight uppercase">
                Admin Panel
              </Link>
            </div>
            <nav className="flex-1 p-4 space-y-2 overflow-y-auto">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'px-3 py-2 rounded text-sm font-medium transition-colors',
                    pathname === item.href
                      ? 'bg-helix-fg/20 text-helix-fg'
                      : 'text-helix-fg/70 hover:bg-helix-fg/10'
                  )}
                >
                  {item.label}
                </Link>
              ))}
            </nav>
            <div className="p-4 border-t border-helix-fg/30">
              <p className="text-xs opacity-50">Hodos Creative Studio</p>
            </div>
          </div>
        </aside>

        <main className="flex-1 ml-64 min-h-screen pt-4 pb-8 px-8">
          {children}
        </main>
      </div>
    </div>
  )
}