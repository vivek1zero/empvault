import { NextResponse } from 'next/server'
import prisma from '@/lib/prisma'

export async function GET() {
  try {
    const user = await prisma.user.findFirst()
    return NextResponse.json({ success: true, message: 'Database connection successful!', user: user?.email })
  } catch (error: any) {
    return NextResponse.json({ success: false, error: String(error), stack: error.stack })
  }
}
