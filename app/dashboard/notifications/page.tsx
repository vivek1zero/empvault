import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { Bell, CheckCheck } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function NotificationsPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const userId = (session.user as { id?: string }).id!

  const notifications = await prisma.notification.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take: 50,
  })

  const typeColors: Record<string, "default" | "info" | "warning" | "destructive" | "success" | "secondary" | "outline"> = {
    UPLOAD: "success",
    SHARE: "info",
    STORAGE_WARNING: "warning",
    SYSTEM: "secondary",
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="text-muted-foreground text-sm">{notifications.filter((n) => !n.isRead).length} unread</p>
        </div>
        {notifications.length > 0 && (
          <button className="text-xs text-primary hover:underline flex items-center gap-1">
            <CheckCheck size={14} /> Mark all read
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className="text-center py-20">
          <Bell size={48} className="mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="font-semibold text-lg">No notifications</h3>
          <p className="text-muted-foreground text-sm mt-1">You&apos;re all caught up!</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((notif) => (
            <Card key={notif.id} className={`transition-colors ${!notif.isRead ? "border-primary/20 bg-primary/5" : ""}`}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className={`w-2 h-2 rounded-full mt-2 shrink-0 ${!notif.isRead ? "bg-primary" : "bg-muted"}`} />
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-medium">{notif.title}</p>
                    <Badge variant={typeColors[notif.type] ?? "secondary"} className="text-[10px]">
                      {notif.type}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{notif.message}</p>
                  <p className="text-xs text-muted-foreground mt-1">{new Date(notif.createdAt).toLocaleString()}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
