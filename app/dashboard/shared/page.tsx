import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { Share2, FileText, ImageIcon, Video, FileArchive } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

function getFileIcon(type: string) {
  switch (type) {
    case "IMAGE": return <ImageIcon size={16} className="text-violet-500" />
    case "VIDEO": return <Video size={16} className="text-blue-500" />
    case "DOCUMENT": return <FileText size={16} className="text-emerald-500" />
    default: return <FileArchive size={16} className="text-orange-500" />
  }
}

function formatBytes(bytes: bigint): string {
  const b = Number(bytes)
  if (b === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(b) / Math.log(k))
  return `${parseFloat((b / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

export default async function SharedPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const userId = (session.user as { id?: string }).id!

  const shares = await prisma.fileShare.findMany({
    where: { sharedWithId: userId },
    include: {
      file: { include: { uploadedBy: { select: { name: true } } } },
      sharedBy: { select: { name: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Shared With Me</h1>
        <p className="text-muted-foreground text-sm">{shares.length} files shared with you</p>
      </div>

      {shares.length === 0 ? (
        <div className="text-center py-20">
          <Share2 size={48} className="mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="font-semibold text-lg">Nothing shared yet</h3>
          <p className="text-muted-foreground text-sm mt-1">Files shared with you will appear here</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {shares.map((share) => (
            <Card key={share.id} className="hover:shadow-md transition-all">
              <CardContent className="p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  {getFileIcon(share.file.fileType)}
                </div>
                <div className="flex-1 min-w-0">
                  <Link href={`/dashboard/files/${share.file.id}`} className="hover:text-primary transition-colors">
                    <p className="text-sm font-medium truncate">{share.file.originalName}</p>
                  </Link>
                  <p className="text-xs text-muted-foreground mt-0.5">{formatBytes(share.file.size)}</p>
                  <p className="text-xs text-muted-foreground mt-1">Shared by <span className="font-medium">{share.sharedBy.name}</span></p>
                  {share.expiresAt && (
                    <Badge variant="warning" className="mt-1 text-[10px]">
                      Expires {new Date(share.expiresAt).toLocaleDateString()}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
