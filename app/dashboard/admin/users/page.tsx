import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { Users, Shield } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"

function formatBytes(bytes: bigint): string {
  const b = Number(bytes)
  if (b === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(b) / Math.log(k))
  return `${parseFloat((b / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

const roleVariant: Record<string, "default" | "success" | "warning" | "info" | "secondary"> = {
  ADMIN: "default",
  MANAGER: "warning",
  EMPLOYEE: "success",
  VIEWER: "secondary",
}

export default async function AdminUsersPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const role = (session.user as { role?: string }).role
  if (role !== "ADMIN") redirect("/dashboard")

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    include: { _count: { select: { files: true } } },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Shield size={22} className="text-primary" /> User Management
          </h1>
          <p className="text-muted-foreground text-sm">{users.length} total users</p>
        </div>
        <button className="inline-flex items-center gap-2 bg-primary hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-4 py-2 transition-all">
          + Invite User
        </button>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Role</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Department</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Storage</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Files</th>
              <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {users.map((user) => {
              const initials = user.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
              const storagePercent = Math.min(100, Math.round((Number(user.storageUsed) / Number(user.storageQuota)) * 100))
              return (
                <tr key={user.id} className="hover:bg-accent/40 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 text-xs">
                        <AvatarFallback>{initials}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-sm">{user.name}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={roleVariant[user.role] ?? "secondary"}>{user.role}</Badge>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">{user.department ?? "—"}</td>
                  <td className="px-4 py-3 w-40">
                    <div className="space-y-1">
                      <Progress value={storagePercent} className="h-1.5" />
                      <p className="text-xs text-muted-foreground">{formatBytes(user.storageUsed)} / {formatBytes(user.storageQuota)}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs">{user._count.files}</td>
                  <td className="px-4 py-3">
                    <Badge variant={user.isActive ? "success" : "destructive"}>
                      {user.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
