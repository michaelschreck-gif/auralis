import Link from "next/link"
import { requireAdminPage } from "@/lib/halo/admin"
import AdminNav from "@/components/halo/admin/AdminNav"

export const dynamic = "force-dynamic"
export const metadata = { title: "Admin · Halo" }

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdminPage()
  return (
    <div className="min-h-screen bg-[#FAF8F3]">
      <header className="bg-[#0E1916]">
        <div className="max-w-6xl mx-auto px-4 md:px-8 py-3 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
          <div className="flex items-center gap-3">
            <img src="/brand/combinationmark-white.svg" alt="Halo" className="h-[18px] w-auto" />
            <span className="text-[11px] uppercase tracking-wider text-[#F7B49B]">Admin</span>
          </div>
          <AdminNav />
          <div className="flex items-center gap-4 text-sm">
            <span className="text-[#9A9089] hidden md:inline">{admin.user.email}</span>
            <Link href="/weiter" className="text-[#D9D2C7] hover:text-white">Zum Tool</Link>
          </div>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 md:px-8 py-8">{children}</main>
    </div>
  )
}
