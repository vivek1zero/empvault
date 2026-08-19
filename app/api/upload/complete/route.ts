import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const body = await req.json()
    const { storagePath, bucketName, originalName, storedName, mimeType, size, categoryId, description, tags, customDate } = body

    if (!storagePath || !bucketName || !originalName || !storedName || !size) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    let fileType: "IMAGE" | "VIDEO" | "DOCUMENT" | "OTHER" = "OTHER"
    if (mimeType.startsWith("image/")) fileType = "IMAGE"
    else if (mimeType.startsWith("video/")) fileType = "VIDEO"
    else if (mimeType.includes("pdf") || mimeType.includes("document") || mimeType.includes("text")) fileType = "DOCUMENT"

    // Use transaction to ensure both file is created and quota is updated
    const file = await prisma.$transaction(async (tx) => {
      // Create the file record
      const newFile = await tx.file.create({
        data: {
          originalName,
          storedName,
          mimeType,
          size: BigInt(size),
          storageKey: storagePath,
          bucketName,
          storagePath,
          fileType,
          status: "ACTIVE",
          uploadedById: userId,
          categoryId: categoryId || null,
          description: description || null,
          tags: JSON.stringify(tags || []),
          ...(customDate ? { createdAt: new Date(customDate) } : {})
        },
      })

      // Update user storage used
      await tx.user.update({
        where: { id: userId },
        data: {
          storageUsed: { increment: BigInt(size) }
        }
      })

      // Log activity
      await tx.activityLog.create({
        data: {
          action: "UPLOAD",
          userId: userId,
          fileId: newFile.id,
          metadata: JSON.stringify({ mimeType: body.mimeType, size: body.size }),
        }
      })

      return newFile
    })

    // We can't return BigInt directly in JSON, so convert it
    return NextResponse.json({ 
      success: true, 
      file: {
        ...file,
        size: Number(file.size)
      } 
    })

  } catch (error: any) {
    console.error("Upload complete error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message || String(error) }, { status: 500 })
  }
}
