import { NextResponse } from "next/server"
import fs from "fs"
import path from "path"

export async function PUT(req: Request) {
  try {
    const { searchParams } = new URL(req.url)
    const bucket = searchParams.get("bucket")
    const filePath = searchParams.get("path")

    if (!bucket || !filePath) {
      return new NextResponse("Missing bucket or path", { status: 400 })
    }

    const fullPath = path.join(process.cwd(), "public", "uploads", bucket, filePath)
    const dir = path.dirname(fullPath)

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true })
    }

    const buffer = Buffer.from(await req.arrayBuffer())
    fs.writeFileSync(fullPath, buffer)

    return new NextResponse("OK", { status: 200 })
  } catch (err: any) {
    console.error("Local upload error:", err)
    return new NextResponse(err.message || "Internal Server Error", { status: 500 })
  }
}
