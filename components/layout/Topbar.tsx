"use client"

import { signOut } from "next-auth/react"
import { Bell, Search, LogOut, Settings, User, Moon, Sun, Upload } from "lucide-react"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import Link from "next/link"
import { useState, useEffect } from "react"
import { useSearchParams, usePathname, useRouter } from "next/navigation"

interface TopbarProps {
  user: {
    name?: string | null
    email?: string | null
    image?: string | null
    role?: string
  }
}

export default function Topbar({ user }: TopbarProps) {
  const [isDark, setIsDark] = useState(false)
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const router = useRouter()

  const currentQ = searchParams.get("q") || ""
  const [search, setSearch] = useState(currentQ)

  useEffect(() => {
    setSearch(currentQ)
  }, [currentQ])

  useEffect(() => {
    const timer = setTimeout(() => {
      // Only apply search automatically if on files page
      if (pathname.startsWith("/dashboard/files")) {
        const params = new URLSearchParams(searchParams.toString())
        if (search) {
          params.set("q", search)
        } else {
          params.delete("q")
        }
        router.push(`${pathname}?${params.toString()}`)
      }
    }, 400)
    return () => clearTimeout(timer)
  }, [search])

  const categoryId = searchParams.get("category")
  const uploadUrl = categoryId && pathname.startsWith("/dashboard/files")
    ? `/dashboard/upload?category=${categoryId}`
    : "/dashboard/upload"

  useEffect(() => {
    const saved = localStorage.getItem("theme")
    const dark = saved === "dark" || (!saved && window.matchMedia("(prefers-color-scheme: dark)").matches)
    setIsDark(dark)
    document.documentElement.classList.toggle("dark", dark)
  }, [])

  const toggleTheme = () => {
    const next = !isDark
    setIsDark(next)
    localStorage.setItem("theme", next ? "dark" : "light")
    document.documentElement.classList.toggle("dark", next)
  }

  const initials = user.name
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?"

  return (
    <header className="h-14 border-b border-border bg-card flex items-center justify-between px-4 sm:px-6 shrink-0 gap-4">
      <div className="flex-1 hidden sm:block"></div>

      {/* Search bar */}
      <div className="flex-[2] flex justify-center max-w-2xl">
        <div className="flex items-center gap-3 bg-muted/60 border border-transparent hover:bg-muted/80 focus-within:bg-background focus-within:border-primary/40 focus-within:shadow-sm rounded-full px-4 py-2 w-full max-w-[480px] text-sm text-foreground transition-all">
          <Search size={18} className="shrink-0 text-muted-foreground" />
          <input 
            type="text" 
            placeholder="Search your files"
            className="bg-transparent border-none outline-none w-full placeholder:text-muted-foreground font-medium"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex-1 flex items-center justify-end gap-1 sm:gap-2">
        {/* Upload shortcut */}
        <Button asChild variant="ghost" size="icon" className="rounded-full bg-primary/10 text-primary hover:bg-primary/20 shrink-0">
          <Link href={uploadUrl} title="Upload">
            <Upload size={18} />
          </Link>
        </Button>


        {/* Dark mode toggle */}
        <Button variant="ghost" size="icon" onClick={toggleTheme} className="rounded-full">
          {isDark ? <Sun size={16} /> : <Moon size={16} />}
        </Button>

        {/* Notifications */}
        <Button asChild variant="ghost" size="icon" className="relative rounded-full">
          <Link href="/dashboard/notifications">
            <Bell size={16} />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-primary rounded-full"></span>
          </Link>
        </Button>

        {/* User menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex items-center gap-2 rounded-full focus:outline-none focus:ring-2 focus:ring-ring">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.image ?? undefined} />
                <AvatarFallback>{initials}</AvatarFallback>
              </Avatar>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <DropdownMenuLabel>
              <p className="font-medium text-sm">{user.name}</p>
              <p className="text-xs text-muted-foreground">{user.email}</p>
              {user.role && (
                <span className="inline-block mt-1 text-xs bg-primary/10 text-primary rounded px-1.5 py-0.5">
                  {user.role}
                </span>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings/profile" className="cursor-pointer">
                <User size={14} className="mr-2" /> Profile
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem asChild>
              <Link href="/dashboard/settings" className="cursor-pointer">
                <Settings size={14} className="mr-2" /> Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive cursor-pointer"
              onClick={() => signOut({ callbackUrl: "/login" })}
            >
              <LogOut size={14} className="mr-2" /> Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  )
}
