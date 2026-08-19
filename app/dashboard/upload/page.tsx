"use client"

import { useState, useCallback, useEffect, Suspense } from "react"
import { useDropzone } from "react-dropzone"
import { useSearchParams } from "next/navigation"
import { Upload, File, X, CheckCircle2, AlertCircle, Loader2, CloudUpload, FolderOpen, FolderPlus, ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import Link from "next/link"

interface UploadFile {
  id: string
  file: File
  status: "queued" | "uploading" | "saving" | "done" | "error"
  progress: number
  error?: string
}

interface Category {
  id: string
  name: string
  slug: string
  description: string | null
}

function UploadForm() {
  const searchParams = useSearchParams()
  const urlCategoryId = searchParams.get("category") || ""

  const [files, setFiles] = useState<UploadFile[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>("")
  const [loadingCategories, setLoadingCategories] = useState(false)
  const [showQuickFolderForm, setShowQuickFolderForm] = useState(false)
  const [quickFolderName, setQuickFolderName] = useState("")
  const [quickCreating, setQuickCreating] = useState(false)
  const [activeCategoryName, setActiveCategoryName] = useState<string>("")
  const [customDate, setCustomDate] = useState<string>("")

  const targetCategory = urlCategoryId || selectedCategoryId

  const fetchCategories = useCallback(async () => {
    setLoadingCategories(true)
    try {
      const res = await fetch("/api/categories")
      const data = await res.json()
      if (Array.isArray(data)) {
        setCategories(data)
        if (urlCategoryId) {
          const matched = data.find((c: Category) => c.id === urlCategoryId)
          if (matched) {
            setActiveCategoryName(matched.name)
          }
        }
      }
    } catch (err) {
      console.error("Failed to fetch folders:", err)
    } finally {
      setLoadingCategories(false)
    }
  }, [urlCategoryId])

  useEffect(() => {
    fetchCategories()
  }, [fetchCategories])

  const handleQuickCreateFolder = async () => {
    if (!quickFolderName.trim()) return
    setQuickCreating(true)
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: quickFolderName.trim() }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || "Failed to create folder")
      
      toast.success(`Folder "${quickFolderName}" created!`)
      setQuickFolderName("")
      setShowQuickFolderForm(false)
      
      await fetchCategories()
      if (data && data.id) {
        setSelectedCategoryId(data.id)
      }
    } catch (e) {
      const err = e instanceof Error ? e : new Error("Failed to create folder")
      toast.error(err.message)
    } finally {
      setQuickCreating(false)
    }
  }

  const onDrop = useCallback((acceptedFiles: File[]) => {
    const newFiles: UploadFile[] = acceptedFiles.map((f) => ({
      id: Math.random().toString(36).slice(2),
      file: f,
      status: "queued",
      progress: 0,
    }))
    setFiles((prev) => [...prev, ...newFiles])
  }, [])

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    multiple: true,
    maxSize: 500 * 1024 * 1024, // 500MB
  })

  const removeFile = (id: string) => {
    setFiles((prev) => prev.filter((f) => f.id !== id))
  }

  const uploadAll = async () => {
    const queued = files.filter((f) => f.status === "queued")
    if (queued.length === 0) return


    for (const uf of queued) {
      setFiles((prev) => prev.map((f) => f.id === uf.id ? { ...f, status: "uploading", progress: 10 } : f))
      try {
        // Step 1: Get presigned URL
        const res = await fetch("/api/upload/presigned", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            filename: uf.file.name,
            mimeType: uf.file.type,
            size: uf.file.size,
          }),
        })

        if (!res.ok) {
          const err = await res.json()
          throw new Error(err.error || "Failed to get upload URL")
        }

        const { presignedUrl, bucketName, storagePath, storedName } = await res.json()
        setFiles((prev) => prev.map((f) => f.id === uf.id ? { ...f, progress: 40 } : f))

        // Step 2: Upload directly to S3/Supabase Storage
        const uploadRes = await fetch(presignedUrl, {
          method: "PUT",
          body: uf.file,
          headers: { "Content-Type": uf.file.type },
        })

        if (!uploadRes.ok) {
          const errorText = await uploadRes.text()
          console.error("S3 Upload Error:", errorText)
          
          if (errorText.includes("CORS")) {
            throw new Error("CORS Error: You must enable CORS for PUT requests on this Supabase bucket.")
          } else if (errorText.includes("NoSuchBucket")) {
            throw new Error(`Bucket Error: The bucket '${bucketName}' does not exist in your Supabase project.`)
          }
          throw new Error(`S3 Error (${uploadRes.status}): ${errorText.substring(0, 100)}`)
        }
        setFiles((prev) => prev.map((f) => f.id === uf.id ? { ...f, progress: 80, status: "saving" } : f))

        // Step 3: Save to DB
        const saveRes = await fetch("/api/upload/complete", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            bucketName,
            storagePath,
            originalName: uf.file.name,
            storedName,
            mimeType: uf.file.type,
            size: uf.file.size,
            categoryId: targetCategory || null,
            customDate: customDate || undefined,
          }),
        })

        if (!saveRes.ok) {
          const err = await saveRes.json()
          throw new Error("DB Error: " + (err.details || err.error || "Failed to save file record"))
        }
        setFiles((prev) => prev.map((f) => f.id === uf.id ? { ...f, progress: 100, status: "done" } : f))
        toast.success(`${uf.file.name} uploaded successfully!`)
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Upload failed"
        setFiles((prev) => prev.map((f) => f.id === uf.id ? { ...f, status: "error", error: msg } : f))
        toast.error(`Failed: ${uf.file.name}`)
      }
    }
  }

  const formatBytes = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const statusIcon = (status: UploadFile["status"]) => {
    switch (status) {
      case "done": return <CheckCircle2 size={16} className="text-emerald-500" />
      case "error": return <AlertCircle size={16} className="text-red-500" />
      case "uploading":
      case "saving": return <Loader2 size={16} className="text-primary animate-spin" />
      default: return <File size={16} className="text-muted-foreground" />
    }
  }

  const statusLabel = (uf: UploadFile) => {
    switch (uf.status) {
      case "queued": return <span className="text-xs text-muted-foreground">Queued</span>
      case "uploading": return <span className="text-xs text-blue-600">Uploading {uf.progress}%</span>
      case "saving": return <span className="text-xs text-amber-600">Saving...</span>
      case "done": return <span className="text-xs text-emerald-600">Done</span>
      case "error": return <span className="text-xs text-red-500">{uf.error}</span>
    }
  }

  const hasQueued = files.some((f) => f.status === "queued")
  const allUploadsFinished = files.length > 0 && files.every((f) => f.status === "done" || f.status === "error")
  const successCount = files.filter((f) => f.status === "done").length

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Upload Files</h1>
        <p className="text-muted-foreground text-sm mt-0.5">Drag & drop files or click to browse</p>
      </div>

      {/* Target Folder Selection Banner or Selector */}
      {urlCategoryId ? (
        <div className="bg-gradient-to-r from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-5 flex items-center justify-between shadow-sm animate-in fade-in duration-300">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary/15 flex items-center justify-center text-primary">
              <FolderOpen size={20} />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-foreground">Target Folder Selected</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Files will be saved in <span className="font-medium text-foreground">📁 {activeCategoryName || "Loading folder..."}</span>
              </p>
            </div>
          </div>
          <Button asChild variant="outline" size="sm" className="gap-2">
            <Link href={`/dashboard/files?category=${urlCategoryId}`}>
              <ArrowLeft size={14} /> Back to Folder
            </Link>
          </Button>
        </div>
      ) : (
        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
          <div className="space-y-1">
            <h2 className="text-sm font-semibold text-foreground">Select Target Folder</h2>
            <p className="text-xs text-muted-foreground">Choose where to store the uploaded files</p>
          </div>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="bg-background border border-border rounded-xl px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all min-w-[200px] shadow-sm cursor-pointer"
              disabled={loadingCategories}
            >
              {loadingCategories ? (
                <option>Loading folders...</option>
              ) : (
                <>
                  <option value="">None (Root Directory)</option>
                  {categories.map((cat) => (
                    <option key={cat.id} value={cat.id}>
                      📁 {cat.name}
                    </option>
                  ))}
                </>
              )}
            </select>

            <Button
              variant="default"
              size="sm"
              onClick={() => setShowQuickFolderForm(!showQuickFolderForm)}
              className="gap-2 rounded-xl h-[38px]"
            >
              <FolderPlus size={15} />
              New Folder
            </Button>
          </div>
        </div>
      )}

      {/* Testing Utilities */}
      <div className="bg-amber-50/50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-2xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm animate-in fade-in duration-300">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-amber-900 dark:text-amber-500">Test Override: Custom Date</h2>
          <p className="text-xs text-amber-700 dark:text-amber-600">Optionally set a custom upload date to test the gallery date filters.</p>
        </div>
        <input 
          type="date" 
          value={customDate}
          onChange={(e) => setCustomDate(e.target.value)}
          className="bg-background border border-border rounded-xl px-3.5 py-2 text-sm outline-none focus:ring-2 focus:ring-amber-500/50 transition-all shadow-sm max-w-[200px]"
        />
      </div>

      {/* Quick create folder form */}
      {!urlCategoryId && showQuickFolderForm && (
        <div className="bg-muted/40 border border-border/80 rounded-2xl p-4 space-y-3 animate-in fade-in duration-200">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Quick Create Folder</h4>
            <button onClick={() => setShowQuickFolderForm(false)} className="text-muted-foreground hover:text-foreground">
              <X size={14} />
            </button>
          </div>
          <div className="flex gap-2">
            <input
              type="text"
              value={quickFolderName}
              onChange={(e) => setQuickFolderName(e.target.value)}
              placeholder="e.g. Invoices, Pictures..."
              className="flex-1 px-3 py-1.5 rounded-xl border border-border bg-background text-sm outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              onKeyDown={(e) => e.key === "Enter" && handleQuickCreateFolder()}
            />
            <Button
              size="sm"
              onClick={handleQuickCreateFolder}
              disabled={!quickFolderName.trim() || quickCreating}
              className="rounded-xl px-4"
            >
              {quickCreating ? <Loader2 size={14} className="animate-spin" /> : "Create"}
            </Button>
          </div>
        </div>
      )}

      {/* Drop zone */}
      <div
        {...getRootProps()}
        className={`relative border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center cursor-pointer transition-all duration-200 ${
          isDragActive
            ? "border-primary bg-primary/5 scale-[1.01]"
            : "border-border hover:border-primary/50 hover:bg-accent"
        }`}
      >
        <input {...getInputProps()} />
        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-colors ${isDragActive ? "bg-primary" : "bg-muted"}`}>
          <CloudUpload size={28} className={isDragActive ? "text-white" : "text-muted-foreground"} />
        </div>
        {isDragActive ? (
          <p className="text-lg font-semibold text-primary">Drop files here!</p>
        ) : (
          <>
            <p className="text-base font-semibold">Drag & drop files here</p>
            <p className="text-sm text-muted-foreground mt-1">or <span className="text-primary font-medium">click to browse</span></p>
            <p className="text-xs text-muted-foreground mt-3">
              Supports: Images (10MB), Documents (50MB), Videos (500MB)
            </p>
          </>
        )}
      </div>

      {/* File list */}
      {files.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">{files.length} file{files.length !== 1 ? "s" : ""} selected</h2>
            {hasQueued && (
              <Button onClick={uploadAll} size="sm" className="gap-2">
                <Upload size={14} />
                Upload All
              </Button>
            )}
            {allUploadsFinished && successCount > 0 && (
              <Button asChild size="sm" className="gap-2 bg-emerald-600 hover:bg-emerald-700 text-white">
                <Link href={targetCategory ? `/dashboard/files?category=${targetCategory}` : "/dashboard/files"}>
                  View Uploaded Files
                </Link>
              </Button>
            )}
          </div>

          <div className="space-y-2">
            {files.map((uf) => (
              <div key={uf.id} className="bg-card border border-border rounded-xl p-4">
                <div className="flex items-center gap-3">
                  {statusIcon(uf.status)}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{uf.file.name}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-xs text-muted-foreground">{formatBytes(uf.file.size)}</span>
                      {statusLabel(uf)}
                    </div>
                  </div>
                  {uf.status === "queued" && (
                    <button onClick={() => removeFile(uf.id)} className="text-muted-foreground hover:text-destructive transition-colors">
                      <X size={16} />
                    </button>
                  )}
                </div>
                {/* Progress bar */}
                {(uf.status === "uploading" || uf.status === "saving" || uf.status === "done") && (
                  <div className="mt-3 h-1.5 bg-secondary rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${uf.status === "done" ? "bg-emerald-500" : "bg-primary"}`}
                      style={{ width: `${uf.progress}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function UploadPage() {
  return (
    <Suspense fallback={
      <div className="flex items-center justify-center py-20">
        <Loader2 className="animate-spin text-muted-foreground" size={32} />
      </div>
    }>
      <UploadForm />
    </Suspense>
  )
}
