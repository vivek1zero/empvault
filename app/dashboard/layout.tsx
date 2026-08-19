import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import Sidebar from "@/components/layout/Sidebar"
import Topbar from "@/components/layout/Topbar"
import { Toaster } from "sonner"
import { Suspense } from "react"

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const user = session.user as {
    name?: string | null
    email?: string | null
    image?: string | null
    id?: string
    role?: string
  }

  return (
    <div className="flex h-screen overflow-hidden bg-background">
      <Sidebar userRole={user.role} />
      <div className="flex flex-col flex-1 overflow-hidden">
        <Suspense fallback={<div className="h-14 border-b border-border bg-card shrink-0" />}>
          <Topbar user={user} />
        </Suspense>
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
      <Toaster richColors position="top-right" />
    </div>
  )
}

