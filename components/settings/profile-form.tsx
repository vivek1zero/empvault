"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

export function ProfileForm() {
  const [isLoading, setIsLoading] = useState(false)

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setIsLoading(true)

    // Simulate API call
    setTimeout(() => {
      setIsLoading(false)
      toast.success("Profile updated", {
        description: "Your profile has been updated successfully.",
      })
    }, 1000)
  }

  return (
    <form onSubmit={onSubmit} className="space-y-8">
      <div className="flex items-center gap-x-6">
        <Avatar className="h-24 w-24">
          <AvatarImage src="" />
          <AvatarFallback>U</AvatarFallback>
        </Avatar>
        <div className="space-y-1">
          <Label htmlFor="avatarUrl">Avatar URL</Label>
          <Input id="avatarUrl" placeholder="https://github.com/shadcn.png" className="w-[300px]" />
          <p className="text-sm text-muted-foreground">
            Provide a URL to an image for your avatar.
          </p>
        </div>
      </div>

      <div className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="name">Full Name</Label>
          <Input id="name" placeholder="John Doe" />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="department">Department</Label>
          <Input id="department" placeholder="Engineering" />
        </div>
      </div>

      <Button type="submit" disabled={isLoading}>
        {isLoading ? "Saving..." : "Save changes"}
      </Button>
    </form>
  )
}
