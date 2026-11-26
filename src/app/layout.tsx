import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { SupabaseProvider } from '@/lib/supabase/client'

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' })

export const metadata: Metadata = {
  title: 'Hodos Creative Studio',
  description: 'Platform pengelolaan event lomba renang dan selam',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="id">
      <body className={`${inter.variable} font-sans antialiased`}>
        <SupabaseProvider>{children}</SupabaseProvider>
      </body>
    </html>
  )
}
