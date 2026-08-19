import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

export async function POST(req: Request, { params }: { params: { fileId: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const userId = session.user.id
    const fileId = params.fileId

    // Check if it's already favorited
    const existing = await prisma.favorite.findUnique({
      where: {
        userId_fileId: { userId, fileId }
      }
    })

    if (existing) {
      // Remove favorite
      await prisma.favorite.delete({
        where: { id: existing.id }
      })
      return NextResponse.json({ favorited: false })
    } else {
      // Add favorite
      await prisma.favorite.create({
        data: { userId, fileId }
      })
      return NextResponse.json({ favorited: true })
    }
  } catch (error) {
    console.error("Favorite toggle error:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
}
