import { z } from "zod"

const roleEnum = z.enum(["ADMIN", "MANAGER", "EMPLOYEE", "VIEWER"])

export const categoryCreateSchema = z.object({
  name: z.string().min(2),
  description: z.string().optional(),
  parentId: z.string().uuid().optional(),
  allowedRoles: z.array(roleEnum).min(1),
})

export const categoryUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  description: z.string().optional(),
  parentId: z.string().uuid().optional().nullable(),
  allowedRoles: z.array(roleEnum).optional(),
  isActive: z.boolean().optional(),
})
