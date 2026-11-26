'use client'

import Link from 'next/link'
import { Button } from '@/components/ui/button'

interface Category {
  id: string
  nomor_acara: string
  gaya: string
  jenis_kelamin: string
  sesi: string
  urutan: number
}

export default function CategoryList({
  eventId,
  categories,
}: {
  eventId: string
  categories: Category[]
}) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="bg-muted text-muted-foreground">
            <th className="p-3 border border-border text-sm font-semibold">Nomor Acara</th>
            <th className="p-3 border border-border text-sm font-semibold">Gaya</th>
            <th className="p-3 border border-border text-sm font-semibold">Jenis Kelamin</th>
            <th className="p-3 border border-border text-sm font-semibold">Sesi</th>
            <th className="p-3 border border-border text-sm font-semibold">Urutan</th>
            <th className="p-3 border border-border text-sm font-semibold">Aksi</th>
          </tr>
        </thead>
        <tbody>
          {categories.map((cat) => (
            <tr key={cat.id} className="hover:bg-muted/50">
              <td className="p-3 border border-border font-medium">{cat.nomor_acara}</td>
              <td className="p-3 border border-border">{cat.gaya}</td>
              <td className="p-3 border border-border capitalize">{cat.jenis_kelamin}</td>
              <td className="p-3 border border-border capitalize">{cat.sesi}</td>
              <td className="p-3 border border-border">{cat.urutan}</td>
              <td className="p-3 border border-border">
                <div className="flex gap-2">
                  <Link href={`/admin/events/${eventId}/categories/${cat.id}`}>
                    <Button variant="outline" size="sm">Atur Heat</Button>
                  </Link>
                  <Link href={`/admin/events/${eventId}/categories/${cat.id}/participants`}>
                    <Button variant="outline" size="sm">Peserta</Button>
                  </Link>
                  <Button variant="destructive" size="sm" onClick={() => deleteCategory(cat.id)}>
                    Hapus
                  </Button>
                </div>
              </td>
            </tr>
          ))}
          {categories.length === 0 && (
            <tr>
              <td colSpan={6} className="p-3 border border-border text-center text-muted-foreground">
                Belum ada kategori.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

async function deleteCategory(id: string) {
  if (!confirm('Hapus kategori ini?')) return
  try {
    const res = await fetch(`/api/admin/categories/${id}`, { method: 'DELETE' })
    if (res.ok) window.location.reload()
  } catch (e) {
    console.error(e)
  }
}