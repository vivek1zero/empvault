import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { Files, HardDrive, Upload, Share2, TrendingUp, Clock, FileText, ImageIcon, Video, FileArchive } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import Link from "next/link"

function formatBytes(bytes: bigint): string {
  const b = Number(bytes)
  if (b === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(b) / Math.log(k))
  return `${parseFloat((b / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function getFileIcon(type: string) {
  switch (type) {
    case "IMAGE": return <ImageIcon size={16} className="text-violet-500" />
    case "VIDEO": return <Video size={16} className="text-blue-500" />
    case "DOCUMENT": return <FileText size={16} className="text-emerald-500" />
    default: return <FileArchive size={16} className="text-orange-500" />
  }
}

function getFileBg(type: string) {
  switch (type) {
    case "IMAGE": return "bg-violet-100 dark:bg-violet-900/20"
    case "VIDEO": return "bg-blue-100 dark:bg-blue-900/20"
    case "DOCUMENT": return "bg-emerald-100 dark:bg-emerald-900/20"
    default: return "bg-orange-100 dark:bg-orange-900/20"
  }
}

function getActionBadge(action: string) {
  const map: Record<string, { label: string; variant: "default" | "success" | "warning" | "destructive" | "info" | "outline" | "secondary" }> = {
    UPLOAD: { label: "Upload", variant: "success" },
    DOWNLOAD: { label: "Download", variant: "info" },
    DELETE: { label: "Delete", variant: "destructive" },
    SHARE: { label: "Share", variant: "warning" },
    VIEW: { label: "View", variant: "secondary" },
    RESTORE: { label: "Restore", variant: "outline" },
    LOGIN: { label: "Login", variant: "secondary" },
    LOGOUT: { label: "Logout", variant: "secondary" },
  }
  return map[action] || { label: action, variant: "secondary" as const }
}

export default async function DashboardPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const userId = (session.user as { id?: string }).id!
  const userRole = (session.user as { role?: string }).role

  // Fetch stats in parallel
  const [user, totalFiles, uploadsThisMonth, sharedWithMe, recentFiles, recentActivity] = await Promise.all([
    prisma.user.findUnique({ where: { id: userId }, select: { storageUsed: true, storageQuota: true } }),
    prisma.file.count({ where: { uploadedById: userId, status: "ACTIVE" } }),
    prisma.file.count({
      where: {
        uploadedById: userId,
        createdAt: { gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      },
    }),
    prisma.fileShare.count({ where: { sharedWithId: userId } }),
    prisma.file.findMany({
      where: { uploadedById: userId, status: "ACTIVE" },
      orderBy: { createdAt: "desc" },
      take: 8,
      include: { category: true },
    }),
    prisma.activityLog.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      take: 10,
      include: { file: { select: { originalName: true } } },
    }),
  ])

  const storageUsed = user?.storageUsed ?? BigInt(0)
  const storageQuota = user?.storageQuota ?? BigInt(5368709120)
  const storagePercent = Math.min(100, Math.round((Number(storageUsed) / Number(storageQuota)) * 100))
  const storageColor = storagePercent > 80 ? "bg-red-500" : storagePercent > 60 ? "bg-amber-500" : "bg-emerald-500"

  const stats = [
    {
      title: "Total Files",
      value: totalFiles.toString(),
      icon: <Files size={20} className="text-blue-600" />,
      bg: "bg-blue-50 dark:bg-blue-900/20",
      change: "+12% this month",
    },
    {
      title: "Storage Used",
      value: formatBytes(storageUsed),
      icon: <HardDrive size={20} className="text-violet-600" />,
      bg: "bg-violet-50 dark:bg-violet-900/20",
      change: `${storagePercent}% of ${formatBytes(storageQuota)}`,
    },
    {
      title: "Uploads This Month",
      value: uploadsThisMonth.toString(),
      icon: <Upload size={20} className="text-emerald-600" />,
      bg: "bg-emerald-50 dark:bg-emerald-900/20",
      change: "Files added this month",
    },
    {
      title: "Shared With Me",
      value: sharedWithMe.toString(),
      icon: <Share2 size={20} className="text-orange-500" />,
      bg: "bg-orange-50 dark:bg-orange-900/20",
      change: "Files from colleagues",
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Welcome back, {session.user.name?.split(" ")[0]} 👋</h1>
          <p className="text-muted-foreground text-sm mt-0.5">Here's what's happening with your files today.</p>
        </div>
        <Link
          href="/dashboard/upload"
          className="inline-flex items-center gap-2 bg-primary hover:bg-blue-700 text-white text-sm font-medium rounded-lg px-4 py-2 transition-all active:scale-95"
        >
          <Upload size={15} />
          Upload Files
        </Link>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => (
          <Card key={stat.title} className="hover:shadow-md transition-shadow">
            <CardContent className="p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{stat.title}</p>
                  <p className="text-2xl font-bold mt-1 text-foreground">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.change}</p>
                </div>
                <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center`}>
                  {stat.icon}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Storage gauge */}
      <Card>
        <CardContent className="p-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <HardDrive size={16} className="text-muted-foreground" />
              <span className="text-sm font-medium">Storage Usage</span>
            </div>
            <span className={`text-sm font-bold ${storagePercent > 80 ? "text-red-500" : storagePercent > 60 ? "text-amber-500" : "text-emerald-600"}`}>
              {storagePercent}%
            </span>
          </div>
          <div className="relative h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div
              className={`h-full transition-all duration-700 rounded-full ${storageColor}`}
              style={{ width: `${storagePercent}%` }}
            />
          </div>
          <div className="flex justify-between mt-2 text-xs text-muted-foreground">
            <span>{formatBytes(storageUsed)} used</span>
            <span>{formatBytes(storageQuota)} total</span>
          </div>
        </CardContent>
      </Card>

      {/* Bottom grid */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Recent uploads */}
        <div className="lg:col-span-3">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Uploads</CardTitle>
                <Link href="/dashboard/files" className="text-xs text-primary hover:underline">View all</Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentFiles.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Upload size={32} className="mx-auto mb-3 opacity-30" />
                  <p className="text-sm font-medium">No files yet</p>
                  <Link href="/dashboard/upload" className="text-xs text-primary hover:underline mt-1 inline-block">
                    Upload your first file →
                  </Link>
                </div>
              ) : (
                <div className="divide-y divide-border -mx-2">
                  {recentFiles.map((file) => (
                    <Link
                      key={file.id}
                      href={`/dashboard/files/${file.id}`}
                      className="flex items-center gap-3 px-2 py-2.5 hover:bg-accent rounded-lg transition-colors"
                    >
                      <div className={`w-9 h-9 rounded-lg ${getFileBg(file.fileType)} flex items-center justify-center shrink-0`}>
                        {getFileIcon(file.fileType)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{file.originalName}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-muted-foreground">{formatBytes(file.size)}</span>
                          {file.category && (
                            <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                              {file.category.name}
                            </Badge>
                          )}
                        </div>
                      </div>
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(file.createdAt).toLocaleDateString()}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Activity feed */}
        <div className="lg:col-span-2">
          <Card className="h-full">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Recent Activity</CardTitle>
                <Link href="/dashboard/activity" className="text-xs text-primary hover:underline">View all</Link>
              </div>
            </CardHeader>
            <CardContent>
              {recentActivity.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock size={28} className="mx-auto mb-2 opacity-30" />
                  <p className="text-sm">No activity yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {recentActivity.map((log) => {
                    const { label, variant } = getActionBadge(log.action)
                    return (
                      <div key={log.id} className="flex items-start gap-3">
                        <Badge variant={variant} className="mt-0.5 shrink-0 text-[10px]">{label}</Badge>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-foreground truncate">
                            {log.file?.originalName ?? "System event"}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {new Date(log.createdAt).toLocaleString()}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
