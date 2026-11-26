import { LoginForm } from '@/components/auth/login-form'
import Link from 'next/link'

export default function LoginPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-helix-bg text-helix-fg p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="text-center">
          <h1 className="font-anton text-4xl mb-2">Hodos Creative Studio</h1>
          <p className="text-sm opacity-80">Masuk untuk mengelola event lomba renang &amp; selam</p>
        </div>
        <LoginForm />
        <div className="text-center text-sm opacity-80">
          Belum punya akun? Hubungi Super Admin untuk membuat akun Admin.
        </div>
        <div className="text-center">
          <Link href="/" className="underline underline-offset-4">
            Kembali ke beranda
          </Link>
        </div>
      </div>
    </div>
  )
}
