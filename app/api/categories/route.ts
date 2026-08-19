import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import prisma from "@/lib/prisma"

// GET all categories for current user + system ones
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = session.user.id
    const role = (session.user as any).role

    // Admins/Managers see all categories; employees see their own + active system ones
    const categories = await prisma.category.findMany({
      where: role === "ADMIN" || role === "MANAGER"
        ? {}
        : { OR: [{ createdById: userId }, { isActive: true }] },
      include: {
        createdBy: { select: { name: true } },
        _count: { select: { files: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json(categories)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// POST create a new category/folder
export async function POST(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = session.user.id
    const body = await req.json()
    const { name, description } = body

    if (!name || typeof name !== "string" || name.trim().length === 0) {
      return NextResponse.json({ error: "Folder name is required" }, { status: 400 })
    }

    const slug = name.trim().toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "")

    // Check for duplicate slug
    const existing = await prisma.category.findFirst({ where: { slug } })
    if (existing) {
      return NextResponse.json({ error: "A folder with that name already exists" }, { status: 409 })
    }

    const category = await prisma.category.create({
      data: {
        name: name.trim(),
        description: description?.trim() || null,
        slug,
        createdById: userId,
        isActive: true,
        allowedRoles: JSON.stringify([]),
      },
    })

    return NextResponse.json(category, { status: 201 })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

// DELETE a category
export async function DELETE(req: Request) {
  try {
    const session = await auth()
    if (!session?.user?.id) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const userId = session.user.id
    const role = (session.user as any).role
    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 })

    const category = await prisma.category.findUnique({ where: { id } })
    if (!category) return NextResponse.json({ error: "Not found" }, { status: 404 })

    // Only creator or admin can delete
    if (category.createdById !== userId && role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 })
    }

    await prisma.category.delete({ where: { id } })
    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
