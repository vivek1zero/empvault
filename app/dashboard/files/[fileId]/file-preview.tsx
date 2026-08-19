"use client"

import { useEffect, useState } from "react"
import { Download, Loader2, FileText, FileArchive, AlertCircle } from "lucide-react"
import { Button } from "@/components/ui/button"

interface FilePreviewProps {
  fileId: string
  mimeType: string
  fileName: string
}

export default function FilePreview({ fileId, mimeType, fileName }: FilePreviewProps) {
  const [url, setUrl] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch(`/api/files/${fileId}/preview`)
      .then(r => r.json())
      .then(data => {
        if (data.url) setUrl(data.url)
        else setError(data.error || "Could not load preview")
      })
      .catch(() => setError("Failed to fetch preview URL"))
      .finally(() => setLoading(false))
  }, [fileId])

  if (loading) {
    return (
      <div className="w-full aspect-video flex items-center justify-center bg-muted/30 rounded-xl border border-border">
        <Loader2 size={32} className="animate-spin text-muted-foreground" />
      </div>
    )
  }

  if (error || !url) {
    return (
      <div className="w-full aspect-video flex flex-col items-center justify-center bg-muted/30 rounded-xl border border-border text-muted-foreground gap-3">
        <AlertCircle size={32} className="text-destructive/60" />
        <p className="text-sm">{error || "Preview unavailable"}</p>
      </div>
    )
  }

  // IMAGE preview
  if (mimeType.startsWith("image/")) {
    return (
      <div className="w-full rounded-xl border border-border overflow-hidden bg-muted/20 flex items-center justify-center p-4">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={fileName}
          className="max-w-full max-h-[600px] object-contain rounded-lg shadow-md"
        />
      </div>
    )
  }

  // VIDEO preview
  if (mimeType.startsWith("video/")) {
    return (
      <div className="w-full rounded-xl border border-border overflow-hidden bg-black">
        {/* eslint-disable-next-line jsx-a11y/media-has-caption */}
        <video
          src={url}
          controls
          className="w-full max-h-[600px]"
          preload="metadata"
        >
          Your browser does not support the video tag.
        </video>
      </div>
    )
  }

  // PDF preview
  if (mimeType === "application/pdf") {
    return (
      <div className="w-full rounded-xl border border-border overflow-hidden" style={{ height: "600px" }}>
        <iframe
          src={`${url}#toolbar=1&navpanes=0`}
          className="w-full h-full"
          title={fileName}
        />
      </div>
    )
  }

  // TEXT preview
  if (mimeType.startsWith("text/")) {
    return (
      <TextPreview url={url} fileName={fileName} />
    )
  }

  // Fallback for unsupported types (Word, Excel, PowerPoint, etc.)
  return (
    <div className="w-full py-16 flex flex-col items-center justify-center bg-muted/20 rounded-xl border border-border gap-4 text-muted-foreground">
      {mimeType.includes("word") || mimeType.includes("document") ? (
        <FileText size={48} className="text-blue-400" />
      ) : mimeType.includes("sheet") || mimeType.includes("excel") ? (
        <FileText size={48} className="text-emerald-400" />
      ) : mimeType.includes("presentation") || mimeType.includes("powerpoint") ? (
        <FileText size={48} className="text-orange-400" />
      ) : (
        <FileArchive size={48} className="text-slate-400" />
      )}
      <div className="text-center">
        <p className="font-medium text-sm">No preview available for this file type</p>
        <p className="text-xs text-muted-foreground mt-1">{mimeType}</p>
      </div>
      <a href={url} download={fileName} target="_blank" rel="noreferrer">
        <Button size="sm" className="gap-2 mt-2">
          <Download size={14} /> Download to View
        </Button>
      </a>
    </div>
  )
}

function TextPreview({ url, fileName }: { url: string; fileName: string }) {
  const [text, setText] = useState<string | null>(null)

  useEffect(() => {
    fetch(url)
      .then(r => r.text())
      .then(t => setText(t.slice(0, 5000))) // Limit display to 5000 chars
      .catch(() => setText(null))
  }, [url])

  if (!text) return (
    <div className="w-full aspect-video flex items-center justify-center bg-muted/30 rounded-xl border border-border">
      <Loader2 size={24} className="animate-spin text-muted-foreground" />
    </div>
  )

  return (
    <div className="w-full rounded-xl border border-border overflow-auto bg-[#1e1e2e] p-4" style={{ maxHeight: "500px" }}>
      <pre className="text-xs text-slate-300 whitespace-pre-wrap font-mono leading-relaxed">{text}</pre>
    </div>
  )
}
