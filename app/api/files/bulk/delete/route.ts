import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { deleteStorageFile } from "@/lib/storage"

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

    // Fetch the files to ensure they exist and the user has permission
    const files = await prisma.file.findMany({
      where: {
        id: { in: fileIds },
        ...(role !== "ADMIN" && role !== "MANAGER" ? { uploadedById: userId } : {})
      }
    })

    if (files.length === 0) {
      return new NextResponse("No files found or unauthorized", { status: 404 })
    }

    // Delete physical files
    for (const file of files) {
      await deleteStorageFile(file.bucketName, file.storagePath)
    }

    // Delete DB records
    await prisma.file.deleteMany({
      where: {
        id: { in: files.map(f => f.id) }
      }
    })

    // Log bulk delete activity
    await prisma.activityLog.create({
      data: {
        action: "BULK_DELETE_FILES",
        userId,
        metadata: JSON.stringify({ count: files.length, fileIds: files.map(f => f.id) })
      }
    })

    return NextResponse.json({ success: true, count: files.length })
  } catch (error) {
    console.error("Bulk delete error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
