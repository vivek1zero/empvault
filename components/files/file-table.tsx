"use client"

import React from "react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Download, Trash2, Share2, FileText, ImageIcon, Video, FileArchive } from "lucide-react"
import { useBulkAction } from "./bulk-action-provider"

function formatBytes(bytes: bigint | number): string {
  const b = Number(bytes)
  if (b === 0) return "0 B"
  const k = 1024
  const sizes = ["B", "KB", "MB", "GB"]
  const i = Math.floor(Math.log(b) / Math.log(k))
  return `${parseFloat((b / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`
}

function getFileIcon(type: string, large = false) {
  const size = large ? 24 : 18
  switch (type) {
    case "IMAGE": return <ImageIcon size={size} className="text-violet-500" />
    case "VIDEO": return <Video size={size} className="text-blue-500" />
    case "DOCUMENT": return <FileText size={size} className="text-emerald-500" />
    default: return <FileArchive size={size} className="text-orange-500" />
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

export function FileTable({ files }: { files: any[] }) {
  const { selectedFiles, toggleFile, toggleAll } = useBulkAction()

  const allSelected = files.length > 0 && files.every(f => selectedFiles.has(f.id))
  const someSelected = files.some(f => selectedFiles.has(f.id))

  const handleSelectAll = () => {
    toggleAll(files.map(f => f.id), !allSelected)
  }

  return (
    <div className="bg-card border border-border rounded-xl overflow-hidden mt-4">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <th className="px-4 py-3 w-10">
              <input 
                type="checkbox" 
                checked={allSelected}
                ref={input => { if (input) input.indeterminate = someSelected && !allSelected }}
                onChange={handleSelectAll}
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
              />
            </th>
            <th className="px-4 py-3 font-medium text-muted-foreground">Name</th>
            <th className="px-4 py-3 font-medium text-muted-foreground">Category</th>
            <th className="px-4 py-3 font-medium text-muted-foreground">Size</th>
            <th className="px-4 py-3 font-medium text-muted-foreground hidden sm:table-cell">Uploaded By</th>
            <th className="px-4 py-3 font-medium text-muted-foreground hidden md:table-cell">Date</th>
            <th className="px-4 py-3 text-right font-medium text-muted-foreground">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {files.map(file => {
            const isSelected = selectedFiles.has(file.id)
            return (
              <tr 
                key={file.id} 
                className={`hover:bg-accent/40 transition-colors group ${isSelected ? 'bg-primary/5' : ''}`}
              >
                <td className="px-4 py-3">
                  <input 
                    type="checkbox" 
                    checked={isSelected}
                    onChange={() => toggleFile(file.id)}
                    className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary cursor-pointer"
                  />
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 overflow-hidden ${getFileBg(file.fileType)}`}>
                      {file.fileType === "IMAGE" ? (
                        <img src={`/uploads/${file.bucketName}/${file.storagePath}`} alt={file.originalName} className="w-full h-full object-cover" />
                      ) : (
                        getFileIcon(file.fileType)
                      )}
                    </div>
                    <Link href={`/dashboard/files/${file.id}`} className="font-medium hover:text-primary transition-colors max-w-[200px] sm:max-w-xs truncate">
                      {file.originalName}
                    </Link>
                  </div>
                </td>
                <td className="px-4 py-3">
                  {file.category ? (
                    <Badge variant="secondary" className="font-normal text-xs">{file.category.name}</Badge>
                  ) : (
                    <span className="text-muted-foreground text-xs">—</span>
                  )}
                </td>
                <td className="px-4 py-3 text-muted-foreground">{formatBytes(file.size)}</td>
                <td className="px-4 py-3 text-muted-foreground hidden sm:table-cell">{file.uploadedBy.name}</td>
                <td className="px-4 py-3 text-muted-foreground hidden md:table-cell">{new Date(file.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3 text-right">
                  <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <a href={`/api/files/${file.id}/download`} className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors">
                      <Download size={14} />
                    </a>
                    <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors">
                      <Share2 size={14} />
                    </button>
                    <button className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
