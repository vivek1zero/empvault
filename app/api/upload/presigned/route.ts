import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { presignedUploadSchema } from "@/lib/validations/file"
import { getBucketForMimeType, generateStoragePath, getSignedUploadUrl } from "@/lib/storage"
import prisma from "@/lib/prisma"
import { v4 as uuidv4 } from "uuid"

export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const userId = session.user.id
    const body = await req.json()
    const parsed = presignedUploadSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error }, { status: 400 })
    }

    const { filename, size } = parsed.data
    // Use the parsed mimeType or default if not provided, but the schema should enforce it
    const mimeType = parsed.data.mimeType || "application/octet-stream"

    // Check user quota
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { storageUsed: true, storageQuota: true },
    })

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 })
    }

    if (Number(user.storageUsed) + size > Number(user.storageQuota)) {
      return NextResponse.json({ error: "Storage quota exceeded" }, { status: 403 })
    }

    const bucketName = getBucketForMimeType(mimeType)
    
    // Generate UUID stored name and full path
    const fileExtension = filename.includes('.') ? filename.split('.').pop() : ''
    const storedName = fileExtension ? `${uuidv4()}.${fileExtension}` : uuidv4()
    const storagePath = generateStoragePath(userId, storedName)

    // Generate presigned URL via Supabase Storage
    const presignedUrl = await getSignedUploadUrl(bucketName, storagePath, 5 * 60, mimeType) // 5 minutes

    return NextResponse.json({ presignedUrl, bucketName, storagePath, storedName })

  } catch (error: any) {
    console.error("Presigned URL error:", error)
    return NextResponse.json({ error: "Internal server error", details: error.message || String(error) }, { status: 500 })
  }
}
