"use client"

import React, { createContext, useContext, useState, ReactNode } from "react"

interface BulkActionContextType {
  selectedFiles: Set<string>
  toggleFile: (fileId: string) => void
  toggleAll: (fileIds: string[], selectAll: boolean) => void
  clearSelection: () => void
}

const BulkActionContext = createContext<BulkActionContextType | undefined>(undefined)

export function BulkActionProvider({ children }: { children: ReactNode }) {
  const [selectedFiles, setSelectedFiles] = useState<Set<string>>(new Set())

  const toggleFile = (fileId: string) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev)
      if (newSet.has(fileId)) {
        newSet.delete(fileId)
      } else {
        newSet.add(fileId)
      }
      return newSet
    })
  }

  const toggleAll = (fileIds: string[], selectAll: boolean) => {
    setSelectedFiles(prev => {
      const newSet = new Set(prev)
      if (selectAll) {
        fileIds.forEach(id => newSet.add(id))
      } else {
        fileIds.forEach(id => newSet.delete(id))
      }
      return newSet
    })
  }

  const clearSelection = () => {
    setSelectedFiles(new Set())
  }

  return (
    <BulkActionContext.Provider value={{ selectedFiles, toggleFile, toggleAll, clearSelection }}>
      {children}
    </BulkActionContext.Provider>
  )
}

export function useBulkAction() {
  const context = useContext(BulkActionContext)
  if (context === undefined) {
    throw new Error("useBulkAction must be used within a BulkActionProvider")
  }
  return context
}
