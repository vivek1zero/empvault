import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { fileIds, categoryId } = await req.json()
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

    // Verify category exists if provided
    if (categoryId) {
      const category = await prisma.category.findUnique({ where: { id: categoryId } })
      if (!category) return new NextResponse("Category not found", { status: 404 })
    }

    // Update DB records
    await prisma.file.updateMany({
      where: { id: { in: files.map(f => f.id) } },
      data: { categoryId: categoryId || null }
    })

    // Log bulk move activity
    await prisma.activityLog.create({
      data: {
        action: "BULK_MOVE_FILES",
        userId,
        metadata: JSON.stringify({ count: files.length, fileIds: files.map(f => f.id), categoryId })
      }
    })

    return NextResponse.json({ success: true, count: files.length })
  } catch (error) {
    console.error("Bulk move error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
