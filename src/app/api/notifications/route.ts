import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth/auth"
import { prisma } from "@/lib/db/prisma"
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const notifications = await prisma.notification.findMany({ where: { userId: session.user.id }, orderBy: { createdAt: "desc" }, take: 20 })
    return NextResponse.json(notifications)
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }) }
}
export async function PATCH(req: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    const { ids } = await req.json()
    await prisma.notification.updateMany({ where: { userId: session.user.id, id: { in: ids } }, data: { isRead: true, readAt: new Date() } })
    return NextResponse.json({ ok: true })
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }) }
}
