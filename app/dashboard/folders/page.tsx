"use client"

import { useEffect, useState } from "react"
import { FolderOpen, Plus, Trash2, Loader2, FolderPlus, File, X, Upload } from "lucide-react"
import { Button } from "@/components/ui/button"
import { toast } from "sonner"
import Link from "next/link"


interface Category {
  id: string
  name: string
  slug: string
  description: string | null
  isActive: boolean
  createdById: string
  createdBy: { name: string }
  _count: { files: number }
  createdAt: string
}

export default function FoldersPage() {
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName] = useState("")
  const [newDesc, setNewDesc] = useState("")
  const [creating, setCreating] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const fetchCategories = async () => {
    setLoading(true)
    const res = await fetch("/api/categories")
    const data = await res.json()
    setCategories(Array.isArray(data) ? data : [])
    setLoading(false)
  }

  useEffect(() => { fetchCategories() }, [])

  const createFolder = async () => {
    if (!newName.trim()) return
    setCreating(true)
    try {
      const res = await fetch("/api/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() || undefined }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Folder "${newName}" created!`)
      setNewName("")
      setNewDesc("")
      setShowForm(false)
      fetchCategories()
    } catch (e: any) {
      toast.error(e.message || "Failed to create folder")
    } finally {
      setCreating(false)
    }
  }

  const deleteFolder = async (id: string, name: string) => {
    if (!confirm(`Delete folder "${name}"? Files inside won't be deleted.`)) return
    setDeletingId(id)
    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      toast.success(`Folder "${name}" deleted`)
      fetchCategories()
    } catch (e: any) {
      toast.error(e.message || "Failed to delete folder")
    } finally {
      setDeletingId(null)
    }
  }

  const FOLDER_STYLES = [
    { glow: "group-hover:shadow-violet-500/20", border: "border-t-violet-400/50 group-hover:border-t-violet-500", icon: "text-violet-500", lightBg: "hover:bg-violet-50/30" },
    { glow: "group-hover:shadow-blue-500/20", border: "border-t-blue-400/50 group-hover:border-t-blue-500", icon: "text-blue-500", lightBg: "hover:bg-blue-50/30" },
    { glow: "group-hover:shadow-emerald-500/20", border: "border-t-emerald-400/50 group-hover:border-t-emerald-500", icon: "text-emerald-500", lightBg: "hover:bg-emerald-50/30" },
    { glow: "group-hover:shadow-orange-500/20", border: "border-t-orange-400/50 group-hover:border-t-orange-500", icon: "text-orange-500", lightBg: "hover:bg-orange-50/30" },
    { glow: "group-hover:shadow-pink-500/20", border: "border-t-pink-400/50 group-hover:border-t-pink-500", icon: "text-pink-500", lightBg: "hover:bg-pink-50/30" },
    { glow: "group-hover:shadow-cyan-500/20", border: "border-t-cyan-400/50 group-hover:border-t-cyan-500", icon: "text-cyan-500", lightBg: "hover:bg-cyan-50/30" },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FolderOpen size={22} className="text-primary" /> My Folders
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">Organize your files into folders</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" className="gap-2">
            <Link href="/dashboard/upload">
              <Upload size={16} /> Upload Files
            </Link>
          </Button>
          <Button onClick={() => setShowForm(true)} className="gap-2">
            <FolderPlus size={16} /> New Folder
          </Button>
        </div>
      </div>

      {/* Create Folder Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-xl p-6 shadow-lg shadow-black/5 animate-in slide-in-from-top-4 fade-in duration-300">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-bold text-base flex items-center gap-2">
              <FolderPlus size={18} className="text-primary" /> Create New Folder
            </h3>
            <button onClick={() => setShowForm(false)} className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
              <X size={16} />
            </button>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Folder Name *</label>
              <input
                type="text"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => e.key === "Enter" && createFolder()}
                placeholder="e.g. Marketing Assets"
                className="mt-2 w-full px-4 py-2.5 rounded-lg border border-border bg-background/50 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-inner"
                autoFocus
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Description (optional)</label>
              <input
                type="text"
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                onKeyDown={e => e.key === "Enter" && createFolder()}
                placeholder="What kind of files go here?"
                className="mt-2 w-full px-4 py-2.5 rounded-lg border border-border bg-background/50 text-sm outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all shadow-inner"
              />
            </div>
          </div>
          <div className="flex items-center gap-3 mt-6">
            <Button onClick={createFolder} disabled={creating || !newName.trim()} className="gap-2 px-6 shadow-md transition-transform active:scale-95">
              {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              Create Folder
            </Button>
            <Button variant="ghost" onClick={() => setShowForm(false)} className="hover:bg-muted/50 transition-colors">Cancel</Button>
          </div>
        </div>
      )}

      {/* Folders Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={32} className="animate-spin text-muted-foreground" />
        </div>
      ) : categories.length === 0 ? (
        <div className="text-center py-20 bg-card border border-border rounded-xl">
          <FolderOpen size={48} className="mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="font-semibold text-lg">No folders yet</h3>
          <p className="text-muted-foreground text-sm mt-1">Create a folder to start organizing your files</p>
          <Button onClick={() => setShowForm(true)} className="mt-5 gap-2">
            <FolderPlus size={16} /> Create your first folder
          </Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {categories.map((cat, i) => {
            const style = FOLDER_STYLES[i % FOLDER_STYLES.length]
            return (
              <div
                key={cat.id}
                className={`group relative bg-card border-x border-b border-border border-t-[3px] ${style.border} ${style.lightBg} rounded-xl p-5 transition-all duration-300 hover:-translate-y-1.5 hover:scale-[1.02] shadow-sm hover:shadow-lg ${style.glow} animate-in fade-in slide-in-from-bottom-8 fill-mode-both`}
                style={{ animationDelay: `${i * 50}ms`, animationDuration: '400ms' }}
              >
                {/* Actions Container - Slide in from right */}
                <div className="absolute top-4 right-4 flex flex-col gap-2 translate-x-4 opacity-0 group-hover:translate-x-0 group-hover:opacity-100 transition-all duration-300 z-10">
                  <Link
                    href={`/dashboard/upload?category=${cat.id}`}
                    className="p-2 rounded-full bg-background/90 backdrop-blur border border-border shadow-sm text-muted-foreground hover:text-primary hover:bg-background transition-colors"
                    title="Upload to this folder"
                  >
                    <Upload size={14} />
                  </Link>
                  <button
                    onClick={() => deleteFolder(cat.id, cat.name)}
                    disabled={deletingId === cat.id}
                    className="p-2 rounded-full bg-background/90 backdrop-blur border border-border shadow-sm text-muted-foreground hover:text-destructive hover:bg-background transition-colors"
                    title="Delete folder"
                  >
                    {deletingId === cat.id
                      ? <Loader2 size={14} className="animate-spin" />
                      : <Trash2 size={14} />
                    }
                  </button>
                </div>

                <Link href={`/dashboard/files?category=${cat.id}`} className="block h-full relative z-0">
                  <FolderOpen size={36} className={`mb-4 ${style.icon} transition-transform duration-300 group-hover:-translate-y-1 group-hover:scale-110 drop-shadow-sm`} />
                  <h3 className="font-semibold text-[15px] truncate pr-8 group-hover:text-primary transition-colors">{cat.name}</h3>
                  {cat.description && (
                    <p className="text-[13px] text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">{cat.description}</p>
                  )}
                  <div className="flex items-center gap-1.5 mt-5">
                    <File size={13} className="text-muted-foreground" />
                    <span className="text-xs font-medium text-muted-foreground">
                      {cat._count.files} {cat._count.files === 1 ? "file" : "files"}
                    </span>
                  </div>
                </Link>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
