import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { Trash2, RotateCcw, FileText, ImageIcon, Video, FileArchive } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
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

export default async function TrashPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const userId = (session.user as { id?: string }).id!

  const trashedFiles = await prisma.file.findMany({
    where: { uploadedById: userId, status: "DELETED" },
    orderBy: { deletedAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Trash</h1>
          <p className="text-muted-foreground text-sm">{trashedFiles.length} deleted files · Auto-purged after 30 days</p>
        </div>
      </div>

      {trashedFiles.length === 0 ? (
        <div className="text-center py-20">
          <Trash2 size={48} className="mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="font-semibold text-lg">Trash is empty</h3>
          <p className="text-muted-foreground text-sm mt-1">Deleted files will appear here for 30 days</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {trashedFiles.map((file) => (
            <Card key={file.id} className="opacity-75 hover:opacity-100 transition-opacity">
              <CardContent className="p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
                  {getFileIcon(file.fileType)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{file.originalName}</p>
                  <p className="text-xs text-muted-foreground">{formatBytes(file.size)}</p>
                  {file.deletedAt && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      Deleted {new Date(file.deletedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
                <button
                  className="w-8 h-8 rounded-full bg-muted hover:bg-primary hover:text-white flex items-center justify-center transition-colors"
                  title="Restore"
                >
                  <RotateCcw size={14} />
                </button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
