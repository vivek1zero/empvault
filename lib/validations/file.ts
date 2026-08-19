import { z } from "zod"

export const MAX_IMAGE_SIZE = 10 * 1024 * 1024 // 10MB
export const MAX_DOCUMENT_SIZE = 50 * 1024 * 1024 // 50MB
export const MAX_VIDEO_SIZE = 500 * 1024 * 1024 // 500MB

export const ALLOWED_IMAGE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "image/svg+xml",
]

export const ALLOWED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-powerpoint",
  "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  "text/plain",
]

export const ALLOWED_VIDEO_TYPES = ["video/mp4", "video/webm", "video/ogg"]

export const ALLOWED_MIME_TYPES = [
  ...ALLOWED_IMAGE_TYPES,
  ...ALLOWED_DOCUMENT_TYPES,
  ...ALLOWED_VIDEO_TYPES,
]

export const presignedUploadSchema = z.object({
  filename: z.string().min(1),
  mimeType: z.string().refine((val) => ALLOWED_MIME_TYPES.includes(val), {
    message: "File type not allowed.",
  }),
  size: z.number().positive(),
})

export const completeUploadSchema = z.object({
  storageKey: z.string().min(1),
  originalName: z.string().min(1),
  categoryId: z.string().min(1),
  description: z.string().optional(),
  tags: z.array(z.string()).optional().default([]),
})
