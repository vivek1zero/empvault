"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { Search, Grid, List, FolderOpen, X, CalendarIcon } from "lucide-react"
import { useState, useEffect } from "react"
import { Input } from "@/components/ui/input"

export default function FileFilters() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const currentQ = searchParams.get("q") || ""
  const currentType = searchParams.get("type") || "All"
  const currentView = searchParams.get("view") || "grid"
  const currentCategory = searchParams.get("category") || ""
  const currentYear = searchParams.get("year") || ""
  const currentMonth = searchParams.get("month") || ""
  const currentDay = searchParams.get("day") || ""
  const [search, setSearch] = useState(currentQ)

  const currentYearNum = new Date().getFullYear()
  const years = Array.from({ length: 10 }, (_, i) => currentYearNum - 5 + i)
  const months = [
    { value: "01", label: "Jan" }, { value: "02", label: "Feb" }, { value: "03", label: "Mar" },
    { value: "04", label: "Apr" }, { value: "05", label: "May" }, { value: "06", label: "Jun" },
    { value: "07", label: "Jul" }, { value: "08", label: "Aug" }, { value: "09", label: "Sep" },
    { value: "10", label: "Oct" }, { value: "11", label: "Nov" }, { value: "12", label: "Dec" }
  ]
  const days = Array.from({ length: 31 }, (_, i) => (i + 1).toString().padStart(2, '0'))


  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value && value !== "All") {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`?${params.toString()}`)
  }

  return (
    <div className="space-y-3">
      {/* Active folder filter */}
      {currentCategory && (
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 text-primary border border-primary/20 rounded-full text-xs font-medium">
            <FolderOpen size={12} />
            Filtering by folder
            <button
              onClick={() => updateParams("category", "")}
              className="ml-1 hover:text-destructive transition-colors"
              title="Clear folder filter"
            >
              <X size={11} />
            </button>
          </div>
        </div>
      )}
      <div className="flex items-center gap-3 flex-wrap flex-1">
        <div className="flex items-center gap-1 bg-muted/30 border border-transparent rounded-full p-0.5">
          {["All", "Images", "Videos", "Documents"].map((filter) => (
            <button
              key={filter}
              onClick={() => updateParams("type", filter)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                currentType === filter
                  ? "bg-primary/10 text-primary border-primary/20 shadow-sm"
                  : "bg-transparent border-transparent text-muted-foreground hover:bg-muted"
              }`}
            >
              {filter}
            </button>
          ))}
        </div>
      </div>
      
      <div className="flex items-center justify-start gap-3">
        <div className="flex items-center gap-1 bg-card border border-border rounded-lg p-1">
          <button 
            onClick={() => updateParams("view", "grid")}
            className={`p-1.5 rounded-md transition-colors ${currentView === "grid" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            title="Grid View"
          >
            <Grid size={16} />
          </button>
          <button 
            onClick={() => updateParams("view", "list")}
            className={`p-1.5 rounded-md transition-colors ${currentView === "list" ? "bg-muted text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            title="List View"
          >
            <List size={16} />
          </button>
        </div>

        <div className="flex items-center gap-2 pr-1 bg-card border border-border rounded-lg p-1">
          <select
            value={currentYear}
            onChange={(e) => {
              const val = e.target.value;
              const params = new URLSearchParams(searchParams.toString())
              if (val) {
                params.set("year", val)
              } else {
                params.delete("year")
                params.delete("month")
                params.delete("day")
              }
              router.push(`?${params.toString()}`)
            }}
            className="h-7 text-xs rounded-md border-0 bg-transparent text-foreground focus:outline-none focus:ring-0 cursor-pointer"
          >
            <option value="" className="bg-card text-foreground">Year</option>
            {years.map(y => <option key={y} value={y} className="bg-card text-foreground">{y}</option>)}
          </select>

          {currentYear && (
            <select
              value={currentMonth}
              onChange={(e) => {
                const val = e.target.value;
                const params = new URLSearchParams(searchParams.toString())
                if (val) {
                  params.set("month", val)
                } else {
                  params.delete("month")
                  params.delete("day")
                }
                router.push(`?${params.toString()}`)
              }}
              className="h-7 text-xs rounded-md border-0 bg-transparent text-foreground focus:outline-none focus:ring-0 cursor-pointer"
            >
              <option value="" className="bg-card text-foreground">Month</option>
              {months.map(m => <option key={m.value} value={m.value} className="bg-card text-foreground">{m.label}</option>)}
            </select>
          )}

          {currentYear && currentMonth && (
            <select
              value={currentDay}
              onChange={(e) => updateParams("day", e.target.value)}
              className="h-7 text-xs rounded-md border-0 bg-transparent text-foreground focus:outline-none focus:ring-0 cursor-pointer"
            >
              <option value="" className="bg-card text-foreground">Day</option>
              {days.map(d => <option key={d} value={d} className="bg-card text-foreground">{d}</option>)}
            </select>
          )}

          {(currentYear || currentMonth || currentDay) && (
            <button 
              onClick={() => {
                const params = new URLSearchParams(searchParams.toString())
                params.delete("year")
                params.delete("month")
                params.delete("day")
                router.push(`?${params.toString()}`)
              }}
              className="text-muted-foreground hover:text-destructive p-1 rounded-md transition-colors ml-1"
              title="Clear date filters"
            >
              <X size={14} />
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
