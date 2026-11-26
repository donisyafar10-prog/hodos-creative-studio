'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect } from 'react'
import { cn } from '@/lib/utils'
import { ActiveLink } from '@/components/layout/active-link'
import AdminLogoutButton from '@/components/layout/admin-logout-button'

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  // Role dari server component via data attribute atau context
  // Untuk sekarang asumsikan role di-pass via props dari server wrapper
  // Tapi karena ini client component, kita butuh cara lain
  // Workaround: gunakan data dari localStorage atau buat wrapper server component
  const [role, setRole] = useState<'super_admin' | 'admin' | null>(null)

  useEffect(() => {
    // Ambil role dari cookie/session via API
    fetch('/api/auth/role')
      .then(res => res.json())
      .then(data => setRole(data.role))
      .catch(() => setRole(null))
  }, [])

  const navItems = [
    { href: '/admin', label: 'Dashboard' },
    { href: '/admin/events', label: 'Events' },
  ]

  const accountItems = [
    { href: '/admin/akun', label: 'Kelola Akun' },
  ]

  const isActive = (route: string) => pathname === route || pathname.startsWith(`${route}/`)

  return (
    <div className="min-h-screen bg-background text-foreground">
      <nav className="fixed top-0 left-0 right-0 z-50 bg-helix-bg text-helix-fg border-b border-helix-fg/30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              {/* Hamburger button */}
              <button
                onClick={() => setSidebarOpen(!sidebarOpen)}
                className="md:hidden p-2 rounded text-helix-fg hover:bg-helix-fg/10"
                aria-label="Toggle sidebar"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  {sidebarOpen ? (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  ) : (
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                  )}
                </svg>
              </button>
              {/* Logo -> Homepage */}
              <Link href="/" className="font-[var(--font-inter-tight)] text-[22px] font-bold tracking-[-0.01em] uppercase">
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
              <AdminLogoutButton />
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 md:hidden"
          onClick={() => setSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      <div className="flex pt-16">
        {/* Sidebar */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 w-64 bg-helix-bg text-helix-fg border-r border-helix-fg/30 transform transition-transform duration-300",
            sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
          )}
        >
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-helix-fg/30">
              <Link href="/" className="font-anton text-xl tracking-tight uppercase">
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
                  onClick={() => setSidebarOpen(false)}
                >
                  {item.label}
                </ActiveLink>
              ))}
              {(role === 'super_admin' || role === 'admin') && (
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
                      onClick={() => setSidebarOpen(false)}
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