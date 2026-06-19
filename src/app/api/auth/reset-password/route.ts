import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"
import bcrypt from "bcryptjs"
const schema = z.object({ token: z.string().min(1), password: z.string().min(8) })
export async function POST(req: NextRequest) {
  try {
    const { token, password } = schema.parse(await req.json())
    const notification = await prisma.notification.findFirst({ where: { type: "password_reset", body: token, isRead: false, expiresAt: { gt: new Date() } } })
    if (!notification) return NextResponse.json({ error: "Invalid or expired token." }, { status: 400 })
    const passwordHash = await bcrypt.hash(password, 12)
    await prisma.user.update({ where: { id: notification.userId }, data: { passwordHash } })
    await prisma.notification.update({ where: { id: notification.id }, data: { isRead: true } })
    return NextResponse.json({ ok: true })
  } catch { return NextResponse.json({ error: "Failed" }, { status: 500 }) }
}
