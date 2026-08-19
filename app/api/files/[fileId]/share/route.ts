import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(req: Request, { params }: { params: { fileId: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const body = await req.json()
    const { targetUserEmail, expiresInDays } = body

    if (!targetUserEmail) {
      return NextResponse.json({ error: "Target email is required" }, { status: 400 })
    }

    const file = await prisma.file.findUnique({
      where: { id: params.fileId }
    })

    if (!file) {
      return NextResponse.json({ error: "File not found" }, { status: 404 })
    }

    const targetUser = await prisma.user.findUnique({
      where: { email: targetUserEmail }
    })

    if (!targetUser) {
      return NextResponse.json({ error: "User to share with not found" }, { status: 404 })
    }

    let expiresAt = null
    if (expiresInDays) {
      const d = new Date()
      d.setDate(d.getDate() + parseInt(expiresInDays))
      expiresAt = d
    }

    const share = await prisma.fileShare.create({
      data: {
        fileId: file.id,
        sharedById: userId,
        sharedWithId: targetUser.id,
        expiresAt
      }
    })

    await prisma.activityLog.create({
      data: {
        action: "SHARE",
        userId: userId,
        fileId: file.id,
        metadata: JSON.stringify({ sharedWith: targetUser.email })
      }
    })

    // Also create a notification for the target user
    await prisma.notification.create({
      data: {
        userId: targetUser.id,
        title: "File Shared",
        message: `${session.user.name} shared "${file.originalName}" with you.`,
        type: "SHARE",
        link: `/dashboard/files/${file.id}`
      }
    })

    return NextResponse.json({ success: true, share })

  } catch (error) {
    console.error("Share file error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
