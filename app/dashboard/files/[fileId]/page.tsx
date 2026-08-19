import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { FileText, Download, Share2, Trash2, ImageIcon, Video, FileArchive, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import FilePreview from "./file-preview"

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
    case "IMAGE": return <ImageIcon size={32} className="text-violet-500" />
    case "VIDEO": return <Video size={32} className="text-blue-500" />
    case "DOCUMENT": return <FileText size={32} className="text-emerald-500" />
    default: return <FileArchive size={32} className="text-orange-500" />
  }
}

export default async function FileDetailPage({ params }: { params: { fileId: string } }) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const file = await prisma.file.findUnique({
    where: { id: params.fileId },
    include: {
      uploadedBy: { select: { name: true, email: true } },
      category: { select: { name: true } },
    }
  })

  if (!file) {
    return (
      <div className="text-center py-20">
        <h2 className="text-2xl font-bold">File Not Found</h2>
        <p className="text-muted-foreground mt-2">The file you are looking for does not exist or was deleted.</p>
        <Button asChild className="mt-6">
          <Link href="/dashboard/files">Go back to Files</Link>
        </Button>
      </div>
    )
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Breadcrumb */}
      <div className="flex items-center gap-4 text-sm">
        <Link href="/dashboard/files" className="text-muted-foreground hover:text-primary flex items-center gap-1.5 transition-colors">
          <ArrowLeft size={14} /> Back to files
        </Link>
        {file.category && (
          <>
            <span className="text-muted-foreground/50">/</span>
            <span className="text-muted-foreground">{file.category.name}</span>
          </>
        )}
      </div>

      {/* Header Card */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="p-5 border-b border-border flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-muted flex items-center justify-center shrink-0">
              {getFileIcon(file.fileType)}
            </div>
            <div>
              <h1 className="text-lg font-bold break-all leading-tight">{file.originalName}</h1>
              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                <Badge variant="secondary" className="text-[11px] font-normal">{file.fileType}</Badge>
                <span className="text-xs text-muted-foreground">{formatBytes(file.size)}</span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">v{file.version}</span>
                <span className="text-xs text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground">{file.downloadCount} downloads</span>
                {file.category && (
                  <>
                    <span className="text-xs text-muted-foreground">•</span>
                    <Badge variant="outline" className="text-[11px] font-normal">{file.category.name}</Badge>
                  </>
                )}
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Button variant="outline" size="sm" className="gap-1.5">
              <Share2 size={13} /> Share
            </Button>
            <Button size="sm" className="gap-1.5" asChild>
              <a href={`/api/files/${file.id}/download`}>
                <Download size={13} /> Download
              </a>
            </Button>
            <Button variant="outline" size="sm" className="text-destructive hover:bg-destructive/10 hover:text-destructive">
              <Trash2 size={13} />
            </Button>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-border">
          <div className="p-5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Details</p>
            <div className="space-y-2.5 text-sm">
              <div>
                <p className="text-[11px] text-muted-foreground">Type</p>
                <p className="font-medium text-xs mt-0.5 font-mono">{file.mimeType}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Uploaded</p>
                <p className="font-medium text-xs mt-0.5">{file.createdAt.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[11px] text-muted-foreground">Last Modified</p>
                <p className="font-medium text-xs mt-0.5">{file.updatedAt.toLocaleString()}</p>
              </div>
            </div>
          </div>

          <div className="p-5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Uploaded By</p>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm shrink-0">
                {file.uploadedBy.name.charAt(0).toUpperCase()}
              </div>
              <div>
                <p className="font-medium text-sm">{file.uploadedBy.name}</p>
                <p className="text-xs text-muted-foreground">{file.uploadedBy.email}</p>
              </div>
            </div>
          </div>

          <div className="p-5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-3">Description & Tags</p>
            {file.description ? (
              <p className="text-sm text-muted-foreground">{file.description}</p>
            ) : (
              <p className="text-xs text-muted-foreground italic">No description.</p>
            )}
            {(() => {
              const parsedTags = file.tags ? JSON.parse(file.tags) : [];
              if (parsedTags.length === 0) return null;
              return (
                <div className="flex flex-wrap gap-1.5 mt-3">
                  {parsedTags.map((tag: string, i: number) => (
                    <Badge key={i} variant="secondary" className="text-[10px] font-normal">{tag}</Badge>
                  ))}
                </div>
              );
            })()}
          </div>
        </div>
      </div>

      {/* Preview Panel — Client Component handles the signed URL fetch */}
      <div className="bg-card border border-border rounded-xl overflow-hidden shadow-sm">
        <div className="px-5 py-4 border-b border-border flex items-center justify-between">
          <h2 className="text-sm font-semibold">Preview</h2>
          <span className="text-xs text-muted-foreground">{file.mimeType}</span>
        </div>
        <div className="p-5">
          <FilePreview fileId={file.id} mimeType={file.mimeType} fileName={file.originalName} />
        </div>
      </div>
    </div>
  )
}
