import fs from "fs"
import path from "path"

export function getBucketForMimeType(mimeType: string): string {
  if (mimeType.startsWith("image/")) return "empvault-images"
  if (mimeType.startsWith("video/")) return "empvault-videos"
  return "empvault-documents"
}

export function generateStoragePath(userId: string, storedName: string): string {
  return `${userId}/${storedName}`
}

export async function getSignedUploadUrl(bucket: string, storagePath: string, expiresIn = 300, contentType?: string): Promise<string> {
  // Return a URL to our local API route that will handle the PUT request
  return `http://localhost:3000/api/local-storage/upload?bucket=${bucket}&path=${encodeURIComponent(storagePath)}`
}

export async function getSignedDownloadUrl(bucket: string, storagePath: string, expiresIn = 900): Promise<string> {
  // For local development, we serve the files directly from the public/uploads directory
  return `/uploads/${bucket}/${storagePath}`
}

export async function deleteStorageFile(bucket: string, storagePath: string): Promise<void> {
  try {
    const fullPath = path.join(process.cwd(), "public", "uploads", bucket, storagePath)
    if (fs.existsSync(fullPath)) {
      fs.unlinkSync(fullPath)
    }
  } catch (error: any) {
    console.error(`Local Delete Error: ${error.message}`)
  }
}
