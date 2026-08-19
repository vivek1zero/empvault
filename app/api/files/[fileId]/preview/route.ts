import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { getSignedDownloadUrl } from "@/lib/storage"
import prisma from "@/lib/prisma"

export async function GET(req: Request, { params }: { params: { fileId: string } }) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const file = await prisma.file.findUnique({ where: { id: params.fileId } })
    if (!file) return NextResponse.json({ error: "Not found" }, { status: 404 })

    const url = await getSignedDownloadUrl(file.bucketName, file.storagePath)
    return NextResponse.json({ url })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
