"use client"

import React, { useState, useEffect, useCallback } from "react"
import { createPortal } from "react-dom"
import { ArrowLeft, Share2, Trash2, Info, Download, ChevronLeft, ChevronRight, Star, FileText, Video, FileArchive, ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"

function formatBytes(bytes: bigint | number): string {
  const b = Number(bytes)
  if (b === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(b) / Math.log(k))
  return `${parseFloat((b / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function getFileIcon(type: string) {
  switch (type) {
    case "IMAGE": return <ImageIcon size={64} className="text-violet-500/50" />
    case "VIDEO": return <Video size={64} className="text-blue-500/50" />
    case "DOCUMENT": return <FileText size={64} className="text-emerald-500/50" />
    default: return <FileArchive size={64} className="text-orange-500/50" />
  }
}

export function PhotoViewer({ 
  files, 
  initialFileId, 
  onClose 
}: { 
  files: any[], 
  initialFileId: string,
  onClose: () => void
}) {
  const router = useRouter()
  const [currentIndex, setCurrentIndex] = useState(() => files.findIndex(f => f.id === initialFileId))
  const [showInfo, setShowInfo] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [isFavoriting, setIsFavoriting] = useState(false)
  const [localFavorites, setLocalFavorites] = useState<Record<string, boolean>>({})

  const currentFile = files[currentIndex]
  const isFavorited = localFavorites[currentFile?.id] ?? (currentFile?.favorites && currentFile.favorites.length > 0)

  const handleNext = useCallback(() => {
    if (currentIndex < files.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }, [currentIndex, files.length])

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex(prev => prev - 1)
    }
  }, [currentIndex])

  const toggleFavorite = async () => {
    if (!currentFile || isFavoriting) return
    setIsFavoriting(true)
    
    // Optimistic update
    const previousState = isFavorited
    setLocalFavorites(prev => ({ ...prev, [currentFile.id]: !previousState }))

    try {
      const res = await fetch(`/api/files/${currentFile.id}/favorite`, { method: "POST" })
      if (!res.ok) throw new Error("Failed to toggle favorite")
      const data = await res.json()
      setLocalFavorites(prev => ({ ...prev, [currentFile.id]: data.favorited }))
      // Tell Next.js to re-fetch server components in the background so the gallery updates
      router.refresh()
    } catch (err) {
      toast.error("Failed to update favorite status")
      // Revert optimistic update
      setLocalFavorites(prev => ({ ...prev, [currentFile.id]: previousState }))
    } finally {
      setIsFavoriting(false)
    }
  }

  const handleShare = async () => {
    const fileUrl = `${window.location.origin}/uploads/${currentFile.bucketName}/${currentFile.storagePath}`
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentFile.originalName,
          text: `Check out ${currentFile.originalName} on EmpVault`,
          url: fileUrl,
        })
      } catch (err: any) {
        if (err.name !== 'AbortError') {
          console.error("Error sharing:", err)
          toast.error("Failed to share file")
        }
      }
    } else {
      // Fallback to clipboard
      try {
        await navigator.clipboard.writeText(fileUrl)
        toast.success("Link copied to clipboard!")
      } catch (err) {
        toast.error("Failed to copy link")
      }
    }
  }

  useEffect(() => {
    setMounted(true)
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose()
      if (e.key === "ArrowRight") handleNext()
      if (e.key === "ArrowLeft") handlePrev()
    }
    window.addEventListener("keydown", handleKeyDown)
    // Prevent body scroll
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener("keydown", handleKeyDown)
      document.body.style.overflow = ''
    }
  }, [handleNext, handlePrev, onClose])

  if (!currentFile || !mounted) return null

  const isImage = currentFile.fileType === "IMAGE"

  const content = (
    <div className="fixed inset-0 z-[99999] bg-black/80 backdrop-blur-md text-white flex flex-col animate-in fade-in duration-200">
      {/* Top Bar */}
      <div className="h-16 flex items-center justify-between px-4 bg-gradient-to-b from-black/50 to-transparent absolute top-0 left-0 w-full z-10 transition-opacity">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={onClose} className="text-white hover:bg-white/20 rounded-full h-10 w-10">
            <ArrowLeft size={24} />
          </Button>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            onClick={toggleFavorite}
            variant="ghost" 
            size="icon" 
            className={`rounded-full h-10 w-10 transition-colors ${isFavorited ? 'text-yellow-400 hover:bg-white/10' : 'text-white hover:bg-white/20'}`} 
            title={isFavorited ? "Remove from favorites" : "Add to favorites"}
          >
            <Star size={20} className={isFavorited ? "fill-yellow-400" : ""} />
          </Button>
          <Button onClick={handleShare} variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full h-10 w-10" title="Share">
            <Share2 size={20} />
          </Button>
          <a href={`/api/files/${currentFile.id}/download`}>
            <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full h-10 w-10" title="Download">
              <Download size={20} />
            </Button>
          </a>
          <Button variant="ghost" size="icon" className="text-white hover:bg-white/20 rounded-full h-10 w-10" title="Delete">
            <Trash2 size={20} />
          </Button>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => setShowInfo(!showInfo)} 
            className={`text-white rounded-full h-10 w-10 ${showInfo ? 'bg-white/20' : 'hover:bg-white/20'}`} 
            title="Info"
          >
            <Info size={20} />
          </Button>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex flex-1 overflow-hidden relative">
        {/* Navigation Arrows */}
        {currentIndex > 0 && (
          <button 
            onClick={handlePrev}
            className="absolute left-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/50 text-white transition-colors"
          >
            <ChevronLeft size={32} />
          </button>
        )}
        
        {currentIndex < files.length - 1 && (
          <button 
            onClick={handleNext}
            className="absolute right-4 top-1/2 -translate-y-1/2 z-10 w-12 h-12 flex items-center justify-center rounded-full bg-black/20 hover:bg-black/50 text-white transition-colors"
            style={{ right: showInfo ? '340px' : '16px' }}
          >
            <ChevronRight size={32} />
          </button>
        )}

        {/* Media Viewer */}
        <div className={`flex-1 flex items-center justify-center p-8 transition-all duration-300 ${showInfo ? 'mr-[320px]' : 'mr-0'}`}>
          {isImage ? (
            <img 
              key={currentFile.id}
              src={`/uploads/${currentFile.bucketName}/${currentFile.storagePath}`}
              alt={currentFile.originalName}
              className="max-w-full max-h-full object-contain animate-in zoom-in-95 duration-200"
            />
          ) : (
            <div className="flex flex-col items-center justify-center gap-4 text-white/50">
              {getFileIcon(currentFile.fileType)}
              <p className="text-lg font-medium">{currentFile.originalName}</p>
              <p className="text-sm">Preview not available for this file type.</p>
            </div>
          )}
        </div>

        {/* Right Info Sidebar */}
        <div 
          className={`absolute right-0 top-0 h-full w-[320px] bg-background text-foreground border-l border-border transition-transform duration-300 transform ${showInfo ? 'translate-x-0' : 'translate-x-full'}`}
        >
          <div className="h-16 border-b border-border flex items-center px-6">
            <h2 className="text-lg font-semibold">Info</h2>
          </div>
          
          <div className="p-6 space-y-8 overflow-y-auto h-[calc(100%-64px)]">
            <div>
              <p className="text-sm font-semibold uppercase text-muted-foreground tracking-wider mb-3">Details</p>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-muted-foreground">Original Name</p>
                  <p className="text-sm font-medium break-all">{currentFile.originalName}</p>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Size</p>
                    <p className="text-sm font-medium">{formatBytes(currentFile.size)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Type</p>
                    <p className="text-sm font-medium">{currentFile.fileType}</p>
                  </div>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Date Uploaded</p>
                  <p className="text-sm font-medium">{new Date(currentFile.createdAt).toLocaleString()}</p>
                </div>
                {currentFile.category && (
                  <div>
                    <p className="text-xs text-muted-foreground">Folder</p>
                    <Badge variant="outline" className="mt-1">{currentFile.category.name}</Badge>
                  </div>
                )}
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase text-muted-foreground tracking-wider mb-3">Uploaded By</p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold">
                  {currentFile.uploadedBy?.name?.charAt(0).toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-medium">{currentFile.uploadedBy?.name}</p>
                  <p className="text-xs text-muted-foreground">{currentFile.uploadedBy?.email}</p>
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-semibold uppercase text-muted-foreground tracking-wider mb-3">Description</p>
              {currentFile.description ? (
                <p className="text-sm">{currentFile.description}</p>
              ) : (
                <p className="text-xs italic text-muted-foreground">No description provided.</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}
