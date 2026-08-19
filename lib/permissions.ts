import { User } from "@prisma/client"

export const ROLE_HIERARCHY: Record<string, number> = {
  VIEWER: 1,
  EMPLOYEE: 2,
  MANAGER: 3,
  ADMIN: 4,
}

export type Action = 
  | "create_file"
  | "delete_own_file"
  | "delete_any_file"
  | "manage_users"
  | "manage_categories"
  | "view_department_files"
  | "view_all_files"

/**
 * Checks if a role has permission to perform a generic action based on role hierarchy
 */
export function hasPermission(userRole: string, action: Action): boolean {
  switch (action) {
    case "create_file":
    case "delete_own_file":
      return (ROLE_HIERARCHY[userRole] || 0) >= ROLE_HIERARCHY.EMPLOYEE
    case "view_department_files":
      return (ROLE_HIERARCHY[userRole] || 0) >= ROLE_HIERARCHY.MANAGER
    case "delete_any_file":
    case "manage_users":
    case "manage_categories":
    case "view_all_files":
      return (ROLE_HIERARCHY[userRole] || 0) >= ROLE_HIERARCHY.ADMIN
    default:
      return false
  }
}

/**
 * Checks if a user can upload to a specific category
 */
export function canUploadToCategory(userRole: string, categoryAllowedRoles: string[]): boolean {
  if (userRole === "ADMIN") return true
  return categoryAllowedRoles.includes(userRole)
}
