import { z } from "zod"

const roleEnum = z.enum(["ADMIN", "MANAGER", "EMPLOYEE", "VIEWER"])

export const userCreateSchema = z.object({
  email: z.string().email(),
  name: z.string().min(2),
  role: roleEnum.default("EMPLOYEE"),
  department: z.string().optional(),
})

export const userUpdateSchema = z.object({
  name: z.string().min(2).optional(),
  role: roleEnum.optional(),
  department: z.string().optional(),
  isActive: z.boolean().optional(),
  storageQuota: z.number().positive().optional(),
})
