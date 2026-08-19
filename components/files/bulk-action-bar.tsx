"use client"

import React, { useState } from "react"
import { useBulkAction } from "./bulk-action-provider"
import { Download, Trash2, FolderOutput, X, Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import { useRouter } from "next/navigation"

export function BulkActionBar() {
  const { selectedFiles, clearSelection } = useBulkAction()
  const router = useRouter()
  const [isDeleting, setIsDeleting] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  if (selectedFiles.size === 0) return null

  const count = selectedFiles.size

  const handleDownload = async () => {
    try {
      setIsDownloading(true)
      const res = await fetch("/api/files/bulk/download", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds: Array.from(selectedFiles) })
      })

      if (!res.ok) throw new Error("Download failed")

      // Trigger download
      const blob = await res.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `bulk-download-${new Date().getTime()}.zip`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast.success("Download started")
      clearSelection()
    } catch (error) {
      toast.error("Failed to download files")
    } finally {
      setIsDownloading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete ${count} files?`)) return

    try {
      setIsDeleting(true)
      const res = await fetch("/api/files/bulk/delete", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileIds: Array.from(selectedFiles) })
      })

      if (!res.ok) throw new Error("Delete failed")

      toast.success(`Successfully deleted ${count} files`)
      clearSelection()
      router.refresh()
    } catch (error) {
      toast.error("Failed to delete files")
    } finally {
      setIsDeleting(false)
    }
  }

  const handleMove = () => {
    // We can implement this later or open a modal. For now, simple toast.
    toast.info("Bulk move is coming soon!")
  }

  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] bg-blue-600 text-white shadow-2xl rounded-2xl px-5 py-3 flex items-center gap-6 animate-in slide-in-from-bottom-10 fade-in duration-300">
      <div className="flex items-center gap-3 pr-2 sm:pr-4 border-r border-blue-400/50">
        <span className="text-base font-medium whitespace-nowrap">
          {count} selected
        </span>
      </div>

      <div className="flex items-center gap-1 sm:gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleMove}
          className="h-9 w-9 rounded-full text-white hover:bg-white/20"
          title="Move"
        >
          <FolderOutput size={18} />
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleDownload} 
          disabled={isDownloading || isDeleting}
          className="h-9 w-9 rounded-full text-white hover:bg-white/20"
          title="Download"
        >
          {isDownloading ? <Loader2 size={18} className="animate-spin" /> : <Download size={18} />}
        </Button>
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={handleDelete}
          disabled={isDownloading || isDeleting}
          className="h-9 w-9 rounded-full text-white hover:bg-red-500 hover:text-white"
          title="Delete"
        >
          {isDeleting ? <Loader2 size={18} className="animate-spin" /> : <Trash2 size={18} />}
        </Button>
      </div>

      <div className="pl-2 sm:pl-4 border-l border-blue-400/50">
        <Button variant="ghost" size="icon" onClick={clearSelection} className="h-9 w-9 rounded-full text-blue-200 hover:bg-white/20 hover:text-white">
          <X size={18} />
        </Button>
      </div>
    </div>
  )
}
