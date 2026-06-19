import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/db/prisma"
import { z } from "zod"
import crypto from "crypto"
export async function POST(req: NextRequest) {
  try {
    const { email } = z.object({ email: z.string().email() }).parse(await req.json())
    const user = await prisma.user.findUnique({ where: { email, isActive: true } })
    if (user) {
      const token = crypto.randomBytes(32).toString("hex")
      await prisma.notification.create({ data: { userId: user.id, type: "password_reset", title: "Password Reset", body: token, expiresAt: new Date(Date.now() + 3600000) } })
      console.log("[forgot-password]", `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${token}`)
    }
    return NextResponse.json({ ok: true })
  } catch { return NextResponse.json({ ok: true }) }
}
