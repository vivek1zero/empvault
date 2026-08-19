"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Progress } from "@/components/ui/progress"
import { toast } from "sonner"

export function AccountForm() {
  const [isLoading, setIsLoading] = useState(false)

  // Example data that would normally come from the user session/database
  const user = {
    email: "user@example.com",
    role: "EMPLOYEE",
    storageUsed: 1073741824, // 1GB
    storageQuota: 5368709120, // 5GB
  }
  
  const storagePercentage = (user.storageUsed / user.storageQuota) * 100

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      toast.success("Account updated", {
        description: "Your account settings have been updated.",
      })
    }, 1000)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" defaultValue={user.email} disabled />
          <p className="text-[0.8rem] text-muted-foreground">
            Your email address is managed by your administrator.
          </p>
        </div>
        
        <div className="grid gap-2">
          <Label htmlFor="role">Role</Label>
          <Input id="role" defaultValue={user.role} disabled />
        </div>
        
        <div className="space-y-3 pt-4">
          <h4 className="text-sm font-medium">Storage Usage</h4>
          <Progress value={storagePercentage} className="h-2" />
          <p className="text-sm text-muted-foreground">
            You have used {(user.storageUsed / (1024*1024*1024)).toFixed(2)} GB of your {(user.storageQuota / (1024*1024*1024)).toFixed(2)} GB quota.
          </p>
        </div>
      </div>
    </form>
  )
}
