import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import prisma from "@/lib/prisma"
import { FolderOpen, ChevronRight, Files } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import Link from "next/link"

export default async function CategoriesPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const categories = await prisma.category.findMany({
    where: { isActive: true, parentId: null },
    include: {
      children: { where: { isActive: true }, include: { _count: { select: { files: true } } } },
      _count: { select: { files: true } },
    },
    orderBy: { name: "asc" },
  })

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Categories</h1>
        <p className="text-muted-foreground text-sm">{categories.length} top-level categories</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categories.map((cat) => (
          <Card key={cat.id} className="hover:shadow-md transition-all group">
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center">
                  <FolderOpen size={20} className="text-primary" />
                </div>
                <Badge variant="secondary" className="text-[10px]">
                  <Files size={10} className="mr-1" />
                  {cat._count.files} files
                </Badge>
              </div>
              <h3 className="font-semibold">{cat.name}</h3>
              {cat.description && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{cat.description}</p>
              )}
              {/* Sub-categories */}
              {cat.children.length > 0 && (
                <div className="mt-3 pt-3 border-t border-border space-y-1.5">
                  {cat.children.map((child) => (
                    <div key={child.id} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-1.5 text-muted-foreground">
                        <ChevronRight size={12} />
                        <span>{child.name}</span>
                      </div>
                      <span className="text-muted-foreground">{child._count.files} files</span>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
