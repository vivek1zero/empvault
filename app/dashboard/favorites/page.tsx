import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { Files, FileText, ImageIcon, Video, FileArchive, Download, Trash2, Share2, Star } from "lucide-react"
import FileFilters from "../files/file-filters"
import FileGallery from "../files/file-gallery"
import { Prisma } from "@prisma/client"
import { BulkActionProvider } from "@/components/files/bulk-action-provider"
import { BulkActionBar } from "@/components/files/bulk-action-bar"
import { FileTable } from "@/components/files/file-table"

export default async function FavoritesPage({
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
    favorites: {
      some: {
        userId
      }
    }
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
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Star className="fill-yellow-400 text-yellow-400" size={24} />
            Favorites
          </h1>
          <p className="text-muted-foreground text-sm mt-0.5">{files.length} favorited {files.length === 1 ? 'file' : 'files'} total</p>
        </div>
      </div>

      <div className="flex items-center justify-between mb-2">
        <FileFilters />
      </div>

      {/* Files List/Grid */}
      {files.length === 0 ? (
        <div className="text-center py-20 bg-transparent flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-yellow-500/10 flex items-center justify-center mb-4">
            <Star size={32} className="text-yellow-500/50 fill-yellow-500/50" />
          </div>
          <h3 className="font-semibold text-lg">No favorites yet</h3>
          <p className="text-muted-foreground text-sm mt-1 max-w-sm">
            You haven't added any files to your favorites. Click the star icon on any file to bookmark it here for quick access.
          </p>
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
