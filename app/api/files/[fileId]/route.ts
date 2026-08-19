import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"
import { deleteStorageFile } from "@/lib/storage"

export async function DELETE(req: Request, { params }: { params: { fileId: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const userRole = (session.user as any).role

    const file = await prisma.file.findUnique({
      where: { id: params.fileId }
    })

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    // Only Uploader, Admin, or Manager can delete
    if (file.uploadedById !== userId && userRole !== "ADMIN" && userRole !== "MANAGER") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    // Transaction to update DB and User quota
    await prisma.$transaction(async (tx) => {
      // Soft delete in DB
      await tx.file.update({
        where: { id: file.id },
        data: { 
          status: "DELETED",
          deletedAt: new Date()
        }
      })

      // We do not immediately free quota on soft delete. 
      // It's freed when purged from Trash, but for now we'll just log it.

      await tx.activityLog.create({
        data: {
          action: "DELETE",
          userId: userId,
          fileId: file.id,
          metadata: JSON.stringify({ bucket: file.bucketName })
        }
      })
    })

    // Optionally: actually delete from Supabase if we wanted hard delete.
    // For now, prompt specified a "Soft delete" flow to trash.
    // await deleteStorageFile(file.bucketName, file.storagePath);

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error("Delete file error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
