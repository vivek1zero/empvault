import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { Activity } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const actionColors: Record<string, "default" | "info" | "warning" | "destructive" | "success" | "secondary" | "outline"> = {
  UPLOAD: "success",
  DOWNLOAD: "info",
  DELETE: "destructive",
  SHARE: "warning",
  VIEW: "secondary",
  RESTORE: "outline",
  LOGIN: "secondary",
  LOGOUT: "secondary",
}

export default async function ActivityPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const userId = (session.user as { id?: string }).id!
  const role = (session.user as { role?: string }).role

  const logs = await prisma.activityLog.findMany({
    where: role === "ADMIN" || role === "MANAGER" ? {} : { userId },
    orderBy: { createdAt: "desc" },
    take: 100,
    include: {
      user: { select: { name: true, email: true } },
      file: { select: { originalName: true } },
    },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Activity Log</h1>
        <p className="text-muted-foreground text-sm">{logs.length} events recorded</p>
      </div>

      {logs.length === 0 ? (
        <div className="text-center py-20">
          <Activity size={48} className="mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="font-semibold">No activity yet</h3>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Action</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">File</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Time</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {logs.map((log) => (
                <tr key={log.id} className="hover:bg-accent/40 transition-colors">
                  <td className="px-4 py-3">
                    <Badge variant={actionColors[log.action] ?? "secondary"} className="text-[10px]">
                      {log.action}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <p className="font-medium text-xs">{log.user.name}</p>
                    <p className="text-xs text-muted-foreground">{log.user.email}</p>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground max-w-[200px] truncate">
                    {log.file?.originalName ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(log.createdAt).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
