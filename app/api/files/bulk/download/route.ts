import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import archiver from "archiver"
import fs from "fs"
import path from "path"
import { PassThrough } from "stream"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { fileIds } = await req.json()
    if (!Array.isArray(fileIds) || fileIds.length === 0) {
      return new NextResponse("Invalid request", { status: 400 })
    }

    const userId = (session.user as { id?: string }).id!
    const role = (session.user as { role?: string }).role

    const files = await prisma.file.findMany({
      where: {
        id: { in: fileIds },
        ...(role !== "ADMIN" && role !== "MANAGER" ? { uploadedById: userId } : {})
      }
    })

    if (files.length === 0) {
      return new NextResponse("No files found or unauthorized", { status: 404 })
    }

    // Increment download count
    await prisma.file.updateMany({
      where: { id: { in: files.map(f => f.id) } },
      data: { downloadCount: { increment: 1 } }
    })

    // Log bulk download activity
    await prisma.activityLog.create({
      data: {
        action: "BULK_DOWNLOAD_FILES",
        userId,
        metadata: JSON.stringify({ count: files.length, fileIds: files.map(f => f.id) })
      }
    })

    const archive = archiver("zip", { zlib: { level: 5 } })
    const passThrough = new PassThrough()

    archive.pipe(passThrough)

    // Append files to the archive
    for (const file of files) {
      const fullPath = path.join(process.cwd(), "public", "uploads", file.bucketName, file.storagePath)
      if (fs.existsSync(fullPath)) {
        // Prevent duplicate file names in zip
        archive.file(fullPath, { name: `${file.id.substring(0, 8)}-${file.originalName}` })
      }
    }

    archive.finalize()

    // Adapt Node stream to Web ReadableStream
    const webStream = new ReadableStream({
      start(controller) {
        passThrough.on("data", (chunk) => controller.enqueue(chunk))
        passThrough.on("end", () => controller.close())
        passThrough.on("error", (err) => controller.error(err))
      }
    })

    return new NextResponse(webStream as any, {
      headers: {
        "Content-Type": "application/zip",
        "Content-Disposition": `attachment; filename="bulk-download-${new Date().getTime()}.zip"`
      }
    })

  } catch (error) {
    console.error("Bulk download error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
