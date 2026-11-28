'use client'

import { useRouter } from 'next/navigation'

export default function WasitLogoutButton() {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <button
      onClick={handleLogout}
      className="px-4 py-2 text-xs font-bold tracking-widest uppercase bg-helix-fg text-helix-bg rounded hover:bg-helix-fg/90 transition-colors"
    >
      Logout
    </button>
  )
}
