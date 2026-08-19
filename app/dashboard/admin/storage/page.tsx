import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { HardDrive, TrendingUp, Users } from "lucide-react"
import { Progress } from "@/components/ui/progress"
import { Card, CardContent } from "@/components/ui/card"

function formatBytes(bytes: bigint): string {
  const b = Number(bytes)
  if (b === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(b) / Math.log(k))
  return `${parseFloat((b / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export default async function AdminStoragePage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard")

  // Calculate global storage stats
  const users = await prisma.user.findMany({
    select: { storageUsed: true, storageQuota: true, name: true, email: true },
    orderBy: { storageUsed: "desc" },
    take: 50
  })

  let totalUsed = BigInt(0)
  let totalQuota = BigInt(0)

  users.forEach(u => {
    totalUsed += u.storageUsed
    totalQuota += u.storageQuota
  })

  const globalPercent = totalQuota > 0 ? Math.min(100, Math.round(Number(totalUsed) / Number(totalQuota) * 100)) : 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <HardDrive size={22} className="text-primary" /> System Storage
          </h1>
          <p className="text-muted-foreground text-sm">Monitor overall system storage and quotas</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
                <HardDrive className="text-primary" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Storage Used</p>
                <h3 className="text-2xl font-bold">{formatBytes(totalUsed)}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center">
                <TrendingUp className="text-blue-500" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Total Allocated Quota</p>
                <h3 className="text-2xl font-bold">{formatBytes(totalQuota)}</h3>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-emerald-500/10 rounded-full flex items-center justify-center">
                <Users className="text-emerald-500" size={24} />
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Active Users Tracked</p>
                <h3 className="text-2xl font-bold">{users.length}</h3>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Global Storage Bar */}
      <Card>
        <CardContent className="p-6">
          <h3 className="text-lg font-bold mb-2">Global Usage Allocation</h3>
          <Progress value={globalPercent} className="h-4 w-full mb-2" />
          <p className="text-sm text-muted-foreground">{globalPercent}% of allocated quota used ({formatBytes(totalUsed)} / {formatBytes(totalQuota)})</p>
        </CardContent>
      </Card>

      {/* Top Consumers Table */}
      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">User</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Storage Used</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quota</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Usage %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {users.map((user, idx) => {
                const percent = Math.min(100, Math.round(Number(user.storageUsed) / Number(user.storageQuota) * 100))
                return (
                  <tr key={idx} className="hover:bg-accent/40 transition-colors">
                    <td className="px-6 py-4">
                      <p className="font-medium">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.email}</p>
                    </td>
                    <td className="px-6 py-4">{formatBytes(user.storageUsed)}</td>
                    <td className="px-6 py-4">{formatBytes(user.storageQuota)}</td>
                    <td className="px-6 py-4 w-64">
                      <div className="flex items-center gap-3">
                        <Progress value={percent} className="h-2 flex-1" />
                        <span className="text-xs text-muted-foreground w-8">{percent}%</span>
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
