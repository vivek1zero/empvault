import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { Files, FileText, ImageIcon, Video, FileArchive, Download, Trash2, Share2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"
import FileFilters from "./file-filters"
import FileGallery from "./file-gallery"
import { Prisma } from "@prisma/client"
import { BulkActionProvider } from "@/components/files/bulk-action-provider"
import { BulkActionBar } from "@/components/files/bulk-action-bar"
import { FileTable } from "@/components/files/file-table"

function formatBytes(bytes: bigint): string {
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

export default async function FilesPage({
  searchParams,
}: {
  searchParams: { [key: string]: string | string[] | undefined }
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const userId = (session.user as { id?: string }).id!
  const role = (session.user as { role?: string }).role

  const q = typeof searchParams.q === 'string' ? searchParams.q : ""
  const typeFilter = typeof searchParams.type === 'string' ? searchParams.type : "All"
  const viewMode = typeof searchParams.view === 'string' ? searchParams.view : "grid"
  const categoryId = typeof searchParams.category === 'string' ? searchParams.category : ""
  const yearFilter = typeof searchParams.year === 'string' ? searchParams.year : ""
  const monthFilter = typeof searchParams.month === 'string' ? searchParams.month : ""
  const dayFilter = typeof searchParams.day === 'string' ? searchParams.day : ""

  const whereClause: Prisma.FileWhereInput = {
    status: "ACTIVE",
    ...(role !== "ADMIN" && role !== "MANAGER" ? { uploadedById: userId } : {}),
  }

  if (q) {
    whereClause.OR = [
      { originalName: { contains: q } },
      { description: { contains: q } }
    ]
  }

  if (typeFilter !== "All") {
    if (typeFilter === "Images") whereClause.fileType = "IMAGE"
    if (typeFilter === "Videos") whereClause.fileType = "VIDEO"
    if (typeFilter === "Documents") whereClause.fileType = "DOCUMENT"
  }

  if (categoryId) {
    whereClause.categoryId = categoryId
  }

  if (yearFilter || monthFilter || dayFilter) {
    let startYear = yearFilter ? parseInt(yearFilter, 10) : undefined;
    const startMonth = monthFilter ? parseInt(monthFilter, 10) - 1 : undefined; // 0-indexed
    const startDay = dayFilter ? parseInt(dayFilter, 10) : undefined;

    if (!startYear && (startMonth !== undefined || startDay !== undefined)) {
      startYear = new Date().getFullYear();
    }

    if (startYear !== undefined) {
      let startDate: Date;
      let endDate: Date;

      if (startMonth !== undefined && startDay !== undefined) {
        startDate = new Date(startYear, startMonth, startDay);
        endDate = new Date(startYear, startMonth, startDay + 1);
      } else if (startMonth !== undefined) {
        startDate = new Date(startYear, startMonth, 1);
        endDate = new Date(startYear, startMonth + 1, 1);
      } else {
        startDate = new Date(startYear, 0, 1);
        endDate = new Date(startYear + 1, 0, 1);
      }

      whereClause.createdAt = {
        gte: startDate,
        lt: endDate
      }
    }
  }

  const files = await prisma.file.findMany({
    where: whereClause,
    orderBy: { createdAt: "desc" },
    include: {
      uploadedBy: { select: { name: true, email: true } },
      category: { select: { name: true } },
      favorites: { where: { userId }, select: { id: true } }
    },
  })

  let categoryName = ""
  if (categoryId) {
    const category = await prisma.category.findUnique({
      where: { id: categoryId },
      select: { name: true }
    })
    categoryName = category?.name || ""
  }

  // Group files by date for grid view
  const groupedFiles: { dateLabel: string, id: string, files: typeof files }[] = []
  let currentLabel = ""
  
  files.forEach(file => {
    const dateLabel = file.createdAt.toLocaleDateString(undefined, {
      weekday: 'short', month: 'short', day: 'numeric', year: 'numeric'
    })
    if (currentLabel !== dateLabel) {
      currentLabel = dateLabel
      groupedFiles.push({
        dateLabel,
        id: `date-${file.createdAt.getTime()}`,
        files: []
      })
    }
    groupedFiles[groupedFiles.length - 1].files.push(file)
  })

  // Sort favorited files to the front of each date group
  groupedFiles.forEach(group => {
    group.files.sort((a, b) => {
      const aFav = a.favorites && a.favorites.length > 0 ? 1 : 0
      const bFav = b.favorites && b.favorites.length > 0 ? 1 : 0
      return bFav - aFav
    })
  })

  // Scrubber: unique Month Year combos and Year markers
  const scrubberLinks: { isYearMarker?: boolean, label: string, id: string, count?: number }[] = []
  const seenMonths = new Set()
  const seenYears = new Set()
  
  groupedFiles.forEach(group => {
    const date = new Date(group.files[0].createdAt)
    const year = date.getFullYear().toString()
    const monthYear = date.toLocaleDateString(undefined, { month: 'short', year: 'numeric' })
    
    if (!seenYears.has(year)) {
      seenYears.add(year)
      scrubberLinks.push({ isYearMarker: true, label: year, id: group.id })
    }
    
    if (!seenMonths.has(monthYear)) {
      seenMonths.add(monthYear)
      scrubberLinks.push({ isYearMarker: false, label: monthYear, id: group.id, count: group.files.length })
    }
  })

  return (
    <BulkActionProvider>
      <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">
            {categoryName ? `Folder: ${categoryName}` : "All Files"}
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">{files.length} files total</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <FileFilters />
      </div>

      {/* Files List/Grid */}
      {files.length === 0 ? (
        <div className="text-center py-20 bg-transparent">
          <Files size={48} className="mx-auto mb-4 text-muted-foreground/30" />
          <h3 className="font-semibold text-lg">No files found</h3>
          <p className="text-muted-foreground text-sm mt-1">Try adjusting your filters or upload a new file.</p>
        </div>
      ) : viewMode === "list" ? (
        <FileTable files={files} />
      ) : (
        <FileGallery groupedFiles={groupedFiles} scrubberLinks={scrubberLinks} />
      )}

      <BulkActionBar />
    </div>
    </BulkActionProvider>
  )
}
