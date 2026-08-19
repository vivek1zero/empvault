"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import {
  LayoutDashboard,
  Files,
  Upload,
  FolderOpen,
  Share2,
  Trash2,
  Activity,
  Bell,
  Users,
  Tags,
  HardDrive,
  Vault,
  ChevronRight,
  Settings,
  Star,
} from "lucide-react"
import { cn } from "@/lib/utils"

interface NavItem {
  label: string
  href: string
  icon: React.ReactNode
  adminOnly?: boolean
}

const navItems: NavItem[] = [
  { label: "All Files", href: "/dashboard/files", icon: <Files size={18} /> },
  { label: "Favorites", href: "/dashboard/favorites", icon: <Star size={18} /> },
  { label: "Dashboard", href: "/dashboard", icon: <LayoutDashboard size={18} /> },
  { label: "Upload", href: "/dashboard/upload", icon: <Upload size={18} /> },
  { label: "My Folders", href: "/dashboard/folders", icon: <FolderOpen size={18} /> },
  { label: "Shared with Me", href: "/dashboard/shared", icon: <Share2 size={18} /> },
  { label: "Trash", href: "/dashboard/trash", icon: <Trash2 size={18} /> },
  { label: "Activity Log", href: "/dashboard/activity", icon: <Activity size={18} /> },
  { label: "Notifications", href: "/dashboard/notifications", icon: <Bell size={18} /> },
  { label: "Settings", href: "/dashboard/settings", icon: <Settings size={18} /> },
]

const adminNavItems: NavItem[] = [
  { label: "Users", href: "/dashboard/admin/users", icon: <Users size={18} />, adminOnly: true },
  { label: "Categories", href: "/dashboard/admin/categories", icon: <Tags size={18} />, adminOnly: true },
  { label: "Storage Stats", href: "/dashboard/admin/storage", icon: <HardDrive size={18} />, adminOnly: true },
]

interface SidebarProps {
  userRole?: string
}

export default function Sidebar({ userRole }: SidebarProps) {
  const pathname = usePathname()

  const isActive = (href: string) => {
    if (href === "/dashboard") return pathname === "/dashboard"
    return pathname.startsWith(href)
  }

  return (
    <aside className="flex flex-col h-full w-64 bg-[var(--sidebar-bg)] text-[var(--sidebar-text)] shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-white/5">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center">
          <Vault size={16} className="text-white" />
        </div>
        <span className="font-bold text-lg text-white tracking-tight">EmpVault</span>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto scrollbar-thin px-3 py-4 space-y-0.5">
        <p className="text-xs font-semibold uppercase tracking-wider text-white/30 px-3 mb-2">Main</p>
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
              isActive(item.href)
                ? "bg-primary text-white shadow-sm"
                : "text-[var(--sidebar-text)] hover:bg-white/5 hover:text-white"
            )}
          >
            <span className={cn(
              "transition-colors",
              isActive(item.href) ? "text-white" : "text-white/40 group-hover:text-white"
            )}>
              {item.icon}
            </span>
            {item.label}
            {isActive(item.href) && (
              <ChevronRight size={14} className="ml-auto text-white/60" />
            )}
          </Link>
        ))}

        {/* Admin section */}
        {(userRole === "ADMIN" || userRole === "MANAGER") && (
          <>
            <p className="text-xs font-semibold uppercase tracking-wider text-white/30 px-3 mt-5 mb-2">Admin</p>
            {adminNavItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 group",
                  isActive(item.href)
                    ? "bg-primary text-white shadow-sm"
                    : "text-[var(--sidebar-text)] hover:bg-white/5 hover:text-white"
                )}
              >
                <span className={cn(
                  "transition-colors",
                  isActive(item.href) ? "text-white" : "text-white/40 group-hover:text-white"
                )}>
                  {item.icon}
                </span>
                {item.label}
              </Link>
            ))}
          </>
        )}
      </nav>

      {/* Footer */}
      <div className="px-4 py-4 border-t border-white/5">
        <p className="text-xs text-white/20 text-center">EmpVault v1.0</p>
      </div>
    </aside>
  )
}
