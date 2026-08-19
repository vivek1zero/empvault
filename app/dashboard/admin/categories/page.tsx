import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { FolderOpen, Settings2, Trash2 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

export default async function AdminCategoriesPage() {
  const session = await auth()
  if (!session?.user || session.user.role !== "ADMIN") redirect("/dashboard")

  const categories = await prisma.category.findMany({
    include: {
      createdBy: { select: { name: true } },
      _count: { select: { files: true, children: true } },
    },
    orderBy: { createdAt: "desc" },
  })

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FolderOpen size={22} className="text-primary" /> Manage Categories
          </h1>
          <p className="text-muted-foreground text-sm">Create and organize system file categories</p>
        </div>
        <button className="bg-primary hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          + New Category
        </button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Name</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Slug</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Files</th>
                <th className="text-right px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {categories.map((cat) => (
                <tr key={cat.id} className="hover:bg-accent/40 transition-colors">
                  <td className="px-6 py-4">
                    <p className="font-medium text-sm">{cat.name}</p>
                    {cat.description && <p className="text-xs text-muted-foreground mt-0.5 max-w-xs truncate">{cat.description}</p>}
                  </td>
                  <td className="px-6 py-4">
                    <code className="px-1.5 py-0.5 rounded bg-muted text-xs text-muted-foreground">{cat.slug}</code>
                  </td>
                  <td className="px-6 py-4">
                    <Badge variant={cat.isActive ? "success" : "secondary"}>
                      {cat.isActive ? "Active" : "Inactive"}
                    </Badge>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs font-medium">{cat._count.files}</span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button className="p-1.5 rounded-md hover:bg-muted text-muted-foreground hover:text-primary transition-colors">
                        <Settings2 size={16} />
                      </button>
                      <button className="p-1.5 rounded-md hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {categories.length === 0 && (
                <tr>
                  <td colSpan={5} className="text-center py-10 text-muted-foreground text-sm">
                    No categories found. Create one to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  )
}
